/**
 * <Kanban /> — a drag-and-drop kanban board.
 *
 * LAYOUT: each column is its own vertical flex stack, so cards flow
 * naturally and uneven card heights never create gaps. (An earlier design
 * placed every card on ONE shared CSS grid to preserve a card's DOM node
 * across a cross-column move; that shared rows between columns, so a tall
 * card in one column left a gap in another. Cards here are plain, stateless
 * elements — losing the node on a cross-column move costs nothing — so the
 * simpler, gapless per-column layout wins.) Cards are keyed by id WITHIN
 * their column: a reorder inside a column is a keyed move (DOM identity
 * kept); a cross-column move re-parents the card.
 *
 *   - data: [{ id, title, cards: [{ id, title, description?, color?,
 *     tags? }] }] BY REFERENCE — the board mutates IN PLACE and calls
 *     touch(); your objects stay yours
 *   - drag a card with the mouse: the card lifts OUT of the flow (the
 *     others close ranks) and a ghost slot the card's size previews the
 *     exact landing position; Escape cancels mid-drag, events fire ONLY
 *     on commit
 *   - keyboard: cards are tabbable; Space (or the ⠿ grip button) picks
 *     the focused card up, arrows steer the ghost between slots and
 *     columns, Space/Enter drops through the SAME move path a mouse
 *     drop commits through, Escape cancels; Enter on an idle card fires
 *     oncardclick. While picked, clicking a destination card or a
 *     column's empty space drops there — a single-pointer, no-drag
 *     alternative. A polite live region narrates pick/move/drop
 *   - oncardmove(cardId, fromColumnId, toColumnId, index) on any move
 *     (drag or api.moveCard); onchange(data) on any data change;
 *     oncardclick(card) on click (never after a drag);
 *     oncarddblclick(card) on double-click
 *   - oncardmenu(card, event): passing a handler renders a ▾ menu button
 *     on every card — open anything from it (e.g. a <Contextmenu /> with
 *     your own options); without a handler the button does not exist
 *   - api: addCard(columnId, card), removeCard(cardId),
 *     moveCard(cardId, columnId, index), undo(), redo() — every
 *     board-initiated change (drag or api) is undoable
 *
 * Styling: lm-kanban-* classes, themable via CSS custom properties
 * (--lm-kanban-column-width, --lm-kanban-header-height, --lm-kanban-*).
 */

import { batch, component, css, html } from 'lemonadejs';

export interface KanbanCard {
    id: string | number;
    title: string;
    description?: string;
    /** Accent color: the card's left edge + its drop indicator */
    color?: string;
    tags?: string[];
    [key: string]: unknown;
}

export interface KanbanColumn {
    id: string | number;
    title: string;
    cards: KanbanCard[];
    [key: string]: unknown;
}

/** px of movement before a mousedown becomes a drag (clicks stay clicks) */
const DRAG_THRESHOLD = 3;

export const Kanban = component('kanban', {
    data: Array,                  // KanbanColumn[] BY REFERENCE (mutate + touch())
    oncardmove: Function,         // (cardId, fromColumnId, toColumnId, index)
    onchange: Function,           // (data) — after any board-initiated change
    oncardclick: Function,        // (card) — clicks, never drag commits
    oncarddblclick: Function,     // (card) — double-clicks on a card
    oncardmenu: Function,         // (card, event) — the card ⋮ button (rendered only with a handler)
    api: { addCard: Function, removeCard: Function, moveCard: Function, undo: Function, redo: Function },
}, (props, { state, onUnmount, listen }) => {
    // Tracked read: every render expression flows from here, so a
    // mutate-in-place + touch() re-runs exactly the bindings that read it
    const columns = () => (props.data.value as KanbanColumn[]) || [];
    // Untracked twin for event handlers and the api
    const peekColumns = () => (props.data.peek() as KanbanColumn[]) || [];
    const cardsOf = (col: KanbanColumn): KanbanCard[] => col.cards || [];

    // ---- live gesture state; the dragged card's mousedown rect rides
    // along: it turns position:fixed at that spot (leaving the flow so
    // the other cards close ranks) and the ghost inherits its height
    const drag = state<{
        id: string | number;
        dx: number;
        dy: number;
        left: number;
        top: number;
        width: number;
        height: number;
    } | null>(null);
    const drop = state<{ col: string | number; index: number } | null>(null);

    // ---- keyboard/single-pointer move mode: the picked card stays IN
    // the flow (unlike a drag) and the shared ghost previews the landing
    // slot; commit funnels through performMove — the same path as a
    // mouse drop. `live` feeds the SR-only status region.
    const pick = state<{ id: string | number; height: number } | null>(null);
    const live = state('');

    // ---- geometry comes from the LIVE DOM, never from a registry.
    // (An earlier design cached elements via refs; refs fire only when a
    // node is BUILT, and the keyed differ can REUSE a node when a card
    // returns to a column it left — the cache then pointed at the node
    // disposed in the detour column, so hit-testing skipped the card and
    // the drag pinned to a zero rect.)
    let rootEl: HTMLElement | null = null;
    const shellOf = (colId: string | number): HTMLElement | null =>
        rootEl?.querySelector(
            ':scope > .lm-kanban-column[data-column="' + String(colId) + '"] > .lm-kanban-column-cards'
        ) || null;
    const cardElsOf = (shell: HTMLElement): Map<string, HTMLElement> => {
        const byId = new Map<string, HTMLElement>();
        for (const el of shell.querySelectorAll(':scope > [data-card]')) {
            byId.set(el.getAttribute('data-card')!, el as HTMLElement);
        }
        return byId;
    };

    // ---- data ops (mutate in place + touch(): the array you passed is
    // the array we change — assignment would orphan your reference)
    const findCard = (id: string | number): { col: KanbanColumn; index: number } | null => {
        for (const col of peekColumns()) {
            const index = cardsOf(col).findIndex((c) => c.id === id);
            if (index >= 0) {
                return { col, index };
            }
        }
        return null;
    };

    // ---- undo/redo: every board-initiated change funnels through the
    // apply* helpers below, which return enough to INVERT the operation.
    // The recording wrappers push the inverse recipe; undo/redo replay
    // through the same helpers WITHOUT recording (so a replay never
    // rewrites history) and fire the same events a live change fires.
    type HistoryOp =
        | { type: 'move'; cardId: string | number; from: string | number; fromIndex: number; to: string | number; toIndex: number }
        | { type: 'add'; columnId: string | number; card: KanbanCard; index: number }
        | { type: 'remove'; columnId: string | number; card: KanbanCard; index: number };
    const past: HistoryOp[] = [];
    const future: HistoryOp[] = [];
    const record = (op: HistoryOp) => {
        past.push(op);
        future.length = 0; // a fresh change forks history: the redo tail dies
    };

    const applyMove = (cardId: string | number, toColumnId: string | number, index: number) => {
        const hit = findCard(cardId);
        const to = peekColumns().find((c) => c.id === toColumnId);
        if (!hit || !to) {
            return null;
        }
        const card = cardsOf(hit.col)[hit.index];
        hit.col.cards.splice(hit.index, 1);
        const at = Math.max(0, Math.min(index, cardsOf(to).length));
        to.cards.splice(at, 0, card);
        if (to === hit.col && at === hit.index) {
            return null; // splice round-trip: the array is back untouched — a no-op
        }
        props.data.touch();
        props.oncardmove?.(card.id, hit.col.id, to.id, at);
        props.onchange?.(peekColumns());
        return { from: hit.col.id, fromIndex: hit.index, to: to.id, toIndex: at };
    };

    const applyAdd = (columnId: string | number, card: KanbanCard, index?: number) => {
        const col = peekColumns().find((c) => c.id === columnId);
        if (!col) {
            return null;
        }
        const list = col.cards || (col.cards = []);
        const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
        list.splice(at, 0, card);
        props.data.touch();
        props.onchange?.(peekColumns());
        return at;
    };

    const applyRemove = (cardId: string | number) => {
        const hit = findCard(cardId);
        if (!hit) {
            return null;
        }
        const card = cardsOf(hit.col)[hit.index];
        hit.col.cards.splice(hit.index, 1);
        props.data.touch();
        props.onchange?.(peekColumns());
        return { columnId: hit.col.id, card, index: hit.index };
    };

    /** Shared by drag commits and api.moveCard — one move semantic */
    const performMove = (cardId: string | number, toColumnId: string | number, index: number): void => {
        const moved = applyMove(cardId, toColumnId, index);
        if (moved) {
            record({ type: 'move', cardId, ...moved });
        }
    };

    props.ref?.({
        addCard: (columnId: string | number, card: KanbanCard) => {
            const at = applyAdd(columnId, card);
            if (at !== null) {
                record({ type: 'add', columnId, card, index: at });
            }
        },
        removeCard: (cardId: string | number) => {
            const removed = applyRemove(cardId);
            if (removed) {
                record({ type: 'remove', ...removed });
            }
        },
        moveCard: performMove,
        undo: () => {
            const op = past.pop();
            if (!op) {
                return;
            }
            if (op.type === 'move') {
                // removing from the landing slot re-creates the pre-move
                // array, so the original index is valid again — same- and
                // cross-column moves invert identically
                applyMove(op.cardId, op.from, op.fromIndex);
            } else if (op.type === 'add') {
                applyRemove(op.card.id);
            } else {
                applyAdd(op.columnId, op.card, op.index);
            }
            future.push(op);
        },
        redo: () => {
            const op = future.pop();
            if (!op) {
                return;
            }
            if (op.type === 'move') {
                applyMove(op.cardId, op.to, op.toIndex);
            } else if (op.type === 'add') {
                applyAdd(op.columnId, op.card, op.index);
            } else {
                applyRemove(op.card.id);
            }
            past.push(op);
        },
    });

    // ---- drop target: column by x over the card stacks, slot by y over the
    // card midpoints (the dragged card is invisible to the math)
    const computeDrop = (x: number, y: number, dragId: string | number) => {
        for (const col of peekColumns()) {
            const shell = shellOf(col.id);
            if (!shell) {
                continue;
            }
            const r = shell.getBoundingClientRect();
            if (x < r.left || x >= r.right) {
                continue;
            }
            const els = cardElsOf(shell);
            const others = cardsOf(col).filter((c) => c.id !== dragId);
            let index = others.length;
            for (let i = 0; i < others.length; i++) {
                const el = els.get(String(others[i].id));
                if (!el) {
                    continue;
                }
                const cr = el.getBoundingClientRect();
                if (y < cr.top + cr.height / 2) {
                    index = i;
                    break;
                }
            }
            return { col: col.id, index };
        }
        return null;
    };

    // ---- the gesture: ONE in flight, armed per mousedown via listen()
    // (auto-removed on unmount; off() is idempotent). Escape cancels.
    let releaseGesture: (() => void) | null = null;
    let suppressClick = false;
    onUnmount(() => releaseGesture?.());

    const armDrag = (e: MouseEvent, card: KanbanCard) => {
        if (e.button) {
            return; // left button only
        }
        e.preventDefault();
        releaseGesture?.();
        suppressClick = false;
        const startX = e.clientX;
        const startY = e.clientY;
        // captured NOW from the node the mouse is actually on: once the
        // drag starts the card leaves the flow, pinned position:fixed at
        // this rect (+ the live dx/dy)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        let moved = false;

        const finish = (commit: boolean) => {
            offMove();
            offUp();
            offKey();
            releaseGesture = null;
            const target = drop.peek();
            if (moved) {
                suppressClick = true; // the click a browser synthesizes after mouseup
            }
            batch(() => {
                // One update pass: gesture reset + the committed move (touch)
                drag.value = null;
                drop.value = null;
                if (commit && moved && target) {
                    performMove(card.id, target.col, target.index);
                }
            });
        };
        const offMove = listen<MouseEvent>(document, 'mousemove', (ev) => {
            if (!moved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) {
                return;
            }
            moved = true;
            // The hot path: two writes per mousemove — one update pass
            batch(() => {
                if (pick.peek()) {
                    pick.value = null; // a real drag preempts a keyboard pick
                }
                drag.value = {
                    id: card.id,
                    dx: ev.clientX - startX,
                    dy: ev.clientY - startY,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                };
                drop.value = computeDrop(ev.clientX, ev.clientY, card.id);
            });
        });
        const offUp = listen(document, 'mouseup', () => finish(true));
        const offKey = listen<KeyboardEvent>(document, 'keydown', (ev) => {
            if (ev.key === 'Escape') {
                finish(false);
            }
        });
        releaseGesture = () => finish(false);
    };

    // ---- keyboard pick-up/move/drop (WCAG 2.1.1) + single-pointer
    // no-drag moves (WCAG 2.5.7). One pick at a time; a real mouse drag
    // preempts it. drop.index counts the NON-picked cards — exactly the
    // index applyMove splices at, so the ghost and the commit agree.
    const columnTitle = (colId: string | number): string =>
        String(peekColumns().find((c) => c.id === colId)?.title ?? '');
    /** Valid landing slots in a column = its cards minus the picked one */
    const slotCount = (colId: string | number, cardId: string | number): number => {
        const col = peekColumns().find((c) => c.id === colId);
        return col ? cardsOf(col).filter((c) => c.id !== cardId).length : 0;
    };
    const focusCard = (id: string | number) =>
        (rootEl?.querySelector('[data-card="' + String(id) + '"]') as HTMLElement | null)?.focus();

    const pickUp = (card: KanbanCard) => {
        const hit = findCard(card.id);
        if (!hit) {
            return;
        }
        const el = rootEl?.querySelector('[data-card="' + String(card.id) + '"]') as HTMLElement | null;
        batch(() => {
            pick.value = { id: card.id, height: el ? el.getBoundingClientRect().height : 0 };
            drop.value = { col: hit.col.id, index: hit.index }; // the pickup slot: dropping here is a no-op
        });
        live.value = String(card.title) + ' grabbed. Arrows move, Space or Enter drops, Escape cancels.';
        el?.focus();
    };

    /** Drop (commit) or cancel the pick — the keyboard twin of finish() */
    const settlePick = (commit: boolean) => {
        const p = pick.peek();
        if (!p) {
            return;
        }
        const target = drop.peek();
        const hit = findCard(p.id);
        const title = hit ? String(cardsOf(hit.col)[hit.index].title) : '';
        batch(() => {
            // One update pass: mode reset + the committed move (touch)
            pick.value = null;
            drop.value = null;
            if (commit && target) {
                performMove(p.id, target.col, target.index);
            }
        });
        live.value =
            commit && target
                ? title + ' dropped in ' + columnTitle(target.col) + ', position ' + (target.index + 1) + '.'
                : title + ' move cancelled.';
        // keep focus with the card — a cross-column drop re-parents its node
        focusCard(p.id);
    };

    const steerPick = (key: string) => {
        const p = pick.peek();
        const t = drop.peek();
        if (!p || !t) {
            return;
        }
        const cols = peekColumns();
        let ci = cols.findIndex((c) => c.id === t.col);
        let index = t.index;
        if (key === 'ArrowUp') {
            index -= 1;
        } else if (key === 'ArrowDown') {
            index += 1;
        } else if (key === 'ArrowLeft') {
            ci -= 1;
        } else {
            ci += 1;
        }
        if (ci < 0 || ci >= cols.length) {
            return; // the board edge: stay put
        }
        const max = slotCount(cols[ci].id, p.id);
        index = Math.max(0, Math.min(index, max));
        drop.value = { col: cols[ci].id, index };
        live.value = columnTitle(cols[ci].id) + ', position ' + (index + 1) + ' of ' + (max + 1) + '.';
    };

    const cardKey = (e: KeyboardEvent, card: KanbanCard) => {
        if (e.target !== e.currentTarget) {
            return; // the grip/menu buttons own their own keys
        }
        const picked = pick.peek()?.id === card.id;
        if (e.key === ' ') {
            e.preventDefault();
            if (picked) {
                settlePick(true);
            } else {
                pickUp(card);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (picked) {
                settlePick(true);
            } else {
                clickCard(card); // move mode: drops at this card; idle: oncardclick
            }
        } else if (picked && e.key.startsWith('Arrow')) {
            e.preventDefault();
            steerPick(e.key);
        } else if (picked && e.key === 'Escape') {
            e.preventDefault();
            settlePick(false);
        }
    };

    const clickCard = (card: KanbanCard) => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        const p = pick.peek();
        if (p) {
            // move mode: a click IS the single-pointer drop — land AT the
            // clicked card's slot (clicking the picked card cancels)
            if (p.id === card.id) {
                settlePick(false);
                return;
            }
            const hit = findCard(card.id);
            if (hit) {
                drop.value = {
                    col: hit.col.id,
                    index: cardsOf(hit.col).filter((c) => c.id !== p.id).findIndex((c) => c.id === card.id),
                };
            }
            settlePick(true);
            return;
        }
        props.oncardclick?.(card);
    };

    // ---- per-card style: order in the stack (data position, stable across
    // a drag). The DRAGGED card is pinned position:fixed at its mousedown
    // rect + the live dx/dy — out of the flow, so its column closes ranks
    // and the ghost slot is the only preview of where it lands
    const cardStyle = (card: KanbanCard, ri: number) => {
        const d = drag.value;
        const dragging = d && d.id === card.id;
        return css({
            order: ri * 2,
            '--lm-kanban-accent': card.color || false,
            position: dragging ? 'fixed' : false,
            left: dragging ? d!.left + 'px' : false,
            top: dragging ? d!.top + 'px' : false,
            width: dragging ? d!.width + 'px' : false,
            margin: dragging ? '0' : false,
            transform: dragging ? 'translate(' + d!.dx + 'px,' + d!.dy + 'px)' : false,
        });
    };

    const cardView = (card: KanbanCard, ri: number) =>
        html`<article class="lm-kanban-card ${() =>
            drag.value?.id === card.id
                ? 'lm-kanban-card-dragging'
                : pick.value?.id === card.id
                  ? 'lm-kanban-card-picked'
                  : ''}"
            key="${card.id}" data-card="${card.id}" tabindex="0"
            style="${() => cardStyle(card, ri)}"
            onmousedown="${(e: MouseEvent) => armDrag(e, card)}"
            onclick="${() => clickCard(card)}"
            ondblclick="${() => props.oncarddblclick?.(card)}"
            onkeydown="${(e: KeyboardEvent) => cardKey(e, card)}">
            <button type="button" class="lm-kanban-card-move"
                aria-label="Move card" aria-pressed="${() => (pick.value?.id === card.id ? 'true' : 'false')}"
                onmousedown="${(e: MouseEvent) => e.stopPropagation()}"
                ondblclick="${(e: MouseEvent) => e.stopPropagation()}"
                onclick="${(e: MouseEvent) => {
                    e.stopPropagation();
                    if (pick.peek()?.id === card.id) {
                        settlePick(false);
                    } else {
                        pickUp(card);
                    }
                }}">⠿</button>
            ${props.oncardmenu
                ? html`<button type="button" class="lm-kanban-card-menu"
                      aria-label="Card menu" aria-haspopup="menu"
                      onmousedown="${(e: MouseEvent) => e.stopPropagation()}"
                      ondblclick="${(e: MouseEvent) => e.stopPropagation()}"
                      onclick="${(e: MouseEvent) => {
                          e.stopPropagation();
                          props.oncardmenu?.(card, e);
                      }}">▾</button>`
                : ''}
            <div class="lm-kanban-card-title">${card.title}</div>
            ${card.description ? html`<div class="lm-kanban-card-description">${card.description}</div>` : ''}
            ${card.tags && card.tags.length
                ? html`<div class="lm-kanban-card-tags">${card.tags.map(
                      (tag) => html`<span class="lm-kanban-tag">${tag}</span>`
                  )}</div>`
                : ''}
        </article>`;

    return html`<div class="lm-kanban" ref="${(el: HTMLElement) => (rootEl = el)}">
        <div class="lm-kanban-live" role="status" aria-live="polite">${() => live.value}</div>
        ${() =>
            columns().map(
                (col) => html`<div class="lm-kanban-column" key="${col.id}" data-column="${col.id}">
                    <div class="lm-kanban-column-header">
                        <span class="lm-kanban-column-title">${col.title}</span>
                        <span class="lm-kanban-column-count">${cardsOf(col).length}</span>
                    </div>
                    <div class="lm-kanban-column-cards"
                        onclick="${(e: MouseEvent) => {
                            // move mode: clicking a column's EMPTY space (not a
                            // card) drops the picked card at the end — the
                            // single-pointer path into empty/short columns
                            const p = pick.peek();
                            if (p && e.target === e.currentTarget) {
                                drop.value = { col: col.id, index: slotCount(col.id, p.id) };
                                settlePick(true);
                            }
                        }}">
                        ${() => cardsOf(col).map((card, ri) => cardView(card, ri))}
                        ${() => {
                            // The ghost slot: a card-sized dashed box rendered
                            // ONLY in the active column, slotted via flex order.
                            // drop.index counts the NON-lifted cards, so map it
                            // to the data index of the card it lands before —
                            // the dragged card is out of the flow but keeps its
                            // data-based order, and this keeps the ghost honest
                            // for same-column drags too. Its own binding (reads
                            // drag + pick + drop) — a drag never rebuilds the
                            // keyed card list (which reads columns()). The
                            // KEYBOARD pick shares the ghost: same target
                            // state, same preview, same commit path.
                            const t = drop.value;
                            const d = drag.value;
                            const p = pick.value;
                            const liftedId = d ? d.id : p ? p.id : undefined;
                            if (!t || liftedId === undefined || t.col !== col.id) {
                                return '';
                            }
                            const list = cardsOf(col);
                            const before = list.filter((c) => c.id !== liftedId)[t.index];
                            const order = before ? list.indexOf(before) * 2 - 1 : list.length * 2;
                            const hit = findCard(liftedId);
                            const color = hit && cardsOf(hit.col)[hit.index].color;
                            const height = d ? d.height : p!.height;
                            return html`<div class="lm-kanban-ghost"
                                style="${css({
                                    order,
                                    height: height ? height + 'px' : false,
                                    '--lm-kanban-accent': color || false,
                                })}"></div>`;
                        }}
                    </div>
                </div>`
            )}
    </div>`;
});

export default Kanban;
