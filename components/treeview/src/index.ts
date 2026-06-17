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
 * Drag-and-drop (draggable only): native HTML5 DnD — no JS emulation.
 * Hovering a row splits it in thirds: top → drop BEFORE (sibling), bottom
 * → drop AFTER (sibling), middle → drop INSIDE (becomes a child, opening
 * the target). The tree array is mutated in place + data.touch(), so the
 * keyed diff MOVES existing DOM instead of rebuilding it. A node can never
 * drop onto itself or into its own subtree.
 *
 * Keyboard (APG tree pattern, single select):
 *   ArrowRight  opens a closed parent; on an open parent moves to the
 *               first child
 *   ArrowLeft   closes an open parent; otherwise moves to the parent
 *   ArrowUp/Down move focus across VISIBLE nodes
 *   Enter       selects the focused node
 */

import { component, html, type View } from 'lemonadejs';

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
}, (props, { state, bind }) => {
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

    // ---- drag-and-drop (draggable only): native HTML5 DnD, reorder the
    // data array in place + touch() so the keyed diff MOVES existing DOM.
    type DropPos = 'before' | 'after' | 'inside';
    const dragId = state<TreeNodeId | null>(null);     // node being dragged
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

    /** Same check for the live drag (reads the dragId state) */
    const canDrop = (targetId: TreeNodeId): boolean =>
        dragId.value !== null && canDropFrom(dragId.value, targetId);

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

    const onDragStart = (e: DragEvent, node: TreeNode) => {
        if (!props.draggable.value) {
            return;
        }
        dragId.value = node.id;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(node.id)); // Firefox needs payload to start
        }
    };

    const onDragOver = (e: DragEvent, node: TreeNode) => {
        if (!props.draggable.value || !canDrop(node.id)) {
            return;
        }
        e.preventDefault(); // required to make this row a drop target
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - r.top;
        const pos: DropPos = y < r.height * 0.3 ? 'before' : y > r.height * 0.7 ? 'after' : 'inside';
        const cur = dropAt.value;
        if (!cur || !Object.is(cur.id, node.id) || cur.pos !== pos) {
            dropAt.value = { id: node.id, pos };
        }
    };

    const onDrop = (e: DragEvent, node: TreeNode) => {
        if (!props.draggable.value) {
            return;
        }
        e.preventDefault();
        const target = dropAt.value;
        const src = dragId.value;
        dragId.value = null;
        dropAt.value = null;
        if (src !== null && target && Object.is(target.id, node.id) && canDropFrom(src, node.id)) {
            moveNode(src, target.id, target.pos);
        }
    };

    const onDragEnd = () => {
        dragId.value = null;
        dropAt.value = null;
    };

    /** Reactive row classes: selection + live drag/drop affordances */
    const rowClass = (node: TreeNode): string => {
        const out: string[] = [];
        if (Object.is(selected.value, node.id)) {
            out.push('lm-treeview-selected');
        }
        if (Object.is(dragId.value, node.id)) {
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
        return html`<li class="lm-treeview-node" key="${node.id}" role="treeitem"
            data-id="${String(node.id)}"
            aria-expanded="${kids ? () => (isOpen(node.id) ? 'true' : 'false') : false}"
            aria-selected="${() => (Object.is(selected.value, node.id) ? 'true' : 'false')}">
            <div class="lm-treeview-row ${() => rowClass(node)}"
                tabindex="0"
                draggable="${() => (props.draggable.value ? 'true' : false)}"
                onclick="${() => doSelect(node.id)}"
                ondragstart="${(e: DragEvent) => onDragStart(e, node)}"
                ondragover="${(e: DragEvent) => onDragOver(e, node)}"
                ondrop="${(e: DragEvent) => onDrop(e, node)}"
                ondragend="${onDragEnd}">
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
    </div>`;
});

export default TreeView;
