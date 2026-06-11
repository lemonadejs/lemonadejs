/**
 * <Gantt /> — the %-positioned gantt. Geometry is pure date math over
 * the range, so jsdom can verify it exactly: bar left/width %, the
 * alignment invariant across instances, drag math with stubbed rects,
 * and the TABLE mode (lanes injected into tbody rows, removed on
 * unmount).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Gantt, { type GanttTask } from '@lemonadejs/gantt';

type Api = { getRange(): { start: string; end: string }; setRange(s: string, e: string): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    document.querySelectorAll('table[data-test]').forEach((el) => el.remove());
});

const tasks = (): GanttTask[] => [
    { label: 'Design', start: '2026-06-01', end: '2026-06-05', progress: 60 },
    { label: 'Build', start: '2026-06-04', end: '2026-06-12', color: '#16a34a' },
    { label: 'Ship', start: '2026-06-15', end: '2026-06-15', type: 'milestone' },
];

const open = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Gantt as never, {
        data: tasks(),
        start: '2026-06-01',
        end: '2026-06-20',
        ...props,
        ref: (a: Api) => (api = a),
    } as never);
    return api!;
};

const bars = () => handle!.queryAll('.lm-gantt-bar');
const styleOf = (el: Element) => el.getAttribute('style') || '';

// 2026-06-01..20 = 20 days inclusive → each day = 5% of the range
describe('components/gantt — %-positioned, table-embeddable', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Gantt as never).pass).toBe(true);
    });

    it('bars are positioned in % of the range (the alignment contract)', () => {
        open();
        // Design: June 1-5 → left 0%, width 5 days = 25%
        expect(styleOf(bars()[0])).toContain('left:0%');
        expect(styleOf(bars()[0])).toContain('width:25%');
        // Build: June 4-12 → left 3/20 = 15%, width 9 days = 45%
        expect(styleOf(bars()[1])).toContain('left:15%');
        expect(styleOf(bars()[1])).toContain('width:45%');
    });

    it('two instances sharing a range align exactly (the embedding story)', () => {
        open();
        const firstStyles = bars().map(styleOf);
        const second = t(Gantt as never, {
            data: tasks(),
            start: '2026-06-01',
            end: '2026-06-20',
            header: false,
        } as never);
        const secondStyles = [...second.root.querySelectorAll('.lm-gantt-bar')].map((el) => el.getAttribute('style'));
        expect(secondStyles[0]).toContain('left:0%');
        expect(firstStyles[0]!.includes('left:0%')).toBe(true);
        expect(secondStyles[1]).toContain('left:15%');
        second.unmount();
    });

    it('milestones render as diamonds at the date midpoint', () => {
        open();
        const diamond = handle!.query('.lm-gantt-milestone')!;
        // June 15 → left 14/20 = 70% + half a day (2.5%) = 72.5%
        expect(styleOf(diamond)).toContain('left:72.5%');
    });

    it('the range fits the data when start/end are omitted (±2 days)', () => {
        const api = open({ start: '', end: '' });
        expect(api.getRange()).toEqual({ start: '2026-05-30', end: '2026-06-17' });
    });

    it('header renders month segments and day ticks; weekends marked', () => {
        open();
        const months = handle!.queryAll('.lm-gantt-month').map((el) => el.textContent);
        expect(months[0]).toContain('Jun');
        const days = handle!.queryAll('.lm-gantt-day');
        expect(days).toHaveLength(20);
        // June 6 2026 is a Saturday
        expect(days[5].getAttribute('data-weekend')).toBe('true');
        expect(days[4].getAttribute('data-weekend')).toBe(null);
    });

    it('header=false renders bars only (the per-row embedding flavor)', () => {
        open({ header: false, grid: false, today: false });
        expect(handle!.query('.lm-gantt-header')).toBeNull();
        expect(bars()).toHaveLength(2);
    });

    it('drag MOVE: snapped day shift, live preview, onchange on commit only', () => {
        const changes: unknown[][] = [];
        const data = tasks();
        open({ data, editable: true, onchange: (...a: unknown[]) => changes.push(a) });

        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        const bar = bars()[0];
        bar.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 250, height: 20, right: 250, bottom: 20, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

        // 1000px / 20 days = 50px per day; drag +100px = +2 days
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 10 }));
        expect(changes).toHaveLength(0); // preview only
        expect(styleOf(bars()[0])).toContain('left:10%'); // live preview +2 days

        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 200, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-03'); // MY object mutated
        expect(data[0].end).toBe('2026-06-07');
        expect(changes).toEqual([[data[0], '2026-06-03', '2026-06-07']]);
    });

    it('drag RESIZE from the right edge extends the end', () => {
        const data = tasks();
        open({ data, editable: true });
        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        const bar = bars()[0];
        bar.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 250, height: 20, right: 250, bottom: 20, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 246, clientY: 10 })); // right EDGE
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 346, clientY: 10 })); // +2 days
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 346, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-01'); // start untouched
        expect(data[0].end).toBe('2026-06-07');
    });

    it('Escape cancels a drag without committing', () => {
        const data = tasks();
        open({ data, editable: true });
        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        const bar = bars()[0];
        bar.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 250, height: 20, right: 250, bottom: 20, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 10 }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(data[0].start).toBe('2026-06-01'); // untouched
        expect(styleOf(bars()[0])).toContain('left:0%'); // preview reverted
    });

    it('readonly tasks and non-editable charts ignore drags', () => {
        const data = tasks();
        data[0].readonly = true;
        open({ data, editable: true });
        bars()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
    });

    it('progress renders as a fill %, clamped', () => {
        open({ data: [{ label: 'x', start: '2026-06-01', end: '2026-06-05', progress: 160 }] });
        expect(styleOf(handle!.query('.lm-gantt-progress')!)).toContain('width:100%');
    });

    it('live data: mutate + touch() re-renders; assignment refits the range', () => {
        const data = store(tasks());
        const api = open({ data, start: '', end: '' });
        data.value[0].end = '2026-06-10';
        data.touch();
        // Design now June 1-10 (10 days of the fitted 19-day range)
        expect(styleOf(bars()[0])).toContain('width:5');
        data.value = [{ label: 'Solo', start: '2026-07-01', end: '2026-07-04' }];
        expect(api.getRange()).toEqual({ start: '2026-06-29', end: '2026-07-06' });
        expect(bars()).toHaveLength(1);
    });

    it('api.setRange re-scales every bar', () => {
        const api = open();
        api.setRange('2026-06-01', '2026-06-10'); // 10 days → day = 10%
        expect(styleOf(bars()[0])).toContain('width:50%');
    });

    it('onclick reports the task', () => {
        const clicks: unknown[] = [];
        const data = tasks();
        open({ data, onclick: (task: GanttTask) => clicks.push(task) });
        bars()[1].click();
        expect(clicks).toEqual([data[1]]);
    });

    it('TABLE MODE: lanes injected per tbody row, aligned, removed on unmount', () => {
        const table = document.createElement('table');
        table.setAttribute('data-test', '1');
        table.id = 'gtable';
        table.innerHTML =
            '<tbody><tr><td>Design</td></tr><tr><td>Build</td></tr><tr><td>Ship</td></tr></tbody>';
        document.body.appendChild(table);

        open({ table: '#gtable' });

        // The component itself shows only the header (timeline)
        expect(handle!.query('.lm-gantt-header')).not.toBeNull();
        expect(handle!.query('.lm-gantt-row')).toBeNull();

        const cells = table.querySelectorAll('td.lm-gantt-cell');
        expect(cells).toHaveLength(3);
        const laneBar = cells[0].querySelector('.lm-gantt-bar') as HTMLElement;
        expect(laneBar.getAttribute('style')).toContain('left: 0%'); // imperative style
        expect(laneBar.getAttribute('style')).toContain('width: 25%');
        expect(cells[2].querySelector('.lm-gantt-milestone')).not.toBeNull();

        handle!.unmount();
        handle = null;
        expect(table.querySelectorAll('td.lm-gantt-cell')).toHaveLength(0); // table restored
    });

    it('TABLE MODE: lanes follow data changes through touch()', () => {
        const table = document.createElement('table');
        table.setAttribute('data-test', '1');
        table.id = 'gtable2';
        table.innerHTML = '<tbody><tr><td>A</td></tr></tbody>';
        document.body.appendChild(table);

        const data = store<GanttTask[]>([{ label: 'A', start: '2026-06-01', end: '2026-06-05' }]);
        open({ data, table: '#gtable2' });
        const lane = () => table.querySelector('.lm-gantt-bar') as HTMLElement;
        expect(lane().getAttribute('style')).toContain('width: 25%');

        data.value[0].end = '2026-06-10';
        data.touch();
        expect(lane().getAttribute('style')).toContain('width: 50%');
    });
});
