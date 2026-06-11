/**
 * <Kanban /> — the cross-list keyed-diff probe. The headline assertion:
 * a card's DOM element is THE SAME NODE OBJECT after moving to another
 * column (api or drag). The board renders all cards in one flat keyed
 * list (columns are CSS grid tracks), because the engine's keyed diff
 * is scoped per list — nested per-column lists would rebuild on a
 * cross-column move.
 *
 * Geometry: jsdom has no layout, so drop hit-testing (column by x,
 * slot by card midpoints in y) runs on setRect() stubs.
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
const column = (id: string) => handle!.query(`[data-column=${id}]`)!;
const styleOf = (el: Element) => el.getAttribute('style') || '';
/** Which column a card sits in = its grid-column track ↔ the shell's */
const columnOf = (el: Element) => {
    const track = (styleOf(el).match(/grid-column:(\d+)/) || [])[1];
    const shell = handle!
        .queryAll('.lm-kanban-column')
        .find((s) => (styleOf(s).match(/grid-column:(\d+)/) || [])[1] === track);
    return shell?.getAttribute('data-column');
};
const rowOf = (el: Element) => Number((styleOf(el).match(/grid-row:(\d+)/) || [])[1]);

/** Stub board geometry: columns 200px wide at x = ci*210, cards 80px tall */
const layout = () => {
    const data = ['todo', 'doing', 'done'];
    data.forEach((id, ci) => {
        setRect(column(id), { left: ci * 210, top: 0, width: 200, height: 600 });
    });
    for (const el of cards()) {
        const track = Number((styleOf(el).match(/grid-column:(\d+)/) || [])[1]) - 1;
        const row = rowOf(el) - 2;
        setRect(el, { left: track * 210 + 10, top: 44 + row * 90, width: 180, height: 80 });
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
        // todo's cards stack on rows 2,3,4 of track 1
        expect(columnOf(card('c1'))).toBe('todo');
        expect(rowOf(card('c1'))).toBe(2);
        expect(rowOf(card('c2'))).toBe(3);
        expect(rowOf(card('c3'))).toBe(4);
        expect(columnOf(card('c4'))).toBe('doing');
    });

    it('renders description, tags and the accent color', () => {
        open();
        expect(card('c1').querySelector('.lm-kanban-card-description')!.textContent).toBe('Sketch the contract');
        expect([...card('c3').querySelectorAll('.lm-kanban-tag')].map((el) => el.textContent)).toEqual(['docs', 'low']);
        expect(styleOf(card('c1'))).toContain('--lm-kanban-accent:#f59e0b');
        expect(card('c2').querySelector('.lm-kanban-card-description')).toBeNull();
        expect(card('c2').querySelector('.lm-kanban-card-tags')).toBeNull();
    });

    it('empty columns render an empty shell (count 0, no cards in the track)', () => {
        open();
        expect(column('done')).not.toBeNull();
        const doneTrack = (styleOf(column('done')).match(/grid-column:(\d+)/) || [])[1];
        const inDone = cards().filter((el) => (styleOf(el).match(/grid-column:(\d+)/) || [])[1] === doneTrack);
        expect(inDone).toHaveLength(0);
    });

    it('mutate the data in place + touch() re-renders (the documented idiom)', () => {
        const data = store(makeData());
        handle = t(Kanban, { data });
        data.value[2].cards.push({ id: 'c9', title: 'Landed' });
        data.touch();
        expect(card('c9')).not.toBeNull();
        expect(columnOf(card('c9'))).toBe('done');
        expect(handle!.queryAll('.lm-kanban-column-count').map((el) => el.textContent)).toEqual(['3', '1', '1']);
    });
});

describe('components/kanban — KEYED IDENTITY (the headline)', () => {
    it('a card element SURVIVES a cross-column move: same node object, new column', () => {
        const api = open();
        const el = card('c2'); // capture the element
        api.moveCard('c2', 'done', 0);
        const after = card('c2');
        expect(columnOf(after)).toBe('done'); // now under the other column
        expect(after).toBe(el); // THE assertion: identity preserved, DOM moved not rebuilt
        expect(el.isConnected).toBe(true);
    });

    it('within-column reorder keeps every card node', () => {
        const api = open();
        const before = { c1: card('c1'), c2: card('c2'), c3: card('c3') };
        api.moveCard('c3', 'todo', 0); // c3 to the top
        expect(rowOf(card('c3'))).toBe(2);
        expect(rowOf(card('c1'))).toBe(3);
        expect(rowOf(card('c2'))).toBe(4);
        expect(card('c1')).toBe(before.c1);
        expect(card('c2')).toBe(before.c2);
        expect(card('c3')).toBe(before.c3);
    });

    it('column reorder MOVES the column shells (columns are keyed too)', () => {
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
        expect(column('todo')).toBe(todo); // same shells, new tracks
        expect(column('done')).toBe(done);
        expect(styleOf(column('done'))).toContain('grid-column:1');
        expect(columnOf(card('c1'))).toBe('todo'); // cards follow their column's track
    });

    it('removing a card leaves every other node untouched', () => {
        const api = open();
        const keep = { c1: card('c1'), c3: card('c3'), c4: card('c4') };
        const gone = card('c2');
        api.removeCard('c2');
        expect(card('c2')).toBeNull();
        expect(gone.isConnected).toBe(false);
        expect(card('c1')).toBe(keep.c1);
        expect(card('c3')).toBe(keep.c3);
        expect(card('c4')).toBe(keep.c4);
        expect(rowOf(card('c3'))).toBe(3); // c3 moved up a slot
    });
});

describe('components/kanban — api + events', () => {
    it('api.addCard appends and fires onchange with the data', () => {
        const changes: unknown[] = [];
        const data = makeData();
        const api = open({ data, onchange: (d: unknown) => changes.push(d) });
        api.addCard('doing', { id: 'c7', title: 'New work' });
        expect(columnOf(card('c7'))).toBe('doing');
        expect(rowOf(card('c7'))).toBe(3);
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
    it('drag commits a cross-column move: indicator, data, events, and the SAME node', () => {
        const moves: unknown[][] = [];
        const changes: unknown[] = [];
        const data = makeData();
        open({ data, oncardmove: (...a: unknown[]) => moves.push(a), onchange: (d: unknown) => changes.push(d) });
        layout();
        const el = card('c1');

        mouse('mousedown', 100, 80, el);
        mouse('mousemove', 320, 60); // over 'doing', above c4's midpoint (y=178)
        expect(moves).toHaveLength(0); // preview only
        const indicator = handle!.query('.lm-kanban-indicator')!;
        expect(indicator).not.toBeNull();
        expect(styleOf(indicator)).toContain('grid-column:2');
        expect(styleOf(indicator)).toContain('grid-row:2'); // slot 0 of doing
        expect(el.className).toContain('lm-kanban-card-dragging');
        expect(styleOf(el)).toContain('transform:translate(220px,-20px)'); // follows the mouse

        mouse('mouseup', 320, 60);
        expect(data[1].cards.map((c) => c.id)).toEqual(['c1', 'c4']);
        expect(data[0].cards.map((c) => c.id)).toEqual(['c2', 'c3']);
        expect(moves).toEqual([['c1', 'todo', 'doing', 0]]);
        expect(changes).toHaveLength(1);
        expect(handle!.query('.lm-kanban-indicator')).toBeNull(); // gone after the drop
        expect(card('c1')).toBe(el); // identity survives the DRAG path too
        expect(columnOf(el)).toBe('doing');
        expect(el.className).not.toContain('lm-kanban-card-dragging');
    });

    it('drag reorders within a column by card midpoints', () => {
        const data = makeData();
        open({ data });
        layout();
        // c1 sits at rows 44..124; drag below c3's midpoint (y > 44+2*90+40)
        mouse('mousedown', 100, 80, card('c1'));
        mouse('mousemove', 100, 320);
        const indicator = handle!.query('.lm-kanban-indicator')!;
        expect(styleOf(indicator)).toContain('grid-row:5'); // the end slot
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
        expect(styleOf(handle!.query('.lm-kanban-indicator')!)).toContain('grid-column:3');
        mouse('mouseup', 500, 300);
        expect(data[2].cards.map((c) => c.id)).toEqual(['c4']);
        expect(data[1].cards).toEqual([]);
        expect(moves).toEqual([['c4', 'doing', 'done', 0]]);
        expect(card('c4')).toBe(el);
        expect(columnOf(el)).toBe('done');
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
        expect(handle!.query('.lm-kanban-indicator')).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(handle!.query('.lm-kanban-indicator')).toBeNull();
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
        expect(handle!.query('.lm-kanban-indicator')).toBeNull();
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
        el.click(); // a genuine later click
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
            spy.mock.calls.filter(([t]) => t === 'mousemove' || t === 'mouseup' || t === 'keydown').length;
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
            mouse('mousedown', 320, 60, card('c1'));
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
