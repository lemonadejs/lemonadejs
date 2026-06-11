/**
 * <Kanban /> — a drag-and-drop kanban board, and a deliberate stress
 * test for the v6 KEYED LIST DIFF under cross-list moves.
 *
 * THE ARCHITECTURE (and why it is unusual): keys are scoped PER LIST —
 * a card rendered inside "its column's" map leaves that keyed list when
 * it moves to another column, and the engine rebuilds it there. To make
 * card DOM identity survive cross-column moves (state, focus, armed
 * gestures, CSS transitions all ride on identity), every card on the
 * board lives in ONE flat keyed list; columns are CSS GRID TRACKS, and
 * each card is placed with grid-column/grid-row instead of DOM nesting.
 * A move — drag or api — changes coordinates on the SAME element.
 *
 *   - data: [{ id, title, cards: [{ id, title, description?, color?,
 *     tags? }] }] BY REFERENCE — the board mutates IN PLACE and calls
 *     touch(); your objects stay yours
 *   - drag a card with the mouse: a drop indicator marks the insertion
 *     slot, Escape cancels mid-drag, events fire ONLY on commit
 *   - oncardmove(cardId, fromColumnId, toColumnId, index) on any move
 *     (drag or api.moveCard); onchange(data) on any data change;
 *     oncardclick(card) on click (never after a drag)
 *   - api: addCard(columnId, card), removeCard(cardId),
 *     moveCard(cardId, columnId, index)
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

/** Cards start below the header track; +2 converts a card index to its grid row */
const ROW0 = 2;
/** px of movement before a mousedown becomes a drag (clicks stay clicks) */
const DRAG_THRESHOLD = 3;

export const Kanban = component('kanban', {
    data: Array,                  // KanbanColumn[] BY REFERENCE (mutate + touch())
    oncardmove: Function,         // (cardId, fromColumnId, toColumnId, index)
    onchange: Function,           // (data) — after any board-initiated change
    oncardclick: Function,        // (card) — clicks, never drag commits
    api: { addCard: Function, removeCard: Function, moveCard: Function },
}, (props, { state, onUnmount, listen }) => {
    // Tracked read: every render expression flows from here, so a
    // mutate-in-place + touch() re-runs exactly the bindings that read it
    const columns = () => (props.data.value as KanbanColumn[]) || [];
    // Untracked twin for event handlers and the api
    const peekColumns = () => (props.data.peek() as KanbanColumn[]) || [];
    const cardsOf = (col: KanbanColumn): KanbanCard[] => col.cards || [];

    // ---- live gesture state
    const drag = state<{ id: string | number; dx: number; dy: number } | null>(null);
    const drop = state<{ col: string | number; index: number } | null>(null);

    // ---- element registries for drop hit-testing (refs re-fire when a
    // keyed entry is rebuilt; stale nodes are skipped via isConnected)
    const shellEls = new Map<string | number, HTMLElement>();
    const cardEls = new Map<string | number, HTMLElement>();
    const liveEl = (map: Map<string | number, HTMLElement>, id: string | number) => {
        const el = map.get(id);
        return el && el.isConnected ? el : null;
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

    /** Shared by drag commits and api.moveCard — one move semantic */
    const performMove = (cardId: string | number, toColumnId: string | number, index: number): void => {
        const hit = findCard(cardId);
        const to = peekColumns().find((c) => c.id === toColumnId);
        if (!hit || !to) {
            return;
        }
        const card = cardsOf(hit.col)[hit.index];
        hit.col.cards.splice(hit.index, 1);
        const at = Math.max(0, Math.min(index, cardsOf(to).length));
        to.cards.splice(at, 0, card);
        if (to === hit.col && at === hit.index) {
            return; // splice round-trip: the array is back untouched — a no-op
        }
        props.data.touch();
        props.oncardmove?.(card.id, hit.col.id, to.id, at);
        props.onchange?.(peekColumns());
    };

    props.ref?.({
        addCard: (columnId: string | number, card: KanbanCard) => {
            const col = peekColumns().find((c) => c.id === columnId);
            if (!col) {
                return;
            }
            (col.cards || (col.cards = [])).push(card);
            props.data.touch();
            props.onchange?.(peekColumns());
        },
        removeCard: (cardId: string | number) => {
            const hit = findCard(cardId);
            if (!hit) {
                return;
            }
            hit.col.cards.splice(hit.index, 1);
            props.data.touch();
            props.onchange?.(peekColumns());
        },
        moveCard: performMove,
    });

    // ---- drop target: column by x over the shells, slot by y over the
    // card midpoints (the dragged card is invisible to the math)
    const computeDrop = (x: number, y: number, dragId: string | number) => {
        for (const col of peekColumns()) {
            const shell = liveEl(shellEls, col.id);
            if (!shell) {
                continue;
            }
            const r = shell.getBoundingClientRect();
            if (x < r.left || x >= r.right) {
                continue;
            }
            const others = cardsOf(col).filter((c) => c.id !== dragId);
            let index = others.length;
            for (let i = 0; i < others.length; i++) {
                const el = liveEl(cardEls, others[i].id);
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
                drag.value = { id: card.id, dx: ev.clientX - startX, dy: ev.clientY - startY };
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

    const clickCard = (card: KanbanCard) => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        props.oncardclick?.(card);
    };

    // ---- geometry: grid rows are shared across columns (one grid), so
    // every shell spans header + tallest column + one empty drop row
    const shellSpan = () => {
        let max = 0;
        for (const col of columns()) {
            max = Math.max(max, cardsOf(col).length);
        }
        return max + 2;
    };

    /** Indicator row: the slot BEFORE others[index] in unfiltered terms */
    const indicatorRow = (col: KanbanColumn, index: number): number => {
        const dragId = drag.peek()?.id;
        const others = cardsOf(col).filter((c) => c.id !== dragId);
        if (index < others.length) {
            return cardsOf(col).indexOf(others[index]) + ROW0;
        }
        return cardsOf(col).length + ROW0;
    };

    const cardStyle = (card: KanbanCard, ci: number, row: number) => {
        const d = drag.value;
        const dragging = d && d.id === card.id;
        return css({
            gridColumn: String(ci + 1),
            gridRow: String(row),
            '--lm-kanban-accent': card.color || false,
            transform: dragging ? 'translate(' + d!.dx + 'px,' + d!.dy + 'px)' : false,
        });
    };

    return html`<div class="lm-kanban"
        style="${() => css({ gridTemplateColumns: 'repeat(' + Math.max(1, columns().length) + ', var(--lm-kanban-column-width, 280px))' })}">
        ${() =>
            columns().map(
                (col, ci) => html`<div class="lm-kanban-column" key="${col.id}" data-column="${col.id}"
                    ref="${(el: HTMLElement) => shellEls.set(col.id, el)}"
                    style="${css({ gridColumn: String(ci + 1), gridRow: '1 / span ' + shellSpan() })}">
                    <div class="lm-kanban-column-header">
                        <span class="lm-kanban-column-title">${col.title}</span>
                        <span class="lm-kanban-column-count">${cardsOf(col).length}</span>
                    </div>
                </div>`
            )}
        ${() => {
            // THE flat keyed list: every card on the board, one list, so
            // a cross-column move is a coordinate change on the SAME node.
            // Cards stay PLAIN elements deliberately: live prop patching
            // would let a <Card> component ride the keyed move too, but a
            // card here has no internal state to preserve and no public
            // customization contract — a component would only add a
            // register-element callback prop to rebuild the hit-testing
            // registry the board already owns via refs.
            const out: ReturnType<typeof html>[] = [];
            columns().forEach((col, ci) => {
                cardsOf(col).forEach((card, ri) => {
                    out.push(html`<article class="lm-kanban-card ${() =>
                        drag.value?.id === card.id ? 'lm-kanban-card-dragging' : ''}"
                        key="${card.id}" data-card="${card.id}"
                        ref="${(el: HTMLElement) => cardEls.set(card.id, el)}"
                        style="${() => cardStyle(card, ci, ri + ROW0)}"
                        onmousedown="${(e: MouseEvent) => armDrag(e, card)}"
                        onclick="${() => clickCard(card)}">
                        <div class="lm-kanban-card-title">${card.title}</div>
                        ${card.description ? html`<div class="lm-kanban-card-description">${card.description}</div>` : ''}
                        ${card.tags && card.tags.length
                            ? html`<div class="lm-kanban-card-tags">${card.tags.map(
                                  (tag) => html`<span class="lm-kanban-tag">${tag}</span>`
                              )}</div>`
                            : ''}
                    </article>`);
                });
            });
            return out;
        }}
        ${() => {
            const t = drop.value;
            if (!t) {
                return false;
            }
            const ci = columns().findIndex((c) => c.id === t.col);
            if (ci < 0) {
                return false;
            }
            return html`<div class="lm-kanban-indicator"
                style="${css({ gridColumn: String(ci + 1), gridRow: String(indicatorRow(columns()[ci], t.index)) })}"></div>`;
        }}
    </div>`;
});

export default Kanban;
