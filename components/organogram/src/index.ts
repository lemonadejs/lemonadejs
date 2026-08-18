/**
 * <Organogram /> — LemonadeJS v6 block.
 *
 * An org chart / hierarchy diagram built from a FLAT adjacency list:
 *
 *   const people = [
 *       { id: 1, name: 'Jorge',   role: 'CEO',           parent: 0, status: '#90EE90', img: '/ceo.png' },
 *       { id: 2, name: 'Antonio', role: 'Vice president', parent: 1, status: '#90EE90', img: '/u.jpg' },
 *       ...
 *   ];
 *   <${Organogram} data="${people}" bind="${selected}" />
 *
 * `parent` points at another row's `id`; a `parent` of 0 / null / unknown
 * is a root (a forest of several roots is supported). Everything else —
 * the tree, the tidy layout, the elbow connectors, the bounds — is one
 * reactive `model` derived from the props. Mutate the data in place +
 * data.touch() (or assign a new array) and only the layout recomputes;
 * pan/zoom live in their OWN state so dragging never rebuilds the tree.
 *
 * THE INTERACTION, AND WHY IT IS NOT A LIBRARY OF ITS OWN:
 *   - Pan/zoom is Google-Maps style on ONE transformed `world` layer:
 *     translate()+scale() on a single element. Dragging the background
 *     pans; the wheel zooms ANCHORED at the cursor (the point under the
 *     pointer stays put). There is no per-frame relayout — the browser
 *     composites the transform; we never recompute node positions while
 *     panning.
 *   - Nodes are real HTML cards (avatar, name, role, status) positioned
 *     by left/top in world coordinates, so a CSS transition animates the
 *     re-layout when a branch collapses — again, no JS tween loop.
 *   - Connectors are one <svg> in the same world layer; orthogonal elbow
 *     paths are plain strings rebuilt only when the layout changes.
 *
 * Quick-search centers the viewport on any node (expanding its ancestors
 * first if it was collapsed away) — the "fly to" of a maps UI.
 */

import { component, css, html, type View } from 'lemonadejs';

/* ------------------------------------------------------------------ *
 *  Public data shape                                                  *
 * ------------------------------------------------------------------ */

export type OrgId = string | number;

/** One person / box in the chart. Extra keys are preserved untouched. */
export interface OrgItem {
    /** Unique id across the whole chart (layout key + api handle). */
    id: OrgId;
    /** Primary line on the card. */
    name?: string;
    /** Secondary, muted line (job title / department). */
    role?: string;
    /** Parent row's id; 0 / null / unknown → a root node. */
    parent?: OrgId | null;
    /** Status colour (any CSS colour) shown as a dot + left accent. */
    status?: string;
    /** Avatar image URL. */
    img?: string;
    /** Force this node's children into a vertical list (true) or a row (false). */
    compact?: boolean;
    [extra: string]: unknown;
}

/* ------------------------------------------------------------------ *
 *  Layout (a tidy top-down/left-right tree from the flat list)        *
 * ------------------------------------------------------------------ */

interface LayoutOptions {
    vertical: boolean;
    nodeW: number;
    nodeH: number;
    crossGap: number;     // gap between siblings (the cross axis)
    levelGap: number;     // gap between depths (the main axis)
    rootGap: number;      // extra gap between separate roots
    compact: boolean;     // default leaf-only parents to a stacked (vertical) list
    stackGap: number;     // gap between stacked children
    indent: number;       // how far a stacked child is indented from the parent
}

/** A laid-out node: the source item plus its world rect + tree facts. */
export interface OrgNode {
    item: OrgItem;
    id: OrgId;
    x: number;
    y: number;
    depth: number;
    hasChildren: boolean;      // has children in the DATA (even if collapsed)
    collapsed: boolean;
    childrenStacked: boolean;  // this node renders its children as a vertical list
}

interface OrgEdge { from: OrgId; to: OrgId; path: string; }
interface OrgModel { nodes: OrgNode[]; edges: OrgEdge[]; width: number; height: number; }

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Per-instance uid so listbox/option ids stay unique across mounts. */
let uid = 0;

/* The layout works in MAIN/CROSS space (main = the depth axis, cross = the
 * sibling axis) and maps to x/y at the end by orientation. A subtree is laid
 * out into a local box whose top-left is (0,0); the parent then translates the
 * box into place — a small Reingold-Tilford-style extent packer. This is what
 * lets a node spread its children HORIZONTALLY (a row) or stack them
 * VERTICALLY (an indented list) independently, by the `compact` rule. */
interface Placed { node: OrgNode; main: number; cross: number; }
interface Sub { all: Placed[]; main: number; cross: number; root: Placed; }

/** Orthogonal connector from a parent to a child, by orientation + stacking. */
const connector = (p: OrgNode, c: OrgNode, o: LayoutOptions, stacked: boolean): string => {
    if (o.vertical) {
        if (stacked) {
            // bus straight down from the parent centre, horizontal stub into the child's left
            const bx = p.x + o.nodeW / 2;
            return `M ${bx} ${p.y + o.nodeH} L ${bx} ${c.y + o.nodeH / 2} L ${c.x} ${c.y + o.nodeH / 2}`;
        }
        const px = p.x + o.nodeW / 2;
        const cx = c.x + o.nodeW / 2;
        const mid = p.y + o.nodeH + o.levelGap / 2;
        return `M ${px} ${p.y + o.nodeH} L ${px} ${mid} L ${cx} ${mid} L ${cx} ${c.y}`;
    }
    if (stacked) {
        const by = p.y + o.nodeH / 2;
        return `M ${p.x + o.nodeW} ${by} L ${c.x + o.nodeW / 2} ${by} L ${c.x + o.nodeW / 2} ${c.y}`;
    }
    const py = p.y + o.nodeH / 2;
    const cy = c.y + o.nodeH / 2;
    const mid = p.x + o.nodeW + o.levelGap / 2;
    return `M ${p.x + o.nodeW} ${py} L ${mid} ${py} L ${mid} ${cy} L ${c.x} ${cy}`;
};

/**
 * Build the whole scene from the flat list: parent pointers → tree → tidy
 * layout → connectors → bounds, all derived in one pass. A node stacks its
 * children vertically when `item.compact === true`, or (with the global
 * `compact` option) when every one of its children is a leaf — which keeps
 * wide clusters of reports from blowing the chart out sideways. `compact: false`
 * on an item always forces the horizontal row.
 */
const buildModel = (items: OrgItem[], collapsed: Set<OrgId>, o: LayoutOptions): OrgModel => {
    const byId = new Map<OrgId, OrgItem>();
    for (const it of items) {
        if (it && it.id != null) byId.set(it.id, it);
    }
    const kids = new Map<OrgId, OrgItem[]>();
    const roots: OrgItem[] = [];
    for (const it of items) {
        if (!it || it.id == null) continue;
        const p = it.parent;
        if (p == null || p === 0 || !byId.has(p) || p === it.id) {
            roots.push(it);
        } else {
            (kids.get(p) ?? kids.set(p, []).get(p)!).push(it);
        }
    }
    const childrenOf = (id: OrgId): OrgItem[] => kids.get(id) ?? [];
    const isLeaf = (it: OrgItem): boolean => childrenOf(it.id).length === 0;
    const isStacked = (it: OrgItem): boolean => {
        const k = childrenOf(it.id);
        if (k.length === 0) return false;
        if (it.compact === true) return true;
        if (it.compact === false) return false;
        return o.compact && k.every(isLeaf);
    };

    const nodeMain = o.vertical ? o.nodeH : o.nodeW;
    const nodeCross = o.vertical ? o.nodeW : o.nodeH;
    const visited = new Set<OrgId>();

    const shift = (sub: Sub, dMain: number, dCross: number): void => {
        for (const p of sub.all) { p.main += dMain; p.cross += dCross; }
    };

    /** Lay a subtree into a local box (top-left 0,0); returns it + its extents. */
    const layout = (it: OrgItem, depth: number): Sub | null => {
        if (visited.has(it.id)) return null; // cycle / duplicate guard
        visited.add(it.id);
        const stacked = !collapsed.has(it.id) && isStacked(it);
        const node: OrgNode = {
            item: it, id: it.id, depth,
            x: 0, y: 0,
            hasChildren: childrenOf(it.id).length > 0,
            collapsed: collapsed.has(it.id),
            childrenStacked: stacked,
        };
        const root: Placed = { node, main: 0, cross: 0 };
        const childItems = collapsed.has(it.id) ? [] : childrenOf(it.id);
        const subs: Sub[] = [];
        for (const c of childItems) {
            const s = layout(c, depth + 1);
            if (s) subs.push(s);
        }
        const all: Placed[] = [root];
        if (subs.length) {
            if (stacked) {
                // children cascade DOWN the main axis, indented along the cross axis
                let cursor = nodeMain + o.stackGap;
                for (const s of subs) {
                    shift(s, cursor, nodeCross / 2 + o.indent);
                    cursor += s.main + o.stackGap;
                    all.push(...s.all);
                }
            } else {
                // children spread along the CROSS axis, one level down the main axis
                let cross = 0;
                const top = nodeMain + o.levelGap;
                for (const s of subs) {
                    shift(s, top, cross);
                    cross += s.cross + o.crossGap;
                    all.push(...s.all);
                }
                // centre the parent over the span of its children's centres
                const first = subs[0].root.cross + nodeCross / 2;
                const last = subs[subs.length - 1].root.cross + nodeCross / 2;
                root.cross = (first + last) / 2 - nodeCross / 2;
            }
        }
        // normalise the box to a (0,0) origin
        let minMain = Infinity;
        let minCross = Infinity;
        for (const p of all) { minMain = Math.min(minMain, p.main); minCross = Math.min(minCross, p.cross); }
        let main = 0;
        let cross = 0;
        for (const p of all) {
            p.main -= minMain;
            p.cross -= minCross;
            main = Math.max(main, p.main + nodeMain);
            cross = Math.max(cross, p.cross + nodeCross);
        }
        return { all, main, cross, root };
    };

    // place each root subtree along the cross axis (a forest)
    const placed: Placed[] = [];
    let cross = 0;
    for (const r of roots) {
        const s = layout(r, 0);
        if (!s) continue;
        shift(s, 0, cross);
        cross += s.cross + o.rootGap;
        placed.push(...s.all);
    }

    // map main/cross → x/y and measure the world
    const nodes: OrgNode[] = [];
    const nodeById = new Map<OrgId, OrgNode>();
    let width = 0;
    let height = 0;
    for (const p of placed) {
        p.node.x = o.vertical ? p.cross : p.main;
        p.node.y = o.vertical ? p.main : p.cross;
        width = Math.max(width, p.node.x + o.nodeW);
        height = Math.max(height, p.node.y + o.nodeH);
        nodes.push(p.node);
        nodeById.set(p.node.id, p.node);
    }

    const edges: OrgEdge[] = [];
    for (const n of nodes) {
        if (n.collapsed) continue;
        for (const c of childrenOf(n.id)) {
            const cn = nodeById.get(c.id);
            if (cn) edges.push({ from: n.id, to: c.id, path: connector(n, cn, o, n.childrenStacked) });
        }
    }
    return { nodes, edges, width, height };
};

/** Walk parent pointers from `id` up to its root(s). */
const ancestorsOf = (items: OrgItem[], id: OrgId): OrgId[] => {
    const byId = new Map(items.map((it) => [it.id, it] as const));
    const out: OrgId[] = [];
    let cur = byId.get(id);
    const seen = new Set<OrgId>();
    while (cur && cur.parent != null && cur.parent !== 0 && !seen.has(cur.id)) {
        seen.add(cur.id);
        const p = byId.get(cur.parent);
        if (!p) break;
        out.push(p.id);
        cur = p;
    }
    return out;
};

/** Initials fallback when an avatar image is missing/broken. */
const initials = (name: string): string =>
    (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('');

/* ------------------------------------------------------------------ *
 *  The component                                                      *
 * ------------------------------------------------------------------ */

type OrgApi = {
    select: (id: OrgId) => void;
    center: (id: OrgId) => void;
    fit: () => void;
    reset: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    setZoom: (scale: number) => void;
    getZoom: () => number;
    expand: (id: OrgId) => void;
    collapse: (id: OrgId) => void;
    toggle: (id: OrgId) => void;
    expandAll: () => void;
    collapseAll: () => void;
};

export const Organogram = component('organogram', {
    bind: null,                 // two-way selected node id ('any': string | number)
    data: Array,                // OrgItem[] — the flat adjacency list
    orientation: '',            // '' top-down (default) | 'horizontal' left-right
    nodewidth: 180,             // card width in px
    nodeheight: 70,             // card height in px
    hspacing: 24,               // gap between siblings (px)
    vspacing: 50,               // gap between levels (px)
    compact: false,             // stack a node's children vertically when they are all leaves
    height: 480,                // viewport height (px); width is always fluid
    controls: true,             // show the zoom / fit control cluster
    search: true,               // show the quick-search box
    collapsible: true,          // allow collapsing a branch from its card
    avatars: true,              // render the avatar images
    legend: false,              // show a status legend (needs `statuslabels`)
    statuslabels: Object,       // { '#90EE90': 'Active', '#D3D3D3': 'Inactive' }
    minzoom: 0.2,               // lower zoom bound
    maxzoom: 2.5,               // upper zoom bound
    zoom: 0,                    // initial zoom (0 = auto-fit on mount)
    fit: true,                  // auto-fit the whole chart into view on mount
    onchange: Function,         // (id, item) on selection (bindable)
    onnodeclick: Function,      // (id, item) on any card click
    oncollapse: Function,       // (id, collapsed) on expand/collapse
    onzoom: Function,           // (scale) after any zoom change
    api: {
        select: Function, center: Function, fit: Function, reset: Function,
        zoomIn: Function, zoomOut: Function, setZoom: Function, getZoom: Function,
        expand: Function, collapse: Function, toggle: Function,
        expandAll: Function, collapseAll: Function,
    },
}, (props, { state, computed, bind, onMount, onUnmount, listen }) => {
    const selected = bind(props, '' as OrgId);

    const items = (): OrgItem[] => (props.data.value as OrgItem[]) || [];
    const num = (s: { value: unknown }, d: number): number => {
        const n = Number(s.value);
        return Number.isFinite(n) && n > 0 ? n : d;
    };

    /* ----- collapsed branches: a Set state, mutated in place + touch ----- */
    const collapsed = state(new Set<OrgId>());
    const isCollapsed = (id: OrgId): boolean => collapsed.value.has(id);

    /* ----- the whole laid-out scene as ONE derived value ----- */
    const model = computed<OrgModel>(() => {
        const w = num(props.nodewidth, 180);
        const h = num(props.nodeheight, 70);
        return buildModel(items(), collapsed.value, {
            vertical: props.orientation.value !== 'horizontal',
            nodeW: w,
            nodeH: h,
            crossGap: num(props.hspacing, 24),
            levelGap: num(props.vspacing, 50),
            rootGap: num(props.hspacing, 24) * 2,
            compact: props.compact.value === true,
            stackGap: 14,
            indent: Math.round((props.orientation.value !== 'horizontal' ? w : h) * 0.16) + 16,
        });
    });

    /* ----- pan/zoom: their OWN state, applied as a transform ----- */
    const pan = state({ x: 0, y: 0 });
    const zoom = state(1);
    const animating = state(false); // CSS-transition the transform for programmatic moves only

    let viewport: HTMLElement | null = null;
    const minZ = (): number => num(props.minzoom, 0.2);
    const maxZ = (): number => Math.max(minZ(), num(props.maxzoom, 2.5));

    /** Soft-animate a programmatic move (fit/center/buttons); drags stay snappy. */
    let glideTimer: ReturnType<typeof setTimeout> | null = null;
    const glide = (fn: () => void): void => {
        animating.value = true;
        fn();
        if (glideTimer) clearTimeout(glideTimer);
        glideTimer = setTimeout(() => (animating.value = false), 320);
    };
    onUnmount(() => { if (glideTimer) clearTimeout(glideTimer); });

    const setZoom = (scale: number, cx?: number, cy?: number): void => {
        const r = viewport?.getBoundingClientRect();
        const ax = cx ?? (r ? r.width / 2 : 0);
        const ay = cy ?? (r ? r.height / 2 : 0);
        const s0 = zoom.value;
        const s1 = clamp(scale, minZ(), maxZ());
        if (s1 === s0) return;
        // keep the world point under (ax, ay) fixed across the zoom
        const wx = (ax - pan.value.x) / s0;
        const wy = (ay - pan.value.y) / s0;
        pan.value = { x: ax - wx * s1, y: ay - wy * s1 };
        zoom.value = s1;
        props.onzoom?.(s1);
    };

    const onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        const r = viewport?.getBoundingClientRect();
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        setZoom(zoom.value * factor, r ? e.clientX - r.left : undefined, r ? e.clientY - r.top : undefined);
    };

    /** Fit the whole chart into the viewport (caps at 1× so small charts stay crisp). */
    const fit = (): void => {
        const r = viewport?.getBoundingClientRect();
        const m = model.value;
        if (!r || !r.width || !r.height || !m.nodes.length || !m.width || !m.height) return;
        const pad = 32;
        const s = clamp(Math.min((r.width - pad * 2) / m.width, (r.height - pad * 2) / m.height), minZ(), Math.min(maxZ(), 1));
        glide(() => {
            zoom.value = s;
            pan.value = { x: (r.width - m.width * s) / 2, y: pad };
            props.onzoom?.(s);
        });
    };

    /** Center the viewport on a node, expanding its ancestors if needed. */
    const center = (id: OrgId): void => {
        // re-reveal a node that was collapsed away
        const anc = ancestorsOf(items(), id);
        let changed = false;
        for (const a of anc) {
            if (collapsed.value.delete(a)) changed = true;
        }
        if (changed) collapsed.touch();
        const node = model.value.nodes.find((n) => Object.is(n.id, id));
        const r = viewport?.getBoundingClientRect();
        if (!node || !r) return;
        const s = zoom.value;
        const w = num(props.nodewidth, 180);
        const h = num(props.nodeheight, 70);
        glide(() => {
            pan.value = {
                x: r.width / 2 - (node.x + w / 2) * s,
                y: r.height / 3 - (node.y + h / 2) * s,
            };
        });
    };

    /* ----- expand / collapse ----- */
    const setCollapsed = (id: OrgId, want: boolean): void => {
        const node = model.value.nodes.find((n) => Object.is(n.id, id));
        // only meaningful for a node that actually has children
        const hasKids = node ? node.hasChildren : items().some((it) => it.parent === id);
        if (!hasKids || isCollapsed(id) === want) return;
        if (want) collapsed.value.add(id);
        else collapsed.value.delete(id);
        collapsed.touch();
        props.oncollapse?.(id, want);
    };

    /* ----- selection (manual commit so onchange can carry the item) ----- */
    const doSelect = (it: OrgItem): void => {
        if (Object.is(selected.value, it.id)) return;
        selected.value = it.id;
        props.onchange?.(it.id, it);
    };

    /* ----- background pan (Google-Maps style) ----- */
    let dragging = false;
    let moved = false;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    const onDown = (e: PointerEvent): void => {
        dragging = true;
        moved = false;
        sx = e.clientX;
        sy = e.clientY;
        ox = pan.value.x;
        oy = pan.value.y;
    };
    const onMove = (e: PointerEvent): void => {
        if (!dragging) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 4) moved = true;
        if (moved) pan.value = { x: ox + dx, y: oy + dy };
    };
    const onUp = (): void => { dragging = false; };

    onMount(() => {
        if (viewport) listen(viewport, 'wheel', onWheel as EventListener, { passive: false });
        listen(window, 'pointermove', onMove as EventListener);
        listen(window, 'pointerup', onUp as EventListener);
        const initial = num(props.zoom, 0);
        if (initial > 0) setZoom(initial);
        else if (props.fit.value !== false) fit();
    });

    /* ----- imperative api ----- */
    props.ref?.({
        select: (id: OrgId) => { const it = items().find((p) => Object.is(p.id, id)); if (it) doSelect(it); },
        center,
        fit,
        reset: fit,
        zoomIn: () => setZoom(zoom.value * 1.2),
        zoomOut: () => setZoom(zoom.value / 1.2),
        setZoom: (s: number) => setZoom(s),
        getZoom: () => zoom.value,
        expand: (id: OrgId) => setCollapsed(id, false),
        collapse: (id: OrgId) => setCollapsed(id, true),
        toggle: (id: OrgId) => setCollapsed(id, !isCollapsed(id)),
        expandAll: () => { if (collapsed.value.size) { collapsed.value.clear(); collapsed.touch(); } },
        collapseAll: () => {
            const next = new Set<OrgId>();
            for (const it of items()) if (items().some((c) => c.parent === it.id)) next.add(it.id);
            collapsed.value = next;
        },
    } satisfies OrgApi);

    /* ----- quick search ----- */
    const query = state('');
    const open = state(false);
    const active = state(-1); // highlighted result index (-1 = none)
    const listId = 'lm-organogram-results-' + ++uid;
    const optionId = (i: number): string => listId + '-' + i;
    const matches = computed<OrgItem[]>(() => {
        const q = query.value.trim().toLowerCase();
        if (!q) return [];
        return items()
            .filter((it) => String(it.name ?? '').toLowerCase().includes(q) || String(it.role ?? '').toLowerCase().includes(q))
            .slice(0, 8);
    });
    const pick = (it: OrgItem): void => {
        query.value = '';
        open.value = false;
        active.value = -1;
        doSelect(it);
        center(it.id);
    };
    const onSearchKey = (e: KeyboardEvent): void => {
        const m = matches.value;
        if (e.key === 'ArrowDown' && m.length) {
            e.preventDefault();
            open.value = true;
            active.value = Math.min(active.value + 1, m.length - 1);
        } else if (e.key === 'ArrowUp' && m.length) {
            e.preventDefault();
            active.value = Math.max(active.value - 1, 0);
        } else if (e.key === 'Enter') {
            // the highlighted result wins; no highlight defaults to the first
            const it = m[active.value] ?? m[0];
            if (it) pick(it);
        } else if (e.key === 'Escape') {
            open.value = false;
            active.value = -1;
        }
    };

    /* ----- views ----- */
    const statusTitle = (color: string): string => {
        const map = props.statuslabels.value as Record<string, string> | undefined;
        return (map && map[color]) || color || '';
    };

    /** Accessible name for a card: name, role, status and who it reports to
     *  (the hierarchy is otherwise only drawn by the SVG connectors). */
    const nodeLabel = (it: OrgItem): string => {
        const parts = [String(it.name ?? ''), String(it.role ?? '')].filter(Boolean);
        const status = String(it.status ?? '');
        if (status) parts.push('status ' + statusTitle(status));
        const boss = it.parent != null && it.parent !== 0
            ? items().find((p) => Object.is(p.id, it.parent))
            : undefined;
        if (boss && boss.name) parts.push('reports to ' + String(boss.name));
        return parts.join(', ');
    };

    const nodeView = (n: OrgNode): View => {
        const it = n.item;
        const w = num(props.nodewidth, 180);
        const h = num(props.nodeheight, 70);
        const status = String(it.status ?? '');
        const showToggle = props.collapsible.value !== false && n.hasChildren;
        return html`<div class="lm-organogram-node ${() => (Object.is(selected.value, n.id) ? 'lm-organogram-selected' : '')}"
            key="${n.id}" data-id="${String(n.id)}" tabindex="0" role="button"
            aria-pressed="${() => (Object.is(selected.value, n.id) ? 'true' : 'false')}"
            aria-label="${nodeLabel(it)}"
            style="${css({ left: n.x + 'px', top: n.y + 'px', width: w + 'px', height: h + 'px', 'border-left-color': status || 'transparent' })}"
            onclick="${() => { if (!moved) { doSelect(it); props.onnodeclick?.(it.id, it); } }}"
            onkeydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSelect(it); props.onnodeclick?.(it.id, it); } }}">
            ${status ? html`<span class="lm-organogram-status" aria-hidden="true" style="${css({ background: status })}" title="${statusTitle(status)}"></span>` : false}
            ${props.avatars.value !== false ? html`<div class="lm-organogram-avatar">
                <span class="lm-organogram-initials">${initials(String(it.name ?? ''))}</span>
                ${it.img ? html`<img alt="${String(it.name ?? '')}" src="${String(it.img)}"
                    onerror="${(e: Event) => ((e.target as HTMLElement).style.display = 'none')}" />` : false}
            </div>` : false}
            <div class="lm-organogram-info">
                <div class="lm-organogram-name">${String(it.name ?? '')}</div>
                <div class="lm-organogram-role">${String(it.role ?? '')}</div>
            </div>
            ${showToggle ? html`<button type="button" class="lm-organogram-toggle"
                data-collapsed="${() => (isCollapsed(n.id) ? 'true' : 'false')}"
                title="${() => (isCollapsed(n.id) ? 'Expand' : 'Collapse')}"
                onpointerdown="${(e: PointerEvent) => e.stopPropagation()}"
                onclick="${(e: MouseEvent) => { e.stopPropagation(); setCollapsed(n.id, !isCollapsed(n.id)); }}"></button>` : false}
        </div>`;
    };

    const worldStyle = (): string => {
        const t = `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`;
        return `transform: ${t}; transition: ${animating.value ? 'transform .3s ease' : 'none'};`;
    };

    const controls = (): View | false => props.controls.value === false ? false : html`<div class="lm-organogram-controls">
        <div class="lm-organogram-zoom">
            <button type="button" title="Zoom in" aria-label="Zoom in"
                disabled="${() => zoom.value >= maxZ()}"
                onclick="${() => glide(() => setZoom(zoom.value * 1.25))}">
                <span class="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
            <button type="button" title="Zoom out" aria-label="Zoom out"
                disabled="${() => zoom.value <= minZ()}"
                onclick="${() => glide(() => setZoom(zoom.value / 1.25))}">
                <span class="material-symbols-outlined" aria-hidden="true">remove</span>
            </button>
        </div>
        <button type="button" class="lm-organogram-fit" title="Fit to screen" aria-label="Fit to screen" onclick="${fit}">
            <span class="material-symbols-outlined" aria-hidden="true">fit_screen</span>
        </button>
    </div>`;

    const search = (): View | false => props.search.value === false ? false : html`<div class="lm-organogram-search">
        <input type="text" placeholder="Search people…" aria-label="Search"
            role="combobox" aria-autocomplete="list" aria-controls="${listId}"
            aria-expanded="${() => (open.value && matches.value.length ? 'true' : 'false')}"
            aria-activedescendant="${() => (open.value && active.value >= 0 && matches.value[active.value] ? optionId(active.value) : false)}"
            value="${() => query.value}"
            oninput="${(e: Event) => { query.value = (e.target as HTMLInputElement).value; open.value = true; active.value = -1; }}"
            onfocus="${() => (open.value = true)}"
            onkeydown="${onSearchKey}" />
        ${() => (open.value && matches.value.length ? html`<ul class="lm-organogram-results" id="${listId}" role="listbox">
            ${matches.value.map((it, i) => html`<li key="${it.id}" id="${optionId(i)}" role="option"
                aria-selected="${() => (active.value === i ? 'true' : 'false')}"
                data-active="${() => (active.value === i ? 'true' : false)}"
                onmousedown="${(e: MouseEvent) => { e.preventDefault(); pick(it); }}">
                <span class="lm-organogram-result-name">${String(it.name ?? '')}</span>
                <span class="lm-organogram-result-role">${String(it.role ?? '')}</span>
            </li>`)}
        </ul>` : false)}
    </div>`;

    const legend = (): View | false => {
        const map = props.statuslabels.value as Record<string, string> | undefined;
        if (props.legend.value !== true || !map) return false;
        return html`<div class="lm-organogram-legend">${Object.keys(map).map((color) => html`<span class="lm-organogram-legend-item">
            <span class="lm-organogram-legend-dot" style="${css({ background: color })}"></span>${map[color]}
        </span>`)}</div>`;
    };

    return html`<div class="lm-organogram" style="${() => css({ height: num(props.height, 480) + 'px' })}">
        <div class="lm-organogram-viewport" ref="${(el: HTMLElement) => (viewport = el)}"
            onpointerdown="${onDown}">
            <div class="lm-organogram-world" style="${() => worldStyle()}">
                <svg class="lm-organogram-edges" width="${() => model.value.width}" height="${() => model.value.height}"
                    viewBox="${() => '0 0 ' + model.value.width + ' ' + model.value.height}">
                    ${() => model.value.edges.map((e) => html`<path key="${e.from + '>' + e.to}" d="${e.path}" />`)}
                </svg>
                ${() => model.value.nodes.map((n) => nodeView(n))}
            </div>
        </div>
        ${() => controls()}
        ${() => search()}
        ${() => legend()}
    </div>`;
});

export default Organogram;
