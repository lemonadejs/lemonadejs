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
import Chart, { type ChartSeries } from '@lemonadejs/charts';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

// inline styles apply via the CSSOM → browser-normalized form; canonicalize
const styleN = (el: Element) =>
    (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;$/, '');

describe('components/charts', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Chart).pass).toBe(true);
    });

    it('element objects: title/subtitle/legend/axes carry their text and font', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'], series: [{ name: 's', data: [1, 2] }],
            title: { text: 'Sales', font: { size: 35, color: '#595959', bold: false } },
            subtitle: { text: '2026', font: { italic: true } },
            legend: { position: 'top', title: 'Key', font: { size: '12px', family: 'Georgia; color:red' }, titlefont: { color: 'teal' } },
            xaxis: { title: 'Month', titlefont: { size: 13 }, font: { color: 'blue' } },
            yaxis: { title: 'Revenue', font: { size: 20 } },
            y2axis: { titlefont: { color: '#111111' } },
        });
        expect(handle.query('.lm-chart-title')!.textContent).toBe('Sales');
        expect(handle.query('.lm-chart-subtitle')!.textContent).toBe('2026');
        expect(handle.query('.lm-chart-legend-title')!.textContent).toBe('Key');
        expect(handle.query('.lm-chart-content')!.getAttribute('data-legend')).toBe('top');
        expect(handle.query('.lm-chart-xtitle')!.textContent).toBe('Month');
        expect(handle.query('.lm-chart-ytitle')!.textContent).toBe('Revenue');
        const st = styleN(handle.query('.lm-chart')!);
        expect(st).toContain('--lm-chart-title-size:35px');
        expect(st).toContain('--lm-chart-title-color:#595959');
        expect(st).toContain('--lm-chart-title-weight:normal');
        expect(st).toContain('--lm-chart-subtitle-style:italic');
        expect(st).toContain('--lm-chart-legend-size:12px');
        expect(st).toContain('--lm-chart-legend-family:Georgia color:red'); // ';' stripped
        expect(st).toContain('--lm-chart-legendtitle-color:teal');
        expect(st).toContain('--lm-chart-xtitle-size:13px');
        expect(st).toContain('--lm-chart-xlabels-color:blue');
        expect(st).toContain('--lm-chart-ylabels-size:20px');
        expect(st).toContain('--lm-chart-y2title-color:#111111');
        // the y-label size widens the left gutter
        expect(styleN(handle.query('.lm-chart-plotblock')!)).toMatch(/--lm-chart-gutter:\d+px/);
    });

    it('element objects: the plain forms and the flat props still work', () => {
        handle = t(Chart, {
            type: 'bar', title: 'T', subtitle: 'S', legendtitle: 'K', legendposition: 'left',
            xtitle: 'X', ytitle: 'Y', categories: ['A'], series: [{ name: 's', data: [1] }],
        });
        expect(handle.query('.lm-chart-title')!.textContent).toBe('T');
        expect(handle.query('.lm-chart-subtitle')!.textContent).toBe('S');
        expect(handle.query('.lm-chart-legend-title')!.textContent).toBe('K');
        expect(handle.query('.lm-chart-content')!.getAttribute('data-legend')).toBe('left');
        expect(handle.query('.lm-chart-xtitle')!.textContent).toBe('X');
        expect(styleN(handle.query('.lm-chart')!)).not.toContain('--lm-chart-');
        expect(handle.query('.lm-chart-plotblock')!.getAttribute('style') || '').not.toContain('gutter');
    });

    it('axis labels: false hides the tick labels per physical axis', () => {
        const series = [{ name: 'a', data: [1, 2] }, { name: 'b', type: 'line', axis: 'right', data: [5, 9] }];
        handle = t(Chart, { type: 'bar', categories: ['A', 'B'], series,
            xaxis: { labels: false }, yaxis: { labels: false, title: 'Y' }, y2axis: { labels: false } });
        expect(handle.query('.lm-chart-xaxis')).toBeNull();
        expect(handle.query('.lm-chart-tick')).toBeNull();
        expect(handle.query('.lm-chart-grid-right')).toBeNull();
        expect(handle.query('.lm-chart-plot')!.getAttribute('data-right')).toBeNull();
        expect(handle.query('.lm-chart-gridline')).not.toBeNull(); // the grid stays
        expect(handle.query('.lm-chart-ytitle')!.textContent).toBe('Y'); // the title stays
        expect(styleN(handle.query('.lm-chart-plotblock')!)).toContain('--lm-chart-gutter:var(--lm-chart-pad-r)');
        handle.unmount();
        // y2 labels on: the right axis is back
        handle = t(Chart, { type: 'bar', categories: ['A', 'B'], series, yaxis: { labels: false } });
        expect(handle.query('.lm-chart-grid-right')).not.toBeNull();
        expect(handle.query('.lm-chart-xaxis')).not.toBeNull();
    });

    it('axis labels: horizontal bars hide the categories (y) and values (x)', () => {
        handle = t(Chart, { type: 'bar', horizontal: true, categories: ['A', 'B'], series: [{ name: 'a', data: [1, 2] }],
            xaxis: { labels: false }, yaxis: { labels: false } });
        expect(handle.query('.lm-chart-ycats')).toBeNull();
        expect(handle.query('.lm-chart-xvalues')).toBeNull();
        expect(styleN(handle.query('.lm-chart-plotblock')!)).toContain('--lm-ycats-w:0px');
    });

    it('axis labels: scatter, waterfall and boxplot honour labels: false', () => {
        for (const def of [
            { type: 'scatter', series: [{ name: 's', data: [[0, 1], [5, 3]] }] },
            { type: 'waterfall', categories: ['A', 'B'], series: [{ name: 's', data: [3, -1] }] },
            { type: 'boxplot', categories: ['A'], series: [{ name: 's', data: [[1, 2, 3, 4, 5]] }] },
        ]) {
            handle = t(Chart, { ...def, xaxis: { labels: false }, yaxis: { labels: false } });
            expect(handle.query('.lm-chart-tick'), def.type).toBeNull();
            expect(handle.query('.lm-chart-xaxis') || handle.query('.lm-chart-xvalues'), def.type).toBeNull();
            handle.unmount();
            handle = null;
        }
    });

    it('axis grid: color/width/dash become per-axis CSS variables; category lines opt in', () => {
        handle = t(Chart, { type: 'bar', categories: ['A', 'B'], series: [{ name: 's', data: [1, 2] }],
            xaxis: { grid: { color: '#ff0000', width: 2, dash: 'dotted' } },
            yaxis: { grid: { color: 'blue; x', dash: 'dashdot' } } });
        const root = handle.query('.lm-chart')!;
        const st = styleN(root);
        expect(st).toContain('--lm-chart-xgrid-color:#ff0000');
        expect(st).toContain('--lm-chart-xgrid-width:2px');
        expect(st).toContain('--lm-chart-xgrid-style:dotted');
        expect(st).toContain('--lm-chart-ygrid-color:blue x'); // ';' stripped
        expect(st).toContain('--lm-chart-ygrid-style:dashed'); // no CSS dash-dot
        expect(root.getAttribute('data-xcatgrid')).toBe('true');
        expect(root.getAttribute('data-ycatgrid')).toBe('true');
    });

    it('axis grid: show false hides, show true overrides gridlines: false, unset changes nothing', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ name: 's', data: [1] }] });
        let root = handle.query('.lm-chart')!;
        expect(styleN(root)).not.toContain('grid');
        expect(root.getAttribute('data-xcatgrid')).toBeNull();
        handle.unmount();
        handle = t(Chart, { type: 'bar', gridlines: false, categories: ['A'], series: [{ name: 's', data: [1] }],
            xaxis: { grid: { show: false, color: 'red' } }, yaxis: { grid: { show: true } } });
        root = handle.query('.lm-chart')!;
        expect(styleN(root)).toContain('--lm-chart-xgrid-color:transparent');
        expect(styleN(root)).toContain('--lm-chart-ygrid-forced:var(--lm-chart-grid)');
        expect(root.getAttribute('data-xcatgrid')).toBeNull(); // show: false = no category lines
        expect(handle.query('.lm-chart-grid')!.getAttribute('data-off')).toBe('true');
        expect(handle.query('.lm-chart-tick')).not.toBeNull(); // ticks stay
    });

    it('yaxis.reverse: vertical values grow downwards; horizontal bars put the first category at the bottom', () => {
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [100] }], ymin: 0, ymax: 100, ystep: 50, yaxis: { reverse: true } });
        expect(handle.queryAll('.lm-chart-tick').map((e) => e.textContent)).toEqual(['0', '50', '100']);
        handle.unmount();
        for (const opt of [{ yaxis: { reverse: true } }, { yreverse: true }]) {
            handle = t(Chart, { type: 'bar', horizontal: true, categories: ['A', 'B'], series: [{ name: 's', data: [1, 2] }], ...opt });
            expect(handle.query('.lm-chart-ycats')!.getAttribute('data-reverse')).toBe('true');
            expect(handle.query('.lm-chart-cols')!.getAttribute('data-reverse')).toBe('true');
            // the DOM keeps the data order (events, a11y)
            expect(handle.queryAll('.lm-chart-ycat').map((e) => e.textContent)).toEqual(['A', 'B']);
            // the value axis (x) is not flipped
            const vals = handle.queryAll('.lm-chart-xval').map((e) => Number(e.textContent));
            expect(vals[0]).toBeLessThan(vals[vals.length - 1]);
            handle.unmount();
        }
        // vertical: the bars hang from the top (positive height, not collapsed)
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ name: 's', data: [50] }], ymin: 0, ymax: 100, yreverse: true });
        expect(styleN(handle.query('.lm-chart-bar')!)).toMatch(/bottom:50%;height:50%/);
        handle.unmount();
        handle = t(Chart, { type: 'stackedbar', categories: ['A'], series: [{ name: 's', data: [25] }, { name: 'r', data: [25] }], ymin: 0, ymax: 100, yreverse: true });
        expect(handle.queryAll('.lm-chart-bar').map((e) => styleN(e).match(/bottom:[\d.]+%;height:[\d.]+%/)![0]))
            .toEqual(['bottom:75%;height:25%', 'bottom:50%;height:25%']);
        handle.unmount();
        // yaxis.reverse: false wins over yreverse
        handle = t(Chart, { type: 'bar', horizontal: true, yreverse: true, yaxis: { reverse: false }, categories: ['A'], series: [{ name: 's', data: [1] }] });
        expect(handle.query('.lm-chart-ycats')!.getAttribute('data-reverse')).toBeNull();
    });

    it('xaxis.reverse: vertical categories run right to left; clicks keep the data index', () => {
        const clicks: number[] = [];
        handle = t(Chart, { type: 'bar', categories: ['A', 'B', 'C'], series: [{ name: 's', data: [1, 2, 3] }],
            xaxis: { reverse: true }, onpointclick: (_p: unknown, at: { pointIndex: number }) => clicks.push(at.pointIndex) });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent)).toEqual(['C', 'B', 'A']);
        const bars = handle.queryAll('.lm-chart-bar');
        (bars[0] as HTMLElement).click(); // the leftmost bar is C
        expect(clicks).toEqual([2]);
        // the hidden a11y table keeps the data order
        expect(handle.queryAll('.lm-chart-a11y thead th').map((e) => e.textContent)).toEqual(['Series', 'A', 'B', 'C']);
    });

    it('xaxis.reverse: horizontal bars grow leftwards; boxplot and waterfall reverse too', () => {
        handle = t(Chart, { type: 'bar', horizontal: true, categories: ['A'], series: [{ name: 's', data: [50] }], xmin: 0, ymin: 0, ymax: 100, xaxis: { reverse: true } });
        const vals = handle.queryAll('.lm-chart-xval').map((e) => Number(e.textContent));
        expect(vals[0]).toBeGreaterThan(vals[vals.length - 1]);
        expect(handle.queryAll('.lm-chart-ycat').map((e) => e.textContent)).toEqual(['A']); // categories untouched
        handle.unmount();
        handle = t(Chart, { type: 'boxplot', categories: ['A', 'B'], series: [{ name: 's', data: [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]] }], xaxis: { reverse: true } });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent)).toEqual(['B', 'A']);
        handle.unmount();
        handle = t(Chart, { type: 'waterfall', categories: ['A', 'B', 'C'], series: [{ name: 's', data: [5, -2, 4] }], xaxis: { reverse: true } });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent)).toEqual(['C', 'B', 'A']);
        // running total in data order: C ends at 7 (5 − 2 + 4)
        expect(handle.queryAll('.lm-chart-value').map((e) => e.textContent)).toEqual(['+4', '-2', '+5']);
    });

    it('xaxis.reverse on a linear x: ticks right to left, points keep their x values', () => {
        handle = t(Chart, { type: 'line', xtype: 'linear', categories: [0, 2, 4, 6, 8], series: [{ name: 's', data: [1, 3, 2, 5, 4] }], xaxis: { reverse: true } });
        const ticks = handle.queryAll('.lm-chart-xtick').map((e) => ({ v: Number(e.textContent), left: parseFloat((e as HTMLElement).style.left) }));
        expect(ticks.find((k) => k.v === 0)!.left).toBeCloseTo(100);
        expect(ticks.find((k) => k.v === 8)!.left).toBeCloseTo(0);
    });

    it('xaxis/yaxis.reverse on scatter: x labels right to left, y labels top to bottom ascending', () => {
        handle = t(Chart, { type: 'scatter', series: [{ name: 's', data: [[0, 0], [10, 10]] }], xmin: 0, xmax: 8, ymin: 0, ymax: 8,
            xaxis: { reverse: true }, yaxis: { reverse: true } });
        expect(handle.queryAll('.lm-chart-xval').map((e) => e.textContent)).toEqual(['8', '6', '4', '2', '0']);
        expect(handle.queryAll('.lm-chart-tick').map((e) => e.textContent)).toEqual(['0', '2', '4', '6', '8']);
    });

    it('x2axis: horizontal bars draw the axis: right series on a top axis', () => {
        const cats = ['A', 'B'];
        const dual = [{ name: 'u', data: [1, 2] }, { name: 'r', axis: 'right', data: [100, 400] }];
        handle = t(Chart, { type: 'bar', horizontal: true, categories: cats, series: dual,
            xaxis: { title: 'Units' }, x2axis: { title: 'Revenue', font: { color: 'red' } } });
        const rows = handle.queryAll('.lm-chart-xvalues');
        expect(rows.map((r) => r.getAttribute('data-top'))).toEqual(['true', null]); // top first, then bottom
        expect(handle.query('.lm-chart-x2title')!.textContent).toBe('Revenue');
        expect(handle.queryAll('.lm-chart-xtitle').map((e) => e.textContent)).toEqual(['Revenue', 'Units']);
        expect(styleN(handle.query('.lm-chart')!)).toContain('--lm-chart-x2labels-color:red');
        // the top ticks belong to the secondary scale (hundreds), the bottom to the primary
        const top = rows[0].querySelectorAll('.lm-chart-xval');
        expect(Number(top[top.length - 1].textContent)).toBeGreaterThanOrEqual(400);
        handle.unmount();
        // only secondary series: only the top axis
        handle = t(Chart, { type: 'bar', horizontal: true, categories: cats, series: [dual[1]],
            xaxis: { title: 'Units' }, x2axis: { title: 'Revenue' } });
        expect(handle.queryAll('.lm-chart-xvalues').map((r) => r.getAttribute('data-top'))).toEqual(['true']);
        expect(handle.queryAll('.lm-chart-xtitle').map((e) => e.textContent)).toEqual(['Revenue']);
        handle.unmount();
        // stacked: no secondary — everything stacks on the bottom axis
        handle = t(Chart, { type: 'stackedbar', horizontal: true, categories: cats, series: dual, x2axis: { title: 'Revenue' } });
        expect(handle.queryAll('.lm-chart-xvalues').map((r) => r.getAttribute('data-top'))).toEqual([null]);
        expect(handle.query('.lm-chart-x2title')).toBeNull();
        handle.unmount();
        // stacked / percent with ALL series secondary: one stack on the top axis
        for (const stackmode of ['normal', 'percent']) {
            handle = t(Chart, { type: 'stackedbar', stackmode, horizontal: true, categories: cats,
                series: [{ name: 'p', axis: 'right', data: [1, 2] }, { name: 'q', axis: 'right', data: [3, 1] }],
                xaxis: { title: 'Units' }, x2axis: { title: 'Revenue', reverse: true } });
            const rows = handle.queryAll('.lm-chart-xvalues');
            expect(rows.map((r) => r.getAttribute('data-top'))).toEqual(['true']);
            expect(handle.queryAll('.lm-chart-xtitle').map((e) => e.textContent)).toEqual(['Revenue']);
            // x2axis.reverse applies to the stack
            const tv = Array.from(rows[0].querySelectorAll('.lm-chart-xval')).map((e) => parseFloat(e.textContent!));
            expect(tv[0]).toBeGreaterThan(tv[tv.length - 1]);
            handle.unmount();
        }
        // mirror (pyramid): one shared axis, no top axis
        handle = t(Chart, { type: 'bar', horizontal: true, mirror: true, categories: cats, series: dual, x2axis: { title: 'Revenue' } });
        expect(handle.queryAll('.lm-chart-xvalues').map((r) => r.getAttribute('data-top'))).toEqual([null]);
        handle.unmount();
        // x2axis.reverse: the top ticks run right to left
        handle = t(Chart, { type: 'bar', horizontal: true, categories: cats, series: dual, x2axis: { reverse: true } });
        const tv = Array.from(handle.queryAll('.lm-chart-xvalues')[0].querySelectorAll('.lm-chart-xval')).map((e) => Number(e.textContent));
        expect(tv[0]).toBeGreaterThan(tv[tv.length - 1]);
    });

    it('line series: bordercolor is the line and marker ring, color the marker fill', () => {
        handle = t(Chart, { type: 'line', categories: ['A', 'B'], legendposition: 'bottom',
            series: [{ name: 'g', bordercolor: '#00B050', color: '#FF0000', data: [1, 2] }, { name: 'p', color: '#123456', data: [2, 1] }] });
        const lines = handle.queryAll('.lm-chart-line');
        expect(styleN(lines[0])).toMatch(/stroke:(#00b050|rgb\(0, 176, 80\))/i);
        expect(styleN(lines[1])).toMatch(/stroke:(#123456|rgb\(18, 52, 86\))/i); // no bordercolor: unchanged
        const mk = handle.queryAll('.lm-chart-marker');
        expect(styleN(mk[0])).toMatch(/background:(#ff0000|rgb\(255, 0, 0\))/i);
        expect(styleN(mk[0])).toMatch(/border-color:(#00b050|rgb\(0, 176, 80\))/i);
        expect(styleN(mk[0])).toContain('border-width:1px');
        expect(styleN(mk[mk.length - 1])).not.toContain('border-color'); // the default white ring
        // legend: line in the border colour, dot in the fill
        const sw = handle.queryAll('.lm-chart-swatch')[0];
        expect(sw.getAttribute('data-dot')).toBe('true');
        expect(styleN(sw)).toMatch(/--lm-swatch-dot:#FF0000/i);
    });

    it('stroke markers (x/plus/dash/star): no fill, drawn in bordercolor (else color)', () => {
        handle = t(Chart, { type: 'line', categories: ['A', 'B'], legendposition: 'bottom', series: [
            { name: 'x', marker: 'x', color: '#ff0000', bordercolor: '#00aa00', data: [1, 2] },
            { name: 's', marker: 'star', color: '#0000ff', data: [2, 1] },
        ] });
        const mk = handle.queryAll('.lm-chart-marker');
        expect(mk[0].getAttribute('data-shape')).toBe('x');
        expect(styleN(mk[0])).toContain('--lm-mk-c:#00aa00');
        expect(styleN(mk[0])).toContain('--lm-mk-w:1.5px'); // at least 1.5px
        expect(styleN(mk[0])).not.toContain('background');
        expect(styleN(mk[2])).toContain('--lm-mk-c:#0000ff'); // no bordercolor: the series colour, 2px
        expect(styleN(mk[2])).toContain('--lm-mk-w:2px');
        // legend: the shape replaces the line swatch dot
        const sw = handle.queryAll('.lm-chart-swatch');
        expect(sw.map((e) => e.getAttribute('data-shape'))).toEqual(['x', 'star']);
        handle.unmount();
        // scatter: a stroked path in a nested svg, plus a hit disc
        handle = t(Chart, { type: 'scatter', series: [{ name: 'p', marker: 'plus', color: '#123456', data: [[1, 1], [2, 2]] }] });
        const dots = handle.queryAll('svg.lm-chart-dot[data-stroke="plus"]');
        expect(dots.length).toBe(2);
        expect(dots[0].querySelector('path')!.getAttribute('d')).toMatch(/^M-?[\d.]+,0H[\d.]+M0,-?[\d.]+V[\d.]+$/);
        expect(handle.query('.lm-chart-swatch')!.getAttribute('data-shape')).toBe('plus');
    });

    it('vertical: every series on the right draws the right axis alone (stacked too)', () => {
        const right = [{ name: 'a', axis: 'right', data: [100, 250] }, { name: 'b', axis: 'right', data: [50, 80] }];
        for (const type of ['line', 'bar', 'stackedbar']) {
            handle = t(Chart, { type, categories: ['A', 'B'], series: right, ytitle: 'Left', y2title: 'Right' });
            expect(handle.query('.lm-chart-tick'), type).toBeNull(); // no left ticks
            const r = handle.queryAll('.lm-chart-tick-r').map((e) => Number(e.textContent));
            expect(Math.max(...r), type).toBeGreaterThanOrEqual(type === 'stackedbar' ? 330 : 250); // the real scale
            expect(handle.queryAll('.lm-chart-ytitle').map((e) => e.textContent), type).toEqual(['Right']);
            expect(styleN(handle.query('.lm-chart-plotblock')!), type).toContain('--lm-chart-gutter:var(--lm-chart-pad-r)');
            handle.unmount();
        }
        // percent: the right ticks read as percentages
        handle = t(Chart, { type: 'stackedbar', stackmode: 'percent', categories: ['A'], series: right });
        expect(handle.queryAll('.lm-chart-tick-r').map((e) => e.textContent)).toEqual(['100%', '75%', '50%', '25%', '0%']);
        handle.unmount();
        // y2axis.reverse reverses the lone right axis
        handle = t(Chart, { type: 'line', categories: ['A', 'B'], series: right, y2axis: { reverse: true } });
        const rv = handle.queryAll('.lm-chart-tick-r').map((e) => Number(e.textContent));
        expect(rv[0]).toBeLessThan(rv[rv.length - 1]);
        handle.unmount();
        // mixed: both axes as before
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ name: 'l', data: [5] }, right[0]] });
        expect(handle.query('.lm-chart-tick')).not.toBeNull();
        expect(handle.query('.lm-chart-tick-r')).not.toBeNull();
    });

    it('scatter: axis right series get the right y axis; all on the right → right axis alone', () => {
        const left = { name: 'l', data: [[1, 1], [2, 4]] };
        const right = { name: 'r', axis: 'right', marker: 'circle', data: [[1, 100], [2, 400]] };
        // mixed: two axes, the same tick count (aligned), each its own scale
        handle = t(Chart, { type: 'scatter', series: [left, right], ytitle: 'L', y2title: 'R' });
        const lt = handle.queryAll('.lm-chart-tick').map((e) => Number(e.textContent));
        const rt = handle.queryAll('.lm-chart-tick-r').map((e) => Number(e.textContent));
        expect(rt.length).toBe(lt.length);
        expect(Math.max(...lt)).toBeLessThan(10);
        expect(Math.max(...rt)).toBeGreaterThanOrEqual(400);
        expect(handle.query('.lm-chart-plot')!.getAttribute('data-right')).toBe('true');
        expect(handle.queryAll('.lm-chart-ytitle').map((e) => e.textContent)).toEqual(['L', 'R']);
        // the right series sits on its own scale: y=400 inside the plot, above y=100
        // (on the left scale, 0.5–4.5, it would be far off the top)
        const cy = handle.queryAll('circle.lm-chart-dot').map((d) => parseFloat(d.getAttribute('cy')!));
        expect(cy[3]).toBeGreaterThanOrEqual(0);
        expect(cy[3]).toBeLessThan(cy[2]);
        handle.unmount();
        // all on the right: no left ticks/title, collapsed gutter, right axis with the one scale
        handle = t(Chart, { type: 'scatter', series: [right], ytitle: 'L', y2title: 'R', y2axis: { reverse: true } });
        expect(handle.query('.lm-chart-tick')).toBeNull();
        expect(handle.queryAll('.lm-chart-ytitle').map((e) => e.textContent)).toEqual(['R']);
        expect(styleN(handle.query('.lm-chart-plotblock')!)).toContain('--lm-chart-gutter:var(--lm-chart-pad-r)');
        const rv = handle.queryAll('.lm-chart-tick-r').map((e) => Number(e.textContent));
        expect(rv[0]).toBeLessThan(rv[rv.length - 1]); // y2axis.reverse on the lone axis
        handle.unmount();
        // the points live in the plot box shared with the grid (the x offset fix)
        handle = t(Chart, { type: 'bubble', series: [left] });
        expect(handle.query('.lm-chart-scatterbox svg.lm-chart-scatter')).not.toBeNull();
        expect(handle.query('.lm-chart-plot')!.getAttribute('data-right')).toBeNull();
    });

    it('pie with several series: one ring per series, slices keyed by category', () => {
        const series = [
            { name: '2024', data: [{ name: 'A', value: 1 }, { name: 'B', value: 1 }, { name: 'C', value: 2 }] },
            { name: '2025', data: [3, 1, 1] },
        ];
        handle = t(Chart, { type: 'pie', innerradius: 0.5, series, legendposition: 'right' });
        const slices = handle.queryAll('path.lm-chart-slice');
        expect(slices.length).toBe(6);
        // the inner ring's slices share the outer ring's colours by index
        expect(styleN(slices[3])).toBe(styleN(slices[0]));
        // the outer ring reaches R; the inner one stays inside it
        expect(slices[0].getAttribute('d')).toContain('A 49');
        expect(slices[3].getAttribute('d')).not.toContain('A 49');
        // the legend lists the categories once
        expect(handle.queryAll('.lm-chart-legend-name').map((e) => e.textContent)).toEqual(['A', 'B', 'C']);
        // hiding a category hides it in every ring
        (handle.queryAll('.lm-chart-legend-item')[0] as HTMLElement).click();
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(4);
        // an unnamed inner slice carries the outer ring's category name
        expect(handle.queryAll('path.lm-chart-slice')[2].querySelector('title')!.textContent).toMatch(/^B: 1 /);
        // the a11y table reads as series × category
        expect(handle.queryAll('.lm-chart-a11y thead th').map((e) => e.textContent)).toEqual(['Series', 'A', 'B', 'C']);
        handle.unmount();
        // a solid pie: the inner ring is a disc (wedges from the centre)
        handle = t(Chart, { type: 'pie', series });
        const inner = handle.queryAll('path.lm-chart-slice')[3];
        expect(inner.getAttribute('d')).toMatch(/^M 50 50 L/);
        expect(inner.getAttribute('data-donut')).toBeNull();
        handle.unmount();
        // one series: unchanged (a plain pie, no ring gap)
        handle = t(Chart, { type: 'pie', series: [series[0]] });
        expect(handle.queryAll('path.lm-chart-slice').length).toBe(3);
        expect(handle.query('path.lm-chart-slice')!.getAttribute('d')).toMatch(/^M 50 50 L/);
    });

    it('pie: slice borders from point.bordercolor / series bordercolor + borderwidth', () => {
        const data = [{ name: 'A', value: 1, bordercolor: '#375623' }, { name: 'B', value: 2 }];
        // point border, series width; the second slice falls back to the series colour
        handle = t(Chart, { type: 'pie', legendposition: 'right', series: [{ data, bordercolor: '#ff0000', borderwidth: 2 }] });
        let sl = handle.queryAll('path.lm-chart-slice');
        expect(styleN(sl[0])).toMatch(/stroke:(#375623|rgb\(55, 86, 35\))/i);
        expect(styleN(sl[0])).toContain('stroke-width:2');
        expect(styleN(sl[1])).toMatch(/stroke:(#ff0000|rgb\(255, 0, 0\))/i);
        const sw = handle.queryAll('.lm-chart-swatch');
        expect(styleN(sw[0])).toMatch(/inset 0(px)? 0(px)? 0(px)? 2px (#375623|rgb\(55, 86, 35\))/i);
        handle.unmount();
        // nothing set: the stylesheet seam (no inline stroke)
        handle = t(Chart, { type: 'pie', series: [{ data: [{ name: 'A', value: 1 }, { name: 'B', value: 2 }] }] });
        expect(styleN(handle.query('path.lm-chart-slice')!)).not.toContain('stroke');
        handle.unmount();
        // borderwidth 0: no stroke at all
        handle = t(Chart, { type: 'pie', series: [{ data, borderwidth: 0 }] });
        expect(styleN(handle.query('path.lm-chart-slice')!)).toContain('stroke:none');
        handle.unmount();
        // rings and the single-slice circle take the border too
        handle = t(Chart, { type: 'pie', innerradius: 0.4, series: [{ data, bordercolor: '#00f' }, { data: [3], bordercolor: '#0f0' }] });
        sl = handle.queryAll('.lm-chart-slice');
        expect(styleN(sl[2])).toMatch(/stroke:(#0f0|#00ff00|rgb\(0, 255, 0\))/i);
        expect(sl[2].tagName.toLowerCase()).toBe('path'); // the lone inner slice is a full annulus
    });

    it('histogram: binwidth makes exact-width bins from the minimum, past the maximum', () => {
        const data = [28, 33, 40, 55, 61, 62, 70, 80];
        handle = t(Chart, { type: 'histogram', binwidth: 5, series: [{ data }] });
        const cats = handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent).filter(Boolean);
        expect(cats[0]).toBe('[28, 33]');
        expect(cats[1]).toBe('(33, 38]');
        expect(cats[cats.length - 1]).toBe('(78, 83]'); // 11 bins of 5: the last runs past 80
        expect(cats.length).toBe(11);
        // closed on the right: 33 counts in [28, 33] (2 there, none in (33, 38]); 80 in the last
        const vals = handle.queryAll('.lm-chart-value').map((e) => e.textContent);
        expect(vals[0]).toBe('2');
        expect(handle.queryAll('.lm-chart-bar')[1].textContent).toBe('');
        expect(vals[vals.length - 1]).toBe('1');
        handle.unmount();
        // a maximum on a boundary joins the last bin: 28..48 by 5 → 4 bins, not 5
        handle = t(Chart, { type: 'histogram', binwidth: 5, series: [{ data: [28, 30, 48] }] });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent).filter(Boolean).length).toBe(4);
        handle.unmount();
        // binwidth wins over bins; a tiny width (> 200 bins) falls back to bins
        handle = t(Chart, { type: 'histogram', binwidth: 26, bins: 7, series: [{ data }] });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent).filter(Boolean)).toEqual(['[28, 54]', '(54, 80]']); // 52/26 = 2 exactly
        handle.unmount();
        handle = t(Chart, { type: 'histogram', binwidth: 0.01, bins: 4, series: [{ data }] });
        expect(handle.queryAll('.lm-chart-cat-label').map((e) => e.textContent).filter(Boolean).length).toBe(4);
    });

    it('histogram: shows the series legend (name, bar colour) and toggles the bars', () => {
        handle = t(Chart, { type: 'histogram', bins: 2, series: [{ name: 'Valor', color: '#123456', bordercolor: '#000', data: [1, 2, 3, 4] }] });
        const items = handle.queryAll('.lm-chart-legend-item');
        expect(items.map((e) => e.textContent!.trim())).toEqual(['Valor']);
        expect(styleN(handle.query('.lm-chart-swatch')!)).toMatch(/background:(#123456|rgb\(18, 52, 86\))/i);
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2);
        (items[0] as HTMLElement).click();
        expect(handle.queryAll('.lm-chart-bar').length).toBe(0);
        handle.unmount();
        // no name: the "Frequency" fallback; legend: false hides it
        handle = t(Chart, { type: 'histogram', series: [{ data: [1, 2, 3] }] });
        expect(handle.query('.lm-chart-legend-name')!.textContent).toBe('Frequency');
        handle.unmount();
        handle = t(Chart, { type: 'histogram', legend: false, series: [{ data: [1, 2, 3] }] });
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('radar: bordercolor strokes the polygon, markers follow the line series options', () => {
        const cats = ['A', 'B', 'C'];
        handle = t(Chart, { type: 'radar', categories: cats, legendposition: 'bottom', series: [
            { name: 'd', color: '#ff0000', bordercolor: '#00aa00', borderwidth: 2, marker: 'diamond', markersize: 5, data: [1, 2, 3] },
            { name: 'x', color: '#0000ff', marker: 'x', data: [3, 2, 1] },
            { name: 'plain', color: '#123456', data: [2, 2, 2] },
            { name: 'off', color: '#654321', markers: false, data: [1, 1, 1] },
        ] });
        const polys = handle.queryAll('.lm-chart-radar-area');
        expect(styleN(polys[0])).toMatch(/stroke:(#00aa00|rgb\(0, 170, 0\))/i);
        expect(styleN(polys[0])).toMatch(/fill:(#ff0000|rgb\(255, 0, 0\))/i);
        expect(styleN(polys[2])).toMatch(/stroke:(#123456|rgb\(18, 52, 86\))/i); // no bordercolor: as before
        // HTML markers for the configured series (3 vertices each), svg dots for the rest
        const mk = handle.queryAll('.lm-chart-marker');
        expect(mk.length).toBe(6);
        expect(mk[0].getAttribute('data-shape')).toBe('diamond');
        expect(styleN(mk[0])).toMatch(/background:(#ff0000|rgb\(255, 0, 0\))/i);
        expect(styleN(mk[0])).toMatch(/border-color:(#00aa00|rgb\(0, 170, 0\))/i);
        expect(styleN(mk[0])).toContain('width:10px'); // markersize 5 → 10px
        expect(mk[3].getAttribute('data-shape')).toBe('x');
        expect(styleN(mk[3])).toContain('--lm-mk-c:#0000ff');
        const dots = handle.queryAll('.lm-chart-radar-dot');
        expect(dots.length).toBe(6); // plain + off
        expect(dots.filter((d) => d.getAttribute('data-hidden') === 'true').length).toBe(3);
        expect(styleN(dots[3])).toContain('fill:transparent');
        // legend: line in the border colour, dot in the fill; the x shape for series 2
        const sw = handle.queryAll('.lm-chart-swatch');
        expect(styleN(sw[0])).toMatch(/background:(#00aa00|rgb\(0, 170, 0\))/i);
        expect(styleN(sw[0])).toMatch(/--lm-swatch-dot:#ff0000/i);
        expect(sw[1].getAttribute('data-shape')).toBe('x');
    });

    it('raxis: radar scale, rings, labels, ticks, fonts, grid and spokes', () => {
        const series = [{ name: 's', data: [2, 4, 8] }];
        const cats = ['A', 'B', 'C'];
        // default: 4 rings, labels on, ticks only with the chart labels
        handle = t(Chart, { type: 'radar', categories: cats, series });
        expect(handle.queryAll('.lm-chart-radar-ring').length).toBe(4);
        expect(handle.queryAll('.lm-chart-radar-label').length).toBe(3);
        expect(handle.queryAll('.lm-chart-radar-tickval').map((e) => e.textContent)).toEqual(['2', '4', '6', '8']); // nice max of 8
        handle.unmount();
        // min/max/step: rings every 5 from 0 to 20; ticks forced on with labels off
        handle = t(Chart, { type: 'radar', categories: cats, series, labels: false,
            raxis: { min: 0, max: 20, step: 5, ticks: true, labels: false, font: { size: 14, color: 'red' }, tickfont: { color: 'blue' },
                grid: { color: '#ff0000', width: 2, dash: 'dashed' }, spokes: { show: false } } });
        expect(handle.queryAll('.lm-chart-radar-ring').length).toBe(4);
        expect(handle.queryAll('.lm-chart-radar-tickval').map((e) => e.textContent)).toEqual(['5', '10', '15', '20']);
        expect(handle.queryAll('.lm-chart-radar-label').length).toBe(0);
        const st = styleN(handle.query('.lm-chart')!);
        expect(st).toContain('--lm-chart-rlabels-size:14px');
        expect(st).toContain('--lm-chart-rticks-color:blue');
        expect(st).toContain('--lm-chart-rgrid-color:#ff0000');
        expect(st).toContain('--lm-chart-rgrid-width:2px');
        expect(st).toContain('--lm-chart-rgrid-dash:4 3');
        expect(st).toContain('--lm-chart-rspokes-color:transparent');
        // the vertex for 8 sits at 8/20 of the radius (38): 15.2 from the centre, straight up
        const pts = handle.query('.lm-chart-radar-area')!.getAttribute('points')!.split(' ');
        expect(Number(pts[0].split(',')[1])).toBeCloseTo(50 - 38 * 0.1, 1); // A = 2 → 2/20
        handle.unmount();
        // reverse: the maximum at the centre; ticks run downwards; ticks: false hides them
        handle = t(Chart, { type: 'radar', categories: cats, series, raxis: { max: 10, reverse: true } });
        expect(handle.queryAll('.lm-chart-radar-tickval').map((e) => e.textContent)).toEqual(['7.5', '5', '2.5', '0']);
        const rp = handle.query('.lm-chart-radar-area')!.getAttribute('points')!.split(' ');
        expect(Number(rp[0].split(',')[1])).toBeCloseTo(50 - 38 * 0.8, 1); // A = 2 → (1 − 0.2)
        handle.unmount();
        handle = t(Chart, { type: 'radar', categories: cats, series, raxis: { ticks: false } });
        expect(handle.queryAll('.lm-chart-radar-tickval').length).toBe(0);
    });

    it('gaps: radar and stacked area honour null points and connectgaps', () => {
        const cats = ['A', 'B', 'C', 'D'];
        // radar, connectgaps off: the polygon breaks at the gap — an open stroke
        // per run plus a fill closed through the centre; no marker at the gap
        handle = t(Chart, { type: 'radar', categories: cats, series: [{ name: 's', data: [1, null, 3, 4] }] });
        expect(handle.query('polygon.lm-chart-radar-area')).toBeNull();
        expect(handle.queryAll('polyline.lm-chart-radar-area').length).toBe(1);
        expect(handle.query('path.lm-chart-radar-area')!.getAttribute('d')).toMatch(/^M 50,50 L .* Z$/);
        expect(handle.queryAll('.lm-chart-radar-dot').length).toBe(3);
        handle.unmount();
        // connectgaps on: one closed polygon over the three points
        handle = t(Chart, { type: 'radar', categories: cats, series: [{ name: 's', connectgaps: true, data: [1, null, 3, 4] }] });
        const poly = handle.query('polygon.lm-chart-radar-area')!;
        expect(poly.getAttribute('points')!.split(' ').length).toBe(3);
        expect(handle.queryAll('.lm-chart-radar-dot').length).toBe(3);
        handle.unmount();
        // stacked area, connectgaps off: the gapped series breaks into two
        // bands; the one above treats the gap as 0; the a11y table shows it empty
        handle = t(Chart, { type: 'stackedarea', categories: cats, series: [{ name: 'lo', data: [2, null, 2, 2] }, { name: 'hi', data: [1, 1, 1, 1] }] });
        // lo: the lone point before the gap draws no band, the run after it does; hi: one band
        expect(handle.queryAll('.lm-chart-areafill').length).toBe(2);
        expect(handle.queryAll('.lm-chart-line').length).toBe(2);
        const cells = handle.queryAll('.lm-chart-a11y tbody tr')[0].querySelectorAll('td');
        expect(cells[2].textContent).toBe('');
        handle.unmount();
        // connectgaps on: the gap is interpolated (2) for the line and the stack
        handle = t(Chart, { type: 'stackedarea', categories: cats, series: [{ name: 'lo', connectgaps: true, data: [2, null, 2, 2] }, { name: 'hi', data: [1, 1, 1, 1] }] });
        expect(handle.queryAll('.lm-chart-areafill').length).toBe(2);
        const d = handle.queryAll('.lm-chart-line')[0].getAttribute('d')!;
        const ys = d.match(/[\d.]+,([\d.]+)/g)!.map((m) => Number(m.split(',')[1]));
        expect(ys[1]).toBeCloseTo(ys[0], 1); // flat at 2 across the bridged gap
        expect(handle.queryAll('.lm-chart-marker').length).toBe(7); // no marker at the gap
    });

    it('fillopacity: the chart prop sets the fill variable on the root, a series overrides inline', () => {
        const cats = ['A', 'B'];
        handle = t(Chart, { type: 'line', area: true, categories: cats, series: [{ name: 'a', data: [1, 2] }] });
        expect(styleN(handle.query('.lm-chart')!)).not.toContain('fill-opacity');
        expect(styleN(handle.query('.lm-chart-areafill')!)).not.toContain('fill-opacity');
        handle.unmount();
        handle = t(Chart, { type: 'stackedarea', fillopacity: 1, categories: cats, series: [{ name: 'a', data: [1, 2] }, { name: 'b', fillopacity: 0.3, data: [1, 1] }] });
        expect(styleN(handle.query('.lm-chart')!)).toContain('--lm-chart-fill-opacity:1');
        const fills = handle.queryAll('.lm-chart-areafill');
        expect(styleN(fills[0])).not.toContain('fill-opacity');
        expect(styleN(fills[1])).toContain('--lm-chart-fill-opacity:0.3');
        handle.unmount();
        // radar and arearange carry it too; values are clamped to 0–1
        handle = t(Chart, { type: 'radar', fillopacity: 5, categories: cats, series: [{ name: 'a', fillopacity: -1, data: [1, 2] }] });
        expect(styleN(handle.query('.lm-chart')!)).toContain('--lm-chart-fill-opacity:1');
        expect(styleN(handle.query('.lm-chart-radar-area')!)).toContain('--lm-chart-fill-opacity:0');
        handle.unmount();
        handle = t(Chart, { type: 'arearange', categories: cats, series: [{ name: 'r', fillopacity: 0.5, data: [[1, 2], [2, 3]] }] });
        expect(styleN(handle.query('.lm-chart-areafill')!)).toContain('--lm-chart-fill-opacity:0.5');
    });

    it('areas: each filled series draws fill then stroke in series order; plain lines on top', () => {
        const cats = ['A', 'B'];
        const order = (): string[] => Array.from(handle!.query('.lm-chart-linesvg')!.children).map((e) => e.getAttribute('class')!);
        handle = t(Chart, { type: 'line', categories: cats, series: [{ name: 'a', area: true, data: [1, 2] }, { name: 'b', area: true, data: [2, 3] }, { name: 'l', data: [3, 3] }] });
        expect(order()).toEqual(['lm-chart-areafill', 'lm-chart-line', 'lm-chart-areafill', 'lm-chart-line', 'lm-chart-line']);
        handle.unmount();
        handle = t(Chart, { type: 'stackedarea', categories: cats, series: [{ name: 'a', data: [1, 2] }, { name: 'b', data: [2, 3] }] });
        expect(order()).toEqual(['lm-chart-areafill', 'lm-chart-line', 'lm-chart-areafill', 'lm-chart-line']);
    });

    it('axis titles: every cartesian renderer shows xtitle and ytitle', () => {
        const cases: Array<Record<string, unknown>> = [
            { type: 'waterfall', categories: ['A', 'B'], series: [{ data: [3, -1] }] },
            { type: 'boxplot', categories: ['A'], series: [{ data: [[1, 2, 3, 4, 5]] }] },
            { type: 'histogram', series: [{ data: [1, 2, 3] }] },
            { type: 'scatter', series: [{ data: [[1, 2]] }] },
            { type: 'bar', categories: ['A'], series: [{ data: [1] }] },
        ];
        for (const def of cases) {
            handle = t(Chart, { ...def, xaxis: { title: 'X title' }, yaxis: { title: 'Y title' } });
            expect(handle.query('.lm-chart-xtitle')?.textContent, String(def.type)).toBe('X title');
            expect(handle.query('.lm-chart-ytitle')?.textContent, String(def.type)).toBe('Y title');
            handle.unmount();
            handle = null;
        }
    });

    it('waterfall: colours per kind, per point, totals and the series outline', () => {
        const cats = ['Start', 'Up', 'Down', 'Total', 'Up2', 'End'];
        handle = t(Chart, { type: 'waterfall', categories: cats, series: [{
            color: '#00aa00', negative: { color: '#aa0000' }, total: { color: '#333333' }, bordercolor: '#000', borderwidth: 2,
            totals: [3, 5], data: [10, 5, -3, 12, { value: 4, color: '#0000ff' }, null],
        }] });
        const bars = handle.queryAll('.lm-chart-bar');
        const bg = (i: number): string => (styleN(bars[i]).match(/background:([^;]+)/) || [])[1];
        expect(bg(0)).toMatch(/#00aa00|rgb\(0, 170, 0\)/i);
        expect(bg(2)).toMatch(/#aa0000|rgb\(170, 0, 0\)/i);
        expect(bg(3)).toMatch(/#333333|rgb\(51, 51, 51\)/i);
        expect(bg(4)).toMatch(/#0000ff|rgb\(0, 0, 255\)/i); // the point's own colour
        expect(styleN(bars[0])).toMatch(/inset 0(px)? 0(px)? 0(px)? 2px (#000|rgb\(0, 0, 0\))/i);
        expect(bars.map((b) => b.getAttribute('data-total'))).toEqual([null, null, null, 'true', null, 'true']);
        // the total at 3 is its own value (12) from zero; the sum continues from it: 12 + 4 = 16 = the null total
        expect(handle.queryAll('.lm-chart-value').map((e) => e.textContent)).toEqual(['+10', '+5', '-3', '12', '+4', '16']);
        expect(styleN(bars[3])).toContain('bottom:0.00%');
        handle.unmount();
        // nothing set: the up / down tokens as before (jsdom drops var() backgrounds,
        // so: no explicit colour inline)
        handle = t(Chart, { type: 'waterfall', categories: ['a', 'b'], series: [{ data: [3, -1] }] });
        expect(styleN(handle.queryAll('.lm-chart-bar')[0])).not.toMatch(/background:(#|rgb)/);
        expect(handle.queryAll('.lm-chart-bar').map((b) => b.getAttribute('data-total'))).toEqual([null, null]);
    });

    it('waterfall: kinds { color, border: { color, width } } inherit the series look; point bordercolor on top', () => {
        handle = t(Chart, { type: 'waterfall', categories: ['a', 'b', 'c', 'd', 'e'], series: [{
            bordercolor: '#111111', borderwidth: 1, totals: [2, 4],
            positive: { border: { width: 3 } },
            negative: { border: { color: '#222222' } },
            total: { color: '#999999', border: { color: '#333333', width: 2 } },
            data: [5, -2, 9, { value: 1, bordercolor: '#444444' }, null],
        }] });
        const bars = handle.queryAll('.lm-chart-bar');
        const sh = (i: number): string => (styleN(bars[i]).match(/box-shadow:([^;]+)/) || [])[1] || '';
        expect(sh(0)).toMatch(/3px (#111111|rgb\(17, 17, 17\))/i);  // positive: series colour, own width
        expect(sh(1)).toMatch(/1px (#222222|rgb\(34, 34, 34\))/i);  // negative: own colour, series width
        expect(sh(2)).toMatch(/2px (#333333|rgb\(51, 51, 51\))/i);  // total: own colour and width
        expect(sh(3)).toMatch(/3px (#444444|rgb\(68, 68, 68\))/i);  // the point's outline, positive width
        expect(styleN(bars[2])).toMatch(/background:(#999999|rgb\(153, 153, 153\))/i);
        expect(styleN(bars[4])).toMatch(/background:(#999999|rgb\(153, 153, 153\))/i); // the null total
    });

    it('waterfall legend: Increase / Decrease / Total entries always, informative only', () => {
        handle = t(Chart, { type: 'waterfall', categories: ['a', 'b'], series: [{ data: [3, -1] }] });
        let items = handle.queryAll('.lm-chart-legend-item');
        expect(items.map((e) => e.textContent!.trim())).toEqual(['Increase', 'Decrease', 'Total']); // no totals, still three
        expect(items[0].getAttribute('data-static')).toBe('true');
        (items[0] as HTMLElement).click();
        expect(handle.queryAll('.lm-chart-bar').length).toBe(2); // no toggle
        handle.unmount();
        handle = t(Chart, { type: 'waterfall', categories: ['a', 'b', 'c'], series: [{
            color: '#00aa00', negative: { name: 'Queda', color: '#aa0000', border: { color: '#000', width: 2 } }, total: { name: 'Soma' },
            totals: [2], data: [3, -1, null],
        }] });
        items = handle.queryAll('.lm-chart-legend-item');
        expect(items.map((e) => e.textContent!.trim())).toEqual(['Increase', 'Queda', 'Soma']);
        const sw = handle.queryAll('.lm-chart-swatch');
        expect(styleN(sw[0])).toMatch(/background:(#00aa00|rgb\(0, 170, 0\))/i);
        expect(styleN(sw[1])).toMatch(/inset 0(px)? 0(px)? 0(px)? 2px (#000|rgb\(0, 0, 0\))/i);
        handle.unmount();
        handle = t(Chart, { type: 'waterfall', legend: false, categories: ['a'], series: [{ data: [1] }] });
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('funnel / pyramid: one informative legend entry per series', () => {
        const data = [{ name: 'Leads', value: 100, color: '#111111' }, { name: 'Trials', value: 40 }, { name: 'Sales', value: 10 }];
        for (const type of ['funnel', 'pyramid']) {
            handle = t(Chart, { type, series: [{ name: 'Vendas', color: '#00aa00', data }] });
            const items = handle.queryAll('.lm-chart-legend-item');
            expect(items.map((e) => e.textContent!.trim()), type).toEqual(['Vendas']);
            expect(items[0].getAttribute('data-static'), type).toBe('true');
            expect(styleN(handle.query('.lm-chart-swatch')!), type).toMatch(/background:(#00aa00|rgb\(0, 170, 0\))/i);
            (items[0] as HTMLElement).click();
            expect(handle.queryAll('.lm-chart-funnel-seg').length, type).toBe(3); // no toggle
            handle.unmount();
        }
        // no series colour: the first slice's own colour
        handle = t(Chart, { type: 'funnel', series: [{ name: 's', data }] });
        expect(styleN(handle.query('.lm-chart-swatch')!)).toMatch(/background:(#111111|rgb\(17, 17, 17\))/i);
        handle.unmount();
        handle = t(Chart, { type: 'funnel', legend: false, series: [{ data }] });
        expect(handle.query('.lm-chart-legend')).toBeNull();
    });

    it('legend: false, { show: false } and the "false" attribute all hide it', () => {
        for (const legend of [false, { show: false }, 'false']) {
            handle = t(Chart, { type: 'bar', legend, categories: ['A'], series: [{ name: 's', data: [1] }, { name: 'r', data: [2] }] });
            expect(handle.query('.lm-chart-legend')).toBeNull();
            handle.unmount();
        }
        handle = t(Chart, { type: 'bar', categories: ['A'], series: [{ name: 's', data: [1] }, { name: 'r', data: [2] }] });
        expect(handle.query('.lm-chart-legend')).not.toBeNull();
    });

    it('bar: bordercolor/borderwidth outline the bars and the legend swatch', () => {
        handle = t(Chart, {
            type: 'bar', categories: ['A', 'B'], horizontal: true,
            series: [
                { name: 'Hollow', color: 'transparent', bordercolor: '#000000', borderwidth: 2, data: [3, 5] },
                { name: 'Plain', data: [1, 2] },
            ],
        });
        const bars = handle.queryAll('.lm-chart-bar');
        expect(styleN(bars[0])).toContain('box-shadow:');
        expect(styleN(bars[0])).toMatch(/inset 0(px)? 0(px)? 0(px)? 2px/);
        expect(styleN(bars[1])).not.toContain('box-shadow');
        const sw = handle.queryAll('.lm-chart-swatch');
        expect(styleN(sw[0])).toContain('box-shadow:');
        expect(styleN(sw[1])).not.toContain('box-shadow');
    });

    it('histogram and pareto carry the series outline onto their bars', () => {
        for (const type of ['histogram', 'pareto'] as const) {
            handle = t(Chart, { type, series: [{ name: 'S', bordercolor: '#000', data: [1, 2, 2, 3, 5, 8] }] });
            const bars = handle.queryAll('.lm-chart-bar');
            expect(bars.length).toBeGreaterThan(0);
            expect(styleN(bars[0])).toContain('box-shadow:');
            handle.unmount();
            handle = null;
        }
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
        // 10 samples over 1..9 in 4 bins of width 2, closed on the right
        // ([1,3], (3,5], (5,7], (7,9]) → counts 4,1,2,3
        const bars = handle.queryAll('.lm-chart-bar');
        expect(bars.length).toBe(4);
        expect(handle.queryAll('.lm-chart-value').map((l) => l.textContent)).toEqual(['4', '1', '2', '3']);
        // bin labels are intervals
        expect(handle.query('.lm-chart-cat-label')!.textContent).toBe('[1, 3]');
        // the legend names the series (the "Frequency" fallback here)
        expect(handle.query('.lm-chart-legend-name')!.textContent).toBe('Frequency');
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

    it('wordcloud: one word per positive named point, font size grows with value', () => {
        handle = t(Chart, {
            type: 'wordcloud',
            series: [{ data: [
                { name: 'big', value: 90 }, { name: 'mid', value: 40 },
                { name: 'small', value: 10 }, { name: 'zero', value: 0 },
            ] }],
        });
        expect(handle.query('.lm-chart')!.getAttribute('data-type')).toBe('wordcloud');
        const words = handle.queryAll('.lm-chart-cloud-word');
        expect(words.length).toBe(3); // the zero-value point is dropped
        expect(words.map((w) => w.textContent)).toEqual(['big', 'mid', 'small']);
        const size = (el: Element) => parseFloat(el.getAttribute('font-size')!);
        expect(size(words[0])).toBeGreaterThan(size(words[1]));
        expect(size(words[1])).toBeGreaterThan(size(words[2]));
        // no legend for a word cloud; the a11y table lists name/value rows
        expect(handle.query('.lm-chart-legend')).toBeNull();
        expect(handle.query('.lm-chart-a11y')).not.toBeNull();
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
        // padding applies past zero too: the (0,0) point sits INSIDE the
        // plot (not half-clipped on the axis), so cx > 0% and cy < 100%
        const cx = parseFloat(dots[0].getAttribute('cx')!);
        const cy = parseFloat(dots[0].getAttribute('cy')!);
        expect(cx).toBeGreaterThan(0);
        expect(cx).toBeLessThan(30);
        expect(cy).toBeLessThan(100);
        expect(cy).toBeGreaterThan(70);
    });

    it('scatter: extents pad past the data so edge points sit inside the plot', () => {
        // x 1..6 (no zero touch) → both extremes plotted off the plot edges
        handle = t(Chart, { type: 'scatter', series: [{ data: [[1, 4], [6, 9]] }] });
        const dots = handle.queryAll('.lm-chart-dot');
        expect(parseFloat(dots[0].getAttribute('cx')!)).toBeGreaterThan(0);
        expect(parseFloat(dots[1].getAttribute('cx')!)).toBeLessThan(100);
        expect(parseFloat(dots[1].getAttribute('cy')!)).toBeGreaterThan(0);
    });

    it('scatter combo: per-series type:line draws a connecting path; points-only series keep markers', () => {
        handle = t(Chart, {
            type: 'scatter',
            series: [
                { name: 'Measured', type: 'scatter', data: [[1, 4], [2, 7], [3, 3]] },
                { name: 'Trend', type: 'line', data: [[1, 3], [2, 5], [3, 6]] },
            ],
        });
        // the scatter series keeps its 3 markers; the line series draws none
        expect(handle.queryAll('.lm-chart-dot').length).toBe(3);
        // exactly one connecting path, for the line series
        const lines = handle.queryAll('.lm-chart-line');
        expect(lines.length).toBe(1);
        expect(lines[0].getAttribute('d')!.startsWith('M ')).toBe(true);
        // legend: line series gets a line swatch, scatter series a marker shape
        const items = handle.queryAll('.lm-chart-legend-item');
        expect(items.length).toBe(2);
    });

    it('pictogram: one row per point, glyphs filled by value/total (percent default)', () => {
        handle = t(Chart, {
            type: 'pictogram', icon: 'person', columns: 10, labels: true,
            series: [{ data: [{ name: 'Satisfied', value: 70 }, { name: 'Unhappy', value: 25 }] }],
        });
        const rows = handle.queryAll('.lm-chart-picto-row');
        expect(rows.length).toBe(2);                                   // one row per point
        expect(rows[0].querySelectorAll('.lm-chart-picto').length).toBe(10); // 10 glyphs
        // 70% → 7 glyphs get a fill window; 25% → 3 (2 full + 1 fractional at 50%)
        expect(rows[0].querySelectorAll('.lm-chart-picto-fill').length).toBe(7);
        expect(rows[1].querySelectorAll('.lm-chart-picto-fill').length).toBe(3);
        // percent readout label
        expect(rows[0].querySelector('.lm-chart-picto-value')!.textContent).toBe('70%');
    });

    it('waffle: type=waffle is a 100-square grid partitioned across the points', () => {
        handle = t(Chart, {
            type: 'waffle',
            series: [{ data: [{ name: 'Chrome', value: 45 }, { name: 'Safari', value: 30 }, { name: 'Other', value: 25 }] }],
        });
        const grid = handle.query('.lm-chart-waffle .lm-chart-picto-grid')!;
        expect(grid.querySelectorAll('.lm-chart-picto').length).toBe(100); // 10×10 grid
        // categories fill 45+30+25 = all 100 cells, in palette order
        expect(grid.querySelectorAll('.lm-chart-picto-fill').length).toBe(100);
        // interactive cells carry the category partition (45/30/25 → 3 colours)
        const fills = [...grid.querySelectorAll<HTMLElement>('.lm-chart-picto-fill path')];
        expect(new Set(fills.map((p) => p.style.fill)).size).toBe(3);
        // the category legend shows (waffle colours aren't labelled inline)
        expect(handle.queryAll('.lm-chart-legend-item').length).toBe(3);
    });

    it('waffle: one grid per series when multiple datasets are provided', () => {
        handle = t(Chart, {
            type: 'waffle',
            series: [
                { name: '2023', data: [{ name: 'A', value: 60 }, { name: 'B', value: 40 }] },
                { name: '2024', data: [{ name: 'A', value: 50 }, { name: 'B', value: 50 }] },
            ],
        });
        const grids = handle.queryAll('.lm-chart-waffle');
        expect(grids.length).toBe(2);
        // each waffle is labelled with its series name
        const names = handle.queryAll('.lm-chart-waffle-name').map((n) => n.textContent);
        expect(names).toEqual(['2023', '2024']);
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

    it('keyboard nav: pie slices roam by arrow keys, Enter activates, svg stays hidden', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'pie',
            series: [{ data: [{ name: 'X', value: 30 }, { name: 'Y', value: 70 }] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const area = handle.query('.lm-chart-pie-area')!;
        expect(area.getAttribute('tabindex')).toBe('0');
        expect(area.getAttribute('role')).toBe('application');
        expect(area.getAttribute('aria-label')).toContain('2 slices');
        // the focusable container lives OUTSIDE the aria-hidden svg (4.1.2)
        expect(area.closest('[aria-hidden="true"]')).toBeNull();
        expect(handle.query('svg[aria-hidden="true"] [tabindex]')).toBeNull();
        // ArrowRight → first slice active: highlight + tip + updated label
        area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.query('.lm-chart-slice[data-kb="true"]')).toBeTruthy();
        expect(handle.query('.lm-chart-kbtip-title')!.textContent).toBe('X');
        expect(handle.query('.lm-chart-pie-area')!.getAttribute('aria-label')).toContain('X: 30 (30%)');
        // move to the second slice and activate with Enter
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.name).toBe('Y');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 1 });
        // Escape clears the active slice
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(handle.query('.lm-chart-kbtip')).toBeNull();
        expect(handle.query('.lm-chart-slice[data-kb="true"]')).toBeNull();
    });

    it('keyboard nav: polararea wedges activate with Space', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'polararea',
            series: [{ data: [{ name: 'N', value: 10 }, { name: 'E', value: 5 }] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const area = handle.query('.lm-chart-pie-area')!;
        expect(area.getAttribute('tabindex')).toBe('0');
        expect(area.getAttribute('role')).toBe('application');
        area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.query('.lm-chart-slice[data-kb="true"]')).toBeTruthy();
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(fired.p.name).toBe('N');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 0 });
    });

    it('keyboard nav: radialbar rings are reachable and Enter activates', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'radialbar', ymax: 100,
            series: [{ data: [{ name: 'A', value: 70 }, { name: 'B', value: 45 }] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const area = handle.query('.lm-chart-pie-area')!;
        expect(area.getAttribute('tabindex')).toBe('0');
        // End jumps to the last ring; Enter fires it
        area.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        expect(handle.query('.lm-chart-radial[data-kb="true"]')).toBeTruthy();
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.name).toBe('B');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 1 });
    });

    it('keyboard nav: multi-series radialbar roams category rings like the cartesian plot', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'radialbar', categories: ['Gold', 'Silver'],
            series: [{ name: 'S1', data: [3, 5] }, { name: 'S2', data: [2, 4] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const area = handle.query('.lm-chart-pie-area')!;
        expect(area.getAttribute('role')).toBe('application');
        area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.query('.lm-chart-radial-arc[data-kb="true"]')).toBeTruthy();
        expect(handle.query('.lm-chart-pie-area')!.getAttribute('aria-label')).toContain('Gold');
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.value).toBe(3); // first visible series at the ring
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 0 });
    });

    it('keyboard nav: sankey ribbons roam and Enter fires onpointclick', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'sankey',
            series: [{ data: [
                { from: 'A', to: 'X', value: 5 },
                { from: 'B', to: 'X', value: 3 },
            ] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const flow = handle.query('.lm-chart-flow')!;
        expect(flow.getAttribute('tabindex')).toBe('0');
        expect(flow.getAttribute('role')).toBe('application');
        expect(flow.getAttribute('aria-label')).toContain('2 links');
        expect(handle.query('svg[aria-hidden="true"] [tabindex]')).toBeNull();
        flow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.query('.lm-chart-sankey-link[data-kb="true"]')).toBeTruthy();
        expect(handle.query('.lm-chart-flow')!.getAttribute('aria-label')).toContain('A to X: 5');
        handle.query('.lm-chart-flow')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.from).toBe('A');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 0 });
    });

    it('keyboard nav: chord ribbons activate by keyboard', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'chord',
            series: [{ data: [
                { from: 'US', to: 'EU', value: 5 },
                { from: 'EU', to: 'Asia', value: 3 },
            ] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const area = handle.query('.lm-chart-pie-area')!;
        expect(area.getAttribute('tabindex')).toBe('0');
        area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); // wraps to the last link
        expect(handle.query('.lm-chart-chord-link[data-kb="true"]')).toBeTruthy();
        handle.query('.lm-chart-pie-area')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.from).toBe('EU');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 1 });
    });

    it('keyboard nav: arc diagram links activate by keyboard', () => {
        let fired: any = null;
        handle = t(Chart, {
            type: 'arcdiagram',
            series: [{ data: [
                { from: 'A', to: 'B', value: 2 },
                { from: 'B', to: 'C', value: 4 },
            ] }],
            onpointclick: (p: any, m: any) => (fired = { p, m }),
        });
        const flow = handle.query('.lm-chart-flow')!;
        expect(flow.getAttribute('tabindex')).toBe('0');
        expect(flow.getAttribute('role')).toBe('application');
        flow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        flow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.query('.lm-chart-arc-link[data-kb="true"]')).toBeTruthy();
        handle.query('.lm-chart-flow')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(fired.p.to).toBe('C');
        expect(fired.m).toEqual({ seriesIndex: 0, pointIndex: 1 });
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
        // the pie legend only renders when a position is explicitly asked for
        // (names live on the callout labels by default)
        handle = t(Chart, {
            type: 'pie', legendposition: 'right',
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
        expect(handle.queryAll('.lm-chart-pie-label').length).toBe(1);   // Big (94%) gets the % chip
        expect(handle.queryAll('.lm-chart-pie-olabel').length).toBe(3);  // every slice: name callout
        expect(handle.queryAll('.lm-chart-leader').length).toBe(3);      // one connector each
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
        // classic[0] = #4e79a7 → rgb(78,121,167)
        handle = t(Chart, { type: 'bar', categories: ['A'], palette: 'classic', series: [{ data: [1] }] });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('background:rgb(78, 121, 167)');
        handle.unmount();
        // category10[0] = #1f77b4 → rgb(31,119,180)
        handle = t(Chart, { type: 'bar', categories: ['A'], palette: 'category10', series: [{ data: [1] }] });
        expect(styleN(handle.query('.lm-chart-bar')!)).toContain('background:rgb(31, 119, 180)');
        handle.unmount();
        // custom colors win over the named palette
        handle = t(Chart, {
            type: 'bar', categories: ['A'], palette: 'classic',
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
            type: 'pie', legendposition: 'right',
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

describe('components/charts — series options, trendlines and axes', () => {
    let h: ReturnType<typeof t> | null = null;
    afterEach(() => { h?.unmount(); h = null; });

    it('trendline: a dashed fitted path per series, on category and numeric axes', () => {
        h = t(Chart, { type: 'bar', categories: ['A', 'B', 'C'], series: [{ data: [1, 2, 3], trendline: 'linear' }] });
        const trend = h.query('.lm-chart-trend')!;
        expect(trend).toBeTruthy();
        expect(trend.getAttribute('data-dashed')).toBe('dashed');
        h.unmount();
        h = t(Chart, { type: 'scatter', series: [{ data: [[1, 2], [2, 4], [3, 6.5]], trendline: { type: 'polynomial', order: 2, color: '#d00', dashed: false } }] });
        const poly = h.query('.lm-chart-trend')!;
        expect(poly.getAttribute('style')).toContain('#d00');
        expect(poly.getAttribute('data-dashed')).toBeNull();
    });

    it('trendline: none when the data cannot be fitted', () => {
        h = t(Chart, { type: 'line', categories: ['A'], series: [{ data: [1], trendline: 'linear' }] });
        expect(h.query('.lm-chart-trend')).toBeNull();
    });

    it('line options: width, dash style, marker size, per-series markers and bridged gaps', () => {
        h = t(Chart, {
            type: 'line', categories: ['A', 'B', 'C'],
            series: [
                { name: 'a', data: [1, null, 3], width: 4, dashed: 'dotted', markersize: 6, connectgaps: true },
                { name: 'b', data: [2, 2, 2], markers: false },
            ],
        });
        const lines = h.queryAll('.lm-chart-line');
        expect(lines.length).toBe(2); // the gap is bridged: one path for the first series
        expect(lines[0].getAttribute('style')).toContain('stroke-width: 4px');
        expect(lines[0].getAttribute('data-dashed')).toBe('dotted');
        const markers = h.queryAll('.lm-chart-marker');
        expect(markers.length).toBe(2); // the second series draws none
        expect(markers[0].getAttribute('style')).toContain('width: 12px');
    });

    it('title position and legend title', () => {
        h = t(Chart, { type: 'bar', title: 'T', titleposition: 'bottom', legendtitle: 'Key', categories: ['A'], series: [{ name: 's', data: [1] }] });
        expect(h.query('.lm-chart-header')!.getAttribute('data-position')).toBe('bottom');
        expect(h.query('.lm-chart-legend-title')!.textContent).toBe('Key');
    });

    it('y-axis: a fixed tick step and a reversed axis', () => {
        h = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [100] }], ymin: 0, ymax: 100, ystep: 25 });
        const ticks = h.queryAll('.lm-chart-tick').map((e) => e.textContent);
        expect(ticks).toEqual(['100', '75', '50', '25', '0']);
        h.unmount();
        h = t(Chart, { type: 'bar', categories: ['A'], series: [{ data: [100] }], ymin: 0, ymax: 100, ystep: 50, yreverse: true });
        expect(h.queryAll('.lm-chart-tick').map((e) => e.textContent)).toEqual(['0', '50', '100']);
    });

    it('boxplot computes the box from a raw sample; candlestick accepts high-low-close', () => {
        h = t(Chart, { type: 'boxplot', categories: ['A'], series: [{ data: [[1, 2, 3, 4, 5, 6, 7, 8]] }] });
        expect(h.text()).toContain('4.5'); // the median in the data table
        h.unmount();
        h = t(Chart, { type: 'candlestick', categories: ['A'], series: [{ data: [[12, 8, 10]] }] });
        expect(h.query('.lm-chart-candle, .lm-chart-ohlc, [class*="candle"]')).toBeTruthy();
    });

    it('scatter x bounds and radar outline', () => {
        h = t(Chart, { type: 'scatter', xmin: 0, xmax: 10, series: [{ data: [[2, 2], [4, 4]] }] });
        expect(h.queryAll('.lm-chart-xval').map((e) => e.textContent)).toEqual(['0', '2.5', '5', '7.5', '10']);
        h.unmount();
        h = t(Chart, { type: 'radar', categories: ['A', 'B', 'C'], series: [{ data: [1, 2, 3], type: 'line' }] });
        expect(h.query('.lm-chart-radar-area')!.getAttribute('data-nofill')).toBe('true');
    });
});
