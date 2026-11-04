/**
 * <Chart /> radial renderers — the centred-SVG types: pie/donut, radar,
 * gauge, radialbar, polararea and funnel/pyramid.
 */
import { css, html, type View } from 'lemonadejs';
import { PALETTES, fillVar, type Model, type NormPoint, type RenderCtx } from './model';
import { R, annulus, f, kbKeydown, niceScale, polar, roundedRing, textOn, wedge } from './helpers';
import { lineColor, markerStyle } from './cartesian';

/** Inline tip for the keyboard-active mark (the radial twin of the
 *  cartesian .lm-chart-kbtip; state-driven, survives rebuilds). */
const kbTip = (title: string, value: string, color: string): View =>
    html`<div class="lm-chart-kbtip" style="${css({ left: '50%' })}">
        <div class="lm-chart-kbtip-title">${title}</div>
        <div class="lm-chart-tip-row">
            <span class="lm-chart-tip-swatch" style="${css({ background: color })}"></span>
            <span class="lm-chart-tip-value">${value}</span>
        </div>
    </div>`;

/** Clamp the roving index to the current mark count (stale state → null). */
const kbIndex = (v: number | null, n: number): number | null => (v != null && v < n ? v : null);

/* ----- radar / spider (SVG polar) ----- */
export const radarChart = (m: Model, ctx: RenderCtx): View => {
    const RR = 38; // radar radius within the 0..100 viewBox
    const cats = m.categories.length || (m.series[0] ? m.series[0].points.length : 0);
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    let max = 0;
    for (const s of vis) for (const p of s.points) if (!p.gap) max = Math.max(max, p.value);
    // the radial scale (raxis): min/max, else 0 to a nice maximum; `step`
    // spaces the rings (at most 50), else 4 rings; reversed, the maximum
    // sits at the centre
    const ra = m.raxis;
    const lo = ra.min != null ? ra.min : 0;
    let hi = ra.max != null ? ra.max : (niceScale(Math.min(0, lo), max).hi || 1);
    if (hi <= lo) hi = lo + 1;
    const span = hi - lo;
    const nR = ra.step != null ? Math.max(1, Math.min(50, Math.round(span / ra.step))) : 4;
    const frac = (v: number): number => Math.max(0, Math.min(1, (v - lo) / span));
    const rOf = (v: number): number => (ra.reverse ? 1 - frac(v) : frac(v)) * RR;
    const ang = (i: number): number => (i * 360) / (cats || 1); // 0 at top, clockwise
    const at = (i: number, r: number): [number, number] => polar(ang(i), r);

    // concentric grid rings + spokes
    const rings = Array.from({ length: nR }, (_, j) => j + 1).map((k) => {
        const pts = Array.from({ length: cats }, (_, i) => at(i, (RR * k) / nR).map((c) => c.toFixed(2)).join(',')).join(' ');
        return html`<polygon class="lm-chart-radar-ring" points="${pts}" />`;
    });
    const spokes = Array.from({ length: cats }, (_, i) => {
        const [x, y] = at(i, RR);
        return html`<line class="lm-chart-radar-spoke" x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" />`;
    });
    // one polygon per series + a vertex marker per point (hover → category
    // + value). Colours as a line series: `bordercolor` strokes the polygon
    // and rings the markers, `color` fills both. The vertices are the small
    // svg dots unless the series asks for markers (markers/marker/markersize:
    // then the line chart's HTML markers, any shape), or turns them off.
    const shapes: View[] = [];
    const dots: View[] = [];
    const markers: View[] = [];
    vis.forEach((s) => {
        const stroke = lineColor(s);
        const custom = s.markers === true || !!s.marker || s.markersize != null;
        const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
        // a null point is a gap: no vertex, marker or hover there. The
        // polygon skips it (connectgaps: the neighbours join across it) or
        // breaks there (each run of points is an open stroke, its fill
        // closed through the centre)
        const verts = Array.from({ length: cats }, (_, i) => {
            const p = s.points[i];
            const gap = !p || p.gap;
            const v = gap ? 0 : p.value;
            return { xy: at(i, rOf(v)), v, i, gap };
        });
        const solid = verts.filter((e) => !e.gap);
        const pt = (e: { xy: [number, number] }): string => e.xy.map((c) => c.toFixed(2)).join(',');
        const shapeStyle = css(s.width ? { fill: s.color, stroke, 'stroke-width': s.width, ...fillVar(s) } : { fill: s.color, stroke, ...fillVar(s) });
        const nofill = s.type === 'line' ? 'true' : false; // a 'line' series is the outline only
        if (solid.length === verts.length || s.connectgaps) {
            if (solid.length) shapes.push(html`<polygon class="lm-chart-radar-area"
                points="${solid.map(pt).join(' ')}"
                style="${shapeStyle}" data-nofill="${nofill}" data-dashed="${s.dashed || false}" data-dim="${dim}" />`);
        } else {
            // runs of consecutive points around the circle (wrapping past the end)
            const first = verts.findIndex((e) => e.gap);
            const runs: Array<typeof verts> = [];
            let cur: typeof verts = [];
            for (let k = 1; k <= cats; k++) {
                const e = verts[(first + k) % cats];
                if (e.gap) { if (cur.length) { runs.push(cur); cur = []; } } else cur.push(e);
            }
            if (cur.length) runs.push(cur);
            for (const run of runs) {
                if (s.type !== 'line' && run.length > 1) shapes.push(html`<path class="lm-chart-radar-area"
                    d="${'M 50,50 L ' + run.map(pt).join(' L ') + ' Z'}"
                    style="${css({ fill: s.color, stroke: 'none', ...fillVar(s) })}" data-dim="${dim}" />`);
                if (run.length > 1) shapes.push(html`<polyline class="lm-chart-radar-area"
                    points="${run.map(pt).join(' ')}"
                    style="${css(s.width ? { fill: 'none', stroke, 'stroke-width': s.width } : { fill: 'none', stroke })}"
                    data-dashed="${s.dashed || false}" data-dim="${dim}" />`);
            }
        }
        for (const e of solid) {
            const cat = m.categories[e.i] != null ? m.categories[e.i] : '';
            const tip = (ev: MouseEvent): void => ctx.showTip(ev, s.name, [{ name: cat, value: ctx.fmt(e.v), color: s.color, border: s.bordercolor }]);
            if (custom && s.markers !== false) {
                markers.push(html`<span class="lm-chart-marker" data-shape="${s.marker || false}"
                    style="${markerStyle(s, { left: e.xy[0].toFixed(2) + '%', top: e.xy[1].toFixed(2) + '%' })}"
                    data-dim="${dim}" onmousemove="${tip}" onmouseleave="${ctx.hideTip}"></span>`);
                continue;
            }
            // markers off: an invisible hover target keeps the tooltip
            dots.push(html`<circle class="lm-chart-radar-dot" cx="${e.xy[0].toFixed(2)}" cy="${e.xy[1].toFixed(2)}" r="1.6"
                style="${css({ fill: s.markers === false ? 'transparent' : s.color })}" data-dim="${dim}"
                data-hidden="${s.markers === false ? 'true' : false}"
                onmousemove="${tip}" onmouseleave="${ctx.hideTip}" />`);
        }
    });
    // category labels (HTML overlay, fixed px) unless raxis.labels is off
    const labels = ra.labels ? Array.from({ length: cats }, (_, i) => {
        const [x, y] = at(i, RR + 8);
        return html`<span class="lm-chart-radar-label" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}"
            >${m.categories[i] != null ? m.categories[i] : ''}</span>`;
    }) : [];
    // ring values up the 12-o'clock spoke (Highcharts yAxis labels):
    // raxis.ticks decides, else they come with the chart's value labels
    const showTicks = ra.ticks != null ? ra.ticks : m.labels;
    const tickLabels = showTicks
        ? Array.from({ length: nR }, (_, j) => j + 1).map((k) => html`<span class="lm-chart-radar-tickval"
            style="${css({ left: '50.5%', top: (50 - (RR * k) / nR).toFixed(2) + '%' })}">${
            ctx.fmt(ra.reverse ? hi - (span * k) / nR : lo + (span * k) / nR)}</span>`)
        : [];

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}${spokes}${shapes}${dots}</svg>
            ${markers}${labels}${tickLabels}
        </div>
    </div>`;
};

/* ----- radial bar (concentric progress rings; each point = one ring) ----- */
export const radialbarChart = (m: Model, ctx: RenderCtx): View => {
    // MULTI-SERIES: stacked polar columns (the Highcharts "Winter Olympic
    // medals" look) — one ring per category, series segments stacked along
    // a shared 0..360° value axis, category names at the ring start and
    // value tick labels around the outside.
    if (m.series.length > 1) {
        const n = m.categories.length || (m.series[0] ? m.series[0].points.length : 0);
        const vis = m.series.filter((s) => !ctx.isHidden(s.name));
        let peak = 0;
        for (let i = 0; i < n; i++) {
            let t = 0;
            for (const s of vis) { const p = s.points[i]; if (p && !p.gap) t += Math.max(0, p.value); }
            peak = Math.max(peak, t);
        }
        const hi = niceScale(0, peak).hi || 1;
        const R0 = 44;
        const per = (R0 - 14) / (n || 1);
        const th = Math.min(10, Math.max(3, per * 0.7));
        const segs: View[] = [];
        const leads: View[] = [];
        const catLabels: View[] = [];
        // category labels sit a fixed gap LEFT of the ring starts, with a
        // thin leader line connecting each label to its ring (the labels
        // used to hug the 12-o'clock arc starts and collide with them)
        const LABEL_X = 44;
        // keyboard: arrows roam the category rings, Enter/Space activates
        // the first visible series' point (mirrors the cartesian model)
        const kbi = kbIndex(ctx.kb.value, n);
        const kbKey = kbKeydown(ctx.kb, n, (i) => {
            const s = vis[0];
            if (s && s.points[i] && !s.points[i].gap) ctx.fire(s.points[i], m.series.indexOf(s), i);
        });
        const kbVals = (i: number): string => vis.filter((s) => s.points[i] && !s.points[i].gap)
            .map((s) => s.name + ' ' + ctx.fmt(s.points[i].value)).join(', ');
        const kbLabel = kbi == null
            ? (n ? 'Chart, ' + n + ' points. Use arrow keys to explore.' : '')
            : (m.categories[kbi] != null ? m.categories[kbi] : '#' + kbi) + ': ' + kbVals(kbi) +
                '. Point ' + (kbi + 1) + ' of ' + n + '.';
        for (let i = 0; i < n; i++) {
            const r = R0 - per * i - th / 2;
            const cat = m.categories[i] != null ? m.categories[i] : '';
            let acc = 0;
            for (const s of vis) {
                const p = s.points[i];
                if (!p || p.gap || p.value <= 0) continue;
                const a0 = (acc / hi) * 360;
                acc += p.value;
                const a1 = Math.min(359.9, (acc / hi) * 360);
                const [x0, y0] = polar(a0, r);
                const [x1, y1] = polar(a1, r);
                const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
                const tip = (ev: MouseEvent): void =>
                    ctx.showTip(ev, cat ? cat + ' · ' + s.name : s.name, [{ name: '', value: ctx.fmt(p.value), color: s.color }]);
                segs.push(html`<path class="lm-chart-radial-arc" data-stack="true"
                    d="M ${f(x0)} ${f(y0)} A ${f(r)} ${f(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}"
                    stroke-width="${String(th)}" style="${css({ stroke: s.color })}" data-dim="${dim}"
                    data-kb="${kbi === i ? 'true' : false}"
                    onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                    onclick="${() => ctx.fire(p, m.series.indexOf(s), i)}" />`);
            }
            leads.push(html`<line class="lm-chart-radial-lead"
                x1="${f(LABEL_X + 0.5)}" y1="${f(50 - r)}" x2="50" y2="${f(50 - r)}" />`);
            catLabels.push(html`<span class="lm-chart-radial-cat"
                style="${css({ left: LABEL_X + '%', top: (50 - r) + '%' })}">${cat}</span>`);
        }
        const tickLabels = m.labels
            ? niceScale(0, peak).ticks.filter((t) => t >= 0 && t < hi - 1e-9).map((t) => {
                const [x, y] = polar((t / hi) * 360, R0 + 5);
                return html`<span class="lm-chart-radial-tick"
                    style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}">${ctx.fmt(t)}</span>`;
            })
            : [];
        return html`<div class="lm-chart-pie-core">
            <div class="lm-chart-pie-area" tabindex="${n ? '0' : false}"
                role="${n ? 'application' : false}"
                aria-label="${n ? kbLabel : false}"
                onkeydown="${kbKey}"
                onblur="${() => { if (ctx.kb.value != null) ctx.kb.value = null; }}">
                <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${leads}${segs}</svg>
                ${catLabels}${tickLabels}
                ${kbi != null ? kbTip(String(m.categories[kbi] != null ? m.categories[kbi] : '#' + kbi), kbVals(kbi), vis[0] ? vis[0].color : '') : false}
            </div>
        </div>`;
    }
    const pts = (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap);
    const entries = pts.map((p, i) => ({ p, i, key: p.name || '#' + i })).filter((e) => !ctx.isHidden(e.key));
    const max = m.ymax != null ? m.ymax : 100;
    const n = entries.length || 1;
    // rings run outside-in between r=44 and r=12; thickness shrinks to fit
    const R0 = 44;
    const per = (R0 - 12) / n;
    const th = Math.min(9, Math.max(2, per * 0.72));
    const arc = (to: number, r: number): string => {
        const [x0, y0] = polar(0, r);
        const [x1, y1] = polar(to, r);
        return `M ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${to > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
    };
    // keyboard: arrows roam the rings, Enter/Space activates (cartesian model)
    const nKb = entries.length;
    const kbi = kbIndex(ctx.kb.value, nKb);
    const kbKey = kbKeydown(ctx.kb, nKb, (i) => ctx.fire(entries[i].p, 0, entries[i].i));
    const kbText = (e: { p: NormPoint }): string => {
        const fr = max > 0 ? Math.max(0, Math.min(1, e.p.value / max)) : 0;
        return ctx.fmt(e.p.value) + ' (' + Math.round(fr * 100) + '%)';
    };
    const kbLabel = kbi == null
        ? (nKb ? 'Chart, ' + nKb + ' points. Use arrow keys to explore.' : '')
        : (entries[kbi].p.name || '—') + ': ' + kbText(entries[kbi]) + '. Point ' + (kbi + 1) + ' of ' + nKb + '.';
    const rings = entries.map((e, k) => {
        const r = R0 - per * k - th / 2;
        const fr = max > 0 ? Math.max(0, Math.min(1, e.p.value / max)) : 0;
        const pct = Math.round(fr * 100);
        const dim = ctx.hover.value && ctx.hover.value !== e.key ? 'true' : false;
        const tip = (ev: MouseEvent): void =>
            ctx.showTip(ev, e.p.name || '—', [{ name: '', value: ctx.fmt(e.p.value) + ' (' + pct + '%)', color: e.p.color }]);
        return html`<g class="lm-chart-radial" data-dim="${dim}" data-kb="${kbi === k ? 'true' : false}">
            <circle class="lm-chart-radial-track" cx="50" cy="50" r="${String(r)}" stroke-width="${String(th)}" />
            ${fr > 0 ? html`<path class="lm-chart-radial-arc" d="${arc(Math.min(359.9, fr * 360), r)}"
                stroke-width="${String(th)}" style="${css({ stroke: e.p.color })}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(e.p, 0, e.i)}" />` : false}
        </g>`;
    });
    // a single ring is the progress-circle use case → big % in the middle
    const only = entries.length === 1 ? entries[0] : null;
    const center = only && m.labels
        ? html`<div class="lm-chart-gauge-center">
            <div class="lm-chart-gauge-value">${Math.round(Math.max(0, Math.min(1, max > 0 ? only.p.value / max : 0)) * 100) + '%'}</div>
            ${only.p.name ? html`<div class="lm-chart-gauge-name">${only.p.name}</div>` : false}
        </div>`
        : false;
    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area" tabindex="${nKb ? '0' : false}"
            role="${nKb ? 'application' : false}"
            aria-label="${nKb ? kbLabel : false}"
            onkeydown="${kbKey}"
            onblur="${() => { if (ctx.kb.value != null) ctx.kb.value = null; }}">${center}
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}</svg>
            ${kbi != null ? kbTip(entries[kbi].p.name || '—', kbText(entries[kbi]), entries[kbi].p.color) : false}
        </div>
    </div>`;
};

/* ----- polar area / rose (equal-angle wedges, radius ∝ value) ----- */
export const polarareaChart = (m: Model, ctx: RenderCtx): View => {
    const pts = m.series[0] ? m.series[0].points : [];
    const entries = pts.map((p, i) => ({ p, i, key: p.name || '#' + i }))
        .filter((e) => !ctx.isHidden(e.key) && !e.p.gap && e.p.value > 0);
    const n = entries.length || 1;
    const RMAX = 42;
    let peak = 0;
    for (const e of entries) peak = Math.max(peak, e.p.value);
    const top = niceScale(0, peak).hi || 1;
    const wedgeR = (start: number, end: number, r: number): string => {
        const [x1, y1] = polar(end, r);
        const [x2, y2] = polar(start, r);
        const large = end - start <= 180 ? 0 : 1;
        return `M 50 50 L ${f(x1)} ${f(y1)} A ${f(r)} ${f(r)} 0 ${large} 0 ${f(x2)} ${f(y2)} Z`;
    };
    const rings = [1, 2, 3, 4].map((k) =>
        html`<circle class="lm-chart-radar-ring" cx="50" cy="50" r="${String((RMAX * k) / 4)}" />`);
    // keyboard: arrows roam the wedges, Enter/Space activates (cartesian model)
    const nKb = entries.length;
    const kbi = kbIndex(ctx.kb.value, nKb);
    const kbKey = kbKeydown(ctx.kb, nKb, (i) => ctx.fire(entries[i].p, 0, entries[i].i));
    const kbLabel = kbi == null
        ? (nKb ? 'Polar area chart, ' + nKb + ' slices. Use arrow keys to explore.' : '')
        : (entries[kbi].p.name || '—') + ': ' + ctx.fmt(entries[kbi].p.value) + '. Slice ' + (kbi + 1) + ' of ' + nKb + '.';
    const slices = entries.map((e, k) => {
        const r = Math.max(0, Math.min(1, e.p.value / top)) * RMAX;
        const dim = ctx.hover.value && ctx.hover.value !== e.key ? 'true' : false;
        const kb = kbi === k ? 'true' : false;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, e.p.name || '—', [{ name: '', value: ctx.fmt(e.p.value), color: e.p.color }]);
        // one entry = a full turn, which a single arc can't express → circle
        const shape = n === 1
            ? html`<circle class="lm-chart-slice" cx="50" cy="50" r="${f(r)}"
                style="${css({ fill: e.p.color })}" data-dim="${dim}" data-kb="${kb}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(e.p, 0, e.i)}" />`
            : html`<path class="lm-chart-slice" d="${wedgeR((k * 360) / n, ((k + 1) * 360) / n, r)}"
                style="${css({ fill: e.p.color })}" data-dim="${dim}" data-kb="${kb}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(e.p, 0, e.i)}" />`;
        return shape;
    });
    const labels = m.labels
        ? entries.map((e, k) => {
            const [x, y] = polar(((k + 0.5) * 360) / n, RMAX + 6);
            return html`<span class="lm-chart-radar-label" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}"
                >${e.p.name || ctx.fmt(e.p.value)}</span>`;
        })
        : [];
    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area" tabindex="${nKb ? '0' : false}"
            role="${nKb ? 'application' : false}"
            aria-label="${nKb ? kbLabel : false}"
            onkeydown="${kbKey}"
            onblur="${() => { if (ctx.kb.value != null) ctx.kb.value = null; }}">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}${slices}</svg>
            ${labels}
            ${kbi != null ? kbTip(entries[kbi].p.name || '—', ctx.fmt(entries[kbi].p.value), entries[kbi].p.color) : false}
        </div>
    </div>`;
};

/* ----- gauge (SVG arc) ----- */
export const gaugeChart = (m: Model, ctx: RenderCtx): View => {
    const value = m.series[0] && m.series[0].points[0] ? m.series[0].points[0].value : 0;
    const min = m.ymin != null ? m.ymin : 0;
    const max = m.ymax != null ? m.ymax : 100;
    const f = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
    const r = 40;
    // 270° arc: start bottom-left (225°), sweep clockwise to bottom-right (135°)
    const A0 = 225;
    const span = 270;
    const arc = (from: number, to: number): string => {
        const [x0, y0] = polar(from, r);
        const [x1, y1] = polar(to, r);
        const sweep = (to - from + 360) % 360;
        return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    const color = m.series[0] && m.series[0].color || PALETTES.lemonade[0];
    const rawBands = (m.plotbands || []).filter((b) => b && b.from != null && b.to != null);
    const hasBands = rawBands.length > 0;
    // With zones: bands form the WIDE coloured ring + a needle points at the value.
    // Without zones: a gray track + a coloured progress arc.
    const bandEls = rawBands.map((b) => {
        const bf = max > min ? Math.max(0, Math.min(1, (b.from - min) / (max - min))) : 0;
        const bt = max > min ? Math.max(0, Math.min(1, (b.to - min) / (max - min))) : 0;
        return html`<path d="${arc(A0 + bf * span, A0 + bt * span)}" fill="none"
            style="${css({ stroke: b.color || 'rgba(99,110,130,0.25)' })}" stroke-width="9" stroke-linecap="butt" />`;
    });
    const valueAngle = A0 + f * span;
    const [nx, ny] = polar(valueAngle, r - 4);
    // tick ring (speedometer look): minor marks inside the band, major
    // marks + value labels on the nice-scale ticks
    const angleOf = (v: number): number => A0 + (max > min ? (v - min) / (max - min) : 0) * span;
    const scaleTicks = niceScale(min, max).ticks.filter((t) => t >= min - 1e-9 && t <= max + 1e-9);
    const minorTicks = Array.from({ length: 41 }, (_, k) => {
        const a = A0 + (k / 40) * span;
        const [x0, y0] = polar(a, r - 8);
        const [x1, y1] = polar(a, k % 8 === 0 ? r - 4.5 : r - 6.5);
        return html`<line class="lm-chart-gauge-tickline" data-major="${k % 8 === 0 ? 'true' : false}"
            x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" />`;
    });
    const tickLabels = scaleTicks.map((t) => {
        const [x, y] = polar(angleOf(t), r + 8);
        return html`<span class="lm-chart-gauge-tick" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}">${ctx.fmt(t)}</span>`;
    });
    const svg = hasBands
        ? html`<svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">
            ${bandEls}${minorTicks}
            <line x1="50" y1="50" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" class="lm-chart-gauge-needle" />
            <circle cx="50" cy="50" r="3.5" class="lm-chart-gauge-hub" />
        </svg>`
        : html`<svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">
            <path d="${arc(A0, A0 + span)}" fill="none" class="lm-chart-gauge-track" stroke-width="9" stroke-linecap="round" />
            <path d="${arc(A0, valueAngle)}" fill="none" style="${css({ stroke: color })}" stroke-width="9" stroke-linecap="round" />
            ${minorTicks}
        </svg>`;
    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            ${svg}${m.labels ? tickLabels : false}
            <div class="lm-chart-gauge-center">
                <div class="lm-chart-gauge-value">${ctx.fmt(value)}</div>
                ${m.series[0] && m.series[0].name ? html`<div class="lm-chart-gauge-name">${m.series[0].name}</div>` : false}
            </div>
        </div>
    </div>`;
};

/* ----- funnel (SVG trapezoids) ----- */
export const funnelChart = (m: Model, ctx: RenderCtx): View => {
    // pyramid = funnel flipped (smallest at top, widening downward)
    const raw = (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap);
    const pts = m.type === 'pyramid' ? [...raw].reverse() : raw;
    const palette = pts.map((p) => p.color);
    const peak = Math.max(1, ...pts.map((p) => p.value));
    const n = pts.length || 1;
    const half = (v: number): number => (v / peak) * 46; // half-width in viewBox units
    const segs = pts.map((p, i) => {
        const yTop = (i / n) * 100;
        const yBot = ((i + 1) / n) * 100 - 1; // 1u gap
        const wTop = half(p.value);
        const wBot = half(i + 1 < pts.length ? pts[i + 1].value : p.value);
        const d = `${(50 - wTop).toFixed(2)},${yTop.toFixed(2)} ${(50 + wTop).toFixed(2)},${yTop.toFixed(2)} ` +
            `${(50 + wBot).toFixed(2)},${yBot.toFixed(2)} ${(50 - wBot).toFixed(2)},${yBot.toFixed(2)}`;
        return html`<polygon class="lm-chart-funnel-seg" points="${d}" style="${css({ fill: palette[i] })}"
            onmousemove="${(e: MouseEvent) => ctx.showTip(e, p.name || '', [{ name: '', value: ctx.fmt(p.value), color: palette[i] }])}"
            onmouseleave="${ctx.hideTip}" />`;
    });
    const labels = pts.map((p, i) => {
        // narrow segments → label outside to the right (dark), else centred (white)
        const narrow = half(p.value) < 16;
        return html`<div class="lm-chart-funnel-label" data-out="${narrow ? 'true' : false}"
            style="${css({ top: ((i + 0.5) / n) * 100 + '%', left: narrow ? (50 + half(p.value) + 2) + '%' : '50%' })}"
            >${(p.name ? p.name + ': ' : '') + ctx.fmt(p.value)}</div>`;
    });
    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-funnel">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" preserveAspectRatio="none">${segs}</svg>
            ${labels}
        </div>
    </div>`;
};


/* ----- pie (SVG) ----- */
export const pie = (m: Model, ctx: RenderCtx): View => {
    // Every series is a ring: series[0] outermost, the next ones inside it
    // (Chart.js / Excel multi-dataset doughnut). The slices are keyed by
    // CATEGORY (the first series' point names), so hiding one in the legend
    // hides it in every ring, and the slice k of every ring has the colour k.
    const first = m.series[0] ? m.series[0].points : [];
    const keyAt = (ring: NormPoint[], i: number): string =>
        (first[i] && first[i].name) || ring[i].name || '#' + i;
    const nRings = Math.max(1, m.series.length);
    const multi = nRings > 1;
    const donut = m.innerRadius > 0;
    // the radial room: from the hole (or the centre) out to R, one band per
    // ring with a hairline gap between bands; a solid pie's innermost ring
    // is a full disc
    const rHole = m.innerRadius * R;
    const gap = multi ? 0.8 : 0;
    const band = (R - rHole) / nRings;
    const q = m.borderRadius != null ? m.borderRadius : 1.5;

    interface Slice { p: NormPoint; i: number; si: number; key: string; frac: number; start: number; end: number; percent: number; rOut: number; rIn: number; }
    const rings = m.series.map((ser, si) => {
        const rOut = R - band * si;
        const rIn = Math.max(0, rOut - band + (si < nRings - 1 ? gap : 0));
        // an unnamed point (plain numbers) takes the category name of the
        // first ring, for the tooltip, the labels and the click payload
        const vis = ser.points.map((p, i) => ({
            p: !p.name && first[i] && first[i].name ? { ...p, name: first[i].name } : p,
            i, key: keyAt(ser.points, i),
        })).filter((e) => !ctx.isHidden(e.key));
        const total = vis.reduce((sum, e) => sum + Math.max(0, e.p.value), 0);
        let angle = 0;
        const slices: Slice[] = vis.map((e) => {
            const frac = total > 0 ? Math.max(0, e.p.value) / total : 0;
            const start = angle;
            const end = angle + frac * 360;
            angle = end;
            return { p: e.p, i: e.i, si, key: e.key, frac, start, end, percent: Math.round(frac * 100), rOut, rIn };
        });
        // one 100% slice cannot be one SVG arc → a full disc / annulus
        const drawn = slices.filter((sl) => sl.frac > 0);
        return { ser, si, rOut, rIn, total, drawn, single: drawn.length === 1 };
    });
    const total = rings[0] ? rings[0].total : 0;
    const anyData = rings.some((r) => r.total > 0);
    const drawn: Slice[] = rings.flatMap((r) => r.drawn);

    const dim = (key: string): string | false => (ctx.hover.value && ctx.hover.value !== key ? 'true' : false);
    // the slice border: the point's bordercolor, else the series' one, the
    // series borderwidth wide (0 = none); nothing set → the stylesheet's
    // surface-coloured 1px seam
    const borderOf = (sl: Slice): string => sl.p.bordercolor || m.series[sl.si].bordercolor;
    const sliceStyle = (sl: Slice): string => {
        const color = borderOf(sl);
        const w = m.series[sl.si].borderwidth;
        return css(color || w !== 1
            ? { fill: sl.p.color, stroke: w > 0 ? color || 'var(--lm-chart-surface)' : 'none', 'stroke-width': w > 0 ? w : undefined }
            : { fill: sl.p.color });
    };
    const tipText = (sl: { p: NormPoint; percent: number }): string =>
        sl.p.value + ' (' + sl.percent + '%)';
    // several rings: the tooltip names the ring (series) as the row
    const sliceTip = (e: MouseEvent, sl: Slice): void =>
        ctx.showTip(e, sl.p.name || '—', [{ name: multi ? m.series[sl.si].name : '', value: tipText(sl), color: sl.p.color, border: borderOf(sl) }]);

    // ---- keyboard navigation: arrows roam slices (outer ring first), Enter/Space activates ----
    // (the cartesian roving model; the focusable container sits OUTSIDE the
    // aria-hidden svg, so no focusable element lands in a hidden subtree)
    const nKb = drawn.length;
    const kbi = kbIndex(ctx.kb.value, nKb);
    const kbKey = kbKeydown(ctx.kb, nKb, (i) => ctx.fire(drawn[i].p, drawn[i].si, drawn[i].i));
    const kbLabel = kbi == null
        ? (nKb ? 'Pie chart, ' + nKb + ' slices. Use arrow keys to explore.' : '')
        : (drawn[kbi].p.name || '—') + (multi ? ' (' + m.series[drawn[kbi].si].name + ')' : '') + ': ' + tipText(drawn[kbi]) + '. Slice ' + (kbi + 1) + ' of ' + nKb + '.';

    const wedges: View[] = rings.flatMap((r) => {
        const disc = r.rIn <= 0; // the solid centre of a pie
        return r.drawn.map((sl) => {
            const k = drawn.indexOf(sl);
            const common = (d: string): View => html`<path class="lm-chart-slice" d="${d}" fill-rule="evenodd"
                data-donut="${disc ? false : 'true'}"
                style="${sliceStyle(sl)}" data-dim="${dim(sl.key)}"
                data-kb="${kbi === k ? 'true' : false}"
                onmousemove="${(e: MouseEvent) => sliceTip(e, sl)}"
                ontouchstart="${(e: MouseEvent) => sliceTip(e, sl)}"
                onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(sl.p, sl.si, sl.i)}">
                <title>${sl.p.name + ': ' + sl.p.value + ' (' + sl.percent + '%)'}</title>
            </path>`;
            if (r.single) {
                return disc
                    ? html`<circle class="lm-chart-slice" cx="50" cy="50" r="${f(r.rOut)}"
                        style="${sliceStyle(sl)}" data-dim="${dim(sl.key)}"
                        data-kb="${kbi === k ? 'true' : false}"
                        onmousemove="${(e: MouseEvent) => sliceTip(e, sl)}"
                        ontouchstart="${(e: MouseEvent) => sliceTip(e, sl)}"
                        onmouseleave="${ctx.hideTip}"
                        onclick="${() => ctx.fire(sl.p, sl.si, sl.i)}" />`
                    : common(annulus(r.rOut, r.rIn));
            }
            // ring segments: real ring paths with rounded corners — the
            // radius comes from `borderradius` (default a subtle 1.5 units,
            // Highcharts-like; crank it up for the fully-round pill look).
            // A small angular gap separates the segments.
            if (disc) return common(wedge(sl.start, sl.end, r.rOut));
            const a0 = sl.start + 0.4;
            const a1 = Math.max(a0 + 0.3, sl.end - 0.4);
            return common(roundedRing(a0, a1, r.rOut, r.rIn, q));
        });
    });

    // Labels as fixed-px HTML overlays (consistent across pie sizes, unlike
    // SVG <text> which scales with the viewBox). Highcharts-pie style:
    // EVERY labelled slice of the OUTER ring gets its NAME outside on an
    // elbow connector; big-enough slices of every ring also carry a
    // percentage CHIP at the ring's mid-radius whose colours invert against
    // the slice (dark chip on dark, white on light).
    const insideLabels: View[] = [];
    const outsideLabels: View[] = [];
    const leaders: View[] = [];
    if (m.labels) {
        for (const r of rings) {
            // chips need room: a thin ring (several of them) goes without
            const chips = r.rOut - r.rIn >= 9;
            const labelR = r.rIn > 0 ? (r.rOut + r.rIn) / 2 : r.rOut * 0.62;
            for (const sl of r.drawn) {
                if (sl.frac < 0.015) continue; // invisible sliver: no label
                const mid = (sl.start + sl.end) / 2;
                const chip = chips && sl.frac >= 0.05;
                if (chip) {
                    const [lx, ly] = polar(mid, labelR);
                    const darkSlice = textOn(sl.p.color) === '#ffffff';
                    insideLabels.push(html`<span class="lm-chart-pie-label" style="${css({
                        left: lx.toFixed(2) + '%',
                        top: ly.toFixed(2) + '%',
                        background: darkSlice ? '#1f2329' : '#ffffff',
                        color: darkSlice ? '#ffffff' : '#333333',
                    })}">${sl.percent + '%'}</span>`);
                }
                if (r.si !== 0) continue;
                const [ax, ay] = polar(mid, R - 1);   // connector start (slice edge)
                const [bx, by] = polar(mid, R + 5);   // radial elbow
                const side = bx < 50 ? -1 : 1;        // horizontal stub direction
                const ex = bx + side * 3.5;
                leaders.push(html`<polyline class="lm-chart-leader"
                    points="${ax.toFixed(2)},${ay.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)} ${ex.toFixed(2)},${by.toFixed(2)}" />`);
                outsideLabels.push(html`<span class="lm-chart-pie-olabel" data-side="${side < 0 ? 'l' : 'r'}"
                    style="${css({ left: (ex + side).toFixed(2) + '%', top: by.toFixed(2) + '%' })}"
                    >${(sl.p.name || ctx.fmt(sl.p.value)) + (chip ? '' : ' · ' + sl.percent + '%')}</span>`);
            }
        }
    }

    // Donut centre shows the total (one ring only: with several, whose?)
    const center = donut && m.labels && !multi
        ? html`<div class="lm-chart-donut-center">${ctx.fmt(total)}</div>`
        : false;

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area" tabindex="${nKb ? '0' : false}"
            role="${nKb ? 'application' : false}"
            aria-label="${nKb ? kbLabel : false}"
            onkeydown="${kbKey}"
            onblur="${() => { if (ctx.kb.value != null) ctx.kb.value = null; }}">${center}
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${
                !anyData ? false : wedges
            }${!anyData ? false : leaders}</svg>${
                !anyData ? false : insideLabels
            }${!anyData ? false : outsideLabels}
            ${kbi != null ? kbTip(drawn[kbi].p.name || '—', tipText(drawn[kbi]), drawn[kbi].p.color) : false}
        </div>
    </div>`;
};
