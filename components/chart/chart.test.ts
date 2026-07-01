/**
 * <Chart /> block tests. The bar/stacked geometry is pure CSS (inline
 * height:%), so it is asserted as rendered strings; the pie is SVG paths,
 * asserted by count + the full-circle special case. Logic only — real
 * pixel geometry would be a Chrome probe, but heights and slice counts are
 * deterministic and jsdom-checkable.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Chart, { type ChartSeries } from '@lemonadejs/chart';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

// inline styles apply via the CSSOM → browser-normalized form; canonicalize
const styleN = (el: Element) =>
    (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;$/, '');

describe('components/chart', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Chart).pass).toBe(true);
    });

    it('mounts empty without throwing', () => {
        handle = t(Chart, {});
        expect(handle.query('.lm-chart')).toBeTruthy();
        // empty series defaults to a bar chart with no columns
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('bar');
    });

    it('line: one polyline + markers per series, plotted on the shared axis', () => {
        handle = t(Chart, {
            type: 'line', categories: ['A', 'B', 'C'],
            series: [{ name: 'S1', data: [2, 6, 4] }, { name: 'S2', data: [5, 1, 8] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('line');
        expect(handle.queryAll('.lm-chart-line').length).toBe(2);     // one path / series
        expect(handle.queryAll('.lm-chart-marker').length).toBe(6);   // 2 series × 3 points
        expect(handle.queryAll('.lm-chart-bar').length).toBe(0);      // no bars
        // first point sits at the first column centre = (0.5/3)*100 ≈ 16.67%
        expect(handle.query('.lm-chart-line')!.getAttribute('d')!.startsWith('M 16.67,')).toBe(true);
    });

    it('heatmap: a cell per row×col + a colour scale', () => {
        handle = t(Chart, {
            type: 'heatmap', categories: ['A', 'B'],
            series: [{ name: 'r1', data: [1, 5] }, { name: 'r2', data: [3, 9] }],
        });
        expect(handle.queryAll('.lm-chart-heat-cell').length).toBe(4);
        expect(handle.queryAll('.lm-chart-heat-rowlabel').length).toBe(2);
        expect(handle.query('.lm-chart-heat-bar')).toBeTruthy();
    });

    it('candlestick: a wick + body per point, sign-coloured', () => {
        handle = t(Chart, {
            type: 'candlestick', categories: ['Mon', 'Tue'],
            series: [{ data: [[20, 28, 18, 25], [25, 30, 24, 22]] }],
        });
        expect(handle.queryAll('.lm-chart-ohlc').length).toBe(2);
        expect(handle.queryAll('.lm-chart-ohlc-body').length).toBe(2);
        expect(handle.queryAll('.lm-chart-ohlc-wick').length).toBe(2);
    });

    it('boxplot: a box + median + whisker per category', () => {
        handle = t(Chart, { type: 'boxplot', categories: ['A'], series: [{ data: [[5, 18, 24, 30, 42]] }] });
        expect(handle.query('.lm-chart-box-rect')).toBeTruthy();
        expect(handle.query('.lm-chart-box-median')).toBeTruthy();
        expect(handle.query('.lm-chart-box-whisker')).toBeTruthy();
    });

    it('columnrange: a floating bar per [low,high]; arearange fills a band', () => {
        handle = t(Chart, { type: 'columnrange', categories: ['A', 'B'], series: [{ data: [[8, 16], [10, 19]] }] });
        expect(handle.queryAll('.lm-chart-range-bar').length).toBe(2);
        // value labels (low + high) render per category
        expect(handle.queryAll('.lm-chart-range-val').length).toBe(4);
        handle.unmount();
        handle = t(Chart, { type: 'arearange', categories: ['A', 'B'], series: [{ data: [[8, 16], [10, 19]] }] });
        expect(handle.query('.lm-chart-areafill')).toBeTruthy();
        // arearange has per-category hover marks (so tooltips work)
        expect(handle.queryAll('.lm-chart-range-mark').length).toBe(2);
    });

    it('lollipop: a stem + dot per point on the shared axis', () => {
        handle = t(Chart, { type: 'lollipop', categories: ['A', 'B', 'C'], series: [{ name: 'S', data: [5, 10, 7] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('lollipop');
        expect(handle.queryAll('.lm-chart-loll-dot').length).toBe(3);
        expect(handle.queryAll('.lm-chart-loll-stem').length).toBe(3);
        // peak 10 → niceMax 10 → that dot sits at the top, its stem is full height
        const dots = handle.queryAll('.lm-chart-loll-dot');
        expect(styleN(dots[1])).toContain('bottom:100%');
        expect(styleN(handle.queryAll('.lm-chart-loll-stem')[1])).toContain('height:100%');
        // single series → value labels on the dots
        expect(handle.queryAll('.lm-chart-loll-val').map((l) => l.textContent)).toEqual(['5', '10', '7']);
    });

    it('dumbbell: two dots + a connector per [low,high]', () => {
        handle = t(Chart, { type: 'dumbbell', categories: ['A', 'B'], series: [{ data: [[8, 16], [10, 19]] }] });
        expect(handle.queryAll('.lm-chart-dumbbell-link').length).toBe(2);
        expect(handle.queryAll('.lm-chart-dumbbell-dot').length).toBe(4);
        expect(handle.queryAll('.lm-chart-dumbbell-dot[data-end="hi"]').length).toBe(2);
        // value labels (low + high) render per category, like the range types
        expect(handle.queryAll('.lm-chart-range-val').length).toBe(4);
    });

    it('histogram: bins raw samples into count bars with range labels', () => {
        handle = t(Chart, { type: 'histogram', bins: 4, series: [{ data: [1, 2, 2, 3, 5, 6, 7, 8, 8, 9] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('histogram');
        // 10 samples over 1..9 in 4 bins of width 2 → counts 3,1,2,4
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars.length).toBe(4);
        expect(handle.queryAll('.lm-chart-value').map((l) => l.textContent)).toEqual(['3', '1', '2', '4']);
        // bin labels are ranges
        expect(handle.query('.lm-chart-cat-label')!.textContent).toBe('1–3');
        // no legend for a frequency chart
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('histogram: unset bins falls back to Sturges’ rule', () => {
        // 8 samples → ceil(log2(8)) + 1 = 4 bins
        handle = t(Chart, { type: 'histogram', series: [{ data: [1, 2, 3, 4, 5, 6, 7, 8] }] });
        expect(handle.queryAll('.lm-chart-col').length).toBe(4);
    });

    it('streamgraph: stacked ribbons centred on a midline, no strokes/markers', () => {
        handle = t(Chart, {
            type: 'streamgraph', categories: ['A', 'B', 'C'],
            series: [{ name: 'X', data: [2, 4, 3] }, { name: 'Y', data: [3, 1, 2] }],
        });
        expect(handle.queryAll('.lm-chart-areafill[data-stream="true"]').length).toBe(2);
        expect(handle.queryAll('.lm-chart-marker').length).toBe(0);
        expect(handle.queryAll('.lm-chart-line').length).toBe(0);
        // the silhouette hangs below the midline: the first band's top edge
        // starts in the lower half of the plot (y > 50)
        const d = handle.query('.lm-chart-areafill')!.getAttribute('d')!;
        const firstY = parseFloat(d.split(',')[1]);
        expect(firstY).toBeGreaterThan(50);
    });

    it('radialbar: one track + progress arc per point, legend from points', () => {
        handle = t(Chart, {
            type: 'radialbar', ymax: 100,
            series: [{ data: [{ name: 'A', value: 70 }, { name: 'B', value: 45 }] }],
        });
        expect(handle.queryAll('.lm-chart-radial-track').length).toBe(2);
        expect(handle.queryAll('.lm-chart-radial-arc').length).toBe(2);
        const names = handle.queryAll('.lm-chart-legend-name').map((n) => n.textContent);
        expect(names).toEqual(['A', 'B']);
    });

    it('radialbar: a single ring shows a big % centre (progress circle)', () => {
        handle = t(Chart, { type: 'radialbar', series: [{ data: [{ name: 'Done', value: 66 }] }] });
        expect(handle.query('.lm-chart-gauge-value')!.textContent).toBe('66%');
        expect(handle.query('.lm-chart-gauge-name')!.textContent).toBe('Done');
    });

    it('polararea: equal-angle wedges with radius scaled by value + grid rings', () => {
        handle = t(Chart, {
            type: 'polararea',
            series: [{ data: [{ name: 'N', value: 10 }, { name: 'E', value: 5 }, { name: 'S', value: 8 }] }],
        });
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(3);
        expect(handle.queryAll('circle.lm-chart-radar-ring').length).toBe(4);
    });

    it("polararea: 'rose' is accepted as an alias", () => {
        handle = t(Chart, { type: 'rose', series: [{ data: [{ name: 'A', value: 1 }, { name: 'B', value: 2 }] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('polararea');
    });

    it('sankey: node rects + one ribbon per link, labels on nodes', () => {
        handle = t(Chart, {
            type: 'sankey',
            series: [{ data: [
                { from: 'A', to: 'X', value: 5 },
                { from: 'B', to: 'X', value: 3 },
                { from: 'X', to: 'Y', value: 8 },
            ] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('sankey');
        expect(handle.queryAll('.lm-chart-sankey-node').length).toBe(4);  // A, B, X, Y
        expect(handle.queryAll('.lm-chart-sankey-link').length).toBe(3);
        expect(handle.queryAll('.lm-chart-sankey-label').map((l) => l.textContent).sort()).toEqual(['A', 'B', 'X', 'Y']);
        expect(handle.query('.lm-chart-legend')).toBeNull();
        // a11y table lists the links as From/To/Value rows
        const heads = [...handle.query('.lm-chart-a11y')!.querySelectorAll('th')].map((h) => h.textContent);
        expect(heads).toEqual(['From', 'To', 'Value']);
    });

    it('sankey: no complete links = No data', () => {
        handle = t(Chart, { type: 'sankey', series: [{ data: [{ name: 'A', value: 5 }] }] });
        expect(handle.query('.lm-chart-empty')).toBeTruthy();
    });

    it('chord: one arc per node + one ribbon per link; dependencywheel is an alias', () => {
        handle = t(Chart, {
            type: 'chord',
            series: [{ data: [
                { from: 'US', to: 'EU', value: 5 },
                { from: 'EU', to: 'Asia', value: 3 },
                { from: 'Asia', to: 'US', value: 4 },
            ] }],
        });
        expect(handle.queryAll('.lm-chart-chord-arc').length).toBe(3);
        expect(handle.queryAll('.lm-chart-chord-link').length).toBe(3);
        handle.unmount();
        handle = t(Chart, { type: 'dependencywheel', series: [{ data: [{ from: 'A', to: 'B', value: 1 }] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('chord');
    });

    it('sunburst: one cell per node; a lone root ring spans the full circle', () => {
        handle = t(Chart, {
            type: 'sunburst',
            series: [{ data: [
                { name: 'Root', value: 0 },
                { name: 'A', parent: 'Root', value: 6 },
                { name: 'B', parent: 'Root', value: 4 },
            ] }],
        });
        const cells = handle.queryAll('.lm-chart-sun-cell');
        expect(cells.length).toBe(3);
        // the single root spans 360° → drawn as an even-odd annulus (two subpaths)
        expect(cells[0].getAttribute('fill-rule')).toBe('evenodd');
        expect((cells[0].getAttribute('d')!.match(/M /g) || []).length).toBe(2);
    });

    it('icicle: root row spans the full width, children split it by totals', () => {
        handle = t(Chart, {
            type: 'icicle',
            series: [{ data: [
                { name: 'Root', value: 0 },
                { name: 'A', parent: 'Root', value: 75 },
                { name: 'B', parent: 'Root', value: 25 },
            ] }],
        });
        const tiles = handle.queryAll('.lm-chart-icicle-tile');
        expect(tiles.length).toBe(3);
        expect(styleN(tiles[0])).toContain('width:100%');   // root
        expect(styleN(tiles[1])).toContain('width:75%');    // A
        expect(styleN(tiles[2])).toContain('width:25%');    // B
    });

    it('packedbubble: one circle per point, radius grows with value', () => {
        handle = t(Chart, {
            type: 'packedbubble',
            series: [
                { name: 'G1', data: [{ name: 'a', value: 10 }, { name: 'b', value: 40 }] },
                { name: 'G2', data: [{ name: 'c', value: 20 }] },
            ],
        });
        const dots = handle.queryAll('.lm-chart-pack');
        expect(dots.length).toBe(3);
        const r = (el: Element) => parseFloat(el.getAttribute('r')!);
        expect(r(dots[1])).toBeGreaterThan(r(dots[0])); // 40 > 10
        // groups keep the series legend
        expect(handle.queryAll('.lm-chart-legend-name').map((n) => n.textContent)).toEqual(['G1', 'G2']);
    });

    it('pareto: sorts descending and adds a cumulative-% line on the right axis', () => {
        handle = t(Chart, {
            type: 'pareto', categories: ['Late', 'Damage', 'Wrong', 'Other'],
            series: [{ name: 'Complaints', data: [17, 42, 9, 24] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('pareto');
        // categories reordered by value desc
        const cats = handle.queryAll('.lm-chart-cat-label').map((c) => c.textContent);
        expect(cats).toEqual(['Damage', 'Other', 'Late', 'Wrong']);
        // one bar per category + the cumulative line on the secondary axis
        expect(handle.queryAll('.lm-chart-bar').length).toBe(4);
        expect(handle.queryAll('.lm-chart-line').length).toBe(1);
        expect(handle.query('.lm-chart-plot')!.getAttribute('data-right')).toBe('true');
        // legend names both series
        expect(handle.queryAll('.lm-chart-legend-name').map((n) => n.textContent)).toEqual(['Complaints', 'Cumulative %']);
    });

    it('pyramid: inverted funnel (reversed order)', () => {
        handle = t(Chart, {
            type: 'pyramid',
            series: [{ data: [{ name: 'Top', value: 100 }, { name: 'Bottom', value: 20 }] }],
        });
        expect(handle.queryAll('.lm-chart-funnel-seg').length).toBe(2);
    });

    it('bullet: a measure bar over bands + a target line', () => {
        handle = t(Chart, {
            type: 'bullet', ymin: 0, ymax: 100,
            plotbands: [{ from: 0, to: 50 }, { from: 50, to: 100 }],
            plotlines: [{ value: 85 }],
            series: [{ name: 'KPI', data: [72] }],
        });
        expect(handle.query('.lm-chart-bullet-measure')).toBeTruthy();
        expect(handle.queryAll('.lm-chart-bullet-band').length).toBe(2);
        expect(handle.query('.lm-chart-bullet-target')).toBeTruthy();
    });

    it('radar: one polygon per series + rings + spokes + category labels', () => {
        handle = t(Chart, {
            type: 'radar', categories: ['A', 'B', 'C'],
            series: [{ name: 'S1', data: [1, 2, 3] }, { name: 'S2', data: [3, 2, 1] }],
        });
        expect(handle.queryAll('.lm-chart-radar-area').length).toBe(2);
        expect(handle.queryAll('.lm-chart-radar-spoke').length).toBe(3);
        expect(handle.queryAll('.lm-chart-radar-label').length).toBe(3);
    });

    it('gauge: renders track + progress arc + centre value, no legend', () => {
        handle = t(Chart, { type: 'gauge', ymin: 0, ymax: 100, series: [{ name: 'Load', data: [73] }] });
        expect(handle.query('.lm-chart-gauge-value')!.textContent).toBe('73');
        expect(handle.query('.lm-chart-gauge-track')).toBeTruthy();
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('funnel: one trapezoid + label per stage', () => {
        handle = t(Chart, {
            type: 'funnel',
            series: [{ data: [{ name: 'A', value: 100 }, { name: 'B', value: 60 }, { name: 'C', value: 30 }] }],
        });
        expect(handle.queryAll('.lm-chart-funnel-seg').length).toBe(3);
        expect(handle.queryAll('.lm-chart-funnel-label').length).toBe(3);
    });

    it('waterfall: floating bars with running total, sign-coloured', () => {
        handle = t(Chart, {
            type: 'waterfall', categories: ['Start', 'Up', 'Down'],
            series: [{ data: [100, 50, -30] }],
        });
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars.length).toBe(3);
        // axis 0..nice(150); first bar floats 0→100, second 100→150, third 120→150
        expect(styleN(bars[0])).toContain('bottom:0.00%');
    });

    it('scatter: plots [x,y] points on numeric axes, no bars/lines', () => {
        handle = t(Chart, {
            type: 'scatter',
            series: [{ name: 'A', data: [[0, 0], [5, 10], [10, 5]] }],
        });
        expect(handle.queryAll('.lm-chart-dot').length).toBe(3);
        expect(handle.queryAll('.lm-chart-bar').length).toBe(0);
        const dots = handle.queryAll('.lm-chart-dot');
        // SVG circles: x=0 → cx 0%, y=0 → cy 100% (bottom)
        expect(dots[0].getAttribute('cx')).toBe('0.00%');
        expect(dots[0].getAttribute('cy')).toBe('100.00%');
    });

    it('scatter: extents pad past the data so edge points sit inside the plot', () => {
        // x 1..6 (no zero touch) → both extremes plotted off the plot edges
        handle = t(Chart, { type: 'scatter', series: [{ data: [[1, 4], [6, 9]] }] });
        const dots = handle.queryAll('.lm-chart-dot');
        expect(parseFloat(dots[0].getAttribute('cx')!)).toBeGreaterThan(0);
        expect(parseFloat(dots[1].getAttribute('cx')!)).toBeLessThan(100);
        expect(parseFloat(dots[1].getAttribute('cy')!)).toBeGreaterThan(0);
    });

    it('donut: innerradius accepts a percent (60 ≡ 0.6)', () => {
        const data = [{ name: 'A', value: 30 }, { name: 'B', value: 70 }];
        handle = t(Chart, { type: 'pie', innerradius: 0.6, series: [{ data }] });
        const fraction = handle.query('path.lm-chart-slice')!.getAttribute('d');
        handle.unmount();
        handle = t(Chart, { type: 'pie', innerradius: 60, series: [{ data }] });
        expect(handle.query('path.lm-chart-slice')!.getAttribute('d')).toBe(fraction);
    });

    it('bubble: dot radius scales with z', () => {
        handle = t(Chart, {
            type: 'bubble',
            series: [{ name: 'A', data: [[1, 1, 10], [2, 2, 100]] }],
        });
        const dots = handle.queryAll('.lm-chart-dot');
        const r = (el: Element) => parseFloat(el.getAttribute('r')!);
        expect(r(dots[1])).toBeGreaterThan(r(dots[0])); // bigger z → bigger radius
    });

    it('ylog: logarithmic y-axis places ticks at powers of 10', () => {
        handle = t(Chart, { type: 'bar', categories: ['A', 'B', 'C'], ylog: true, series: [{ data: [10, 100, 1000] }] });
        const ticks = handle.queryAll('.lm-chart-tick').map((tk) => tk.textContent);
        // axis spans 10..1000 → ticks 1k,100,10 (top to bottom)
        expect(ticks).toContain('1k');
        expect(ticks).toContain('100');
        expect(ticks).toContain('10');
    });

    it('annotations: a callout pinned to (x,y) data coords', () => {
        handle = t(Chart, {
            type: 'line', categories: ['A', 'B', 'C', 'D'], series: [{ data: [10, 20, 15, 25] }],
            annotations: [{ x: 1, y: 20, text: 'peak' }],
        });
        const anno = handle.query('.lm-chart-anno')!;
        expect(anno).toBeTruthy();
        expect(anno.querySelector('.lm-chart-anno-text')!.textContent).toBe('peak');
        // x=1 → column centre (1.5/4)*100 = 37.5%
        expect(styleN(anno)).toContain('left:37.5%');
    });

    it('toolbar: SVG button appears only for svg-native types', () => {
        handle = t(Chart, { type: 'pie', toolbar: true, series: [{ data: [{ name: 'A', value: 1 }] }] });
        expect(handle.queryAll('.lm-chart-tool').map((b) => b.textContent!.trim())).toEqual(['⤓ SVG', '⤓ CSV']);
        handle.unmount();
        handle = t(Chart, { type: 'bar', toolbar: true, categories: ['A'], series: [{ data: [1] }] });
        expect(handle.queryAll('.lm-chart-tool').map((b) => b.textContent!.trim())).toEqual(['⤓ CSV']);
    });

    it('drilldown: clicking a bar swaps to the sub-chart and shows a breadcrumb', () => {
        const events: any[] = [];
        handle = t(Chart, {
            type: 'bar', title: 'Top', categories: ['Fruit', 'Veg'],
            series: [{ data: [120, 80] }],
            drilldown: {
                Fruit: { title: 'Fruit', categories: ['Apple', 'Pear', 'Plum'], series: [{ data: [60, 40, 20] }] },
            },
            ondrilldown: (k: string, d: number) => events.push(['down', k, d]),
            ondrillup: (d: number) => events.push(['up', d]),
        });
        // top level: 2 bars, no breadcrumb
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
        expect(handle.query('.lm-chart-crumbs')).toBeNull();
        // click the "Fruit" bar → drill in
        handle.queryAll('.lm-chart-bar')[0].click();
        expect(handle.queryAll('.lm-chart-bar').length).toBe(3); // sub-chart's 3 bars
        expect(handle.query('.lm-chart-title')!.textContent).toBe('Fruit');
        expect(events).toEqual([['down', 'Fruit', 1]]);
        // breadcrumb: Home crumb + current; clicking Home climbs back
        const crumbs = handle.queryAll('.lm-chart-crumb');
        expect(crumbs[0].textContent).toBe('Top');
        (crumbs[0] as HTMLElement).click();
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
        expect(handle.query('.lm-chart-crumbs')).toBeNull();
        expect(events).toEqual([['down', 'Fruit', 1], ['up', 0]]);
    });

    it('drilldown: a category without an entry does not drill', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['Fruit', 'Veg'], series: [{ data: [120, 80] }],
            drilldown: { Fruit: { series: [{ data: [1, 2] }], categories: ['x', 'y'] } },
        });
        handle.queryAll('.lm-chart-bar')[1].click(); // Veg has no entry
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
        expect(handle.query('.lm-chart-crumbs')).toBeNull();
    });

    it('keyboard nav: the plot is focusable and arrow keys roam columns', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B', 'C'], series: [{ name: 'S', data: [10, 20, 30] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const cols = handle.query('.lm-chart-cols')!;
        expect(cols.getAttribute('tabindex')).toBe('0');
        expect(cols.getAttribute('role')).toBe('application');
        // no active column yet
        expect(handle.query('.lm-chart-kbtip')).toBeNull();
        // ArrowRight from nothing → first column active, tip shows
        cols.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        let tip = handle.query('.lm-chart-kbtip')!;
        expect(tip.querySelector('.lm-chart-kbtip-title')!.textContent).toBe('A');
        expect(tip.querySelector('.lm-chart-tip-value')!.textContent).toBe('10');
        // move right twice → column C
        cols.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        cols.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        tip = handle.query('.lm-chart-kbtip')!;
        expect(tip.querySelector('.lm-chart-kbtip-title')!.textContent).toBe('C');
        // Enter activates the focused point
        handle.query('.lm-chart-cols')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.value).toBe(30);
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 2 });
        // Escape clears the active column
        handle.query('.lm-chart-cols')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(handle.query('.lm-chart-kbtip')).toBeNull();
    });

    it('treemap: one tile per positive point, tiles tile the full area', () => {
        handle = t(Chart, {
            type: 'treemap', labels: true,
            series: [{ data: [{ name: 'A', value: 50 }, { name: 'B', value: 30 }, { name: 'C', value: 20 }, { name: 'Z', value: 0 }] }],
        });
        const tiles = handle.queryAll('.lm-chart-treemap-tile');
        expect(tiles.length).toBe(3); // the zero-value point is dropped
        // areas (w%×h%) should sum to ~100% of the box (allow rounding)
        const area = tiles.reduce((sum, el) => {
            const s = el.getAttribute('style')!;
            const w = parseFloat(/width:\s*([\d.]+)%/.exec(s)![1]);
            const h = parseFloat(/height:\s*([\d.]+)%/.exec(s)![1]);
            return sum + (w * h) / 100;
        }, 0);
        expect(area).toBeGreaterThan(98);
        expect(area).toBeLessThan(102);
        // biggest value A should be the largest tile
        expect(tiles[0].querySelector('.lm-chart-treemap-name')!.textContent).toBe('A');
    });

    it('treemap: clicking a tile drills in when a drilldown entry matches', () => {
        handle = t(Chart, {
            type: 'treemap', title: 'Top',
            series: [{ data: [{ name: 'Compute', value: 80 }, { name: 'Storage', value: 20 }] }],
            drilldown: { Compute: { title: 'Compute', type: 'treemap', series: [{ data: [{ name: 'EC2', value: 60 }, { name: 'Lambda', value: 20 }] }] } },
        });
        handle.queryAll('.lm-chart-treemap-tile')[0].click();
        expect(handle.query('.lm-chart-crumbs')).not.toBeNull();
        const names = handle.queryAll('.lm-chart-treemap-name').map((e) => e.textContent);
        expect(names).toContain('EC2');
    });

    it('sparkline: strips all chrome (no title/legend/axes), draws a single path + end dot', () => {
        handle = t(Chart, {
            type: 'line', sparkline: true, title: 'ignored', legend: true,
            categories: ['A', 'B', 'C'], series: [{ data: [1, 3, 2] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-spark')).toBe('true');
        expect(handle.query('.lm-chart-title')).toBeNull();
        expect(handle.query('.lm-chart-legend')).toBeNull();
        expect(handle.query('.lm-chart-xaxis')).toBeNull();
        expect(handle.query('.lm-chart-spark-path')).not.toBeNull();
        expect(handle.query('.lm-chart-spark-dot')).not.toBeNull();
        // a11y data table is still present
        expect(handle.query('.lm-chart-a11y')).not.toBeNull();
    });

    it('sparkline: bar kind renders one slot per point with a value label when labels set', () => {
        handle = t(Chart, { type: 'bar', sparkline: true, labels: true, series: [{ data: [4, 8, 6] }] });
        expect(handle.queryAll('.lm-chart-spark-slot').length).toBe(3);
        expect(handle.query('.lm-chart-spark-val')!.textContent).toBe('6'); // last value
    });

    it('step line: the path is stairs (only horizontal/vertical segments)', () => {
        handle = t(Chart, { type: 'line', step: true, categories: ['A', 'B', 'C'], series: [{ data: [10, 20, 15] }] });
        const d = handle.query('.lm-chart-line')!.getAttribute('d')!;
        // straight line A→B would be a single diagonal L; step inserts a corner at B's x with A's y
        // points: A=(16.67,..) B=(50,..) C=(83.33,..). Expect an L holding y across to x=50.
        expect(d).toMatch(/L 50\.00,/); // a vertical at B's x
        // a plain (non-step) line would not repeat the x for two consecutive L commands
        const ls = d.match(/L /g)!.length;
        expect(ls).toBe(4); // 2 segments × 2 commands each (hold + jump)
    });

    it('navigator: renders an overview strip with a full-width window by default', () => {
        handle = t(Chart, {
            type: 'line', navigator: true,
            categories: Array.from({ length: 10 }, (_, i) => 'D' + i),
            series: [{ data: Array.from({ length: 10 }, (_, i) => i) }],
        });
        expect(handle.query('.lm-chart-nav')).not.toBeNull();
        expect(handle.queryAll('.lm-chart-nav-line').length).toBe(1);
        const win = handle.query('.lm-chart-nav-win')!;
        // no zoom yet → window spans the full strip
        expect(styleN(win)).toContain('left:0%');
        expect(styleN(win)).toContain('width:100%');
        // dragging the left handle narrows the window → drives zoomRange → fewer bars
    });

    it('navigator: absent unless the prop is set', () => {
        handle = t(Chart, { type: 'line', categories: ['A', 'B'], series: [{ data: [1, 2] }] });
        expect(handle.query('.lm-chart-nav')).toBeNull();
    });

    it('marker shapes: per-series shape via data-shape', () => {
        handle = t(Chart, { type: 'line', categories: ['A', 'B'], series: [{ data: [1, 2], marker: 'triangle' }] });
        expect(handle.query('.lm-chart-marker')!.getAttribute('data-shape')).toBe('triangle');
    });

    it('plotlines axis:x → a vertical reference line at a category index', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B', 'C', 'D'], series: [{ data: [1, 2, 3, 4] }],
            plotlines: [{ value: 1, axis: 'x', label: 'event' }],
        });
        const line = handle.query('.lm-chart-plotline')!;
        expect(line.getAttribute('data-orient')).toBe('h'); // vertical line
        // value 1 → centre of column 1 = (1.5/4)*100 = 37.5%
        expect(styleN(line)).toContain('left:37.5%');
    });

    it('plotlines/plotbands: render reference lines + bands positioned by the scale', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'], series: [{ data: [5, 10] }],
            plotlines: [{ value: 5, label: 'Target' }],
            plotbands: [{ from: 2, to: 8 }],
        });
        const line = handle.query('.lm-chart-plotline')!;
        expect(line).toBeTruthy();
        // axis 0..10, value 5 → top 50%
        expect(styleN(line)).toContain('top:50%');
        expect(handle.query('.lm-chart-plotline-label')!.textContent).toBe('Target');
        const band = handle.query('.lm-chart-plotband')!;
        // 2..8 → top 20%, height 60%
        expect(styleN(band)).toContain('top:20%');
        expect(styleN(band)).toContain('height:60%');
    });

    it('stackedarea: one filled band per series, stacked cumulatively', () => {
        handle = t(Chart, {
            type: 'stackedarea', categories: ['A', 'B'],
            series: [{ name: 'X', data: [2, 4] }, { name: 'Y', data: [3, 1] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('stackedarea');
        expect(handle.queryAll('.lm-chart-areafill[data-stacked="true"]').length).toBe(2);
    });

    it('formatting: compact=false + thousands groups full numbers; decimals fixes places', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A'], compact: false, thousands: true,
            series: [{ data: [12500] }],
        });
        expect(handle.query('.lm-chart-value')!.textContent).toBe('12,500');
        handle.unmount();
        handle = t(Chart, { type: 'bar', categories: ['A'], decimals: 2, series: [{ data: [3.5] }] });
        expect(handle.query('.lm-chart-value')!.textContent).toBe('3.50');
    });

    it('tooltipformat: custom tooltip body replaces the default rows', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['Q1'], sharedtooltip: false,
            series: [{ name: 'S', data: [9] }],
            tooltipformat: (c: any) => 'custom:' + c.title + '=' + c.rows[0].value,
        });
        handle.query('.lm-chart-bar')!.dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }));
        const tip = handle.query('.lm-chart-tooltip')!;
        expect(tip.getAttribute('data-custom')).toBe('true');
        expect(tip.textContent).toBe('custom:Q1 · S=9');
    });

    it('combo: per-series type mixes bars and a line in one plot', () => {
        handle = t(Chart, {
            categories: ['A', 'B'],
            series: [
                { name: 'Rev', type: 'bar', data: [10, 20] },
                { name: 'Pct', type: 'line', data: [3, 6] },
            ],
        });
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);   // only the bar series
        expect(handle.queryAll('.lm-chart-line').length).toBe(1);  // only the line series
    });

    it('secondary axis: a right-axis series gets its own scale + right ticks', () => {
        handle = t(Chart, {
            categories: ['A', 'B'],
            series: [
                { name: 'Rev', type: 'bar', data: [100, 200] },
                { name: 'Pct', type: 'line', axis: 'right', data: [10, 50] },
            ],
        });
        expect(handle.query('.lm-chart-plot')!.getAttribute('data-right')).toBe('true');
        expect(handle.queryAll('.lm-chart-tick-r').length).toBeGreaterThan(0);
        // left + right axes share the same number of gridline rows
        expect(handle.queryAll('.lm-chart-gridline-r').length).toBe(handle.queryAll('.lm-chart-gridline').length);
    });

    it('area: fills under the line; gap (null) breaks into two paths', () => {
        handle = t(Chart, { type: 'line', area: true, categories: ['A', 'B', 'C'], series: [{ data: [1, 2, 3] }] });
        expect(handle.queryAll('.lm-chart-areafill').length).toBe(1);
        handle.unmount();
        // a null in the middle splits the line into two segments (paths)
        handle = t(Chart, { type: 'line', categories: ['A', 'B', 'C', 'D'], series: [{ data: [1, null, 3, 4] }] });
        expect(handle.queryAll('.lm-chart-line').length).toBe(2);
        expect(handle.queryAll('.lm-chart-marker').length).toBe(3); // null point has no marker
    });

    it('markers=false hides the line markers', () => {
        handle = t(Chart, { type: 'line', markers: false, categories: ['A', 'B'], series: [{ data: [1, 2] }] });
        expect(handle.queryAll('.lm-chart-marker').length).toBe(0);
        expect(handle.queryAll('.lm-chart-line').length).toBe(1);
    });

    it("line: 'lines' is accepted as an alias", () => {
        handle = t(Chart, { type: 'lines', categories: ['A'], series: [{ data: [1] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('line');
    });

    it('datetime axis: positions points by time + renders smart date ticks', () => {
        handle = t(Chart, {
            type: 'line', xtype: 'datetime',
            categories: ['2026-01-01', '2026-01-15', '2026-02-01', '2026-03-01'],
            series: [{ name: 'V', data: [10, 20, 15, 25] }],
        });
        // a continuous time axis (not category cells) + vertical gridlines
        expect(handle.query('.lm-chart-xtime')).toBeTruthy();
        expect(handle.query('.lm-chart-xaxis')).toBeNull();
        expect(handle.queryAll('.lm-chart-xtick').length).toBeGreaterThan(0);
        // the line point x's are NOT evenly spaced (Jan 1 → Jan 15 is closer than Jan 15 → Mar 1)
        const d = handle.query('.lm-chart-line')!.getAttribute('d')!;
        const xs = [...d.matchAll(/[ML]\s*([\d.]+),/g)].map((mm) => parseFloat(mm[1]));
        expect(xs[0]).toBe(0); // first point at x-min
        expect(xs[xs.length - 1]).toBeCloseTo(100, 0); // last at x-max
        expect(xs[1] - xs[0]).toBeLessThan(xs[2] - xs[1]); // uneven spacing (time-scaled)
    });

    it('line: clicking a marker fires onpointclick when tooltip is not shared', () => {
        let got: any = null;
        handle = t(Chart, {
            type: 'line', categories: ['A'], sharedtooltip: false,
            series: [{ name: 'S', data: [7] }],
            onpointclick: (p: any, m: any) => (got = { p, m }),
        });
        handle.query('.lm-chart-marker')!.click();
        expect(got.p.value).toBe(7);
        expect(got.m).toEqual({ seriesIndex: 0, pointIndex: 0 });
    });

    it('a11y: figure role + aria-label summary + hidden data table', () => {
        handle = t(Chart, {
            type: 'bar', title: 'Revenue', categories: ['Q1', 'Q2'],
            series: [{ name: 'A', data: [10, 20] }],
        });
        const root = handle.query('.lm-chart')!;
        expect(root.getAttribute('role')).toBe('figure');
        expect(root.getAttribute('aria-label')).toContain('Revenue');
        const table = handle.query('table.lm-chart-a11y')!;
        expect(table).toBeTruthy();
        // header carries the categories; the series row carries the values
        expect([...table.querySelectorAll('th')].map((h) => h.textContent)).toEqual(['Series', 'Q1', 'Q2']);
        expect([...table.querySelectorAll('tbody td')].map((d) => d.textContent)).toEqual(['A', '10', '20']);
    });

    it('toolbar: renders a CSV export button when toolbar=true', () => {
        handle = t(Chart, { type: 'bar', toolbar: true, categories: ['A'], series: [{ data: [1] }] });
        const btn = handle.query('.lm-chart-tool')!;
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('CSV');
        handle.unmount();
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [1] }] });
        expect(handle.query('.lm-chart-toolbar')).toBeNull();
    });

    it('empty: shows a No-data placeholder when there is nothing to draw', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [] });
        expect(handle.query('.lm-chart-empty')!.textContent).toBe('No data');
        expect(handle.query('.lm-chart-cols')).toBeNull();
        handle.unmount();
        // all-zero data is also "no data"
        handle = t(Chart, { type: 'pie', series: [{ data: [{ name: 'A', value: 0 }] }] });
        expect(handle.query('.lm-chart-empty')).toBeTruthy();
    });

    it('bar: one column per category, one bar per series, height = value/niceMax', () => {
        handle = t(Chart, {
            type: 'bar',
            categories: ['A', 'B'],
            series: [
                { name: 'S1', data: [5, 10] },
                { name: 'S2', data: [2, 8] },
            ] as ChartSeries[],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('bar');
        expect(handle.queryAll('.lm-chart-col').length).toBe(2);
        expect(handle.queryAll('.lm-chart-bar').length).toBe(4);
        // DOM order is column-major: [A/S1=5, A/S2=2, B/S1=10, B/S2=8]
        // peak value is 10 → niceMax(10) = 10, so the value-10 bar is 100%
        const bars = handle.queryAll('.lm-chart-bar');
        expect(styleN(bars[0])).toContain('height:50%');  // 5/10
        expect(styleN(bars[2])).toContain('height:100%'); // 10/10
    });

    it('horizontal: bars use left/width, categories move to the y-axis', () => {
        handle = t(Chart, {
            type: 'bar', horizontal: true, categories: ['A', 'B'],
            series: [{ data: [5, 10] }],
        });
        expect(handle.query('.lm-chart-plotblock')!.getAttribute('data-orient')).toBe('h');
        expect(handle.queryAll('.lm-chart-ycat').length).toBe(2);       // categories on the left
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars[0].getAttribute('data-orient')).toBe('h');
        // value 10 → niceMax 10 → full width; bars carry width/left, not height
        expect(styleN(bars[1])).toContain('width:100%');
        expect(styleN(bars[1])).toContain('left:0%');
        expect(styleN(bars[1])).not.toContain('height');
    });

    it('bar: labels render the value on each bar when labels=true', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], labels: true, series: [{ data: [7] }] });
        expect(handle.query('.lm-chart-value')!.textContent).toBe('7');
    });

    it('stackedbar: scales by the tallest stack total', () => {
        // column B total = 10 → niceMax(10)=10; segment 6 = 60%, 4 = 40%
        handle = t(Chart, {
            type: 'stackedbar',
            categories: ['A', 'B'],
            series: [{ data: [3, 6] }, { data: [2, 4] }],
        });
        expect(handle.query('.lm-chart-stack')!.getAttribute('data-stacked')).toBe('true');
        const bars = handle.queryAll('.lm-chart-col')[1].querySelectorAll('.lm-chart-bar');
        expect(styleN(bars[0])).toContain('height:60%');
        expect(styleN(bars[1])).toContain('height:40%');
    });

    it('stackedbar: labels render the value centered in each segment', () => {
        handle = t(Chart, {
            type: 'stackedbar', categories: ['A'], labels: true,
            series: [{ data: [30] }, { data: [70] }],
        });
        const labels = handle.queryAll('.lm-chart-value').map((l) => l.textContent);
        expect(labels).toEqual(['30', '70']);
    });

    it('stackedbar percent: columns fill 100%, segments show their share', () => {
        // column total = 60; shares 20/60=33%, 40/60=67% → heights 33.333/66.667%
        handle = t(Chart, {
            type: 'stackedbar', stackmode: 'percent', categories: ['A'], labels: true,
            series: [{ data: [20] }, { data: [40] }],
        });
        const bars = handle.queryAll('.lm-chart-bar');
        expect(styleN(bars[0])).toContain('height:33.33');
        expect(styleN(bars[1])).toContain('height:66.66');
        // axis top tick is 100%
        expect(handle.queryAll('.lm-chart-tick')[0].textContent).toBe('100%');
        // labels show the share, not the raw value
        expect(handle.queryAll('.lm-chart-value').map((l) => l.textContent)).toEqual(['33%', '67%']);
    });

    it('negatives: bars get a zero baseline and grow downward', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'],
            series: [{ name: 'P', data: [10, -10] }],
        });
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars[1].getAttribute('data-neg')).toBe('true');
        expect(bars[0].getAttribute('data-neg')).toBeNull();
        // scale is symmetric -10..10 → zero at 50%; +10 sits at bottom:50%, -10 below it
        expect(styleN(bars[0])).toContain('bottom:50%');
        expect(styleN(bars[1])).toContain('bottom:0%');
        // a zero gridline is flagged
        expect(handle.queryAll('.lm-chart-gridline[data-zero="true"]').length).toBe(1);
    });

    it('formatting: large axis ticks are compacted (k/M); valueformat overrides', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [3_400_000] }] });
        const ticks = handle.queryAll('.lm-chart-tick').map((tk) => tk.textContent);
        expect(ticks.some((s) => /M$/.test(s!))).toBe(true); // e.g. "4M"
        handle.unmount();
        handle = t(Chart, {
            type: 'bar', categories: ['A'], labels: true,
            series: [{ data: [1000] }],
            valueformat: (n: number) => '$' + n,
        });
        expect(handle.query('.lm-chart-value')!.textContent).toBe('$1000');
    });

    it('ymin/ymax: forces the axis range and sizes bars to it', () => {
        // axis 0..20; value 10 → exactly half height, value 20 → full
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'], ymin: 0, ymax: 20,
            series: [{ data: [10, 20] }],
        });
        const bars = handle.queryAll('.lm-chart-bar');
        expect(styleN(bars[0])).toContain('height:50%');
        expect(styleN(bars[1])).toContain('height:100%');
        // top tick reflects the forced max
        expect(handle.queryAll('.lm-chart-tick')[0].textContent).toBe('20');
    });

    it('ymin above zero: bars grow from the axis bottom, not zero', () => {
        // axis 5..25; value 15 → (15-5)/20 = 50% tall, sitting on the bottom
        handle = t(Chart, {
            type: 'bar', categories: ['A'], ymin: 5, ymax: 25,
            series: [{ data: [15] }],
        });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('bottom:0%');
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('height:50%');
    });

    it('pie: one path per non-zero slice, legend names from points', () => {
        handle = t(Chart, {
            type: 'pie',
            series: [{ data: [{ name: 'X', value: 30 }, { name: 'Y', value: 70 }, { name: 'Z', value: 0 }] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('pie');
        expect(handle.queryAll('.lm-chart-slice').length).toBe(2); // zero slice skipped
        const names = handle.queryAll('.lm-chart-legend-name').map((n) => n.textContent);
        expect(names).toEqual(['X', 'Y', 'Z']);
    });

    it('pie labels: large slices inside, small slices get external label + leader', () => {
        handle = t(Chart, {
            type: 'pie', labels: true,
            series: [{ data: [
                { name: 'Big', value: 94 },
                { name: 'Small', value: 2 },
                { name: 'Tiny', value: 4 },
            ] }],
        });
        expect(handle.queryAll('.lm-chart-pie-label').length).toBe(1);   // Big (94%) inside
        expect(handle.queryAll('.lm-chart-pie-olabel').length).toBe(2);  // Small + Tiny outside
        expect(handle.queryAll('.lm-chart-leader').length).toBe(2);      // one leader each
    });

    it('donut: innerRadius renders ring paths and a centre total', () => {
        handle = t(Chart, {
            type: 'pie', innerradius: 0.6, labels: true,
            series: [{ data: [{ name: 'A', value: 30 }, { name: 'B', value: 70 }] }],
        });
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(2);
        // ring paths carry two arc commands (outer + inner), not the wedge's "L 50 50"
        expect(handle.query('path.lm-chart-slice')!.getAttribute('d')).not.toContain('L 50 50');
        expect(handle.query('.lm-chart-donut-center')!.textContent).toBe('100');
    });

    it('pie: a single 100% slice draws a full circle, not an arc', () => {
        handle = t(Chart, { type: 'pie', series: [{ data: [{ name: 'Only', value: 5 }] }] });
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(0); // no arc
        expect(handle.queryAll('circle').length).toBe(1);              // full circle instead
    });

    it('palette: named built-in colours the bars; custom colors override it', () => {
        // tableau[0] = #4e79a7 → rgb(78,121,167)
        handle = t(Chart, { type: 'bar', categories: ['A'], palette: 'tableau', series: [{ data: [1] }] });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('background:rgb(78, 121, 167)');
        handle.unmount();
        // category10[0] = #1f77b4 → rgb(31,119,180)
        handle = t(Chart, { type: 'bar', categories: ['A'], palette: 'category10', series: [{ data: [1] }] });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('background:rgb(31, 119, 180)');
        handle.unmount();
        // custom colors win over the named palette
        handle = t(Chart, {
            type: 'bar', categories: ['A'], palette: 'tableau',
            colors: ['#000000'], series: [{ data: [1] }],
        });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('background:rgb(0, 0, 0)');
    });

    it('shared tooltip: hovering a column lists every series; leaving hides it', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['Q1'],
            series: [{ name: 'A', data: [9] }, { name: 'B', data: [4] }],
        });
        expect(handle.query('.lm-chart-tooltip')).toBeNull();
        const col = handle.query('.lm-chart-col')!;
        col.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }));
        const tip = handle.query('.lm-chart-tooltip')!;
        expect(tip.querySelector('.lm-chart-tip-title')!.textContent).toBe('Q1');
        const rows = [...tip.querySelectorAll('.lm-chart-tip-row')].map(
            (r) => [r.querySelector('.lm-chart-tip-name')!.textContent, r.querySelector('.lm-chart-tip-value')!.textContent]);
        expect(rows).toEqual([['A', '9'], ['B', '4']]);
        // the hovered column band lights up
        expect(handle.query('.lm-chart-band[data-on="true"]')).toBeTruthy();
        col.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        expect(handle.query('.lm-chart-tooltip')).toBeNull();
    });

    it('per-bar tooltip when sharedtooltip=false', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['Q1'], sharedtooltip: false,
            series: [{ name: 'S', data: [9] }],
        });
        handle.query('.lm-chart-bar')!.dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 50 }));
        const tip = handle.query('.lm-chart-tooltip')!;
        expect(tip.querySelector('.lm-chart-tip-title')!.textContent).toBe('Q1 · S');
        expect(tip.querySelector('.lm-chart-tip-value')!.textContent).toBe('9');
    });

    it('tooltip=false suppresses the overlay on hover', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], tooltip: false, series: [{ data: [3] }] });
        handle.query('.lm-chart-col')!.dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }));
        expect(handle.query('.lm-chart-tooltip')).toBeNull();
    });

    it('legend: clicking a series entry hides its bars and rescales', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A'],
            series: [{ name: 'S1', data: [5] }, { name: 'S2', data: [10] }],
        });
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
        const buttons = handle.queryAll('.lm-chart-legend-item');
        expect(buttons[0].tagName).toBe('BUTTON');
        // hide S2 (the value-10 series) → only S1's bar remains, and it rescales
        buttons[1].click();
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars.length).toBe(1);
        // peak is now 5 → niceMax(5)=5 → S1 bar is 100%
        expect(styleN(bars[0])).toContain('height:100%');
        // legend still shows both entries; S2 marked hidden
        const after = handle.queryAll('.lm-chart-legend-item');
        expect(after.length).toBe(2);
        expect(after[1].getAttribute('data-hidden')).toBe('true');
        expect(after[1].getAttribute('aria-pressed')).toBe('false');
        // clicking again restores it
        after[1].click();
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
    });

    it('legend: hiding a pie slice renormalises the rest', () => {
        handle = t(Chart, {
            type: 'pie',
            series: [{ data: [{ name: 'A', value: 50 }, { name: 'B', value: 50 }] }],
        });
        expect(handle.queryAll('.lm-chart-slice').length).toBe(2);
        // hide A → B becomes the only slice → a full circle (100%)
        handle.queryAll('.lm-chart-legend-item')[0].click();
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(0);
        expect(handle.queryAll('circle').length).toBe(1);
    });

    it('onlegendclick fires with the key and resulting visibility', () => {
        const calls: any[] = [];
        handle = t(Chart, {
            type: 'bar', categories: ['A'], series: [{ name: 'S1', data: [1] }],
            onlegendclick: (key: string, visible: boolean) => calls.push([key, visible]),
        });
        handle.query('.lm-chart-legend-item')!.click();
        expect(calls).toEqual([['S1', false]]); // toggled off → not visible
    });

    it('animate flag toggles the data-animate hook', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [1] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-animate')).toBe('true');
        handle.unmount();
        handle = t(Chart, { type: 'bar', categories: ['A'], animate: false, series: [{ data: [1] }] });
        expect(handle.query('.lm-chart')!.getAttribute('data-animate')).toBeNull();
    });

    it('axis titles + legend placement render in the right regions', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A'], series: [{ name: 'S', data: [1] }],
            xtitle: 'Quarter', ytitle: 'Revenue', legendposition: 'right',
        });
        expect(handle.query('.lm-chart-ytitle')!.textContent).toContain('Revenue');
        expect(handle.query('.lm-chart-xtitle')!.textContent).toContain('Quarter');
        expect(handle.query('.lm-chart-content')!.getAttribute('data-legend')).toBe('right');
        // pie defaults to a side legend, bars to bottom
        handle.unmount();
        handle = t(Chart, { type: 'pie', series: [{ data: [{ name: 'A', value: 1 }] }] });
        expect(handle.query('.lm-chart-content')!.getAttribute('data-legend')).toBe('right');
    });

    it('many categories trigger rotated x labels', () => {
        handle = t(Chart, {
            type: 'bar',
            categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
            series: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9] }],
        });
        expect(handle.query('.lm-chart-xaxis')!.getAttribute('data-rotate')).toBe('true');
    });

    it('labelrotation forces the x-label angle; subtitle renders', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'], labelrotation: 90, subtitle: 'fiscal 2026',
            series: [{ data: [1, 2] }],
        });
        expect(handle.query('.lm-chart-xaxis')!.getAttribute('data-rotate')).toBe('true');
        expect(handle.query('.lm-chart-xaxis')!.getAttribute('style')).toContain('-90deg');
        expect(handle.query('.lm-chart-cat-label')).toBeTruthy();
        expect(handle.query('.lm-chart-subtitle')!.textContent).toBe('fiscal 2026');
    });

    it('labelrotation=0 disables auto-rotation even when crowded', () => {
        handle = t(Chart, {
            type: 'bar', labelrotation: 0,
            categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            series: [{ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
        });
        expect(handle.query('.lm-chart-xaxis')!.getAttribute('data-rotate')).toBe(null);
    });

    it('valueprefix/valuesuffix wrap formatted values on ticks and labels', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A'], labels: true,
            valueprefix: '$', valuesuffix: ' M', series: [{ data: [12] }],
        });
        expect(handle.query('.lm-chart-value')!.textContent).toBe('$12 M');
        expect(handle.queryAll('.lm-chart-tick').some((tk) => /^\$.* M$/.test(tk.textContent!))).toBe(true);
    });

    it('gridlines=false hides the lines but keeps ticks + baseline', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], gridlines: false, series: [{ data: [5] }] });
        expect(handle.query('.lm-chart-grid')!.getAttribute('data-off')).toBe('true');
        expect(handle.queryAll('.lm-chart-tick').length).toBeGreaterThan(0);
    });

    it('legend hides when legend=false', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], legend: false, series: [{ data: [1] }] });
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('onpointclick fires with the point and its position', () => {
        let got: any = null;
        handle = t(Chart, {
            type: 'bar',
            categories: ['A'],
            series: [{ name: 'S', data: [4] }],
            onpointclick: (p: any, m: any) => (got = { p, m }),
        });
        handle.query('.lm-chart-bar')!.click();
        expect(got.p.value).toBe(4);
        expect(got.m).toEqual({ seriesIndex: 0, pointIndex: 0 });
    });

    it('rebuilds the scene when a single prop is reassigned', () => {
        const type = store<'bar' | 'pie'>('bar');
        const series = store<ChartSeries[]>([{ data: [1] }]);
        handle = t(Chart, { type, categories: ['A'], series });
        expect(handle.queryAll('.lm-chart-bar').length).toBe(1);
        type.value = 'pie';
        series.value = [{ data: [{ name: 'A', value: 1 }, { name: 'B', value: 1 }] }];
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('pie');
        expect(handle.queryAll('.lm-chart-slice').length).toBe(2);
    });
});
