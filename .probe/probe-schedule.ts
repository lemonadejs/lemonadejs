/**
 * Real-browser probe for <Schedule /> — the drag geometry jsdom cannot
 * verify: event placement, drag-create, drag-move across columns,
 * drag-resize. The special-attention review pass for the heavyweight.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Schedule, { type ScheduleEvent } from '@lemonadejs/schedule';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const data = store<ScheduleEvent[]>([
    { title: 'Standup', date: '2026-06-10', start: '09:00', end: '09:30', color: '#3f51b5' } as ScheduleEvent,
]);

const App: Component = () => html`<div style="width:980px">
    <${Schedule} data="${data}" value="2026-06-10" type="week" grid="15" editor="${false}"></${Schedule}>
</div>`;

const mouse = (type: string, x: number, y: number) =>
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons: 1 });

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    const items = () => [...document.querySelectorAll('.lm-schedule-item:not(.lm-schedule-dragging)')] as HTMLElement[];
    const cell = (x: number, y: number) => document.querySelector(`td[data-x="${x}"][data-y="${y}"]`) as HTMLElement;

    // ---- 1. the seeded event is placed: 30min at grid 15 = 2 rows = 30px
    const seeded = items()[0];
    const sr = seeded.getBoundingClientRect();
    const expectedTop = cell(3, 36).getBoundingClientRect().top; // 09:00 = row 36 (9*4), Wed = x 3
    log('event-placed-at-0900-wed', Math.abs(sr.top - expectedTop) <= 2 && Math.abs(sr.height - 30) <= 2, {
        top: Math.round(sr.top),
        expectedTop: Math.round(expectedTop),
        h: Math.round(sr.height),
    });

    // ---- 2. drag-create: Friday 10:00 -> 12:00 (rows 40..47)
    const fromCell = cell(5, 40);
    const toCell = cell(5, 47);
    const fr = fromCell.getBoundingClientRect();
    const tr = toCell.getBoundingClientRect();
    fromCell.dispatchEvent(mouse('mousedown', fr.left + 20, fr.top + 3));
    toCell.dispatchEvent(mouse('mousemove', tr.left + 20, tr.top + 8));
    document.dispatchEvent(mouse('mouseup', tr.left + 20, tr.top + 8));
    await frame();
    const created = data.value.find((ev) => ev !== data.value[0] && (ev as ScheduleEvent).date === '2026-06-12');
    log('drag-create-event', data.value.length === 2 && !!created && (created as ScheduleEvent).start === '10:00', {
        count: data.value.length,
        start: created && (created as ScheduleEvent).start,
        end: created && (created as ScheduleEvent).end,
    });
    const newItem = items().find((el) => el.closest('td') === cell(5, 40) || Math.abs(el.getBoundingClientRect().top - cell(5, 40).getBoundingClientRect().top) < 3);
    log('created-event-rendered', !!newItem && newItem.getBoundingClientRect().height >= 100, {
        h: newItem && Math.round(newItem.getBoundingClientRect().height),
    });

    // ---- 3. drag-move the standup from Wednesday to Thursday (top zone)
    const moveItem = items()[0];
    const mr = moveItem.getBoundingClientRect();
    const target = cell(4, 36); // Thu 09:00
    const tgr = target.getBoundingClientRect();
    moveItem.dispatchEvent(mouse('mousedown', mr.left + 15, mr.top + 8)); // top 25px = move zone
    target.dispatchEvent(mouse('mousemove', tgr.left + 20, tgr.top + 5));
    document.dispatchEvent(mouse('mouseup', tgr.left + 20, tgr.top + 5));
    await frame();
    const standup = data.value.find((ev) => (ev as ScheduleEvent).title === 'Standup') as ScheduleEvent;
    log('drag-move-changes-day', standup.date === '2026-06-11' && standup.start === '09:00', {
        date: standup.date,
        start: standup.start,
    });

    // ---- 4. drag-resize the standup: bottom edge down ~60px (=1h)
    // (titles render via data-title + CSS attr(), so query the attribute)
    const resizeItem = document.querySelector('.lm-schedule-item[data-title="Standup"]') as HTMLElement;
    const rr = resizeItem.getBoundingClientRect();
    resizeItem.dispatchEvent(mouse('mousedown', rr.left + 15, rr.bottom - 2)); // bottom 5px = resize zone
    // mousemove must carry a real cell target (the grid resolves via closest('td'))
    const stretchCell = cell(4, 42); // Thu ~10:30
    const scr = stretchCell.getBoundingClientRect();
    stretchCell.dispatchEvent(mouse('mousemove', scr.left + 15, scr.top + 5));
    document.dispatchEvent(mouse('mouseup', scr.left + 15, scr.top + 5));
    await frame();
    const resized = data.value.find((ev) => (ev as ScheduleEvent).title === 'Standup') as ScheduleEvent;
    log('drag-resize-extends-end', resized.end >= '10:15' && resized.end <= '10:45', { end: resized.end });

    // ---- 5. external mutation + touch re-renders
    data.value.push({ title: 'Late sync', date: '2026-06-12', start: '16:00', end: '17:00' } as ScheduleEvent);
    data.touch();
    await frame();
    log('mutate-touch-renders', !!document.querySelector('.lm-schedule-item[data-title="Late sync"]'), {
        rendered: items().length,
    });

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
