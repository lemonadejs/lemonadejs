/**
 * <List /> — full behavioral parity with the v5 plugin (@lemonadejs/list).
 *
 * The v5 model, ported faithfully:
 *   - data: an array of records rendered one element per item; the item
 *     template comes from the caller (v5: children/template string →
 *     v6: the render prop, which can return an html`` view — any block
 *     can live inside an item)
 *   - built-in search across EVERY property of every record (v5: the
 *     bound input over Pagination.find); onbeforesearch fires before
 *     the filter, onsearch after it; searching resets to page zero
 *   - pagination: N items per page, numbered pager, onchangepage(page)
 *   - remote mode (total > 0): the component never filters or slices —
 *     data IS the current page, total drives the pager, and the events
 *     (onsearch / onchangepage) are the caller's cue to fetch; data
 *     assignments keep the page (local assignments reset it, as v5)
 *   - message: the empty state (a real .lm-list-message element — v5
 *     used :empty::before, which cannot see v6's slot markers)
 *   - data BY REFERENCE: mutate records + touch() re-renders
 *
 * v5 → v6 mapping: children template → render(item, index); self.input
 * → api.setSearch(query); self.setPage → api.setPage(page); the «/»
 * ten-page strip → the house prev/next + ellipsis pager (shared with
 * <Datagrid />); page resets stay silent (v5 dispatched onchangepage
 * even on load); the search box is opt-in (search), as in <Datagrid />.
 *
 * Plus the MUI List affordances, where they cost nothing:
 *   - a default item renderer over { title, secondary, icon, avatar }:
 *     avatar/icon slot + primary/secondary text (primitive items render
 *     as plain text rows)
 *   - dense and divider variants
 *   - onitemclick(item, index, event) makes rows interactive (hover +
 *     cursor through data-clickable)
 *   - virtual scrolling (height + rowheight, no pagination): the
 *     datagrid window pattern — 100k-item feeds keep ~a viewport of
 *     DOM alive
 */

import { component, html, type View } from 'lemonadejs';

/** What the DEFAULT item renderer reads — any extra fields are yours
 *  (and the built-in search matches against all of them) */
export interface ListItem {
    /** Primary line */
    title?: string;
    /** Muted second line (MUI secondary text) */
    secondary?: string;
    /** Leading icon name/text (hidden when avatar is set) */
    icon?: string;
    /** Leading avatar image URL */
    avatar?: string;
    [key: string]: unknown;
}

const OVERSCAN = 4;

/** v5 Pagination.find: a record matches when ANY property contains the query */
const matches = (item: unknown, q: string): boolean => {
    if (item !== null && typeof item === 'object') {
        for (const key in item as Record<string, unknown>) {
            if (String((item as Record<string, unknown>)[key] ?? '').toLowerCase().includes(q)) {
                return true;
            }
        }
        return false;
    }
    return String(item ?? '').toLowerCase().includes(q);
};

export const List = component('list', {
    data: Array,                  // records BY REFERENCE (mutate + touch())
    render: Function,             // (item, index) => string | html`` view; default = MUI item
    search: false,                // built-in search box
    pagination: 0,                // items per page; 0 = no pager
    total: 0,                     // > 0 = remote mode: data is the current page, total drives the pager
    message: 'No records found',  // empty state text
    dense: false,                 // tighter rows (MUI dense)
    divider: false,               // hairline between rows
    height: 0,                    // px viewport; with no pagination enables virtual scroll
    rowheight: 40,                // fixed row height (virtual mode)
    onbeforesearch: Function,     // (query) before the local filter — the remote hook
    onsearch: Function,           // (query) after the filter
    onchangepage: Function,       // (page) on user/api page changes
    onitemclick: Function,        // (item, index, event)
    api: { setPage: Function, getPage: Function, setSearch: Function, refresh: Function },
}, (props, { state, onMount }) => {
    // peek, not value: render bindings must NOT track data directly —
    // every data change (assignment or touch) flows through the refresh
    // subscription into `view`, so the list re-renders exactly once
    const items = () => (props.data.peek() as unknown[]) || [];

    // ---- the view pipeline: data -> filter(query) -> indices
    const view = state<number[]>([]);
    const query = state('');
    const page = state(0);
    const first = state(0); // first rendered index into view (virtual mode)

    let scroller: HTMLElement | null = null;

    /** v5: total set externally = the caller owns filtering and slicing */
    const isRemote = () => (props.total.value as number) > 0;
    const virtual = () => !props.pagination.value && (props.height.value as number) > 0;
    const rowHeight = () => (props.rowheight.value as number) || 40;

    const pageCount = () => {
        const size = (props.pagination.value as number) || 1;
        const total = isRemote() ? (props.total.value as number) : view.value.length;
        return Math.max(1, Math.ceil(total / size));
    };

    const refresh = () => {
        const data = items();
        let indices: number[];
        const q = query.value.trim().toLowerCase();
        if (q && !isRemote()) {
            indices = [];
            for (let i = 0; i < data.length; i++) {
                if (matches(data[i], q)) {
                    indices.push(i);
                }
            }
        } else {
            indices = Array.from({ length: data.length }, (_, i) => i);
        }
        view.value = indices;
        if (props.pagination.value) {
            page.value = Math.min(page.value, Math.max(0, pageCount() - 1));
        } else if (scroller) {
            onScroll();
        }
    };

    // External data changes: assignment AND touch() re-enter the pipeline.
    // v5: a local-mode data assignment goes back to page zero (silently);
    // in remote mode the new data IS the requested page — keep it.
    onMount(() => props.data.subscribe(() => {
        if (!isRemote()) {
            page.value = 0;
        }
        refresh();
    }));
    onMount(() => props.total.subscribe(refresh)); // v5: total change recomputes the pager

    // ---- virtual window (the datagrid pattern: view + first + translateY)
    const visibleCount = () =>
        props.pagination.value
            ? (props.pagination.value as number)
            : virtual()
              ? Math.ceil((props.height.value as number) / rowHeight()) + OVERSCAN * 2
              : view.value.length;

    const onScroll = () => {
        if (!scroller || !virtual()) {
            return;
        }
        const start = Math.floor(scroller.scrollTop / rowHeight()) - OVERSCAN;
        const max = Math.max(0, view.value.length - visibleCount());
        first.value = Math.min(Math.max(0, start), max);
    };

    const windowIndices = () => {
        // Remote: data is already the current page — show all of it
        const start = props.pagination.value
            ? isRemote()
                ? 0
                : page.value * (props.pagination.value as number)
            : first.value;
        return view.value.slice(start, start + visibleCount());
    };

    // ---- search (v5: onbeforesearch → filter (local only) → onsearch)
    const setSearch = (q: string) => {
        const next = String(q ?? '');
        props.onbeforesearch?.(next);
        query.value = next;
        page.value = 0;
        refresh();
        props.onsearch?.(next);
    };

    // ---- paging (v5 setPage; clamped; silent when nothing changes)
    const setPage = (p: number) => {
        const next = Math.min(Math.max(0, Math.floor(p)), pageCount() - 1);
        if (next !== page.value) {
            page.value = next;
            props.onchangepage?.(next);
        }
    };

    /** "21–40 of 87 items" */
    const pageInfo = () => {
        const size = props.pagination.value as number;
        const total = isRemote() ? (props.total.value as number) : view.value.length;
        if (!total) {
            return '0 items';
        }
        const start = page.value * size + 1;
        return start + '–' + Math.min(start + size - 1, total) + ' of ' + total + ' items';
    };

    /** Numbered pages with ellipsis windows: 1 … 4 [5] 6 … 12 (-1 = gap) */
    const pageItems = (): number[] => {
        const total = pageCount();
        const current = page.value;
        const shown = new Set<number>([0, total - 1, current - 1, current, current + 1]);
        const list: number[] = [];
        let previous = -1;
        for (let i = 0; i < total; i++) {
            if (shown.has(i)) {
                if (previous >= 0 && i - previous > 1) {
                    list.push(-1); // gap
                }
                list.push(i);
                previous = i;
            }
        }
        return list;
    };

    // Initial pipeline run — after every helper above exists
    refresh();

    props.ref?.({
        setPage,
        getPage: () => page.value,
        setSearch,
        refresh,
    });

    // ---- rendering
    /** The MUI item: [avatar | icon] + primary/secondary text */
    const defaultItem = (item: unknown): View[] => {
        const it = (item !== null && typeof item === 'object'
            ? item
            : { title: String(item ?? '') }) as ListItem;
        const parts: View[] = [];
        if (it.avatar) {
            parts.push(html`<img class="lm-list-avatar" src="${String(it.avatar)}" alt="" />`);
        } else if (it.icon) {
            parts.push(html`<span class="lm-list-icon">${String(it.icon)}</span>`);
        }
        parts.push(html`<div class="lm-list-text">
            <div class="lm-list-primary">${it.title === undefined ? '' : String(it.title)}</div>
            ${it.secondary === undefined
                ? ''
                : html`<div class="lm-list-secondary">${String(it.secondary)}</div>`}
        </div>`);
        return parts;
    };

    const itemView = (dataIndex: number) => {
        const item = items()[dataIndex];
        // render is a declared (non-event) prop, so it arrives as a live state
        const custom = props.render.value as ((item: unknown, index: number) => string | View) | undefined;
        const onitemclick = props.onitemclick as
            | ((item: unknown, index: number, e: MouseEvent) => void)
            | undefined;
        return html`<div class="lm-list-item" role="listitem"
            style="${virtual() ? 'height:' + rowHeight() + 'px' : false}"
            data-clickable="${onitemclick ? 'true' : false}"
            onclick="${(e: MouseEvent) => onitemclick?.(item, dataIndex, e)}">${
            custom ? custom(item, dataIndex) : defaultItem(item)}</div>`;
    };

    return html`<div class="lm-list ${() => (props.dense.value ? 'lm-list-dense' : '')} ${() =>
        props.divider.value ? 'lm-list-divider' : ''}">
        ${() =>
            props.search.value &&
            html`<div class="lm-list-toolbar">
                <input class="lm-list-search" type="search" placeholder="Search..."
                    oninput="${(e: Event) => setSearch((e.target as HTMLInputElement).value)}" />
            </div>`}
        <div class="lm-list-content" role="list"
            style="${() => (virtual() ? 'height:' + props.height.value + 'px;overflow-y:auto' : '')}"
            ref="${(el: Element) => (scroller = el as HTMLElement)}"
            onscroll="${onScroll}">
            <div class="lm-list-canvas"
                style="${() => (virtual() ? 'height:' + view.value.length * rowHeight() + 'px' : '')}">
                <div class="lm-list-window"
                    style="${() => (virtual() ? 'transform:translateY(' + first.value * rowHeight() + 'px)' : '')}">
                    ${() => windowIndices().map(itemView)}
                </div>
            </div>
            ${() =>
                view.value.length === 0
                    ? html`<div class="lm-list-message">${() => props.message.value}</div>`
                    : ''}
        </div>
        ${() =>
            props.pagination.value
                ? html`<div class="lm-list-footer">
                      <span class="lm-list-pageinfo">${() => pageInfo()}</span>
                      <nav class="lm-list-pages" aria-label="Pagination">
                          <button onclick="${() => setPage(page.value - 1)}"
                              disabled="${() => page.value === 0}" aria-label="Previous page">‹</button>
                          ${() =>
                              pageItems().map((item) =>
                                  item < 0
                                      ? html`<span class="lm-list-gap">…</span>`
                                      : html`<button data-current="${() => (page.value === item ? 'true' : false)}"
                                            onclick="${() => setPage(item)}">${item + 1}</button>`
                              )}
                          <button onclick="${() => setPage(page.value + 1)}"
                              disabled="${() => page.value >= pageCount() - 1}" aria-label="Next page">›</button>
                      </nav>
                  </div>`
                : ''}
    </div>`;
});

export default List;
