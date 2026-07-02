/**
 * In-page real-browser probe for <Kanban /> — drag and drop. jsdom can't
 * drive this: drop hit-testing reads live getBoundingClientRect. The board
 * is per-column flex stacks (gapless): a cross-column drag RE-PARENTS the
 * card into the target column; a within-column reorder is a KEYED move (same
 * DOM node). Results in #lm-probe for scripts/chrome-probe.mjs.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Kanban, { type KanbanColumn, type KanbanCard } from '@lemonadejs/kanban';

type Api = {
    addCard(columnId: string | number, card: KanbanCard): void;
    removeCard(cardId: string | number): void;
    moveCard(cardId: string | number, columnId: string | number, index: number): void;
};

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const card = (id: string) => document.querySelector('[data-card="' + id + '"]') as HTMLElement | null;
const colOf = (id: string) => card(id)?.closest('.lm-kanban-column')?.getAttribute('data-column') ?? null;
const colRect = (id: string) => (document.querySelector('.lm-kanban-column[data-column="' + id + '"]') as HTMLElement).getBoundingClientRect();
const center = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
};
const mouse = (target: EventTarget, type: string, x: number, y: number) =>
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
const cardIds = (colId: string) => (board.value.find((c) => c.id === colId)!.cards || []).map((c) => c.id);
const indicator = () => document.querySelector('.lm-kanban-indicator');
const indicatorCol = () => indicator()?.closest('.lm-kanban-column')?.getAttribute('data-column') ?? null;

const board = store<KanbanColumn[]>([
    { id: 'a', title: 'A', cards: [{ id: 'a1', title: 'A1' }, { id: 'a2', title: 'A2' }, { id: 'a3', title: 'A3' }] },
    { id: 'b', title: 'B', cards: [{ id: 'b1', title: 'B1' }] },
    { id: 'c', title: 'C (empty)', cards: [] },
]);

let moves: unknown[][] = [];
let clicks: (string | number)[] = [];
let api!: Api;

const App: Component = () => html`<div style="padding:20px">
    <${Kanban} data="${board}"
        ref="${(a: Api) => (api = a)}"
        oncardmove="${(...args: unknown[]) => moves.push(args)}"
        oncardclick="${(c: KanbanCard) => clicks.push(c.id)}" />
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 1. CROSS-COLUMN DRAG: a1 from column A into column B (re-parent)
    const a1 = card('a1')!;
    const start = center(a1);
    mouse(a1, 'mousedown', start.x, start.y);
    mouse(document, 'mousemove', start.x + 6, start.y + 6); // cross the 3px threshold
    await frame();
    const bTop = colRect('b');
    mouse(document, 'mousemove', Math.round(bTop.left + bTop.width / 2), Math.round(bTop.top + 56));
    await frame();

    log('dragged-card-has-dragging-class', a1.classList.contains('lm-kanban-card-dragging'));
    log('drop-indicator-shows-in-target-column', indicatorCol() === 'b', { col: indicatorCol() });

    mouse(document, 'mouseup', Math.round(bTop.left + bTop.width / 2), Math.round(bTop.top + 56));
    await frame();

    log('cross-column-move-data', cardIds('b').includes('a1') && !cardIds('a').includes('a1'), { a: cardIds('a'), b: cardIds('b') });
    log('oncardmove-fired-once', moves.length === 1 && moves[0][0] === 'a1' && moves[0][1] === 'a' && moves[0][2] === 'b', { moves });
    log('card-now-under-target-column', colOf('a1') === 'b', { col: colOf('a1') });
    log('indicator-clears-after-drop', !indicator());

    // ---- 2. WITHIN-COLUMN reorder keeps the SAME node (keyed move)
    moves = [];
    const a2 = card('a2')!; // column A now holds a2, a3
    const a3 = card('a3')!;
    const s2 = center(a2);
    mouse(a2, 'mousedown', s2.x, s2.y);
    mouse(document, 'mousemove', s2.x + 6, s2.y + 6);
    await frame();
    const belowA3 = center(a3);
    mouse(document, 'mousemove', belowA3.x, belowA3.y + 30); // past a3's midpoint
    await frame();
    mouse(document, 'mouseup', belowA3.x, belowA3.y + 30);
    await frame();
    log('within-column-reorder-data', cardIds('a').join(',') === 'a3,a2', { a: cardIds('a') });
    log('within-column-keeps-identity', card('a2') === a2 && colOf('a2') === 'a', { sameNode: card('a2') === a2 });

    // ---- 3. ESCAPE cancels a drag mid-flight
    moves = [];
    const a3b = card('a3')!;
    const s3 = center(a3b);
    mouse(a3b, 'mousedown', s3.x, s3.y);
    mouse(document, 'mousemove', s3.x + 6, s3.y + 6);
    await frame();
    const cRect = colRect('c');
    mouse(document, 'mousemove', Math.round(cRect.left + cRect.width / 2), Math.round(cRect.top + 56));
    await frame();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await frame();
    log('escape-cancels-move', colOf('a3') === 'a' && cardIds('c').length === 0 && moves.length === 0, { c: cardIds('c'), moves });
    log('escape-clears-drag-state', !document.querySelector('.lm-kanban-card-dragging') && !indicator());
    mouse(document, 'mouseup', Math.round(cRect.left + 10), Math.round(cRect.top + 10));
    await frame();

    // ---- 4. DRAG INTO AN EMPTY COLUMN: a2 → C
    moves = [];
    const a2b = card('a2')!;
    const sa2 = center(a2b);
    mouse(a2b, 'mousedown', sa2.x, sa2.y);
    mouse(document, 'mousemove', sa2.x + 6, sa2.y + 6);
    await frame();
    const cRect2 = colRect('c');
    mouse(document, 'mousemove', Math.round(cRect2.left + cRect2.width / 2), Math.round(cRect2.top + 56));
    await frame();
    mouse(document, 'mouseup', Math.round(cRect2.left + cRect2.width / 2), Math.round(cRect2.top + 56));
    await frame();
    log('drag-into-empty-column', cardIds('c').join(',') === 'a2' && colOf('a2') === 'c', { c: cardIds('c'), col: colOf('a2') });

    // ---- 5. CLICK (no movement) fires oncardclick, never oncardmove
    moves = [];
    clicks = [];
    const b1 = card('b1')!;
    const cb = center(b1);
    mouse(b1, 'mousedown', cb.x, cb.y);
    mouse(b1, 'mouseup', cb.x, cb.y);
    mouse(b1, 'click', cb.x, cb.y);
    await frame();
    log('click-without-move-fires-oncardclick', clicks.length === 1 && clicks[0] === 'b1' && moves.length === 0, { clicks, moves });

    // ---- 6. SUB-THRESHOLD movement (<3px) stays a click
    moves = [];
    clicks = [];
    const b1b = card('b1')!;
    const ca = center(b1b);
    mouse(b1b, 'mousedown', ca.x, ca.y);
    mouse(document, 'mousemove', ca.x + 2, ca.y);
    await frame();
    mouse(document, 'mouseup', ca.x + 2, ca.y);
    mouse(b1b, 'click', ca.x + 2, ca.y);
    await frame();
    log('sub-threshold-move-stays-click', clicks.length === 1 && clicks[0] === 'b1' && moves.length === 0, { clicks, moves });

    // ---- 7. api.moveCard mirrors a cross-column move
    moves = [];
    api.moveCard('b1', 'a', 0);
    await frame();
    log('api-move-updates-data', cardIds('a')[0] === 'b1' && !cardIds('b').includes('b1'), { a: cardIds('a'), b: cardIds('b') });
    log('api-move-fires-oncardmove', moves.length === 1 && moves[0][0] === 'b1' && moves[0][2] === 'a', { moves });

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
