/**
 * <Tabs /> — full behavioral parity with the v5 plugin.
 *
 * The v5 model, ported faithfully:
 *   - tabs come from a data array ({ title, content?, icon?, el?, selected? })
 *     AND/OR element children: each child element becomes a tab, with
 *     title / selected / data-icon extracted from its attributes
 *   - every tab owns ONE panel element created once and KEPT ALIVE across
 *     switches (visibility is a class + CSS, never an unmount) — exactly
 *     v5, where panels were real elements toggling a selected class
 *   - selected index, position (center | bottom), round borders,
 *     allowcreate ("add" button creating an Untitled tab)
 *
 * v6 additions (purely presentational — no behavior change):
 *   - variant: '' / 'basic' keeps the v5 boxed look; 'modern' is a
 *     borderless underline style with a sliding-in indicator
 *   - the header row scrolls horizontally when the tabs overflow (the
 *     scrollbar only appears when needed; tabs never shrink or wrap)
 *   - the active panel fades in on switch, CSS-only (no redraw loop)
 *   - drag-and-drop header sorting (reorders the data, selects the moved
 *     tab, fires onchangeposition) — simplified to reorder-on-drop, v5
 *     live-previewed during dragover by mutating DOM the engine now owns
 *   - keyboard: Enter selects, Arrow keys move focus (focus opens, v5's
 *     onfocusin behavior); Ctrl/Cmd+ArrowLeft/Right moves the focused tab
 *     (the keyboard alternative to drag sorting)
 *
 * v5 → v6 mapping: selected → bind (live two-way) with selected as the
 * initial index when unbound; allowCreate → allowcreate (contract props
 * are lowercase: they become HTML attributes); events drop the v5
 * `instance` argument: onchange(index, oldIndex), onopen(index),
 * onbeforecreate(item, position) (return false cancels),
 * oncreate(item, position), onchangeposition(fromIndex, toIndex).
 * api: open(index), create(item, position?, select?).
 */

import { component, html } from 'lemonadejs';

export interface TabItem {
    /** Tab header text */
    title?: string;
    /** Material icon keyword shown before the title */
    icon?: string;
    /** Trusted HTML for the panel (v5: set as innerHTML, once) */
    content?: string;
    /** An existing element used as the panel */
    el?: HTMLElement;
    /** Marks this tab as the initially selected one */
    selected?: boolean;
}

/** v5 meta extraction: attributes read off the panel element when missing */
const META = ['title', 'selected', 'data-icon'] as const;

/** Document-unique id base per instance — pairs tab headers and panels */
let uid = 0;

export const Tabs = component('tabs', {
    data: Array,                  // TabItem[] — programmatic tabs
    bind: Number,                 // two-way selected index (v5: selected)
    selected: 0,                  // initial index when unbound
    position: '',                 // center | bottom (v5 data-position)
    variant: '',                  // '' | basic | modern (underline) | segmented (inset pill)
    round: false,                 // round borders on the first/last header
    allowcreate: false,           // v5: allowCreate — shows the "add" button
    onchange: Function,           // (index, oldIndex) on user-initiated changes
    onopen: Function,             // (index) whenever a tab opens
    onbeforecreate: Function,     // (item, position) — return false to cancel
    oncreate: Function,           // (item, position) after a tab is created
    onchangeposition: Function,   // (fromIndex, toIndex) after drag sorting
    api: { open: Function, create: Function },
}, (props, { state, bind, onMount }) => {
    // Stable per-item ids (identity-keyed, so they survive reordering):
    // the header li is the tab, the kept-alive panel element the tabpanel
    const id = 'lm-tabs-' + ++uid;
    let seq = 0;
    const ids = new WeakMap<TabItem, number>();
    const tabId = (item: TabItem) => id + '-tab-' + ids.get(item);

    /**
     * v5 processing: every item gets a real panel element up front —
     * content becomes innerHTML once; existing elements contribute their
     * title/selected/data-icon attributes when the item lacks them.
     * Items are cloned so the caller's data is never mutated.
     */
    const prepare = (raw: TabItem): TabItem => {
        const item: TabItem = { ...raw };
        if (!item.el) {
            item.el = document.createElement('div');
            if (item.content) {
                item.el.innerHTML = item.content;
            }
        } else {
            for (const prop of META) {
                const short = prop.replace('data-', '') as 'title' | 'selected' | 'icon';
                if (!item[short]) {
                    const ret = item.el.getAttribute(prop);
                    if (ret !== null) {
                        if (short === 'selected') {
                            item.selected = !(ret === '' || ret === 'false');
                        } else {
                            item[short] = ret;
                        }
                    }
                }
            }
        }
        // tab ⇄ panel wiring (1.3.1/4.1.2): the panel is a labelled,
        // focusable tabpanel; the header li points at it via aria-controls
        ids.set(item, ++seq);
        item.el.setAttribute('role', 'tabpanel');
        if (!item.el.id) {
            item.el.id = id + '-panel-' + seq;
        }
        item.el.setAttribute('aria-labelledby', tabId(item));
        item.el.setAttribute('tabindex', '0');
        return item;
    };

    // v5: programmatic data first, then element children appended
    const initial: TabItem[] = [];
    for (const raw of (props.data.value as TabItem[]) || []) {
        initial.push(prepare(raw));
    }
    for (const node of props.children || []) {
        if (node.nodeType === 1) {
            initial.push(prepare({ el: node as HTMLElement }));
        }
    }

    const items = state<TabItem[]>(initial);

    // Initial selection: the last item flagged selected wins (v5), else
    // the selected prop; bind (a live state) wins over everything
    let start = (props.selected.value as number) || 0;
    initial.forEach((item, i) => {
        if (item.selected) {
            start = i;
        }
    });
    const selected = bind(props, start);

    /**
     * Panels stay in the DOM forever — selection is a class, exactly v5.
     * The panel elements are not templated, so toggling classes on them
     * imperatively is safe (no class binding will rewrite them).
     */
    const applySelection = () => {
        items.value.forEach((item, i) => {
            item.el!.classList.toggle('lm-tabs-selected', i === selected.value);
        });
    };
    applySelection();
    onMount(() => selected.subscribe(applySelection));
    onMount(() => items.subscribe(applySelection));

    const doSelect = (index: number) => {
        index = parseInt(String(index), 10);
        // v5 select(): never select a tab that does not exist, never
        // reselect the current one
        if (index >= 0 && index < items.value.length && index !== selected.value) {
            // v5 order: open fires, then change
            props.onopen?.(index);
            selected.set(index); // fires onchange(index, oldIndex)
        }
    };

    const create = (item: TabItem, position?: number | null, select?: boolean): false | void => {
        if (typeof item !== 'object' || item === null) {
            console.error('Item must be an object');
            return;
        }
        const ret = props.onbeforecreate?.(
            item,
            position
        );
        if (ret === false) {
            return false;
        }
        const prepared = prepare(item);
        const list = [...items.value];
        let at = position;
        if (at === undefined || at === null) {
            at = list.length;
        }
        list.splice(at, 0, prepared);
        items.value = list;
        if (select) {
            doSelect(list.indexOf(prepared));
        }
        props.oncreate?.(prepared, at);
    };

    props.ref?.({ open: doSelect, create });

    // ---- header interactions (all element-scoped: nothing to clean up)
    let ul: HTMLElement | null = null;

    const headerIndex = (target: EventTarget | null): number => {
        const li = (target as Element | null)?.closest?.('li');
        return li && ul ? Array.prototype.indexOf.call(ul.children, li) : -1;
    };

    /** v5: click or focus on a header opens it (focus follows arrows) */
    const onOpenEvent = (e: Event) => {
        if ((e.target as Element).tagName === 'LI') {
            doSelect(headerIndex(e.target));
        }
    };

    const onKeydown = (e: KeyboardEvent) => {
        const length = items.value.length;
        if (!length) {
            return;
        }
        // Ctrl/Cmd+Arrow moves the focused tab — the keyboard alternative
        // to drag sorting (WCAG 2.1.1); same contract as a drop: reorder,
        // select the moved tab, fire onchangeposition
        if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            const from = headerIndex(e.target);
            const to = e.key === 'ArrowLeft' ? from - 1 : from + 1;
            if (from >= 0 && to >= 0 && to < length) {
                e.preventDefault();
                const list = [...items.value];
                const [moved] = list.splice(from, 1);
                list.splice(to, 0, moved);
                items.value = list;
                doSelect(to);
                props.onchangeposition?.(from, to);
                (ul?.children[to] as HTMLElement | undefined)?.focus();
            }
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const index = headerIndex(e.target);
            if (index >= 0) {
                e.preventDefault(); // Space must not scroll the page
                doSelect(index);
            }
        } else {
            const current = typeof selected.value === 'number' ? selected.value : 0;
            let index: number | null = null;
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                index = Math.max(0, current - 1);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                index = Math.min(length - 1, current + 1);
            }
            if (index !== null) {
                e.preventDefault();
                (ul?.children[index] as HTMLElement | undefined)?.focus();
            }
        }
    };

    // ---- v5 drag sorting (reorder on drop; opacity imperatively like v5
    // because the class attribute is engine-owned). The drop model is an
    // insertion SLOT 0..n: the left half of a tab inserts BEFORE it, the
    // right half AFTER — which is what makes "last position" reachable
    // (right half of the final tab = slot n).
    let drag: { from: number; el: HTMLElement } | null = null;
    const dropAt = state<number | null>(null); // live insertion slot

    // Auto-scroll the strip while dragging near its edges — native DnD
    // never scrolls an overflow container, so tabs beyond the fold were
    // unreachable mid-drag. rAF loop; speed ramps toward the edge.
    let dragX = 0;
    let dragRaf = 0;
    const dragScroll = () => {
        dragRaf = requestAnimationFrame(dragScroll);
        if (!ul || ul.scrollWidth <= ul.clientWidth) {
            return;
        }
        const r = ul.getBoundingClientRect();
        const zone = 40;
        const d = dragX < r.left + zone
            ? -Math.ceil((r.left + zone - dragX) / 5)
            : dragX > r.right - zone
                ? Math.ceil((dragX - (r.right - zone)) / 5)
                : 0;
        if (d) {
            ul.scrollLeft += d;
        }
    };
    const stopDragScroll = () => {
        if (dragRaf) {
            cancelAnimationFrame(dragRaf);
            dragRaf = 0;
        }
    };

    const onDragstart = (e: DragEvent) => {
        const index = headerIndex(e.target);
        if (index >= 0) {
            const el = ul!.children[index] as HTMLElement;
            drag = { from: index, el };
            el.style.opacity = '0.25';
            if (e.dataTransfer) {
                // 'move', not the default-allowed 'copy' — without this the
                // browser badges the cursor with a nonsensical green +
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setDragImage?.(el, 0, 0);
            }
            dragX = e.clientX;
            dragScroll();
        }
    };

    /** cursor → insertion slot (0..n); over strip padding = the end */
    const slotOf = (e: DragEvent): number => {
        if (!ul) {
            return -1;
        }
        const li = (e.target as Element | null)?.closest?.('li');
        if (li && li.parentElement === ul) {
            const i = Array.prototype.indexOf.call(ul.children, li);
            const r = li.getBoundingClientRect();
            return e.clientX < r.left + r.width / 2 ? i : i + 1;
        }
        return ul.children.length;
    };

    const onDragover = (e: DragEvent) => {
        e.preventDefault();
        if (!drag) {
            return;
        }
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        dragX = e.clientX;
        const s = slotOf(e);
        // the two slots hugging the dragged tab are no-ops — no indicator
        dropAt.value = s === drag.from || s === drag.from + 1 ? null : s;
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        if (!drag) {
            return;
        }
        const s = slotOf(e);
        if (s >= 0 && s !== drag.from && s !== drag.from + 1) {
            const list = [...items.value];
            const [moved] = list.splice(drag.from, 1);
            const at = s > drag.from ? s - 1 : s;
            list.splice(at, 0, moved);
            items.value = list;
            // v5: the moved tab is selected at its new position
            doSelect(at);
            props.onchangeposition?.(drag.from, at);
        }
        drag.el.style.opacity = '';
        drag = null;
        dropAt.value = null;
        stopDragScroll();
    };

    const onDragend = () => {
        if (drag) {
            drag.el.style.opacity = '';
            drag = null;
        }
        dropAt.value = null;
        stopDragScroll();
    };

    // ---- overflow scroll: the header row hides its scrollbar and exposes
    // left/right arrows that show ONLY when the strip overflows. Arrows are
    // rendered together (both gutters reserved while scrolling, so their
    // width never shifts mid-scroll) and the unusable side is disabled.
    const canScroll = state<{ left: boolean; right: boolean }>({ left: false, right: false });

    const measure = () => {
        if (!ul) {
            return;
        }
        const max = ul.scrollWidth - ul.clientWidth;
        const left = ul.scrollLeft > 1;
        const right = ul.scrollLeft < max - 1;
        const cur = canScroll.value;
        if (cur.left !== left || cur.right !== right) {
            canScroll.value = { left, right };
        }
    };

    const nudge = (dir: -1 | 1) => {
        if (ul) {
            // one viewport-ish step, smooth; the onscroll handler re-measures
            ul.scrollBy({ left: dir * Math.max(ul.clientWidth * 0.75, 120), behavior: 'smooth' });
        }
    };

    onMount(() => {
        measure();
        const onResize = () => measure();
        window.addEventListener('resize', onResize);
        // tabs created/removed/reordered can change overflow — remeasure once
        // the new DOM is in place
        const unsub = items.subscribe(() => queueMicrotask(measure));
        return () => {
            window.removeEventListener('resize', onResize);
            unsub();
        };
    });

    return html`<div class="lm-tabs"
        data-position="${() => props.position.value || false}"
        data-variant="${() => props.variant.value || false}"
        data-round="${() => (props.round.value ? 'true' : false)}">
        <div class="lm-tabs-headers"
            data-scroll="${() => (canScroll.value.left || canScroll.value.right ? 'true' : false)}">
            ${() =>
                (canScroll.value.left || canScroll.value.right) &&
                html`<button type="button" class="lm-tabs-scroll lm-tabs-scroll-prev"
                    aria-label="Scroll tabs left"
                    disabled="${() => !canScroll.value.left}"
                    onclick="${() => nudge(-1)}">chevron_left</button>`}
            <!-- role=tablist lives on the ul: it owns ONLY tabs — the
                 scroll and add buttons stay outside the tablist (1.3.1) -->
            <ul role="tablist" aria-orientation="horizontal"
                ref="${(el: HTMLElement) => (ul = el)}"
                onclick="${onOpenEvent}"
                onfocusin="${onOpenEvent}"
                onkeydown="${onKeydown}"
                onscroll="${measure}"
                ondragstart="${onDragstart}"
                ondragover="${onDragover}"
                ondrop="${onDrop}"
                ondragend="${onDragend}">${() =>
                items.value.map(
                    (item, i) =>
                        // Keyed by the prepared item (identity — items are
                        // cloned once and stable): drag sorting and
                        // create-at-position MOVE the header <li> instead of
                        // rewriting every header right of the change
                        html`<li key="${item}" class="lm-tabs-tab ${() => (selected.value === i ? 'lm-tabs-selected' : '')} ${() => (dropAt.value === i ? 'lm-tabs-drop' : '')} ${() =>
                            dropAt.value !== null && dropAt.value === items.value.length && i === items.value.length - 1 ? 'lm-tabs-drop-end' : ''}"
                            tabindex="${() => (selected.value === i ? '0' : '-1')}" role="tab" draggable="true"
                            id="${tabId(item)}" aria-controls="${item.el!.id}"
                            aria-selected="${() => (selected.value === i ? 'true' : 'false')}"
                            data-icon="${item.icon || false}">${item.title || ''}</li>`
                )}</ul>
            ${() =>
                (canScroll.value.left || canScroll.value.right) &&
                html`<button type="button" class="lm-tabs-scroll lm-tabs-scroll-next"
                    aria-label="Scroll tabs right"
                    disabled="${() => !canScroll.value.right}"
                    onclick="${() => nudge(1)}">chevron_right</button>`}
            ${() =>
                props.allowcreate.value &&
                html`<div class="lm-tabs-insert-button" role="button" aria-label="Add tab" tabindex="0"
                    onclick="${() => create({ title: 'Untitled' }, null, true)}"
                    onkeydown="${(e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault(); // Space must not scroll the page
                            create({ title: 'Untitled' }, null, true);
                        }
                    }}">add</div>`}
        </div>
        <div class="lm-tabs-content">${() => items.value.map((item) => item.el)}</div>
    </div>`;
});

export default Tabs;
