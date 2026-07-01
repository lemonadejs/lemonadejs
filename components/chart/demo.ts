/**
 * <Chart /> playground — a properties panel (left) + a live card for
 * EVERY chart type (right). Click a chart to select it, then switch its
 * type or toggle props and watch the per-prop reactivity. Theme, palette
 * and height apply to every chart at once.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Chart, { type ChartSeries } from '@lemonadejs/chart';

/* ---- shared data sets ---- */
const cats = ['Q1', 'Q2', 'Q3', 'Q4'];
const revenue: ChartSeries[] = [
    { name: 'Product A', data: [12, 19, 8, 22] },
    { name: 'Product B', data: [7, 11, 14, 9] },
    { name: 'Product C', data: [4, 6, 10, 13] },
];
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
    { title: 'Radial bar', type: 'radialbar', categories: [], series: pieData, ...base },
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
    { title: 'Scatter', type: 'scatter', categories: [], series: scatterData, ...base },
    { title: 'Bubble', type: 'bubble', categories: [], series: bubbleData, ...base },
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
    { title: 'Packed bubble', type: 'packedbubble', categories: [], series: [
        { name: 'North', data: [{ name: 'NY', value: 40 }, { name: 'BOS', value: 22 }, { name: 'CHI', value: 30 }] },
        { name: 'South', data: [{ name: 'MIA', value: 26 }, { name: 'ATL', value: 18 }, { name: 'DAL', value: 34 }] },
    ] as unknown as ChartSeries[], ...base, labels: true },
];

const TYPES = ['bar', 'stackedbar', 'line', 'stackedarea', 'streamgraph', 'scatter', 'bubble', 'pie',
    'radar', 'radialbar', 'polararea', 'gauge', 'funnel', 'pyramid', 'waterfall', 'bullet',
    'lollipop', 'dumbbell', 'histogram', 'pareto', 'heatmap', 'candlestick', 'ohlc', 'boxplot',
    'arearange', 'columnrange', 'treemap', 'sunburst', 'icicle', 'sankey', 'chord', 'packedbubble'];
const FLAGS: (keyof Cfg)[] = ['labels', 'legend', 'gridlines', 'animate', 'tooltip', 'markers',
    'smooth', 'step', 'area', 'horizontal', 'zoom', 'navigator', 'toolbar', 'ylog'];
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
                <option value="tableau">tableau</option>
                <option value="category10">category10</option>
                <option value="material">material</option>
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
                    title="${c.title}" palette="${palette}" height="${size}"
                    labels="${c.labels}" legend="${c.legend}" gridlines="${c.gridlines}"
                    animate="${c.animate}" smooth="${c.smooth}" step="${c.step}" area="${c.area}"
                    horizontal="${c.horizontal}" markers="${c.markers}" tooltip="${c.tooltip}"
                    zoom="${c.zoom}" navigator="${c.navigator}" toolbar="${c.toolbar}" ylog="${c.ylog}"
                    stackmode="${c.stackmode}" legendposition="${c.legendposition}"
                    innerradius="${c.innerradius}" ymin="${c.ymin}" ymax="${c.ymax}"
                    plotbands="${c.plotbands}" plotlines="${c.plotlines}" />
            </div>`)}
        </div>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
