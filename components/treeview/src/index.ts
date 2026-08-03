/**
 * <TreeView /> — LemonadeJS v6 block.
 *
 * A hierarchical list rendered by ONE recursive view function: nodeView
 * calls itself for node.children, every repeated <li> is keyed by the
 * node id, and the whole tree hangs off a single live expression reading
 * the data state. Mutate the tree in place + data.touch() (or assign a
 * new array) and the keyed diff moves/keeps existing DOM instead of
 * rebuilding it — including NESTED sibling lists, which the engine
 * compares structurally.
 *
 * Collapse keeps the child DOM ALIVE: visibility is the aria-expanded
 * attribute + CSS (display: none on the group), never an unmount. Same
 * choice as <Tabs/> panels. Rationale: re-expanding is instant, child DOM
 * identity (and anything the host stuffed into it) survives toggles, the
 * accessibility attribute IS the rendering switch (one source of truth),
 * and toggling never re-runs the keyed diff. For huge lazy trees an
 * unmounting branch would be the alternative; for a block-sized tree
 * keep-alive is the idiomatic v6 answer.
 *
 * Contract:
 *   data        TreeNode[]: { id, label, icon?, open?, children? }
 *   bind        two-way selected node id (bind="${state}")
 *   draggable   opt-in drag-and-drop reordering (default false)
 *   onchange    (id, node) — fires on user/api selection (parent writes
 *               to the bound state never echo back)
 *   ontoggle    (id, open) — fires on expand/collapse (user or api)
 *   onmove      (id, parentId, index) — after a drag drops a node into a
 *               new position (parentId is null at the root)
 *   api         { open(id), close(id), select(id), toggle(id) }
 *
 * Drag-and-drop (draggable only): a pointer gesture (3px threshold,
 * Escape cancels, a drag never fires the click selection) with ZERO
 * LAYOUT SHIFT — a dense list must not reflow under the cursor. The
 * origin row stays in the flow, dimmed; a small chip with the node's
 * label rides the cursor; the landing slot is an absolutely positioned
 * insertion line (before/after) or a ring on the container row
 * (inside). Hovering a CONTAINER row (a node with a children
 * array — children: [] is an empty folder) splits it in thirds: top →
 * drop BEFORE (sibling), bottom → drop AFTER (sibling), middle → drop
 * INSIDE (becomes a child, opening the target). A LEAF row (no children
 * key) splits in halves, before/after only — a leaf never becomes a
 * parent via drop. The tree array is mutated in place + data.touch(),
 * so the keyed diff MOVES existing DOM instead of rebuilding it. A node
 * can never drop onto itself or into its own subtree.
 *
 * Keyboard (APG tree pattern, single select):
 *   ArrowRight  opens a closed parent; on an open parent moves to the
 *               first child
 *   ArrowLeft   closes an open parent; otherwise moves to the parent
 *   ArrowUp/Down move focus across VISIBLE nodes
 *   Enter       selects the focused node
 */

import { batch, component, css, html, type View } from 'lemonadejs';

/** px of movement before a mousedown becomes a drag (clicks stay clicks) */
const DRAG_THRESHOLD = 3;

export type TreeNodeId = string | number;

export interface TreeNode {
    /** Unique id across the whole tree (list key + api handle) */
    id: TreeNodeId;
    /** Visible text */
    label: string;
    /** Material icon keyword shown before the label */
    icon?: string;
    /** Starts expanded (initial only — toggling is component-owned) */
    open?: boolean;
    /** Child nodes — arbitrary depth */
    children?: TreeNode[];
}

type TreeApi = {
    open: (id: TreeNodeId) => void;
    close: (id: TreeNodeId) => void;
    select: (id: TreeNodeId) => void;
    toggle: (id: TreeNodeId) => void;
};

export const TreeView = component('treeview', {
    bind: null,                   // two-way selected node id — 'any': ids are string | number
    data: Array,                  // TreeNode[] — the tree
    draggable: false,             // opt-in drag-and-drop reordering
    onchange: Function,           // (id, node) on selection
    ontoggle: Function,           // (id, open) on expand/collapse
    onmove: Function,             // (id, parentId, index) after a drag drop
    api: { open: Function, close: Function, select: Function, toggle: Function },
}, (props, { state, bind, listen, onUnmount }) => {
    const selected = bind(props, '');

    const nodes = (): TreeNode[] => (props.data.value as TreeNode[]) || [];

    // ---- tree walking (the data array is the single source of truth)
    const find = (id: TreeNodeId, list: TreeNode[] = nodes()): TreeNode | null => {
        for (const n of list) {
            if (Object.is(n.id, id)) {
                return n;
            }
            if (n.children?.length) {
                const hit = find(id, n.children);
                if (hit) {
                    return hit;
                }
            }
        }
        return null;
    };

    /** Find by the data-id ATTRIBUTE (always a string) — DOM → node */
    const byKey = (key: string, list: TreeNode[] = nodes()): TreeNode | null => {
        for (const n of list) {
            if (String(n.id) === key) {
                return n;
            }
            if (n.children?.length) {
                const hit = byKey(key, n.children);
                if (hit) {
                    return hit;
                }
            }
        }
        return null;
    };

    const parentOf = (id: TreeNodeId, list: TreeNode[] = nodes(), parent: TreeNode | null = null): TreeNode | null => {
        for (const n of list) {
            if (Object.is(n.id, id)) {
                return parent;
            }
            if (n.children?.length) {
                const hit = parentOf(id, n.children, n);
                if (hit !== null) {
                    return hit;
                }
            }
        }
        return null;
    };

    // ---- open/closed: a Set state, mutated in place + touch()
    const initialOpen = new Set<TreeNodeId>();
    const seed = (list: TreeNode[]) => {
        for (const n of list) {
            if (n.open) {
                initialOpen.add(n.id);
            }
            if (n.children?.length) {
                seed(n.children);
            }
        }
    };
    seed(nodes());
    const open = state(initialOpen);
    const isOpen = (id: TreeNodeId) => open.value.has(id);

    const setOpen = (id: TreeNodeId, want: boolean) => {
        const node = find(id);
        if (!node || !node.children?.length || isOpen(id) === want) {
            return;
        }
        if (want) {
            open.value.add(id);
        } else {
            open.value.delete(id);
        }
        open.touch();
        props.ontoggle?.(id, want);
    };

    // Selection commits manually (not selected.set) so onchange can carry
    // the NODE as a second argument — the declared contract signature
    // onchange(id, node) owns the type even with bind; set() could only
    // pass (value, oldValue). Parent writes stay echo-free because only
    // doSelect ever fires the event.
    const doSelect = (id: TreeNodeId) => {
        const node = find(id);
        if (!node || Object.is(selected.value, id)) {
            return;
        }
        selected.value = id;
        props.onchange?.(id, node);
    };

    props.ref?.({
        open: (id: TreeNodeId) => setOpen(id, true),
        close: (id: TreeNodeId) => setOpen(id, false),
        select: (id: TreeNodeId) => doSelect(id),
        toggle: (id: TreeNodeId) => setOpen(id, !isOpen(id)),
    } satisfies TreeApi);

    // ---- keyboard: roving focus over the VISIBLE flattening of the tree
    let rootEl: HTMLElement | null = null;

    const visible = (): TreeNode[] => {
        const out: TreeNode[] = [];
        const walk = (list: TreeNode[]) => {
            for (const n of list) {
                out.push(n);
                if (n.children?.length && isOpen(n.id)) {
                    walk(n.children);
                }
            }
        };
        walk(nodes());
        return out;
    };

    const rowOf = (id: TreeNodeId): HTMLElement | null => {
        if (!rootEl) {
            return null;
        }
        const key = String(id);
        for (const li of rootEl.querySelectorAll('li[data-id]')) {
            if (li.getAttribute('data-id') === key) {
                return li.firstElementChild as HTMLElement; // the row div
            }
        }
        return null;
    };

    const focusNode = (node: TreeNode | null | undefined) => {
        if (node) {
            rowOf(node.id)?.focus();
        }
    };

    const onKeydown = (e: KeyboardEvent) => {
        const li = (e.target as Element | null)?.closest?.('li[data-id]');
        const node = li ? byKey(li.getAttribute('data-id')!) : null;
        if (!node) {
            return;
        }
        const kids = node.children?.length ? node.children : null;
        if (e.key === 'Enter') {
            e.preventDefault();
            doSelect(node.id);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (kids && !isOpen(node.id)) {
                setOpen(node.id, true);
            } else if (kids) {
                focusNode(kids[0]);
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (kids && isOpen(node.id)) {
                setOpen(node.id, false);
            } else {
                focusNode(parentOf(node.id));
            }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const flat = visible();
            const i = flat.findIndex((n) => Object.is(n.id, node.id));
            if (i >= 0) {
                focusNode(flat[i + (e.key === 'ArrowDown' ? 1 : -1)]);
            }
        }
    };

    // ---- drag-and-drop (draggable only): a POINTER gesture (threshold,
    // Escape cancel, click suppression — the <Kanban/> gesture), but with
    // ZERO LAYOUT SHIFT: a dense list must not reflow under the cursor.
    // The origin row STAYS IN THE FLOW (dimmed); a small chip with the
    // node's label rides the cursor; the landing slot is an absolutely
    // positioned insertion line (before/after) or a ring on the container
    // row (inside). Nothing moves until the drop commits.
    type DropPos = 'before' | 'after' | 'inside';
    const drag = state<{
        id: TreeNodeId;
        x: number; // cursor — the chip rides at a small offset
        y: number;
        label: string;
        icon?: string;
    } | null>(null);
    const dropAt = state<{ id: TreeNodeId; pos: DropPos } | null>(null); // live indicator

    /** Is `id` the node `ancestor` itself or anywhere in its subtree? */
    const contains = (ancestor: TreeNode, id: TreeNodeId): boolean =>
        Object.is(ancestor.id, id) || !!ancestor.children?.some((c) => contains(c, id));

    /** The array holding `id` and its index within it (root list or a children[]) */
    const locate = (id: TreeNodeId, list: TreeNode[] = nodes()): { list: TreeNode[]; index: number } | null => {
        const index = list.findIndex((n) => Object.is(n.id, id));
        if (index >= 0) {
            return { list, index };
        }
        for (const n of list) {
            if (n.children?.length) {
                const hit = locate(id, n.children);
                if (hit) {
                    return hit;
                }
            }
        }
        return null;
    };

    /** `src` may drop on `targetId` unless target is src itself or in its subtree */
    const canDropFrom = (src: TreeNodeId, targetId: TreeNodeId): boolean => {
        if (Object.is(src, targetId)) {
            return false;
        }
        const node = find(src);
        return !!node && !contains(node, targetId);
    };

    const moveNode = (srcId: TreeNodeId, targetId: TreeNodeId, pos: DropPos) => {
        const src = find(srcId);
        const from = locate(srcId);
        if (!src || !from) {
            return;
        }
        from.list.splice(from.index, 1); // detach first; indices below are post-removal
        let parentId: TreeNodeId | null = null;
        let index: number;
        if (pos === 'inside') {
            const target = find(targetId)!;
            (target.children ||= []).push(src);
            parentId = target.id;
            index = target.children.length - 1;
            if (!open.value.has(target.id)) {
                open.value.add(target.id);
                open.touch();
            }
        } else {
            const to = locate(targetId);
            if (!to) {
                from.list.splice(from.index, 0, src); // target vanished — undo
                return;
            }
            index = pos === 'after' ? to.index + 1 : to.index;
            to.list.splice(index, 0, src);
            const p = parentOf(targetId);
            parentId = p ? p.id : null;
        }
        props.data.touch();
        props.onmove?.(srcId, parentId, index);
    };

    /** The drop target under the cursor: the visible row containing y.
     *  The dragged node and its subtree are skipped — hovering yourself
     *  is not a move. Geometry comes from the live DOM (see <Kanban/>:
     *  ref registries go stale when the keyed differ reuses nodes). */
    const computeDrop = (y: number, srcId: TreeNodeId): { id: TreeNodeId; pos: DropPos } | null => {
        if (!rootEl) {
            return null;
        }
        for (const rowEl of rootEl.querySelectorAll('.lm-treeview-row')) {
            const r = rowEl.getBoundingClientRect();
            if (!r.height || y < r.top || y >= r.bottom) {
                continue; // collapsed rows have no box
            }
            const key = rowEl.closest('[data-id]')?.getAttribute('data-id');
            const node = key != null ? byKey(key) : null;
            if (!node || !canDropFrom(srcId, node.id)) {
                continue; // self or own subtree — never a target
            }
            const t = y - r.top;
            // 'inside' exists only for CONTAINERS — a node with a children
            // array (children: [] is an empty folder; no key at all is a
            // leaf). A leaf never becomes a parent via drop: its row
            // splits in halves, before/after only.
            const pos: DropPos = Array.isArray(node.children)
                ? t < r.height * 0.3 ? 'before' : t > r.height * 0.7 ? 'after' : 'inside'
                : t < r.height * 0.5 ? 'before' : 'after';
            return { id: node.id, pos };
        }
        return null;
    };

    // ---- the gesture: ONE in flight, armed per mousedown via listen()
    // (auto-removed on unmount). Escape cancels. No preventDefault on the
    // mousedown itself — focus and click-to-select stay native.
    let releaseGesture: (() => void) | null = null;
    let suppressClick = false;
    onUnmount(() => releaseGesture?.());

    /** Nearest scrollable ancestor (the tree itself or a host panel) */
    const scrollerOf = (el: HTMLElement | null): HTMLElement | null => {
        for (let n = el; n; n = n.parentElement) {
            const s = getComputedStyle(n);
            if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && n.scrollHeight > n.clientHeight) {
                return n;
            }
        }
        return null;
    };

    const armDrag = (e: MouseEvent, node: TreeNode) => {
        if (!props.draggable.value || e.button) {
            return; // opt-in feature, left button only
        }
        releaseGesture?.();
        suppressClick = false;
        const startX = e.clientX;
        const startY = e.clientY;
        let moved = false;

        // Auto-scroll: a rAF loop while the pointer parks in the 44px edge
        // zone of the scroll container (or the viewport) — mousemove alone
        // cannot scroll, so a long tree was undraggable across a fold.
        // Speed ramps with proximity to the edge.
        const scroller = scrollerOf(rootEl);
        let pointerY = 0;
        let scrollRaf = 0;
        const autoStep = () => {
            scrollRaf = requestAnimationFrame(autoStep);
            const zone = 44;
            const r = scroller ? scroller.getBoundingClientRect() : null;
            const top = Math.max(r ? r.top : 0, 0);
            const bottom = Math.min(r ? r.bottom : window.innerHeight, window.innerHeight);
            const d = pointerY < top + zone
                ? -Math.ceil((top + zone - pointerY) / 6)
                : pointerY > bottom - zone
                    ? Math.ceil((pointerY - (bottom - zone)) / 6)
                    : 0;
            if (d) {
                if (scroller) {
                    scroller.scrollTop += d;
                } else {
                    window.scrollBy(0, d);
                }
                const next = computeDrop(pointerY, node.id); // rows moved under the pointer
                if (next) {
                    dropAt.value = next;
                }
            }
        };

        const finish = (commit: boolean) => {
            offMove();
            offUp();
            offKey();
            releaseGesture = null;
            if (scrollRaf) {
                cancelAnimationFrame(scrollRaf);
                scrollRaf = 0;
            }
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            const target = dropAt.peek();
            if (moved) {
                suppressClick = true; // the click a browser synthesizes after mouseup
            }
            batch(() => {
                // One update pass: gesture reset + the committed move (touch)
                drag.value = null;
                dropAt.value = null;
                if (commit && moved && target) {
                    moveNode(node.id, target.id, target.pos);
                }
            });
        };
        const offMove = listen<MouseEvent>(document, 'mousemove', (ev) => {
            if (!moved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) {
                return;
            }
            if (!moved) {
                // gesture confirmed: grabbing cursor everywhere (the float
                // has pointer-events:none, so the cursor comes from whatever
                // sits underneath) + belt-and-braces selection lock
                document.body.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
                autoStep();
            }
            moved = true;
            ev.preventDefault(); // no text selection while dragging
            pointerY = ev.clientY;
            batch(() => {
                drag.value = {
                    id: node.id,
                    x: ev.clientX,
                    y: ev.clientY,
                    label: node.label,
                    icon: node.icon,
                };
                const next = computeDrop(ev.clientY, node.id);
                if (next) {
                    dropAt.value = next;
                } else {
                    // No row under the cursor but still over the tree
                    // (row margins, the dragged node's own band): KEEP
                    // the current slot — a steady preview beats one that
                    // blinks at every boundary. Leaving the tree clears.
                    const r = rootEl?.getBoundingClientRect();
                    const inside = !!r &&
                        ev.clientX >= r.left - 8 && ev.clientX <= r.right + 8 &&
                        ev.clientY >= r.top - 8 && ev.clientY <= r.bottom + 8;
                    if (!inside) {
                        dropAt.value = null;
                    }
                }
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

    const clickRow = (id: TreeNodeId) => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        doSelect(id);
    };

    /** Reactive row classes: selection only — drag/drop lives on the <li> */
    const rowClass = (node: TreeNode): string =>
        Object.is(selected.value, node.id) ? 'lm-treeview-selected' : '';

    /** <li> drag/drop affordances: the dimmed origin + the drop indicator.
     *  Both are pure decoration (absolute line / ring / opacity) — they
     *  NEVER change layout, so the tree never moves under the cursor. */
    const liClass = (node: TreeNode): string => {
        const out: string[] = [];
        if (drag.value && Object.is(drag.value.id, node.id)) {
            out.push('lm-treeview-dragging');
        }
        const d = dropAt.value;
        if (d && Object.is(d.id, node.id)) {
            out.push('lm-treeview-drop-' + d.pos);
        }
        return out.join(' ');
    };

    /**
     * THE RECURSION: one view function calling itself for children.
     * Repeated <li>s are keyed by node id; nested child lists are plain
     * snapshots INSIDE the one live tree expression below — the outer
     * arrow re-runs on data.touch() and the keyed diff (structural,
     * per level) keeps/moves existing DOM.
     */
    const nodeView = (node: TreeNode): View => {
        const kids = node.children?.length ? node.children : null;
        return html`<li class="lm-treeview-node ${() => liClass(node)}" key="${node.id}" role="treeitem"
            data-id="${String(node.id)}"
            aria-expanded="${kids ? () => (isOpen(node.id) ? 'true' : 'false') : false}"
            aria-selected="${() => (Object.is(selected.value, node.id) ? 'true' : 'false')}">
            <div class="lm-treeview-row ${() => rowClass(node)}"
                tabindex="0"
                onmousedown="${(e: MouseEvent) => armDrag(e, node)}"
                onclick="${() => clickRow(node.id)}">
                <span class="lm-treeview-toggle"
                    onclick="${(e: MouseEvent) => {
                        if (kids) {
                            e.stopPropagation(); // toggling is not selecting
                            setOpen(node.id, !isOpen(node.id));
                        }
                    }}"></span>
                <span class="lm-treeview-label" data-icon="${node.icon || false}">${node.label}</span>
            </div>
            ${kids ? html`<ul class="lm-treeview-group" role="group">${kids.map((c) => nodeView(c))}</ul>` : false}
        </li>`;
    };

    return html`<div class="lm-treeview"
        ref="${(el: HTMLElement) => (rootEl = el)}"
        onkeydown="${onKeydown}">
        <ul class="lm-treeview-tree" role="tree">${() => nodes().map((n) => nodeView(n))}</ul>
        ${() => {
            // The drag chip: a small floating copy of the grabbed label
            // riding the cursor — the tree itself never moves
            const d = drag.value;
            return d
                ? html`<div class="lm-treeview-drag-chip"
                      style="${css({ left: d.x + 12 + 'px', top: d.y + 8 + 'px' })}">
                      <span class="lm-treeview-label" data-icon="${d.icon || false}">${d.label}</span>
                  </div>`
                : '';
        }}
    </div>`;
});

export default TreeView;
