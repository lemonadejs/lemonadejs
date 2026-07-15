/**
 * <Chart /> flow renderers — link-based diagrams. The first series'
 * points are LINKS `{ from, to, value }`; nodes are derived from the
 * unique endpoint names, coloured by palette order.
 *   - sankey: layered left-to-right flows (node depth = longest path)
 *   - chord / dependency wheel: nodes on a circle, ribbons between them
 */
import { css, html, type View } from 'lemonadejs';
import type { Model, NormPoint, RenderCtx } from './model';
import { polar, sector } from './helpers';

const f2 = (n: number): string => n.toFixed(2);

interface FlowNode { name: string; color: string; in: number; out: number; total: number; }
interface FlowLink { p: NormPoint; i: number; }

/** Collect the links and derive the node list (+ per-node flow totals). */
const flowData = (m: Model): { links: FlowLink[]; nodes: FlowNode[]; index: Map<string, number> } => {
    const pts = m.series[0] ? m.series[0].points : [];
    const links = pts.map((p, i) => ({ p, i })).filter((e) => !e.p.gap && e.p.from !== '' && e.p.to !== '' && e.p.value > 0);
    const index = new Map<string, number>();
    const nodes: FlowNode[] = [];
    const node = (name: string): FlowNode => {
        let ix = index.get(name);
        if (ix == null) {
            ix = nodes.length;
            index.set(name, ix);
            nodes.push({ name, color: m.palette[ix % m.palette.length], in: 0, out: 0, total: 0 });
        }
        return nodes[ix];
    };
    for (const e of links) {
        node(e.p.from).out += e.p.value;
        node(e.p.to).in += e.p.value;
    }
    for (const n of nodes) n.total = Math.max(n.in, n.out);
    return { links, nodes, index };
};

/* ----- sankey (layered flows; SVG stretched to the plot box) ----- */
export const sankeyChart = (m: Model, ctx: RenderCtx): View => {
    const { links, nodes, index } = flowData(m);
    const N = nodes.length;

    // node depth = longest path from any source (relaxed; cycles capped at N)
    const depth = new Array(N).fill(0);
    for (let pass = 0; pass < N; pass++) {
        let changed = false;
        for (const e of links) {
            const a = index.get(e.p.from) as number;
            const b = index.get(e.p.to) as number;
            if (a !== b && depth[b] < depth[a] + 1 && depth[a] + 1 <= N) { depth[b] = depth[a] + 1; changed = true; }
        }
        if (!changed) break;
    }
    const maxD = depth.reduce((mx, d) => Math.max(mx, d), 0);

    // columns by depth; one global value→height scale so every column fits
    const cols: number[][] = Array.from({ length: maxD + 1 }, () => []);
    nodes.forEach((_, i) => cols[depth[i]].push(i));
    const pad = 3; // vertical gap between nodes (viewBox units)
    let scale = Infinity;
    for (const col of cols) {
        const sum = col.reduce((s, i) => s + nodes[i].total, 0);
        if (sum > 0) scale = Math.min(scale, (100 - (col.length - 1) * pad - 2) / sum);
    }
    if (!Number.isFinite(scale)) scale = 1;

    const nodeW = 2.2;
    const X = (d: number): number => (maxD === 0 ? 0 : (d / maxD) * (100 - nodeW));
    const top = new Array(N).fill(0);
    const hgt = new Array(N).fill(0);
    for (const col of cols) {
        const sum = col.reduce((s, i) => s + nodes[i].total * scale, 0) + (col.length - 1) * pad;
        let y = (100 - sum) / 2;
        for (const i of col) { top[i] = y; hgt[i] = nodes[i].total * scale; y += hgt[i] + pad; }
    }

    // ribbons: each link takes a slice of its source/target node height;
    // sorted by endpoint position so slices stack without crossing at the node
    const outOff = new Array(N).fill(0);
    const inOff = new Array(N).fill(0);
    const ordered = [...links].sort((a, b) =>
        (top[index.get(a.p.from) as number] - top[index.get(b.p.from) as number])
        || (top[index.get(a.p.to) as number] - top[index.get(b.p.to) as number]));
    const ribbons = ordered.map((e) => {
        const a = index.get(e.p.from) as number;
        const b = index.get(e.p.to) as number;
        const h = e.p.value * scale;
        const sy = top[a] + outOff[a]; outOff[a] += h;
        const ty = top[b] + inOff[b]; inOff[b] += h;
        const xa = X(depth[a]) + nodeW;
        const xb = X(depth[b]);
        const mx = (xa + xb) / 2;
        const d = `M ${f2(xa)} ${f2(sy)} C ${f2(mx)} ${f2(sy)}, ${f2(mx)} ${f2(ty)}, ${f2(xb)} ${f2(ty)} ` +
            `L ${f2(xb)} ${f2(ty + h)} C ${f2(mx)} ${f2(ty + h)}, ${f2(mx)} ${f2(sy + h)}, ${f2(xa)} ${f2(sy + h)} Z`;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, e.p.from + ' → ' + e.p.to,
            [{ name: '', value: ctx.fmt(e.p.value), color: nodes[a].color }]);
        return html`<path class="lm-chart-sankey-link" d="${d}" style="${css({ fill: nodes[a].color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(e.p, 0, e.i)}" />`;
    });

    const rects = nodes.map((n, i) => {
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, n.name, [{ name: '', value: ctx.fmt(n.total), color: n.color }]);
        return html`<rect class="lm-chart-sankey-node" x="${f2(X(depth[i]))}" y="${f2(top[i])}"
            width="${String(nodeW)}" height="${f2(Math.max(hgt[i], 0.5))}" style="${css({ fill: n.color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}" />`;
    });
    // labels: to the right of the node, except the last column (left side)
    const labels = m.labels ? nodes.map((n, i) => {
        const last = depth[i] === maxD && maxD > 0;
        return html`<span class="lm-chart-sankey-label" data-side="${last ? 'l' : 'r'}"
            style="${css({ left: (X(depth[i]) + (last ? -0.8 : nodeW + 0.8)) + '%', top: (top[i] + hgt[i] / 2) + '%' })}"
            >${n.name}</span>`;
    }) : [];

    return html`<div class="lm-chart-flow">
        <svg class="lm-chart-flowsvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ribbons}${rects}</svg>
        ${labels}
    </div>`;
};

/* ----- arc diagram (nodes on a baseline, semicircular arcs between) ----- */
export const arcChart = (m: Model, ctx: RenderCtx): View => {
    const { links, nodes, index } = flowData(m);
    const N = nodes.length;
    if (!N) return html`<div class="lm-chart-flow"></div>`;

    // Two stacked rows: the arc PLOT (flex:1 — arcs own the full height,
    // baseline at its bottom edge) and a LABEL row sized to the longest
    // name, so labels never collide with the arcs or clip mid-word.
    const xOf = (i: number): number => (N === 1 ? 50 : 4 + (i / (N - 1)) * 92);
    const peak = nodes.reduce((mx, n) => Math.max(mx, n.in + n.out), 0) || 1;
    // node dots are HTML (px-sized) so they stay ROUND in the stretched svg
    const rPx = (i: number): number => 4 + Math.sqrt((nodes[i].in + nodes[i].out) / peak) * 14;

    // arcs: thin ellipse strokes (hairline px widths via non-scaling-stroke,
    // slightly thicker for heavier links). Heights follow the Highcharts
    // arc-diagram rule — PER ARC, radius = min(half-span, room above the
    // baseline) in PIXELS: true semicircles while they fit, flattened only
    // when a wide span would hit the top. The stretched viewBox needs the
    // real plot aspect for that: measured ONCE when the plot attaches
    // (ctx.arcAspect; 2:1 assumed until known — one extra render, no
    // resize observer, resizing keeps the usual stretched-svg behavior).
    const vmax = links.reduce((mx, e) => Math.max(mx, e.p.value), 0) || 1;
    const BASE = 99.5; // svg baseline (plot bottom, dots straddle it)
    const aspect = ctx.arcAspect.value || 2;
    const measure = (el: HTMLElement): void => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w > 0 && h > 0 && Math.abs(w / h - (ctx.arcAspect.peek() || 0)) > 0.05) {
            ctx.arcAspect.value = w / h;
        }
    };
    const hover = ctx.hover.value;
    const arcs = links.map((e) => {
        const a = index.get(e.p.from) as number;
        const b = index.get(e.p.to) as number;
        const xa = xOf(Math.min(a, b));
        const xb = xOf(Math.max(a, b));
        const rx = (xb - xa) / 2;
        // semicircle in px: ry(viewBox units) = rx · plotW/plotH
        const ry = Math.min(95, rx * aspect);
        const dim = hover && hover !== e.p.from && hover !== e.p.to ? 'true' : false;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, e.p.from + ' → ' + e.p.to,
            [{ name: '', value: ctx.fmt(e.p.value), color: nodes[a].color }]);
        return html`<path class="lm-chart-arc-link" vector-effect="non-scaling-stroke"
            d="M ${f2(xa)} ${f2(BASE)} A ${f2(rx)} ${f2(ry)} 0 0 1 ${f2(xb)} ${f2(BASE)}"
            style="${css({ stroke: nodes[a].color, strokeWidth: (1 + (e.p.value / vmax) * 2.2).toFixed(1) + 'px' })}"
            data-dim="${dim}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(e.p, 0, e.i)}" />`;
    });

    // hovering a node highlights its arcs (ctx.hover carries the node name)
    const dots = nodes.map((n, i) => {
        const tip = (ev: MouseEvent): void => {
            if (ctx.hover.value !== n.name) ctx.hover.value = n.name;
            ctx.showTip(ev, n.name, [{ name: '', value: ctx.fmt(n.in + n.out), color: n.color }]);
        };
        const d = rPx(i) * 2;
        return html`<span class="lm-chart-arc-node"
            style="${css({ left: xOf(i) + '%', top: '100%', width: d, height: d, background: n.color })}"
            data-dim="${hover && hover !== n.name ? 'true' : false}"
            onmousemove="${tip}" ontouchstart="${tip}"
            onmouseleave="${() => { ctx.hideTip(); if (ctx.hover.value === n.name) ctx.hover.value = null; }}"></span>`;
    });

    // vertical labels in their own row: each starts just under its dot
    const maxLen = nodes.reduce((mx, n) => Math.max(mx, n.name.length), 0);
    const maxR = nodes.reduce((mx, _, i) => Math.max(mx, rPx(i)), 0);
    const rowH = m.labels ? Math.round(Math.min(110, maxR + 10 + maxLen * 6.2)) : Math.ceil(maxR + 2);
    const labels = m.labels ? nodes.map((n, i) => html`<span class="lm-chart-arc-label"
        style="${css({ left: xOf(i) + '%', top: (rPx(i) + 4) + 'px', maxHeight: (rowH - rPx(i) - 6) + 'px' })}"
        data-on="${hover === n.name ? 'true' : false}">${n.name}</span>`) : [];

    return html`<div class="lm-chart-flow lm-chart-arcflow">
        <div class="lm-chart-arc-plot" ref="${measure}">
            <svg class="lm-chart-flowsvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${arcs}</svg>
            ${dots}
        </div>
        <div class="lm-chart-arc-labels" style="${css({ height: rowH + 'px' })}">${labels}</div>
    </div>`;
};

/* ----- chord / dependency wheel (circular flows) ----- */
export const chordChart = (m: Model, ctx: RenderCtx): View => {
    const { links, nodes, index } = flowData(m);
    const N = nodes.length || 1;
    // a node's arc hosts BOTH directions, so it is sized by in + out
    // (unlike sankey, where a node's height is max(in, out))
    const flow = nodes.map((n) => n.in + n.out);
    const totalFlow = flow.reduce((s, v) => s + v, 0) || 1;
    const padAng = Math.min(4, 90 / N); // gap between node arcs (degrees)
    const span = 360 - padAng * N;
    const RO = 46;
    const RI = 42;

    // each node gets an arc proportional to its total flow
    const a0 = new Array(N).fill(0);
    const a1 = new Array(N).fill(0);
    let ang = padAng / 2;
    nodes.forEach((_, i) => { a0[i] = ang; a1[i] = ang + (flow[i] / totalFlow) * span; ang = a1[i] + padAng; });

    const arcs = nodes.map((n, i) => {
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, n.name, [{ name: '', value: ctx.fmt(n.total), color: n.color }]);
        return html`<path class="lm-chart-chord-arc" d="${sector(a0[i], a1[i], RO, RI)}"
            style="${css({ fill: n.color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}" />`;
    });

    // ribbons: consume value-proportional sub-spans of both endpoint arcs
    const cursor = [...a0];
    const P = (a: number): string => { const [x, y] = polar(a, RI); return f2(x) + ' ' + f2(y); };
    const arcTo = (from: number, to: number): string =>
        `A ${RI} ${RI} 0 ${to - from > 180 ? 1 : 0} 1 ${P(to)}`;
    const ribbons = links.map((e) => {
        const a = index.get(e.p.from) as number;
        const b = index.get(e.p.to) as number;
        const w = (e.p.value / totalFlow) * span;
        const s0 = cursor[a]; cursor[a] += w; const s1 = cursor[a];
        let t0 = s0;
        let t1 = s1;
        if (b !== a) { t0 = cursor[b]; cursor[b] += w; t1 = cursor[b]; }
        const d = `M ${P(s0)} ${arcTo(s0, s1)} Q 50 50 ${P(t0)} ${arcTo(t0, t1)} Q 50 50 ${P(s0)} Z`;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, e.p.from + ' → ' + e.p.to,
            [{ name: '', value: ctx.fmt(e.p.value), color: nodes[a].color }]);
        return html`<path class="lm-chart-chord-link" d="${d}" style="${css({ fill: nodes[a].color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(e.p, 0, e.i)}" />`;
    });

    const labels = m.labels ? nodes.map((n, i) => {
        const [x, y] = polar((a0[i] + a1[i]) / 2, RO + 4);
        return html`<span class="lm-chart-radar-label" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}"
            >${n.name}</span>`;
    }) : [];

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${ribbons}${arcs}</svg>
            ${labels}
        </div>
    </div>`;
};
