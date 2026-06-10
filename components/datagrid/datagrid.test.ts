/**
 * <Datagrid /> — the virtualized big-data grid. jsdom has no layout,
 * but the window math is driven by the height/rowheight PROPS, so the
 * virtualization is fully testable: row counts, window shifts, canvas
 * height, plus sort/search/select/edit/touch() semantics.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Datagrid, { type Column } from '@lemonadejs/datagrid';

type Api = {
    getSelected(): Record<string, unknown>[];
    setSearch(q: string): void;
    sort(name: string, dir?: 1 | -1 | null): void;
    page(p: number): void;
    refresh(): void;
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
    handle = t(Datagrid as never, {
        data: makeRows(1000),
        columns,
        height: 360,
        rowheight: 36,
        ...props,
        ref: (a: Api) => (api = a),
    } as never);
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
        expect(verify(Datagrid as never).pass).toBe(true);
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

    it('inline edit: dblclick → input, Enter commits, mutates MY row and fires onchange', () => {
        const changes: unknown[][] = [];
        const data = makeRows(10);
        open({ data, onchange: (...args: unknown[]) => changes.push(args) });

        const amountCell = renderedRows()[0].querySelectorAll('.lm-datagrid-cell')[2] as HTMLElement;
        amountCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const editor = handle!.query('.lm-datagrid-editor') as HTMLInputElement;
        expect(editor).not.toBeNull();
        editor.value = '777';
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
        const editor = handle!.query('.lm-datagrid-editor') as HTMLInputElement;
        editor.value = '999';
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(data[0].amount).toBe(1);
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

    it('pagination mode slices pages with footer controls', () => {
        const api = open({ data: makeRows(45), pagination: 20 });
        expect(renderedRows()).toHaveLength(20);
        expect(handle!.query('.lm-datagrid-footer')!.textContent).toContain('1 / 3');

        handle!.queryAll('.lm-datagrid-footer button')[1].click(); // next
        expect(firstName()).toBe('Person 21');
        api.page(2);
        expect(renderedRows()).toHaveLength(5); // last page remainder
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
