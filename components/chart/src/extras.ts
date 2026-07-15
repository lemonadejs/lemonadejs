/**
 * <Chart /> standalone renderers — scatter/bubble, bullet, heatmap,
 * treemap and the sparkline mode.
 */
import { css, html, type View } from 'lemonadejs';
import { PALETTES, type Model, type NormSeries, type RenderCtx } from './model';
import { lerpColor, niceExtent, polyPath, smoothPath, squarify, stepPath, textOn } from './helpers';

/* ----- scatter / bubble (numeric x + y axes) ----- */
export const scatterChart = (m: Model, ctx: RenderCtx): View => {
    const bubble = m.type === 'bubble';
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    const all = vis.flatMap((s) => s.points.filter((p) => !p.gap).map((p) => ({ p, s })));
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;
    let zmax = 0;
    for (const { p } of all) {
        xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
        ymin = Math.min(ymin, p.value); ymax = Math.max(ymax, p.value);
        zmax = Math.max(zmax, p.z);
    }
    if (!Number.isFinite(xmin)) { xmin = 0; xmax = 1; ymin = 0; ymax = 1; }
    // pad the extents 5% so edge points sit INSIDE the plot instead of
    // half-clipped on the axis line — including past zero: a point at an
    // exact 0 boundary must not sit half outside the grid, so the axis
    // grows a tick below/above the data when needed (Highcharts padding)
    const pad = (min: number, max: number): [number, number] => {
        const p = (max - min || 1) * 0.05;
        return [min - p, max + p];
    };
    const [pxlo, pxhi] = pad(xmin, xmax);
    const [pylo, pyhi] = pad(ymin, ymax);
    const xs = niceExtent(pxlo, pxhi);
    const ys = niceExtent(pylo, pyhi);
    const xf = (v: number): number => (xs.hi > xs.lo ? (v - xs.lo) / (xs.hi - xs.lo) : 0.5);
    const yf = (v: number): number => (ys.hi > ys.lo ? (v - ys.lo) / (ys.hi - ys.lo) : 0.5);
    // radius in px (the SVG has no viewBox → user units are pixels, so
    // circles stay round; cx/cy are % of the viewport). Scales to many points.
    const rOf = (z: number): number => bubble && zmax > 0 ? 3 + Math.sqrt(z / zmax) * 15 : 4.5;

    // marker shape: explicit per-series `marker` wins; unset cycles the
    // Highcharts symbol order per series so multi-series scatters stay
    // tellable apart in print/grayscale too. Bubbles are always circles.
    const CYCLE = ['circle', 'diamond', 'square', 'triangle'];
    const shapeOf = (s: NormSeries): string =>
        bubble ? 'circle' : s.marker || CYCLE[m.series.indexOf(s) % CYCLE.length];

    // line-type series (combo overlay): a connected path in the same x/y
    // space, drawn in a preserveAspectRatio-none viewBox so it stretches to
    // the plot. Its own points draw no markers (Chart.js pointRadius:0), but
    // still counted in the extent above so the line stays inside the frame.
    const linePaths = vis.filter((s) => s.type === 'line').flatMap((s) => {
        const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
        // break the line on gaps (null points), connecting in data order
        const segs: Array<Array<[number, number]>> = [];
        let cur: Array<[number, number]> = [];
        for (const p of s.points) {
            if (p.gap) { if (cur.length) { segs.push(cur); cur = []; } continue; }
            cur.push([xf(p.x) * 100, (1 - yf(p.value)) * 100]);
        }
        if (cur.length) segs.push(cur);
        return segs.map((seg) => html`<path class="lm-chart-line"
            d="${s.smooth ? smoothPath(seg) : polyPath(seg)}"
            style="${css({ stroke: s.color })}" data-dim="${dim}"
            data-dashed="${s.dashed ? 'true' : false}" />`);
    });
    const lineOverlay = linePaths.length
        ? html`<div class="lm-chart-lineoverlay">
            <svg class="lm-chart-linesvg" viewBox="0 0 100 100" preserveAspectRatio="none">${linePaths}</svg>
        </div>`
        : false;

    const markers = all.filter(({ s }) => s.type !== 'line').map(({ p, s }) => {
        const tipVal = ctx.fmt(p.x) + ', ' + ctx.fmt(p.value) + (bubble ? ' · ' + ctx.fmt(p.z) : '');
        const shape = shapeOf(s);
        const r = rOf(p.z);
        const cx = (xf(p.x) * 100).toFixed(2) + '%';
        const cy = ((1 - yf(p.value)) * 100).toFixed(2) + '%';
        const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
        const tip = (e: MouseEvent): void => ctx.showTip(e, s.name, [{ name: '', value: tipVal, color: s.color }]);
        const click = (): void => ctx.fire(p, m.series.indexOf(s), s.points.indexOf(p));
        // non-circles are <rect>s anchored by x/y in % and centred/reshaped
        // via CSS (transform-box: fill-box + clip-path), so % positioning
        // keeps working inside the unscaled (viewBox-less) svg
        return shape === 'circle'
            ? html`<circle class="lm-chart-dot" cx="${cx}" cy="${cy}" r="${r}"
                style="${css({ fill: s.color })}" data-dim="${dim}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}" onclick="${click}" />`
            : html`<rect class="lm-chart-dot" data-shape="${shape}"
                x="${cx}" y="${cy}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}"
                style="${css({ fill: s.color })}" data-dim="${dim}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}" onclick="${click}" />`;
    });

    // bubble name labels (annotated-bubble look): centred dark text
    const bubbleNames = bubble && m.labels
        ? all.filter(({ p }) => p.name).map(({ p }) => html`<span class="lm-chart-bubble-name"
            style="${css({ left: (xf(p.x) * 100).toFixed(2) + '%', top: ((1 - yf(p.value)) * 100).toFixed(2) + '%' })}"
            >${p.name}</span>`)
        : [];

    // bubble size legend (two reference circles)
    const sizeLegend = bubble && zmax > 0
        ? html`<div class="lm-chart-bubble-legend">
            ${[zmax, zmax / 4].map((z) => html`<span class="lm-chart-bubble-ref">
                <span class="lm-chart-bubble-dot" style="${css({ width: rOf(z) * 2, height: rOf(z) * 2 })}"></span>
                <span class="lm-chart-bubble-z">${ctx.fmt(z)}</span>
            </span>`)}
        </div>`
        : false;

    return html`<div class="lm-chart-plotblock">
        <div class="lm-chart-area">
            ${m.ytitle ? html`<div class="lm-chart-ytitle"><span>${m.ytitle}</span></div>` : false}
            <div class="lm-chart-plotcol">
                <div class="lm-chart-plot">
                    <div class="lm-chart-grid" data-off="${m.gridlines ? false : 'true'}">${[...ys.ticks].reverse().map(
                        (t) => html`<div class="lm-chart-gridline"><span class="lm-chart-tick">${ctx.fmt(t)}</span></div>`,
                    )}</div>
                    <div class="lm-chart-grid" data-orient="h" data-off="${m.gridlines ? false : 'true'}">${xs.ticks.map(
                        () => html`<div class="lm-chart-gridline"></div>`,
                    )}</div>
                    ${lineOverlay}
                    <svg class="lm-chart-scatter" width="100%" height="100%">${markers}</svg>
                    ${bubbleNames}
                    ${sizeLegend}
                </div>
                <div class="lm-chart-xvalues">${xs.ticks.map(
                    (t) => {
                        const xfmt = ctx.xformat();
                        return html`<div class="lm-chart-xval"><span>${typeof xfmt === 'function' ? String(xfmt(t)) : ctx.fmt(t)}</span></div>`;
                    })}</div>
                ${m.xtitle ? html`<div class="lm-chart-xtitle">${m.xtitle}</div>` : false}
            </div>
        </div>
    </div>`;
};


/* ----- pictogram / isotype (repeated glyphs filled by value; waffle = a
        square-glyph grid). Each series[0] point is one row; the row fills
        `value / total` of its glyphs — whole glyphs plus a bottom-clipped
        fractional one. Pure HTML grid + inline SVG glyphs: no redraw. ----- */
const GLYPHS: Record<string, string> = {
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    circle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    square: 'M3 3h18v18H3z',
    capsule: 'M12 1a5 5 0 0 1 5 5v12a5 5 0 0 1-10 0V6a5 5 0 0 1 5-5z',
    star: 'M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z',
    heart: 'M12 21s-7.5-4.9-10-9.5C.5 8 2.5 4 6 4c2 0 3.3 1.2 4 2.3C10.7 5.2 12 4 14 4c3.5 0 5.5 4 4 7.5C19.5 16.1 12 21 12 21z',
};

/** Resolve the glyph path: a preset key, else a raw SVG path, else a fallback. */
const glyphPath = (raw: string, fallback: string): string =>
    GLYPHS[raw] || (raw.trim().charAt(0).toUpperCase() === 'M' ? raw.trim() : fallback);

/** One glyph cell: muted base + a bottom-clipped colour fill (0..1). */
const glyphCell = (path: string, fill: number, color: string): View => html`<span class="lm-chart-picto">
    <svg class="lm-chart-picto-svg" viewBox="0 0 24 24"><path d="${path}" /></svg>
    ${fill > 0 ? html`<span class="lm-chart-picto-fill" style="${css({ height: (fill * 100).toFixed(1) + '%' })}">
        <svg class="lm-chart-picto-svg" viewBox="0 0 24 24"><path d="${path}" style="${css({ fill: color })}" /></svg>
    </span>` : false}
</span>`;

export const pictogramChart = (m: Model, ctx: RenderCtx): View => {
    // one glyph row per data point; MULTIPLE series each become one row
    // (name/colour from the series, value = the series total) so datasets
    // compare side by side and keep walking the palette
    const multi = m.series.length > 1;
    const rows0 = multi
        ? m.series.map((s, si) => {
            const pts = s.points.filter((p) => !p.gap);
            const value = pts.reduce((t, p) => t + p.value, 0);
            return { name: s.name, value, color: s.color, point: { ...(pts[0] || s.points[0]), name: s.name, value }, si, pi: 0 };
        })
        : (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap)
            .map((p, pi) => ({ name: p.name, value: p.value, color: p.color, point: p, si: 0, pi }));
    const rows = rows0.filter((r) => !ctx.isHidden(r.name || '#' + (multi ? r.si : r.pi)));
    const path = glyphPath(m.icon || 'person', GLYPHS.person);
    const cols = Math.max(1, m.columns || 10);
    const perRow = Math.min(400, Math.max(cols, m.iconcount || cols));
    const full = m.total > 0 ? m.total : 100;
    // cap the glyph size so a tall grid fits the plot height instead of
    // overflowing into the title: fit `gridRows` into the space left after
    // the header, then clamp to a sensible 34px maximum
    const gridRows = rows.length * Math.ceil(perRow / cols);
    const headroom = m.title || m.subtitle ? 56 : 16;
    const avail = Math.max(90, (m.height || 320) - headroom - 20);
    const cell = Math.max(6, Math.min(34, (avail - gridRows * 5) / Math.max(1, gridRows)));
    const gridW = Math.round(cols * cell);

    const row = (r: typeof rows[number]): View => {
        const f = Math.max(0, Math.min(1, r.value / full));
        const filled = f * perRow; // glyph-units filled across the row
        const color = r.color;
        const tip = (e: MouseEvent): void => ctx.showTip(e, r.name || '', [{ name: '', value: ctx.fmt(r.value), color }]);
        const glyphs = Array.from({ length: perRow }, (_, g) => glyphCell(path, Math.max(0, Math.min(1, filled - g)), color));
        return html`<div class="lm-chart-picto-row"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire({ ...r.point, color }, r.si, r.pi)}">
            ${m.labels ? html`<div class="lm-chart-picto-meta">
                <span class="lm-chart-picto-value" style="${css({ color })}">${full === 100 ? Math.round(f * 100) + '%' : ctx.fmt(r.value)}</span>
                ${r.name ? html`<span class="lm-chart-picto-name">${r.name}</span>` : false}
            </div>` : false}
            <div class="lm-chart-picto-grid"
                style="${css({ gridTemplateColumns: 'repeat(' + cols + ', 1fr)', width: gridW + 'px' })}">${glyphs}</div>
        </div>`;
    };

    // the inner wrapper is what centres the block: rows stretch to the
    // widest one inside it, so the grids stay left-aligned to each other
    return html`<div class="lm-chart-plotblock lm-chart-picto-block">
        <div class="lm-chart-picto-inner">${rows.map((r) => row(r))}</div>
    </div>`;
};

/* ----- waffle (type="waffle"): one square grid PER SERIES, its cells
        partitioned sequentially (bottom-left up) across the series' points
        in palette order — the classic 10×10 percentage waffle. Multiple
        series render side by side for dataset comparison. ----- */
export const waffleChart = (m: Model, ctx: RenderCtx): View => {
    const path = glyphPath(m.icon || 'square', GLYPHS.square);
    const cols = Math.max(1, m.columns || 10);
    const cells = Math.min(400, Math.max(cols, m.iconcount || 100));
    const gridRows = Math.ceil(cells / cols);
    // glyph size fitted to the plot height (same scheme as the pictogram),
    // with room below for the per-series name
    const headroom = m.title || m.subtitle ? 56 : 16;
    const avail = Math.max(90, (m.height || 320) - headroom - 44);
    const cellPx = Math.max(6, Math.min(28, (avail - gridRows * 4) / gridRows));
    const gapPx = Math.max(2, Math.round(cellPx * 0.14));
    const gridW = Math.round(cols * cellPx + (cols - 1) * gapPx);

    const grid = (s: Model['series'][number], si: number): View => {
        const pts = s.points.filter((p, i) => !p.gap && p.value > 0 && !ctx.isHidden(p.name || '#' + i));
        const sum = pts.reduce((t, p) => t + p.value, 0);
        const denom = Math.max(m.total > 0 ? m.total : 100, sum) || 1;
        // cumulative category boundaries in cell units; cell k belongs to
        // the first category whose boundary exceeds it (fractional last cell)
        const bounds = [] as number[];
        let acc = 0;
        for (const p of pts) { acc += p.value; bounds.push((acc / denom) * cells); }
        const cellView = (k: number): View => {
            let ci = 0;
            while (ci < bounds.length && bounds[ci] <= k) ci++;
            if (ci >= pts.length) return glyphCell(path, 0, '');
            const p = pts[ci];
            const fill = Math.max(0, Math.min(1, bounds[ci] - k));
            const pct = Math.round((p.value / denom) * 100);
            const tip = (e: MouseEvent): void => ctx.showTip(e, (m.series.length > 1 && s.name ? s.name + ' · ' : '') + (p.name || ''),
                [{ name: '', value: ctx.fmt(p.value) + ' (' + pct + '%)', color: p.color }]);
            return html`<span class="lm-chart-waffle-cell"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(p, si, s.points.indexOf(p))}">${glyphCell(path, fill, p.color)}</span>`;
        };
        // fill runs bottom-left upward; the DOM renders rows top-down, so
        // row r (from the top) hosts cells [(gridRows-1-r)*cols ...)
        const views: View[] = [];
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < cols; c++) {
                const k = (gridRows - 1 - r) * cols + c;
                if (k < cells) views.push(cellView(k));
            }
        }
        return html`<div class="lm-chart-waffle">
            <div class="lm-chart-picto-grid"
                style="${css({ gridTemplateColumns: 'repeat(' + cols + ', 1fr)', width: gridW + 'px', gap: gapPx + 'px' })}">${views}</div>
            ${s.name && (m.series.length > 1 || m.labels) ? html`<div class="lm-chart-waffle-name">${s.name}</div>` : false}
        </div>`;
    };

    return html`<div class="lm-chart-plotblock lm-chart-picto-block lm-chart-waffle-block">${
        m.series.map((s, si) => grid(s, si))}</div>`;
};

/* ----- bullet (KPI: measure bar over qualitative bands + target) ----- */
export const bulletChart = (m: Model, ctx: RenderCtx): View => {
    const value = m.series[0] && m.series[0].points[0] ? m.series[0].points[0].value : 0;
    const lo = m.ymin != null ? m.ymin : 0;
    const hi = m.ymax != null ? m.ymax : Math.max(value, 1) * 1.25;
    const fr = (v: number): number => hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100 : 0;
    const bands = (m.plotbands || []).filter((b) => b && b.from != null && b.to != null).map((b) =>
        html`<div class="lm-chart-bullet-band" style="${css({ left: fr(b.from) + '%', width: (fr(b.to) - fr(b.from)) + '%', background: b.color || 'rgba(99,110,130,0.12)' })}"></div>`);
    const targets = (m.plotlines || []).filter((l) => l && l.value != null).map((l) =>
        html`<div class="lm-chart-bullet-target" style="${css({ left: fr(l.value) + '%', background: l.color || '#3f444c' })}"></div>`);
    const color = (m.series[0] && m.series[0].color) || PALETTES.lemonade[0];
    const tip = (e: MouseEvent): void => ctx.showTip(e, m.series[0] ? m.series[0].name : '', [{ name: '', value: ctx.fmt(value), color }]);
    return html`<div class="lm-chart-bullet">
        ${m.series[0] && m.series[0].name ? html`<div class="lm-chart-bullet-label">${m.series[0].name}</div>` : false}
        <div class="lm-chart-bullet-track">
            ${bands}
            <div class="lm-chart-bullet-measure" style="${css({ width: fr(value) + '%', background: color })}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"></div>
            ${targets}
        </div>
        <div class="lm-chart-bullet-axis"><span>${ctx.fmt(lo)}</span><span>${ctx.fmt(hi)}</span></div>
    </div>`;
};

/* ----- heatmap (matrix of coloured cells) ----- */
export const heatmapChart = (m: Model, ctx: RenderCtx): View => {
    const rows = m.series;
    const cols = m.categories.length || (rows[0] ? rows[0].points.length : 0);
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of rows) for (const p of s.points) { if (p.gap) continue; lo = Math.min(lo, p.value); hi = Math.max(hi, p.value); }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const base = (m.series[0] && m.series[0].color) || PALETTES.lemonade[0];
    const baseHex = /^#/.test(base) ? base : '#2196f3';
    const cellColor = (v: number): string => lerpColor('#eef2f7', baseHex, hi > lo ? (v - lo) / (hi - lo) : 0.5);
    // dark text on light cells, white text on dark cells (contrast)
    const cellText = (rgb: string): string => {
        const c = rgb.match(/\d+/g);
        const lum = c ? 0.299 * +c[0] + 0.587 * +c[1] + 0.114 * +c[2] : 255;
        return lum > 150 ? '#2b2f36' : '#ffffff';
    };
    // interleave a row label + its cells per row (grid auto-flows row by row)
    const hl = ctx.heatHover.value;
    const cell = (s: NormSeries, ri: number, ci: number): View => {
        const p = s.points[ci];
        if (!p || p.gap) return html`<div class="lm-chart-heat-cell" data-empty="true"></div>`;
        const bg = cellColor(p.value);
        const onHover = (e: MouseEvent): void => {
            ctx.heatHover.value = { r: ri, c: ci };
            ctx.showTip(e, (m.categories[ci] != null ? m.categories[ci] + ' · ' : '') + s.name, [{ name: '', value: ctx.fmt(p.value), color: bg }]);
        };
        // dim cells that are NOT in the hovered row or column
        const dimmed = hl && hl.r !== ri && hl.c !== ci ? 'true' : false;
        return html`<div class="lm-chart-heat-cell" style="${css({ background: bg, color: cellText(bg) })}"
            data-dim="${dimmed}"
            onmousemove="${onHover}" ontouchstart="${onHover}"
            onmouseleave="${() => { ctx.hideTip(); ctx.heatHover.value = null; }}"
            onclick="${() => ctx.fire({ ...p, name: s.name }, rows.indexOf(s), ci)}">${m.labels ? html`<span>${ctx.fmt(p.value)}</span>` : false}</div>`;
    };
    const gridChildren = rows.flatMap((s, ri) =>
        [html`<div class="lm-chart-heat-rowlabel" data-on="${hl && hl.r === ri ? 'true' : false}">${s.name}</div>` as View].concat(
            Array.from({ length: cols }, (_, ci) => cell(s, ri, ci))));
    return html`<div class="lm-chart-heat"
        style="${m.borderRadius != null ? css({ '--lm-chart-cell-radius': m.borderRadius + 'px' }) : false}">
        <div class="lm-chart-heat-grid" style="${css({ gridTemplateColumns: '76px repeat(' + cols + ', 1fr)' })}">${gridChildren}</div>
        <div class="lm-chart-heat-xaxis">${Array.from({ length: cols }, (_, ci) =>
            html`<div class="lm-chart-cat" data-on="${hl && hl.c === ci ? 'true' : false}"><span class="lm-chart-cat-label">${m.categories[ci] != null ? m.categories[ci] : ''}</span></div>`)}</div>
        <div class="lm-chart-heat-scale">
            <span>${ctx.fmt(lo)}</span>
            <span class="lm-chart-heat-bar" style="${css({ background: 'linear-gradient(to right,' + cellColor(lo) + ',' + cellColor(hi) + ')' })}"></span>
            <span>${ctx.fmt(hi)}</span>
        </div>
    </div>`;
};


/* ----- treemap: squarified rectangles, sized by value (HTML divs) ----- */
export const treemapChart = (m: Model, ctx: RenderCtx): View => {
    const pts = (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap && p.value > 0);
    const total = pts.reduce((s, p) => s + p.value, 0) || 1;
    const rects = squarify(pts.map((p) => p.value), 0, 0, 100, 100);
    return html`<div class="lm-chart-treemap">${rects.map((r) => {
        const p = pts[r.i];
        const bg = p.color;
        const pct = Math.round((p.value / total) * 100);
        const tip = (e: MouseEvent): void => ctx.showTip(e, p.name || '', [{ name: '', value: ctx.fmt(p.value) + ' (' + pct + '%)', color: bg }]);
        const big = r.w > 11 && r.h > 9; // only label tiles with room
        return html`<div class="lm-chart-treemap-tile"
            data-dim="${ctx.hover.value && ctx.hover.value !== (p.name || '#' + r.i) ? 'true' : false}"
            style="${css({ left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%', background: bg, color: textOn(bg) })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire({ ...p }, 0, r.i)}">
            ${big ? html`<span class="lm-chart-treemap-label">
                <span class="lm-chart-treemap-name">${p.name}</span>
                ${m.labels ? html`<span class="lm-chart-treemap-val">${ctx.fmt(p.value)}</span>` : false}
            </span>` : false}
        </div>`;
    })}</div>`;
};

/* ----- sparkline: a tiny, axisless, chrome-free chart for inline use ----- */
export const sparkline = (m: Model, ctx: RenderCtx): View => {
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    const isBar = m.type === 'bar' || m.type === 'stackedbar';
    let lo = Infinity; let hi = -Infinity;
    for (const s of vis) for (const p of s.points) if (p && !p.gap) { lo = Math.min(lo, p.value); hi = Math.max(hi, p.value); }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    if (isBar) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (hi <= lo) hi = lo + 1;
    const yf = (v: number): number => 100 - ((v - lo) / (hi - lo)) * 100;

    if (isBar) {
        const s = vis[0];
        const pts = s ? s.points : [];
        const zero = yf(0);
        return html`<div class="lm-chart-spark" data-kind="bar">
            <div class="lm-chart-spark-bars">${pts.map((p) => {
                const v = p && !p.gap ? p.value : 0;
                const top = Math.min(yf(v), zero);
                const h = Math.abs(yf(v) - zero);
                return html`<span class="lm-chart-spark-slot"><span class="lm-chart-spark-bar" data-neg="${v < 0 ? 'true' : false}"
                    style="${css({ top: top + '%', height: Math.max(h, 1) + '%', background: (s && s.color) || '#2196f3' })}"></span></span>`;
            })}</div>
            ${m.labels && s ? html`<span class="lm-chart-spark-val">${ctx.fmt(s.points.length ? s.points[s.points.length - 1].value : 0)}</span>` : false}
        </div>`;
    }

    const n = m.categories.length || (vis[0] ? vis[0].points.length : 0);
    const xf = (i: number): number => (n <= 1 ? 0 : (i / (n - 1)) * 100);
    const areas: View[] = [];
    const paths: View[] = [];
    let endDot: View | false = false;
    let endVal = 0;
    for (const s of vis) {
        const seg: Array<[number, number]> = [];
        for (let i = 0; i < s.points.length; i++) { const p = s.points[i]; if (p && !p.gap) seg.push([xf(i), yf(p.value)]); }
        if (!seg.length) continue;
        const d = s.step ? stepPath(seg, s.step === 'mid') : s.smooth ? smoothPath(seg) : polyPath(seg);
        if (s.type === 'area' || m.type === 'stackedarea') {
            areas.push(html`<path class="lm-chart-spark-area" d="${d + ' L ' + seg[seg.length - 1][0].toFixed(2) + ',100 L ' + seg[0][0].toFixed(2) + ',100 Z'}" style="${css({ fill: s.color })}" />`);
        }
        paths.push(html`<path class="lm-chart-spark-path" d="${d}" style="${css({ stroke: s.color })}" />`);
        const last = seg[seg.length - 1];
        endDot = html`<span class="lm-chart-spark-dot" style="${css({ left: last[0].toFixed(2) + '%', top: last[1].toFixed(2) + '%', background: s.color })}"></span>`;
        const lp = [...s.points].reverse().find((p) => p && !p.gap);
        endVal = lp ? lp.value : 0;
    }
    return html`<div class="lm-chart-spark" data-kind="line">
        <svg class="lm-chart-spark-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${areas}${paths}</svg>
        ${endDot}
        ${m.labels ? html`<span class="lm-chart-spark-val">${ctx.fmt(endVal)}</span>` : false}
    </div>`;
};

/* ----- word cloud: spiral-placed words, font size ∝ √value (SVG text) ----- */
export const wordcloudChart = (m: Model, ctx: RenderCtx): View => {
    const pts = (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap && p.value > 0 && p.name);
    if (!pts.length) return html`<div class="lm-chart-cloud"></div>`;
    const total = pts.reduce((s, p) => s + p.value, 0) || 1;
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pts) { lo = Math.min(lo, p.value); hi = Math.max(hi, p.value); }
    // font size ∝ √value (perceived area tracks the value) in scene units
    const fs = pts.map((p) => 5 + (hi > lo ? Math.sqrt((p.value - lo) / (hi - lo)) : 0.5) * 9);
    // estimated word boxes — SVG text never reflows, so width ≈ chars × size × 0.6
    const bw = pts.map((p, i) => Math.max(2, p.name.length) * fs[i] * 0.6);
    const bh = fs.map((s) => s * 1.15);

    // greedy spiral, largest first: walk an Archimedean spiral stretched 2:1
    // (matching the scene) out from the centre until the box collides with
    // nothing already placed — same scheme as packedbubble, rects for circles
    const n = pts.length;
    const order = pts.map((_, i) => i).sort((a, b) => pts[b].value - pts[a].value);
    const cx = new Array(n).fill(100);
    const cy = new Array(n).fill(50);
    const placed: number[] = [];
    for (const i of order) {
        if (placed.length) {
            for (let t = 0; t < 4000; t++) {
                const ang = t * 0.3;
                const rad = t * 0.04;
                const x = 100 + rad * 2 * Math.cos(ang);
                const y = 50 + rad * Math.sin(ang);
                const ok = placed.every((j) => Math.abs(x - cx[j]) >= (bw[i] + bw[j]) / 2 + 1
                    || Math.abs(y - cy[j]) >= (bh[i] + bh[j]) / 2 + 0.6);
                if (ok) { cx[i] = x; cy[i] = y; break; }
            }
        }
        placed.push(i);
    }
    // recentre + scale the cloud to fill the 200×100 scene (capped so a
    // lone short word does not blow up to the full box height); the cap
    // is generous — a small cloud should still spread into the container
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < n; i++) {
        x0 = Math.min(x0, cx[i] - bw[i] / 2); x1 = Math.max(x1, cx[i] + bw[i] / 2);
        y0 = Math.min(y0, cy[i] - bh[i] / 2); y1 = Math.max(y1, cy[i] + bh[i] / 2);
    }
    const fit = Math.min(3, 196 / (x1 - x0 || 1), 94 / (y1 - y0 || 1));
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;

    const words = pts.map((p, i) => {
        const pct = Math.round((p.value / total) * 100);
        const tip = (e: MouseEvent): void => ctx.showTip(e, p.name,
            [{ name: '', value: ctx.fmt(p.value) + ' (' + pct + '%)', color: p.color }]);
        return html`<text class="lm-chart-cloud-word"
            x="${(100 + (cx[i] - mx) * fit).toFixed(2)}" y="${(50 + (cy[i] - my) * fit).toFixed(2)}"
            font-size="${(fs[i] * fit).toFixed(2)}"
            text-anchor="middle" dominant-baseline="central"
            style="${css({ fill: p.color })}"
            onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire({ ...p }, 0, i)}">${p.name}</text>`;
    });
    return html`<div class="lm-chart-cloud">
        <svg class="lm-chart-cloud-svg" viewBox="0 0 200 100" aria-hidden="true">${words}</svg>
    </div>`;
};

/* ----- packed bubble (greedy spiral circle-packing; groups = series) ----- */
export const packedbubbleChart = (m: Model, ctx: RenderCtx): View => {
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    const items = vis.flatMap((s) => s.points
        .map((p, i) => ({ p, s, i }))
        .filter((e) => !e.p.gap && e.p.value > 0));
    const n = items.length;
    if (!n) return html`<div class="lm-chart-pie-core"></div>`;

    // radius: area ∝ value, normalized so the bubbles fill ~42% of the box
    const total = items.reduce((s, e) => s + e.p.value, 0) || 1;
    const k = Math.sqrt((100 * 100 * 0.42) / Math.PI / total);
    const rs = items.map((e) => Math.max(1.5, k * Math.sqrt(e.p.value)));

    // greedy spiral packing, largest first: walk an Archimedean spiral out
    // from the centre until the candidate spot collides with nothing
    const order = items.map((_, i) => i).sort((a, b) => rs[b] - rs[a]);
    const cx = new Array(n).fill(50);
    const cy = new Array(n).fill(50);
    const placed: number[] = [];
    for (const i of order) {
        if (placed.length) {
            for (let t = 0; t < 3000; t++) {
                const ang = t * 0.35;
                const rad = 0.5 + t * 0.04;
                const x = 50 + rad * Math.cos(ang);
                const y = 50 + rad * Math.sin(ang);
                const ok = placed.every((j) => {
                    const dx = x - cx[j];
                    const dy = y - cy[j];
                    const min = rs[i] + rs[j] + 0.4;
                    return dx * dx + dy * dy >= min * min;
                });
                if (ok) { cx[i] = x; cy[i] = y; break; }
            }
        }
        placed.push(i);
    }
    // recentre + scale the cluster to fill the 0..100 box
    let lo = Infinity; let hi = -Infinity;
    for (let i = 0; i < n; i++) {
        lo = Math.min(lo, cx[i] - rs[i], cy[i] - rs[i]);
        hi = Math.max(hi, cx[i] + rs[i], cy[i] + rs[i]);
    }
    const fit = 96 / (hi - lo || 1);
    const mid = (lo + hi) / 2;
    const px = (v: number): number => 50 + (v - mid) * fit;

    // hovering a bubble highlights its whole series/cluster (ctx.hover is
    // the same state the legend uses, so both paths dim the other groups)
    const bubbles = items.map((e, i) => {
        const dim = ctx.hover.value && ctx.hover.value !== e.s.name ? 'true' : false;
        const hot = ctx.hover.value === e.s.name ? 'true' : false;
        const tip = (ev: MouseEvent): void => {
            if (ctx.hover.value !== e.s.name) ctx.hover.value = e.s.name;
            ctx.showTip(ev, e.p.name || e.s.name,
                [{ name: e.s.name, value: ctx.fmt(e.p.value), color: e.s.color }]);
        };
        return html`<circle class="lm-chart-pack" cx="${px(cx[i]).toFixed(2)}" cy="${px(cy[i]).toFixed(2)}" r="${(rs[i] * fit).toFixed(2)}"
            style="${css({ fill: e.s.color, stroke: e.s.color, animationDelay: Math.min(i * 14, 560) + 'ms' })}"
            data-dim="${dim}" data-hot="${hot}"
            onmousemove="${tip}" ontouchstart="${tip}"
            onmouseleave="${() => { ctx.hideTip(); if (ctx.hover.value === e.s.name) ctx.hover.value = null; }}"
            onclick="${() => ctx.fire(e.p, m.series.indexOf(e.s), e.i)}" />`;
    });
    // translucent HC-style fills → dark text reads on every series colour
    const labels = m.labels ? items.map((e, i) => {
        if (rs[i] * fit < 6 || !e.p.name) return false as const;
        return html`<span class="lm-chart-pack-label" style="${css({
            left: px(cx[i]).toFixed(2) + '%', top: px(cy[i]).toFixed(2) + '%',
        })}">${e.p.name}</span>`;
    }) : [];

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${bubbles}</svg>
            ${labels}
        </div>
    </div>`;
};
