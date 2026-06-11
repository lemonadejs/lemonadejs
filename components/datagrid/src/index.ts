/**
 * <Datagrid /> — the lightweight, virtualized data grid. Built FOR the
 * v6 engine's mutable-state model: pass `data` by reference, mutate it
 * and touch() — the grid re-renders only its visible window. 100k rows
 * keep ~a viewport of DOM alive.
 *
 *   - virtual scrolling (fixed rowheight), sticky header, one scroller
 *   - sorting (header click: asc → desc → off), numeric-aware
 *   - search across all columns (built-in box or api.setSearch)
 *   - selection: 'single' (row click) or 'multiple' (checkbox column
 *     with select-all)
 *   - inline editing (double-click or Enter; Escape cancels; commits
 *     mutate YOUR row objects and fire onchange)
 *   - keyboard: arrows move the active cell, Enter edits, Space toggles
 *     selection
 *   - pagination mode (pagination > 0) instead of virtual scroll
 *   - column customization: drag the header edge to resize (widths turn
 *     px, oncolumnresize on release), column.hidden + api.setColumn for
 *     runtime changes, headerrender for custom header content,
 *     column.class on body cells
 *
 * Not a spreadsheet: no formulas, no merged cells — that is jspreadsheet.
 */

import { component, html, type View } from 'lemonadejs';

export interface Column {
    /** Key into each row object */
    name: string;
    /** Header label (defaults to name) */
    title?: string;
    /** CSS grid track, e.g. '120px' | '2fr' (default '1fr') */
    width?: string;
    align?: 'left' | 'center' | 'right';
    /** number: numeric sort + right align; checkbox: boolean cell */
    type?: 'text' | 'number' | 'checkbox';
    /** Custom cell content: a string, or an html`` view — ANY block can
     *  live in a cell (<${Switch} />, <${Rating} />, buttons...) */
    render?: (value: unknown, row: Record<string, unknown>) => string | View;
    sortable?: boolean;
    editable?: boolean;
    /** Hide the column entirely (header, cells, grid track). Live: flip
     *  it and touch() the columns state, or use api.setColumn */
    hidden?: boolean;
    /** Custom header content: a string or an html`` view. The sort
     *  arrow and the resize handle are still appended */
    headerrender?: (col: Column) => string | View;
    /** Extra class on every body cell of this column */
    class?: string;
}

type Row = Record<string, unknown>;

const OVERSCAN = 4;
const MIN_COL = 60; // px floor while drag-resizing a column

export const Datagrid = component('datagrid', {
    data: Array,                  // row objects BY REFERENCE (mutate + touch())
    columns: Array,               // Column[]
    height: 360,                  // viewport height (virtual mode)
    rowheight: 36,
    selectable: '',               // '' | 'single' | 'multiple'
    editable: false,              // grid default; column.editable overrides
    search: false,                // built-in search box
    pagination: 0,                // rows per page; 0 = virtual scroll
    onchange: Function,           // (row, columnName, value, oldValue)
    onselect: Function,           // (selectedRows)
    onsort: Function,             // (columnName, direction | null)
    onrowclick: Function,         // (row, event)
    oncolumnresize: Function,     // (columnName, widthPx) on handle release
    api: { getSelected: Function, setSearch: Function, sort: Function, page: Function, refresh: Function, setColumn: Function },
}, (props, { state, onMount, onUnmount }) => {
    // peek, not value: render bindings must NOT track data directly —
    // every data change (assignment or touch) flows through the refresh
    // subscription into `view`, so the window re-renders exactly once,
    // always with indices that match the current data
    const rows = () => (props.data!.peek() as Row[]) || [];
    // Same peek discipline as data: imperative paths and row builds must
    // not track the columns prop — column changes flow through the
    // refresh subscription (rows) and the tracked header bindings below
    const columns = () => (props.columns!.peek() as Column[]) || [];
    const visibleColumns = () => columns().filter((c) => !c.hidden);
    // Tracked read ON PURPOSE: the header cells and every grid-template
    // binding re-run when the columns prop is assigned or touch()ed
    const liveColumns = () => ((props.columns!.value as Column[]) || []).filter((c) => !c.hidden);

    // ---- the view pipeline: data -> filter(query) -> sort -> indices.
    // Recomputed ONCE per change (not per binding) into a state.
    const view = state<number[]>([]);
    const query = state('');
    const sortBy = state<{ name: string; dir: 1 | -1 } | null>(null);
    const page = state(0);
    const first = state(0); // first rendered index into view (virtual mode)
    const selected = state<Set<Row>>(new Set());
    const editing = state<{ index: number; name: string } | null>(null);
    const active = state<{ r: number; c: number } | null>(null);
    // Drag-resized columns: name → px. Overrides column.width in
    // gridTemplate() — once resized, a column leaves fr-land for good
    const widths = state<Record<string, number>>({});

    let scroller: HTMLElement | null = null;
    let rootEl: HTMLElement | null = null;

    const refresh = () => {
        const data = rows();
        let indices: number[] = [];
        const q = query.value.trim().toLowerCase();
        if (q) {
            const names = columns().map((c) => c.name);
            for (let i = 0; i < data.length; i++) {
                for (const name of names) {
                    if (String(data[i][name] ?? '').toLowerCase().includes(q)) {
                        indices.push(i);
                        break;
                    }
                }
            }
        } else {
            indices = Array.from({ length: data.length }, (_, i) => i);
        }
        const s = sortBy.value;
        if (s) {
            const col = columns().find((c) => c.name === s.name);
            const numeric = col?.type === 'number';
            indices.sort((a, b) => {
                const va = data[a][s.name];
                const vb = data[b][s.name];
                if (numeric) {
                    return (Number(va) - Number(vb)) * s.dir;
                }
                return String(va ?? '').localeCompare(String(vb ?? '')) * s.dir;
            });
        }
        // Close any edit BEFORE the window re-renders: the engine blurs
        // nodes it disposes, and a live editing state would turn that
        // disposal blur into an unintended commit
        editing.value = null;
        view.value = indices;
        if (props.pagination!.value) {
            page.value = Math.min(page.value, Math.max(0, pageCount() - 1));
        } else if (scroller) {
            onScroll();
        }
    };

    // External data changes: assignment AND touch() re-enter the pipeline
    onMount(() => props.data!.subscribe(refresh));
    // Column changes (setColumn api or an external touch) take the same
    // path: refresh rebuilds the window with the current column set
    onMount(() => props.columns!.subscribe(refresh));

    // ---- drag gesture: document listeners with ONE persistent cleanup.
    // An unmount mid-drag releases the in-flight gesture (modal pattern);
    // registering onUnmount per drag would accumulate dead callbacks
    let releaseGesture: (() => void) | null = null;
    onUnmount(() => releaseGesture?.());

    const track = (move: (e: MouseEvent) => void, done?: () => void) => {
        releaseGesture?.();
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            releaseGesture = null;
            rootEl?.classList.remove('lm-datagrid-resizing');
            done?.();
        };
        releaseGesture = up;
        rootEl?.classList.add('lm-datagrid-resizing');
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // ---- column resize: 6px handle on the th right edge
    const startResize = (e: MouseEvent, col: Column) => {
        // The handle lives INSIDE the sortable th: the gesture must
        // never bubble into the sort click handler
        e.stopPropagation();
        e.preventDefault();
        const th = (e.target as Element).closest('.lm-datagrid-th') as HTMLElement | null;
        let startWidth = widths.value[col.name] || 0;
        if (!startWidth && th) {
            startWidth = th.getBoundingClientRect().width;
        }
        if (!startWidth && col.width && col.width.slice(-2) === 'px') {
            startWidth = parseFloat(col.width);
        }
        if (!startWidth) {
            startWidth = 100;
        }
        const sx = e.clientX;
        track(
            (ev: MouseEvent) => {
                const w = Math.max(MIN_COL, Math.round(startWidth + ev.clientX - sx));
                widths.value = { ...widths.value, [col.name]: w };
            },
            () => {
                (props.oncolumnresize as ((n: string, w: number) => void) | undefined)?.(
                    col.name,
                    widths.value[col.name] || Math.round(startWidth)
                );
            }
        );
    };

    // ---- virtual window
    const rowHeight = () => (props.rowheight!.value as number) || 36;
    const visibleCount = () =>
        props.pagination!.value
            ? (props.pagination!.value as number)
            : Math.ceil((props.height!.value as number) / rowHeight()) + OVERSCAN * 2;

    const onScroll = () => {
        if (!scroller || props.pagination!.value) {
            return;
        }
        const start = Math.floor(scroller.scrollTop / rowHeight()) - OVERSCAN;
        const max = Math.max(0, view.value.length - visibleCount());
        first.value = Math.min(Math.max(0, start), max);
    };

    const pageCount = () => Math.max(1, Math.ceil(view.value.length / ((props.pagination!.value as number) || 1)));

    /** "21–40 of 45 rows" */
    const pageInfo = () => {
        const size = props.pagination!.value as number;
        const total = view.value.length;
        if (!total) {
            return '0 rows';
        }
        const start = page.value * size + 1;
        return start + '–' + Math.min(start + size - 1, total) + ' of ' + total + ' rows';
    };

    /** Numbered pages with ellipsis windows: 1 … 4 [5] 6 … 12 (-1 = gap) */
    const pageItems = (): number[] => {
        const total = pageCount();
        const current = page.value;
        const shown = new Set<number>([0, total - 1, current - 1, current, current + 1]);
        const items: number[] = [];
        let previous = -1;
        for (let i = 0; i < total; i++) {
            if (shown.has(i)) {
                if (previous >= 0 && i - previous > 1) {
                    items.push(-1); // gap
                }
                items.push(i);
                previous = i;
            }
        }
        return items;
    };

    // Initial pipeline run — after every helper above exists
    refresh();

    const windowIndices = () => {
        const start = props.pagination!.value ? page.value * (props.pagination!.value as number) : first.value;
        return view.value.slice(start, start + visibleCount()).map((dataIndex, i) => ({
            dataIndex,
            viewIndex: start + i,
        }));
    };

    // ---- sorting
    const sort = (name: string, dir?: 1 | -1 | null) => {
        const col = columns().find((c) => c.name === name);
        if (!col || col.sortable === false) {
            return;
        }
        const current = sortBy.value;
        const next =
            dir !== undefined
                ? dir && { name, dir }
                : !current || current.name !== name
                  ? { name, dir: 1 as const }
                  : current.dir === 1
                    ? { name, dir: -1 as const }
                    : null;
        sortBy.value = next || null;
        refresh();
        (props.onsort as ((n: string, d: 1 | -1 | null) => void) | undefined)?.(name, next ? next.dir : null);
    };

    // ---- selection
    const notifySelect = () =>
        (props.onselect as ((rows: Row[]) => void) | undefined)?.([...selected.value]);

    const toggleRow = (row: Row, single: boolean) => {
        if (single) {
            selected.value = new Set(selected.value.has(row) ? [] : [row]);
        } else {
            const next = new Set(selected.value);
            if (next.has(row)) {
                next.delete(row);
            } else {
                next.add(row);
            }
            selected.value = next;
        }
        notifySelect();
    };

    const allVisibleSelected = () =>
        view.value.length > 0 && view.value.every((i) => selected.value.has(rows()[i]));

    const toggleAll = () => {
        selected.value = allVisibleSelected() ? new Set() : new Set(view.value.map((i) => rows()[i]));
        notifySelect();
    };

    // ---- editing
    const editable = (col: Column) => (col.editable !== undefined ? col.editable : !!props.editable!.value);

    const startEdit = (dataIndex: number, col: Column) => {
        if (editable(col) && col.type !== 'checkbox') {
            editing.value = { index: dataIndex, name: col.name };
        }
    };

    const commit = (row: Row, col: Column, raw: string) => {
        const oldValue = row[col.name];
        const next = col.type === 'number' ? (raw === '' ? null : Number(raw)) : raw;
        editing.value = null;
        if (!Object.is(next, oldValue)) {
            row[col.name] = next;
            props.data!.touch();
            (props.onchange as ((r: Row, n: string, v: unknown, o: unknown) => void) | undefined)?.(
                row,
                col.name,
                next,
                oldValue
            );
        }
    };

    const setChecked = (row: Row, col: Column, checked: boolean) => {
        const oldValue = row[col.name];
        row[col.name] = checked;
        props.data!.touch();
        (props.onchange as ((r: Row, n: string, v: unknown, o: unknown) => void) | undefined)?.(
            row,
            col.name,
            checked,
            oldValue
        );
    };

    // ---- keyboard: arrows move the ACTIVE cell, Enter edits, Space selects
    const onKey = (e: KeyboardEvent) => {
        if (editing.value) {
            return; // the editor input owns the keys
        }
        const a = active.value || { r: 0, c: 0 };
        const lastR = view.value.length - 1;
        const lastC = visibleColumns().length - 1;
        let handled = true;
        if (e.key === 'ArrowDown') {
            active.value = { r: Math.min(a.r + 1, lastR), c: a.c };
        } else if (e.key === 'ArrowUp') {
            active.value = { r: Math.max(a.r - 1, 0), c: a.c };
        } else if (e.key === 'ArrowRight') {
            active.value = { r: a.r, c: Math.min(a.c + 1, lastC) };
        } else if (e.key === 'ArrowLeft') {
            active.value = { r: a.r, c: Math.max(a.c - 1, 0) };
        } else if (e.key === 'Enter' && active.value) {
            const col = visibleColumns()[a.c];
            if (col) {
                startEdit(view.value[a.r], col);
            }
        } else if (e.key === ' ' && active.value && props.selectable!.value) {
            toggleRow(rows()[view.value[a.r]], props.selectable!.value === 'single');
        } else {
            handled = false;
        }
        if (handled) {
            e.preventDefault();
            // Keep the active row inside the window
            if (!props.pagination!.value && scroller && active.value) {
                const top = active.value.r * rowHeight();
                if (top < scroller.scrollTop) {
                    scroller.scrollTop = top;
                } else if (top + rowHeight() > scroller.scrollTop + (props.height!.value as number)) {
                    scroller.scrollTop = top + rowHeight() - (props.height!.value as number);
                }
                onScroll();
            }
        }
    };

    props.ref?.({
        getSelected: () => [...selected.value],
        setSearch: (q: string) => {
            query.value = String(q ?? '');
            page.value = 0;
            refresh();
        },
        sort,
        page: (p: number) => {
            page.value = Math.min(Math.max(0, p), pageCount() - 1);
        },
        refresh,
        setColumn: (name: string, options: { hidden?: boolean; width?: string; title?: string } = {}) => {
            const col = columns().find((c) => c.name === name);
            if (!col) {
                return;
            }
            if (options.hidden !== undefined) {
                col.hidden = options.hidden;
            }
            if (options.title !== undefined) {
                col.title = options.title;
            }
            if (options.width !== undefined) {
                col.width = options.width;
                if (widths.value[name] !== undefined) {
                    // An explicit width supersedes any drag-resize override
                    const next = { ...widths.value };
                    delete next[name];
                    widths.value = next;
                }
            }
            // The columns prop is the source of truth: touch() re-renders
            // the header (tracked bindings) and re-enters the pipeline
            // through the columns subscription (window rows)
            props.columns!.touch();
        },
    });

    // ---- rendering
    // Tracked on purpose (liveColumns + widths): the header style AND
    // every row style binding re-run live while a column is resized,
    // shown or hidden
    const gridTemplate = () => {
        const w = widths.value;
        const tracks = liveColumns().map((c) => (w[c.name] ? w[c.name] + 'px' : c.width || '1fr'));
        if (props.selectable!.value === 'multiple') {
            tracks.unshift('40px');
        }
        return tracks.join(' ');
    };

    const cellContent = (row: Row, col: Column): string | View => {
        const value = row[col.name];
        if (col.render) {
            return col.render(value, row);
        }
        return value === null || value === undefined ? '' : String(value);
    };

    const cellView = (entry: { dataIndex: number; viewIndex: number }, col: Column, c: number) => {
        const row = rows()[entry.dataIndex];
        if (col.type === 'checkbox') {
            return html`<div class="lm-datagrid-cell ${col.class || ''}" data-align="center" role="gridcell">
                <input type="checkbox" checked="${() => !!row[col.name]}"
                    disabled="${!editable(col)}"
                    onchange="${(e: Event) => setChecked(row, col, (e.target as HTMLInputElement).checked)}" />
            </div>`;
        }
        return html`<div class="lm-datagrid-cell ${col.class || ''} ${() =>
            active.value && active.value.r === entry.viewIndex && active.value.c === c ? 'lm-datagrid-active' : ''}"
            data-align="${col.align || (col.type === 'number' ? 'right' : false)}"
            role="gridcell"
            onclick="${() => (active.value = { r: entry.viewIndex, c })}"
            ondblclick="${() => startEdit(entry.dataIndex, col)}">${() =>
            editing.value && editing.value.index === entry.dataIndex && editing.value.name === col.name
                ? // Edit IN the cell: a contenteditable span keeps the cell's
                  // geometry and typography; focus + select-all on entry
                  html`<span class="lm-datagrid-editor" contenteditable="true"
                      ref="${(el: Element) => {
                          // The branch builds detached; focus needs attachment
                          queueMicrotask(() => {
                              const span = el as HTMLElement;
                              if (!span.isConnected) {
                                  return;
                              }
                              // preventScroll: the cell is already visible
                              // (it was just double-clicked); auto-scroll
                              // would re-render the window and kill the edit
                              span.focus({ preventScroll: true });
                              try {
                                  const range = document.createRange();
                                  range.selectNodeContents(span);
                                  const selection = window.getSelection();
                                  selection?.removeAllRanges();
                                  selection?.addRange(range);
                              } catch {
                                  // selection api unavailable (some test hosts)
                              }
                          });
                      }}"
                      onkeydown="${(e: KeyboardEvent) => {
                          if (e.key === 'Enter') {
                              e.preventDefault(); // single-line cell, no <br>
                              commit(row, col, (e.target as HTMLElement).textContent || '');
                          } else if (e.key === 'Escape') {
                              editing.value = null;
                          }
                          e.stopPropagation();
                      }}"
                      onblur="${(e: FocusEvent) => {
                          if (editing.value) {
                              commit(row, col, (e.target as HTMLElement).textContent || '');
                          }
                      }}">${String(row[col.name] ?? '')}</span>`
                : cellContent(row, col)}</div>`;
    };

    const rowView = (entry: { dataIndex: number; viewIndex: number }) => {
        const row = rows()[entry.dataIndex];
        return html`<div class="lm-datagrid-row ${() => (selected.value.has(row) ? 'lm-datagrid-selected' : '')}"
            role="row"
            style="${() => 'height:' + rowHeight() + 'px;grid-template-columns:' + gridTemplate()}"
            onclick="${(e: MouseEvent) => {
                if (props.selectable!.value === 'single') {
                    toggleRow(row, true);
                }
                (props.onrowclick as ((r: Row, ev: MouseEvent) => void) | undefined)?.(row, e);
            }}">
            ${() =>
                props.selectable!.value === 'multiple'
                    ? html`<div class="lm-datagrid-cell" data-align="center" role="gridcell">
                          <input type="checkbox" checked="${() => selected.value.has(row)}"
                              onclick="${(e: Event) => e.stopPropagation()}"
                              onchange="${() => toggleRow(row, false)}" />
                      </div>`
                    : ''}
            ${visibleColumns().map((col, c) => cellView(entry, col, c))}
        </div>`;
    };

    const headerContent = (col: Column): string | View =>
        col.headerrender ? col.headerrender(col) : col.title || col.name;

    const headerView = () => html`<div class="lm-datagrid-header" role="row"
        style="grid-template-columns:${() => gridTemplate()}">
        ${() =>
            props.selectable!.value === 'multiple'
                ? html`<div class="lm-datagrid-th" data-align="center">
                      <input type="checkbox" checked="${() => allVisibleSelected()}" onchange="${toggleAll}" />
                  </div>`
                : ''}
        ${() =>
            liveColumns().map(
                (col) => html`<div class="lm-datagrid-th" data-align="${col.align || (col.type === 'number' ? 'right' : false)}"
                    data-sortable="${col.sortable !== false}"
                    onclick="${() => sort(col.name)}">
                    <span>${headerContent(col)}</span>
                    <span class="lm-datagrid-arrow">${() =>
                        sortBy.value && sortBy.value.name === col.name ? (sortBy.value.dir === 1 ? '▲' : '▼') : ''}</span>
                    <span class="lm-datagrid-resize"
                        onmousedown="${(e: MouseEvent) => startResize(e, col)}"
                        onclick="${(e: MouseEvent) => e.stopPropagation()}"></span>
                </div>`
            )}
    </div>`;

    return html`<div class="lm-datagrid" tabindex="0" role="grid"
        aria-rowcount="${() => view.value.length}"
        ref="${(el: Element) => (rootEl = el as HTMLElement)}"
        onkeydown="${onKey}">
        ${() =>
            props.search!.value &&
            html`<div class="lm-datagrid-toolbar">
                <input class="lm-datagrid-search" type="search" placeholder="Search..."
                    oninput="${(e: Event) => {
                        query.value = (e.target as HTMLInputElement).value;
                        page.value = 0;
                        refresh();
                    }}" />
                <span class="lm-datagrid-count">${() => view.value.length} rows</span>
            </div>`}
        ${headerView()}
        <div class="lm-datagrid-body"
            style="${() => (props.pagination!.value ? '' : 'height:' + props.height!.value + 'px;overflow-y:auto')}"
            ref="${(el: Element) => (scroller = el as HTMLElement)}"
            onscroll="${onScroll}">
            <div class="lm-datagrid-canvas"
                style="${() =>
                    props.pagination!.value ? '' : 'height:' + view.value.length * rowHeight() + 'px'}">
                <div class="lm-datagrid-window"
                    style="${() =>
                        props.pagination!.value ? '' : 'transform:translateY(' + first.value * rowHeight() + 'px)'}">
                    ${() => windowIndices().map(rowView)}
                </div>
            </div>
            ${() =>
                view.value.length === 0 ? html`<div class="lm-datagrid-empty">No matching rows</div>` : ''}
        </div>
        ${() =>
            props.pagination!.value
                ? html`<div class="lm-datagrid-footer">
                      <span class="lm-datagrid-pageinfo">${() => pageInfo()}</span>
                      <nav class="lm-datagrid-pages" aria-label="Pagination">
                          <button onclick="${() => (page.value = Math.max(0, page.value - 1))}"
                              disabled="${() => page.value === 0}" aria-label="Previous page">‹</button>
                          ${() =>
                              pageItems().map((item) =>
                                  item < 0
                                      ? html`<span class="lm-datagrid-gap">…</span>`
                                      : html`<button data-current="${() => (page.value === item ? 'true' : false)}"
                                            onclick="${() => (page.value = item)}">${item + 1}</button>`
                              )}
                          <button onclick="${() => (page.value = Math.min(pageCount() - 1, page.value + 1))}"
                              disabled="${() => page.value >= pageCount() - 1}" aria-label="Next page">›</button>
                      </nav>
                  </div>`
                : ''}
    </div>`;
});

export default Datagrid;
