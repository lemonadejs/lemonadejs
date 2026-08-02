/**
 * <Chart /> data model — the public data shapes, the palettes, and the
 * normalize() step that collapses the loose props into one strict Model
 * (including histogram binning). Pure data: no DOM, no rendering.
 */
import type { State } from 'lemonadejs';
import { compact } from './helpers';

/* ------------------------------------------------------------------ *
 *  Public data shapes (pin the .d.ts for the `series` prop)           *
 * ------------------------------------------------------------------ */

/** One data point. A bare number is shorthand for `{ value }`. */
export interface ChartPoint {
    /** Slice/label name. Falls back to the matching `categories` entry. */
    name?: string;
    /** The magnitude / y-value. (`y` is accepted as an alias.) */
    value?: number;
    /** Highcharts-style alias for `value`. */
    y?: number;
    /** x-value for scatter/bubble (numeric x-axis). */
    x?: number;
    /** bubble size for bubble charts. */
    z?: number;
    /** Per-point colour override (mainly useful for pie slices). */
    color?: string;
    /** Link source node (sankey / chord). */
    from?: string;
    /** Link target node (sankey / chord). */
    to?: string;
    /** Parent node name (sunburst / icicle); unset = a root. */
    parent?: string;
}

/** One series: a named, optionally-coloured row of points. */
export interface ChartSeries {
    /** Legend label. */
    name?: string;
    /** Points: a number, `[x,y]`/`[x,y,z]` tuple, `{value|x|y|z}`, or `null` (a gap). */
    data: Array<number | number[] | ChartPoint | null>;
    /** Series colour; defaults to the palette slot. */
    color?: string;
    /** Per-series render type for combo charts (overrides the chart `type`).
     *  `'scatter'` (points only) and `'line'` combine in a scatter base chart
     *  for a line+scatter overlay on the shared numeric x/y axes. */
    type?: 'bar' | 'line' | 'area' | 'scatter';
    /** Which y-axis this series uses. Default 'left'. */
    axis?: 'left' | 'right' | 'x';
    /** Fill the area under a line series. */
    area?: boolean;
    /** Draw the line as a smooth spline. */
    smooth?: boolean;
    /** Draw the line as steps (stairs): `true`/`'before'` jumps at each point, `'mid'` at the midpoint. */
    step?: boolean | 'before' | 'mid';
    /** Dash the line. */
    dashed?: boolean;
    /** Marker shape for line/scatter points. */
    marker?: 'circle' | 'square' | 'triangle' | 'diamond';
}

/** The shape `normalize()` collapses the loose props into. */
export interface ChartOptions {
    type?: string;
    series?: ChartSeries[];
    categories?: string[];
    title?: string;
    subtitle?: string;
    xtype?: string;
    xtitle?: string;
    ytitle?: string;
    y2title?: string;
    gridlines?: boolean;
    valueprefix?: string;
    valuesuffix?: string;
    labelrotation?: number;
    legend?: boolean;
    legendposition?: string;
    labels?: boolean;
    horizontal?: boolean;
    mirror?: boolean;
    markers?: boolean;
    smooth?: boolean;
    step?: boolean | 'before' | 'mid';
    area?: boolean;
    tooltip?: boolean;
    sharedtooltip?: boolean;
    stackmode?: string;
    innerRadius?: number;
    borderradius?: number | null;
    ymin?: number;
    ymax?: number;
    ylog?: boolean;
    bins?: number;
    plotlines?: PlotLine[];
    plotbands?: PlotBand[];
    annotations?: Annotation[];
    palette?: string;
    colors?: string[];
    height?: number;
    /** pictogram: glyph preset key ('person'|'square'|'circle'|'capsule'|'star'|'heart') or a raw SVG path `d`-string. */
    icon?: string;
    /** pictogram: glyphs across one row. */
    columns?: number;
    /** pictogram: total glyphs per data row (0 = one row of `columns`; e.g. 100 + columns 10 = a waffle grid). */
    iconcount?: number;
    /** pictogram: the value that fills every glyph (default 100 → values read as percentages). */
    total?: number;
}

/** A reference line drawn across the plot at a value on the y-axis. */
export interface PlotLine {
    value: number;
    color?: string;
    width?: number;
    dashed?: boolean;
    label?: string;
    axis?: 'left' | 'right' | 'x';
}

/** A shaded reference band between two y-axis values. */
export interface PlotBand {
    from: number;
    to: number;
    color?: string;
    label?: string;
    axis?: 'left' | 'right' | 'x';
}

/** A text callout pinned to a data point at (x, y). x = category index or x-value. */
export interface Annotation {
    x: number;
    y: number;
    text: string;
    color?: string;
}

/* ------------------------------------------------------------------ *
 *  Internals                                                          *
 * ------------------------------------------------------------------ */

/**
 * Built-in palettes. `palette="name"` selects one; a custom `colors`
 * array overrides whichever is selected.
 *   - lemonade   : the catalog default — mirrors the shared --lm-series-*
 *                  template tokens so charts match every other data block
 *                  (gantt, kanban, schedule...) out of the box
 *   - classic    : calm, balanced BI palette (the classic 10-color scheme)
 *   - category10 : D3 schemeCategory10 — the familiar web palette
 *   - material   : Material Design 500s — bright, high-saturation
 *   - focus      : hero + neutrals (the Highcharts pie-demo scheme): the
 *                  first slot is the series blue, the rest a cool-gray
 *                  ramp — emphasises the leading slice/series. Best with
 *                  data sorted descending.
 *
 * NOTE: `lemonade` is kept in sync (by value) with --lm-series-* in
 * components/style.css. Live re-theming of series colours from the CSS
 * variables (so a theme class / dark mode recolours charts too) is a
 * planned follow-up; it needs the colour-math paths (heatmap lerp, pie
 * label luminance) to resolve a concrete hex, so it can't just emit var().
 */
export const PALETTES: Record<string, string[]> = {
    lemonade: ['#4b81de', '#6342a1', '#c0554a', '#bd7f40', '#578163',
        '#45889c', '#b05a7e', '#75808f', '#a3a442', '#8b6a52'],
    classic: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
        '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'],
    category10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
    material: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
        '#00bcd4', '#ffc107', '#795548', '#607d8b', '#e91e63'],
    focus: ['#4b81de', '#a5afb6', '#d6dbde', '#e8eef1', '#f5fcff'],
};

/** Resolve a palette: explicit colours win, else a named built-in, else lemonade. */
const resolvePalette = (colors: string[] | undefined, name: string | undefined): string[] =>
    Array.isArray(colors) && colors.length ? colors : PALETTES[name || ''] || PALETTES.lemonade;

type RawPoint = number | number[] | ChartPoint;
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** A point's y-value, accepting `number`, `[x,y]`, `{ value }`, or `{ y }`. */
const pointValue = (p: RawPoint): number => {
    if (typeof p === 'number') return num(p);
    if (Array.isArray(p)) return num(p[1]);
    return num(p && p.value != null ? p.value : p && p.y != null ? p.y : 0);
};

/** A point's x-value (scatter/bubble): `[x,..]`, `{ x }`, else the index `i`. */
const pointX = (p: RawPoint, i: number): number => {
    if (Array.isArray(p)) return num(p[0]);
    if (typeof p === 'object' && p && p.x != null) return num(p.x);
    return i;
};

/** A point's bubble size: `[x,y,z]`, `{ z }`, else 0. */
const pointZ = (p: RawPoint): number => {
    if (Array.isArray(p)) return num(p[2]);
    if (typeof p === 'object' && p && p.z != null) return num(p.z);
    return 0;
};

/** A point's display name: explicit name → matching category → ''. */
const pointName = (p: RawPoint, i: number, categories: string[]): string => {
    if (typeof p === 'object' && !Array.isArray(p) && p && p.name != null) return String(p.name);
    return categories[i] != null ? String(categories[i]) : '';
};

export interface NormPoint {
    name: string; value: number; x: number; z: number; extra: number[]; color: string; gap: boolean;
    /** link endpoints (sankey/chord) and tree parent (sunburst/icicle) */
    from: string; to: string; parent: string;
}
export interface NormSeries {
    name: string;
    color: string;
    points: NormPoint[];
    type: 'bar' | 'line' | 'area' | 'scatter';
    axis: 'left' | 'right';
    smooth: boolean;
    step: '' | 'before' | 'mid';
    dashed: boolean;
    marker: string;
}
export interface Model {
    type: 'bar' | 'stackedbar' | 'line' | 'stackedarea' | 'streamgraph' | 'scatter' | 'bubble'
        | 'radar' | 'gauge' | 'funnel' | 'pyramid' | 'waterfall' | 'bullet'
        | 'heatmap' | 'candlestick' | 'ohlc' | 'boxplot' | 'arearange' | 'columnrange' | 'dumbbell'
        | 'lollipop' | 'histogram' | 'radialbar' | 'polararea' | 'treemap' | 'pie'
        | 'sankey' | 'chord' | 'arcdiagram' | 'sunburst' | 'icicle' | 'packedbubble' | 'pareto' | 'wordcloud' | 'pictogram';
    title: string;
    subtitle: string;
    xtype: '' | 'datetime' | 'linear';
    xtitle: string;
    ytitle: string;
    y2title: string;
    gridlines: boolean;
    valueprefix: string;
    valuesuffix: string;
    labelrotation: number | null;
    legend: boolean;
    legendposition: 'top' | 'bottom' | 'left' | 'right' | '';
    labels: boolean;
    horizontal: boolean;
    /** population pyramid: series[0] grows leftward (horizontal only) */
    mirror: boolean;
    markers: boolean;
    tooltip: boolean;
    sharedtooltip: boolean;
    stackmode: 'normal' | 'percent';
    innerRadius: number;
    /** corner rounding: donut segment corners (viewBox units) / heatmap
     *  cell radius (px); null = the per-type subtle default */
    borderRadius: number | null;
    ymin: number | null;
    ymax: number | null;
    ylog: boolean;
    plotlines: PlotLine[];
    plotbands: PlotBand[];
    annotations: Annotation[];
    height: number;
    categories: string[];
    series: NormSeries[];
    /** the resolved colour palette (node colouring in sankey/chord) */
    palette: string[];
    /** pictogram: glyph, grid width, glyphs-per-row, and the full-value scale */
    icon: string;
    columns: number;
    iconcount: number;
    total: number;
    /** waffle mode: one palette-partitioned grid per series (type="waffle") */
    waffle: boolean;
}

/** Collapse the loose props into a strict internal model. */
export const normalize = (def: ChartOptions): Model => {
    const palette = resolvePalette(def.colors, def.palette);
    let categories = Array.isArray(def.categories) ? def.categories.map(String) : [];
    let rawSeries = Array.isArray(def.series) ? def.series : [];

    // `waffle` = a pictogram of squares in a filled grid; capture it BEFORE
    // aliasing so it can pick the square glyph + 100-cell grid defaults below
    const isWaffle = def.type === 'waffle';
    const alias: Record<string, string> = { lines: 'line', rose: 'polararea', dependencywheel: 'chord', tagcloud: 'wordcloud', pictorial: 'pictogram', isotype: 'pictogram', waffle: 'pictogram' };
    const rawType = def.type != null && alias[def.type] ? alias[def.type] : def.type;
    const known = ['stackedbar', 'line', 'stackedarea', 'streamgraph', 'scatter', 'bubble',
        'radar', 'gauge', 'funnel', 'pyramid', 'waterfall', 'bullet',
        'heatmap', 'candlestick', 'ohlc', 'boxplot', 'arearange', 'columnrange', 'dumbbell',
        'lollipop', 'histogram', 'radialbar', 'polararea', 'treemap', 'pie',
        'sankey', 'chord', 'arcdiagram', 'sunburst', 'icicle', 'packedbubble', 'pareto', 'wordcloud', 'pictogram'];
    const chartType = (known.includes(rawType as string) ? rawType : 'bar') as Model['type'];

    // Histogram: the first series carries raw SAMPLES; bin them here so the
    // rest of the pipeline sees an ordinary category/count bar definition.
    if (chartType === 'histogram') {
        const raw0 = rawSeries[0] && Array.isArray(rawSeries[0].data) ? rawSeries[0].data : [];
        const samples = raw0.filter((p): p is RawPoint => p != null).map(pointValue).filter((v) => Number.isFinite(v));
        let lo = Math.min(...samples);
        let hi = Math.max(...samples);
        if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
        if (hi <= lo) hi = lo + 1;
        // bin count: explicit `bins` prop, else Sturges' rule
        const k = Math.max(1, Math.round(Number(def.bins) > 0 ? Number(def.bins) : Math.ceil(Math.log2(samples.length || 1)) + 1));
        const w = (hi - lo) / k;
        const counts = new Array(k).fill(0);
        for (const v of samples) counts[Math.min(k - 1, Math.floor((v - lo) / w))]++;
        categories = counts.map((_, i) => compact(lo + i * w, null) + '–' + compact(lo + (i + 1) * w, null));
        rawSeries = [{ name: (rawSeries[0] && rawSeries[0].name) || 'Frequency', color: rawSeries[0] && rawSeries[0].color, data: counts }];
    }

    // Pareto: sort the first series descending and derive a cumulative-%
    // line on the right axis — the existing combo machinery draws the rest.
    if (chartType === 'pareto') {
        const src0 = rawSeries[0];
        const data0 = src0 && Array.isArray(src0.data) ? src0.data : [];
        const items = data0.map((p, i) => ({
            v: p == null ? 0 : pointValue(p),
            name: pointName(p == null ? 0 : p, i, categories) || String(i + 1),
        })).filter((e) => e.v > 0);
        items.sort((a, b) => b.v - a.v);
        const total = items.reduce((s, e) => s + e.v, 0) || 1;
        let run = 0;
        const cum = items.map((e) => { run += e.v; return Math.round((run / total) * 1000) / 10; });
        categories = items.map((e) => e.name);
        rawSeries = [
            { name: (src0 && src0.name) || 'Value', color: src0 && src0.color, type: 'bar', data: items.map((e) => e.v) },
            { name: 'Cumulative %', type: 'line', axis: 'right', color: '#3f444c', data: cum },
        ];
    }

    // Resolve each series' render type for combo charts (per-series wins)
    const resolveType = (s: ChartSeries): 'bar' | 'line' | 'area' | 'scatter' => {
        if (chartType === 'stackedarea' || chartType === 'streamgraph') return 'area';
        // scatter/bubble base: 'line' connects, everything else stays points
        if (chartType === 'scatter' || chartType === 'bubble') return s.type === 'line' ? 'line' : 'scatter';
        // 'scatter' has no meaning on a cartesian (bar/line) base → treat as a line
        const st = s.type === 'scatter' ? 'line' : s.type;
        let t: 'bar' | 'line' | 'area' = st || (chartType === 'line' ? 'line' : 'bar');
        if (t === 'line' && (s.area || (chartType === 'line' && def.area))) t = 'area';
        return t;
    };

    const series: NormSeries[] = rawSeries.map((s, si) => {
        const data = Array.isArray(s.data) ? s.data : [];
        return {
            name: s.name != null ? String(s.name) : 'Series ' + (si + 1),
            color: s.color || palette[si % palette.length],
            type: resolveType(s),
            axis: s.axis === 'right' ? 'right' : 'left',
            smooth: s.smooth === true || (s.smooth == null && def.smooth === true),
            dashed: s.dashed === true,
            step: s.step === true || s.step === 'mid' || (s.step == null && (def.step === true || def.step === 'mid')) ? (s.step === 'mid' || (s.step == null && def.step === 'mid') ? 'mid' : 'before') : '',
            // '' = not specified (scatter cycles shapes per series, HC-style)
            marker: ['circle', 'square', 'triangle', 'diamond'].includes(s.marker as string) ? (s.marker as string) : '',
            points: data.map((p, pi) => p == null
                ? { name: categories[pi] != null ? categories[pi] : '', value: 0, x: pi, z: 0, extra: [], color: palette[pi % palette.length], gap: true, from: '', to: '', parent: '' }
                : {
                    name: pointName(p, pi, categories),
                    value: pointValue(p),
                    x: pointX(p, pi),
                    z: pointZ(p),
                    // multi-value points (OHLC / box / range) keep their raw numbers
                    extra: Array.isArray(p) ? p.map(num) : [],
                    // Pie reads per-point colour first, then walks the palette
                    color: (typeof p === 'object' && !Array.isArray(p) && p && p.color) || palette[pi % palette.length],
                    gap: false,
                    // link/tree fields (sankey/chord/sunburst/icicle)
                    from: typeof p === 'object' && !Array.isArray(p) && p.from != null ? String(p.from) : '',
                    to: typeof p === 'object' && !Array.isArray(p) && p.to != null ? String(p.to) : '',
                    parent: typeof p === 'object' && !Array.isArray(p) && p.parent != null ? String(p.parent) : '',
                }),
        };
    });

    const pos = def.legendposition;
    return {
        type: chartType,
        title: def.title != null ? String(def.title) : '',
        subtitle: def.subtitle != null ? String(def.subtitle) : '',
        xtype: def.xtype === 'datetime' || def.xtype === 'linear' ? def.xtype : '',
        xtitle: def.xtitle != null ? String(def.xtitle) : '',
        ytitle: def.ytitle != null ? String(def.ytitle) : '',
        y2title: def.y2title != null ? String(def.y2title) : '',
        gridlines: def.gridlines !== false,
        valueprefix: def.valueprefix != null ? String(def.valueprefix) : '',
        valuesuffix: def.valuesuffix != null ? String(def.valuesuffix) : '',
        labelrotation: def.labelrotation != null && Number.isFinite(Number(def.labelrotation))
            ? Number(def.labelrotation) : null,
        legend: def.legend !== false,
        legendposition: pos === 'top' || pos === 'bottom' || pos === 'left' || pos === 'right' ? pos : '',
        labels: def.labels !== false,
        horizontal: def.horizontal === true,
        mirror: def.mirror === true,
        markers: def.markers !== false,
        tooltip: def.tooltip !== false,
        sharedtooltip: def.sharedtooltip !== false,
        stackmode: def.stackmode === 'percent' ? 'percent' : 'normal',
        // donut hole: a 0–0.9 fraction, or a 1–90 value read as PERCENT
        // (innerradius="60" would otherwise clamp to 0.9 silently)
        innerRadius: Math.max(0, Math.min(0.9, (Number(def.innerRadius) || 0) > 1
            ? (Number(def.innerRadius) || 0) / 100 : Number(def.innerRadius) || 0)),
        borderRadius: def.borderradius != null && Number.isFinite(Number(def.borderradius))
            ? Math.max(0, Number(def.borderradius)) : null,
        ymin: def.ymin != null && Number.isFinite(Number(def.ymin)) ? Number(def.ymin) : null,
        ymax: def.ymax != null && Number.isFinite(Number(def.ymax)) ? Number(def.ymax) : null,
        ylog: def.ylog === true,
        plotlines: Array.isArray(def.plotlines) ? def.plotlines : [],
        plotbands: Array.isArray(def.plotbands) ? def.plotbands : [],
        annotations: Array.isArray(def.annotations) ? def.annotations : [],
        height: Number(def.height) > 0 ? Number(def.height) : 320,
        categories,
        series,
        palette,
        // pictogram config (ignored by every other type)
        icon: def.icon != null && String(def.icon) !== '' ? String(def.icon) : (isWaffle ? 'square' : 'person'),
        columns: Number(def.columns) > 0 ? Math.round(Number(def.columns)) : 10,
        iconcount: Number(def.iconcount) > 0 ? Math.round(Number(def.iconcount)) : (isWaffle ? 100 : 0),
        total: Number(def.total) > 0 ? Number(def.total) : 100,
        waffle: isWaffle,
    };
};
/* ------------------------------------------------------------------ *
 *  The render context (index.ts → renderer files)                     *
 * ------------------------------------------------------------------ */

/** One row of the shared tooltip pill. */
export interface TipRow { name: string; value: string; color: string; }

/**
 * Everything a renderer needs from the component scope. The renderers in
 * cartesian.ts / radial.ts / extras.ts are plain `(m, ctx) => View`
 * functions; index.ts builds ONE ctx per component instance from its
 * reactive state, so reading `ctx.hover.value` inside a renderer
 * subscribes the same binding it did when the renderers were closures.
 * Members must be STABLE references (state objects + functions).
 */
export interface RenderCtx {
    /** format a value (valueformat/compact/decimals + prefix/suffix) */
    fmt: (n: number) => string;
    showTip: (e: MouseEvent, title: string, rows: TipRow[]) => void;
    hideTip: () => void;
    /** is a legend key (series name / point key) toggled off? */
    isHidden: (key: string) => boolean;
    /** point activation: drilldown + onpointclick */
    fire: (point: NormPoint, seriesIndex: number, pointIndex: number) => void;
    /** legend-hover highlighted key */
    hover: State<string | null>;
    /** shared-tooltip highlighted column */
    hoverCol: State<number | null>;
    /** keyboard-nav active column */
    kb: State<number | null>;
    /** zoom/navigator category-index window */
    zoomRange: State<[number, number] | null>;
    /** live zoom drag-select fractions */
    zsel: State<{ a: number; b: number } | null>;
    /** navigator window drag state */
    navDrag: State<{ mode: 'l' | 'r' | 'm'; a: number; b: number; f0: number } | null>;
    /** heatmap row/col cross-highlight */
    heatHover: State<{ r: number; c: number } | null>;
    /** arc diagram: plot W/H measured once at attach (null until known) —
     *  lets arcs be true pixel semicircles like Highcharts; NOT a resize
     *  observer, resizing keeps the usual stretched-svg behavior */
    arcAspect: State<number | null>;
    /** live prop reads (called at render time so bindings subscribe) */
    zoom: () => boolean;
    navigator: () => boolean;
    xformat: () => ((x: number) => unknown) | undefined;
}
