/**
 * <Schedule /> — the week/day time-grid scheduler, ported from the v5
 * plugin (@lemonadejs/schedule). The v5 block is NOT a month calendar:
 * it is a vertical time grid (1px per minute) with day columns, and that
 * exact model is preserved here:
 *
 *   - views: type 'week' (Sun–Sat) | 'weekdays' (Mon–Fri) | 'day';
 *     weekly mode swaps real dates for abstract weekdays (recurring
 *     template schedules — events carry `weekday` instead of `date`)
 *   - grid: minutes per row (default 15, row height = grid px); snap:
 *     create/resize step in minutes (defaults to grid)
 *   - drag-create on empty cells, drag-move (top 25px zone) and
 *     drag-resize (bottom 5px zone) of events, with conflict blocking
 *     when overlap=false and read-only hour ranges
 *   - selection (click, Ctrl+click multi), keyboard: arrows walk events,
 *     Delete removes, Ctrl+C/V copy/paste (+1 row shift), Ctrl+Z/Y
 *     undo/redo (full history: add/update/delete/setData)
 *   - validrange hides hours outside the window; readonlyrange disables
 *     (striped) hour ranges; now-pointer line on today's column
 *   - the v5 Event editor (dist/event.js — a Modal with title/when/
 *     start/end/location/color palette) is built in, composing
 *     @lemonadejs/modal; it opens on double click and after drag-create
 *     (v5's onedition moments) — disable with editor=false
 *
 * v5 → v6 mapping: validRange → validrange, readOnlyRange → readonlyrange,
 * onchangeevent → onupdate(record, oldValue, newValue),
 * onbeforechangeevent → onbeforedrag({ kind, record }), render() →
 * api.refresh(); callbacks drop the leading `self` argument (pure
 * components, no this); document.dictionary → weekdays prop; getEvent
 * returns the RECORD (not a DOM node). Data is BY REFERENCE: mutate the
 * array (or a record) and touch() — the grid re-renders once.
 */

import { component, html, type View } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

export interface ScheduleEvent {
    guid?: string;
    title?: string;
    /** 'HH:MM' */
    start?: string;
    /** 'HH:MM' (exclusive) */
    end?: string;
    /** 'YYYY-MM-DD' — dated mode */
    date?: string;
    /** 0 (Sun) – 6 (Sat) — weekly mode */
    weekday?: number;
    color?: string;
    readonly?: boolean;
    description?: string;
    location?: string;
    guests?: string;
    type?: string | null;
    visible?: boolean;
    warning?: boolean;
}

type Place = string | number; // 'YYYY-MM-DD' | weekday
type Column = { x: number; date?: string; weekday: number };

interface Drag {
    kind: 'create' | 'move' | 'resize';
    record: ScheduleEvent;
    /** null while creating (the record is not in data yet) */
    guid: string | null;
    column: number;
    place: Place;
    /** anchor row (create/resize) or top row (move) */
    y1: number;
    /** current row, inclusive */
    y2: number;
}

type HistoryEntry =
    | { action: 'add'; records: ScheduleEvent[] }
    | { action: 'delete'; records: ScheduleEvent[] }
    | { action: 'update'; guid: string; newValue: Partial<ScheduleEvent>; oldValue: Partial<ScheduleEvent> }
    | { action: 'setdata'; newData: ScheduleEvent[]; oldData: ScheduleEvent[] };

const MOVE_ZONE = 25; // px from the top of an event: drag-move (v5)
const RESIZE_ZONE = 5; // px from the bottom of an event: drag-resize (v5)

/** v5 updateEvent acceptedProperties (+ description — v5 omitted it, an
 *  oversight: nothing else could ever change it) */
const ACCEPTED: (keyof ScheduleEvent)[] = [
    'title', 'color', 'date', 'weekday', 'start', 'end', 'location', 'description',
];

const DEFAULT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The v5 Event editor palette (event.js) */
export const PALETTE: string[] = [
    '#f44336', '#e91e63', '#9c27b0', '#3f51b5',
    '#2196f3', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
    '#ff9800', '#ff5722', '#795548', '#9e9e9e',
];

const TIME = /^(2[0-4]|[01]?\d):([0-5]\d)$/;

const two = (v: number | string): string => {
    const s = String(v);
    return s.length === 1 ? '0' + s : s;
};

const makeGuid = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });

/**
 * HSP lightness — decides black or white text over an event color.
 * (v5 carried the classic snippet with a slice(1) applied AFTER the '#'
 * was already stripped, dropping the first hex digit; parsed whole here.)
 */
const isLight = (color: string): boolean => {
    let r = 0;
    let g = 0;
    let b = 0;
    const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgb) {
        r = +rgb[1];
        g = +rgb[2];
        b = +rgb[3];
    } else {
        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.replace(/./g, '$&$&');
        }
        const n = parseInt(hex, 16);
        if (isNaN(n)) {
            return false;
        }
        r = (n >> 16) & 255;
        g = (n >> 8) & 255;
        b = n & 255;
    }
    return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b) > 160;
};

/** Local-time parse of 'YYYY-MM-DD' — no UTC drift (v5 used toISOString) */
const parseDate = (iso: unknown): Date | null => {
    if (typeof iso !== 'string') {
        return null;
    }
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) {
        return null;
    }
    return new Date(+m[1], +m[2] - 1, +m[3]);
};

const fmtDate = (d: Date): string => d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());

const todayISO = (): string => fmtDate(new Date());

const toMinutes = (t: string): number => {
    const p = t.split(':');
    return +p[0] * 60 + (+p[1] || 0);
};

/** All editor time options, 5-minute steps (v5 event.js) */
const ALL_TIMES: string[] = (() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 5) {
            out.push(two(h) + ':' + two(m));
        }
    }
    return out;
})();

export const Schedule = component('schedule', {
    data: Array,                  // ScheduleEvent[] BY REFERENCE (mutate + touch())
    value: '',                    // anchor date 'YYYY-MM-DD' (default: today)
    type: 'week',                 // 'week' | 'weekdays' | 'day'
    weekly: false,                // abstract weekday columns (no dates)
    grid: 15,                     // minutes per row (row height = grid px)
    snap: 0,                      // create/resize step in minutes (0 = grid)
    overlap: false,               // allow overlapping events (true staggers them)
    validrange: Array,            // visible hours, e.g. ['08:00','20:00'] (v5: validRange)
    readonlyrange: Array,         // disabled hours: ['a','b'] or [['a','b'],...] (v5: readOnlyRange)
    editor: true,                 // built-in event editor (v5 shipped it as lm-event)
    weekdays: Array,              // 7 weekday names (v5: document.dictionary)
    onchange: Function,           // (data) — any user/api change to the data
    oncreate: Function,           // (events) — events added
    onbeforecreate: Function,     // (events) — return false to cancel
    onbeforeinsert: Function,     // (event) — drag-create template; false cancels, object replaces
    onupdate: Function,           // (record, oldValue, newValue) (v5: onchangeevent)
    onbeforechange: Function,     // ({ action, ... }) — return false to cancel
    onbeforedrag: Function,       // ({ kind, record }) — false cancels the gesture (v5: onbeforechangeevent)
    ondelete: Function,           // (record) — per removed event
    ondblclick: Function,         // (record)
    onedition: Function,          // (record) — editor moment (dblclick / after drag-create)
    onerror: Function,            // (message)
    api: {
        addEvents: Function, updateEvent: Function, deleteEvents: Function,
        getData: Function, setData: Function, getEvent: Function,
        getSelected: Function, resetSelection: Function,
        setRange: Function, setReadOnly: Function,
        undo: Function, redo: Function,
        next: Function, prev: Function, today: Function,
        openEditor: Function, refresh: Function,
    },
}, (props, { state, onMount, onUnmount }) => {
    // ---- data access: peek, never track — every change (assignment or
    // touch) flows through ONE subscription into the tick the body reads
    const rows = (): ScheduleEvent[] => (props.data.peek() as ScheduleEvent[]) || [];
    const weekly = (): boolean => !!props.weekly.value;

    if (!Array.isArray(props.data.peek())) {
        props.data.value = [];
    }

    const tick = state(0);
    // subscribe() callbacks run TRACKED (they are bindings): peek
    // everything here, or the refresh subscribes to its own writes
    const refresh = () => {
        normalize(rows()); // external assignments may carry raw events
        tick.value = tick.peek() + 1;
    };
    onMount(() => props.data.subscribe(refresh));

    // ---- grid math (live: grid/snap may change after mount, v5 track())
    const gridMin = (): number => {
        const g = Number(props.grid.value);
        return g > 0 ? g : 15;
    };
    const perHour = (): number => Math.max(1, Math.round(60 / gridMin()));
    const totalRows = (): number => perHour() * 24;
    const snapDiv = (): number => {
        const s = Number(props.snap.value) || 0;
        if (s <= gridMin()) {
            return 1;
        }
        return Math.max(1, Math.round(s / gridMin()));
    };
    const hourToInt = (time: unknown): number => {
        if (typeof time !== 'string' || !time) {
            return NaN;
        }
        const p = time.split(':');
        const h = parseInt(p[0], 10);
        const m = parseInt(p[1], 10) || 0;
        if (isNaN(h)) {
            return NaN;
        }
        return h * perHour() + Math.floor(m / gridMin());
    };
    const intToHour = (y: number): string =>
        two(Math.floor(y / perHour())) + ':' + two((y % perHour()) * gridMin());

    // ---- anchor date + range mirrors (props live; setRange/setReadOnly write)
    // peek during setup: tracked reads in the setup body trip the LJS-202
    // snapshot heuristic (the template legitimately carries primitive slots)
    const anchor = state((props.value.peek() as string) || todayISO());
    onMount(() =>
        props.value.subscribe((v) => {
            if (v) {
                anchor.value = v as string;
            }
        })
    );

    const validRange = state<string[]>((props.validrange.peek() as string[]) || []);
    const readonlyRange = state<unknown[]>((props.readonlyrange.peek() as unknown[]) || []);
    onMount(() => props.validrange.subscribe((v) => (validRange.value = (v as string[]) || [])));
    onMount(() => props.readonlyrange.subscribe((v) => (readonlyRange.value = (v as unknown[]) || [])));

    const selection = state<string[]>([]);
    const drag = state<Drag | null>(null);
    const editorOpen = state(false);
    const draft = state<ScheduleEvent | null>(null);

    let clipboard: ScheduleEvent[] = [];
    let history: HistoryEntry[] = [];
    let historyIndex = -1;
    let replaying = false; // suppresses guards + per-op onchange during undo/redo
    let editorGuid: string | null = null;
    let rootEl: HTMLElement | null = null;

    const call = (name: string, ...args: unknown[]): unknown =>
        ((props as Record<string, unknown>)[name] as ((...a: unknown[]) => unknown) | undefined)?.(...args);

    // ---- columns: 7 slots, null = hidden (v5 getColumns, local time only)
    const columns = (): (Column | null)[] => {
        const out: (Column | null)[] = [null, null, null, null, null, null, null];
        const kind = (props.type.value as string) || 'week';
        const base = parseDate(anchor.value) || new Date();
        if (weekly()) {
            if (kind === 'week') {
                for (let i = 0; i < 7; i++) {
                    out[i] = { x: i, weekday: i };
                }
            } else if (kind === 'weekdays') {
                for (let i = 1; i < 6; i++) {
                    out[i] = { x: i, weekday: i };
                }
            } else {
                const d = base.getDay();
                out[d] = { x: d, weekday: d };
            }
            return out;
        }
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
        if (kind === 'week') {
            start.setDate(start.getDate() - start.getDay());
            for (let i = 0; i < 7; i++) {
                const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                out[i] = { x: i, date: fmtDate(d), weekday: d.getDay() };
            }
        } else if (kind === 'weekdays') {
            start.setDate(start.getDate() - start.getDay() + 1);
            for (let i = 0; i < 5; i++) {
                const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                out[i + 1] = { x: i + 1, date: fmtDate(d), weekday: d.getDay() };
            }
        } else {
            const d = base.getDay();
            out[d] = { x: d, date: fmtDate(base), weekday: d };
        }
        return out;
    };

    const placeOf = (c: Column): Place => (weekly() ? c.weekday : c.date!);

    // ---- ranges
    const readonlyRanges = (): string[][] => {
        const r = readonlyRange.value;
        if (!Array.isArray(r) || !r.length) {
            return [];
        }
        return (Array.isArray(r[0]) ? r : [r]) as string[][];
    };

    const rangeRows = (a: unknown, b: unknown): [number, number] => {
        const r1 = hourToInt(a);
        const r2 = hourToInt(b);
        return [isNaN(r1) ? 0 : r1, isNaN(r2) || !r2 ? totalRows() : r2];
    };

    const rowDisabled = (j: number): boolean =>
        readonlyRanges().some((range) => {
            if (range.length !== 2) {
                return false;
            }
            const [r1, r2] = rangeRows(range[0], range[1]);
            return j >= r1 && j < r2;
        });

    /** Does [y1, y2) overlap a read-only hour range? */
    const inDisabledRange = (y1: number, y2: number): boolean =>
        readonlyRanges().some((range) => {
            if (range.length !== 2) {
                return false;
            }
            const [r1, r2] = rangeRows(range[0], range[1]);
            return y1 < r2 && y2 > r1;
        });

    /** Visible row window from validrange (v5 hid rows outside it) */
    const rowWindow = (): [number, number] => {
        const v = validRange.value;
        if (Array.isArray(v) && v.length === 2) {
            return rangeRows(v[0], v[1]);
        }
        return [0, totalRows()];
    };

    // ---- event queries (data space — v5 walked the DOM board)
    const find = (g: string): ScheduleEvent | undefined => rows().find((e) => e.guid === g);

    const eventsAt = (place: Place): ScheduleEvent[] =>
        rows().filter((e) =>
            weekly() ? e.weekday === place : String(e.date || '').substring(0, 10) === place
        );

    /** Any event at `place` overlapping rows [y1, y2), excluding `skip`? */
    const conflicts = (place: Place, y1: number, y2: number, skip?: string): boolean =>
        eventsAt(place).some(
            (e) => e.guid !== skip && y1 < hourToInt(e.end) && y2 > hourToInt(e.start)
        );

    // ---- normalization (v5 normalizeEvents; default date = anchor, not
    // v5's date.join('') which produced '2026610')
    const normalize = (events: ScheduleEvent[]): ScheduleEvent[] => {
        for (const e of events) {
            if (!e || typeof e !== 'object') {
                continue;
            }
            if (e.title === undefined) e.title = 'No title';
            if (e.color === undefined) e.color = '#3f51b5';
            if (e.readonly === undefined) e.readonly = false;
            if (e.description === undefined) e.description = '';
            if (e.location === undefined) e.location = '';
            if (e.guests === undefined) e.guests = '';
            if (e.type === undefined) e.type = null;
            if (!e.start || isNaN(hourToInt(e.start))) {
                e.start = '00:00';
            }
            if (!e.end || isNaN(hourToInt(e.end))) {
                e.end = intToHour(Math.min(hourToInt(e.start) + perHour(), totalRows()));
            }
            if (weekly()) {
                if (typeof e.weekday === 'undefined') {
                    e.weekday = 0;
                }
                e.weekday = parseInt(String(e.weekday), 10) || 0;
            } else if (!e.date) {
                e.date = anchor.value;
            }
            if (!e.guid) {
                e.guid = makeGuid();
            }
        }
        return events;
    };

    // Initial normalization runs at mount (not in the setup body — see the
    // LJS-202 note above): raw initial data gains guids/ends before use
    onMount(() => {
        if (rows().length) {
            refresh();
        }
    });

    /** v5 sortEvents: by weekday/date, then start time — mutates in place */
    const sortData = (): void => {
        rows().sort((a, b) => {
            if (weekly()) {
                if ((a.weekday || 0) !== (b.weekday || 0)) {
                    return (a.weekday || 0) - (b.weekday || 0);
                }
            } else {
                const da = String(a.date || '');
                const db = String(b.date || '');
                if (da !== db) {
                    return da < db ? -1 : 1;
                }
            }
            return toMinutes(a.start || '00:00') - toMinutes(b.start || '00:00');
        });
    };

    // ---- history (v5 History module; one onchange per undo/redo — v5
    // double-fired through the nested op AND History itself)
    const remember = (entry: HistoryEntry): void => {
        if (replaying) {
            return;
        }
        history = history.slice(0, historyIndex + 1);
        history.push(entry);
        historyIndex = history.length - 1;
    };

    const notifyChange = (): void => {
        if (!replaying) {
            call('onchange', rows());
        }
    };

    // ---- core operations
    const addEvents = (
        mixed: ScheduleEvent | ScheduleEvent[],
        user?: boolean,
        edit?: boolean
    ): ScheduleEvent[] | false => {
        let events = Array.isArray(mixed) ? [...mixed] : [mixed];
        events = events.filter((v) => v !== null && typeof v === 'object');
        if (!events.length) {
            return false;
        }
        normalize(events);
        if (!replaying && call('onbeforecreate', events) === false) {
            return false;
        }
        rows().push(...events);
        sortData();
        remember({ action: 'add', records: events });
        props.data.touch();
        call('oncreate', events);
        if (user) {
            if (edit) {
                edition(events[0]);
            }
            notifyChange();
        }
        return events;
    };

    const updateEvent = (mixed: string | ScheduleEvent, newValue: Partial<ScheduleEvent>): boolean => {
        if (!newValue || typeof newValue !== 'object') {
            return false;
        }
        const record = typeof mixed === 'object' ? mixed : find(mixed);
        if (!record) {
            return false;
        }
        const start = newValue.start !== undefined ? newValue.start : record.start;
        const end = newValue.end !== undefined ? newValue.end : record.end;
        if (newValue.start !== undefined || newValue.end !== undefined) {
            if (inDisabledRange(hourToInt(start), hourToInt(end))) {
                call('onerror', 'Cannot place event in disabled time range');
                return false;
            }
        }
        const placeChanged =
            newValue.start !== undefined ||
            newValue.end !== undefined ||
            newValue.date !== undefined ||
            newValue.weekday !== undefined;
        if (!props.overlap.value && placeChanged) {
            const place: Place = weekly()
                ? (newValue.weekday !== undefined ? newValue.weekday : record.weekday)!
                : String(newValue.date !== undefined ? newValue.date : record.date).substring(0, 10);
            if (conflicts(place, hourToInt(start), hourToInt(end), record.guid)) {
                call('onerror', 'Time conflict: This event overlaps with another event');
                return false;
            }
        }
        if (!replaying && call('onbeforechange', { action: 'update', record, newValue }) === false) {
            return false;
        }
        const oldValue: Partial<ScheduleEvent> = {};
        const applied: Partial<ScheduleEvent> = {};
        let changed = false;
        for (const k of ACCEPTED) {
            if (newValue[k] !== undefined && newValue[k] !== record[k]) {
                (oldValue as Record<string, unknown>)[k] = record[k];
                (applied as Record<string, unknown>)[k] = newValue[k];
                (record as Record<string, unknown>)[k] = newValue[k];
                changed = true;
            }
        }
        if (!changed) {
            return true;
        }
        sortData();
        remember({ action: 'update', guid: record.guid!, newValue: applied, oldValue });
        props.data.touch();
        call('onupdate', record, oldValue, newValue);
        notifyChange();
        return true;
    };

    const deleteEvents = (mixed: unknown): boolean => {
        const list = Array.isArray(mixed) ? mixed : [mixed];
        if (!replaying && call('onbeforechange', { action: 'delete', events: list }) === false) {
            return false;
        }
        const removed: ScheduleEvent[] = [];
        for (const item of list) {
            const g = item && typeof item === 'object' ? (item as ScheduleEvent).guid : (item as string);
            const i = rows().findIndex((e) => e.guid === g);
            if (i < 0) {
                continue;
            }
            if (rows()[i].readonly) {
                call('onerror', 'Event is readonly');
                continue;
            }
            const rec = rows().splice(i, 1)[0];
            removed.push(rec);
            selection.value = selection.value.filter((s) => s !== rec.guid);
            call('ondelete', rec);
        }
        if (removed.length) {
            remember({ action: 'delete', records: removed });
        }
        props.data.touch();
        notifyChange();
        return true;
    };

    const setData = (data: ScheduleEvent[], saveHistory?: boolean): boolean => {
        if (!replaying && call('onbeforechange', { action: 'setdata', data }) === false) {
            return false;
        }
        const next = Array.isArray(data) ? data : [];
        if (saveHistory === true) {
            remember({
                action: 'setdata',
                newData: JSON.parse(JSON.stringify(next)),
                oldData: JSON.parse(JSON.stringify(rows())),
            });
        }
        normalize(next);
        selection.value = [];
        props.data.value = next; // assignment notifies the data subscription
        notifyChange();
        return true;
    };

    const applyHistory = (entry: HistoryEntry, forward: boolean): void => {
        replaying = true;
        if (entry.action === 'add') {
            forward ? addEvents(entry.records) : deleteEvents(entry.records);
        } else if (entry.action === 'delete') {
            forward ? deleteEvents(entry.records) : addEvents(entry.records);
        } else if (entry.action === 'update') {
            updateEvent(entry.guid, forward ? entry.newValue : entry.oldValue);
        } else {
            setData(forward ? entry.newData : entry.oldData);
        }
        replaying = false;
        call('onchange', rows());
    };

    const undo = (): void => {
        if (historyIndex >= 0) {
            applyHistory(history[historyIndex--], false);
        }
    };

    const redo = (): void => {
        if (historyIndex < history.length - 1) {
            applyHistory(history[++historyIndex], true);
        }
    };

    // ---- navigation (v5 next/prev/today, local time)
    const navigate = (days: number): void => {
        const d = parseDate(anchor.value) || new Date();
        d.setDate(d.getDate() + days);
        anchor.value = fmtDate(d);
    };
    const step = (): number => {
        const kind = (props.type.value as string) || 'week';
        return kind === 'week' || kind === 'weekdays' ? 7 : 1;
    };

    // ---- selection
    const select = (g: string, add: boolean): void => {
        if (add) {
            if (!selection.value.includes(g)) {
                selection.value = [...selection.value, g];
            }
        } else {
            selection.value = [g];
        }
    };
    const clearSelection = (): void => {
        if (selection.value.length) {
            selection.value = [];
        }
    };
    /** Arrow keys: walk the (sorted) data when exactly one event is selected */
    const moveSelection = (dir: 1 | -1): void => {
        if (selection.value.length !== 1) {
            return;
        }
        const list = rows();
        const i = list.findIndex((e) => e.guid === selection.value[0]);
        const next = list[i + dir];
        if (i >= 0 && next && next.guid) {
            selection.value = [next.guid];
        }
    };

    // ---- copy/paste (v5: Ctrl+C/Ctrl+V, +1 grid division shift, new guids)
    const copySelection = (): void => {
        clipboard = selection.value
            .map((g) => find(g))
            .filter((e): e is ScheduleEvent => !!e)
            .map((e) => ({ ...e }));
    };
    const paste = (): void => {
        if (!clipboard.length) {
            return;
        }
        const records = clipboard.map((v) => ({
            ...v,
            guid: makeGuid(),
            start: intToHour(hourToInt(v.start) + 1),
            end: intToHour(Math.min(hourToInt(v.end) + 1, totalRows())),
        }));
        // user-initiated (fires onchange) but not an edition moment —
        // v5 fired onedition on paste too, which popped the editor open
        // after every paste; deliberately not reproduced
        addEvents(records, true, false);
    };

    // ---- editor (v5 dist/event.js, composed on Modal)
    const edition = (record: ScheduleEvent): void => {
        call('onedition', record);
        if (props.editor.value) {
            openEditor(record);
        }
    };
    const openEditor = (record: ScheduleEvent): void => {
        editorGuid = record.guid || null;
        draft.value = { ...record };
        editorOpen.value = true;
    };
    const saveEditor = (): void => {
        const d = draft.peek();
        if (!d || !editorGuid) {
            editorOpen.value = false;
            return;
        }
        const nv: Partial<ScheduleEvent> = {
            title: d.title,
            start: d.start,
            end: d.end,
            location: d.location,
            color: d.color,
        };
        if (weekly()) {
            nv.weekday = d.weekday;
        } else {
            nv.date = d.date;
        }
        if (updateEvent(editorGuid, nv) !== false) {
            editorOpen.value = false;
        }
    };

    const timeOptions = (): string[] => {
        const v = validRange.value;
        if (Array.isArray(v) && v.length === 2 && TIME.test(String(v[0])) && TIME.test(String(v[1]))) {
            const a = toMinutes(String(v[0]));
            const b = toMinutes(String(v[1]));
            return ALL_TIMES.filter((t) => toMinutes(t) >= a && toMinutes(t) <= b);
        }
        return ALL_TIMES;
    };

    // ---- drag gestures: ONE persistent release, modal's track pattern
    let release: (() => void) | null = null;
    onUnmount(() => release?.());

    const begin = (): void => {
        release?.();
        const move = (ev: MouseEvent) => onDragMove(ev);
        const up = (ev: MouseEvent) => {
            detach();
            commitDrag(ev);
        };
        const detach = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            release = null;
        };
        release = () => {
            detach();
            drag.value = null;
            document.body.style.cursor = '';
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    /** Snap a resize target row so the event size is a multiple of snap (v5) */
    const snapTo = (y: number, anchorRow: number): number => {
        const div = snapDiv();
        if (div <= 1) {
            return y;
        }
        let snapped: number;
        if (y >= anchorRow) {
            const size = Math.max(div, Math.round((y - anchorRow + 1) / div) * div);
            snapped = anchorRow + size - 1;
        } else {
            const size = Math.max(div, Math.round((anchorRow - y + 1) / div) * div);
            snapped = anchorRow - size + 1;
        }
        return Math.max(0, Math.min(totalRows() - 1, snapped));
    };

    /** The grid cell under the pointer (v5 elementsFromPoint, target first) */
    const cellFrom = (e: MouseEvent): HTMLElement | null => {
        const target = e.target as Element | null;
        let cell =
            target && target.closest ? (target.closest('td[data-y]') as HTMLElement | null) : null;
        if (!cell && typeof document.elementsFromPoint === 'function') {
            for (const c of document.elementsFromPoint(e.clientX, e.clientY)) {
                if (c.tagName === 'TD' && c.getAttribute('data-y') !== null) {
                    cell = c as HTMLElement;
                    break;
                }
            }
        }
        if (!cell || !rootEl || !rootEl.contains(cell) || cell.classList.contains('lm-schedule-disabled')) {
            return null;
        }
        return cell;
    };

    const onDragMove = (e: MouseEvent): void => {
        const d = drag.peek();
        if (!d) {
            return;
        }
        const cell = cellFrom(e);
        if (!cell) {
            if (d.kind === 'move') {
                document.body.style.cursor = 'not-allowed'; // v5
            }
            return;
        }
        document.body.style.cursor = '';
        const y = parseInt(cell.getAttribute('data-y')!, 10);
        const x = parseInt(cell.getAttribute('data-x')!, 10);
        const place: Place = weekly() ? x : cell.getAttribute('data-date') || '';
        if (d.kind === 'move') {
            const h = d.y2 - d.y1 + 1;
            const y2 = y + h - 1;
            if (y2 >= totalRows() || inDisabledRange(y, y2 + 1)) {
                return;
            }
            if (!props.overlap.value && conflicts(place, y, y2 + 1, d.guid ?? undefined)) {
                return;
            }
            drag.value = { ...d, y1: y, y2, column: x, place };
        } else {
            const snapped = snapTo(y, d.y1);
            const lo = Math.min(d.y1, snapped);
            const hi = Math.max(d.y1, snapped);
            if (inDisabledRange(lo, hi + 1)) {
                return;
            }
            if (!props.overlap.value && conflicts(d.place, lo, hi + 1, d.guid ?? undefined)) {
                return;
            }
            drag.value = { ...d, y2: snapped };
        }
    };

    const commitDrag = (_e: MouseEvent): void => {
        const d = drag.peek();
        drag.value = null;
        document.body.style.cursor = '';
        if (!d) {
            return;
        }
        const lo = Math.min(d.y1, d.y2);
        const hi = Math.max(d.y1, d.y2);
        const start = intToHour(lo);
        const end = intToHour(hi + 1);
        if (d.kind === 'create') {
            d.record.start = start;
            d.record.end = end;
            if (weekly()) {
                d.record.weekday = d.place as number;
            } else {
                d.record.date = d.place as string;
            }
            addEvents([d.record], true, true);
        } else {
            const rec = d.record;
            const samePlace = weekly()
                ? rec.weekday === d.place
                : String(rec.date || '').substring(0, 10) === d.place;
            if (samePlace && rec.start === start && rec.end === end) {
                return; // nothing changed (v5)
            }
            const nv: Partial<ScheduleEvent> = { start, end };
            if (weekly()) {
                nv.weekday = d.place as number;
            } else {
                nv.date = d.place as string;
            }
            updateEvent(rec, nv);
        }
    };

    // ---- pointer handlers
    const zoneOf = (item: Element, e: MouseEvent): 'resize' | 'move' | null => {
        const rect = item.getBoundingClientRect();
        if (rect.height - (e.clientY - rect.top) < RESIZE_ZONE) {
            return 'resize';
        }
        if (e.clientY - rect.top < MOVE_ZONE) {
            return 'move';
        }
        return null;
    };

    const onPress = (e: MouseEvent): void => {
        if (e.button !== 0) {
            return;
        }
        const target = e.target as Element;
        const item = target.closest ? (target.closest('.lm-schedule-item') as HTMLElement | null) : null;
        if (!e.ctrlKey && !e.metaKey) {
            clearSelection(); // v5 resetSelection(e)
        }
        if (item) {
            const g = item.getAttribute('data-guid') || '';
            const rec = find(g);
            if (!rec) {
                return;
            }
            select(g, true);
            if (rec.readonly) {
                return;
            }
            const kind = zoneOf(item, e);
            if (!kind) {
                return;
            }
            const cell = item.closest('td[data-y]');
            const place: Place = weekly()
                ? (rec.weekday as number)
                : String(rec.date || '').substring(0, 10);
            const d: Drag = {
                kind,
                record: rec,
                guid: g,
                column: cell ? parseInt(cell.getAttribute('data-x')!, 10) : 0,
                place,
                y1: hourToInt(rec.start),
                y2: hourToInt(rec.end) - 1,
            };
            if (call('onbeforedrag', { kind, record: rec }) === false) {
                return;
            }
            drag.value = d;
            begin();
        } else {
            const cell = target.closest ? (target.closest('td[data-y]') as HTMLElement | null) : null;
            if (!cell || cell.classList.contains('lm-schedule-disabled')) {
                return;
            }
            const y = parseInt(cell.getAttribute('data-y')!, 10);
            const x = parseInt(cell.getAttribute('data-x')!, 10);
            const place: Place = weekly() ? x : cell.getAttribute('data-date') || '';
            let record: ScheduleEvent = weekly() ? { weekday: x } : { date: place as string };
            const ret = call('onbeforeinsert', record);
            if (ret === false) {
                return;
            }
            if (ret && typeof ret === 'object') {
                record = ret as ScheduleEvent;
            }
            const y2 = Math.min(y + snapDiv() - 1, totalRows() - 1);
            const d: Drag = { kind: 'create', record, guid: null, column: x, place, y1: y, y2 };
            if (call('onbeforedrag', { kind: 'create', record }) === false) {
                return;
            }
            drag.value = d;
            begin();
        }
    };

    const onDouble = (e: MouseEvent): void => {
        const target = e.target as Element;
        const item = target.closest ? (target.closest('.lm-schedule-item') as HTMLElement | null) : null;
        if (!item) {
            return;
        }
        const rec = find(item.getAttribute('data-guid') || '');
        if (!rec || rec.readonly) {
            return;
        }
        call('ondblclick', rec);
        edition(rec);
    };

    /** Live cursor feedback over events (v5 mousemove) */
    const onHover = (e: MouseEvent): void => {
        if (!rootEl || drag.peek()) {
            return;
        }
        const target = e.target as Element;
        const item = target.closest ? (target.closest('.lm-schedule-item') as HTMLElement | null) : null;
        if (!item || item.getAttribute('data-readonly') === 'true') {
            rootEl.style.cursor = '';
            return;
        }
        const zone = zoneOf(item, e);
        rootEl.style.cursor = zone === 'resize' ? 's-resize' : zone === 'move' ? 'move' : '';
    };

    const onKey = (e: KeyboardEvent): void => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === 'c') {
                copySelection();
            } else if (e.key === 'v') {
                paste();
            }
            return;
        }
        if (e.key === 'Delete') {
            if (selection.value.length) {
                deleteEvents([...selection.value]);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            moveSelection(-1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            moveSelection(1);
            e.preventDefault();
        }
    };

    // ---- api
    props.ref?.({
        addEvents: (events: ScheduleEvent | ScheduleEvent[]) => addEvents(events),
        updateEvent,
        deleteEvents,
        getData: () => rows(),
        setData,
        getEvent: (g: string) => find(g) ?? null,
        getSelected: () => [...selection.value],
        resetSelection: clearSelection,
        setRange: (range: string[]) => {
            if (
                Array.isArray(range) &&
                range.length === 2 &&
                TIME.test(String(range[0])) &&
                TIME.test(String(range[1]))
            ) {
                validRange.value = [...range];
            } else {
                call('onerror', 'Invalid range time');
            }
        },
        setReadOnly: (range: unknown[]) => {
            const ranges = (Array.isArray(range) && Array.isArray(range[0]) ? range : [range]) as unknown[][];
            const ok =
                Array.isArray(range) &&
                ranges.every(
                    (r) =>
                        Array.isArray(r) && r.length === 2 && TIME.test(String(r[0])) && TIME.test(String(r[1]))
                );
            if (ok) {
                readonlyRange.value = [...range];
            } else {
                call('onerror', 'Invalid range options');
            }
        },
        undo,
        redo,
        next: () => navigate(step()),
        prev: () => navigate(-step()),
        today: () => {
            anchor.value = todayISO();
        },
        openEditor: (g: string) => {
            const rec = find(g);
            if (rec) {
                openEditor(rec);
            }
        },
        refresh,
    });

    // ---- rendering
    const headerView = (): View[] => {
        const cols = columns();
        const dict = props.weekdays.value as string[] | undefined;
        const names = Array.isArray(dict) && dict.length === 7 ? dict : DEFAULT_WEEKDAYS;
        const now = new Date();
        const today = fmtDate(now);
        const cells: View[] = [html`<td></td>`];
        for (const c of cols) {
            if (!c) {
                continue;
            }
            const isToday = weekly() ? now.getDay() === c.weekday : c.date === today;
            const label = weekly() ? '' : two(parseInt(c.date!.substring(8, 10), 10));
            cells.push(
                html`<td data-day="${c.x}" data-weekday="${names[c.weekday]}"
                    data-selected="${isToday ? 'true' : false}">${label}</td>`
            );
        }
        return cells;
    };

    const itemView = (ev: ScheduleEvent, selected: boolean, staggerIndex: number): View => {
        const g = gridMin();
        const startRow = hourToInt(ev.start);
        const endRow = hourToInt(ev.end);
        const heightRows = Math.max(1, endRow - startRow);
        const parts: string[] = ['height:' + heightRows * g + 'px'];
        const color = ev.color || '';
        if (color) {
            parts.push('--lm-schedule-background:' + color);
            parts.push('--lm-schedule-color:' + (isLight(color) ? 'black' : 'white'));
        }
        if (staggerIndex) {
            parts.push('margin-left:' + staggerIndex * 10 + 'px');
            parts.push('width:calc(100% - ' + staggerIndex * 10 + 'px)');
        }
        return html`<div class="lm-schedule-item ${selected ? 'lm-schedule-selected' : ''}"
            data-guid="${ev.guid}"
            data-title="${ev.title || ''}"
            data-description="${ev.description || false}"
            data-start="${ev.start}"
            data-end="${ev.end}"
            data-color="${color || false}"
            data-readonly="${ev.readonly ? 'true' : false}"
            data-visible="${ev.visible === false ? 'false' : false}"
            data-warning="${ev.warning ? 'true' : false}"
            data-height="${heightRows}"
            style="${parts.join(';')}"></div>`;
    };

    const ghostView = (d: Drag): View => {
        const g = gridMin();
        const lo = Math.min(d.y1, d.y2);
        const hi = Math.max(d.y1, d.y2);
        const heightRows = hi - lo + 1;
        const color = d.record.color || '#3f51b5';
        const parts = [
            'height:' + heightRows * g + 'px',
            '--lm-schedule-background:' + color,
            '--lm-schedule-color:' + (isLight(color) ? 'black' : 'white'),
        ];
        return html`<div class="lm-schedule-item lm-schedule-selected lm-schedule-dragging"
            data-title="${d.record.title || 'No title'}"
            data-start="${intToHour(lo)}"
            data-end="${intToHour(hi + 1)}"
            data-height="${heightRows}"
            style="${parts.join(';')}"></div>`;
    };

    const bodyView = (): View[] => {
        void tick.value; // data changes (assignment or touch) re-render the body
        const cols = columns().filter((c): c is Column => !!c);
        const d = drag.value;
        const sel = selection.value;
        const g = gridMin();
        const ph = perHour();
        const [lo, hi] = rowWindow();
        const now = new Date();
        const today = fmtDate(now);
        const nowRow = hourToInt(two(now.getHours()) + ':' + two(now.getMinutes()));
        const nowOffset = ((now.getMinutes() % g) / g) * 100;

        // Events bucketed per column; overlap staggering in data space
        const byPlace = new Map<Place, ScheduleEvent[]>();
        const stagger = new Map<ScheduleEvent, number>();
        for (const c of cols) {
            const place = placeOf(c);
            const list = eventsAt(place);
            byPlace.set(place, list);
            if (props.overlap.value) {
                const active: ScheduleEvent[] = [];
                for (const ev of list) {
                    const s = hourToInt(ev.start);
                    let k = 0;
                    for (const other of active) {
                        if (hourToInt(other.end) > s) {
                            k++;
                        }
                    }
                    stagger.set(ev, k);
                    active.push(ev);
                }
            }
        }

        const trs: View[] = [];
        for (let j = lo; j < hi; j++) {
            const hour = j % ph === 0;
            const disabled = rowDisabled(j);
            const tds: View[] = [
                html`<td>${hour ? html`<div class="lm-schedule-index">${two(j / ph)}:00</div>` : ''}</td>`,
            ];
            for (const c of cols) {
                const place = placeOf(c);
                const items: View[] = [];
                for (const ev of byPlace.get(place)!) {
                    if (d && d.guid && ev.guid === d.guid) {
                        continue; // rendered as the drag ghost instead
                    }
                    if (hourToInt(ev.start) === j) {
                        items.push(itemView(ev, sel.includes(ev.guid!), stagger.get(ev) || 0));
                    }
                }
                if (d && d.column === c.x && Math.min(d.y1, d.y2) === j) {
                    items.push(ghostView(d));
                }
                const isTodayColumn = weekly() ? c.weekday === now.getDay() : c.date === today;
                if (isTodayColumn && nowRow === j) {
                    items.push(
                        html`<div class="lm-schedule-pointer" style="top:${nowOffset}%"></div>`
                    );
                }
                tds.push(
                    html`<td data-x="${c.x}" data-y="${j}"
                        data-date="${weekly() ? false : c.date}"
                        class="${disabled ? 'lm-schedule-disabled' : ''}">${items}</td>`
                );
            }
            trs.push(html`<tr class="${hour ? 'lm-schedule-hour' : ''}" style="height:${g}px">${tds}</tr>`);
        }
        return trs;
    };

    // ---- the built-in editor (v5 event.js fields, on the Modal primitive)
    const editorView = (): View | string => {
        const d = draft.value;
        if (!d) {
            return '';
        }
        const dict = props.weekdays.value as string[] | undefined;
        const names = Array.isArray(dict) && dict.length === 7 ? dict : DEFAULT_WEEKDAYS;
        const times = timeOptions();
        const timeSelect = (cls: string, current: string | undefined, set: (v: string) => void) =>
            html`<select class="${cls}"
                onchange="${(e: Event) => set((e.target as HTMLSelectElement).value)}">${times.map(
                (t) => html`<option value="${t}" selected="${t === current || false}">${t}</option>`
            )}</select>`;
        return html`<div class="lm-schedule-form">
            <input type="text" class="lm-schedule-editor-title" placeholder="Title"
                value="${d.title || ''}"
                oninput="${(e: Event) => (d.title = (e.target as HTMLInputElement).value)}" />
            <div class="lm-schedule-editor-when">
                ${weekly()
                    ? html`<select class="lm-schedule-editor-weekday"
                          onchange="${(e: Event) =>
                              (d.weekday = parseInt((e.target as HTMLSelectElement).value, 10))}">${names.map(
                          (n, i) =>
                              html`<option value="${i}" selected="${i === (d.weekday || 0) || false}">${n}</option>`
                      )}</select>`
                    : html`<input type="date" class="lm-schedule-editor-date"
                          value="${String(d.date || '').substring(0, 10)}"
                          oninput="${(e: Event) => (d.date = (e.target as HTMLInputElement).value)}" />`}
                ${timeSelect('lm-schedule-editor-start', d.start, (v) => (d.start = v))}
                ${timeSelect('lm-schedule-editor-end', d.end, (v) => (d.end = v))}
            </div>
            <input type="text" class="lm-schedule-editor-location" placeholder="Location"
                value="${d.location || ''}"
                oninput="${(e: Event) => (d.location = (e.target as HTMLInputElement).value)}" />
            <div class="lm-schedule-editor-palette">${PALETTE.map(
                (c) => html`<button type="button" style="background-color:${c}"
                    data-color="${c}" data-selected="${c === d.color ? 'true' : false}"
                    onclick="${() => {
                        d.color = c;
                        draft.touch();
                    }}"></button>`
            )}</div>
            <button type="button" class="lm-schedule-editor-save" onclick="${saveEditor}">Save</button>
        </div>`;
    };

    return html`<div class="lm-schedule ${() => (gridMin() > 9 ? 'lm-schedule-large' : '')}"
        tabindex="0"
        data-type="${() => (props.type.value as string) || 'week'}"
        data-weekly="${() => (weekly() ? 'true' : false)}"
        ref="${(el: Element) => (rootEl = el as HTMLElement)}"
        onmousedown="${onPress}"
        ondblclick="${onDouble}"
        onmousemove="${onHover}"
        onkeydown="${onKey}">
        <table>
            <thead><tr>${() => headerView()}</tr></thead>
            <tbody>${() => bodyView()}</tbody>
        </table>
        <${Modal} bind="${editorOpen}" title="Event information" closable draggable
            width="${400}" responsive="${false}">
            <div class="lm-schedule-editor">${() => editorView()}</div>
        </${Modal}>
    </div>`;
});

export default Schedule;
