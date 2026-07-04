/**
 * In-page real-browser probe for <Chart /> — pixel geometry that jsdom can't
 * see (it has no layout). Locks down the things that broke before: the bar
 * baseline sitting exactly on the zero gridline, line markers centred on their
 * columns + x-labels (the 4% flex-gap bug), dual-axis tick alignment, and
 * scatter point placement. Results in #lm-probe for scripts/chrome-probe.mjs.
 */
import { html, mount, type Component } from 'lemonadejs';
import Chart from '@lemonadejs/chart';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}): void => {
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
};
const frame = (): Promise<number> =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));
const near = (a: number, b: number, tol = 1.5): boolean => Math.abs(a - b) <= tol;
const r = (el: Element | null): DOMRect => (el as HTMLElement).getBoundingClientRect();
const cx = (el: Element | null): number => { const b = r(el); return b.left + b.width / 2; };

const App: Component = () => html`<div style="padding:20px;display:flex;flex-direction:column;gap:30px;max-width:640px">
    <div id="c-bar" style="height:300px"><${Chart} type="bar" animate="${false}"
        categories="${['Q1', 'Q2', 'Q3', 'Q4']}" series="${[{ name: 'A', data: [10, -6, 14, 8] }]}" /></div>
    <div id="c-line" style="height:300px"><${Chart} type="line" animate="${false}"
        categories="${['Q1', 'Q2', 'Q3', 'Q4']}" series="${[{ name: 'A', data: [3, 7, 5, 9] }]}" /></div>
    <div id="c-combo" style="height:300px"><${Chart} animate="${false}" categories="${['Q1', 'Q2']}"
        series="${[{ name: 'Rev', type: 'bar', data: [100, 200] }, { name: 'Pct', type: 'line', axis: 'right', data: [10, 50] }]}" /></div>
    <div id="c-scatter" style="height:300px"><${Chart} type="scatter" animate="${false}"
        series="${[{ name: 'A', data: [[0, 0], [10, 10]] }]}" /></div>
    <div id="c-pie" style="height:300px"><${Chart} type="pie"
        series="${[{ data: [{ name: 'A', value: 30 }, { name: 'B', value: 70 }] }]}" /></div>
    <div id="c-zoom" style="height:300px"><${Chart} type="bar" zoom animate="${false}"
        categories="${Array.from({ length: 10 }, (_, i) => 'c' + i)}" series="${[{ data: Array.from({ length: 10 }, (_, i) => i + 1) }]}" /></div>
    <div id="c-cloud" style="height:300px"><${Chart} type="wordcloud" animate="${false}"
        series="${[{ data: [
            { name: 'Lemonade', value: 90 }, { name: 'Reactive', value: 64 }, { name: 'Charts', value: 52 },
            { name: 'Components', value: 46 }, { name: 'Template', value: 38 }, { name: 'State', value: 34 },
            { name: 'Bindings', value: 30 }, { name: 'Signals', value: 26 }, { name: 'Props', value: 24 },
            { name: 'Events', value: 20 }, { name: 'Tooltips', value: 16 }, { name: 'Palette', value: 14 },
        ] }]}" /></div>
</div>`;

const mouse = (el: Element, type: string, x: number, y: number): void =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));

const run = async (): Promise<void> => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // 1. bar baseline sits on the zero gridline (positives up, negatives down)
    const barC = document.getElementById('c-bar')!;
    const bars = [...barC.querySelectorAll('.lm-chart-bar')];
    const zero = barC.querySelector('.lm-chart-gridline[data-zero="true"]');
    const zeroY = r(zero).top;
    log('bar+ bottom on zero line', near(r(bars[0]).bottom, zeroY, 2), { bar: r(bars[0]).bottom, zero: zeroY });
    log('bar- top on zero line', near(r(bars[1]).top, zeroY, 2), { bar: r(bars[1]).top, zero: zeroY });

    // 2. line markers centred on their columns AND on the x-axis labels
    const lineC = document.getElementById('c-line')!;
    const markers = [...lineC.querySelectorAll('.lm-chart-marker')];
    const cats = [...lineC.querySelectorAll('.lm-chart-cat')];
    const cols = [...lineC.querySelectorAll('.lm-chart-col')];
    let alignOk = markers.length === 4;
    for (let i = 0; i < markers.length; i++) {
        if (!near(cx(markers[i]), cx(cols[i]), 1.5) || !near(cx(markers[i]), cx(cats[i]), 1.5)) alignOk = false;
    }
    log('line markers centred on columns + labels', alignOk,
        { m0: Math.round(cx(markers[0])), col0: Math.round(cx(cols[0])), cat0: Math.round(cx(cats[0])) });

    // 3. dual-axis: left + right have the same number of aligned gridline rows
    const comboC = document.getElementById('c-combo')!;
    const lTicks = comboC.querySelectorAll('.lm-chart-grid .lm-chart-gridline').length;
    const rTicks = comboC.querySelectorAll('.lm-chart-grid-right .lm-chart-gridline-r').length;
    log('dual-axis tick rows match', lTicks > 0 && lTicks === rTicks, { left: lTicks, right: rTicks });

    // 4. scatter: a zero boundary sits ON the edge; the padded max sits INSIDE
    const scC = document.getElementById('c-scatter')!;
    const plot = scC.querySelector('.lm-chart-plot')!;
    const dots = [...scC.querySelectorAll('.lm-chart-dot')];
    const pr = r(plot);
    // extent padding now applies past zero too: the x-min dot must sit
    // fully INSIDE the plot (it used to sit half-clipped on the axis line)
    log('scatter dot at x-min inside the plot', cx(dots[0]) > pr.left + 4, { dot: Math.round(cx(dots[0])), left: Math.round(pr.left) });
    // the extent pads 5% past the data max, so the last dot must be fully
    // inside the plot (it used to sit half-clipped on the right edge)
    log('scatter dot at x-max inside the plot', cx(dots[1]) < pr.right - 4 && cx(dots[1]) > pr.left + (pr.right - pr.left) * 0.6,
        { dot: Math.round(cx(dots[1])), right: Math.round(pr.right) });

    // 5. pie: two slices, square aspect (height ~= width of the svg area)
    const pieC = document.getElementById('c-pie')!;
    log('pie has 2 slices', pieC.querySelectorAll('.lm-chart-slice').length === 2, {});
    const area = pieC.querySelector('.lm-chart-pie-area');
    log('pie area is square', near(r(area).width, r(area).height, 2), { w: Math.round(r(area).width), h: Math.round(r(area).height) });

    // 6. zoom: drag-select ~40%–80% of 10 categories → zooms to a subset; reset restores
    const zoomC = document.getElementById('c-zoom')!;
    const before = zoomC.querySelectorAll('.lm-chart-cat').length;
    const zcols = zoomC.querySelector('.lm-chart-cols')!;
    const cb = r(zcols);
    const yy = cb.top + cb.height / 2;
    mouse(zcols, 'mousedown', cb.left + cb.width * 0.4, yy);
    mouse(zcols, 'mousemove', cb.left + cb.width * 0.5, yy);
    mouse(zcols, 'mousemove', cb.left + cb.width * 0.8, yy);
    mouse(zcols, 'mouseup', cb.left + cb.width * 0.8, yy);
    await frame();
    const after = zoomC.querySelectorAll('.lm-chart-cat').length;
    log('zoom drag narrows the category window', before === 10 && after < before && after > 0, { before, after });
    (zoomC.querySelector('.lm-chart-zoomreset') as HTMLElement)?.click();
    await frame();
    log('zoom reset restores all categories', zoomC.querySelectorAll('.lm-chart-cat').length === 10, { n: zoomC.querySelectorAll('.lm-chart-cat').length });

    // 7. wordcloud: every word inside the svg box, no pair of words overlapping
    // (the layout estimates text widths — only a real font can prove the boxes)
    const cloudC = document.getElementById('c-cloud')!;
    const words = [...cloudC.querySelectorAll('.lm-chart-cloud-word')];
    log('wordcloud renders every word', words.length === 12, { n: words.length });
    const box = r(cloudC.querySelector('.lm-chart-cloud-svg'));
    const inside = words.every((w) => {
        const b = r(w);
        return b.left >= box.left - 1 && b.right <= box.right + 1 && b.top >= box.top - 1 && b.bottom <= box.bottom + 1;
    });
    log('wordcloud words inside the box', inside, {});
    let collisions = 0;
    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
            const a = r(words[i]);
            const b = r(words[j]);
            // text bounding boxes carry ascender/descender padding; only count
            // a real overlap (more than a couple of px in both axes)
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ox > 2 && oy > 2) collisions++;
        }
    }
    log('wordcloud words do not overlap', collisions === 0, { collisions });

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
