/**
 * <Chart /> data model — the public data shapes, the palettes, and the
 * normalize() step that collapses the loose props into one strict Model
 * (including histogram binning). Pure data: no DOM, no rendering.
 */
import type { State } from 'lemonadejs';
import { compact } from './helpers';
import { quartiles } from './trend';

/* ------------------------------------------------------------------ *
 *  Public data shapes (pin the .d.ts for the `series` prop)           *
 * ------------------------------------------------------------------ */

/** One data point. A bare number is shorthand for `{ value }`. */
export interface ChartPoint {
    /** Slice/label name. Falls back to the matching `categories` entry. */
    name?: string;
    /** The magnitude / y-value. (`y` is accepted as an alias.) */
    value?: number;
    /** Alias for `value`. */
    y?: number;
    /** x-value for scatter/bubble (numeric x-axis). */
    x?: number;
    /** bubble size for bubble charts. */
    z?: number;
    /** Per-point colour override (mainly useful for pie slices). */
    color?: string;
    /** Per-point outline colour (pie slices); the series `bordercolor` is the fallback. */
    bordercolor?: string;
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
    /** The outline colour; `color` stays the fill. Bars: their outline
     *  (pair with `color: 'transparent'` for hollow bars). Lines/areas: the
     *  line and the marker ring, the markers keep `color` as fill (Chart.js
     *  borderColor/backgroundColor). Scatter: the point outline. */
    bordercolor?: string;
    /** Outline width in px (default 1): the bar outline, the marker ring,
     *  the scatter point stroke, the pie slice border (0 = no border). The
     *  line width is `width`. */
    borderwidth?: number;
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
    /** Dash the line: `true` is dashed; a style picks the pattern. */
    dashed?: boolean | 'dashed' | 'dotted' | 'dashdot';
    /** Opacity (0–1) of this series' fill: an area, a stacked area, a
     *  filled radar, an arearange band. Wins over the chart `fillopacity`. */
    fillopacity?: number;
    /** Marker shape for line/scatter points. Filled: circle, square,
     *  triangle, diamond. Stroked (no fill; drawn in `bordercolor`, else
     *  `color`, `borderwidth` px wide, at least 1.5): x, plus, dash, star (the
     *  Excel asterisk: plus + x). */
    marker?: 'circle' | 'square' | 'triangle' | 'diamond' | 'x' | 'plus' | 'dash' | 'star';
    /** Line stroke width in px (default 2). */
    width?: number;
    /** Marker radius in px (default 4.5); 0 hides the markers. */
    markersize?: number;
    /** Show markers on this series; overrides the chart `markers` prop. */
    markers?: boolean;
    /** Connect the line across gaps (`null` points) instead of breaking it. */
    connectgaps?: boolean;
    /** A least-squares trendline through the series: a type, or the options. */
    trendline?: Trendline['type'] | Trendline;
}

/** A trendline fitted to a series, the Excel set. */
export interface Trendline {
    type: 'linear' | 'exponential' | 'logarithmic' | 'power' | 'polynomial' | 'movingAverage';
    /** polynomial: the degree (2–6, default 2). */
    order?: number;
    /** movingAverage: the window (default 2). */
    period?: number;
    /** Defaults to the series colour. */
    color?: string;
    /** Default `true`: a dashed line tells the fit from the data. */
    dashed?: boolean;
    /** Stroke width in px (default 1.5). */
    width?: number;
}

/** The shape `normalize()` collapses the loose props into. */
export interface ChartOptions {
    type?: string;
    series?: ChartSeries[];
    categories?: string[];
    title?: string | ChartText;
    titleposition?: string;
    subtitle?: string | ChartText;
    legendtitle?: string;
    xtype?: string;
    xtitle?: string;
    ytitle?: string;
    y2title?: string;
    /** physical axes: x = bottom, y = left, y2 = right */
    xaxis?: ChartAxis;
    yaxis?: ChartAxis;
    y2axis?: ChartAxis;
    /** horizontal bars: the top axis, for the series with axis: 'right' */
    x2axis?: ChartAxis;
    /** opacity (0–1) of every fill (areas, filled radar, range bands);
     *  unset = the stylesheet defaults (0.16, stacked 0.85) */
    fillopacity?: number;
    /** radar: the radial (value) axis */
    raxis?: ChartRAxis;
    gridlines?: boolean;
    valueprefix?: string;
    valuesuffix?: string;
    labelrotation?: number;
    legend?: boolean | string | ChartLegend;
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
    /** the distance between the y ticks (auto if unset) */
    ystep?: number;
    /** the y-axis grows downwards */
    yreverse?: boolean;
    /** scatter/bubble: the x-axis bounds (auto if unset) */
    xmin?: number;
    xmax?: number;
    bins?: number;
    /** histogram: a fixed bin width (wins over `bins`; at most 200 bins) */
    binwidth?: number;
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

/** The typography of one chart element. `size` is px when a number (or any
 *  CSS length as a string); unset fields keep the stylesheet default. */
export interface ChartFont {
    size?: number | string;
    color?: string;
    family?: string;
    bold?: boolean;
    italic?: boolean;
}

/** `title` / `subtitle` as an object: the text plus its font. */
export interface ChartText {
    text?: string;
    font?: ChartFont;
}

/** `legend` as an object. `show: false` hides it (as `legend: false`). */
export interface ChartLegend {
    show?: boolean;
    position?: string;
    title?: string;
    /** the legend items */
    font?: ChartFont;
    /** the legend title */
    titlefont?: ChartFont;
}

/** One PHYSICAL axis (x = bottom, y = left, y2 = right): its title and the
 *  font of its tick labels, whatever they show. With `horizontal` the
 *  categories are on y and the values on x. */
export interface ChartAxis {
    title?: string;
    titlefont?: ChartFont;
    /** the tick labels */
    font?: ChartFont;
    /** `false` hides the tick labels (and frees their gutter) */
    labels?: boolean;
    /** reverse the axis (physical): on yaxis the values grow downwards, or
     *  with `horizontal` the first category sits at the bottom (`yreverse`);
     *  on xaxis the first category sits at the right, or the values (and a
     *  continuous / scatter x) grow leftwards */
    reverse?: boolean;
    /** the gridlines this axis draws (x = vertical lines, y = horizontal) */
    grid?: ChartGrid;
}

/** The radar's radial axis: its scale (`min`/`max`, else 0 to a nice
 *  maximum; `step` sets the ring spacing, else 4 rings; `reverse` puts
 *  the maximum at the centre), the category labels around it (`labels`,
 *  `font`), the ring values (`ticks`: true always, false never, unset =
 *  with the chart `labels`; `tickfont`), and the rings (`grid`) and
 *  spokes (`spokes`) as grid styles. */
export interface ChartRAxis {
    min?: number;
    max?: number;
    step?: number;
    reverse?: boolean;
    labels?: boolean;
    font?: ChartFont;
    ticks?: boolean;
    tickfont?: ChartFont;
    grid?: ChartGrid;
    spokes?: ChartGrid;
}

/** The normalized radial axis (Model.raxis). */
export interface RAxis {
    min: number | null;
    max: number | null;
    step: number | null;
    reverse: boolean;
    labels: boolean;
    ticks: boolean | null;
}

/** Gridline style of one physical axis. On a value axis it styles the
 *  tick gridlines (`show: false` hides them, keeping the zero line); on a
 *  category axis it opts into lines between the categories, which are off
 *  by default. y2axis has no grid of its own (its ticks share y's lines). */
export interface ChartGrid {
    show?: boolean;
    color?: string;
    /** px when a number */
    width?: number | string;
    /** CSS borders have no dash-dot: 'dashdot' draws dashed */
    dash?: 'dashed' | 'dotted' | 'dashdot' | boolean;
}

/** The internal per-element font map behind the CSS variables
 *  --lm-chart-<key>-size|color|family|weight|style. The y2 and x2 keys (right/top)
 *  fall back to their y counterparts in the stylesheet. */
export const FONT_KEYS = ['title', 'subtitle', 'legend', 'legendtitle', 'xtitle', 'ytitle', 'y2title', 'x2title', 'xlabels', 'ylabels', 'y2labels', 'x2labels', 'rlabels', 'rticks'] as const;
export type ChartFontKey = typeof FONT_KEYS[number];
export type ChartFonts = Partial<Record<ChartFontKey, ChartFont>>;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const fontOf = (v: unknown): ChartFont | undefined => (isObj(v) && isObj(v.font) ? v.font as ChartFont : undefined);

/** The text of a `string | { text }` prop. */
export const textOf = (v: unknown): string =>
    v == null ? '' : isObj(v) ? (v.text != null ? String(v.text) : '') : String(v);

/** Collect the fonts the element objects carry into one map. */
export const fontsOf = (def: ChartOptions): ChartFonts => {
    const out: ChartFonts = {};
    const put = (k: ChartFontKey, f: unknown): void => { if (isObj(f)) out[k] = f as ChartFont; };
    put('title', fontOf(def.title));
    put('subtitle', fontOf(def.subtitle));
    if (isObj(def.legend)) { put('legend', def.legend.font); put('legendtitle', def.legend.titlefont); }
    const axes: Array<[unknown, ChartFontKey, ChartFontKey]> = [
        [def.xaxis, 'xtitle', 'xlabels'], [def.yaxis, 'ytitle', 'ylabels'], [def.y2axis, 'y2title', 'y2labels'], [def.x2axis, 'x2title', 'x2labels']];
    for (const [ax, t, l] of axes) if (isObj(ax)) { put(t, ax.titlefont); put(l, ax.font); }
    if (isObj(def.raxis)) { put('rlabels', def.raxis.font); put('rticks', def.raxis.tickfont); }
    return out;
};

/** Keep a font value from breaking out of its style declaration. */
const cssValue = (v: unknown): string => String(v).replace(/[;{}<>]/g, '').trim();

/** The custom properties the stylesheet reads, e.g. --lm-chart-title-size. */
export const fontVars = (fonts: ChartFonts | null | undefined): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!fonts || typeof fonts !== 'object') return out;
    for (const key of FONT_KEYS) {
        const f = fonts[key];
        if (!f || typeof f !== 'object') continue;
        const pre = '--lm-chart-' + key + '-';
        if (f.size != null && f.size !== '') {
            const n = Number(f.size);
            out[pre + 'size'] = Number.isFinite(n) ? (n > 0 ? n + 'px' : '') : cssValue(f.size);
        }
        if (f.color) out[pre + 'color'] = cssValue(f.color);
        if (f.family) out[pre + 'family'] = cssValue(f.family);
        if (f.bold != null) out[pre + 'weight'] = f.bold ? 'bold' : 'normal';
        if (f.italic != null) out[pre + 'style'] = f.italic ? 'italic' : 'normal';
    }
    return out;
};

/** Marker shapes drawn as strokes (no fill), like Excel's x / + / − / *. */
export const STROKE_MARKERS = ['x', 'plus', 'dash', 'star'];
export const isStrokeMarker = (shape: string): boolean => STROKE_MARKERS.includes(shape);
/** A stroke marker's line: the outline colour, else the series colour, and
 *  the outline width — at least 1.5px so the thin shapes stay visible
 *  (2px when the series has no outline). */
export const markerStroke = (s: NormSeries): { color: string; width: number } => ({
    color: s.bordercolor || s.color,
    width: s.bordercolor ? Math.max(1.5, s.borderwidth) : 2,
});

/** The inline fill-opacity override of a series (its own `fillopacity`),
 *  as the custom property the fills read; nothing when unset. */
export const fillVar = (s: NormSeries): Record<string, string> =>
    (s.fillopacity != null ? { '--lm-chart-fill-opacity': String(s.fillopacity) } : {});

/** The category count the cartesian renderers draw. */
export const categoryCount = (m: Model): number =>
    m.categories.length || (m.series[0] ? m.series[0].points.length : 0);

/** The model with its categories (and every series' points) in reverse
 *  order: a reversed category axis drawn by renderers that only know left
 *  to right. Missing points become gaps so the slots stay aligned. */
export const reverseCategories = (m: Model): Model => {
    const n = categoryCount(m);
    const gap: NormPoint = { name: '', value: 0, x: 0, z: 0, extra: [], color: '', bordercolor: '', gap: true, from: '', to: '', parent: '' };
    return {
        ...m,
        categories: m.categories.length ? Array.from({ length: n }, (_, i) => m.categories[n - 1 - i]) : [],
        series: m.series.map((s) => ({ ...s, points: Array.from({ length: n }, (_, i) => s.points[n - 1 - i] || gap) })),
    };
};

/** The custom properties behind the per-axis grid (--lm-chart-xgrid-*,
 *  --lm-chart-ygrid-*), plus which axes opt into category lines. */
export const gridVars = (xaxis: unknown, yaxis: unknown): { vars: Record<string, string>; xcat: boolean; ycat: boolean } => {
    const vars: Record<string, string> = {};
    const one = (ax: unknown, a: 'x' | 'y'): boolean => {
        const g = isObj(ax) && isObj(ax.grid) ? ax.grid as ChartGrid : null;
        if (!g) return false;
        const pre = '--lm-chart-' + a + 'grid-';
        const color = g.color ? cssValue(g.color) : '';
        if (color) vars[pre + 'color'] = color;
        if (g.width != null && g.width !== '') {
            const n = Number(g.width);
            vars[pre + 'width'] = Number.isFinite(n) ? (n >= 0 ? n + 'px' : '') : cssValue(g.width);
        }
        if (g.dash) vars[pre + 'style'] = g.dash === 'dotted' ? 'dotted' : 'dashed';
        if (g.show === false) {
            vars[pre + 'color'] = 'transparent';
            return false;
        }
        // an explicit show: true outranks the global gridlines: false
        if (g.show === true) vars[pre + 'forced'] = color || 'var(--lm-chart-grid)';
        return Object.keys(g).some((k) => (g as Record<string, unknown>)[k] != null);
    };
    const xcat = one(xaxis, 'x');
    const ycat = one(yaxis, 'y');
    return { vars, xcat, ycat };
};

/** The custom properties behind the radar's rings (--lm-chart-rgrid-*) and
 *  spokes (--lm-chart-rspokes-*): SVG strokes, so the dash is a dasharray
 *  and a px width switches the stroke to non-scaling. */
export const radialGridVars = (raxis: unknown): Record<string, string> => {
    const vars: Record<string, string> = {};
    const one = (g0: unknown, pre: string): void => {
        const g = isObj(g0) ? g0 as ChartGrid : null;
        if (!g) return;
        if (g.show === false) { vars[pre + 'color'] = 'transparent'; return; }
        if (g.color) vars[pre + 'color'] = cssValue(g.color);
        if (g.width != null && g.width !== '') {
            const n = Number(g.width);
            if (Number.isFinite(n) && n >= 0) { vars[pre + 'width'] = n + 'px'; vars[pre + 've'] = 'non-scaling-stroke'; }
        }
        if (g.dash) vars[pre + 'dash'] = g.dash === 'dotted' ? '1 3' : '4 3';
    };
    if (isObj(raxis)) { one(raxis.grid, '--lm-chart-rgrid-'); one(raxis.spokes, '--lm-chart-rspokes-'); }
    return vars;
};

/** The pixel size of an element's font, for layout estimates; `fallback`
 *  (the stylesheet default) when unset or not a px/number value. */
export const fontPx = (fonts: ChartFonts | null | undefined, key: ChartFontKey, fallback: number): number => {
    const f = fonts && fonts[key];
    if (!f || f.size == null) return fallback;
    const n = typeof f.size === 'number' ? f.size : /^\s*[\d.]+\s*(px)?\s*$/.test(String(f.size)) ? parseFloat(String(f.size)) : NaN;
    return n > 0 ? n : fallback;
};

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
    /** '' = the series outline (pie slices) */
    bordercolor: string;
    /** link endpoints (sankey/chord) and tree parent (sunburst/icicle) */
    from: string; to: string; parent: string;
}
export interface NormSeries {
    name: string;
    color: string;
    /** '' = no outline */
    bordercolor: string;
    /** px (default 1); drawn only with an outline colour, pie slices aside */
    borderwidth: number;
    points: NormPoint[];
    type: 'bar' | 'line' | 'area' | 'scatter';
    axis: 'left' | 'right';
    smooth: boolean;
    step: '' | 'before' | 'mid';
    dashed: '' | 'dashed' | 'dotted' | 'dashdot';
    marker: string;
    /** 0 = the stylesheet default */
    width: number;
    /** null = the stylesheet default */
    markersize: number | null;
    /** null = the chart `markers` prop decides */
    markers: boolean | null;
    connectgaps: boolean;
    /** null = the chart's fillopacity / the stylesheet default */
    fillopacity: number | null;
    trendline: Trendline | null;
}
export interface Model {
    type: 'bar' | 'stackedbar' | 'line' | 'stackedarea' | 'streamgraph' | 'scatter' | 'bubble'
        | 'radar' | 'gauge' | 'funnel' | 'pyramid' | 'waterfall' | 'bullet'
        | 'heatmap' | 'candlestick' | 'ohlc' | 'boxplot' | 'arearange' | 'columnrange' | 'dumbbell'
        | 'lollipop' | 'histogram' | 'radialbar' | 'polararea' | 'treemap' | 'pie'
        | 'sankey' | 'chord' | 'arcdiagram' | 'sunburst' | 'icicle' | 'packedbubble' | 'pareto' | 'wordcloud' | 'pictogram';
    title: string;
    /** '' = above the plot */
    titleposition: '' | 'bottom';
    subtitle: string;
    legendtitle: string;
    xtype: '' | 'datetime' | 'linear';
    xtitle: string;
    ytitle: string;
    y2title: string;
    /** horizontal bars: the top axis title (x2axis.title) */
    x2title: string;
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
    ystep: number | null;
    yreverse: boolean;
    /** the bottom axis is reversed (xaxis.reverse) */
    xreverse: boolean;
    xmin: number | null;
    xmax: number | null;
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
    fonts: ChartFonts;
    /** tick labels shown per physical axis (ChartAxis.labels) */
    xlabels: boolean;
    ylabels: boolean;
    y2labels: boolean;
    x2labels: boolean;
    /** horizontal bars: the top axis is reversed (x2axis.reverse) */
    x2reverse: boolean;
    /** vertical: the right axis is reversed (y2axis.reverse, else as yreverse) */
    y2reverse: boolean;
    /** radar: the radial axis */
    raxis: RAxis;
    /** null = the stylesheet defaults */
    fillopacity: number | null;
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
        // a fixed bin WIDTH (Excel's "bin width"): the bins start at the
        // minimum and the last one runs past the maximum to a whole width;
        // a maximum on a boundary joins the last bin rather than opening an
        // empty one. Capped at 200 bins — a tiny width falls back to the
        // count below. Else a bin COUNT: the `bins` prop, or Sturges' rule.
        const bw = Number(def.binwidth) > 0 ? Number(def.binwidth) : 0;
        const kw = bw > 0 ? Math.max(1, Math.ceil((hi - lo) / bw - 1e-9)) : 0;
        const fixed = kw > 0 && kw <= 200;
        const k = fixed ? kw
            : Math.max(1, Math.round(Number(def.bins) > 0 ? Number(def.bins) : Math.ceil(Math.log2(samples.length || 1)) + 1));
        const w = fixed ? bw : (hi - lo) / k;
        // Excel's bins: closed on the right, (a, b], a value on a boundary
        // counts in the LOWER bin; the first bin is closed on both sides,
        // [min, b], and the labels say so
        const counts = new Array(k).fill(0);
        for (const v of samples) counts[Math.max(0, Math.min(k - 1, Math.ceil((v - lo) / w - 1e-9) - 1))]++;
        categories = counts.map((_, i) => (i === 0 ? '[' : '(') + compact(lo + i * w, null) + ', ' + compact(lo + (i + 1) * w, null) + ']');
        rawSeries = [{ name: (rawSeries[0] && rawSeries[0].name) || 'Frequency', color: rawSeries[0] && rawSeries[0].color,
            bordercolor: rawSeries[0] && rawSeries[0].bordercolor, borderwidth: rawSeries[0] && rawSeries[0].borderwidth, data: counts }];
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
        // a second series carries the options of the line (its colour)
        const src1 = rawSeries[1];
        rawSeries = [
            { name: (src0 && src0.name) || 'Value', color: src0 && src0.color,
                bordercolor: src0 && src0.bordercolor, borderwidth: src0 && src0.borderwidth, type: 'bar', data: items.map((e) => e.v) },
            { ...(src1 || {}), name: 'Cumulative %', type: 'line', axis: 'right', color: (src1 && src1.color) || '#3f444c', data: cum },
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

    const TRENDS = ['linear', 'exponential', 'logarithmic', 'power', 'polynomial', 'movingAverage'];
    const normalizeTrend = (t: ChartSeries['trendline']): Trendline | null => {
        const o: Partial<Trendline> = typeof t === 'string' ? { type: t } : (t && typeof t === 'object' ? t : {});
        return TRENDS.includes(o.type as string) ? { ...o, type: o.type as Trendline['type'] } : null;
    };

    // Multi-value points: a boxplot point of any size but five is the raw
    // sample (the box is computed), a candlestick/ohlc point of three values
    // is high, low, close (no open: the close stands in)
    const tuple = (values: number[]): number[] => {
        if (chartType === 'boxplot' && values.length !== 5) return quartiles(values) || [];
        if ((chartType === 'candlestick' || chartType === 'ohlc') && values.length === 3) return [values[2], values[0], values[1], values[2]];
        return values;
    };

    const series: NormSeries[] = rawSeries.map((s, si) => {
        const data = Array.isArray(s.data) ? s.data : [];
        return {
            name: s.name != null ? String(s.name) : 'Series ' + (si + 1),
            color: s.color || palette[si % palette.length],
            bordercolor: s.bordercolor ? String(s.bordercolor) : '',
            // the outline width stands on its own (pie slices may colour their
            // borders per point): an explicit px value, else 1
            borderwidth: s.borderwidth != null && Number.isFinite(Number(s.borderwidth)) && Number(s.borderwidth) >= 0 ? Number(s.borderwidth) : 1,
            type: resolveType(s),
            axis: s.axis === 'right' ? 'right' : 'left',
            smooth: s.smooth === true || (s.smooth == null && def.smooth === true),
            dashed: s.dashed === true ? 'dashed' : (s.dashed === 'dashed' || s.dashed === 'dotted' || s.dashed === 'dashdot' ? s.dashed : ''),
            width: Number(s.width) > 0 ? Number(s.width) : 0,
            markersize: s.markersize != null && Number.isFinite(Number(s.markersize)) ? Math.max(0, Number(s.markersize)) : null,
            markers: typeof s.markers === 'boolean' ? s.markers : null,
            connectgaps: s.connectgaps === true,
            fillopacity: s.fillopacity != null && Number.isFinite(Number(s.fillopacity)) ? Math.max(0, Math.min(1, Number(s.fillopacity))) : null,
            trendline: normalizeTrend(s.trendline),
            step: s.step === true || s.step === 'mid' || (s.step == null && (def.step === true || def.step === 'mid')) ? (s.step === 'mid' || (s.step == null && def.step === 'mid') ? 'mid' : 'before') : '',
            // '' = not specified (scatter cycles shapes per series, HC-style)
            marker: ['circle', 'square', 'triangle', 'diamond', ...STROKE_MARKERS].includes(s.marker as string) ? (s.marker as string) : '',
            points: data.map((p, pi) => p == null
                ? { name: categories[pi] != null ? categories[pi] : '', value: 0, x: pi, z: 0, extra: [], color: palette[pi % palette.length], bordercolor: '', gap: true, from: '', to: '', parent: '' }
                : {
                    name: pointName(p, pi, categories),
                    value: pointValue(p),
                    x: pointX(p, pi),
                    z: pointZ(p),
                    // multi-value points (OHLC / box / range) keep their raw numbers
                    extra: Array.isArray(p) ? tuple(p.map(num)) : [],
                    // Pie reads per-point colour first, then walks the palette
                    color: (typeof p === 'object' && !Array.isArray(p) && p && p.color) || palette[pi % palette.length],
                    bordercolor: typeof p === 'object' && !Array.isArray(p) && p && p.bordercolor ? String(p.bordercolor) : '',
                    gap: false,
                    // link/tree fields (sankey/chord/sunburst/icicle)
                    from: typeof p === 'object' && !Array.isArray(p) && p.from != null ? String(p.from) : '',
                    to: typeof p === 'object' && !Array.isArray(p) && p.to != null ? String(p.to) : '',
                    parent: typeof p === 'object' && !Array.isArray(p) && p.parent != null ? String(p.parent) : '',
                }),
        };
    });

    // the element objects win over the flat props they group
    const lg = isObj(def.legend) ? def.legend as ChartLegend : null;
    const pos = lg && lg.position != null ? lg.position : def.legendposition;
    const axisTitle = (ax: ChartAxis | undefined, flat: string | undefined): string =>
        isObj(ax) && ax.title != null ? String(ax.title) : flat != null ? String(flat) : '';
    return {
        type: chartType,
        title: textOf(def.title),
        titleposition: def.titleposition === 'bottom' ? 'bottom' : '',
        subtitle: textOf(def.subtitle),
        legendtitle: lg && lg.title != null ? String(lg.title) : def.legendtitle != null ? String(def.legendtitle) : '',
        xtype: def.xtype === 'datetime' || def.xtype === 'linear' ? def.xtype : '',
        xtitle: axisTitle(def.xaxis, def.xtitle),
        ytitle: axisTitle(def.yaxis, def.ytitle),
        y2title: axisTitle(def.y2axis, def.y2title),
        x2title: axisTitle(def.x2axis, undefined),
        gridlines: def.gridlines !== false,
        valueprefix: def.valueprefix != null ? String(def.valueprefix) : '',
        valuesuffix: def.valuesuffix != null ? String(def.valuesuffix) : '',
        labelrotation: def.labelrotation != null && Number.isFinite(Number(def.labelrotation))
            ? Number(def.labelrotation) : null,
        // attribute strings: present = on, "false"/"0" = off
        legend: lg ? lg.show !== false : !(def.legend === false || def.legend === 'false' || def.legend === '0'),
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
        ystep: Number(def.ystep) > 0 ? Number(def.ystep) : null,
        // physical (the left axis): yaxis.reverse wins over the flat yreverse
        yreverse: isObj(def.yaxis) && def.yaxis.reverse != null ? def.yaxis.reverse === true : def.yreverse === true,
        xreverse: isObj(def.xaxis) && def.xaxis.reverse === true,
        xmin: def.xmin != null && Number.isFinite(Number(def.xmin)) ? Number(def.xmin) : null,
        xmax: def.xmax != null && Number.isFinite(Number(def.xmax)) ? Number(def.xmax) : null,
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
        fonts: fontsOf(def),
        xlabels: !(isObj(def.xaxis) && def.xaxis.labels === false),
        ylabels: !(isObj(def.yaxis) && def.yaxis.labels === false),
        y2labels: !(isObj(def.y2axis) && def.y2axis.labels === false),
        x2labels: !(isObj(def.x2axis) && def.x2axis.labels === false),
        x2reverse: isObj(def.x2axis) && def.x2axis.reverse === true,
        fillopacity: def.fillopacity != null && Number.isFinite(Number(def.fillopacity)) ? Math.max(0, Math.min(1, Number(def.fillopacity))) : null,
        raxis: ((): RAxis => {
            const r = isObj(def.raxis) ? def.raxis as ChartRAxis : {};
            const num = (v: unknown): number | null => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
            return {
                min: num(r.min), max: num(r.max),
                step: num(r.step) != null && Number(r.step) > 0 ? Number(r.step) : null,
                reverse: r.reverse === true,
                labels: r.labels !== false,
                ticks: r.ticks == null ? null : r.ticks === true,
            };
        })(),
        // the right axis follows the left one unless it says otherwise
        y2reverse: isObj(def.y2axis) && def.y2axis.reverse != null ? def.y2axis.reverse === true
            : isObj(def.yaxis) && def.yaxis.reverse != null ? def.yaxis.reverse === true : def.yreverse === true,
        waffle: isWaffle,
    };
};
/* ------------------------------------------------------------------ *
 *  The render context (index.ts → renderer files)                     *
 * ------------------------------------------------------------------ */

/** One row of the shared tooltip pill. */
export interface TipRow {
    name: string; value: string; color: string;
    /** swatch outline (bar series with `bordercolor`) */
    border?: string;
}

/** Inset outline for a bar / swatch: drawn inside the box, so geometry is unchanged. */
export const outline = (color: string | undefined, width = 1): string | undefined =>
    color && width > 0 ? 'inset 0 0 0 ' + width + 'px ' + color : undefined;

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
