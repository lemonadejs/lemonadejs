/**
 * <Dropdown /> — select, autocomplete and picker in one block, built ON
 * the Modal primitive (the panel) with the datagrid's fixed-rowheight
 * virtualization (large option lists stay a window of DOM).
 *
 * v5 parity, the full nuance set:
 *   - items { value, text, group, image, keywords, synonym, disabled };
 *     strings/numbers normalize to {value,text}; {id,name} too
 *   - groups: sorted together, header rows injected
 *   - single or multiple (Done/Reset controls); value as array or
 *     'a;b' string via divisor; allowempty=false pins a selection
 *   - autocomplete: the closed label swaps to a contenteditable search
 *     field while open; filters text/group/keywords/synonym; selected
 *     items always remain listed; FORCED on by insert/remote/searchbar
 *   - remote: url?q= fetch with 300ms debounce, onbeforesearch veto,
 *     results merge behind the selected items; initial url load
 *   - insert: + button adds the typed text (async onbeforeinsert can
 *     replace or cancel; oninsert after)
 *   - keyboard: closed Enter/arrows open; open: arrows wrap, Home/End,
 *     Enter selects, Space selects (no autocomplete), Escape CANCELS
 *     (restores the previous value) — closing any other way COMMITS
 *   - types: default (anchored panel) | picker | searchbar (sheet
 *     modes) | inline (no modal, list always visible) | auto (by
 *     viewport width at open)
 */

import { component, html, isDisposing } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

export interface DropdownItem {
    value?: string | number;
    text?: string;
    group?: string;
    image?: string;
    keywords?: string | string[];
    synonym?: string | string[];
    disabled?: boolean;
    [key: string]: unknown;
}

type RowEntry = { kind: 'item'; item: DropdownItem } | { kind: 'header'; text: string };

const OVERSCAN = 4;
const SEARCH_DEBOUNCE = 300;

/** v5 normalizeData: strings/numbers and {id,name} become items */
const normalize = (list: unknown[]): DropdownItem[] =>
    (list || []).map((v) => {
        if (typeof v === 'string' || typeof v === 'number') {
            return { value: v, text: String(v) };
        }
        const o = v as DropdownItem;
        if (o && typeof o === 'object' && 'name' in o && !('text' in o)) {
            return { value: o.id as string, text: String(o.name) };
        }
        return o;
    });

const isEmpty = (v: unknown) => v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);

/** v5 compareValues: loose equality, empty-string strict */
const sameValue = (a: unknown, b: unknown): boolean => {
    if (a === '' || b === '') {
        return a === b;
    }
    // eslint-disable-next-line eqeqeq
    return a == b;
};

const matches = (prop: unknown, q: string): boolean => {
    if (prop === null || prop === undefined) {
        return false;
    }
    if (Array.isArray(prop)) {
        return prop.some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
    }
    return String(prop).toLowerCase().includes(q);
};

export const Dropdown = component('dropdown', {
    bind: String,                 // value: single, array (multiple) or 'a;b' string
    data: Array,                  // DropdownItem[] (or strings/numbers/{id,name})
    multiple: false,
    autocomplete: false,
    remote: false,                // search against url?q= instead of locally
    url: '',
    insert: false,                // + button adds the typed text
    type: '',                     // '' | default | picker | searchbar | inline | auto
    placeholder: '',
    width: 0,
    height: 300,                  // panel viewport height
    rowheight: 28,
    divisor: ';',                 // string-value separator (multiple)
    allowempty: true,             // false: the last selection cannot be removed
    disabled: false,
    onchange: Function,           // (value)
    onopen: Function,
    onclose: Function,            // (origin)
    onsearch: Function,           // (results) after a remote search
    onbeforesearch: Function,     // (query, http) -> false cancels
    oninsert: Function,           // (item)
    onbeforeinsert: Function,     // async (item) -> item | false
    onload: Function,             // data ready (incl. initial url load)
    api: {
        open: Function, close: Function, toggle: Function, isClosed: Function,
        getValue: Function, setValue: Function, getText: Function,
        getData: Function, setData: Function, add: Function, reset: Function,
    },
}, (props, { bind, state, onMount, onUnmount }) => {
    const picked = bind(props, '');

    const opened = state(false);
    const resolvedType = state('');   // auto resolves at open
    const panelPosition = state('absolute'); // Modal position per type
    const label = state('');          // v5: updates on close, not live
    const query = state('');
    const rows = state<RowEntry[]>([]);
    const cursor = state<number | null>(null);
    const first = state(0);           // virtualization window start
    const anchorTop = state(0);
    const anchorLeft = state(0);
    const panelWidth = state(0);
    const loading = state(false);

    let items: DropdownItem[] = [];   // processed full set
    let chosen: DropdownItem[] = [];  // current selection (uncommitted while open)
    let changed = false;              // v5 changesDetected
    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    let root: HTMLElement | null = null;
    let scroller: HTMLElement | null = null;
    let modalApi: { open(): void; close(): void } | null = null;

    onUnmount(() => {
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
    });

    // ---- effective flags (v5: insert/remote/searchbar force autocomplete)
    const kind = () => resolvedType.value || (props.type.value as string) || 'default';
    const autocomplete = () =>
        !!props.autocomplete.value || !!props.insert.value || !!props.remote.value || kind() === 'searchbar';
    const inline = () => kind() === 'inline';

    // ---- data pipeline: normalize -> group-sort -> flatten with headers
    const flatten = (list: DropdownItem[]): RowEntry[] => {
        const out: RowEntry[] = [];
        let group = '';
        for (const item of list) {
            if (item.group && item.group !== group) {
                out.push({ kind: 'header', text: item.group });
                group = item.group;
            }
            out.push({ kind: 'item', item });
        }
        return out;
    };

    const process = () => {
        items = normalize((props.data.peek() as unknown[]) || []);
        items.sort((a, b) => (a.group && b.group ? a.group.localeCompare(b.group) : 0));
        rows.value = flatten(items);
    };

    // ---- value plumbing (v5 setValue/getValue/getText)
    const parseValue = (v: unknown): unknown[] => {
        if (Array.isArray(v)) {
            return v;
        }
        if (typeof v === 'string' && v !== '') {
            return v.split((props.divisor.value as string) || ';');
        }
        return isEmpty(v) ? [] : [v];
    };

    const applyValue = (v: unknown) => {
        const wanted = parseValue(v);
        chosen = items.filter((item) => wanted.some((w) => sameValue(w, item.value)));
    };

    const currentValue = (): unknown => {
        if (props.multiple.value) {
            return chosen.length ? chosen.map((i) => i.value) : null;
        }
        return chosen.length ? chosen[0].value : null;
    };

    const currentText = (): unknown => {
        if (props.multiple.value) {
            return chosen.length ? chosen.map((i) => i.text) : null;
        }
        return chosen.length ? chosen[0].text : null;
    };

    const updateLabel = () => {
        label.value = chosen.map((i) => i.text).join('; ');
    };

    // External value writes land silently (v6: assignment is silent)
    onMount(() =>
        picked.subscribe(() => {
            applyValue(picked.value);
            if (!opened.value) {
                updateLabel();
            }
            rows.touch(); // selected flags re-render
        })
    );

    // Data changes re-process and re-validate the value (v5 watcher)
    onMount(() =>
        props.data.subscribe(() => {
            process();
            const wanted = parseValue(picked.peek());
            const valid = wanted.filter((w) => items.some((item) => sameValue(w, item.value)));
            if (wanted.length && !valid.length) {
                picked.value = null as never; // silent reset (v5 set null)
            }
            applyValue(picked.peek());
            updateLabel();
        })
    );

    // ---- virtualization (datagrid pattern, fixed rowheight)
    const rowHeight = () => (props.rowheight.value as number) || 28;
    const viewportHeight = () => Math.min((props.height.value as number) || 300, rows.value.length * rowHeight());
    const visibleCount = () => Math.ceil(((props.height.value as number) || 300) / rowHeight()) + OVERSCAN * 2;

    const onScroll = () => {
        if (!scroller) {
            return;
        }
        const start = Math.floor(scroller.scrollTop / rowHeight()) - OVERSCAN;
        first.value = Math.min(Math.max(0, start), Math.max(0, rows.value.length - visibleCount()));
    };

    const ensureVisible = (index: number) => {
        if (!scroller) {
            return;
        }
        const top = index * rowHeight();
        if (top < scroller.scrollTop) {
            scroller.scrollTop = top;
        } else if (top + rowHeight() > scroller.scrollTop + viewportHeight()) {
            scroller.scrollTop = top + rowHeight() - viewportHeight();
        }
        onScroll();
    };

    // ---- search (v5: local filter or remote with debounce + veto)
    const localSearch = (q: string) => {
        const lower = q.toLowerCase();
        const filtered = !lower
            ? items
            : items.filter(
                  (item) =>
                      chosen.indexOf(item) >= 0 ||
                      matches(item.text, lower) ||
                      matches(item.group, lower) ||
                      matches(item.keywords, lower) ||
                      matches(item.synonym, lower)
              );
        cursor.value = null;
        rows.value = flatten(filtered);
        first.value = 0;
        if (scroller) {
            scroller.scrollTop = 0;
        }
    };

    const remoteSearch = (q: string) => {
        const http = { headers: { 'Content-Type': 'text/json' } };
        const veto = props.onbeforesearch as ((q: string, http: unknown) => unknown) | undefined;
        if (veto && veto(q, http) === false) {
            return;
        }
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        loading.value = true;
        searchTimer = setTimeout(() => {
            const url = (props.url.value as string) + ((props.url.value as string).includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(q);
            fetch(url, http)
                .then((r) => r.json())
                .then((result) => resetRows(normalize(result)))
                .catch(() => resetRows([]));
        }, SEARCH_DEBOUNCE);
    };

    /** Remote results land BEHIND the already-selected items (v5) */
    const resetRows = (result: DropdownItem[]) => {
        loading.value = false;
        cursor.value = null;
        rows.value = flatten([...chosen, ...result.filter((r) => !chosen.some((c) => sameValue(c.value, r.value)))]);
        first.value = 0;
        props.onsearch?.(result);
    };

    const search = (q: string) => {
        if (!opened.value && !inline()) {
            return;
        }
        query.value = q; // raw text — addTyped inserts what the user typed
        if (props.remote.value && props.url.value) {
            remoteSearch(q.toLowerCase());
        } else {
            localSearch(q);
        }
    };

    // ---- selection (v5 selectItem/select)
    const selectItem = (item: DropdownItem) => {
        if (props.remote.value && items.indexOf(item) < 0) {
            items.push(item);
        }
        if (props.multiple.value) {
            const at = chosen.indexOf(item);
            if (at >= 0) {
                chosen.splice(at, 1);
            } else {
                chosen.push(item);
            }
        } else if (chosen[0] === item) {
            if (props.allowempty.value !== false) {
                chosen = [];
            }
        } else {
            chosen = [item];
        }
        changed = true;
        rows.touch();
    };

    const select = (item: DropdownItem | undefined) => {
        if (!item || item.disabled === true) {
            return;
        }
        selectItem(item);
        if (inline()) {
            commit('select');
            return;
        }
        if (!props.multiple.value) {
            close('select');
        }
    };

    // ---- open / close / commit (v5 onopen/onclose semantics)
    const indexOfItem = (item: DropdownItem) =>
        rows.value.findIndex((entry) => entry.kind === 'item' && entry.item === item);

    const open = () => {
        if (opened.value || props.disabled.value || inline()) {
            return;
        }
        if ((props.type.value as string) === 'auto') {
            resolvedType.value = window.innerWidth > 640 ? 'default' : autocomplete() ? 'searchbar' : 'picker';
        }
        panelPosition.value = kind() === 'default' ? 'absolute' : 'bottom';
        changed = false;
        query.value = '';
        cursor.value = null;
        localSearch('');
        // Anchor the panel under the input; width from the longest text (v5)
        const input = root?.querySelector('.lm-dropdown-header') as HTMLElement | null;
        if (input && kind() === 'default') {
            const rect = input.getBoundingClientRect();
            anchorTop.value = rect.bottom + 1;
            anchorLeft.value = rect.left;
            let width = Math.max((props.width.value as number) || 0, rect.width);
            for (const item of items) {
                width = Math.max(width, (item.text || '').length * 7.5);
            }
            panelWidth.value = width;
        }
        opened.value = true;
        modalApi?.open();
        // Cursor on the last selected item, scrolled into view (v5).
        // Refs fire on attached elements, so the scroller exists NOW
        const last = chosen[chosen.length - 1];
        if (last) {
            const at = indexOfItem(last);
            if (at >= 0) {
                cursor.value = at;
                ensureVisible(at);
            }
        }
        props.onopen?.();
    };

    const commit = (origin: string) => {
        const next = currentValue();
        const previous = picked.peek();
        if (changed && !sameList(next, previous)) {
            picked.set(next as never); // fires onchange (v6 .set semantics)
        }
        changed = false;
        updateLabel();
        props.onclose?.(origin);
    };

    const sameList = (a: unknown, b: unknown): boolean => {
        const pa = parseValue(a);
        const pb = parseValue(b);
        return pa.length === pb.length && pa.every((v, i) => sameValue(v, pb[i]));
    };

    const close = (origin: string) => {
        if (!opened.value) {
            return;
        }
        opened.value = false;
        modalApi?.close();
        cursor.value = null;
        if (origin === 'escape') {
            // Cancel: restore the committed value (v5)
            applyValue(picked.peek());
            updateLabel();
            props.onclose?.(origin);
        } else {
            commit(origin);
        }
    };

    const toggle = () => (opened.value ? close('button') : open());

    // ---- insert (v5 add flow, async veto)
    const addItem = async (item: DropdownItem) => {
        const before = props.onbeforeinsert as ((item: DropdownItem) => unknown) | undefined;
        if (before) {
            loading.value = true;
            const result = await before(item);
            loading.value = false;
            if (result === false) {
                return;
            }
            if (result && typeof result === 'object') {
                item = result as DropdownItem;
            }
        }
        items.push(item);
        (props.data.peek() as DropdownItem[]).push(item);
        rows.value = [{ kind: 'item', item }, ...rows.value];
        first.value = 0;
        props.oninsert?.(item);
    };

    const addTyped = () => {
        const text = query.value.trim();
        if (text) {
            void addItem({ text, value: text });
        }
    };

    // ---- keyboard (v5 events.keydown)
    const itemAt = (index: number | null): DropdownItem | undefined => {
        const entry = index === null ? undefined : rows.value[index];
        return entry && entry.kind === 'item' ? entry.item : undefined;
    };

    const moveCursor = (direction: 1 | -1, jump = false) => {
        const list = rows.value;
        if (!list.length) {
            return;
        }
        let at = jump
            ? direction < 0
                ? 0
                : list.length - 1
            : cursor.value === null
              ? direction < 0
                ? list.length - 1
                : 0
              : cursor.value + direction;
        // Skip header rows, wrapping (v5 wrapped at the boundaries)
        for (let guard = 0; guard < list.length + 1; guard++) {
            if (at < 0) {
                at = list.length - 1;
            }
            if (at >= list.length) {
                at = 0;
            }
            if (list[at].kind === 'item') {
                break;
            }
            at += jump ? (direction < 0 ? 1 : -1) : direction;
        }
        cursor.value = at;
        ensureVisible(at);
    };

    const onKey = (e: KeyboardEvent) => {
        if (props.disabled.value) {
            return;
        }
        if (!opened.value && !inline()) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                open();
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            return;
        }
        let prevent = true;
        if (e.key === 'ArrowUp') {
            moveCursor(-1);
        } else if (e.key === 'ArrowDown') {
            moveCursor(1);
        } else if (e.key === 'Home') {
            moveCursor(-1, true);
            prevent = !autocomplete();
        } else if (e.key === 'End') {
            moveCursor(1, true);
            prevent = !autocomplete();
        } else if (e.key === 'Enter') {
            select(itemAt(cursor.value));
        } else if (e.key === 'Escape') {
            close('escape');
        } else if (e.key === ' ' && !autocomplete()) {
            select(itemAt(cursor.value));
        } else {
            prevent = false;
        }
        if (prevent) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };

    // v5 mousedown: autocomplete keeps typing focus — only the arrow
    // zone (right 20px) toggles; otherwise open. Plain selects toggle.
    const onPress = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.lm-dropdown-input')) {
            return;
        }
        if (autocomplete()) {
            const field = target.closest('.lm-dropdown-input') as HTMLElement;
            const rect = field.getBoundingClientRect();
            if (rect.right - e.clientX < 20) {
                toggle();
            } else {
                open();
            }
        } else {
            toggle();
        }
    };

    const onFocusOut = (e: FocusEvent) => {
        // The renderer disposing a focused node (the label→search swap)
        // is not the user leaving — the engine guard replaces the old
        // hand-rolled mute window
        if (isDisposing() || !opened.value || !root) {
            return;
        }
        // Focus landing inside the dropdown (search field, panel) stays
        if (e.relatedTarget && root.contains(e.relatedTarget as Node)) {
            return;
        }
        close('focusout');
    };

    const onPaste = (e: ClipboardEvent) => {
        // Plain text only into the contenteditable search (v5)
        const text = (e.clipboardData?.getData('text/plain') || '').replace(/(\r\n|\n|\r)/gm, '');
        e.preventDefault();
        const el = e.target as HTMLElement;
        el.textContent = (el.textContent || '') + text;
        search(el.textContent || '');
    };

    // ---- api
    props.ref?.({
        open,
        close: (origin?: string) => close(origin || 'button'),
        toggle,
        isClosed: () => !opened.value,
        getValue: () => {
            const v = picked.peek();
            return isEmpty(v) ? null : v; // v5: empty reads as null
        },
        setValue: (v: unknown) => {
            picked.set(v as never);
        },
        getText: () => currentText(),
        getData: () => props.data.peek(),
        setData: (d: unknown[]) => {
            props.data.value = d;
        },
        add: (item: DropdownItem) => addItem(item),
        reset: () => {
            chosen = [];
            if (opened.value) {
                changed = true;
                close('reset'); // commits null + onclose
            } else {
                changed = false;
                picked.set(null as never);
                updateLabel();
            }
        },
    });

    // ---- initial data (v5: plain url loads once; remote starts empty)
    const ready = () => {
        process();
        applyValue(picked.peek());
        updateLabel();
        props.onload?.();
    };

    onMount(() => {
        if (props.url.value && !props.remote.value) {
            loading.value = true;
            fetch(props.url.value as string, { headers: { 'Content-Type': 'text/json' } })
                .then((r) => r.json())
                .then((result) => {
                    (props.data.peek() as unknown[]).push(...normalize(result as unknown[]));
                    loading.value = false;
                    ready();
                })
                .catch(() => {
                    loading.value = false;
                    ready();
                });
        } else {
            ready();
        }
    });

    // ---- rendering
    const rowView = (entry: RowEntry, index: number) => {
        if (entry.kind === 'header') {
            return html`<div class="lm-dropdown-group" style="height:${rowHeight()}px">${entry.text}</div>`;
        }
        const item = entry.item;
        return html`<div class="lm-dropdown-item"
            style="height:${rowHeight()}px"
            data-selected="${() => (chosen.indexOf(item) >= 0 ? 'true' : false)}"
            data-cursor="${() => (cursor.value === index ? 'true' : false)}"
            data-disabled="${item.disabled === true ? 'true' : false}"
            onmousedown="${(e: MouseEvent) => e.preventDefault()}"
            onclick="${() => select(item)}">
            ${item.image ? html`<img src="${item.image}" alt="" />` : ''}<span>${item.text || ''}</span>
        </div>`;
    };

    const listView = () => html`<div class="lm-dropdown-lazy"
        style="${() => 'height:' + viewportHeight() + 'px'}"
        ref="${(el: HTMLElement) => (scroller = el)}"
        onscroll="${onScroll}">
        <div class="lm-dropdown-canvas" style="${() => 'height:' + rows.value.length * rowHeight() + 'px'}">
            <div class="lm-dropdown-window"
                style="${() => 'transform:translateY(' + first.value * rowHeight() + 'px)'}">
                ${() => rows.value.slice(first.value, first.value + visibleCount()).map((entry, i) => rowView(entry, first.value + i))}
            </div>
        </div>
        ${() => (rows.value.length === 0 ? html`<div class="lm-dropdown-empty">No options</div>` : '')}
    </div>`;

    const searchField = () => html`<div class="lm-dropdown-input" contenteditable="true" tabindex="0"
        placeholder="${() => props.placeholder.value || false}"
        ref="${(el: HTMLElement) => el.focus()}"
        oninput="${(e: Event) => search((e.target as HTMLElement).textContent || '')}"
        onpaste="${onPaste}"></div>`;

    const labelField = () => html`<div class="lm-dropdown-input" tabindex="0"
        placeholder="${() => props.placeholder.value || false}">${label}</div>`;

    return html`<div class="lm-dropdown"
        data-state="${() => (opened.value ? 'true' : 'false')}"
        data-type="${() => kind()}"
        data-insert="${() => (props.insert.value ? 'true' : false)}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}"
        ref="${(el: HTMLElement) => (root = el)}"
        onkeydown="${onKey}"
        onmousedown="${onPress}"
        onfocusout="${onFocusOut}">
        <div class="lm-dropdown-header ${() => (loading.value ? 'lm-dropdown-loading' : '')}">
            ${() => (opened.value && autocomplete() && !inline() ? searchField() : labelField())}
            ${() =>
                props.insert.value && opened.value
                    ? html`<button class="lm-dropdown-add" tabindex="0"
                          onclick="${(e: Event) => {
                              e.preventDefault();
                              addTyped();
                          }}"></button>`
                    : ''}
            <div class="lm-dropdown-header-controls">
                <button class="lm-dropdown-done" onclick="${() => {
                    chosen = [];
                    changed = true;
                    close('reset');
                }}">Reset</button>
                <button class="lm-dropdown-done" onclick="${() => close('button')}">Done</button>
            </div>
        </div>
        <div class="lm-dropdown-content">
            ${() =>
                inline()
                    ? listView()
                    : html`<${Modal} ref="${(a: { open(): void; close(): void }) => (modalApi = a)}"
                          header="${false}" focus="${false}" responsive="${false}" autoadjust
                          position="${panelPosition}"
                          top="${anchorTop}" left="${anchorLeft}" width="${panelWidth}">
                          ${listView()}
                      </${Modal}>`}
        </div>
    </div>`;
});

export default Dropdown;
