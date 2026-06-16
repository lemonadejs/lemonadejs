/**
 * <Kanban /> — per-column flex stacks. A card's column is its DOM parent;
 * its position in the stack is the flex `order` (data index × 2). Identity:
 * a reorder WITHIN a column is a keyed move (same node); a CROSS-column move
 * re-parents the card (new node) — cards are plain, stateless elements, so
 * that costs nothing and buys gapless natural columns.
 *
 * Geometry: jsdom has no layout, so drop hit-testing (column by x, slot by
 * card midpoints in y) runs on setRect() stubs.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify, setRect } from 'lemonadejs/test';
import Kanban, { type KanbanColumn, type KanbanCard } from '@lemonadejs/kanban';

type Api = {
    addCard(columnId: string | number, card: KanbanCard): void;
    removeCard(cardId: string | number): void;
    moveCard(cardId: string | number, columnId: string | number, index: number): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const makeData = (): KanbanColumn[] => [
    {
        id: 'todo',
        title: 'To do',
        cards: [
            { id: 'c1', title: 'Design the API', description: 'Sketch the contract', color: '#f59e0b', tags: ['design'] },
            { id: 'c2', title: 'Write the parser' },
            { id: 'c3', title: 'Ship the docs', tags: ['docs', 'low'] },
        ],
    },
    { id: 'doing', title: 'In progress', cards: [{ id: 'c4', title: 'Keyed diff' }] },
    { id: 'done', title: 'Done', cards: [] },
];

const open = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Kanban, {
        data: makeData(),
        ...props,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const card = (id: string) => handle!.query(`[data-card=${id}]`)!;
const cards = () => handle!.queryAll('.lm-kanban-card');
const column = (id: string) => handle!.query(`.lm-kanban-column[data-column=${id}]`)!;
const shell = (id: string) => column(id).querySelector('.lm-kanban-column-cards')!;
// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse it to the compact "a:b"
const styleOf = (el: Element) => (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';');
/** A card's column = its DOM ancestor column */
const colOf = (el: Element) => el.closest('.lm-kanban-column')?.getAttribute('data-column');
const orderOf = (el: Element) => Number((styleOf(el).match(/order:\s*(-?\d+)/) || [])[1]);
/** A card's slot index in its stack (card order = idx × 2) */
const idxOf = (el: Element) => orderOf(el) / 2;
const indicator = () => handle!.query('.lm-kanban-indicator');
const indicatorCol = () => indicator()!.closest('.lm-kanban-column')!.getAttribute('data-column');

const COLS = ['todo', 'doing', 'done'];
/** Stub board geometry: columns 200px wide at x = ci*210, cards 80px tall */
const layout = () => {
    COLS.forEach((id, ci) => {
        setRect(shell(id), { left: ci * 210, top: 0, width: 200, height: 600 });
    });
    for (const el of cards()) {
        const ci = COLS.indexOf(colOf(el)!);
        const idx = idxOf(el);
        setRect(el, { left: ci * 210 + 10, top: 44 + idx * 90, width: 180, height: 80 });
    }
};
const mouse = (type: string, x: number, y: number, target: Element | Document = document) =>
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));

describe('components/kanban — render', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Kanban).pass).toBe(true);
    });

    it('renders every column with title, live count, and its cards in order', () => {
        open();
        const titles = handle!.queryAll('.lm-kanban-column-title').map((el) => el.textContent);
        expect(titles).toEqual(['To do', 'In progress', 'Done']);
        const counts = handle!.queryAll('.lm-kanban-column-count').map((el) => el.textContent);
        expect(counts).toEqual(['3', '1', '0']);
        expect(cards()).toHaveLength(4);
        // todo's cards stack at slots 0,1,2
        expect(colOf(card('c1'))).toBe('todo');
        expect(idxOf(card('c1'))).toBe(0);
        expect(idxOf(card('c2'))).toBe(1);
        expect(idxOf(card('c3'))).toBe(2);
        expect(colOf(card('c4'))).toBe('doing');
    });

    it('renders description, tags and the accent color', () => {
        open();
        expect(card('c1').querySelector('.lm-kanban-card-description')!.textContent).toBe('Sketch the contract');
        expect([...card('c3').querySelectorAll('.lm-kanban-tag')].map((el) => el.textContent)).toEqual(['docs', 'low']);
        expect(styleOf(card('c1'))).toContain('--lm-kanban-accent:#f59e0b');
        expect(card('c2').querySelector('.lm-kanban-card-description')).toBeNull();
        expect(card('c2').querySelector('.lm-kanban-card-tags')).toBeNull();
    });

    it('empty columns render an empty stack (count 0, no cards)', () => {
        open();
        expect(column('done')).not.toBeNull();
        expect(shell('done').querySelectorAll('.lm-kanban-card')).toHaveLength(0);
        expect(cards().filter((el) => colOf(el) === 'done')).toHaveLength(0);
    });

    it('mutate the data in place + touch() re-renders (the documented idiom)', () => {
        const data = store(makeData());
        handle = t(Kanban, { data });
        data.value[2].cards.push({ id: 'c9', title: 'Landed' });
        data.touch();
        expect(card('c9')).not.toBeNull();
        expect(colOf(card('c9'))).toBe('done');
        expect(handle!.queryAll('.lm-kanban-column-count').map((el) => el.textContent)).toEqual(['3', '1', '1']);
    });
});

describe('components/kanban — identity', () => {
    it('a cross-column move re-parents the card (new node, correct column)', () => {
        const api = open();
        const el = card('c2'); // capture the element
        api.moveCard('c2', 'done', 0);
        const after = card('c2');
        expect(colOf(after)).toBe('done'); // now under the other column
        expect(after).not.toBe(el); // re-parented: a fresh node in the new column
        expect(el.isConnected).toBe(false); // the old node is gone
    });

    it('within-column reorder keeps every card node (keyed move)', () => {
        const api = open();
        const before = { c1: card('c1'), c2: card('c2'), c3: card('c3') };
        api.moveCard('c3', 'todo', 0); // c3 to the top
        expect(idxOf(card('c3'))).toBe(0);
        expect(idxOf(card('c1'))).toBe(1);
        expect(idxOf(card('c2'))).toBe(2);
        expect(card('c1')).toBe(before.c1);
        expect(card('c2')).toBe(before.c2);
        expect(card('c3')).toBe(before.c3); // SAME node, reordered
    });

    it('column reorder MOVES the column shells (columns are keyed)', () => {
        const data = store(makeData());
        handle = t(Kanban, { data });
        const todo = column('todo');
        const done = column('done');
        data.value.reverse(); // [done, doing, todo]
        data.touch();
        expect(handle!.queryAll('.lm-kanban-column-title').map((el) => el.textContent)).toEqual([
            'Done',
            'In progress',
            'To do',
        ]);
        expect(column('todo')).toBe(todo); // same shells, moved
        expect(column('done')).toBe(done);
        expect(colOf(card('c1'))).toBe('todo'); // cards stay under their column
    });

    it('removing a card leaves every other node in its column untouched', () => {
        const api = open();
        const keep = { c1: card('c1'), c3: card('c3'), c4: card('c4') };
        const gone = card('c2');
        api.removeCard('c2');
        expect(card('c2')).toBeNull();
        expect(gone.isConnected).toBe(false);
        expect(card('c1')).toBe(keep.c1);
        expect(card('c3')).toBe(keep.c3);
        expect(card('c4')).toBe(keep.c4);
        expect(idxOf(card('c3'))).toBe(1); // c3 moved up a slot
    });
});

describe('components/kanban — api + events', () => {
    it('api.addCard appends and fires onchange with the data', () => {
        const changes: unknown[] = [];
        const data = makeData();
        const api = open({ data, onchange: (d: unknown) => changes.push(d) });
        api.addCard('doing', { id: 'c7', title: 'New work' });
        expect(colOf(card('c7'))).toBe('doing');
        expect(idxOf(card('c7'))).toBe(1);
        expect(data[1].cards.map((c) => c.id)).toEqual(['c4', 'c7']); // MY array mutated
        expect(changes).toEqual([data]);
    });

    it('api.moveCard mutates my arrays, clamps the index, and fires oncardmove + onchange', () => {
        const moves: unknown[][] = [];
        const changes: unknown[] = [];
        const data = makeData();
        const api = open({
            data,
            oncardmove: (...a: unknown[]) => moves.push(a),
            onchange: (d: unknown) => changes.push(d),
        });
        api.moveCard('c1', 'doing', 99); // clamped to the end
        expect(data[0].cards.map((c) => c.id)).toEqual(['c2', 'c3']);
        expect(data[1].cards.map((c) => c.id)).toEqual(['c4', 'c1']);
        expect(moves).toEqual([['c1', 'todo', 'doing', 1]]);
        expect(changes).toHaveLength(1);
    });

    it('a no-op move (same column, same index) fires nothing', () => {
        const moves: unknown[] = [];
        const changes: unknown[] = [];
        const data = makeData();
        const api = open({ data, oncardmove: (...a: unknown[]) => moves.push(a), onchange: (d: unknown) => changes.push(d) });
        api.moveCard('c2', 'todo', 1); // where it already is
        expect(data[0].cards.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
        expect(moves).toEqual([]);
        expect(changes).toEqual([]);
    });

    it('oncardclick reports the card object on a plain click', () => {
        const clicks: unknown[] = [];
        const data = makeData();
        open({ data, oncardclick: (c: unknown) => clicks.push(c) });
        card('c3').click();
        expect(clicks).toEqual([data[0].cards[2]]);
    });
});

describe('components/kanban — drag and drop', () => {
    it('drag commits a cross-column move: indicator, data, events', () => {
        const moves: unknown[][] = [];
        const changes: unknown[] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a), onchange: (d: unknown) => changes.push(d) });
        layout();
        const el = card('c1');

        mouse('mousedown', 100, 80, el);
        mouse('mousemove', 320, 60); // over 'doing', above c4's midpoint
        expect(moves).toHaveLength(0); // preview only
        expect(indicator()).not.toBeNull();
        expect(indicatorCol()).toBe('doing');
        expect(orderOf(indicator()!)).toBe(-1); // slot 0 of doing
        expect(el.className).toContain('lm-kanban-card-dragging');
        expect(styleOf(el)).toContain('transform:translate(220px,-20px)'); // follows the mouse

        mouse('mouseup', 320, 60);
        expect(data[1].cards.map((c) => c.id)).toEqual(['c1', 'c4']);
        expect(data[0].cards.map((c) => c.id)).toEqual(['c2', 'c3']);
        expect(moves).toEqual([['c1', 'todo', 'doing', 0]]);
        expect(changes).toHaveLength(1);
        expect(indicator()).toBeNull(); // gone after the drop
        expect(colOf(card('c1'))).toBe('doing'); // re-parented into the new column
        expect(el.isConnected).toBe(false);
    });

    it('drag reorders within a column by card midpoints', () => {
        const data = makeData();
        open({ data });
        layout();
        mouse('mousedown', 100, 80, card('c1'));
        mouse('mousemove', 100, 320); // below c3's midpoint
        expect(indicatorCol()).toBe('todo');
        expect(orderOf(indicator()!)).toBe(3); // the end slot (index 2 → 2*2-1)
        mouse('mouseup', 100, 320);
        expect(data[0].cards.map((c) => c.id)).toEqual(['c2', 'c3', 'c1']);
    });

    it('a drop into an EMPTY column lands at index 0', () => {
        const moves: unknown[][] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a) });
        layout();
        const el = card('c4');
        mouse('mousedown', 320, 80, el);
        mouse('mousemove', 500, 300); // over 'done' (x 420..620)
        expect(indicatorCol()).toBe('done');
        mouse('mouseup', 500, 300);
        expect(data[2].cards.map((c) => c.id)).toEqual(['c4']);
        expect(data[1].cards).toEqual([]);
        expect(moves).toEqual([['c4', 'doing', 'done', 0]]);
        expect(colOf(card('c4'))).toBe('done');
    });

    it('Escape cancels mid-drag: no mutation, no events, indicator gone', () => {
        const moves: unknown[] = [];
        const changes: unknown[] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a), onchange: (d: unknown) => changes.push(d) });
        layout();
        const el = card('c1');
        mouse('mousedown', 100, 80, el);
        mouse('mousemove', 320, 60);
        expect(indicator()).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(indicator()).toBeNull();
        expect(styleOf(el)).not.toContain('transform'); // snapped back
        expect(data[0].cards.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
        expect(moves).toEqual([]);
        expect(changes).toEqual([]);
        // and a later mouseup commits nothing
        mouse('mouseup', 320, 60);
        expect(moves).toEqual([]);
    });

    it('releasing outside every column is a no-op', () => {
        const moves: unknown[] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a) });
        layout();
        mouse('mousedown', 100, 80, card('c1'));
        mouse('mousemove', 2000, 80); // off the board
        expect(indicator()).toBeNull();
        mouse('mouseup', 2000, 80);
        expect(moves).toEqual([]);
        expect(data[0].cards).toHaveLength(3);
    });

    it('a drag never fires oncardclick; a plain click still does', () => {
        const clicks: unknown[] = [];
        open({ oncardclick: (c: KanbanCard) => clicks.push(c.id) });
        layout();
        const el = card('c2');
        mouse('mousedown', 100, 170, el);
        mouse('mousemove', 320, 60);
        mouse('mouseup', 320, 60);
        el.click(); // the click a browser synthesizes after mouseup
        expect(clicks).toEqual([]);
        card('c2').click(); // a genuine later click (c2 may be a fresh node)
        expect(clicks).toEqual(['c2']);
    });

    it('sub-threshold jitter stays a click, not a drag', () => {
        const moves: unknown[] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a) });
        layout();
        mouse('mousedown', 100, 80, card('c1'));
        mouse('mousemove', 101, 80); // 1px — under the threshold
        expect(handle!.query('.lm-kanban-card-dragging')).toBeNull();
        mouse('mouseup', 101, 80);
        expect(moves).toEqual([]);
        expect(data[0].cards.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    });

    it('gestures never accumulate document listeners — even unmounting MID-DRAG', () => {
        const adds = vi.spyOn(document, 'addEventListener');
        const removes = vi.spyOn(document, 'removeEventListener');
        const armed = (spy: { mock: { calls: unknown[][] } }) =>
            spy.mock.calls.filter(([type]) => type === 'mousemove' || type === 'mouseup' || type === 'keydown').length;
        try {
            open();
            layout();
            // a full gesture: armed 3 (move/up/key), released 3
            mouse('mousedown', 100, 80, card('c1'));
            mouse('mousemove', 320, 60);
            mouse('mouseup', 320, 60);
            expect(armed(adds)).toBe(3);
            expect(armed(removes)).toBe(3);
            // mid-drag unmount: armed 3 more, the unmount hook releases them
            mouse('mousedown', 320, 60, card('c4'));
            mouse('mousemove', 100, 80);
            expect(armed(adds)).toBe(6);
            expect(armed(removes)).toBe(3);
            handle!.unmount();
            handle = null;
            expect(armed(removes)).toBe(6); // balanced — nothing leaked
        } finally {
            adds.mockRestore();
            removes.mockRestore();
        }
    });
});
