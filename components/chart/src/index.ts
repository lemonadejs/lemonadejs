/**
 * <Chart /> — LemonadeJS v6 block
 *
 * One block, two dozen chart types selected by `type` (bar, line, pie,
 * radar, radialbar, polararea, lollipop, dumbbell, histogram, streamgraph,
 * heatmap, treemap, candlestick... see the `type` prop for the full list).
 * Presentation is flat, typed, verifiable props; only the data itself —
 * `series` and `categories` — travels as arrays:
 *
 *   const series = [
 *       { name: 'Product A', data: [3, 5, 2] },
 *       { name: 'Product B', data: [1, 2, 4] },
 *   ];
 *   <${Chart} type="bar" categories="${cats}" series="${series}" legend labels />
 *
 * THE DESIGN, AND WHY IT IS NOT HIGHCHARTS:
 *   - bar / stackedbar render in PLAIN HTML + CSS (flex columns, % heights —
 *     the same mechanism <Progress> uses for its linear bar). They are
 *     responsive on both axes with ZERO JavaScript: no ResizeObserver, no
 *     redraw loop. The browser reflows the flexbox; we never recompute.
 *   - pie renders as a single <svg viewBox>; the viewBox scales the scene
 *     natively, so it too needs no resize handling. Per-slice paths give
 *     hover and labels for free.
 *
 * LAYOUT: index.ts owns the component (state, legend, tooltip, export,
 * dispatch); model.ts the data shapes + normalize(); helpers.ts the pure
 * math/geometry; cartesian.ts / radial.ts / extras.ts the renderers, as
 * plain (model, ctx) => View functions wired through RenderCtx.
 *
 * The scene is one reactive `model` derived from the props: change any prop
 * (assignment triggers, mutation does not — the v6 contract) and only the
 * dependent bindings rebuild. There is no imperative chart object to sync.
 */

import { component, css, html, type View } from 'lemonadejs';
import {
    normalize, type Annotation, type ChartOptions, type ChartSeries, type Model,
    type NormPoint, type NormSeries, type PlotBand, type PlotLine, type RenderCtx, type TipRow,
} from './model';
import { compact, plain } from './helpers';
import { bars, boxplotChart, lollipopChart, ohlcChart, rangeChart, waterfallChart } from './cartesian';
import { funnelChart, gaugeChart, pie, polarareaChart, radarChart, radialbarChart } from './radial';
import { bulletChart, heatmapChart, packedbubbleChart, pictogramChart, scatterChart, sparkline, treemapChart, waffleChart, wordcloudChart } from './extras';
import { arcChart, chordChart, sankeyChart } from './flow';
import { icicleChart, sunburstChart } from './hierarchy';

export type { ChartPoint, ChartSeries, PlotBand, PlotLine, Annotation } from './model';

/* ------------------------------------------------------------------ *
 *  The component                                                      *
 * ------------------------------------------------------------------ */

export const Chart = component('chart', {
    type: 'bar',             // bar | stackedbar | line | stackedarea | streamgraph | pie | scatter | bubble | radar | radialbar | polararea | gauge | funnel | pyramid | waterfall | bullet | lollipop | dumbbell | histogram | heatmap | candlestick | ohlc | boxplot | arearange | columnrange | treemap | sunburst | icicle | sankey | chord | arcdiagram | packedbubble | pareto | wordcloud | pictogram (aka pictorial/isotype/waffle)
    series: Array,           // [{ name, data, color? }]; pie uses the first series
    categories: Array,       // x-axis labels (bar/stacked) / slice names (pie)
    title: '',               // optional heading above the plot
    subtitle: '',            // muted line under the title
    xtype: '',               // '' category | 'datetime' | 'linear' (continuous x for line/area)
    xformat: Function,       // (x) => string; custom x-axis tick label (datetime/linear)
    xtitle: '',              // x-axis title (bar/stacked)
    ytitle: '',              // y-axis (left) title
    y2title: '',             // secondary y-axis (right) title
    markers: true,           // line/area: show point markers
    smooth: false,           // line/area: smooth (spline) curves
    step: false,             // line/area: step (stairs) — true/'before' or 'mid'
    area: false,             // line type: fill the area under the line
    toolbar: false,          // show a small toolbar with a CSV download button
    zoom: false,             // bar/line: drag-select along x to zoom in (reset button)
    navigator: false,        // bar/line: overview strip below with a draggable x-window
    sparkline: false,        // tiny axisless/chrome-free inline chart (line/area/bar)
    gridlines: true,         // show horizontal y-gridlines
    valueprefix: '',         // unit prefix on values (e.g. '$')
    valuesuffix: '',         // unit suffix on values (e.g. ' USD')
    labelrotation: Number,   // x-label angle in deg (unset = auto-rotate when crowded)
    legend: true,            // show the series/slice legend
    legendposition: '',      // '' auto | 'top' | 'bottom' | 'left' | 'right'
    labels: true,            // value labels on bars / % on slices (set false to hide)
    horizontal: false,       // bar/stacked: horizontal bars (categories on the y-axis)
    mirror: false,           // horizontal bars: population pyramid — series[0] grows leftward, abs labels
    tooltip: true,           // styled hover tooltip following the cursor
    sharedtooltip: true,     // bar/stacked: hover a column → all series + crosshair
    animate: true,           // CSS entrance/update animation (reduced-motion aware)
    stackmode: 'normal',     // stackedbar only: 'normal' | 'percent' (100%-stacked)
    innerradius: 0,          // pie: donut hole as a fraction (0–0.9) or percent (10–90); ring thickness = radius × (1 − innerradius)
    borderradius: null,      // corner rounding: donut segment corners / heatmap cells; default = subtle per-type value
    ymin: Number,            // bar/stacked: force the y-axis lower bound (auto if unset)
    ymax: Number,            // bar/stacked: force the y-axis upper bound (auto if unset)
    ylog: false,             // logarithmic y-axis (positive values only)
    bins: Number,            // histogram only: bin count (unset = Sturges' rule)
    plotlines: Array,        // reference lines [{ value, color?, label?, dashed?, axis? }]
    plotbands: Array,        // reference bands [{ from, to, color?, label?, axis? }]
    annotations: Array,      // callouts [{ x, y, text, color? }] pinned to data points
    palette: 'lemonade',     // built-in palette: lemonade | tableau | category10 | material
    colors: Array,           // custom palette (overrides `palette`)
    height: 0,               // plot height in px (width is always fluid); default 320
    icon: '',                // pictogram: preset ('person'|'square'|'circle'|'capsule'|'star'|'heart') or an SVG path
    columns: Number,         // pictogram: glyphs across one row (default 10)
    iconcount: Number,       // pictogram: total glyphs per row (0 = one row of `columns`; e.g. 100 = a waffle grid)
    total: Number,           // pictogram: the value that fills every glyph (default 100 = percentages)
    valueformat: Function,   // (n) => string; override the default compact formatter
    compact: true,           // compact numbers (1.2k/3.4M); false = full numbers
    thousands: false,        // group full numbers with separators (1,234) when not compact
    decimals: Number,        // fixed decimal places (unset = auto)
    tooltipformat: Function, // ({ title, rows }) => string; custom tooltip body
    drilldown: Object,       // { [category|slice]: { series, categories?, type?, title? } }
    onpointclick: Function,  // (point, { seriesIndex, pointIndex }) on bar/slice click
    onlegendclick: Function, // (key, visible) when a legend entry is toggled
    ondrilldown: Function,   // (key, depth) after descending into a drilldown level
    ondrillup: Function,     // (depth) after climbing back up via the breadcrumb
}, (props, { state, computed }) => {
    /* ----- drilldown: a stack of sub-chart frames the user has drilled into ---- */
    interface DrillFrame { label: string; def: Partial<ChartOptions>; }
    const drillPath = state<DrillFrame[]>([]);

    /** The whole scene as one derived value — rebuilds when any prop changes.
     *  When drilled in, the deepest frame's data/title overrides the base; every
     *  downstream consumer (bars, pie, a11y, toolbar) then sees the sub-chart. */
    const model = computed(() => {
        const base: ChartOptions = baseOptions();
        const path = drillPath.value;
        if (!path.length) return normalize(base);
        const top = path[path.length - 1];
        return normalize({
            ...base,
            type: top.def.type != null ? top.def.type : base.type,
            categories: top.def.categories != null ? top.def.categories : [],
            series: top.def.series != null ? top.def.series : [],
            title: top.def.title != null ? top.def.title : top.label,
            subtitle: top.def.subtitle != null ? top.def.subtitle : '',
        });
    });
    /** Assemble the loose props into one options bag (shared base for drilldown). */
    function baseOptions(): ChartOptions { return {
        type: props.type.value,
        series: props.series.value as ChartSeries[],
        categories: props.categories.value as string[],
        title: props.title.value,
        subtitle: props.subtitle.value,
        xtype: props.xtype.value,
        xtitle: props.xtitle.value,
        ytitle: props.ytitle.value,
        y2title: props.y2title.value,
        markers: props.markers.value,
        smooth: props.smooth.value,
        step: props.step.value as boolean | 'before' | 'mid',
        area: props.area.value,
        gridlines: props.gridlines.value,
        valueprefix: props.valueprefix.value,
        valuesuffix: props.valuesuffix.value,
        labelrotation: props.labelrotation.value as number,
        legend: props.legend.value,
        legendposition: props.legendposition.value,
        labels: props.labels.value,
        horizontal: props.horizontal.value,
        mirror: props.mirror.value,
        tooltip: props.tooltip.value,
        sharedtooltip: props.sharedtooltip.value,
        stackmode: props.stackmode.value,
        innerRadius: props.innerradius.value as number,
        borderradius: props.borderradius.value as number | null,
        ymin: props.ymin.value as number,
        ymax: props.ymax.value as number,
        ylog: props.ylog.value,
        bins: props.bins.value as number,
        plotlines: props.plotlines.value as PlotLine[],
        plotbands: props.plotbands.value as PlotBand[],
        annotations: props.annotations.value as Annotation[],
        palette: props.palette.value,
        colors: props.colors.value as string[],
        height: props.height.value,
        icon: props.icon.value,
        columns: props.columns.value as number,
        iconcount: props.iconcount.value as number,
        total: props.total.value as number,
    }; }

    /** Drill into the sub-chart registered for `key`, if any; returns whether it drilled. */
    const tryDrill = (key: string): boolean => {
        const map = props.drilldown.value as Record<string, Partial<ChartOptions>> | undefined;
        const entry = map && key ? map[key] : undefined;
        if (!entry || !Array.isArray(entry.series)) return false;
        drillPath.value = [...drillPath.value, { label: key, def: entry }];
        zoomRange.value = null; hidden.value = []; kb.value = null; // sub-chart starts clean
        props.ondrilldown?.(key, drillPath.value.length);
        return true;
    };
    /** Pop the drill stack back to `level` frames (0 = top level). */
    const drillTo = (level: number): void => {
        if (level >= drillPath.value.length) return;
        drillPath.value = drillPath.value.slice(0, level);
        zoomRange.value = null; hidden.value = []; kb.value = null;
        props.ondrillup?.(drillPath.value.length);
    };

    const fire = (point: NormPoint, seriesIndex: number, pointIndex: number): void => {
        // a click on a point that has a drilldown entry descends instead of just firing
        const key = point.name || model.value.categories[pointIndex] || '';
        tryDrill(key);
        props.onpointclick?.(point, { seriesIndex, pointIndex });
    };

    /** Format a value: `valueformat` wins, else compact/plain + decimals + units. */
    const fmt = (n: number): string => {
        const f = props.valueformat.value as ((n: number) => unknown) | undefined;
        if (typeof f === 'function') return String(f(n));
        const dec = props.decimals.value as number | undefined;
        const core = props.compact.value !== false
            ? compact(n, dec)
            : plain(n, dec, props.thousands.value === true);
        return String(props.valueprefix.value || '') + core + String(props.valuesuffix.value || '');
    };

    /* ----- cursor-following tooltip (one shared overlay, state-driven) ----- */
    interface Tip { title: string; rows: TipRow[]; x: number; y: number; below: boolean; }
    const tip = state<Tip | null>(null);
    const hoverCol = state<number | null>(null); // highlighted column (shared tooltip)

    /** Place the tip at the cursor/touch, clamped to stay inside the chart bounds. */
    const showTip = (e: MouseEvent, title: string, rows: TipRow[]): void => {
        if (!model.value.tooltip) return;
        const root = (e.currentTarget as Element).closest('.lm-chart');
        if (!root) return;
        const t = (e as MouseEvent & { touches?: Array<{ clientX: number; clientY: number }> }).touches;
        const cx = t && t[0] ? t[0].clientX : e.clientX;
        const cy = t && t[0] ? t[0].clientY : e.clientY;
        const r = root.getBoundingClientRect();
        const x = cx - r.left;
        const y = cy - r.top;
        // keep the (centered) pill off the left/right walls; flip below near the top
        const clampedX = Math.max(64, Math.min(x, r.width - 64));
        tip.value = { title, rows, x: clampedX, y, below: y < 44 };
    };
    const hideTip = (): void => {
        if (tip.value) tip.value = null;
        if (hoverCol.value != null) hoverCol.value = null;
    };

    /* ----- interactive legend state ----- */
    // keys of series/slices the user has toggled off; the highlighted key
    const hidden = state<string[]>([]);
    const hover = state<string | null>(null);
    const isHidden = (key: string): boolean => hidden.value.includes(key);

    // zoom-to-explore: a category-index window into the data + the live drag fraction
    const zoomRange = state<[number, number] | null>(null);
    const zsel = state<{ a: number; b: number } | null>(null);
    // heatmap row/column cross-highlight
    const heatHover = state<{ r: number; c: number } | null>(null);
    /** arc diagram plot aspect (W/H), measured once when the plot attaches */
    const arcAspect = state<number | null>(null);
    // keyboard navigation: the active column index (cartesian plots), or null
    const kb = state<number | null>(null);
    // navigator strip drag: which edge/body is being dragged + the window at grab
    const navDrag = state<{ mode: 'l' | 'r' | 'm'; a: number; b: number; f0: number } | null>(null);

    const toggle = (key: string): void => {
        const set = hidden.value;
        hidden.value = set.includes(key) ? set.filter((k) => k !== key) : [...set, key];
        props.onlegendclick?.(key, !isHidden(key));
    };

    /* ----- legend (shared by all types) — real <button>s, toggle + highlight --- */
    interface LegendEntry { name: string; color: string; key: string; line: boolean; shape: string; }
    const legendEntries = (m: Model): LegendEntry[] => {
        // multi-series radialbar (stacked polar) legends by SERIES like bars;
        // waffle legends by CATEGORY (its cells are palette-partitioned)
        if (m.type === 'pie' || m.type === 'polararea' || (m.type === 'radialbar' && m.series.length < 2)
            || (m.type === 'pictogram' && m.waffle)) {
            const points = m.series[0] ? m.series[0].points : [];
            return points.map((p, i) => ({ name: p.name || '—', color: p.color, key: p.name || '#' + i, line: false, shape: '' }));
        }
        // scatter swatches mirror the marker shape (explicit or the cycled
        // default — keep the order in sync with scatterChart's CYCLE)
        const cycle = ['circle', 'diamond', 'square', 'triangle'];
        const shapeOf = (s: NormSeries, i: number): string =>
            m.type === 'scatter' && s.type !== 'line' ? s.marker || cycle[i % cycle.length] : '';
        return m.series.map((s, i) => ({
            name: s.name, color: s.color, key: s.name,
            // scatter base: only 'line' series show a line swatch (the rest are points)
            line: m.type === 'scatter' ? s.type === 'line' : s.type !== 'bar',
            shape: shapeOf(s, i),
        }));
    };
    const legend = (entries: LegendEntry[]): View | false =>
        html`<div class="lm-chart-legend">${entries.map(
            (e) => html`<button type="button" class="lm-chart-legend-item"
                data-hidden="${isHidden(e.key) ? 'true' : false}"
                data-dim="${hover.value && hover.value !== e.key ? 'true' : false}"
                aria-pressed="${isHidden(e.key) ? 'false' : 'true'}"
                onclick="${() => toggle(e.key)}"
                onmouseenter="${() => (hover.value = e.key)}"
                onmouseleave="${() => (hover.value = null)}">
                <span class="lm-chart-swatch" data-line="${e.line ? 'true' : false}"
                    data-shape="${e.shape || false}"
                    style="${css({ background: e.color })}"></span>
                <span class="lm-chart-legend-name">${e.name}</span>
            </button>`,
        )}</div>`;

    /** Wrap the plotting core with the legend placed per `legendposition`. */
    const layout = (m: Model, core: View): View => {
        const pos = m.legendposition
            || (['pie', 'radar', 'polararea', 'radialbar'].includes(m.type) ? 'right' : 'bottom');
        const noLegend = ['gauge', 'funnel', 'pyramid', 'waterfall', 'bullet', 'heatmap',
            'candlestick', 'ohlc', 'boxplot', 'arearange', 'columnrange', 'dumbbell', 'histogram', 'treemap',
            'sankey', 'chord', 'arcdiagram', 'sunburst', 'icicle', 'wordcloud'].includes(m.type)
            // pictogram rows carry their own labels; the WAFFLE variant needs
            // the category legend (its colours aren't labelled anywhere else)
            || (m.type === 'pictogram' && !m.waffle)
            // pie slice names live on the callout labels (Highcharts-style);
            // the legend only shows when labels are off or a position is
            // explicitly requested (it would duplicate the callouts)
            || (m.type === 'pie' && m.labels && !m.legendposition)
            // multi-series pure-line charts label each series at its line
            // end instead (cleaner than legend + colour matching)
            || (m.type === 'line' && m.labels && !m.legendposition
                && m.series.length > 1 && m.series.every((s) => s.type === 'line'));
        const leg = m.legend && !noLegend ? legend(legendEntries(m)) : false;
        return html`<div class="lm-chart-content" data-legend="${pos}">
            ${pos === 'top' || pos === 'left' ? leg : false}
            <div class="lm-chart-core">${core}</div>
            ${pos === 'bottom' || pos === 'right' ? leg : false}
        </div>`;
    };

    /* ----- the render context: what the renderer files need from here ----- */
    const ctx: RenderCtx = {
        fmt, showTip, hideTip, isHidden, fire,
        hover, hoverCol, kb, zoomRange, zsel, navDrag, heatHover, arcAspect,
        zoom: () => props.zoom.value === true,
        navigator: () => props.navigator.value === true,
        xformat: () => props.xformat.value as ((x: number) => unknown) | undefined,
    };

    /** True when there is at least one visible, non-zero data point to draw. */
    const hasData = (m: Model): boolean => {
        if (m.type === 'pie') {
            const pts = m.series[0] ? m.series[0].points : [];
            return pts.some((p, i) => !isHidden(p.name || '#' + i) && p.value !== 0);
        }
        if (m.type === 'gauge' || m.type === 'bullet') return !!(m.series[0] && m.series[0].points[0]);
        // link diagrams need at least one complete positive link
        if (m.type === 'sankey' || m.type === 'chord' || m.type === 'arcdiagram') {
            const pts = m.series[0] ? m.series[0].points : [];
            return pts.some((p) => !p.gap && p.from !== '' && p.to !== '' && p.value > 0);
        }
        // any plotted point counts
        if (['scatter', 'bubble', 'radar', 'funnel', 'pyramid', 'waterfall',
            'heatmap', 'candlestick', 'ohlc', 'boxplot', 'arearange', 'columnrange',
            'dumbbell', 'lollipop', 'radialbar', 'polararea', 'treemap',
            'sunburst', 'icicle', 'packedbubble', 'wordcloud', 'pictogram'].includes(m.type)) {
            return m.series.some((s) => !isHidden(s.name) && s.points.some((p) => !p.gap));
        }
        return m.series.some((s) => !isHidden(s.name) && s.points.some((p) => p.value !== 0));
    };

    const empty = (): View => html`<div class="lm-chart-empty">No data</div>`;

    /* ----- accessibility: a summary label + a visually-hidden data table ----- */
    const describeChart = (m: Model): string => {
        const ttl = m.title ? ', titled "' + m.title + '"' : '';
        if (m.type === 'pie') {
            const pts = m.series[0] ? m.series[0].points : [];
            return 'Pie chart' + ttl + ', ' + pts.length + ' slices.';
        }
        const ns = m.series.length;
        const nc = m.categories.length;
        return m.type + ' chart' + ttl + ', ' + ns + (ns === 1 ? ' series' : ' series') +
            (nc ? ', ' + nc + ' categories' : '') + '.';
    };
    const dataTable = (m: Model): View => {
        const cols = m.categories.length
            ? m.categories
            : (m.series[0] ? m.series[0].points.map((p, i) => p.name || String(i + 1)) : []);
        if (m.type === 'sankey' || m.type === 'chord' || m.type === 'arcdiagram') {
            const pts = m.series[0] ? m.series[0].points : [];
            return html`<table class="lm-chart-a11y">
                <caption>${m.title || describeChart(m)}</caption>
                <thead><tr><th>From</th><th>To</th><th>Value</th></tr></thead>
                <tbody>${pts.filter((p) => !p.gap && p.from !== '' && p.to !== '').map((p) =>
                    html`<tr><td>${p.from}</td><td>${p.to}</td><td>${fmt(p.value)}</td></tr>`)}</tbody>
            </table>`;
        }
        // multi-series waffles read as a Series × Category matrix instead
        const nameVal = ['pie', 'funnel', 'treemap', 'polararea', 'radialbar', 'sunburst', 'icicle', 'packedbubble', 'wordcloud', 'pictogram'].includes(m.type)
            && !(m.waffle && m.series.length > 1);
        const head = nameVal
            ? html`<tr><th>Name</th><th>Value</th></tr>`
            : html`<tr><th>Series</th>${cols.map((c) => html`<th>${String(c)}</th>`)}</tr>`;
        const body = nameVal
            ? (m.series[0] ? m.series[0].points : []).map((p, i) =>
                html`<tr><td>${p.name || String(i + 1)}</td><td>${fmt(p.value)}</td></tr>`)
            : m.series.map((s) => html`<tr><td>${s.name}</td>${
                cols.map((_, i) => html`<td>${s.points[i] && !s.points[i].gap ? fmt(s.points[i].value) : ''}</td>`)
            }</tr>`);
        return html`<table class="lm-chart-a11y">
            <caption>${m.title || describeChart(m)}</caption>
            <thead>${head}</thead><tbody>${body}</tbody>
        </table>`;
    };

    /* ----- CSV export ----- */
    const toCSV = (m: Model): string => {
        const esc = (s: string): string => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
        const lines: string[] = [];
        const ext: Record<string, string[]> = {
            candlestick: ['Open', 'High', 'Low', 'Close'], ohlc: ['Open', 'High', 'Low', 'Close'],
            boxplot: ['Min', 'Q1', 'Median', 'Q3', 'Max'],
            arearange: ['Low', 'High'], columnrange: ['Low', 'High'], dumbbell: ['Low', 'High'],
        };
        if (m.type === 'sankey' || m.type === 'chord' || m.type === 'arcdiagram') {
            lines.push('From,To,Value');
            (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap && p.from !== '' && p.to !== '')
                .forEach((p) => lines.push([p.from, p.to, String(p.value)].map(esc).join(',')));
        } else if (m.type === 'sunburst' || m.type === 'icicle') {
            lines.push('Name,Parent,Value');
            (m.series[0] ? m.series[0].points : []).filter((p) => !p.gap)
                .forEach((p, i) => lines.push([p.name || String(i + 1), p.parent, String(p.value)].map(esc).join(',')));
        } else if (['pie', 'funnel', 'pyramid', 'treemap', 'polararea', 'radialbar', 'packedbubble', 'wordcloud', 'pictogram'].includes(m.type)
            && !(m.waffle && m.series.length > 1)) {
            lines.push('Name,Value');
            (m.series[0] ? m.series[0].points : []).forEach((p, i) => lines.push(esc(p.name || String(i + 1)) + ',' + p.value));
        } else if (ext[m.type]) {
            lines.push(['Category', ...ext[m.type]].map(esc).join(','));
            (m.series[0] ? m.series[0].points : []).forEach((p, i) =>
                lines.push([m.categories[i] != null ? String(m.categories[i]) : String(i + 1), ...p.extra.map(String)].map(esc).join(',')));
        } else if (m.type === 'gauge' || m.type === 'bullet') {
            lines.push('Name,Value');
            const p = m.series[0] && m.series[0].points[0];
            if (p) lines.push(esc(m.series[0].name) + ',' + p.value);
        } else {
            const cols = m.categories.length ? m.categories.map(String)
                : (m.series[0] ? m.series[0].points.map((p, i) => p.name || String(i + 1)) : []);
            lines.push(['Series', ...cols].map(esc).join(','));
            m.series.forEach((s) => lines.push([s.name, ...cols.map((_, i) =>
                s.points[i] && !s.points[i].gap ? String(s.points[i].value) : '')].map(esc).join(',')));
        }
        return lines.join('\n');
    };
    const downloadCSV = (): void => {
        const m = model.value;
        const blob = new Blob([toCSV(m)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (m.title || 'chart') + '.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    // SVG export works for the SVG-native types (the svg IS the whole chart)
    const downloadSVG = (e: MouseEvent): void => {
        const root = (e.currentTarget as Element).closest('.lm-chart');
        const svg = root && root.querySelector('svg');
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGElement;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (model.value.title || 'chart') + '.svg';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const toolbar = (): View | false => {
        if (!props.toolbar.value || props.sparkline.value) return false;
        const svgType = ['pie', 'radar', 'gauge', 'funnel', 'pyramid', 'radialbar', 'polararea',
            'sankey', 'chord', 'arcdiagram', 'sunburst', 'packedbubble', 'wordcloud'].includes(model.value.type);
        return html`<div class="lm-chart-toolbar">
            ${svgType ? html`<button type="button" class="lm-chart-tool" title="Download SVG" onclick="${downloadSVG}">⤓ SVG</button>` : false}
            <button type="button" class="lm-chart-tool" title="Download CSV" onclick="${downloadCSV}">⤓ CSV</button>
        </div>`;
    };

    /* ----- drilldown breadcrumb (only while drilled in) ----- */
    const breadcrumb = (): View | false => {
        const path = drillPath.value;
        if (!path.length || props.sparkline.value) return false;
        const home = (props.title.value as string) || 'Home';
        return html`<nav class="lm-chart-crumbs" aria-label="Drilldown">
            <button type="button" class="lm-chart-crumb" onclick="${() => drillTo(0)}">${home}</button>
            ${path.map((f, i) => i < path.length - 1
                ? html`<button type="button" class="lm-chart-crumb" onclick="${() => drillTo(i + 1)}"><span class="lm-chart-crumb-sep">›</span>${f.label}</button>`
                : html`<span class="lm-chart-crumb" aria-current="page"><span class="lm-chart-crumb-sep">›</span>${f.label}</span>`)}
        </nav>`;
    };

    /* ----- the cursor-following tooltip overlay ----- */
    const tooltip = (): View | false => {
        const tp = tip.value;
        if (!tp || !model.value.tooltip) return false;
        // custom formatter: returns a string body (newlines preserved)
        const tf = props.tooltipformat.value as ((c: { title: string; rows: TipRow[] }) => unknown) | undefined;
        if (typeof tf === 'function') {
            return html`<div class="lm-chart-tooltip" data-below="${tp.below ? 'true' : false}"
                data-custom="true" style="${css({ left: tp.x, top: tp.y })}">${String(tf({ title: tp.title, rows: tp.rows }))}</div>`;
        }
        const row = (r: TipRow): View => html`<div class="lm-chart-tip-row">
            <span class="lm-chart-tip-swatch" style="${css({ background: r.color })}"></span>
            ${r.name ? html`<span class="lm-chart-tip-name">${r.name}</span>` : false}
            <span class="lm-chart-tip-value">${r.value}</span>
        </div>`;
        return html`<div class="lm-chart-tooltip" data-below="${tp.below ? 'true' : false}"
            style="${css({ left: tp.x, top: tp.y })}">
            ${tp.title ? html`<div class="lm-chart-tip-title">${tp.title}</div>` : false}
            ${tp.rows.map(row)}
        </div>`;
    };

    const sparkHeight = (): number | string => {
        const raw = props.height.value as number | string;
        // percentage height: fill the container (embedding hosts — a jss
        // media box, a dashboard cell — size the wrapper, the chart follows)
        if (typeof raw === 'string' && raw.indexOf('%') !== -1) return raw;
        const h = Number(raw);
        return props.sparkline.value ? (h > 0 ? h : 36) : model.value.height;
    };
    return html`<div class="lm-chart" data-type="${() => model.value.type}"
        data-spark="${() => (props.sparkline.value ? 'true' : false)}"
        role="figure" aria-label="${() => describeChart(model.value)}"
        data-animate="${() => (props.animate.value === false ? false : 'true')}"
        style="${() => css({ height: sparkHeight() })}">${() => dataTable(model.value)}${toolbar}${breadcrumb}${() => {
        const m = model.value;
        return !props.sparkline.value && (m.title || m.subtitle)
            ? html`<div class="lm-chart-header">
                ${m.title ? html`<div class="lm-chart-title">${m.title}</div>` : false}
                ${m.subtitle ? html`<div class="lm-chart-subtitle">${m.subtitle}</div>` : false}
            </div>`
            : false;
    }}${() => {
        const m = model.value;
        if (props.sparkline.value) return hasData(m) ? sparkline(m, ctx) : empty();
        const t = m.type;
        const core = !hasData(m) ? empty()
            : t === 'pie' ? pie(m, ctx)
                : t === 'scatter' || t === 'bubble' ? scatterChart(m, ctx)
                    : t === 'sankey' ? sankeyChart(m, ctx)
                    : t === 'arcdiagram' ? arcChart(m, ctx)
                    : t === 'chord' ? chordChart(m, ctx)
                    : t === 'sunburst' ? sunburstChart(m, ctx)
                    : t === 'icicle' ? icicleChart(m, ctx)
                    : t === 'packedbubble' ? packedbubbleChart(m, ctx)
                    : t === 'wordcloud' ? wordcloudChart(m, ctx)
                    : t === 'radar' ? radarChart(m, ctx)
                        : t === 'radialbar' ? radialbarChart(m, ctx)
                            : t === 'polararea' ? polarareaChart(m, ctx)
                                : t === 'gauge' ? gaugeChart(m, ctx)
                                    : t === 'funnel' || t === 'pyramid' ? funnelChart(m, ctx)
                                        : t === 'waterfall' ? waterfallChart(m, ctx)
                                            : t === 'bullet' ? bulletChart(m, ctx)
                                                : t === 'lollipop' ? lollipopChart(m, ctx)
                                                    : t === 'heatmap' ? heatmapChart(m, ctx)
                                                        : t === 'candlestick' || t === 'ohlc' ? ohlcChart(m, ctx)
                                                            : t === 'boxplot' ? boxplotChart(m, ctx)
                                                                : t === 'arearange' || t === 'columnrange' || t === 'dumbbell' ? rangeChart(m, ctx)
                                                                    : t === 'treemap' ? treemapChart(m, ctx)
                                                                        : t === 'pictogram' ? (m.waffle ? waffleChart(m, ctx) : pictogramChart(m, ctx))
                                                                        : bars(m, ctx);
        return layout(m, core);
    }}${tooltip}</div>`;
});

export default Chart;
