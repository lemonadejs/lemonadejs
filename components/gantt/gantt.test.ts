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
    handle = t(Gantt, {
        data: tasks(),
        start: '2026-06-01',
        end: '2026-06-20',
        ...props,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const bars = () => handle!.queryAll('.lm-gantt-bar');
// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse it to the compact "a:b" the
// assertions are written against
const styleOf = (el: Element) => (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';');

// 2026-06-01..20 = 20 days inclusive → each day = 5% of the range
describe('components/gantt — %-positioned, table-embeddable', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Gantt).pass).toBe(true);
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
        const second = t(Gantt, {
            data: tasks(),
            start: '2026-06-01',
            end: '2026-06-20',
            header: false,
        });
        const secondStyles = [...second.root.querySelectorAll('.lm-gantt-bar')].map((el) => styleOf(el));
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

    it('drag commit keeps the viewport: no timeline jump on drop (auto-fit range)', () => {
        const data = tasks();
        let api: Api | null = null;
        // NO start/end: the range auto-fits the data — the jump-prone mode
        handle = t(Gantt, { data, editable: true, ref: (a: Api) => (api = a) });
        const before = api!.getRange();

        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        const bar = bars()[0];
        bar.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 250, height: 20, right: 250, bottom: 20, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

        // Design (June 1-5) is the earliest task: moving it later shrinks the
        // data envelope, which used to re-fit the range on drop
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 205, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 205, clientY: 10 }));

        expect(data[0].start).toBe('2026-06-03'); // the edit committed
        expect(api!.getRange()).toEqual(before);  // the viewport did NOT move
        // external changes still re-fit (the documented contract)
    });

    it('a bar collapsed to one day stays a bar and can be widened again', () => {
        const data: GanttTask[] = [{ label: 'One', start: '2026-06-03', end: '2026-06-03' }];
        open({ data, editable: true });

        // NOT a diamond: one-day tasks only render as milestones when explicit
        expect(handle!.query('.lm-gantt-milestone')).toBeNull();
        const bar = bars()[0];
        expect(bar).toBeTruthy();

        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        // one day of the 20-day range = 50px
        bar.getBoundingClientRect = () =>
            ({ left: 100, top: 0, width: 50, height: 20, right: 150, bottom: 20, x: 100, y: 0, toJSON: () => '' }) as DOMRect;

        // grab the RIGHT edge and pull +2 days — the trapped gesture before the fix
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 146, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 246, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 246, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-03'); // start untouched
        expect(data[0].end).toBe('2026-06-05');   // widened again
    });

    it('a VERY narrow one-day bar still resizes from its right edge', () => {
        const data: GanttTask[] = [{ label: 'Tiny', start: '2026-06-03', end: '2026-06-03' }];
        open({ data, editable: true });
        const bar = bars()[0];
        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        // 300px / 20 days = 15px per day: narrower than three EDGE zones
        bar.getBoundingClientRect = () =>
            ({ left: 30, top: 0, width: 15, height: 20, right: 45, bottom: 20, x: 30, y: 0, toJSON: () => '' }) as DOMRect;

        // right-edge zone wins on a narrow bar (the "widen it back" gesture)
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 43, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 73, clientY: 10 })); // +2 days
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 73, clientY: 10 }));
        expect(data[0].end).toBe('2026-06-05');
        // the commit re-rendered the row: re-grab the new (now 3-day) bar
        // and MOVE it from the center — not trapped in resize either
        const widened = bars()[0];
        widened.getBoundingClientRect = () =>
            ({ left: 30, top: 0, width: 45, height: 20, right: 75, bottom: 20, x: 30, y: 0, toJSON: () => '' }) as DOMRect;
        widened.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 52, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 82, clientY: 10 })); // +2 days
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 82, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-05');
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

    it('readonly overrides editable: view-only, but clicks still work', () => {
        const clicks: unknown[] = [];
        const data = tasks();
        open({ data, editable: true, readonly: true, onclick: (task: GanttTask) => clicks.push(task) });
        // no edit affordances
        expect(handle!.query('.lm-gantt-editable')).toBeNull();
        expect(handle!.query('.lm-gantt-link-handle')).toBeNull();
        // drag is inert
        bars()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
        // but the chart is still interactive
        bars()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(clicks).toHaveLength(1);
        expect(handle!.query('.lm-gantt')!.getAttribute('data-readonly')).toBe('true');
    });

    it('disabled blocks everything, including clicks, and marks the root', () => {
        const clicks: unknown[] = [];
        const data = tasks();
        open({ data, editable: true, disabled: true, onclick: (task: GanttTask) => clicks.push(task) });
        bars()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        bars()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
        expect(clicks).toHaveLength(0);
        expect(handle!.query('.lm-gantt')!.getAttribute('data-disabled')).toBe('true');
    });

    it('light custom bar colors flip the label dark for contrast', () => {
        open({ data: [
            { label: 'Light', start: '2026-06-01', end: '2026-06-05', color: '#ffffff' },
            { label: 'Dark', start: '2026-06-06', end: '2026-06-10', color: '#1f2937' },
        ] });
        const labels = handle!.queryAll('.lm-gantt-label');
        expect(styleOf(labels[0])).toContain('color:rgb(43, 47, 54)'); // white bar → dark text
        expect(styleOf(labels[1])).not.toContain('color:rgb(43, 47, 54)'); // dark bar → default white
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

    it('dependency links: forward takes one drop; overlapping routes through the row gap', () => {
        open({ data: [
            // forward: A ends before B starts
            { id: 'a', label: 'A', start: '2026-06-01', end: '2026-06-03' },
            { id: 'b', label: 'B', start: '2026-06-06', end: '2026-06-09', dependencies: ['a'] },
            // back-link: D starts BEFORE C ends (the overlap from the report)
            { id: 'c', label: 'C', start: '2026-06-10', end: '2026-06-15' },
            { id: 'd', label: 'D', start: '2026-06-12', end: '2026-06-17', dependencies: ['c'] },
        ] });
        const paths = handle!.queryAll('path.lm-gantt-link');
        expect(paths).toHaveLength(2);
        const segments = (p: Element) => (p.getAttribute('d') || '').match(/[HV]/g)!.join('');
        expect(segments(paths[0])).toBe('HVH');   // forward: single drop
        expect(segments(paths[1])).toBe('HVHVH'); // overlap: through the row gap
        // the gap leg runs on the boundary between rows 2 and 3 (3 × 36px)
        expect(paths[1].getAttribute('d')).toContain('V 108');
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

    it('rowheight sets the lane height', () => {
        open({ rowheight: 48 });
        const row = handle!.query('.lm-gantt-row') as HTMLElement;
        expect(styleOf(row)).toContain('height:48px');
    });

    it('KEYBOARD: bars are focusable buttons with the dates in the accessible name', () => {
        open({ editable: true });
        const bar = bars()[0];
        expect(bar.getAttribute('tabindex')).toBe('0');
        expect(bar.getAttribute('role')).toBe('button');
        // 1.1.1: the dates are IN the name, not just the title tooltip
        expect(bar.getAttribute('aria-label')).toBe('Design, 2026-06-01 to 2026-06-05');
        const diamond = handle!.query('.lm-gantt-milestone')!;
        expect(diamond.getAttribute('tabindex')).toBe('0');
        expect(diamond.getAttribute('aria-label')).toBe('Ship, milestone, 2026-06-15');
        // editable bars point at the visually hidden keyboard hint
        const hintId = bar.getAttribute('aria-describedby')!;
        expect(hintId).toBeTruthy();
        expect(document.getElementById(hintId)!.textContent).toContain('arrow keys');
    });

    it('KEYBOARD MOVE: Ctrl/Alt+Arrow shifts the bar one day — same commit path as drag', () => {
        const changes: unknown[][] = [];
        const data = tasks();
        open({ data, editable: true, onchange: (...a: unknown[]) => changes.push(a) });

        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-02'); // MY object mutated
        expect(data[0].end).toBe('2026-06-06');
        expect(changes).toEqual([[data[0], '2026-06-02', '2026-06-06']]);
        // Alt is the modifier flavor for browsers where Ctrl+Arrow is taken
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
        expect(changes).toHaveLength(2);
    });

    it('KEYBOARD RESIZE: Shift+Arrow adjusts the end, clamped at the start', () => {
        const data = tasks();
        open({ data, editable: true });
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-01'); // start untouched
        expect(data[0].end).toBe('2026-06-06');
        // shrink far past the start: the end clamps to the start date
        for (let i = 0; i < 10; i++) {
            bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }));
        }
        expect(data[0].end).toBe('2026-06-01');
    });

    it('KEYBOARD steps follow `snap`, like drag', () => {
        const data = tasks();
        open({ data, editable: true, snap: 7 });
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-08');
        expect(data[0].end).toBe('2026-06-12');
    });

    it('KEYBOARD respects the edit gate: plain arrows, readonly tasks and readonly charts are inert', () => {
        const data = tasks();
        data[1].readonly = true;
        open({ data, editable: true });
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); // no modifier
        bars()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
        expect(data[1].start).toBe('2026-06-04');
        // readonly bars carry no edit hint
        expect(bars()[1].getAttribute('aria-describedby')).toBeNull();
    });

    it('Enter/Space on a focused bar activates it (onclick), like a real button', () => {
        const clicks: unknown[] = [];
        const data = tasks();
        open({ data, onclick: (task: GanttTask) => clicks.push(task) });
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        bars()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(clicks).toEqual([data[0], data[1]]);
    });

    it('dependency removal works by keyboard: focusable hit-line, Enter unlinks', () => {
        const unlinks: unknown[][] = [];
        const data: GanttTask[] = [
            { id: 'a', label: 'A', start: '2026-06-01', end: '2026-06-03' },
            { id: 'b', label: 'B', start: '2026-06-06', end: '2026-06-09', dependencies: ['a'] },
        ];
        open({ data, editable: true, onunlink: (...a: unknown[]) => unlinks.push(a) });
        const hit = handle!.query('.lm-gantt-link-hit')!;
        expect(hit.getAttribute('tabindex')).toBe('0');
        expect(hit.getAttribute('role')).toBe('button');
        expect(hit.getAttribute('aria-label')).toBe('Remove the dependency from A to B');
        hit.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(data[1].dependencies).toEqual([]);
        expect(unlinks).toEqual([[data[0], data[1]]]);
    });

    it('the header pans by keyboard: arrows one day, Shift a week', () => {
        const api = open();
        const header = handle!.query('.lm-gantt-header')!;
        expect(header.getAttribute('tabindex')).toBe('0');
        header.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(api.getRange()).toEqual({ start: '2026-06-02', end: '2026-06-21' });
        header.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }));
        expect(api.getRange()).toEqual({ start: '2026-05-26', end: '2026-06-14' });
    });

    it('TABLE MODE: lane bars are focusable and keyboard-movable too', () => {
        const table = document.createElement('table');
        table.setAttribute('data-test', '1');
        table.id = 'gtable3';
        table.innerHTML = '<tbody><tr><td>A</td></tr></tbody>';
        document.body.appendChild(table);

        const data: GanttTask[] = [{ label: 'A', start: '2026-06-01', end: '2026-06-05' }];
        open({ data, table: '#gtable3', editable: true });
        const laneBar = () => table.querySelector('.lm-gantt-bar') as HTMLElement;
        expect(laneBar().getAttribute('tabindex')).toBe('0');
        expect(laneBar().getAttribute('aria-label')).toBe('A, 2026-06-01 to 2026-06-05');
        // keydown delegates from the lane, same commit path
        laneBar().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-02');
        expect(data[0].end).toBe('2026-06-06');
    });

    it('disabled removes the keyboard surface: no tabindex, no edits', () => {
        const data = tasks();
        open({ data, editable: true, disabled: true });
        expect(bars()[0].getAttribute('tabindex')).toBeNull();
        bars()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }));
        expect(data[0].start).toBe('2026-06-01');
    });

    it('snap quantizes drag moves to N-day steps', () => {
        const changes: unknown[][] = [];
        const data = tasks();
        open({ data, editable: true, snap: 7, onchange: (...a: unknown[]) => changes.push(a) });

        const area = handle!.query('.lm-gantt-rows') as HTMLElement;
        area.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0, toJSON: () => '' }) as DOMRect;
        const bar = bars()[0];
        bar.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: 250, height: 20, right: 250, bottom: 20, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

        // 1000px / 20 days = 50px/day; +100px = +2 days → snaps DOWN to 0
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 200, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-01'); // unmoved — below the snap step
        expect(changes).toHaveLength(0);

        // +200px = +4 days → snaps to ONE 7-day step
        bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 300, clientY: 10 }));
        expect(data[0].start).toBe('2026-06-08');
        expect(data[0].end).toBe('2026-06-12');
        expect(changes).toEqual([[data[0], '2026-06-08', '2026-06-12']]);
    });
});
