/**
 * <Chart /> hierarchy renderers — tree-based partitions. The first
 * series' points are NODES `{ name, value, parent? }` (no parent = a
 * root); a node's total is its own value plus its descendants'.
 *   - sunburst: radial partition (rings by depth) — treemap's radial cousin
 *   - icicle: rectangular partition (rows by depth)
 * Children inherit their root ancestor's colour, lightened per depth.
 */
import { css, html, type View } from 'lemonadejs';
import type { Model, NormPoint, RenderCtx } from './model';
import { annulus, lerpColor, polar, sector, textOn } from './helpers';

interface TNode { p: NormPoint; i: number; children: TNode[]; total: number; depth: number; }

/** Build the forest from the flat parent-named points; returns roots + depth. */
const buildTree = (m: Model): { roots: TNode[]; levels: number } => {
    const pts = m.series[0] ? m.series[0].points : [];
    const nodes: TNode[] = [];
    pts.forEach((p, i) => { if (!p.gap && (p.name || p.value > 0)) nodes.push({ p, i, children: [], total: 0, depth: 0 }); });
    const byName = new Map<string, TNode>();
    for (const n of nodes) if (n.p.name) byName.set(n.p.name, n);
    const roots: TNode[] = [];
    for (const n of nodes) {
        const par = n.p.parent ? byName.get(n.p.parent) : undefined;
        if (par && par !== n) par.children.push(n);
        else roots.push(n);
    }
    let levels = 0;
    const visit = (n: TNode, depth: number): number => {
        n.depth = depth;
        levels = Math.max(levels, depth + 1);
        let t = Math.max(0, n.p.value);
        for (const c of n.children) t += visit(c, depth + 1);
        n.total = t;
        return t;
    };
    for (const r of roots) visit(r, 0);
    return { roots: roots.filter((r) => r.total > 0), levels: Math.max(levels, 1) };
};

/** A node's colour: its root ancestor's, lightened as depth grows. */
const shade = (rootColor: string, depth: number): string =>
    depth === 0 ? rootColor : lerpColor(rootColor, '#ffffff', Math.min(0.55, depth * 0.22));

/* ----- sunburst (radial partition) ----- */
export const sunburstChart = (m: Model, ctx: RenderCtx): View => {
    const { roots, levels } = buildTree(m);
    const RMAX = 46;
    const RIN = 7;
    const step = (RMAX - RIN) / levels;
    const cells: View[] = [];
    const labels: View[] = [];

    const place = (n: TNode, start: number, end: number, rootColor: string): void => {
        const rIn = RIN + n.depth * step;
        const rOut = rIn + step - 0.5;
        const color = shade(rootColor, n.depth);
        const spanA = end - start;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, n.p.name || '—', [{ name: '', value: ctx.fmt(n.total), color }]);
        cells.push(html`<path class="lm-chart-sun-cell" fill-rule="evenodd"
            d="${spanA >= 359.9 ? annulus(rOut, rIn) : sector(start, end, rOut, rIn)}"
            style="${css({ fill: color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(n.p, 0, n.i)}" />`);
        if (m.labels && spanA > 15 && n.p.name) {
            const [x, y] = polar((start + end) / 2, (rIn + rOut) / 2);
            labels.push(html`<span class="lm-chart-sun-label" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%', color: textOn(color) })}"
                >${n.p.name}</span>`);
        }
        // children split the parent's span by their totals; a parent's own
        // value (if any) is the unfilled remainder at the end of its span
        let a = start;
        const base = n.total || 1;
        for (const c of n.children) {
            const w = spanA * (c.total / base);
            place(c, a, a + w, rootColor);
            a += w;
        }
    };

    const totalRoots = roots.reduce((s, r) => s + r.total, 0) || 1;
    let a = 0;
    for (const r of roots) {
        const w = 360 * (r.total / totalRoots);
        place(r, a, a + w, r.p.color);
        a += w;
    }

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${cells}</svg>
            ${labels}
        </div>
    </div>`;
};

/* ----- icicle (rectangular partition, rows top-down; HTML divs) ----- */
export const icicleChart = (m: Model, ctx: RenderCtx): View => {
    const { roots, levels } = buildTree(m);
    const rowH = 100 / levels;
    const tiles: View[] = [];

    const place = (n: TNode, x0: number, x1: number, rootColor: string): void => {
        const color = shade(rootColor, n.depth);
        const w = x1 - x0;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, n.p.name || '—', [{ name: '', value: ctx.fmt(n.total), color }]);
        tiles.push(html`<div class="lm-chart-icicle-tile"
            style="${css({ left: x0 + '%', top: (n.depth * rowH) + '%', width: w + '%', height: rowH + '%', background: color, color: textOn(color) })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(n.p, 0, n.i)}">${
            w > 7 && n.p.name ? html`<span class="lm-chart-icicle-name">${n.p.name}${
                m.labels ? html` <span class="lm-chart-icicle-val">${ctx.fmt(n.total)}</span>` : false
            }</span>` : false
        }</div>`);
        let a = x0;
        const base = n.total || 1;
        for (const c of n.children) {
            const cw = w * (c.total / base);
            place(c, a, a + cw, rootColor);
            a += cw;
        }
    };

    const totalRoots = roots.reduce((s, r) => s + r.total, 0) || 1;
    let x = 0;
    for (const r of roots) {
        const w = 100 * (r.total / totalRoots);
        place(r, x, x + w, r.p.color);
        x += w;
    }

    return html`<div class="lm-chart-icicle">${tiles}</div>`;
};
