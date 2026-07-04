/**
 * Local playground for <Gantt /> — served by `npm run dev`
 * Two mounting modes: the full chart in a div, and lanes injected
 * into an existing table's rows (the spreadsheet-integration story).
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Gantt, { type GanttTask } from '@lemonadejs/gantt';

const project = store<GanttTask[]>([
    { id: 'discovery', label: 'Discovery', start: '2026-06-01', end: '2026-06-04', progress: 100, color: '#45889c' },
    { id: 'design', label: 'Design', start: '2026-06-03', end: '2026-06-09', progress: 80, dependencies: ['discovery'] },
    { id: 'build', label: 'Build', start: '2026-06-08', end: '2026-06-18', progress: 45, color: '#578163', dependencies: ['design'] },
    { id: 'qa', label: 'QA', start: '2026-06-16', end: '2026-06-22', progress: 10, color: '#bd7f40', dependencies: ['build'] },
    { id: 'launch', label: 'Launch', start: '2026-06-24', end: '2026-06-24', type: 'milestone', dependencies: ['qa'] },
]);

const tableTasks = store<GanttTask[]>([
    { label: 'Backend', start: '2026-06-02', end: '2026-06-10', progress: 70 },
    { label: 'Frontend', start: '2026-06-06', end: '2026-06-16', progress: 40, color: '#578163' },
    { label: 'Docs', start: '2026-06-14', end: '2026-06-19', progress: 0, color: '#6342a1' },
]);

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-6), m]);

    return html`<div>
        <h1>&lt;Gantt /&gt;</h1>

        <h3>Full chart in a div — drag bars to move, drag edges to resize</h3>
        <div style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden">
            <${Gantt} data="${project}" start="2026-05-30" end="2026-06-28" editable
                onchange="${(task: GanttTask, s: string, e: string) =>
                    note(task.label + ' → ' + s + ' .. ' + e)}"
                onclick="${(task: GanttTask) => note('clicked ' + task.label)}"></${Gantt}>
        </div>

        <h3>Mounted OVER a table — lanes injected into YOUR rows</h3>
        <p>The component below renders only the timeline header; the bars live
        inside the table's rows, %-aligned, fully draggable.</p>
        <table id="project-table" style="width:100%;border-collapse:collapse">
            <thead><tr>
                <th style="width:140px;text-align:left;padding:6px 10px;border-bottom:1px solid #e4e4e7">Task</th>
                <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #e4e4e7">
                    <div id="gantt-header-slot"></div>
                </th>
            </tr></thead>
            <tbody>
                <tr><td style="padding:6px 10px;border-bottom:1px solid #f4f4f5">Backend</td></tr>
                <tr><td style="padding:6px 10px;border-bottom:1px solid #f4f4f5">Frontend</td></tr>
                <tr><td style="padding:6px 10px;border-bottom:1px solid #f4f4f5">Docs</td></tr>
            </tbody>
        </table>

        <h3>Event log</h3>
        <pre style="font-size:12px">${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);

// The table-mode gantt: its own element is the timeline header, placed
// in the table head; the lanes go into #project-table's tbody rows
mount(Gantt as never, document.getElementById('gantt-header-slot') as Element, {
    data: tableTasks,
    start: '2026-06-01',
    end: '2026-06-22',
    table: '#project-table',
    editable: true,
} as never);
