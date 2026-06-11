/**
 * Real-browser probe for <Gantt /> — the alignment contract measured:
 * bars across table lanes and the standalone chart line up when ranges
 * match; drag move/resize with REAL geometry commits snapped dates.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Gantt, { type GanttTask } from '@lemonadejs/gantt';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const data = store<GanttTask[]>([
    { label: 'Design', start: '2026-06-01', end: '2026-06-05', progress: 60 },
    { label: 'Build', start: '2026-06-04', end: '2026-06-12', color: '#16a34a' },
]);
const laneTasks = store<GanttTask[]>([
    { label: 'Design', start: '2026-06-01', end: '2026-06-05' },
    { label: 'Build', start: '2026-06-04', end: '2026-06-12' },
]);

const App: Component = () => html`<div style="width:800px">
    <div id="chart"></div>
    <table id="ptable" style="width:800px;border-collapse:collapse;table-layout:fixed">
        <tbody>
            <tr><td style="width:0;padding:0"></td></tr>
            <tr><td style="width:0;padding:0"></td></tr>
        </tbody>
    </table>
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    mount(Gantt as never, document.getElementById('chart') as Element, {
        data,
        start: '2026-06-01',
        end: '2026-06-20',
        editable: true,
    } as never);
    mount(Gantt as never, document.createElement('div'), {
        data: laneTasks,
        start: '2026-06-01',
        end: '2026-06-20',
        table: '#ptable',
        editable: true,
    } as never);
    await frame();

    // ---- 1. % math against real pixels: Design = 5 of 20 days = 25%
    const chartBar = document.querySelector('#chart .lm-gantt-bar') as HTMLElement;
    const rows = document.querySelector('#chart .lm-gantt-rows') as HTMLElement;
    const ratio = chartBar.getBoundingClientRect().width / rows.getBoundingClientRect().width;
    log('bar-width-25pct-of-range', Math.abs(ratio - 0.25) < 0.01, { ratio: Math.round(ratio * 1000) / 10 });

    // ---- 2. THE ALIGNMENT CONTRACT: the chart bar and the table lane
    // bar (same range, same dates) start at the same x and same width
    const laneBar = document.querySelector('#ptable .lm-gantt-bar') as HTMLElement;
    const a = chartBar.getBoundingClientRect();
    const b = laneBar.getBoundingClientRect();
    log('chart-and-table-lane-align', Math.abs(a.left - b.left) <= 1.5 && Math.abs(a.width - b.width) <= 1.5, {
        chartLeft: Math.round(a.left),
        laneLeft: Math.round(b.left),
        chartW: Math.round(a.width),
        laneW: Math.round(b.width),
    });

    // ---- 3. drag MOVE with real geometry: +2 days at 40px/day
    const dayPx = rows.getBoundingClientRect().width / 20;
    const r0 = chartBar.getBoundingClientRect();
    chartBar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r0.left + r0.width / 2, clientY: r0.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r0.left + r0.width / 2 + dayPx * 2, clientY: r0.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: r0.left + r0.width / 2 + dayPx * 2, clientY: r0.top + 5 }));
    await frame();
    log('drag-move-commits-2-days', data.value[0].start === '2026-06-03' && data.value[0].end === '2026-06-07', {
        start: data.value[0].start,
        end: data.value[0].end,
    });

    // ---- 4. drag RESIZE from the right edge: +3 days
    const bar2 = document.querySelectorAll('#chart .lm-gantt-bar')[1] as HTMLElement;
    const r2 = bar2.getBoundingClientRect();
    bar2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r2.right - 3, clientY: r2.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r2.right - 3 + dayPx * 3, clientY: r2.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: r2.right - 3 + dayPx * 3, clientY: r2.top + 5 }));
    await frame();
    log('drag-resize-commits-3-days', data.value[1].start === '2026-06-04' && data.value[1].end === '2026-06-15', {
        start: data.value[1].start,
        end: data.value[1].end,
    });

    // ---- 5. lane bars are draggable too: move the table lane +2 days
    const lane0 = document.querySelector('#ptable .lm-gantt-bar') as HTMLElement;
    const lr = lane0.getBoundingClientRect();
    lane0.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: lr.left + lr.width / 2, clientY: lr.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: lr.left + lr.width / 2 + dayPx * 2, clientY: lr.top + 5, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: lr.left + lr.width / 2 + dayPx * 2, clientY: lr.top + 5 }));
    await frame();
    log('table-lane-drag-commits', laneTasks.value[0].start === '2026-06-03', { start: laneTasks.value[0].start });

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
