/**
 * <Chart /> radial renderers — the centred-SVG types: pie/donut, radar,
 * gauge, radialbar, polararea and funnel/pyramid.
 */
import { css, html, type View } from 'lemonadejs';
import { PALETTES, type Model, type NormPoint, type RenderCtx } from './model';
import { R, f, fullRing, niceScale, polar, roundedRing, textOn, wedge } from './helpers';

/* ----- radar / spider (SVG polar) ----- */
export const radarChart = (m: Model, ctx: RenderCtx): View => {
    const RR = 38; // radar radius within the 0..100 viewBox
    const cats = m.categories.length || (m.series[0] ? m.series[0].points.length : 0);
    const vis = m.series.filter((s) => !ctx.isHidden(s.name));
    let max = 0;
    for (const s of vis) for (const p of s.points) if (!p.gap) max = Math.max(max, p.value);
    const top = niceScale(0, max).hi || 1;
    const ang = (i: number): number => (i * 360) / (cats || 1); // 0 at top, clockwise
    const at = (i: number, r: number): [number, number] => polar(ang(i), r);

    // concentric grid rings + spokes
    const rings = [1, 2, 3, 4].map((k) => {
        const pts = Array.from({ length: cats }, (_, i) => at(i, (RR * k) / 4).map((c) => c.toFixed(2)).join(',')).join(' ');
        return html`<polygon class="lm-chart-radar-ring" points="${pts}" />`;
    });
    const spokes = Array.from({ length: cats }, (_, i) => {
        const [x, y] = at(i, RR);
        return html`<line class="lm-chart-radar-spoke" x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" />`;
    });
    // one polygon per series + a vertex dot per point (hover → category + value)
    const shapes: View[] = [];
    const dots: View[] = [];
    vis.forEach((s) => {
        const dim = ctx.hover.value && ctx.hover.value !== s.name ? 'true' : false;
        const verts = Array.from({ length: cats }, (_, i) => {
            const v = s.points[i] && !s.points[i].gap ? s.points[i].value : 0;
            return { xy: at(i, (v / top) * RR), v, i };
        });
        shapes.push(html`<polygon class="lm-chart-radar-area"
            points="${verts.map((e) => e.xy.map((c) => c.toFixed(2)).join(',')).join(' ')}"
            style="${css({ fill: s.color, stroke: s.color })}" data-dim="${dim}" />`);
        for (const e of verts) {
            const cat = m.categories[e.i] != null ? m.categories[e.i] : '';
            dots.push(html`<circle class="lm-chart-radar-dot" cx="${e.xy[0].toFixed(2)}" cy="${e.xy[1].toFixed(2)}" r="1.6"
                style="${css({ fill: s.color })}" data-dim="${dim}"
                onmousemove="${(ev: MouseEvent) => ctx.showTip(ev, s.name, [{ name: cat, value: ctx.fmt(e.v), color: s.color }])}"
                onmouseleave="${ctx.hideTip}" />`);
        }
    });
    // category labels (HTML overlay, fixed px)
    const labels = Array.from({ length: cats }, (_, i) => {
        const [x, y] = at(i, RR + 8);
        return html`<span class="lm-chart-radar-label" style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}"
            >${m.categories[i] != null ? m.categories[i] : ''}</span>`;
    });
    // value tick labels up the 12-o'clock spoke (Highcharts yAxis labels)
    const tickLabels = m.labels
        ? [1, 2, 3, 4].map((k) => html`<span class="lm-chart-radar-tickval"
            style="${css({ left: '50.5%', top: (50 - (RR * k) / 4).toFixed(2) + '%' })}">${ctx.fmt((top * k) / 4)}</span>`)
        : [];

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}${spokes}${shapes}${dots}</svg>
            ${labels}${tickLabels}
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
        const catLabels: View[] = [];
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
                    onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                    onclick="${() => ctx.fire(p, m.series.indexOf(s), i)}" />`);
            }
            catLabels.push(html`<span class="lm-chart-radial-cat"
                style="${css({ left: '50%', top: (50 - r) + '%' })}">${cat}</span>`);
        }
        const tickLabels = m.labels
            ? niceScale(0, peak).ticks.filter((t) => t >= 0 && t < hi - 1e-9).map((t) => {
                const [x, y] = polar((t / hi) * 360, R0 + 5);
                return html`<span class="lm-chart-radial-tick"
                    style="${css({ left: x.toFixed(2) + '%', top: y.toFixed(2) + '%' })}">${ctx.fmt(t)}</span>`;
            })
            : [];
        return html`<div class="lm-chart-pie-core">
            <div class="lm-chart-pie-area">
                <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${segs}</svg>
                ${catLabels}${tickLabels}
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
    const rings = entries.map((e, k) => {
        const r = R0 - per * k - th / 2;
        const fr = max > 0 ? Math.max(0, Math.min(1, e.p.value / max)) : 0;
        const pct = Math.round(fr * 100);
        const dim = ctx.hover.value && ctx.hover.value !== e.key ? 'true' : false;
        const tip = (ev: MouseEvent): void =>
            ctx.showTip(ev, e.p.name || '—', [{ name: '', value: ctx.fmt(e.p.value) + ' (' + pct + '%)', color: e.p.color }]);
        return html`<g class="lm-chart-radial" data-dim="${dim}">
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
        <div class="lm-chart-pie-area">${center}
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}</svg>
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
    const slices = entries.map((e, k) => {
        const r = Math.max(0, Math.min(1, e.p.value / top)) * RMAX;
        const dim = ctx.hover.value && ctx.hover.value !== e.key ? 'true' : false;
        const tip = (ev: MouseEvent): void => ctx.showTip(ev, e.p.name || '—', [{ name: '', value: ctx.fmt(e.p.value), color: e.p.color }]);
        // one entry = a full turn, which a single arc can't express → circle
        const shape = n === 1
            ? html`<circle class="lm-chart-slice" cx="50" cy="50" r="${f(r)}"
                style="${css({ fill: e.p.color })}" data-dim="${dim}"
                onmousemove="${tip}" ontouchstart="${tip}" onmouseleave="${ctx.hideTip}"
                onclick="${() => ctx.fire(e.p, 0, e.i)}" />`
            : html`<path class="lm-chart-slice" d="${wedgeR((k * 360) / n, ((k + 1) * 360) / n, r)}"
                style="${css({ fill: e.p.color })}" data-dim="${dim}"
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
        <div class="lm-chart-pie-area">
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${rings}${slices}</svg>
            ${labels}
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
    const points = m.series[0] ? m.series[0].points : [];
    const pkey = (p: NormPoint, i: number): string => p.name || '#' + i;
    // Hidden slices drop out and the pie renormalises over what's left
    const vis = points.map((p, i) => ({ p, i, key: pkey(p, i) }))
        .filter((e) => !ctx.isHidden(e.key));
    const total = vis.reduce((s, e) => s + Math.max(0, e.p.value), 0);

    // One full-circle slice can't be expressed as a single arc → draw a circle
    const single = vis.filter((e) => e.p.value > 0).length === 1;

    // Donut hole (0 = solid pie); labels sit at the slice's mid-radius
    const rInner = m.innerRadius * R;
    const labelR = m.innerRadius > 0 ? (R + rInner) / 2 : R * 0.62;

    let angle = 0;
    const slices = vis.map((e) => {
        const frac = total > 0 ? Math.max(0, e.p.value) / total : 0;
        const start = angle;
        const end = angle + frac * 360;
        angle = end;
        const [lx, ly] = polar((start + end) / 2, labelR); // label anchor at mid-radius
        return { p: e.p, i: e.i, key: e.key, frac, start, end, lx, ly, percent: Math.round(frac * 100) };
    });

    // A single 100% slice cannot be one SVG arc → draw a full circle instead
    const drawn = slices.filter((s) => s.frac > 0);
    const dim = (key: string): string | false => (ctx.hover.value && ctx.hover.value !== key ? 'true' : false);
    const tipText = (s: { p: NormPoint; percent: number }): string =>
        s.p.value + ' (' + s.percent + '%)';
    const sliceTip = (e: MouseEvent, s: { p: NormPoint; percent: number }): void =>
        ctx.showTip(e, s.p.name || '—', [{ name: '', value: tipText(s), color: s.p.color }]);
    const donut = m.innerRadius > 0;
    const wedges: View[] = single
        ? [donut
            ? html`<path class="lm-chart-slice" d="${fullRing(rInner)}" fill-rule="evenodd"
                style="${css({ fill: drawn[0].p.color })}" data-dim="${dim(drawn[0].key)}"
                onmousemove="${(e: MouseEvent) => sliceTip(e, drawn[0])}"
            ontouchstart="${(e: MouseEvent) => sliceTip(e, drawn[0])}"
                onmouseleave="${ctx.hideTip}" />`
            : html`<circle class="lm-chart-slice" cx="50" cy="50" r="${String(R)}"
                style="${css({ fill: drawn[0].p.color })}" data-dim="${dim(drawn[0].key)}"
                onmousemove="${(e: MouseEvent) => sliceTip(e, drawn[0])}"
            ontouchstart="${(e: MouseEvent) => sliceTip(e, drawn[0])}"
                onmouseleave="${ctx.hideTip}" />`]
        : drawn.map((s) => {
            // donut segments: real ring paths with rounded corners — the
            // radius comes from `borderradius` (default a subtle 1.5 units,
            // Highcharts-like; crank it up for the fully-round pill look).
            // A small angular gap separates the segments.
            const q = m.borderRadius != null ? m.borderRadius : 1.5;
            const a0 = s.start + (donut ? 0.4 : 0);
            const a1 = donut ? Math.max(a0 + 0.3, s.end - 0.4) : s.end;
            return html`<path
            d="${donut ? roundedRing(a0, a1, R, rInner, q) : wedge(s.start, s.end)}"
            class="lm-chart-slice"
            data-donut="${donut ? 'true' : false}"
            style="${css({ fill: s.p.color })}"
            data-dim="${dim(s.key)}"
            onmousemove="${(e: MouseEvent) => sliceTip(e, s)}"
            ontouchstart="${(e: MouseEvent) => sliceTip(e, s)}"
            onmouseleave="${ctx.hideTip}"
            onclick="${() => ctx.fire(s.p, 0, s.i)}">
            <title>${s.p.name + ': ' + s.p.value + ' (' + s.percent + '%)'}</title>
        </path>`;
        });

    // Labels as fixed-px HTML overlays (consistent across pie sizes, unlike
    // SVG <text> which scales with the viewBox). Highcharts-pie style:
    // EVERY labelled slice gets its NAME outside on an elbow connector;
    // big-enough slices also carry a percentage CHIP at mid-radius whose
    // colours invert against the slice (dark chip on dark, white on light).
    const insideLabels: View[] = [];
    const outsideLabels: View[] = [];
    const leaders: View[] = [];
    if (m.labels) {
        for (const s of drawn) {
            if (s.frac < 0.015) continue; // invisible sliver: no label
            const mid = (s.start + s.end) / 2;
            const chip = s.frac >= 0.05;
            if (chip) {
                const darkSlice = textOn(s.p.color) === '#ffffff';
                insideLabels.push(html`<span class="lm-chart-pie-label" style="${css({
                    left: s.lx.toFixed(2) + '%',
                    top: s.ly.toFixed(2) + '%',
                    background: darkSlice ? '#1f2329' : '#ffffff',
                    color: darkSlice ? '#ffffff' : '#333333',
                })}">${s.percent + '%'}</span>`);
            }
            const [ax, ay] = polar(mid, R - 1);   // connector start (slice edge)
            const [bx, by] = polar(mid, R + 5);   // radial elbow
            const side = bx < 50 ? -1 : 1;        // horizontal stub direction
            const ex = bx + side * 3.5;
            leaders.push(html`<polyline class="lm-chart-leader"
                points="${ax.toFixed(2)},${ay.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)} ${ex.toFixed(2)},${by.toFixed(2)}" />`);
            outsideLabels.push(html`<span class="lm-chart-pie-olabel" data-side="${side < 0 ? 'l' : 'r'}"
                style="${css({ left: (ex + side).toFixed(2) + '%', top: by.toFixed(2) + '%' })}"
                >${(s.p.name || ctx.fmt(s.p.value)) + (chip ? '' : ' · ' + s.percent + '%')}</span>`);
        }
    }

    // Donut centre shows the total (only when there is a hole to fill)
    const center = donut && m.labels
        ? html`<div class="lm-chart-donut-center">${ctx.fmt(total)}</div>`
        : false;

    return html`<div class="lm-chart-pie-core">
        <div class="lm-chart-pie-area">${center}
            <svg class="lm-chart-pie" viewBox="0 0 100 100" aria-hidden="true">${
                total <= 0 ? false : wedges
            }${total <= 0 ? false : leaders}</svg>${
                total <= 0 ? false : insideLabels
            }${total <= 0 ? false : outsideLabels}
        </div>
    </div>`;
};
