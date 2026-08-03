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
    // warning on a RED event on purpose — the flag must survive a red background
    { date: day(4), start: '11:00', end: '12:00', title: 'Budget review', color: '#dc2626', warning: true },
    { date: day(4), start: '15:00', end: '17:00', title: 'Sprint planning', color: '#e91e63', location: 'Room 4' },
    { date: day(5), start: '09:00', end: '09:30', title: 'Standup', color: '#3f51b5' },
    { date: day(5), start: '13:00', end: '14:00', title: 'Company all-hands', color: '#9c27b0', readonly: true },
    { date: day(5), start: '16:00', end: '17:00', title: 'Retro', color: '#00bcd4' },
]);

// A second dataset where events deliberately overlap in time
const overlapData = store<ScheduleEvent[]>([
    { date: day(2), start: '09:00', end: '11:00', title: 'Workshop', color: '#3f51b5' },
    { date: day(2), start: '09:30', end: '10:30', title: 'Quick sync', color: '#e91e63' },
    { date: day(2), start: '10:00', end: '12:00', title: 'Pairing', color: '#009688' },
    { date: day(3), start: '13:00', end: '15:00', title: 'Review', color: '#ff9800' },
    { date: day(3), start: '14:00', end: '16:00', title: 'Planning', color: '#9c27b0' },
]);

// A packed dataset for overlap=false: dragging one event onto another (or
// creating inside an occupied slot) must be rejected with an onerror message
const conflictData = store<ScheduleEvent[]>([
    { date: day(2), start: '09:00', end: '10:00', title: 'Interview', color: '#3f51b5' },
    { date: day(2), start: '10:00', end: '11:00', title: 'Follow-up', color: '#009688' },
    { date: day(3), start: '09:30', end: '11:30', title: 'Onboarding', color: '#ff9800' },
    { date: day(3), start: '13:00', end: '14:00', title: '1:1', color: '#9c27b0' },
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
    const grid = state(15);
    const weekly = state(false);
    const editor = state(true);
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

        <div class="toolbar">
            <label>grid
                <select onchange="${(e: Event) => (grid.value = parseInt((e.target as HTMLSelectElement).value, 10))}">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">60 min</option>
                </select>
            </label>
            <label><input type="checkbox"
                onchange="${(e: Event) => (weekly.value = (e.target as HTMLInputElement).checked)}" /> weekly (no dates)</label>
            <label><input type="checkbox" checked
                onchange="${(e: Event) => (editor.value = (e.target as HTMLInputElement).checked)}" /> editor</label>
            <button onclick="${() => document.body.classList.toggle('lm-dark-mode')}">&#9789; dark mode</button>
        </div>

        <div class="board">
            <${Schedule}
                data="${data}"
                type="${view}"
                grid="${grid}"
                weekly="${weekly}"
                editor="${editor}"
                readonlyrange="${['12:00', '13:00']}"
                ref="${(a: Api) => (api = a)}"
                oncreate="${(events: ScheduleEvent[]) => note('oncreate: ' + events[0].title)}"
                onupdate="${(r: ScheduleEvent) => note('onupdate: ' + r.title + ' ' + r.start + '-' + r.end)}"
                ondelete="${(r: ScheduleEvent) => note('ondelete: ' + r.title)}"
                onerror="${(m: string) => note('onerror: ' + m)}"
                onchange="${(d: ScheduleEvent[]) => note('onchange: ' + d.length + ' events')}" />
        </div>

        <h3>Overlapping events (overlap enabled — staggered side by side)</h3>
        <div class="board">
            <${Schedule}
                data="${overlapData}"
                type="week"
                grid="${15}"
                overlap
                validrange="${['08:00', '18:00']}" />
        </div>

        <h3>No overlap (overlap false — drag an event onto another to see the rejection)</h3>
        <div class="board">
            <${Schedule}
                data="${conflictData}"
                type="week"
                grid="${15}"
                overlap="${false}"
                validrange="${['08:00', '18:00']}"
                onerror="${(m: string) => note('onerror: ' + m)}" />
        </div>

        <h3>event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
