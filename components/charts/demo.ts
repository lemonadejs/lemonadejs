/**
 * <Chart /> playground — a properties panel (left) + a live card for
 * EVERY chart type (right). Click a chart to select it, then switch its
 * type or toggle props and watch the per-prop reactivity. Theme, palette
 * and height apply to every chart at once.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Chart, { type ChartSeries } from '@lemonadejs/charts';

/* ---- shared data sets (randomised per load — refresh for new data) ---- */
const rnd = (lo: number, hi: number): number => Math.round(lo + Math.random() * (hi - lo));
const walk = (n: number, start: number, step: number): number[] => {
    let v = start;
    return Array.from({ length: n }, () => {
        v = Math.max(2, v + (Math.random() * 2 - 1) * step);
        return Math.round(v * 10) / 10;
    });
};
const cats = ['Q1', 'Q2', 'Q3', 'Q4'];
const revenue: ChartSeries[] = [
    { name: 'Product A', data: walk(4, rnd(10, 22), 6) },
    { name: 'Product B', data: walk(4, rnd(6, 14), 4) },
    { name: 'Product C', data: walk(4, rnd(4, 10), 3) },
];
const months12 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const traffic = walk(12, rnd(50, 70), 14);
const ageCats = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
const pyr = (o: number): number[] => ageCats.map((_, i) =>
    Math.round((1.2 + 3.6 * Math.sin((Math.PI * (i + 1)) / (ageCats.length + 1)) + Math.random() * o) * 10) / 10);
const arcLinks = [{ data: [
    { from: 'Hamburg', to: 'München', value: 2 }, { from: 'Berlin', to: 'Köln', value: 2 },
    { from: 'Berlin', to: 'München', value: 3 }, { from: 'München', to: 'Wien', value: 2 },
    { from: 'Paris', to: 'Nantes', value: 2 }, { from: 'Paris', to: 'Bordeaux', value: 3 },
    { from: 'Paris', to: 'Marseille', value: 3 }, { from: 'Paris', to: 'Milano', value: 2 },
    { from: 'Frankfurt', to: 'Paris', value: 3 }, { from: 'Milano', to: 'Roma', value: 3 },
    { from: 'Roma', to: 'Napoli', value: 2 }, { from: 'Milano', to: 'Venezia', value: 1 },
] }] as unknown as ChartSeries[];
const pieData: ChartSeries[] = [
    {
        data: [
            { name: 'Direct', value: 35 },
            { name: 'Search', value: 48 },
            { name: 'Social', value: 27 },
            { name: 'Referral', value: 14 },
        ],
    },
];
const scatterData = [
    { name: 'A', data: [[1, 4], [2, 7], [3, 3], [4, 8], [5, 5], [6, 9]] },
    { name: 'B', data: [[1, 6], [2, 3], [3, 8], [4, 4], [5, 9], [6, 6]] },
] as unknown as ChartSeries[];
const bubbleData = [
    { name: 'North', data: [[10, 40, 30], [25, 60, 80], [40, 30, 45]] },
    { name: 'South', data: [[18, 22, 20], [32, 48, 60], [50, 55, 35]] },
] as unknown as ChartSeries[];
const radarCats = ['Speed', 'Power', 'Range', 'Cost', 'Eco'];
const radarData: ChartSeries[] = [
    { name: 'Q1', data: [80, 60, 70, 50, 90] },
    { name: 'Q2', data: [60, 80, 50, 70, 65] },
];
const weekCats = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ohlcData = [
    { data: [[20, 28, 18, 25], [25, 30, 24, 22], [22, 26, 19, 20], [20, 27, 20, 26], [26, 34, 25, 32]] },
] as unknown as ChartSeries[];
const boxData = [
    { data: [[5, 18, 24, 30, 42], [8, 15, 20, 28, 38], [12, 22, 28, 35, 44], [6, 12, 18, 26, 34]] },
] as unknown as ChartSeries[];
const rangeData = [
    { name: '°C', data: [[2, 9], [4, 13], [8, 18], [12, 23], [15, 27], [18, 30]] },
] as unknown as ChartSeries[];
const monthCats = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const treeData = [
    {
        data: [
            { name: 'Web', value: 0 }, { name: 'API', value: 0 },
            { name: 'Pages', parent: 'Web', value: 30 }, { name: 'Assets', parent: 'Web', value: 18 },
            { name: 'Auth', parent: 'API', value: 12 }, { name: 'Data', parent: 'API', value: 24 },
            { name: 'Cache', parent: 'Data', value: 9 },
        ],
    },
] as unknown as ChartSeries[];
const linkData = [
    {
        data: [
            { from: 'Coal', to: 'Power', value: 25 }, { from: 'Gas', to: 'Power', value: 20 },
            { from: 'Solar', to: 'Power', value: 10 }, { from: 'Power', to: 'Homes', value: 30 },
            { from: 'Power', to: 'Industry', value: 25 }, { from: 'Gas', to: 'Homes', value: 8 },
        ],
    },
] as unknown as ChartSeries[];
const tradeData = [
    {
        data: [
            { from: 'US', to: 'EU', value: 30 }, { from: 'US', to: 'Asia', value: 20 },
            { from: 'EU', to: 'Asia', value: 25 }, { from: 'Asia', to: 'US', value: 35 },
            { from: 'EU', to: 'US', value: 15 },
        ],
    },
] as unknown as ChartSeries[];

interface Cfg {
    title: string;
    type: string;
    categories: string[];
    series: ChartSeries[];
    labels: boolean;
    legend: boolean;
    gridlines: boolean;
    animate: boolean;
    smooth: boolean;
    step: boolean;
    area: boolean;
    horizontal: boolean;
    markers: boolean;
    tooltip: boolean;
    zoom: boolean;
    navigator: boolean;
    toolbar: boolean;
    ylog: boolean;
    stackmode: string;
    legendposition: string;
    innerradius: number;
    ymin?: number;
    ymax?: number;
    plotbands?: unknown[];
    plotlines?: unknown[];
    mirror?: boolean;
    palette?: string;
    borderradius?: number;
    xtype?: string;
    valuesuffix?: string;
    annotations?: unknown[];
    drilldown?: Record<string, unknown>;
    icon?: string;
    xtitle?: string;
    ytitle?: string;
}

const base = {
    labels: false, legend: true, gridlines: true, animate: true,
    smooth: false, step: false, area: false, horizontal: false,
    markers: true, tooltip: true, zoom: false, navigator: false,
    toolbar: false, ylog: false,
    stackmode: 'normal', legendposition: '', innerradius: 0,
};

/* one card per chart type — everything the block can draw */
const presets = (): Cfg[] => [
    { title: 'Grouped bar', type: 'bar', categories: cats, series: revenue, ...base },
    { title: 'Stacked bar', type: 'stackedbar', categories: cats, series: revenue, ...base },
    { title: 'Line', type: 'line', categories: cats, series: revenue, ...base, smooth: true },
    { title: 'Lines + end labels', type: 'line', categories: months12, series: [
        { name: 'Users', data: walk(12, rnd(40, 70), 12) },
        { name: 'Sessions', data: walk(12, rnd(25, 45), 8) },
        { name: 'Average', data: walk(12, rnd(10, 20), 4), dashed: true },
    ] as ChartSeries[], ...base, labels: true, markers: false, smooth: true },
    { title: 'Datetime axis', type: 'line', xtype: 'datetime',
        categories: Array.from({ length: 12 }, (_, i) => new Date(2026, 0, 1 + i * 7).toISOString().slice(0, 10)),
        series: [{ name: 'Visitors', data: walk(12, rnd(40, 80), 10) }], ...base, area: true, markers: false, smooth: true },
    { title: 'Zoom + navigator (drag)', type: 'line', categories: Array.from({ length: 40 }, (_, i) => 'D' + (i + 1)),
        series: [{ name: 'Price', data: walk(40, rnd(60, 90), 7) }], ...base, markers: false, zoom: true, navigator: true },
    { title: 'Stacked area', type: 'stackedarea', categories: cats, series: revenue, ...base, smooth: true, area: true },
    { title: 'Streamgraph', type: 'streamgraph', categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], series: [
        { name: 'A', data: [4, 6, 9, 7, 5, 8, 6] },
        { name: 'B', data: [2, 3, 5, 8, 6, 4, 3] },
        { name: 'C', data: [1, 2, 3, 2, 4, 3, 5] },
    ], ...base, smooth: true },
    { title: 'Combo + right axis', type: 'bar', categories: cats, series: [
        { name: 'Revenue', type: 'bar', data: [120, 190, 80, 220] },
        { name: 'Margin %', type: 'line', axis: 'right', data: [18, 26, 12, 31] },
    ] as ChartSeries[], ...base },
    { title: 'Pie', type: 'pie', categories: [], series: pieData, ...base, labels: true, gridlines: false },
    { title: 'Donut', type: 'pie', categories: [], series: pieData, ...base, labels: true, gridlines: false, innerradius: 0.6 },
    { title: 'Rounded donut', type: 'pie', categories: [], series: pieData, ...base, labels: true, gridlines: false, innerradius: 0.62, borderradius: 10 },
    { title: 'Focus pie (hero palette)', type: 'pie', categories: [], series: [{ data: [
        { name: 'Webform', value: 63 }, { name: 'Call', value: 20 }, { name: 'Email', value: 8 },
        { name: 'Webchat', value: 6 }, { name: 'Other', value: 3 },
    ] }] as unknown as ChartSeries[], ...base, labels: true, gridlines: false, palette: 'focus' },
    { title: 'Radial bar', type: 'radialbar', categories: [], series: pieData, ...base },
    { title: 'Stacked radial (medals)', type: 'radialbar', categories: ['Norway', 'USA', 'Germany', 'Austria', 'Canada'],
        series: [
            { name: 'Gold', color: '#e8c132', data: walk(5, rnd(80, 130), 30) },
            { name: 'Silver', color: '#b6b8bd', data: walk(5, rnd(70, 120), 30) },
            { name: 'Bronze', color: '#b1762b', data: walk(5, rnd(60, 110), 30) },
        ], ...base },
    { title: 'Polar area', type: 'polararea', categories: [], series: pieData, ...base, labels: true, gridlines: false },
    { title: 'Gauge', type: 'gauge', categories: [], series: [{ name: 'Load', data: [73] }], ...base,
        ymin: 0, ymax: 100, plotbands: [
            { from: 0, to: 60, color: 'rgba(22,163,74,.35)' },
            { from: 60, to: 85, color: 'rgba(245,158,11,.4)' },
            { from: 85, to: 100, color: 'rgba(220,38,38,.4)' },
        ] },
    { title: 'Bullet', type: 'bullet', categories: [], series: [{ name: 'Sales YTD', data: [72] }], ...base,
        ymin: 0, ymax: 100,
        plotbands: [{ from: 0, to: 50 }, { from: 50, to: 80, color: 'rgba(99,110,130,.2)' }],
        plotlines: [{ value: 85 }] },
    { title: 'Funnel', type: 'funnel', categories: [], series: [
        { data: [
            { name: 'Visits', value: 1000 }, { name: 'Signups', value: 420 },
            { name: 'Trials', value: 180 }, { name: 'Deals', value: 60 },
        ] },
    ], ...base, labels: true },
    { title: 'Pyramid', type: 'pyramid', categories: [], series: [
        { data: [
            { name: 'Staff', value: 300 }, { name: 'Managers', value: 40 }, { name: 'CEO', value: 4 },
        ] },
    ], ...base, labels: true },
    { title: 'Waterfall', type: 'waterfall', categories: ['Start', 'Sales', 'Refunds', 'Fees', 'Net'], series: [
        { data: [120, 45, -30, -15, 25] },
    ], ...base, labels: true },
    { title: 'Population pyramid', type: 'bar', categories: ageCats, series: [
        { name: 'Male', data: pyr(1.4) }, { name: 'Female', data: pyr(1.4) },
    ], ...base, horizontal: true, mirror: true, valuesuffix: '%' },
    { title: 'Scatter', type: 'scatter', categories: [], series: scatterData, ...base },
    { title: 'Scatter + trend line', type: 'scatter', categories: [], series: [
        { name: 'Measured', type: 'scatter', data: [
            [1.2, 11], [2.1, 14], [2.8, 13], [3.9, 17], [5.1, 16], [6.2, 21], [7.0, 19] ] },
        { name: 'Trend', type: 'line', smooth: true, data: [
            [1, 10], [2, 13], [3, 14], [4, 16], [5, 17], [6, 20], [7, 20] ] },
    ] as unknown as ChartSeries[], ...base, xtitle: 'Epoch', ytitle: 'Cost' },
    { title: 'Bubble', type: 'bubble', categories: [], series: bubbleData, ...base },
    { title: 'Pictogram (isotype)', type: 'pictogram', icon: 'person', categories: [], series: [{ data: [
        { name: 'Satisfied', value: rnd(60, 85) },
        { name: 'Neutral', value: rnd(30, 55) },
        { name: 'Unhappy', value: rnd(10, 35) },
    ] }] as unknown as ChartSeries[], ...base, labels: true },
    { title: 'Waffle', type: 'waffle', categories: [], series: [
        { name: '2023', data: [{ name: 'Chrome', value: 52 }, { name: 'Safari', value: 28 }, { name: 'Other', value: 20 }] },
        { name: '2024', data: [{ name: 'Chrome', value: rnd(40, 50) }, { name: 'Safari', value: rnd(25, 35) }, { name: 'Other', value: 22 }] },
    ] as unknown as ChartSeries[], ...base, labels: true },
    { title: 'Radar', type: 'radar', categories: radarCats, series: radarData, ...base },
    { title: 'Heatmap', type: 'heatmap', categories: weekCats, series: [
        { name: 'Morning', data: [12, 18, 22, 15, 9] },
        { name: 'Afternoon', data: [22, 28, 34, 26, 18] },
        { name: 'Evening', data: [8, 12, 19, 31, 38] },
        { name: 'Night', data: [3, 4, 6, 12, 22] },
    ], ...base, labels: true },
    { title: 'Candlestick', type: 'candlestick', categories: weekCats, series: ohlcData, ...base },
    { title: 'Boxplot', type: 'boxplot', categories: cats, series: boxData, ...base },
    { title: 'Area range', type: 'arearange', categories: monthCats, series: rangeData, ...base },
    { title: 'Column range', type: 'columnrange', categories: monthCats, series: rangeData, ...base },
    { title: 'Dumbbell', type: 'dumbbell', categories: cats, series: [
        { name: '2025 → 2026', data: [[8, 14], [11, 19], [6, 12], [15, 22]] },
    ] as unknown as ChartSeries[], ...base },
    { title: 'Lollipop', type: 'lollipop', categories: cats, series: [revenue[0]], ...base, labels: true },
    { title: 'Histogram', type: 'histogram', categories: [], series: [
        { name: 'Samples', data: [3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 12] },
    ], ...base },
    { title: 'Pareto', type: 'pareto', categories: ['Late ship', 'Damage', 'Wrong item', 'Billing', 'Other'],
        series: [{ name: 'Complaints', data: [17, 42, 9, 24, 6] }], ...base },
    { title: 'Treemap', type: 'treemap', categories: [], series: [
        { data: [
            { name: 'Compute', value: 42 }, { name: 'Storage', value: 26 }, { name: 'Network', value: 14 },
            { name: 'Support', value: 10 }, { name: 'Other', value: 8 },
        ] },
    ], ...base, labels: true },
    { title: 'Sunburst', type: 'sunburst', categories: [], series: treeData, ...base, labels: true },
    { title: 'Icicle', type: 'icicle', categories: [], series: treeData, ...base, labels: true },
    { title: 'Sankey', type: 'sankey', categories: [], series: linkData, ...base, labels: true },
    { title: 'Dependency wheel', type: 'chord', categories: [], series: tradeData, ...base, labels: true },
    { title: 'Arc diagram', type: 'arcdiagram', categories: [], series: arcLinks, ...base, labels: true },
    { title: 'Drilldown (click a bar)', type: 'bar', categories: ['Americas', 'EMEA', 'APAC'],
        series: [{ name: 'Sales', data: [rnd(60, 90), rnd(45, 75), rnd(35, 60)] }], ...base, labels: true, drilldown: {
            Americas: { categories: ['US', 'CA', 'BR', 'MX'], series: [{ name: 'Sales', data: walk(4, 20, 10) }] },
            EMEA: { categories: ['DE', 'UK', 'FR', 'ES'], series: [{ name: 'Sales', data: walk(4, 15, 8) }] },
            APAC: { categories: ['CN', 'JP', 'IN', 'AU'], series: [{ name: 'Sales', data: walk(4, 13, 7) }] },
        } },
    { title: 'Annotations + bands', type: 'line', categories: months12,
        series: [{ name: 'Traffic', data: traffic }], ...base, markers: false, smooth: true,
        plotbands: [{ from: 40, to: 60, color: 'rgba(87,129,99,.12)', label: 'Target' }],
        plotlines: [{ value: 80, dashed: true, label: 'SLA' }],
        annotations: [{ x: 6, y: traffic[6], text: 'Launch' }] },
    { title: 'Packed bubble', type: 'packedbubble', categories: [], series: [
        { name: 'North', data: [{ name: 'NY', value: 40 }, { name: 'BOS', value: 22 }, { name: 'CHI', value: 30 }] },
        { name: 'South', data: [{ name: 'MIA', value: 26 }, { name: 'ATL', value: 18 }, { name: 'DAL', value: 34 }] },
    ] as unknown as ChartSeries[], ...base, labels: true },
    { title: 'Word cloud', type: 'wordcloud', categories: [], series: [
        { data: [
            { name: 'Lemonade', value: 90 }, { name: 'Reactive', value: 64 }, { name: 'Charts', value: 52 },
            { name: 'Components', value: 46 }, { name: 'Template', value: 38 }, { name: 'State', value: 34 },
            { name: 'Bindings', value: 30 }, { name: 'Signals', value: 26 }, { name: 'Props', value: 24 },
            { name: 'Events', value: 20 }, { name: 'Tooltips', value: 16 }, { name: 'Palette', value: 14 },
            { name: 'SVG', value: 12 }, { name: 'Flexbox', value: 10 }, { name: 'Zero deps', value: 8 },
        ] },
    ] as unknown as ChartSeries[], ...base },
];

const TYPES = ['bar', 'stackedbar', 'line', 'stackedarea', 'streamgraph', 'scatter', 'bubble', 'pie',
    'radar', 'radialbar', 'polararea', 'gauge', 'funnel', 'pyramid', 'waterfall', 'bullet',
    'lollipop', 'dumbbell', 'histogram', 'pareto', 'heatmap', 'candlestick', 'ohlc', 'boxplot',
    'arearange', 'columnrange', 'treemap', 'sunburst', 'icicle', 'sankey', 'chord', 'arcdiagram', 'packedbubble', 'wordcloud'];
const FLAGS: (keyof Cfg)[] = ['labels', 'legend', 'gridlines', 'animate', 'tooltip', 'markers',
    'smooth', 'step', 'area', 'horizontal', 'mirror', 'zoom', 'navigator', 'toolbar', 'ylog'];
const POSITIONS = ['', 'top', 'bottom', 'left', 'right'];

const App: Component = (_props, { state }) => {
    const charts = state<Cfg[]>(presets());
    const sel = state(0);
    const palette = state('lemonade');
    const theme = state('modern');
    const dark = state(false);
    const size = store(260); // chart height in px, all cards at once

    const applyTheme = () => {
        document.body.className = 'lm-theme-' + theme.value + (dark.value ? ' lm-dark-mode' : '');
    };

    const update = (patch: Partial<Cfg>) => {
        const list = charts.value.slice();
        list[sel.value] = { ...list[sel.value], ...patch };
        charts.value = list; // reassign → the grid re-renders with new props
    };

    const cur = () => charts.value[sel.value];

    return html`<div class="play">
        <div class="panel">
            <h1 style="font-size:18px;margin:0 0 2px">Chart playground</h1>
            <p style="font-size:12px;color:var(--lm-font-grayout);margin:0">Click a chart, then tweak it.</p>

            <h4>Theme</h4>
            <select onchange="${(e: Event) => { theme.value = (e.target as HTMLSelectElement).value; applyTheme(); }}">
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="soft">Soft</option>
            </select>
            <label><input type="checkbox"
                onchange="${(e: Event) => { dark.value = (e.target as HTMLInputElement).checked; applyTheme(); }}" /> Dark mode</label>

            <h4>Palette (all charts)</h4>
            <select onchange="${(e: Event) => (palette.value = (e.target as HTMLSelectElement).value)}">
                <option value="lemonade">lemonade</option>
                <option value="classic">classic</option>
                <option value="category10">category10</option>
                <option value="material">material</option>
                <option value="focus">focus</option>
            </select>

            <h4>Height (all charts) <span class="rangeval">${() => size.value + 'px'}</span></h4>
            <input type="range" min="180" max="460" step="20" value="${size}"
                oninput="${(e: Event) => (size.value = Number((e.target as HTMLInputElement).value))}" />

            ${() => html`<div>
                <h4>Selected — ${cur().title}</h4>
                <select onchange="${(e: Event) => update({ type: (e.target as HTMLSelectElement).value })}">
                    ${TYPES.map((t) => html`<option value="${t}" selected="${cur().type === t}">${t}</option>`)}
                </select>

                <h4>Legend position</h4>
                <select onchange="${(e: Event) => update({ legendposition: (e.target as HTMLSelectElement).value })}">
                    ${POSITIONS.map((p) => html`<option value="${p}" selected="${cur().legendposition === p}">${p || 'auto'}</option>`)}
                </select>

                <h4>Stack mode</h4>
                <select onchange="${(e: Event) => update({ stackmode: (e.target as HTMLSelectElement).value })}">
                    <option value="normal" selected="${cur().stackmode === 'normal'}">normal</option>
                    <option value="percent" selected="${cur().stackmode === 'percent'}">percent (100%)</option>
                </select>

                <h4>Donut hole <span class="rangeval">${Math.round(cur().innerradius * 100) + '%'}</span></h4>
                <input type="range" min="0" max="0.9" step="0.05" value="${cur().innerradius}"
                    oninput="${(e: Event) => update({ innerradius: Number((e.target as HTMLInputElement).value) })}" />

                <h4>Properties</h4>
                <div class="flags">${FLAGS.map((k) => html`<label><input type="checkbox" checked="${!!cur()[k]}"
                    onchange="${(e: Event) => update({ [k]: (e.target as HTMLInputElement).checked } as Partial<Cfg>)}" /> ${k}</label>`)}
                </div>

                <h4>Live props</h4>
                <pre class="props">${() => JSON.stringify(
                    { type: cur().type, palette: palette.value, height: size.value,
                      stackmode: cur().stackmode, legendposition: cur().legendposition || 'auto',
                      innerradius: cur().innerradius,
                      ...Object.fromEntries(FLAGS.map((k) => [k, !!cur()[k]])) }, null, 1)}</pre>
            </div>`}
        </div>

        <div class="grid">
            ${() => charts.value.map((c, i) => html`<div class="chart-card"
                data-selected="${() => (sel.value === i ? 'true' : 'false')}"
                onclick="${() => (sel.value = i)}">
                <${Chart} type="${c.type}" categories="${c.categories}" series="${c.series}"
                    title="${c.title}" palette="${c.palette || palette}" height="${size}"
                    labels="${c.labels}" legend="${c.legend}" gridlines="${c.gridlines}"
                    animate="${c.animate}" smooth="${c.smooth}" step="${c.step}" area="${c.area}"
                    horizontal="${c.horizontal}" markers="${c.markers}" tooltip="${c.tooltip}"
                    zoom="${c.zoom}" navigator="${c.navigator}" toolbar="${c.toolbar}" ylog="${c.ylog}"
                    stackmode="${c.stackmode}" legendposition="${c.legendposition}"
                    innerradius="${c.innerradius}" ymin="${c.ymin}" ymax="${c.ymax}"
                    plotbands="${c.plotbands}" plotlines="${c.plotlines}"
                    mirror="${c.mirror}" borderradius="${c.borderradius}" xtype="${c.xtype}"
                    valuesuffix="${c.valuesuffix}" annotations="${c.annotations}" drilldown="${c.drilldown}"
                    icon="${c.icon}" xtitle="${c.xtitle}" ytitle="${c.ytitle}" />
            </div>`)}
        </div>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
