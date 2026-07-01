/**
 * <Chart /> cartesian renderers — everything drawn on the shared
 * category/value axis frame: bars/stacked/line/combo (and the histogram
 * + streamgraph variants inside bars()), waterfall, candlestick/ohlc,
 * boxplot, arearange/columnrange/dumbbell, lollipop.
 */
import { css, html, type View } from 'lemonadejs';
import { PALETTES, type Model, type NormSeries, type RenderCtx } from './model';
import { fixedScale, lerpColor, niceExtent, niceScale, parseX, polyPath, smoothPath, stepPath, timeTicks } from './helpers';

/* ----- bar / stacked / line / combo (shared axis; HTML + CSS) ----- */
interface Scale {
    lo: number; hi: number; range: number; baseV: number; basePct: number;
    ticks: number[];
    /** value → 0..1 fraction up the axis (handles log). */
    frac: (v: number) => number;
}

export const bars = (mFull: Model, ctx: RenderCtx): View => {
    // zoom: slice the data to the active category window (bar/line only).
    // Either drag-select (zoom) or the navigator strip can drive the window.
    const rangeType = ['bar', 'stackedbar', 'line', 'stackedarea', 'streamgraph', 'histogram'].includes(mFull.type);
    const zoomable = ctx.zoom() && rangeType; // drag-select on the plot
    const zr = (zoomable || (ctx.navigator() && rangeType)) ? ctx.zoomRange.value : null;
    const fullN = mFull.categories.length || (mFull.series[0] ? mFull.series[0].points.length : 0);
    const m: Model = zr
        ? { ...mFull, categories: mFull.categories.slice(zr[0], zr[1] + 1), series: mFull.series.map((s) => ({ ...s, points: s.points.slice(zr[0], zr[1] + 1) })) }
        : mFull;

    const stacked = m.type === 'stackedbar';
    // streamgraph = stacked area with a centred (silhouette) baseline
    const stream = m.type === 'streamgraph';
    const stackedArea = m.type === 'stackedarea' || stream;
    const percent = (stacked || stackedArea) && !stream && m.stackmode === 'percent';
    const n = m.categories.length || (m.series[0] ? m.series[0].points.length : 0);

    // Series are keyed by name; hidden ones drop out and the scale rescales
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    const sIndex = (s: NormSeries): number => m.series.indexOf(s);

    // zoom drag handlers (operate on the .lm-chart-cols box)
    const fracOf = (e: MouseEvent): number => {
        const r = (e.currentTarget as Element).getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    };
    const startDrag = (e: MouseEvent): void => { ctx.zsel.value = { a: fracOf(e), b: fracOf(e) }; };
    const moveDrag = (e: MouseEvent): void => { if (ctx.zsel.value) ctx.zsel.value = { a: ctx.zsel.value.a, b: fracOf(e) }; };
    const endDrag = (): void => {
        const sel = ctx.zsel.value;
        ctx.zsel.value = null;
        if (!sel) return;
        const lo = Math.min(sel.a, sel.b);
        const hi = Math.max(sel.a, sel.b);
        if (hi - lo < 0.04) return; // ignore a click/tiny drag
        const curStart = zr ? zr[0] : 0;
        const viewN = (zr ? zr[1] : fullN - 1) - curStart + 1;
        const i0 = Math.max(0, Math.min(curStart + Math.floor(lo * viewN), fullN - 1));
        const i1 = Math.max(i0, Math.min(curStart + Math.ceil(hi * viewN) - 1, fullN - 1));
        if (i1 > i0) ctx.zoomRange.value = [i0, i1];
    };

    // Combo split (stacked forces all to bars on one axis)
    const barSeries = vis.filter((s) => stacked || s.type === 'bar');
    const lineSeries = stacked ? [] : vis.filter((s) => s.type !== 'bar');
    const hasRight = !stacked && vis.some((s) => s.axis === 'right');
    // pure line/area chart → a thin vertical crosshair instead of a column band
    const crosshair = lineSeries.length > 0 && barSeries.length === 0;
    // horizontal bars: only for pure bar/stacked (categories move to the y-axis)
    const horizontal = m.horizontal && lineSeries.length === 0;

    // continuous x (datetime/linear): line/area points sit at their x VALUE,
    // not evenly by index; ticks are smart date/number boundaries
    const continuousX = (m.xtype === 'datetime' || m.xtype === 'linear') && lineSeries.length > 0 && barSeries.length === 0;
    const xvals = continuousX
        ? Array.from({ length: n }, (_, i) => {
            const p = m.series[0] && m.series[0].points[i];
            return p && p.x !== i ? p.x : parseX(m.categories[i], m.xtype);
        })
        : [];
    const xFinite = xvals.filter((v) => Number.isFinite(v));
    const xmin = xFinite.length ? Math.min(...xFinite) : 0;
    const xmax = xFinite.length ? Math.max(...xFinite) : 1;
    const xspan = xmax - xmin || 1;

    // Columns + x-labels are evenly distributed (no percentage gap — that
    // breaks past ~25 columns); continuous x positions by value instead.
    const colCenter = (i: number): number =>
        continuousX ? ((xvals[i] - xmin) / xspan) * 100 : ((i + 0.5) / n) * 100;

    // continuous x has no evenly-spaced columns → per-marker tooltips, not shared
    const shared = m.tooltip && m.sharedtooltip && !continuousX;

    // Build a scale for a set of series (one per y-axis); fixedK aligns the
    // secondary axis to the primary's interval count so gridlines line up.
    const buildScale = (sset: NormSeries[], useY: boolean, fixedK: number | null): Scale => {
        let dmin = 0;
        let dmax = 0;
        if (percent) { dmax = 100; }
        else if (stacked || stackedArea) {
            for (let i = 0; i < n; i++) {
                let pos = 0;
                let neg = 0;
                for (const s of sset) {
                    const p = s.points[i];
                    const v = p && !p.gap ? p.value : 0;
                    if (v >= 0) pos += v; else neg += v;
                }
                dmax = Math.max(dmax, pos);
                dmin = Math.min(dmin, neg);
            }
            // streamgraph: bands hang half above / half below the midline
            if (stream) { const half = (dmax - dmin) / 2; dmax = half; dmin = -half; }
        } else {
            for (const s of sset) for (const p of s.points) {
                if (p.gap) continue;
                dmax = Math.max(dmax, p.value);
                dmin = Math.min(dmin, p.value);
            }
        }
        let lo: number;
        let hi: number;
        let ticks: number[];
        // logarithmic axis (positive data only; bars/lines, not stacked/percent)
        const useLog = m.ylog && !percent && !(stacked || stackedArea) && dmax > 0;
        if (percent) {
            lo = 0; hi = 100; ticks = [100, 75, 50, 25, 0];
        } else if (useLog) {
            const loExp = Math.floor(Math.log10(dmin > 0 ? dmin : dmax / 100));
            const hiExp = Math.ceil(Math.log10(dmax));
            lo = Math.pow(10, loExp);
            hi = Math.pow(10, Math.max(hiExp, loExp + 1));
            ticks = [];
            for (let e = Math.log10(hi); e >= Math.log10(lo) - 1e-9; e--) ticks.push(Math.pow(10, e));
        } else if (useY && (m.ymin != null || m.ymax != null)) {
            const auto = niceScale(dmin, dmax);
            lo = m.ymin != null ? m.ymin : auto.lo;
            hi = m.ymax != null ? m.ymax : auto.hi;
            if (!(hi > lo)) hi = lo + 1;
            const step = (hi - lo) / 4;
            ticks = [4, 3, 2, 1, 0].map((k) => lo + step * k);
        } else {
            const sc = fixedK != null ? fixedScale(dmin, dmax, fixedK) : niceScale(dmin, dmax);
            lo = sc.lo; hi = sc.hi; ticks = sc.ticks;
        }
        const range = hi - lo || 1;
        const baseV = useLog ? lo : Math.max(lo, Math.min(hi, 0));
        const logLo = useLog ? Math.log10(lo) : 0;
        const logSpan = useLog ? Math.log10(hi) - logLo || 1 : 1;
        const frac = useLog
            ? (v: number): number => (Math.log10(Math.max(lo, Math.min(hi, v))) - logLo) / logSpan
            : (v: number): number => (v - lo) / range;
        return { lo, hi, range, baseV, basePct: frac(baseV) * 100, ticks, frac };
    };

    const primary = buildScale(stacked || stackedArea ? vis : vis.filter((s) => s.axis !== 'right'), true, null);
    const secondary = hasRight ? buildScale(vis.filter((s) => s.axis === 'right'), false, primary.ticks.length - 1) : null;
    const scaleOf = (s: NormSeries): Scale => (s.axis === 'right' && secondary ? secondary : primary);
    const ticks = primary.ticks;
    const baseV = primary.baseV;

    const column = (i: number): View => {
        const cat = m.categories[i] != null ? m.categories[i] : '';
        const colTot = barSeries.reduce((sum, s) => sum + (s.points[i] && !s.points[i].gap ? s.points[i].value : 0), 0);
        let accPos = 0; // running offsets for stacked segments (% of plot)
        let accNeg = 0;

        const bar = (s: NormSeries): View | false => {
            const pt = s.points[i];
            if (!pt || pt.gap) return false;
            const sc = scaleOf(s);
            const v = pt.value;
            let len: number;
            let bottom: number;
            if (percent) {
                len = colTot > 0 ? (v / colTot) * 100 : 0;
                bottom = accPos;
                accPos += len;
            } else if (stacked) {
                len = (Math.abs(v) / sc.range) * 100;
                if (v >= 0) { bottom = sc.basePct + accPos; accPos += len; }
                else { bottom = sc.basePct - accNeg - len; accNeg += len; }
            } else {
                const cv = Math.max(sc.lo, Math.min(sc.hi, v));
                const a = sc.frac(Math.min(cv, sc.baseV)) * 100;
                const b = sc.frac(Math.max(cv, sc.baseV)) * 100;
                bottom = a;
                len = b - a;
            }

            const share = percent ? Math.round(len) : null;
            const tipName = cat ? cat + ' · ' + s.name : s.name;
            const tipValue = share != null ? ctx.fmt(v) + ' (' + share + '%)' : ctx.fmt(v);
            const showLabel = m.labels && v !== 0 && (!stacked || len >= 9);
            const labelText = share != null ? share + '%' : ctx.fmt(v);
            // bottom/height map to the value axis; horizontal swaps them to left/width
            const barStyle = horizontal
                ? css({ left: bottom + '%', width: len + '%', background: s.color })
                : css({ bottom: bottom + '%', height: len + '%', background: s.color });
            return html`<div class="lm-chart-bar" data-orient="${horizontal ? 'h' : false}"
                style="${barStyle}"
                data-neg="${v < sc.baseV ? 'true' : false}"
                data-dim="${ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false}"
                onmousemove="${(e: MouseEvent) => {
                    if (!shared) ctx.showTip(e, tipName, [{ name: s.name, value: tipValue, color: s.color }]);
                }}"
                onmouseleave="${() => { if (!shared) ctx.hideTip(); }}"
                onclick="${() => ctx.fire({ ...pt, color: s.color }, sIndex(s), i)}">${
                showLabel ? html`<span class="lm-chart-value">${labelText}</span>` : false
            }</div>`;
        };

        // Stacked: all bars in one slot. Grouped/combo: one slot per bar series.
        const inner = stacked
            ? barSeries.map((s) => bar(s))
            : barSeries.map((s) => html`<div class="lm-chart-barslot">${bar(s)}</div>`);

        const colTip = (e: MouseEvent): void => {
            ctx.hoverCol.value = i;
            ctx.showTip(e, cat || 'Series', vis.filter((s) => s.points[i] && !s.points[i].gap).map((s) => ({
                name: s.name, value: ctx.fmt(s.points[i].value), color: s.color,
            })));
        };
        return html`<div class="lm-chart-col"
            onmousemove="${(e: MouseEvent) => { if (shared && !ctx.zsel.value) colTip(e); }}"
            ontouchstart="${(e: MouseEvent) => { if (shared) colTip(e); }}"
            ontouchmove="${(e: MouseEvent) => { if (shared) colTip(e); }}"
            onmouseleave="${() => { if (shared) ctx.hideTip(); }}">
            <div class="lm-chart-band" data-on="${ctx.hoverCol.value === i || ctx.kb.value === i ? 'true' : false}"
                data-kb="${ctx.kb.value === i ? 'true' : false}"
                data-line="${crosshair ? 'true' : false}"></div>
            <div class="lm-chart-stack" data-stacked="${stacked ? 'true' : false}"
                data-orient="${horizontal ? 'h' : false}">${inner}</div>
        </div>`;
    };

    // Line/area overlay: SVG paths (non-scaling stroke) + HTML markers. Each
    // series plots against its own axis; gaps (null points) break the line.
    const lineOverlay = ((): View | false => {
        if (lineSeries.length === 0) return false;
        const areas: View[] = [];
        const paths: View[] = [];
        const markers: View[] = [];

        // Stacked area: series accumulate; each band sits on the one below.
        if (stackedArea) {
            const sc = primary;
            const yOf = (val: number): number => (1 - sc.frac(val)) * 100;
            const colTotal = (i: number): number => lineSeries.reduce(
                (sum, sr) => sum + (sr.points[i] && !sr.points[i].gap ? sr.points[i].value : 0), 0);
            // streamgraph: each column's stack starts at -total/2 (silhouette)
            const cum = Array.from({ length: n }, (_, i) => (stream ? -colTotal(i) / 2 : 0));
            for (const s of lineSeries) {
                const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
                const topPts: Array<[number, number]> = [];
                const botPts: Array<[number, number]> = [];
                for (let i = 0; i < n; i++) {
                    const p = s.points[i];
                    const raw = p && !p.gap ? p.value : 0;
                    const add = percent ? (raw / (colTotal(i) || 1)) * 100 : raw;
                    const x = colCenter(i);
                    botPts.push([x, yOf(cum[i])]);
                    cum[i] += add;
                    topPts.push([x, yOf(cum[i])]);
                }
                // streams smooth both edges when the series asks for it
                const curved = stream && s.smooth;
                const topD = curved ? smoothPath(topPts) : polyPath(topPts);
                let areaD: string;
                if (curved) {
                    areaD = topD + ' ' + smoothPath([...botPts].reverse()).replace(/^M/, 'L') + ' Z';
                } else {
                    areaD = topD;
                    for (let i = botPts.length - 1; i >= 0; i--) areaD += ' L ' + botPts[i][0].toFixed(2) + ',' + botPts[i][1].toFixed(2);
                    areaD += ' Z';
                }
                areas.push(html`<path class="lm-chart-areafill" d="${areaD}" data-stacked="true"
                    style="${css({ fill: s.color })}" data-dim="${dim}" data-stream="${stream ? 'true' : false}" />`);
                // streams read as soft ribbons: no top stroke, no markers
                if (!stream) paths.push(html`<path class="lm-chart-line" d="${topD}"
                    style="${css({ stroke: s.color })}" data-dim="${dim}" />`);
                if (m.markers && !stream) {
                    for (let i = 0; i < n; i++) {
                        const p = s.points[i];
                        if (!p || p.gap) continue;
                        const [x, y] = topPts[i];
                        const cat = m.categories[i] != null ? m.categories[i] : '';
                        const tipName = cat ? cat + ' · ' + s.name : s.name;
                        markers.push(html`<span class="lm-chart-marker"
                            style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%', background: s.color })}"
                            data-dim="${dim}" data-hot="${ctx.hoverCol.value === i ? 'true' : false}"
                            onmousemove="${(e: MouseEvent) => { if (!shared) ctx.showTip(e, tipName, [{ name: s.name, value: ctx.fmt(p.value), color: s.color }]); }}"
                            onmouseleave="${() => { if (!shared) ctx.hideTip(); }}"
                            onclick="${() => ctx.fire({ ...p, color: s.color }, sIndex(s), i)}"></span>`);
                    }
                }
            }
            return html`<div class="lm-chart-lineoverlay" data-interactive="${shared ? false : 'true'}">
                <svg class="lm-chart-linesvg" viewBox="0 0 100 100" preserveAspectRatio="none">${areas}${paths}</svg>
                ${markers}
            </div>`;
        }

        for (const s of lineSeries) {
            const sc = scaleOf(s);
            const xy = (i: number, v: number): [number, number] =>
                [colCenter(i), (1 - sc.frac(v)) * 100];
            // split into segments on gaps
            const segs: Array<Array<[number, number]>> = [];
            let cur: Array<[number, number]> = [];
            for (let i = 0; i < n; i++) {
                const p = s.points[i];
                if (!p || p.gap) { if (cur.length) { segs.push(cur); cur = []; } continue; }
                cur.push(xy(i, p.value));
            }
            if (cur.length) segs.push(cur);
            const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
            const baseY = (1 - sc.frac(sc.baseV)) * 100;
            for (const seg of segs) {
                const d = s.step ? stepPath(seg, s.step === 'mid') : s.smooth ? smoothPath(seg) : polyPath(seg);
                if (s.type === 'area' && seg.length) {
                    const areaD = d + ' L ' + seg[seg.length - 1][0].toFixed(2) + ',' + baseY.toFixed(2) +
                        ' L ' + seg[0][0].toFixed(2) + ',' + baseY.toFixed(2) + ' Z';
                    areas.push(html`<path class="lm-chart-areafill" d="${areaD}"
                        style="${css({ fill: s.color })}" data-dim="${dim}" />`);
                }
                paths.push(html`<path class="lm-chart-line" d="${d}"
                    style="${css({ stroke: s.color })}" data-dim="${dim}"
                    data-dashed="${s.dashed ? 'true' : false}" />`);
            }
            if (m.markers) {
                for (let i = 0; i < n; i++) {
                    const p = s.points[i];
                    if (!p || p.gap) continue;
                    const [x, y] = xy(i, p.value);
                    const cat = m.categories[i] != null ? m.categories[i] : '';
                    const tipName = cat ? cat + ' · ' + s.name : s.name;
                    markers.push(html`<span class="lm-chart-marker" data-shape="${s.marker}"
                        style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%', background: s.color })}"
                        data-dim="${dim}"
                        data-hot="${ctx.hoverCol.value === i ? 'true' : false}"
                        onmousemove="${(e: MouseEvent) => {
                            if (!shared) ctx.showTip(e, tipName, [{ name: s.name, value: ctx.fmt(p.value), color: s.color }]);
                        }}"
                        onmouseleave="${() => { if (!shared) ctx.hideTip(); }}"
                        onclick="${() => ctx.fire({ ...p, color: s.color }, sIndex(s), i)}">${
                        // value labels only for a single, not-too-dense series (else overlap; tooltip covers it)
                        m.labels && lineSeries.length === 1 && n <= 15
                            ? html`<span class="lm-chart-marker-label">${ctx.fmt(p.value)}</span>` : false
                    }</span>`);
                }
            }
        }
        return html`<div class="lm-chart-lineoverlay" data-interactive="${shared ? false : 'true'}">
            <svg class="lm-chart-linesvg" viewBox="0 0 100 100" preserveAspectRatio="none">${areas}${paths}</svg>
            ${markers}
        </div>`;
    })();

    // too many categories → show only every k-th label so they don't overflow
    const labelStep = Math.ceil(n / 18) || 1;
    const cats = Array.from({ length: n }, (_, i) =>
        html`<div class="lm-chart-cat"><span class="lm-chart-cat-label">${
            i % labelStep === 0 && m.categories[i] != null ? m.categories[i] : ''
        }</span></div>`);
    // x-label angle: explicit labelrotation, else auto-rotate when crowded
    const angle = m.labelrotation != null ? m.labelrotation : (n > 8 ? 35 : 0);
    const rotate = angle !== 0;
    // reserve row height for the rotated labels (estimate from longest label)
    const maxChars = Math.max(0, ...m.categories.map((c) => String(c).length));
    const estW = Math.min(maxChars * 6.5 + 6, 130);
    const xh = rotate ? Math.ceil(estW * Math.sin((Math.abs(angle) * Math.PI) / 180)) + 12 : 0;
    const xaxisStyle = rotate
        ? css({ '--lm-cat-angle': -angle + 'deg', minHeight: xh })
        : false;

    // continuous x-axis: smart ticks placed by value, + vertical gridlines + labels
    const xfmtFn = ctx.xformat();
    const xTicks = continuousX
        ? (m.xtype === 'datetime' ? timeTicks(xmin, xmax) : niceExtent(xmin, xmax).ticks.map((v) => ({ v, label: ctx.fmt(v) })))
            .filter((tk) => tk.v >= xmin - 1e-6 && tk.v <= xmax + 1e-6)
            .map((tk) => ({ pos: ((tk.v - xmin) / xspan) * 100, label: typeof xfmtFn === 'function' ? String(xfmtFn(tk.v)) : tk.label }))
        : [];
    const xGrid = continuousX && m.gridlines
        ? html`<div class="lm-chart-xgrid">${xTicks.map(
            (tk) => html`<div class="lm-chart-vline" style="${css({ left: tk.pos.toFixed(2) + '%' })}"></div>`)}</div>`
        : false;
    const xTimeAxis = continuousX
        ? html`<div class="lm-chart-xtime">${xTicks.map(
            (tk) => html`<div class="lm-chart-xtick" style="${css({ left: tk.pos.toFixed(2) + '%' })}"><span>${tk.label}</span></div>`)}</div>`
        : false;

    // The plot box holds ONLY the grid + bars (so they share one coordinate
    // space and bottom:0% lands exactly on the zero line). Category labels
    // live in a separate aligned row below; optional axis titles frame it.
    // reference lines & bands, positioned via the relevant axis scale
    const axScale = (axis?: string): Scale => (axis === 'right' && secondary ? secondary : primary);
    const valuePos = (v: number, sc: Scale): number => {
        const p = horizontal ? sc.frac(v) * 100 : (1 - sc.frac(v)) * 100;
        return Math.round(p * 1000) / 1000;
    };
    // x-axis reference position: continuous value, or a category index
    const xPos = (v: number): number => continuousX
        ? Math.round(((v - xmin) / xspan) * 1000) / 10
        : colCenter(Math.max(0, Math.min(n - 1, v)));
    const bandViews: View[] = (m.plotbands || []).filter((b) => b && b.from != null && b.to != null).map((b) => {
        const isX = b.axis === 'x';
        const sc = axScale(b.axis);
        const a = isX ? xPos(b.from) : valuePos(b.from, sc);
        const c = isX ? xPos(b.to) : valuePos(b.to, sc);
        const start = Math.min(a, c);
        const size = Math.abs(c - a);
        const vert = isX || horizontal; // a vertical strip (width-based)
        const bg = b.color || 'rgba(99,110,130,0.1)';
        const style = vert ? css({ left: start + '%', width: size + '%', background: bg }) : css({ top: start + '%', height: size + '%', background: bg });
        return html`<div class="lm-chart-plotband" data-orient="${vert ? 'h' : false}" style="${style}">${
            b.label ? html`<span class="lm-chart-plotband-label">${b.label}</span>` : false
        }</div>`;
    });
    const lineViews: View[] = (m.plotlines || []).filter((l) => l && l.value != null).map((l) => {
        const isX = l.axis === 'x';
        const p = isX ? xPos(l.value) : valuePos(l.value, axScale(l.axis));
        const stroke = (l.width || 1) + 'px ' + (l.dashed ? 'dashed' : 'solid') + ' ' + (l.color || '#7a828d');
        const vert = isX || horizontal; // a vertical line
        const style = vert ? css({ left: p + '%', borderLeft: stroke }) : css({ top: p + '%', borderTop: stroke });
        return html`<div class="lm-chart-plotline" data-orient="${vert ? 'h' : false}" style="${style}">${
            l.label ? html`<span class="lm-chart-plotline-label" style="${css({ color: l.color || '#7a828d' })}">${l.label}</span>` : false
        }</div>`;
    });
    const refBands = bandViews.length ? html`<div class="lm-chart-refs lm-chart-refbands">${bandViews}</div>` : false;
    const refLines = lineViews.length ? html`<div class="lm-chart-refs lm-chart-reflines">${lineViews}</div>` : false;
    // annotations: text callouts pinned to a data point (x = index/value, y = value)
    const annoViews: View[] = (m.annotations || []).filter((a) => a && a.x != null && a.y != null && a.text != null).map((a) => {
        const col = a.color || '#3f444c';
        return html`<div class="lm-chart-anno" style="${css({ left: xPos(a.x) + '%', top: valuePos(a.y, primary) + '%' })}">
            <span class="lm-chart-anno-dot" style="${css({ background: col })}"></span>
            <span class="lm-chart-anno-text" style="${css({ borderColor: col })}">${a.text}</span>
        </div>`;
    });
    const refAnno = annoViews.length ? html`<div class="lm-chart-refs lm-chart-annos">${annoViews}</div>` : false;

    // ---- keyboard navigation: arrow keys roam columns, Enter activates ----
    // Scoped to discrete columns (not the continuous-x line plot).
    const kbEnabled = !continuousX && n > 0;
    const kbActive = (): number | null => (ctx.kb.value != null && ctx.kb.value < n ? ctx.kb.value : null);
    const kbKey = (e: KeyboardEvent): void => {
        if (!kbEnabled) return;
        const cur = ctx.kb.value;
        let next = cur;
        switch (e.key) {
            case 'ArrowRight': case 'ArrowUp': next = cur == null ? 0 : Math.min(n - 1, cur + 1); break;
            case 'ArrowLeft': case 'ArrowDown': next = cur == null ? n - 1 : Math.max(0, cur - 1); break;
            case 'Home': next = 0; break;
            case 'End': next = n - 1; break;
            case 'Enter': case ' ': {
                const i = kbActive();
                if (i != null) { const s = vis[0]; if (s && s.points[i] && !s.points[i].gap) ctx.fire({ ...s.points[i], color: s.color }, sIndex(s), i); }
                e.preventDefault();
                return;
            }
            case 'Escape': ctx.kb.value = null; return;
            default: return;
        }
        e.preventDefault();
        ctx.kb.value = next;
    };
    // an inline tooltip anchored to the active column (state-driven, survives rebuilds)
    const kbView = ((): View | false => {
        const i = kbActive();
        if (i == null) return false;
        const cat = m.categories[i] != null ? m.categories[i] : '#' + i;
        const rows = vis.filter((s) => s.points[i] && !s.points[i].gap);
        return html`<div class="lm-chart-kbtip" style="${css({ left: colCenter(i) + '%' })}">
            <div class="lm-chart-kbtip-title">${cat}</div>
            ${rows.map((s) => html`<div class="lm-chart-tip-row">
                <span class="lm-chart-tip-swatch" style="${css({ background: s.color })}"></span>
                ${rows.length > 1 ? html`<span class="lm-chart-tip-name">${s.name}</span>` : false}
                <span class="lm-chart-tip-value">${ctx.fmt(s.points[i].value)}</span>
            </div>`)}
        </div>`;
    })();
    const kbLabel = ((): string => {
        const i = kbActive();
        if (i == null) return n ? 'Chart, ' + n + ' points. Use arrow keys to explore.' : '';
        const cat = m.categories[i] != null ? m.categories[i] : '#' + i;
        const vals = vis.filter((s) => s.points[i] && !s.points[i].gap).map((s) => s.name + ' ' + ctx.fmt(s.points[i].value)).join(', ');
        return cat + ': ' + vals + '. Point ' + (i + 1) + ' of ' + n + '.';
    })();

    // ---- navigator: an overview sparkline with a draggable x-window ----
    // Operates on the FULL series; the window drives the same zoomRange as
    // drag-select. Only for the discrete-column cartesian types.
    const navView = ((): View | false => {
        if (!ctx.navigator() || continuousX || fullN < 2) return false;
        const fvis = mFull.series.filter((s) => !ctx.isHidden(s.name));
        let lo = Infinity; let hi = -Infinity;
        for (const s of fvis) for (const p of s.points) if (p && !p.gap) { lo = Math.min(lo, p.value); hi = Math.max(hi, p.value); }
        if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
        if (hi <= lo) hi = lo + 1;
        const xf = (i: number): number => (i / (fullN - 1)) * 100;
        const yf = (v: number): number => 100 - ((v - lo) / (hi - lo)) * 92 - 4; // 4% padding
        const spark = fvis.map((s) => {
            const pts: string[] = [];
            for (let i = 0; i < fullN; i++) { const p = s.points[i]; if (p && !p.gap) pts.push(xf(i).toFixed(1) + ',' + yf(p.value).toFixed(1)); }
            return html`<polyline class="lm-chart-nav-line" points="${pts.join(' ')}" style="${css({ stroke: s.color })}" />`;
        });
        const a0 = zr ? zr[0] : 0;
        const b0 = zr ? zr[1] : fullN - 1;
        const winL = (a0 / fullN) * 100;
        const winR = ((b0 + 1) / fullN) * 100;
        const fracOf = (e: MouseEvent): number => {
            const strip = (e.currentTarget as Element).closest('.lm-chart-nav-inner');
            if (!strip) return 0;
            const r = strip.getBoundingClientRect();
            return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        };
        const grab = (mode: 'l' | 'r' | 'm') => (e: MouseEvent): void => {
            e.preventDefault(); e.stopPropagation();
            ctx.navDrag.value = { mode, a: a0, b: b0, f0: fracOf(e) };
        };
        const move = (e: MouseEvent): void => {
            const d = ctx.navDrag.value;
            if (!d) return;
            const idx = Math.round(fracOf(e) * fullN);
            let a = d.a; let b = d.b;
            if (d.mode === 'l') { a = Math.max(0, Math.min(idx, d.b)); }
            else if (d.mode === 'r') { b = Math.max(d.a, Math.min(idx - 1, fullN - 1)); }
            else {
                const delta = idx - Math.round(d.f0 * fullN);
                a = d.a + delta; b = d.b + delta;
                if (a < 0) { b -= a; a = 0; }
                if (b > fullN - 1) { a -= b - (fullN - 1); b = fullN - 1; }
                a = Math.max(0, a); b = Math.min(fullN - 1, b);
            }
            if (b < a) return;
            ctx.zoomRange.value = (a === 0 && b === fullN - 1) ? null : [a, b];
        };
        const release = (): void => { if (ctx.navDrag.value) ctx.navDrag.value = null; };
        return html`<div class="lm-chart-nav">
            <div class="lm-chart-nav-inner" data-right="${hasRight ? 'true' : false}"
                onmousemove="${move}" onmouseup="${release}" onmouseleave="${release}">
                <svg class="lm-chart-nav-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${spark}</svg>
                <div class="lm-chart-nav-mask" style="${css({ left: 0, width: winL + '%' })}"></div>
                <div class="lm-chart-nav-mask" style="${css({ left: winR + '%', right: 0 })}"></div>
                <div class="lm-chart-nav-win" style="${css({ left: winL + '%', width: (winR - winL) + '%' })}"
                    onmousedown="${grab('m')}">
                    <span class="lm-chart-nav-handle" data-edge="l" onmousedown="${grab('l')}"></span>
                    <span class="lm-chart-nav-handle" data-edge="r" onmousedown="${grab('r')}"></span>
                </div>
            </div>
        </div>`;
    })();

    // secondary (right) axis tick labels, aligned to the primary gridlines
    const rightAxis = secondary
        ? html`<div class="lm-chart-grid-right">${secondary.ticks.map(
            (t) => html`<div class="lm-chart-gridline-r"><span class="lm-chart-tick-r">${ctx.fmt(t)}</span></div>`,
        )}</div>`
        : false;

    // ---- horizontal orientation: categories on the y-axis, values on x ----
    if (horizontal) {
        const ycatsW = Math.min(150, Math.max(48, maxChars * 7 + 14));
        const vticks = [...ticks].reverse(); // lo → hi, left to right
        return html`<div class="lm-chart-plotblock" data-orient="h"
            style="${css({ '--lm-ycats-w': ycatsW + 'px' })}">
            <div class="lm-chart-harea">
                ${m.ytitle ? html`<div class="lm-chart-ytitle"><span>${m.ytitle}</span></div>` : false}
                <div class="lm-chart-ycats">${Array.from({ length: n }, (_, i) =>
                    html`<div class="lm-chart-ycat">${m.categories[i] != null ? m.categories[i] : ''}</div>`)}</div>
                <div class="lm-chart-plot" data-orient="h">
                    <div class="lm-chart-grid" data-orient="h" data-off="${m.gridlines ? false : 'true'}">${vticks.map(
                        (t) => html`<div class="lm-chart-gridline" data-zero="${Math.abs(t - baseV) < 1e-9 ? 'true' : false}"></div>`,
                    )}</div>
                    ${refBands}
                    <div class="lm-chart-cols" data-orient="h">${Array.from({ length: n }, (_, i) => column(i))}</div>
                    ${refLines}
                </div>
            </div>
            <div class="lm-chart-xvalues">${vticks.map(
                (t) => html`<div class="lm-chart-xval"><span>${percent ? Math.round(t) + '%' : ctx.fmt(t)}</span></div>`)}</div>
            ${m.xtitle ? html`<div class="lm-chart-xtitle lm-chart-xtitle-h">${m.xtitle}</div>` : false}
        </div>`;
    }

    return html`<div class="lm-chart-plotblock">
        <div class="lm-chart-area">
            ${m.ytitle ? html`<div class="lm-chart-ytitle"><span>${m.ytitle}</span></div>` : false}
            <div class="lm-chart-plotcol">
                <div class="lm-chart-plot" data-right="${hasRight ? 'true' : false}">
                    <div class="lm-chart-grid" data-off="${m.gridlines ? false : 'true'}"
                        style="${hasRight ? css({ right: 40 }) : false}">${ticks.map(
                        (t) => html`<div class="lm-chart-gridline"
                            data-zero="${Math.abs(t - baseV) < 1e-9 ? 'true' : false}">
                            <span class="lm-chart-tick">${percent ? Math.round(t) + '%' : ctx.fmt(t)}</span>
                        </div>`,
                    )}</div>
                    ${refBands}${xGrid}
                    <div class="lm-chart-cols" data-zoom="${zoomable ? 'true' : false}"
                        tabindex="${kbEnabled ? '0' : false}" role="${kbEnabled ? 'application' : false}"
                        aria-label="${kbEnabled ? kbLabel : false}"
                        onkeydown="${kbKey}"
                        onblur="${() => { if (ctx.kb.value != null) ctx.kb.value = null; }}"
                        onmousedown="${(e: MouseEvent) => { if (zoomable) startDrag(e); }}"
                        onmousemove="${(e: MouseEvent) => { if (ctx.zsel.value) moveDrag(e); }}"
                        onmouseup="${() => { if (zoomable) endDrag(); }}"
                        onmouseleave="${() => { if (ctx.zsel.value) ctx.zsel.value = null; }}">${
                        continuousX ? false : Array.from({ length: n }, (_, i) => column(i))
                    }${lineOverlay}${kbView}${
                        ctx.zsel.value ? html`<div class="lm-chart-zoomsel" style="${css({ left: Math.min(ctx.zsel.value.a, ctx.zsel.value.b) * 100 + '%', width: Math.abs(ctx.zsel.value.b - ctx.zsel.value.a) * 100 + '%' })}"></div>` : false
                    }</div>
                    ${refLines}${refAnno}
                    ${zr ? html`<button type="button" class="lm-chart-zoomreset" title="Reset zoom" onclick="${() => { ctx.zoomRange.value = null; }}">⤢</button>` : false}
                    ${rightAxis}
                </div>
                ${continuousX ? xTimeAxis : html`<div class="lm-chart-xaxis" data-rotate="${rotate ? 'true' : false}"
                    style="${xaxisStyle}">${cats}</div>`}
                ${navView}
            </div>
            ${m.y2title && hasRight ? html`<div class="lm-chart-ytitle lm-chart-y2title"><span>${m.y2title}</span></div>` : false}
        </div>
        ${m.xtitle ? html`<div class="lm-chart-xtitle">${m.xtitle}</div>` : false}
    </div>`;
};


/* ----- waterfall (floating bars, running total) ----- */
export const waterfallChart = (m: Model, ctx: RenderCtx): View => {
    const pts = m.series[0] ? m.series[0].points : [];
    const n = m.categories.length || pts.length;
    let cum = 0;
    const steps = Array.from({ length: n }, (_, i) => {
        const p = pts[i];
        const delta = p && !p.gap ? p.value : 0;
        const base = cum;
        cum += delta;
        return { base, top: cum, delta, name: m.categories[i] != null ? m.categories[i] : (p ? p.name : '') };
    });
    let lo = 0;
    let hi = 0;
    for (const s of steps) { lo = Math.min(lo, s.base, s.top); hi = Math.max(hi, s.base, s.top); }
    const sc = niceScale(lo, hi);
    const range = sc.hi - sc.lo || 1;
    const frac = (v: number): number => (v - sc.lo) / range;
    const up = 'var(--lm-chart-up)';
    const down = 'var(--lm-chart-down)';
    const cols = steps.map((s, i) => {
        const a = frac(Math.min(s.base, s.top)) * 100;
        const b = frac(Math.max(s.base, s.top)) * 100;
        const color = s.delta >= 0 ? up : down;
        return html`<div class="lm-chart-col">
            <div class="lm-chart-stack">
                <div class="lm-chart-barslot"><div class="lm-chart-bar"
                    style="${css({ bottom: a.toFixed(2) + '%', height: (b - a).toFixed(2) + '%', background: color })}"
                    onmousemove="${(e: MouseEvent) => ctx.showTip(e, s.name || '', [{ name: '', value: (s.delta >= 0 ? '+' : '') + ctx.fmt(s.delta), color }])}"
                    onmouseleave="${ctx.hideTip}">${
                    m.labels ? html`<span class="lm-chart-value">${(s.delta >= 0 ? '+' : '') + ctx.fmt(s.delta)}</span>` : false
                }</div></div>
            </div>
        </div>`;
    });
    return html`<div class="lm-chart-plotblock">
        <div class="lm-chart-area">
            ${m.ytitle ? html`<div class="lm-chart-ytitle"><span>${m.ytitle}</span></div>` : false}
            <div class="lm-chart-plotcol">
                <div class="lm-chart-plot">
                    <div class="lm-chart-grid" data-off="${m.gridlines ? false : 'true'}">${sc.ticks.map(
                        (t) => html`<div class="lm-chart-gridline" data-zero="${Math.abs(t) < 1e-9 ? 'true' : false}">
                            <span class="lm-chart-tick">${ctx.fmt(t)}</span></div>`,
                    )}</div>
                    <div class="lm-chart-cols">${cols}</div>
                </div>
                <div class="lm-chart-xaxis">${steps.map((s) =>
                    html`<div class="lm-chart-cat"><span class="lm-chart-cat-label">${s.name || ''}</span></div>`)}</div>
            </div>
        </div>
    </div>`;
};

/* ----- shared cartesian frame (grid + per-category marks + x-axis) ----- */
const cartesianFrame = (m: Model, ticksDesc: number[], n: number, colMark: (i: number) => View | false, ctx: RenderCtx, overlay?: View | false): View => {
    const labelStep = Math.ceil(n / 18) || 1;
    const cats = Array.from({ length: n }, (_, i) =>
        html`<div class="lm-chart-cat"><span class="lm-chart-cat-label">${i % labelStep === 0 && m.categories[i] != null ? m.categories[i] : ''}</span></div>`);
    return html`<div class="lm-chart-plotblock">
        <div class="lm-chart-area">
            ${m.ytitle ? html`<div class="lm-chart-ytitle"><span>${m.ytitle}</span></div>` : false}
            <div class="lm-chart-plotcol">
                <div class="lm-chart-plot">
                    <div class="lm-chart-grid" data-off="${m.gridlines ? false : 'true'}">${ticksDesc.map(
                        (t) => html`<div class="lm-chart-gridline" data-zero="${Math.abs(t) < 1e-9 ? 'true' : false}">
                            <span class="lm-chart-tick">${ctx.fmt(t)}</span></div>`,
                    )}</div>
                    <div class="lm-chart-cols">${Array.from({ length: n }, (_, i) =>
                        html`<div class="lm-chart-col">${colMark(i)}</div>`)}${overlay || false}</div>
                </div>
                <div class="lm-chart-xaxis">${cats}</div>
            </div>
        </div>
        ${m.xtitle ? html`<div class="lm-chart-xtitle">${m.xtitle}</div>` : false}
    </div>`;
};

/* ----- candlestick / OHLC ----- */
export const ohlcChart = (m: Model, ctx: RenderCtx): View => {
    const pts = m.series[0] ? m.series[0].points : [];
    const n = m.categories.length || pts.length;
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pts) { if (p.gap || p.extra.length < 4) continue; lo = Math.min(lo, p.extra[2]); hi = Math.max(hi, p.extra[1]); }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const sc = niceExtent(lo, hi);
    const range = sc.hi - sc.lo || 1;
    const yf = (v: number): number => (1 - (v - sc.lo) / range) * 100;
    const colMark = (i: number): View | false => {
        const p = pts[i];
        if (!p || p.gap || p.extra.length < 4) return false;
        const [o, h, l, c] = p.extra;
        const color = c >= o ? 'var(--lm-chart-up)' : 'var(--lm-chart-down)';
        const bt = yf(Math.max(o, c));
        const bb = yf(Math.min(o, c));
        const tip = (e: MouseEvent): void => ctx.showTip(e, m.categories[i] != null ? String(m.categories[i]) : '',
            [{ name: 'O', value: ctx.fmt(o), color }, { name: 'H', value: ctx.fmt(h), color }, { name: 'L', value: ctx.fmt(l), color }, { name: 'C', value: ctx.fmt(c), color }]);
        return html`<div class="lm-chart-ohlc" onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}">
            <div class="lm-chart-ohlc-wick" style="${css({ top: yf(h) + '%', height: (yf(l) - yf(h)) + '%', background: color })}"></div>
            <div class="lm-chart-ohlc-body" style="${css({ top: bt + '%', height: Math.max(0.6, bb - bt) + '%', background: m.type === 'ohlc' ? 'none' : color, borderColor: color })}"></div>
            ${m.labels ? html`<span class="lm-chart-ohlc-val" data-pos="hi" style="${css({ top: yf(h) + '%' })}">${ctx.fmt(h)}</span>
                <span class="lm-chart-ohlc-val" data-pos="lo" style="${css({ top: yf(l) + '%' })}">${ctx.fmt(l)}</span>` : false}
        </div>`;
    };
    return cartesianFrame(m, [...sc.ticks].reverse(), n, colMark, ctx);
};

/* ----- boxplot ----- */
export const boxplotChart = (m: Model, ctx: RenderCtx): View => {
    const pts = m.series[0] ? m.series[0].points : [];
    const n = m.categories.length || pts.length;
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pts) { if (p.gap || p.extra.length < 5) continue; lo = Math.min(lo, p.extra[0]); hi = Math.max(hi, p.extra[4]); }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const sc = niceExtent(lo, hi);
    const range = sc.hi - sc.lo || 1;
    const yf = (v: number): number => (1 - (v - sc.lo) / range) * 100;
    const color = (m.series[0] && m.series[0].color) || PALETTES.lemonade[0];
    const colMark = (i: number): View | false => {
        const p = pts[i];
        if (!p || p.gap || p.extra.length < 5) return false;
        const [mn, q1, md, q3, mx] = p.extra;
        const tip = (e: MouseEvent): void => ctx.showTip(e, m.categories[i] != null ? String(m.categories[i]) : '',
            [{ name: 'max', value: ctx.fmt(mx), color }, { name: 'Q3', value: ctx.fmt(q3), color }, { name: 'median', value: ctx.fmt(md), color }, { name: 'Q1', value: ctx.fmt(q1), color }, { name: 'min', value: ctx.fmt(mn), color }]);
        return html`<div class="lm-chart-box" onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}">
            <div class="lm-chart-box-whisker" style="${css({ top: yf(mx) + '%', height: (yf(mn) - yf(mx)) + '%' })}"></div>
            <div class="lm-chart-box-cap" style="${css({ top: yf(mx) + '%' })}"></div>
            <div class="lm-chart-box-cap" style="${css({ top: yf(mn) + '%' })}"></div>
            <div class="lm-chart-box-rect" style="${css({ top: yf(q3) + '%', height: (yf(q1) - yf(q3)) + '%', borderColor: color, background: lerpColor('#ffffff', '#2196f3', 0.12) })}"></div>
            <div class="lm-chart-box-median" style="${css({ top: yf(md) + '%', background: color })}"></div>
            ${m.labels ? html`<span class="lm-chart-box-val" data-pos="hi" style="${css({ top: yf(mx) + '%' })}">${ctx.fmt(mx)}</span>
                <span class="lm-chart-box-val" data-pos="md" style="${css({ top: yf(md) + '%' })}">${ctx.fmt(md)}</span>
                <span class="lm-chart-box-val" data-pos="lo" style="${css({ top: yf(mn) + '%' })}">${ctx.fmt(mn)}</span>` : false}
        </div>`;
    };
    return cartesianFrame(m, [...sc.ticks].reverse(), n, colMark, ctx);
};

/* ----- range (column-range floating bars; area-range SVG band;
         dumbbell = two dots joined by a thin connector) ----- */
export const rangeChart = (m: Model, ctx: RenderCtx): View => {
    const area = m.type === 'arearange';
    const dumbbell = m.type === 'dumbbell';
    const pts = m.series[0] ? m.series[0].points : [];
    const n = m.categories.length || pts.length;
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pts) { if (p.gap || p.extra.length < 2) continue; lo = Math.min(lo, p.extra[0]); hi = Math.max(hi, p.extra[1]); }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const sc = niceExtent(lo, hi);
    const range = sc.hi - sc.lo || 1;
    const yf = (v: number): number => (1 - (v - sc.lo) / range) * 100;
    const color = (m.series[0] && m.series[0].color) || PALETTES.lemonade[0];

    // each category gets a full-height mark: a floating bar (column-range) or
    // a transparent hit strip (area-range), both carrying tooltip + value labels
    const colMark = (i: number): View | false => {
        const p = pts[i];
        if (!p || p.gap || p.extra.length < 2) return false;
        const low = p.extra[0];
        const high = p.extra[1];
        const yHi = yf(high);
        const yLo = yf(low);
        const cat = m.categories[i] != null ? String(m.categories[i]) : '';
        const tip = (e: MouseEvent): void => ctx.showTip(e, cat, [{ name: '', value: ctx.fmt(low) + ' – ' + ctx.fmt(high), color }]);
        const labels = m.labels
            ? html`<span class="lm-chart-range-val" data-pos="hi" style="${css({ top: yHi + '%' })}">${ctx.fmt(high)}</span>
                <span class="lm-chart-range-val" data-pos="lo" style="${css({ top: yLo + '%' })}">${ctx.fmt(low)}</span>`
            : false;
        const mark = dumbbell
            ? html`<div class="lm-chart-dumbbell-link" style="${css({ top: yHi + '%', height: Math.max(0, yLo - yHi) + '%' })}"></div>
                <span class="lm-chart-dumbbell-dot" data-end="lo" style="${css({ top: yLo + '%' })}"></span>
                <span class="lm-chart-dumbbell-dot" data-end="hi" style="${css({ top: yHi + '%', background: color })}"></span>`
            : area ? false : html`<div class="lm-chart-range-bar" style="${css({ top: yHi + '%', bottom: (100 - yLo) + '%', background: color })}"></div>`;
        return html`<div class="lm-chart-range-mark" onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}">
            ${mark}
            ${labels}
        </div>`;
    };

    let overlay: View | false = false;
    if (area) {
        const cc = (i: number): number => ((i + 0.5) / n) * 100;
        const hiPts: string[] = [];
        const loPts: string[] = [];
        for (let i = 0; i < n; i++) {
            const p = pts[i];
            if (!p || p.gap || p.extra.length < 2) continue;
            hiPts.push(cc(i).toFixed(2) + ',' + yf(p.extra[1]).toFixed(2));
            loPts.push(cc(i).toFixed(2) + ',' + yf(p.extra[0]).toFixed(2));
        }
        const d = 'M ' + hiPts.join(' L ') + ' L ' + [...loPts].reverse().join(' L ') + ' Z';
        overlay = html`<div class="lm-chart-lineoverlay">
            <svg class="lm-chart-linesvg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path class="lm-chart-areafill" d="${d}" style="${css({ fill: color })}" />
                <polyline class="lm-chart-line" points="${hiPts.join(' ')}" style="${css({ stroke: color })}" />
                <polyline class="lm-chart-line" points="${loPts.join(' ')}" style="${css({ stroke: color })}" />
            </svg></div>`;
    }
    return cartesianFrame(m, [...sc.ticks].reverse(), n, colMark, ctx, overlay);
};

/* ----- lollipop (thin stem from the baseline + a dot at the value) ----- */
export const lollipopChart = (m: Model, ctx: RenderCtx): View => {
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    const n = m.categories.length || (m.series[0] ? m.series[0].points.length : 0);
    let dmin = 0;
    let dmax = 0;
    for (const s of vis) for (const p of s.points) { if (p.gap) continue; dmin = Math.min(dmin, p.value); dmax = Math.max(dmax, p.value); }
    const sc = niceScale(dmin, dmax);
    const range = sc.hi - sc.lo || 1;
    const frac = (v: number): number => (Math.max(sc.lo, Math.min(sc.hi, v)) - sc.lo) / range;
    const basePct = frac(0) * 100;
    const colMark = (i: number): View => {
        const cat = m.categories[i] != null ? String(m.categories[i]) : '';
        return html`<div class="lm-chart-loll">${vis.map((s) => {
            const p = s.points[i];
            if (!p || p.gap) return html`<div class="lm-chart-loll-slot"></div>`;
            const v = frac(p.value) * 100;
            const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
            const tipName = cat ? cat + ' · ' + s.name : s.name;
            const tip = (e: MouseEvent): void => ctx.showTip(e, tipName, [{ name: '', value: ctx.fmt(p.value), color: s.color }]);
            return html`<div class="lm-chart-loll-slot">
                <div class="lm-chart-loll-stem" data-dim="${dim}"
                    style="${css({ bottom: Math.min(v, basePct) + '%', height: Math.abs(v - basePct) + '%', background: s.color })}"></div>
                <span class="lm-chart-loll-dot" data-dim="${dim}"
                    style="${css({ bottom: v + '%', background: s.color })}"
                    onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                    onclick="${() => ctx.fire({ ...p, color: s.color }, m.series.indexOf(s), i)}">${
                    m.labels && vis.length === 1 ? html`<span class="lm-chart-loll-val">${ctx.fmt(p.value)}</span>` : false
                }</span>
            </div>`;
        })}</div>`;
    };
    return cartesianFrame(m, sc.ticks, n, colMark, ctx);
};

