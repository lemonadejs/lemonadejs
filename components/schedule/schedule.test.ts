/**
 * <Schedule /> block tests — the v5 time-grid scheduler on the v6 contract:
 * views (week/weekdays/day/weekly), grid math, event placement, drag
 * create/move/resize, selection + keyboard (arrows/Delete/copy/paste/
 * undo/redo), the data api, ranges, the built-in Modal editor, live data
 * by reference (assignment AND mutate+touch) and destroy-clean listeners.
 *
 * Dates are explicit ('2026-06-10' is a Wednesday; its week runs Sun
 * 2026-06-07 .. Sat 2026-06-13) — no timezone or "what is today" drift,
 * except the two now-pointer tests which compute today locally.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Schedule, { type ScheduleEvent } from '@lemonadejs/schedule';

type Api = {
    addEvents(events: ScheduleEvent | ScheduleEvent[]): ScheduleEvent[] | false;
    updateEvent(mixed: string | ScheduleEvent, newValue: Partial<ScheduleEvent>): boolean;
    deleteEvents(mixed: unknown): boolean;
    getData(): ScheduleEvent[];
    setData(data: ScheduleEvent[], saveHistory?: boolean): boolean;
    getEvent(guid: string): ScheduleEvent | null;
    getSelected(): string[];
    resetSelection(): void;
    setRange(range: string[]): void;
    setReadOnly(range: unknown[]): void;
    undo(): void;
    redo(): void;
    next(): void;
    prev(): void;
    today(): void;
    openEditor(guid: string): void;
    refresh(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    document.body.style.cursor = '';
});

/** The Modal editor defers per-open setup one microtask */
const flush = () => new Promise((r) => setTimeout(r, 0));

const root = () => handle!.query('.lm-schedule')!;
const items = () => handle!.queryAll('.lm-schedule-item:not(.lm-schedule-dragging)');
const item = () => items()[0];
const ghost = () => handle!.query('.lm-schedule-dragging');
const headerCells = () => handle!.queryAll('thead td[data-day]');
const cellAt = (date: string, y: number) =>
    handle!.query('td[data-date="' + date + '"][data-y="' + y + '"]')!;

const mouse = (el: Element | Document, type: string, init: MouseEventInit = {}) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, ...init }));

const key = (k: string, init: KeyboardEventInit = {}) =>
    root().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));

/** jsdom has no layout: give an event element a believable rect so the
 *  v5 hit zones (top 25px = move, bottom 5px = resize) are reachable */
const stubRect = (el: Element, height: number) =>
    Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            top: 0, left: 0, right: 100, bottom: height,
            width: 100, height, x: 0, y: 0, toJSON: () => ({}),
        }),
    });

const mount = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Schedule, {
        value: '2026-06-10',
        editor: false,
        ...props,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const sample = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
    date: '2026-06-10',
    start: '09:00',
    end: '10:00',
    title: 'Standup',
    color: '#3f51b5',
    ...over,
});

// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse to canonical "a:b;c:d"
const styleN = (el: Element) =>
    (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;$/, '');

describe('components/schedule', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Schedule).pass).toBe(true);
    });

    // ---- views -----------------------------------------------------------

    it('renders the week view: 7 day columns anchored on the Sunday of value', () => {
        mount();
        const days = headerCells();
        expect(days.length).toBe(7);
        expect(days[0].getAttribute('data-weekday')).toBe('Sun');
        expect(days[0].textContent).toBe('07'); // Sun 2026-06-07
        expect(days[6].textContent).toBe('13'); // Sat 2026-06-13
        expect(cellAt('2026-06-07', 0)).not.toBeNull();
        expect(cellAt('2026-06-13', 0)).not.toBeNull();
    });

    it('renders the weekdays view: Mon-Fri only', () => {
        mount({ type: 'weekdays' });
        const days = headerCells();
        expect(days.length).toBe(5);
        expect(days.map((d) => d.getAttribute('data-weekday'))).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        expect(days[0].textContent).toBe('08'); // Mon 2026-06-08
        expect(handle!.query('td[data-date="2026-06-07"]')).toBeNull();
    });

    it('renders the day view: a single column on the anchor date', () => {
        mount({ type: 'day' });
        const days = headerCells();
        expect(days.length).toBe(1);
        expect(days[0].getAttribute('data-weekday')).toBe('Wed');
        expect(days[0].textContent).toBe('10');
        expect(root().getAttribute('data-type')).toBe('day');
    });

    it('weekly mode drops dates: columns are abstract weekdays', () => {
        mount({ weekly: true, data: [{ weekday: 3, start: '09:00', end: '10:00', title: 'Recurring' }] });
        expect(headerCells().length).toBe(7);
        expect(headerCells()[0].textContent).toBe(''); // no day numbers
        expect(handle!.query('td[data-date]')).toBeNull();
        const it36 = handle!.query('td[data-x="3"][data-y="36"] .lm-schedule-item');
        expect(it36).not.toBeNull();
        expect(it36!.getAttribute('data-title')).toBe('Recurring');
    });

    it('localizes weekday names through the weekdays prop (v5: document.dictionary)', () => {
        mount({ weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'] });
        expect(headerCells()[0].getAttribute('data-weekday')).toBe('Dom');
        expect(headerCells()[6].getAttribute('data-weekday')).toBe('Sab');
    });

    // ---- grid ------------------------------------------------------------

    it('builds the time grid from the grid prop: rows, heights, hour labels, large class', () => {
        mount(); // grid 15
        expect(handle!.queryAll('tbody tr').length).toBe(96);
        expect(handle!.queryAll('tbody tr.lm-schedule-hour').length).toBe(24);
        expect(styleN(handle!.queryAll('tbody tr')[0])).toContain('height:15px');
        expect(handle!.queryAll('.lm-schedule-index')[9].textContent).toBe('09:00');
        expect(root().className).toContain('lm-schedule-large'); // v5: grid > 9
        handle!.unmount();

        mount({ grid: 30 });
        expect(handle!.queryAll('tbody tr').length).toBe(48);
        handle!.unmount();

        mount({ grid: 5 });
        expect(handle!.queryAll('tbody tr').length).toBe(288);
        expect(root().className).not.toContain('lm-schedule-large');
    });

    it('validrange hides hours outside the window; setRange validates (v5 parity)', () => {
        const errors: string[] = [];
        const api = mount({ validrange: ['08:00', '18:00'], onerror: (m: string) => errors.push(m) });
        expect(handle!.queryAll('tbody tr').length).toBe(40); // 10h * 4 rows
        expect(handle!.query('td[data-y="31"]')).toBeNull();
        expect(handle!.query('td[data-y="32"]')).not.toBeNull();

        api.setRange(['08:00', '12:00']);
        expect(handle!.queryAll('tbody tr').length).toBe(16);

        api.setRange(['nope', '12:00']);
        expect(errors).toEqual(['Invalid range time']);
        expect(handle!.queryAll('tbody tr').length).toBe(16); // unchanged
    });

    it('readonlyrange disables cells; setReadOnly accepts single and multiple ranges', () => {
        const errors: string[] = [];
        const api = mount({ readonlyrange: ['00:00', '08:00'], onerror: (m: string) => errors.push(m) });
        expect(cellAt('2026-06-10', 0).className).toContain('lm-schedule-disabled');
        expect(cellAt('2026-06-10', 31).className).toContain('lm-schedule-disabled');
        expect(cellAt('2026-06-10', 32).className).not.toContain('lm-schedule-disabled');

        api.setReadOnly([['00:00', '06:00'], ['20:00', '23:55']]);
        expect(cellAt('2026-06-10', 23).className).toContain('lm-schedule-disabled');
        expect(cellAt('2026-06-10', 30).className).not.toContain('lm-schedule-disabled');
        expect(cellAt('2026-06-10', 81).className).toContain('lm-schedule-disabled');

        api.setReadOnly(['broken']);
        expect(errors).toEqual(['Invalid range options']);
    });

    // ---- events: placement + visuals --------------------------------------

    it('places events at the right cell with 1px-per-minute height and v5 data attributes', () => {
        mount({ data: [sample({ end: '10:30', description: 'daily sync' })] });
        const el = cellAt('2026-06-10', 36).querySelector('.lm-schedule-item')!;
        expect(el).not.toBeNull();
        expect(el.getAttribute('data-title')).toBe('Standup');
        expect(el.getAttribute('data-description')).toBe('daily sync');
        expect(el.getAttribute('data-start')).toBe('09:00');
        expect(el.getAttribute('data-end')).toBe('10:30');
        expect(el.getAttribute('data-height')).toBe('6'); // 6 rows of 15min
        expect(styleN(el)).toContain('height:90px');
        expect(styleN(el)).toContain('--lm-schedule-background:#3f51b5');
        expect(styleN(el)).toContain('--lm-schedule-color:white'); // dark color
    });

    it('light event colors flip the text to black (HSP lightness)', () => {
        mount({ data: [sample({ color: '#ffeb3b' })] });
        expect(styleN(item())).toContain('--lm-schedule-color:black');
    });

    it('normalizes raw events: end = start+1h, title, color, guid (v5 normalizeEvents)', () => {
        const data: ScheduleEvent[] = [{ date: '2026-06-10', start: '09:00' }];
        mount({ data });
        expect(data[0].end).toBe('10:00');
        expect(data[0].title).toBe('No title');
        expect(data[0].color).toBe('#3f51b5');
        expect(typeof data[0].guid).toBe('string');
        expect(item().getAttribute('data-end')).toBe('10:00');
    });

    it('readonly events render striped/readonly and resist deletion', () => {
        const errors: string[] = [];
        const data = [sample({ readonly: true, guid: 'ro-1' })];
        const api = mount({ data, onerror: (m: string) => errors.push(m) });
        expect(item().getAttribute('data-readonly')).toBe('true');

        api.deleteEvents(['ro-1']);
        expect(data.length).toBe(1); // survived
        expect(errors).toEqual(['Event is readonly']);
    });

    it('overlap=true staggers overlapping events (10px steps)', () => {
        mount({
            overlap: true,
            data: [sample({ end: '11:00' }), sample({ start: '10:00', end: '12:00', title: 'Review' })],
        });
        const list = items();
        expect(list.length).toBe(2);
        expect(list[0].getAttribute('style')).not.toContain('margin-left');
        expect(styleN(list[1])).toContain('margin-left:10px');
    });

    it('shows the now-pointer only when today is visible', () => {
        const now = new Date();
        const iso =
            now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
        mount({ value: iso });
        expect(handle!.query('.lm-schedule-pointer')).not.toBeNull();
        handle!.unmount();

        mount({ value: '2001-01-10' });
        expect(handle!.query('.lm-schedule-pointer')).toBeNull();
    });

    // ---- live data (by reference) ------------------------------------------

    it('re-renders on mutate + touch() — data is BY REFERENCE', () => {
        const data = store([sample()]);
        mount({ data });
        expect(item().getAttribute('data-title')).toBe('Standup');

        data.value[0].title = 'Renamed in place';
        data.touch();
        expect(item().getAttribute('data-title')).toBe('Renamed in place');
    });

    it('re-renders on assignment of a new array (and normalizes it)', () => {
        const data = store<ScheduleEvent[]>([]);
        mount({ data });
        expect(items().length).toBe(0);

        data.value = [{ date: '2026-06-11', start: '14:00' }];
        expect(items().length).toBe(1);
        expect(cellAt('2026-06-11', 56).querySelector('.lm-schedule-item')).not.toBeNull();
        expect(data.value[0].end).toBe('15:00'); // normalized
    });

    // ---- navigation ---------------------------------------------------------

    it('next/prev step a week in week views and a day in day view; today returns home', () => {
        const api = mount();
        api.next();
        expect(headerCells()[0].textContent).toBe('14'); // Sun 2026-06-14
        api.prev();
        api.prev();
        expect(headerCells()[0].textContent).toBe('31'); // Sun 2026-05-31
        api.today();
        const today = new Date();
        const someToday = headerCells().some((d) => d.getAttribute('data-selected') === 'true');
        expect(someToday).toBe(true);
        expect(headerCells()[today.getDay()].textContent).toBe(String(today.getDate()).padStart(2, '0'));
        handle!.unmount();

        const dayApi = mount({ type: 'day' });
        dayApi.next();
        expect(headerCells()[0].textContent).toBe('11');
        dayApi.prev();
        dayApi.prev();
        expect(headerCells()[0].textContent).toBe('09');
    });

    it('value is a live prop: changing it re-anchors the grid', () => {
        const anchor = store('2026-06-10');
        mount({ value: anchor });
        expect(headerCells()[0].textContent).toBe('07');

        anchor.value = '2026-07-01';
        expect(headerCells()[0].textContent).toBe('28'); // Sun 2026-06-28
    });

    // ---- data api -------------------------------------------------------------

    it('addEvents adds, sorts, renders and fires oncreate; onbeforecreate cancels', () => {
        const created: ScheduleEvent[][] = [];
        const data: ScheduleEvent[] = [];
        const api = mount({ data, oncreate: (e: ScheduleEvent[]) => created.push(e) });

        const out = api.addEvents({ date: '2026-06-09', start: '10:00', title: 'B' });
        expect(out).not.toBe(false);
        expect(data.length).toBe(1);
        expect(created.length).toBe(1);
        expect(cellAt('2026-06-09', 40).querySelector('.lm-schedule-item')).not.toBeNull();
        handle!.unmount();

        const blocked = mount({ data: [], onbeforecreate: () => false });
        expect(blocked.addEvents({ date: '2026-06-09', start: '10:00' })).toBe(false);
        expect(blocked.getData().length).toBe(0);
    });

    it('updateEvent applies accepted fields, re-places the event and fires onupdate + onchange', () => {
        const updates: unknown[][] = [];
        let changes = 0;
        const data = [sample({ guid: 'g-1' })];
        const api = mount({
            data,
            onupdate: (...args: unknown[]) => updates.push(args),
            onchange: () => changes++,
        });

        expect(api.updateEvent('g-1', { start: '14:00', end: '15:30', date: '2026-06-12', title: 'Moved' })).toBe(true);
        expect(data[0].start).toBe('14:00');
        expect(cellAt('2026-06-12', 56).querySelector('.lm-schedule-item')).not.toBeNull();
        expect(cellAt('2026-06-10', 36).querySelector('.lm-schedule-item')).toBeNull();
        expect(updates.length).toBe(1);
        const [record, oldValue] = updates[0] as [ScheduleEvent, Partial<ScheduleEvent>];
        expect(record.guid).toBe('g-1');
        expect(oldValue).toEqual({ start: '09:00', end: '10:00', date: '2026-06-10', title: 'Standup' });
        expect(changes).toBe(1);
    });

    it('updateEvent blocks conflicts when overlap=false and reports onerror; overlap=true allows', () => {
        const errors: string[] = [];
        const data = [sample({ guid: 'a' }), sample({ guid: 'b', start: '11:00', end: '12:00' })];
        const api = mount({ data, onerror: (m: string) => errors.push(m) });

        expect(api.updateEvent('b', { start: '09:30', end: '10:30' })).toBe(false);
        expect(data.find((e) => e.guid === 'b')!.start).toBe('11:00');
        expect(errors).toEqual(['Time conflict: This event overlaps with another event']);
        handle!.unmount();

        const open = mount({ data: [sample({ guid: 'a' }), sample({ guid: 'b', start: '11:00', end: '12:00' })], overlap: true });
        expect(open.updateEvent('b', { start: '09:30', end: '10:30' })).toBe(true);
    });

    it('updateEvent refuses to move events into a read-only hour range', () => {
        const errors: string[] = [];
        const api = mount({
            data: [sample({ guid: 'g-1' })],
            readonlyrange: ['00:00', '08:00'],
            onerror: (m: string) => errors.push(m),
        });
        expect(api.updateEvent('g-1', { start: '07:00', end: '07:30' })).toBe(false);
        expect(errors).toEqual(['Cannot place event in disabled time range']);
    });

    it('deleteEvents removes by guid or record and fires ondelete; onbeforechange cancels', () => {
        const deleted: ScheduleEvent[] = [];
        const data = [sample({ guid: 'g-1' }), sample({ guid: 'g-2', start: '11:00', end: '12:00' })];
        const api = mount({ data, ondelete: (r: ScheduleEvent) => deleted.push(r) });
        api.deleteEvents(['g-1', data.find((e) => e.guid === 'g-2')!]);
        expect(data.length).toBe(0);
        expect(deleted.map((r) => r.guid)).toEqual(['g-1', 'g-2']);
        expect(items().length).toBe(0);
        handle!.unmount();

        const guarded = mount({ data: [sample({ guid: 'g-3' })], onbeforechange: () => false });
        expect(guarded.deleteEvents(['g-3'])).toBe(false);
        expect(guarded.getData().length).toBe(1);
    });

    it('setData replaces the dataset; getData and getEvent expose the live records', () => {
        const api = mount({ data: [sample({ guid: 'old' })] });
        const next: ScheduleEvent[] = [{ date: '2026-06-08', start: '08:00', guid: 'new' }];
        api.setData(next);
        expect(api.getData()).toBe(next);
        expect(api.getEvent('new')).toBe(next[0]);
        expect(api.getEvent('old')).toBeNull();
        expect(items().length).toBe(1);
        expect(item().getAttribute('data-guid')).toBe('new');
    });

    // ---- history ---------------------------------------------------------------

    it('undo/redo replay add, update and delete (v5 History)', () => {
        const data: ScheduleEvent[] = [];
        const api = mount({ data });
        api.addEvents({ date: '2026-06-10', start: '09:00', guid: 'h-1' });
        api.updateEvent('h-1', { start: '11:00', end: '12:00' });
        api.deleteEvents(['h-1']);
        expect(data.length).toBe(0);

        api.undo(); // delete undone
        expect(data.length).toBe(1);
        expect(data[0].start).toBe('11:00');
        api.undo(); // update undone
        expect(data[0].start).toBe('09:00');
        api.undo(); // add undone
        expect(data.length).toBe(0);

        api.redo();
        expect(data.length).toBe(1);
        expect(data[0].start).toBe('09:00');
        api.redo();
        expect(data[0].start).toBe('11:00');
        api.redo();
        expect(data.length).toBe(0);
    });

    it('Ctrl+Z / Ctrl+Y drive the history from the keyboard', () => {
        const data: ScheduleEvent[] = [];
        const api = mount({ data });
        api.addEvents({ date: '2026-06-10', start: '09:00' });
        key('z', { ctrlKey: true });
        expect(data.length).toBe(0);
        key('y', { ctrlKey: true });
        expect(data.length).toBe(1);
    });

    // ---- selection + keyboard -----------------------------------------------------

    it('click selects, Ctrl+click multi-selects, empty press clears (v5 selection)', () => {
        const data = [sample({ guid: 's-1' }), sample({ guid: 's-2', start: '11:00', end: '12:00' })];
        const api = mount({ data });
        mouse(items()[0], 'mousedown');
        mouse(document, 'mouseup');
        expect(items()[0].className).toContain('lm-schedule-selected');
        expect(api.getSelected()).toEqual(['s-1']);

        mouse(items()[1], 'mousedown', { ctrlKey: true });
        mouse(document, 'mouseup');
        expect(api.getSelected()).toEqual(['s-1', 's-2']);
        expect(items()[0].className).toContain('lm-schedule-selected');
        expect(items()[1].className).toContain('lm-schedule-selected');

        // press on the time column (no data-y): plain clear
        mouse(handle!.queryAll('tbody tr')[0].querySelector('td')!, 'mousedown');
        expect(api.getSelected()).toEqual([]);
    });

    it('arrow keys walk the sorted events; Delete removes the selection', () => {
        const deleted: string[] = [];
        const data = [
            sample({ guid: 'k-1' }),
            sample({ guid: 'k-2', start: '11:00', end: '12:00' }),
            sample({ guid: 'k-3', date: '2026-06-11' }),
        ];
        const api = mount({ data, ondelete: (r: ScheduleEvent) => deleted.push(r.guid!) });
        mouse(items()[0], 'mousedown');
        mouse(document, 'mouseup');
        expect(api.getSelected()).toEqual(['k-1']);

        key('ArrowRight');
        expect(api.getSelected()).toEqual(['k-2']);
        key('ArrowDown');
        expect(api.getSelected()).toEqual(['k-3']);
        key('ArrowLeft');
        expect(api.getSelected()).toEqual(['k-2']);

        key('Delete');
        expect(deleted).toEqual(['k-2']);
        expect(data.map((e) => e.guid)).toEqual(['k-1', 'k-3']);
        expect(api.getSelected()).toEqual([]);
    });

    it('Ctrl+C / Ctrl+V copies the selection one grid division later with fresh guids', () => {
        const data = [sample({ guid: 'c-1' })];
        mount({ data });
        mouse(item(), 'mousedown');
        mouse(document, 'mouseup');
        key('c', { ctrlKey: true });
        key('v', { ctrlKey: true });
        expect(data.length).toBe(2);
        const copy = data.find((e) => e.guid !== 'c-1')!;
        expect(copy.start).toBe('09:15');
        expect(copy.end).toBe('10:15');
        expect(copy.title).toBe('Standup');
        expect(copy.guid).not.toBe('c-1');
    });

    // ---- drag gestures ---------------------------------------------------------------

    it('drag-create: press a cell, drag down, release — a snapped event is born', () => {
        const created: ScheduleEvent[][] = [];
        const editions: ScheduleEvent[] = [];
        const data: ScheduleEvent[] = [];
        mount({
            data,
            oncreate: (e: ScheduleEvent[]) => created.push(e),
            onedition: (r: ScheduleEvent) => editions.push(r),
        });

        mouse(cellAt('2026-06-08', 36), 'mousedown');
        expect(ghost()).not.toBeNull(); // live preview from the first press
        expect(ghost()!.getAttribute('data-start')).toBe('09:00');

        mouse(cellAt('2026-06-08', 43), 'mousemove');
        expect(ghost()!.getAttribute('data-end')).toBe('11:00');

        mouse(document, 'mouseup');
        expect(ghost()).toBeNull();
        expect(data.length).toBe(1);
        expect(data[0]).toMatchObject({ date: '2026-06-08', start: '09:00', end: '11:00', title: 'No title' });
        expect(created.length).toBe(1);
        expect(editions.length).toBe(1); // v5: user creates are edition moments
    });

    it('drag-create honours snap: a bare click creates a snap-sized event', () => {
        const data: ScheduleEvent[] = [];
        mount({ data, snap: 30 });
        mouse(cellAt('2026-06-10', 36), 'mousedown');
        mouse(document, 'mouseup');
        expect(data.length).toBe(1);
        expect(data[0].start).toBe('09:00');
        expect(data[0].end).toBe('09:30'); // 2 divisions of 15
    });

    it('onbeforeinsert can cancel or replace the drag-created event (v5)', () => {
        const data: ScheduleEvent[] = [];
        mount({ data, onbeforeinsert: () => false });
        mouse(cellAt('2026-06-10', 36), 'mousedown');
        expect(ghost()).toBeNull();
        mouse(document, 'mouseup');
        expect(data.length).toBe(0);
        handle!.unmount();

        const data2: ScheduleEvent[] = [];
        mount({ data: data2, onbeforeinsert: () => ({ title: 'Forced title' }) });
        mouse(cellAt('2026-06-10', 36), 'mousedown');
        mouse(document, 'mouseup');
        expect(data2[0].title).toBe('Forced title');
        expect(data2[0].date).toBe('2026-06-10');
    });

    it('drag-move (top zone) carries an event to another day and time', () => {
        const data = [sample({ guid: 'm-1' })];
        mount({ data });
        const el = item();
        stubRect(el, 60);
        mouse(el, 'mousedown', { clientY: 10 }); // < 25px: move zone
        mouse(cellAt('2026-06-12', 20), 'mousemove');
        mouse(document, 'mouseup');
        expect(data[0]).toMatchObject({ date: '2026-06-12', start: '05:00', end: '06:00' });
        expect(cellAt('2026-06-12', 20).querySelector('.lm-schedule-item')).not.toBeNull();
    });

    it('drag-resize (bottom zone) stretches the end, snapped to the snap step', () => {
        const data = [sample({ guid: 'r-1' })];
        mount({ data, snap: 30 });
        const el = item();
        stubRect(el, 60);
        mouse(el, 'mousedown', { clientY: 58 }); // bottom 5px: resize
        mouse(cellAt('2026-06-10', 42), 'mousemove'); // raw rows 36..42 = 7 → snaps to 8
        mouse(document, 'mouseup');
        expect(data[0].start).toBe('09:00');
        expect(data[0].end).toBe('11:00');
    });

    it('drag gestures refuse conflicting cells when overlap=false (v5 board)', () => {
        const data = [sample({ guid: 'fix', start: '10:00', end: '11:00' })];
        mount({ data });
        mouse(cellAt('2026-06-10', 36), 'mousedown'); // 09:00 create
        mouse(cellAt('2026-06-10', 41), 'mousemove'); // would cross into 10:00 — blocked
        expect(ghost()!.getAttribute('data-end')).toBe('09:15');
        mouse(cellAt('2026-06-10', 39), 'mousemove'); // 09:45 — allowed
        mouse(document, 'mouseup');
        const created = data.find((e) => e.guid !== 'fix')!;
        expect(created.end).toBe('10:00');
    });

    it('read-only events accept no gestures; onbeforedrag can veto any gesture', () => {
        const data = [sample({ guid: 'ro', readonly: true })];
        mount({ data });
        mouse(item(), 'mousedown');
        expect(ghost()).toBeNull();
        mouse(document, 'mouseup');
        expect(data[0].start).toBe('09:00');
        handle!.unmount();

        const data2: ScheduleEvent[] = [];
        const vetoed: string[] = [];
        mount({
            data: data2,
            onbeforedrag: (info: { kind: string }) => {
                vetoed.push(info.kind);
                return false;
            },
        });
        mouse(cellAt('2026-06-10', 36), 'mousedown');
        expect(ghost()).toBeNull();
        mouse(document, 'mouseup');
        expect(data2.length).toBe(0);
        expect(vetoed).toEqual(['create']);
    });

    it('drag-create works in weekly mode (weekday instead of date)', () => {
        const data: ScheduleEvent[] = [];
        mount({ weekly: true, data });
        mouse(handle!.query('td[data-x="2"][data-y="40"]')!, 'mousedown');
        mouse(document, 'mouseup');
        expect(data.length).toBe(1);
        expect(data[0]).toMatchObject({ weekday: 2, start: '10:00', end: '10:15' });
        expect(data[0].date).toBeUndefined();
    });

    it('cells inside a read-only range refuse drag-create', () => {
        const data: ScheduleEvent[] = [];
        mount({ data, readonlyrange: ['00:00', '08:00'] });
        mouse(cellAt('2026-06-10', 10), 'mousedown');
        expect(ghost()).toBeNull();
        mouse(document, 'mouseup');
        expect(data.length).toBe(0);
    });

    // ---- the built-in editor (on Modal) ------------------------------------------------

    it('double click fires ondblclick + onedition and opens the Modal editor', async () => {
        const dbl: ScheduleEvent[] = [];
        const data = [sample({ guid: 'e-1', location: 'Room 4' })];
        mount({ data, editor: true, ondblclick: (r: ScheduleEvent) => dbl.push(r) });
        mouse(item(), 'dblclick');
        await flush();
        expect(dbl.length).toBe(1);
        expect(handle!.query('.lm-modal')).not.toBeNull();
        expect(handle!.query('.lm-modal-title')!.textContent).toBe('Event information');
        expect((handle!.query('.lm-schedule-editor-title') as HTMLInputElement).value).toBe('Standup');
        expect((handle!.query('.lm-schedule-editor-location') as HTMLInputElement).value).toBe('Room 4');
        // date via the <Calendar/> element, start/end via two <Dropdown/> elements
        expect(handle!.query('.lm-schedule-editor-date')!.children.length).toBeGreaterThan(0);
        expect(handle!.query('.lm-schedule-editor-start')!.children.length).toBeGreaterThan(0);
        expect(handle!.query('.lm-schedule-editor-end')!.children.length).toBeGreaterThan(0);
        expect(handle!.queryAll('.lm-schedule-editor-palette button').length).toBe(16);
    });

    it('editor Save commits through updateEvent: data, history and onchange all see it', async () => {
        let changes = 0;
        const data = [sample({ guid: 'e-2' })];
        const api = mount({ data, editor: true, onchange: () => changes++ });
        api.openEditor('e-2');
        await flush();

        const title = handle!.query('.lm-schedule-editor-title') as HTMLInputElement;
        title.value = 'Edited';
        title.dispatchEvent(new Event('input', { bubbles: true }));
        const palette = handle!.query('.lm-schedule-editor-palette button[data-color="#f44336"]')!;
        palette.click();

        handle!.query('.lm-schedule-editor-save')!.click();
        expect(data[0]).toMatchObject({ title: 'Edited', color: '#f44336' });
        expect(changes).toBe(1);
        expect(handle!.query('.lm-modal')).toBeNull(); // closed on success

        api.undo();
        expect(data[0].title).toBe('Standup'); // the edit is one history entry
    });

    it('double click on a read-only event opens nothing', async () => {
        const dbl: ScheduleEvent[] = [];
        mount({ data: [sample({ readonly: true })], editor: true, ondblclick: (r: ScheduleEvent) => dbl.push(r) });
        mouse(item(), 'dblclick');
        await flush();
        expect(dbl.length).toBe(0);
        expect(handle!.query('.lm-modal')).toBeNull();
    });

    it('drag-create opens the editor when editor=true (the v5 onedition flow)', async () => {
        const data: ScheduleEvent[] = [];
        mount({ data, editor: true });
        mouse(cellAt('2026-06-10', 36), 'mousedown');
        mouse(document, 'mouseup');
        await flush();
        expect(data.length).toBe(1);
        expect(handle!.query('.lm-modal')).not.toBeNull();
        expect(handle!.query('.lm-schedule-editor-start')!.children.length).toBeGreaterThan(0); // <Dropdown/>
    });

    // ---- lifecycle ------------------------------------------------------------------------

    it('destroys clean: document listeners balance, even when unmounted mid-drag', () => {
        const counts = { add: 0, remove: 0 };
        const origAdd = document.addEventListener.bind(document);
        const origRemove = document.removeEventListener.bind(document);
        document.addEventListener = ((type: string, ...rest: unknown[]) => {
            if (type === 'mousemove' || type === 'mouseup') {
                counts.add++;
            }
            return (origAdd as (...a: unknown[]) => unknown)(type, ...rest);
        }) as typeof document.addEventListener;
        document.removeEventListener = ((type: string, ...rest: unknown[]) => {
            if (type === 'mousemove' || type === 'mouseup') {
                counts.remove++;
            }
            return (origRemove as (...a: unknown[]) => unknown)(type, ...rest);
        }) as typeof document.removeEventListener;

        try {
            mount({ data: [] });
            // a full gesture: listeners attach and detach
            mouse(cellAt('2026-06-10', 36), 'mousedown');
            mouse(cellAt('2026-06-10', 40), 'mousemove');
            mouse(document, 'mouseup');
            // a second gesture left MID-DRAG: unmount must release it
            mouse(cellAt('2026-06-10', 60), 'mousedown');
            handle!.unmount();
            handle = null;
        } finally {
            document.addEventListener = origAdd;
            document.removeEventListener = origRemove;
        }
        expect(counts.add).toBeGreaterThan(0);
        expect(counts.remove).toBe(counts.add);
    });
});
