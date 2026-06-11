/**
 * Local playground for <Schedule /> — served by `npm run dev`.
 * A populated working week around today: drag empty cells to create,
 * drag events to move (top zone) or resize (bottom edge), double click
 * to edit, Delete / Ctrl+C / Ctrl+V / Ctrl+Z / Ctrl+Y on the keyboard.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Schedule, { type ScheduleEvent } from '@lemonadejs/schedule';

// This week's dates, computed locally (the demo is always populated)
const day = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + offset); // offset from Sunday
    return (
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
    );
};

const data = store<ScheduleEvent[]>([
    { date: day(1), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(1), start: '11:00', end: '12:30', title: 'Design review', color: '#009688', location: 'Room 2' },
    { date: day(2), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(2), start: '14:00', end: '16:00', title: 'Deep work', color: '#795548', description: 'No meetings' },
    { date: day(3), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(3), start: '10:00', end: '11:00', title: 'Customer call', color: '#ff9800', location: 'Zoom' },
    { date: day(3), start: '12:00', end: '13:00', title: 'Lunch & learn', color: '#8bc34a' },
    { date: day(4), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(4), start: '15:00', end: '17:00', title: 'Sprint planning', color: '#e91e63', location: 'Room 4' },
    { date: day(5), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(5), start: '13:00', end: '14:00', title: 'Company all-hands', color: '#9c27b0', readonly: true },
    { date: day(5), start: '16:00', end: '17:00', title: 'Retro', color: '#00bcd4' },
]);

type Api = {
    next(): void;
    prev(): void;
    today(): void;
    undo(): void;
    redo(): void;
};

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const view = state('week');
    let api: Api | null = null;

    const note = (line: string) => {
        log.value = [...log.value.slice(-7), line];
    };

    return html`<div class="demo">
        <h1>&lt;Schedule /&gt;</h1>

        <div class="toolbar">
            <button onclick="${() => api!.prev()}">&larr; Prev</button>
            <button onclick="${() => api!.today()}">Today</button>
            <button onclick="${() => api!.next()}">Next &rarr;</button>
            <select onchange="${(e: Event) => (view.value = (e.target as HTMLSelectElement).value)}">
                <option value="week">week</option>
                <option value="weekdays">weekdays</option>
                <option value="day">day</option>
            </select>
            <button onclick="${() => api!.undo()}">Undo</button>
            <button onclick="${() => api!.redo()}">Redo</button>
        </div>

        <div class="board">
            <${Schedule}
                data="${data}"
                type="${view}"
                grid="${15}"
                validrange="${['06:00', '22:00']}"
                ref="${(a: Api) => (api = a)}"
                oncreate="${(events: ScheduleEvent[]) => note('oncreate: ' + events[0].title)}"
                onupdate="${(r: ScheduleEvent) => note('onupdate: ' + r.title + ' ' + r.start + '-' + r.end)}"
                ondelete="${(r: ScheduleEvent) => note('ondelete: ' + r.title)}"
                onerror="${(m: string) => note('onerror: ' + m)}"
                onchange="${(d: ScheduleEvent[]) => note('onchange: ' + d.length + ' events')}" />
        </div>

        <h3>event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
