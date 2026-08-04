/**
 * <Datagrid /> — the virtualized big-data grid. jsdom has no layout,
 * but the window math is driven by the height/rowheight PROPS, so the
 * virtualization is fully testable: row counts, window shifts, canvas
 * height, plus sort/search/select/edit/touch() semantics.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Datagrid, { type Column } from '@lemonadejs/datagrid';

type Api = {
    getSelected(): Record<string, unknown>[];
    setSearch(q: string): void;
    sort(name: string, dir?: 1 | -1 | null): void;
    page(p: number): void;
    refresh(): void;
    setColumn(name: string, options: { hidden?: boolean; width?: string; title?: string }): void;
    setValue(x: number | string, y: number, value: unknown): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const makeRows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        name: 'Person ' + (i + 1),
        amount: ((i * 37) % 1000) + 1,
        active: i % 2 === 0,
    }));

const columns: Column[] = [
    { name: 'id', title: 'ID', type: 'number', width: '70px' },
    { name: 'name', title: 'Name' },
    { name: 'amount', title: 'Amount', type: 'number', editable: true },
    { name: 'active', title: 'Active', type: 'checkbox', editable: true },
];

const open = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Datagrid, {
        data: makeRows(1000),
        columns,
        height: 360,
        rowheight: 36,
        ...props,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const renderedRows = () => handle!.queryAll('.lm-datagrid-row');
const cellTexts = (row: Element) => [...row.querySelectorAll('.lm-datagrid-cell')].map((c) => c.textContent!.trim());
const firstName = () => cellTexts(renderedRows()[0])[1];
const scroller = () => handle!.query('.lm-datagrid-body') as HTMLElement;
const scrollTo = (top: number) => {
    Object.defineProperty(scroller(), 'scrollTop', { value: top, writable: true });
    scroller().dispatchEvent(new Event('scroll'));
};

describe('components/datagrid — the virtualized grid', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Datagrid).pass).toBe(true);
    });

    it('VIRTUALIZES: 1000 rows produce only a window of DOM', () => {
        open();
        // ceil(360/36) + 2*4 overscan = 18 rows alive, not 1000
        expect(renderedRows()).toHaveLength(18);
        expect(firstName()).toBe('Person 1');
        // The canvas reserves the full scroll height
        expect((handle!.query('.lm-datagrid-canvas') as HTMLElement).style.height).toBe(36000 + 'px');
    });

    it('scrolling shifts the window and the transform', () => {
        open();
        scrollTo(3600); // row 100
        expect(firstName()).toBe('Person 97'); // 100 - overscan + 1
        const w = handle!.query('.lm-datagrid-window') as HTMLElement;
        expect(w.style.transform).toBe('translateY(' + 96 * 36 + 'px)');
        expect(renderedRows()).toHaveLength(18); // window size is constant

        scrollTo(36000); // past the end: clamped
        const last = renderedRows();
        expect(last.length).toBeLessThanOrEqual(18);
        expect(cellTexts(last[last.length - 1])[1]).toBe('Person 1000');
    });

    it('sort: header click cycles asc → desc → off (numeric-aware)', () => {
        const sorts: [string, 1 | -1 | null][] = [];
        const api = open({ onsort: (n: string, d: 1 | -1 | null) => sorts.push([n, d]) });
        void api;
        const amountTh = handle!.queryAll('.lm-datagrid-th')[2];

        amountTh.click(); // asc
        expect(Number(cellTexts(renderedRows()[0])[2])).toBe(1);
        amountTh.click(); // desc
        expect(Number(cellTexts(renderedRows()[0])[2])).toBe(1000);
        amountTh.click(); // off: original order
        expect(firstName()).toBe('Person 1');
        expect(sorts).toEqual([['amount', 1], ['amount', -1], ['amount', null]]);
    });

    it('search filters every column and shrinks the canvas', () => {
        const api = open({ search: true });
        const input = handle!.query('.lm-datagrid-search') as HTMLInputElement;
        input.value = 'Person 99';
        input.dispatchEvent(new Event('input'));
        // 'Person 99' + 'Person 990'..'Person 999' = 11
        expect(handle!.query('.lm-datagrid-count')!.textContent).toContain('11 rows');
        expect(renderedRows()).toHaveLength(11);
        expect((handle!.query('.lm-datagrid-canvas') as HTMLElement).style.height).toBe(11 * 36 + 'px');

        api.setSearch('');
        expect(handle!.query('.lm-datagrid-count')!.textContent).toContain('1000 rows');
    });

    it('inline edit: dblclick edits IN the cell (contenteditable), Enter commits + onchange', () => {
        const changes: unknown[][] = [];
        const data = makeRows(10);
        open({ data, onchange: (...args: unknown[]) => changes.push(args) });

        const amountCell = renderedRows()[0].querySelectorAll('.lm-datagrid-cell')[2] as HTMLElement;
        amountCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const editor = handle!.query('.lm-datagrid-editor') as HTMLElement;
        expect(editor).not.toBeNull();
        expect(editor.getAttribute('contenteditable')).toBe('true');
        expect(editor.parentElement).toBe(amountCell); // INSIDE the cell, not a swap
        expect(editor.textContent).toBe('1'); // pre-filled with the raw value

        editor.textContent = '777';
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        expect(data[0].amount).toBe(777); // the CALLER's object was mutated
        expect(changes).toEqual([[data[0], 'amount', 777, 1]]);
        expect(handle!.query('.lm-datagrid-editor')).toBeNull();
        expect(cellTexts(renderedRows()[0])[2]).toBe('777');
    });

    it('Escape cancels the edit without touching the row', () => {
        const data = makeRows(5);
        open({ data });
        const cell = renderedRows()[0].querySelectorAll('.lm-datagrid-cell')[2] as HTMLElement;
        cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const editor = handle!.query('.lm-datagrid-editor') as HTMLElement;
        editor.textContent = '999';
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(data[0].amount).toBe(1);
        expect(handle!.query('.lm-datagrid-editor')).toBeNull();
        expect(cellTexts(renderedRows()[0])[2]).toBe('1'); // original text restored
    });

    it('blur commits the in-cell edit', () => {
        const data = makeRows(5);
        open({ data });
        const cell = renderedRows()[0].querySelectorAll('.lm-datagrid-cell')[2] as HTMLElement;
        cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const editor = handle!.query('.lm-datagrid-editor') as HTMLElement;
        editor.textContent = '55';
        editor.dispatchEvent(new FocusEvent('blur'));
        expect(data[0].amount).toBe(55);
        expect(handle!.query('.lm-datagrid-editor')).toBeNull();
    });

    it('non-editable columns do not open an editor', () => {
        open(); // grid editable=false; name column has no editable flag
        const nameCell = renderedRows()[0].querySelectorAll('.lm-datagrid-cell')[1] as HTMLElement;
        nameCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(handle!.query('.lm-datagrid-editor')).toBeNull();
    });

    it('checkbox cells write through and fire onchange', () => {
        const changes: unknown[][] = [];
        const data = makeRows(5);
        open({ data, onchange: (...args: unknown[]) => changes.push(args) });
        const box = renderedRows()[1].querySelector('input[type=checkbox]') as HTMLInputElement;
        box.checked = true;
        box.dispatchEvent(new Event('change', { bubbles: true }));
        expect(data[1].active).toBe(true);
        expect(changes).toEqual([[data[1], 'active', true, false]]);
    });

    it('BIG DATA: mutate the array + touch() — the window re-renders', () => {
        const data = store(makeRows(1000));
        open({ data });
        data.value[0].name = 'MUTATED IN PLACE';
        data.touch();
        expect(firstName()).toBe('MUTATED IN PLACE');

        data.value.push({ id: 1001, name: 'Person 1001', amount: 5, active: false });
        data.touch();
        expect((handle!.query('.lm-datagrid-canvas') as HTMLElement).style.height).toBe(1001 * 36 + 'px');
    });

    it('assigning a NEW array also re-enters the pipeline', () => {
        const data = store(makeRows(10));
        open({ data });
        data.value = makeRows(3);
        expect(renderedRows()).toHaveLength(3);
    });

    it('selection multiple: checkbox column, select-all, getSelected', () => {
        const picked: unknown[] = [];
        const data = makeRows(5);
        const api = open({ data, selectable: 'multiple', onselect: (rows: unknown[]) => picked.push(rows) });

        const boxes = renderedRows().map((r) => r.querySelector('input[type=checkbox]') as HTMLInputElement);
        boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
        boxes[2].dispatchEvent(new Event('change', { bubbles: true }));
        expect(api.getSelected()).toEqual([data[0], data[2]]);
        expect(renderedRows()[0].className).toContain('lm-datagrid-selected');

        const all = handle!.query('.lm-datagrid-th input') as HTMLInputElement;
        all.dispatchEvent(new Event('change', { bubbles: true }));
        expect(api.getSelected()).toHaveLength(5);
        all.dispatchEvent(new Event('change', { bubbles: true }));
        expect(api.getSelected()).toHaveLength(0);
        expect(picked).toHaveLength(4);
    });

    it('selection single: row click replaces the selection', () => {
        const data = makeRows(5);
        const api = open({ data, selectable: 'single' });
        renderedRows()[1].click();
        expect(api.getSelected()).toEqual([data[1]]);
        renderedRows()[3].click();
        expect(api.getSelected()).toEqual([data[3]]);
        renderedRows()[3].click(); // toggle off
        expect(api.getSelected()).toEqual([]);
    });

    it('pagination: numbered pages, range info, prev/next', () => {
        const api = open({ data: makeRows(45), pagination: 20 });
        expect(renderedRows()).toHaveLength(20);
        expect(handle!.query('.lm-datagrid-pageinfo')!.textContent).toBe('1–20 of 45 rows');

        const buttons = () => handle!.queryAll('.lm-datagrid-pages button');
        expect(buttons().map((b) => b.textContent)).toEqual(['‹', '1', '2', '3', '›']);
        expect(buttons()[1].hasAttribute('data-current')).toBe(true);

        buttons()[2].click(); // page "2"
        expect(firstName()).toBe('Person 21');
        expect(handle!.query('.lm-datagrid-pageinfo')!.textContent).toBe('21–40 of 45 rows');
        expect(buttons()[2].hasAttribute('data-current')).toBe(true);

        api.page(2);
        expect(renderedRows()).toHaveLength(5); // last page remainder
        expect(handle!.query('.lm-datagrid-pageinfo')!.textContent).toBe('41–45 of 45 rows');
    });

    it('pagination: many pages collapse into ellipsis windows', () => {
        const api = open({ data: makeRows(1000), pagination: 10 }); // 100 pages
        const texts = () => handle!.queryAll('.lm-datagrid-pages button, .lm-datagrid-gap').map((el) => el.textContent);
        expect(texts()).toEqual(['‹', '1', '2', '…', '100', '›']);
        api.page(49);
        expect(texts()).toEqual(['‹', '1', '…', '49', '50', '51', '…', '100', '›']);
    });

    it('column.render can return a VIEW — blocks live inside cells', () => {
        const data = makeRows(3);
        open({
            data,
            columns: [
                { name: 'name', title: 'Name' },
                {
                    name: 'active',
                    title: 'Active',
                    render: (value: unknown, row: Record<string, unknown>) =>
                        html`<button class="cell-block" onclick="${() => (row.flipped = true)}">${value ? 'on' : 'off'}</button>`,
                },
            ] as Column[],
        });
        const block = renderedRows()[0].querySelector('.cell-block') as HTMLElement;
        expect(block.textContent).toBe('on');
        block.click();
        expect((data[0] as Record<string, unknown>).flipped).toBe(true);
    });

    it('keyboard: arrows move the active cell, Enter opens the editor', () => {
        open({ data: makeRows(10) });
        const grid = handle!.query('.lm-datagrid') as HTMLElement;
        const key = (k: string) => grid.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

        key('ArrowDown');
        key('ArrowRight');
        key('ArrowRight');
        expect(handle!.query('.lm-datagrid-active')).not.toBeNull();
        key('Enter'); // amount column (editable)
        expect(handle!.query('.lm-datagrid-editor')).not.toBeNull();
    });

    it('column.render customizes the cell text', () => {
        open({
            data: makeRows(3),
            columns: [{ name: 'amount', title: 'Amount', render: (v: unknown) => '$' + v }] as Column[],
        });
        expect(cellTexts(renderedRows()[0])[0]).toBe('$1');
    });

    it('empty search result shows the empty state', () => {
        const api = open();
        api.setSearch('zzz-nothing');
        expect(renderedRows()).toHaveLength(0);
        expect(handle!.query('.lm-datagrid-empty')).not.toBeNull();
    });
});

// ---- column resize + customization -------------------------------------

/** Fresh columns per test: setColumn MUTATES the column objects */
const freshColumns = (): Column[] => [
    { name: 'id', title: 'ID', type: 'number', width: '70px' },
    { name: 'name', title: 'Name' },
    { name: 'amount', title: 'Amount', type: 'number', editable: true },
];

const headerEl = () => handle!.query('.lm-datagrid-header') as HTMLElement;
/** Read the grid template off the RAW style attribute — jsdom's CSSOM
 *  does not parse grid properties, but the attribute keeps the truth */
const templateOf = (el: Element) =>
    ((el.getAttribute('style') || '').match(/grid-template-columns:\s*([^;]+)/) || [])[1]?.trim();
const thAt = (i: number) => handle!.queryAll('.lm-datagrid-th')[i];
const gripAt = (i: number) => thAt(i).querySelector('.lm-datagrid-resize') as HTMLElement;
const mouse = (type: string, x: number) => new MouseEvent(type, { bubbles: true, clientX: x, clientY: 5 });
/** jsdom has no layout: stub the th width where the px math needs it */
const setRect = (el: HTMLElement, width: number) => {
    el.getBoundingClientRect = () =>
        ({ top: 0, left: 0, width, height: 36, right: width, bottom: 36, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
};

describe('components/datagrid — column resize + customization', () => {
    it('RESIZE: dragging the handle resizes live (px) and fires oncolumnresize on release', () => {
        const resizes: [string, number][] = [];
        open({ oncolumnresize: (n: string, w: number) => resizes.push([n, w]) });
        expect(templateOf(headerEl())).toBe('70px 1fr 1fr 1fr');

        setRect(thAt(1), 150);
        gripAt(1).dispatchEvent(mouse('mousedown', 200));
        document.dispatchEvent(mouse('mousemove', 240)); // +40px
        expect(templateOf(headerEl())).toBe('70px 190px 1fr 1fr'); // px from now on
        expect(templateOf(renderedRows()[0])).toBe('70px 190px 1fr 1fr'); // body follows LIVE
        expect(resizes).toEqual([]); // release reports, moves do not

        document.dispatchEvent(mouse('mouseup', 240));
        expect(resizes).toEqual([['name', 190]]);
        expect(templateOf(headerEl())).toBe('70px 190px 1fr 1fr'); // sticks after release
    });

    it('RESIZE: the width clamps at the 60px minimum', () => {
        const resizes: [string, number][] = [];
        open({ oncolumnresize: (n: string, w: number) => resizes.push([n, w]) });
        setRect(thAt(1), 150);
        gripAt(1).dispatchEvent(mouse('mousedown', 200));
        document.dispatchEvent(mouse('mousemove', -400)); // way past zero
        expect(templateOf(headerEl())).toBe('70px 60px 1fr 1fr');
        document.dispatchEvent(mouse('mouseup', -400));
        expect(resizes).toEqual([['name', 60]]);
    });

    it('RESIZE: mousedown/click on the handle never reaches the sort handler', () => {
        const sorts: unknown[][] = [];
        open({ onsort: (...args: unknown[]) => sorts.push(args) });
        setRect(thAt(2), 120);
        gripAt(2).dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mouseup', 100));
        gripAt(2).click(); // the post-drag click a real browser synthesizes
        expect(sorts).toEqual([]);
        expect(firstName()).toBe('Person 1'); // order untouched
    });

    it('RESIZE: gestures never accumulate document listeners — even unmounting mid-drag', () => {
        const adds = vi.spyOn(document, 'addEventListener');
        const removes = vi.spyOn(document, 'removeEventListener');
        const drag = (spy: { mock: { calls: unknown[][] } }) =>
            spy.mock.calls.filter(([t]) => t === 'mousemove' || t === 'mouseup').length;
        try {
            open();
            setRect(thAt(1), 150);
            gripAt(1).dispatchEvent(mouse('mousedown', 100));
            document.dispatchEvent(mouse('mousemove', 120));
            // A second gesture BEFORE release: track() frees the first pair
            gripAt(2).dispatchEvent(mouse('mousedown', 100));
            expect(drag(adds)).toBe(4);
            expect(drag(removes)).toBe(2);
            handle!.unmount(); // mid-drag: listen() removes the armed pair automatically
            handle = null;
            expect(drag(removes)).toBe(4); // balanced — nothing leaked
        } finally {
            adds.mockRestore();
            removes.mockRestore();
        }
    });

    it('column.hidden: excluded from the header, the cells and the grid template', () => {
        open({
            data: makeRows(5),
            columns: [
                { name: 'id', title: 'ID', type: 'number', width: '70px' },
                { name: 'name', title: 'Name', hidden: true },
                { name: 'amount', title: 'Amount', type: 'number' },
            ] as Column[],
        });
        expect(handle!.queryAll('.lm-datagrid-th').map((t) => t.textContent!.trim())).toEqual(['ID', 'Amount']);
        expect(cellTexts(renderedRows()[0])).toEqual(['1', '1']); // no name cell
        expect(templateOf(headerEl())).toBe('70px 1fr');
        expect(templateOf(renderedRows()[0])).toBe('70px 1fr');
    });

    it('api.setColumn hides and shows a column at runtime', () => {
        const api = open({ data: makeRows(5), columns: freshColumns() });
        api.setColumn('name', { hidden: true });
        expect(handle!.queryAll('.lm-datagrid-th').map((t) => t.textContent!.trim())).toEqual(['ID', 'Amount']);
        expect(cellTexts(renderedRows()[0])).toHaveLength(2);
        expect(templateOf(headerEl())).toBe('70px 1fr');
        api.setColumn('name', { hidden: false });
        expect(handle!.queryAll('.lm-datagrid-th').map((t) => t.textContent!.trim())).toEqual(['ID', 'Name', 'Amount']);
        expect(cellTexts(renderedRows()[0])).toHaveLength(3);
        expect(templateOf(headerEl())).toBe('70px 1fr 1fr');
    });

    it('api.setColumn updates width and title live; a declared width supersedes a drag override', () => {
        const api = open({ data: makeRows(5), columns: freshColumns() });
        api.setColumn('id', { title: 'Ident', width: '120px' });
        expect(thAt(0).textContent!.trim()).toBe('Ident');
        expect(templateOf(headerEl())).toBe('120px 1fr 1fr');

        // Drag id down to 90px, then DECLARE 200px: the declaration wins
        setRect(thAt(0), 120);
        gripAt(0).dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mousemove', 70));
        document.dispatchEvent(mouse('mouseup', 70));
        expect(templateOf(headerEl())).toBe('90px 1fr 1fr');
        api.setColumn('id', { width: '200px' });
        expect(templateOf(headerEl())).toBe('200px 1fr 1fr');
    });

    it('column.headerrender: string or view content, sort arrow still appended', () => {
        open({
            data: makeRows(3),
            columns: [
                { name: 'id', title: 'ID', headerrender: (c: Column) => '#' + c.name },
                { name: 'name', headerrender: () => html`<button class="hdr-btn">menu</button>` },
            ] as Column[],
        });
        expect(thAt(0).textContent).toContain('#id');
        expect(thAt(1).querySelector('.hdr-btn')).not.toBeNull(); // a live view in the header
        thAt(0).click(); // custom content does not break sorting
        expect(thAt(0).querySelector('.lm-datagrid-arrow')!.getAttribute('data-dir')).toBe('asc');
    });

    it('column.class lands on body cells of that column only', () => {
        open({
            data: makeRows(3),
            columns: [
                { name: 'amount', title: 'Amount', type: 'number', class: 'money' },
                { name: 'active', title: 'Active', type: 'checkbox', class: 'flag' },
            ] as Column[],
        });
        const cells = renderedRows()[0].querySelectorAll('.lm-datagrid-cell');
        expect(cells[0].className).toContain('money');
        expect(cells[1].className).toContain('flag'); // checkbox cells too
        expect(cells[0].className).not.toContain('flag');
        expect(thAt(0).className).not.toContain('money'); // headers untouched
    });

    it('onrowclick reports (row, event)', () => {
        const clicks: [Record<string, unknown>, Event][] = [];
        open({ onrowclick: (row: Record<string, unknown>, e: Event) => clicks.push([row, e]) });
        renderedRows()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(clicks).toHaveLength(1);
        expect(clicks[0][0].id).toBe(1); // MY row object, not a copy
        expect(clicks[0][1]).toBeInstanceOf(MouseEvent);
    });
});

// ---- v5 parity: zebra, resizable, setValue, page/search events, remote --

/** The fetch chain hops several microtasks — a macrotask flushes it */
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Stub fetch with a body factory keyed on the requested url */
const stubFetch = (body: (url: string) => unknown) => {
    const mock = vi.fn(async (url: string) => ({ ok: true, json: async () => body(url) }) as unknown as Response);
    vi.stubGlobal('fetch', mock);
    return mock;
};

describe('components/datagrid — v5 parity surface', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('zebra: every second window row carries the stripe class', () => {
        open({ data: makeRows(5), zebra: true });
        const striped = renderedRows().map((r) => r.className.includes('lm-datagrid-zebra'));
        expect(striped).toEqual([false, true, false, true, false]);
    });

    it('zebra off (the default): no stripe classes anywhere', () => {
        open({ data: makeRows(5) });
        expect(handle!.queryAll('.lm-datagrid-zebra')).toHaveLength(0);
    });

    it('zebra stripes follow the VIEW index across virtual scrolling', () => {
        open({ zebra: true });
        scrollTo(3600); // window starts at view index 96 (even) — stripe stays on odd
        const striped = renderedRows().map((r) => r.className.includes('lm-datagrid-zebra'));
        expect(striped[0]).toBe(false); // view index 96
        expect(striped[1]).toBe(true); // view index 97
    });

    it('resizable: true by default (v6 behavior kept), false hides the handles', () => {
        open({ data: makeRows(3) });
        expect(handle!.queryAll('.lm-datagrid-resize')).toHaveLength(4);
        handle!.unmount();
        handle = null;
        open({ data: makeRows(3), resizable: false });
        expect(handle!.queryAll('.lm-datagrid-resize')).toHaveLength(0);
    });

    it('resizable toggles LIVE through a state', () => {
        const resizable = store(true);
        open({ data: makeRows(3), resizable });
        expect(handle!.queryAll('.lm-datagrid-resize')).toHaveLength(4);
        resizable.value = false;
        expect(handle!.queryAll('.lm-datagrid-resize')).toHaveLength(0);
        resizable.value = true;
        expect(handle!.queryAll('.lm-datagrid-resize')).toHaveLength(4);
    });

    it('api.setValue(x, y, value): column INDEX, updates the cell + fires onchange', () => {
        const changes: unknown[][] = [];
        const data = makeRows(5);
        const api = open({ data, onchange: (...args: unknown[]) => changes.push(args) });
        api.setValue(2, 0, 500); // column 2 = amount, row 0
        expect(data[0].amount).toBe(500); // the CALLER's object was mutated
        expect(changes).toEqual([[data[0], 'amount', 500, 1]]);
        expect(cellTexts(renderedRows()[0])[2]).toBe('500'); // window re-rendered
    });

    it('api.setValue accepts the column NAME too (v5)', () => {
        const changes: unknown[][] = [];
        const data = makeRows(5);
        const api = open({ data, onchange: (...args: unknown[]) => changes.push(args) });
        api.setValue('name', 1, 'Renamed');
        expect(data[1].name).toBe('Renamed');
        expect(changes).toEqual([[data[1], 'name', 'Renamed', 'Person 2']]);
        expect(cellTexts(renderedRows()[1])[1]).toBe('Renamed');
    });

    it('api.setValue out of range is a no-op', () => {
        const changes: unknown[][] = [];
        const data = makeRows(2);
        const api = open({ data, onchange: (...args: unknown[]) => changes.push(args) });
        api.setValue(99, 0, 'x');
        api.setValue(0, 99, 'x');
        expect(changes).toEqual([]);
    });

    it('onchangepage fires on button clicks and api.page — only when the page MOVES', () => {
        const pages: number[] = [];
        const api = open({ data: makeRows(45), pagination: 20, onchangepage: (p: number) => pages.push(p) });
        const buttons = () => handle!.queryAll('.lm-datagrid-pages button');
        buttons()[2].click(); // page "2" → index 1
        buttons()[buttons().length - 1].click(); // next → index 2
        buttons()[buttons().length - 1].click(); // next again: clamped, no move
        api.page(0);
        api.page(0); // already there: silent
        expect(pages).toEqual([1, 2, 0]);
    });

    it('onsearch fires with (query, total) from the box and api.setSearch', () => {
        const searches: [string, number][] = [];
        const api = open({ search: true, onsearch: (q: string, n: number) => searches.push([q, n]) });
        const input = handle!.query('.lm-datagrid-search') as HTMLInputElement;
        input.value = 'Person 99';
        input.dispatchEvent(new Event('input'));
        api.setSearch('');
        expect(searches).toEqual([
            ['Person 99', 11], // 'Person 99' + 990..999
            ['', 1000],
        ]);
    });

    it('a search resets the page and reports it through onchangepage', () => {
        const pages: number[] = [];
        const api = open({ data: makeRows(45), pagination: 20, onchangepage: (p: number) => pages.push(p) });
        api.page(2);
        api.setSearch('Person'); // matches everything, but page snaps back
        api.setSearch('Person'); // page already 0: no page event
        expect(pages).toEqual([2, 0]);
    });

    it('url (no remote): fetches ONCE on mount when data is empty, rows become local data', async () => {
        const mock = stubFetch(() => makeRows(3));
        open({ data: [], url: '/data' });
        await flush();
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock.mock.calls[0][0]).toBe('/data'); // no query params without remote
        expect(renderedRows()).toHaveLength(3);
        expect(firstName()).toBe('Person 1');
    });

    it('url: a { result } envelope unwraps like v5', async () => {
        stubFetch(() => ({ result: makeRows(2), total: 2 }));
        open({ data: [], url: '/data' });
        await flush();
        expect(renderedRows()).toHaveLength(2);
    });

    it('url: rows supplied up front suppress the mount fetch (v5 onload)', async () => {
        const mock = stubFetch(() => makeRows(3));
        open({ data: makeRows(5), url: '/data' });
        await flush();
        expect(mock).not.toHaveBeenCalled();
        expect(renderedRows()).toHaveLength(5);
    });

    it('REMOTE: the server owns paging — ?pagination=&page=, res.total drives the pager', async () => {
        const all = makeRows(45);
        const mock = stubFetch((url) => {
            const p = Number(new URLSearchParams(url.split('?')[1]).get('page'));
            return { result: all.slice(p * 20, p * 20 + 20), total: 45 };
        });
        const pages: number[] = [];
        open({ data: [], url: '/api', remote: true, pagination: 20, onchangepage: (p: number) => pages.push(p) });
        await flush();
        expect(mock.mock.calls[0][0]).toBe('/api?pagination=20&page=0');
        expect(renderedRows()).toHaveLength(20);
        expect(firstName()).toBe('Person 1');
        // Caller-owned total: 45 rows the client never saw
        expect(handle!.query('.lm-datagrid-pageinfo')!.textContent).toBe('1–20 of 45 rows');
        const buttons = () => handle!.queryAll('.lm-datagrid-pages button');
        expect(buttons().map((b) => b.textContent)).toEqual(['‹', '1', '2', '3', '›']);

        buttons()[2].click(); // page 2 → re-fetch, not a local slice
        await flush();
        expect(mock.mock.calls[1][0]).toBe('/api?pagination=20&page=1');
        expect(firstName()).toBe('Person 21');
        expect(handle!.query('.lm-datagrid-pageinfo')!.textContent).toBe('21–40 of 45 rows');
        expect(pages).toEqual([1]);
    });

    it('REMOTE: search delegates with &term= and fires onsearch with the server total', async () => {
        const mock = stubFetch((url) => {
            const term = new URLSearchParams(url.split('?')[1]).get('term');
            return term ? { result: makeRows(2), total: 2 } : { result: makeRows(20), total: 45 };
        });
        const searches: [string, number][] = [];
        const api = open({
            data: [],
            url: '/api',
            remote: true,
            pagination: 20,
            search: true,
            onsearch: (q: string, n: number) => searches.push([q, n]),
        });
        await flush();
        api.setSearch('bob');
        await flush();
        expect(mock.mock.calls[1][0]).toBe('/api?pagination=20&page=0&term=bob');
        expect(renderedRows()).toHaveLength(2);
        expect(searches).toEqual([['bob', 2]]); // AFTER the response settled
        expect(handle!.query('.lm-datagrid-count')!.textContent).toContain('2 rows');
    });

    it('REMOTE: sort delegates with &orderBy=&asc= instead of sorting locally', async () => {
        const mock = stubFetch(() => ({ result: makeRows(20), total: 45 }));
        open({ data: [], url: '/api', remote: true, pagination: 20 });
        await flush();
        handle!.queryAll('.lm-datagrid-th')[1].click(); // sort name asc
        await flush();
        expect(mock.mock.calls[1][0]).toBe('/api?pagination=20&page=0&orderBy=name&asc=true');
        handle!.queryAll('.lm-datagrid-th')[1].click(); // desc
        await flush();
        expect(mock.mock.calls[2][0]).toBe('/api?pagination=20&page=0&orderBy=name&asc=false');
    });

    it('REMOTE: a failed request logs and keeps the grid alive', async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response)
            );
            open({ data: [], url: '/api', remote: true, pagination: 20 });
            await flush();
            expect(errors).toHaveBeenCalled();
            expect(handle!.query('.lm-datagrid-empty')).not.toBeNull();
        } finally {
            errors.mockRestore();
        }
    });
});
