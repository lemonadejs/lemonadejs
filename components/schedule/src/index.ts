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
 *     Enter opens the editor for the selected event, N creates an event
 *     at the first free slot, Alt+arrows move and Shift+Up/Down resize
 *     the selected event (the same commit path as the drag gestures),
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
 * render() → api.refresh(); onchangeevent(record, oldValue, newValue)
 * keeps its v5 name — it fires after every committed event update
 * (drag-move/resize commit, editor save, api.updateEvent), alongside
 * onupdate (same payload); onbeforechangeevent(record, oldValue,
 * newValue) is its cancellable pre-flight — return false and nothing
 * mutates (the drag snaps back). v5 fired onbeforechangeevent at
 * gesture START with the raw drag state; the v6 gesture-start veto is
 * onbeforedrag({ kind, record }) — onbeforechangeevent now guards the
 * concrete change at COMMIT, so it sees the real oldValue/newValue.
 * Callbacks drop the leading `self` argument (pure
 * components, no this); document.dictionary → weekdays prop; getEvent
 * returns the RECORD (not a DOM node). Data is BY REFERENCE: mutate the
 * array (or a record) and touch() — the grid re-renders once.
 */

import { batch, component, css, html, type View } from 'lemonadejs';
import Modal from '@lemonadejs/modal';
import Calendar from '@lemonadejs/calendar';
import Dropdown from '@lemonadejs/dropdown';

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
// Editor swatches. The FIRST 8 are the shared catalog palette (kept in
// sync with --lm-series-* in components/style.css and the chart `lemonade`
// palette) so a default event colour matches charts/gantt/etc even with no
// global stylesheet; the remaining 8 are extra choices.
export const PALETTE: string[] = [
    '#2563eb', '#39a33b', '#f59e0b', '#a23131',
    '#7c3aed', '#0ea5e9', '#db2777', '#64748b',
    '#14b8a6', '#eab308', '#ef4444', '#ec4899',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
];

/** Accessible names for the editor palette swatches (color-only buttons
 *  are unnamed to a screen reader — 4.1.2) */
const COLOR_NAMES: Record<string, string> = {
    '#2563eb': 'Blue', '#39a33b': 'Green', '#f59e0b': 'Amber', '#a23131': 'Brick red',
    '#7c3aed': 'Violet', '#0ea5e9': 'Sky blue', '#db2777': 'Pink', '#64748b': 'Slate gray',
    '#14b8a6': 'Teal', '#eab308': 'Yellow', '#ef4444': 'Red', '#ec4899': 'Rose',
    '#8b5cf6': 'Purple', '#06b6d4': 'Cyan', '#84cc16': 'Lime', '#f97316': 'Orange',
};

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

/** The schedule the user last interacted with — owns the global keyboard
 *  shortcuts (copy/paste/delete/undo) so they work without the grid being
 *  focused, and so multiple schedules on a page don't all react at once. */
let activeSchedule: unknown = null;

let instances = 0; // per-instance id prefix for aria-activedescendant

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
    onupdate: Function,           // (record, oldValue, newValue) — alias of onchangeevent
    onchangeevent: Function,      // (record, oldValue, newValue) — v5 name, after a committed update
    onbeforechange: Function,     // ({ action, ... }) — return false to cancel
    onbeforechangeevent: Function,// (record, oldValue, newValue) — return false to cancel the update
    onbeforedrag: Function,       // ({ kind, record }) — false cancels the gesture at its start
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
}, (props, { state, onMount, onUnmount, listen }) => {
    // ---- data access: peek, never track — every change (assignment or
    // touch) flows through ONE subscription into the tick the body reads
    const rows = (): ScheduleEvent[] => (props.data.peek() as ScheduleEvent[]) || [];
    const weekly = (): boolean => !!props.weekly.value;

    if (!Array.isArray(props.data.peek())) {
        props.data.value = [];
    }

    // tick is NOT a redundant version counter (re-evaluated against the
    // final engine): if the body binding tracked props.data directly, an
    // external assignment/touch could render BEFORE this subscription
    // normalizes the records (guids, default ends) — binding-vs-subscriber
    // order on the same change is not a contract. tick sequences it:
    // normalize first, then exactly one body re-render.
    const tick = state(0);
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
    const token = {}; // identity for the active-schedule keyboard owner
    // Editor fields as individual states so the Calendar / Dropdown elements
    // (which take a `bind`) two-way bind cleanly; saveEditor reads them.
    const fTitle = state('');
    const fDate = state('');
    const fWeekday = state(0);
    const fStart = state('');
    const fEnd = state('');
    const fLocation = state('');
    const fColor = state('');

    let clipboard: ScheduleEvent[] = [];
    let history: HistoryEntry[] = [];
    let historyIndex = -1;
    let replaying = false; // suppresses guards + per-op onchange during undo/redo
    let editorGuid: string | null = null;
    let rootEl: HTMLElement | null = null;

    // Event element ids: the root keeps DOM focus (root-focus keyboard
    // model), aria-activedescendant names the selected event to AT
    const uid = 'lm-schedule-' + ++instances;
    const itemId = (g: string): string => uid + '-' + g;

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
            if (e.color === undefined) e.color = '#2563eb';
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
                changed = true;
            }
        }
        if (!changed) {
            return true;
        }
        // v5 onbeforechangeevent: the cancellable pre-flight of the concrete
        // change — nothing has mutated yet, so false means a clean snap-back
        if (!replaying && call('onbeforechangeevent', record, oldValue, newValue) === false) {
            return false;
        }
        for (const k of Object.keys(applied)) {
            (record as Record<string, unknown>)[k] = (applied as Record<string, unknown>)[k];
        }
        sortData();
        remember({ action: 'update', guid: record.guid!, newValue: applied, oldValue });
        props.data.touch();
        call('onupdate', record, oldValue, newValue);
        call('onchangeevent', record, oldValue, newValue); // v5 name, same payload
        notifyChange();
        return true;
    };

    const deleteEvents = (mixed: unknown): boolean => {
        const list = Array.isArray(mixed) ? mixed : [mixed];
        if (!replaying && call('onbeforechange', { action: 'delete', events: list }) === false) {
            return false;
        }
        const removed: ScheduleEvent[] = [];
        // One update pass for N removals (selection writes + the touch)
        batch(() => {
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
        });
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
        batch(() => {
            selection.value = [];
            props.data.value = next; // assignment notifies the data subscription
        });
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
        fTitle.value = record.title || '';
        fDate.value = String(record.date || '').substring(0, 10);
        fWeekday.value = typeof record.weekday === 'number' ? record.weekday : 0;
        fStart.value = record.start || '';
        fEnd.value = record.end || '';
        fLocation.value = record.location || '';
        fColor.value = record.color || '';
        editorOpen.value = true;
    };
    const saveEditor = (): void => {
        if (!editorGuid) {
            editorOpen.value = false;
            return;
        }
        const nv: Partial<ScheduleEvent> = {
            title: fTitle.value,
            start: fStart.value,
            end: fEnd.value,
            location: fLocation.value,
            color: fColor.value,
        };
        if (weekly()) {
            nv.weekday = fWeekday.value;
        } else {
            nv.date = fDate.value;
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

    // ---- drag gestures: listeners armed per gesture via listen() (off()
    // is idempotent and self-pruning). The unmount hook cancels a
    // mid-drag gesture: clears the drag state and the document cursor
    let release: (() => void) | null = null;
    onUnmount(() => release?.());

    const begin = (): void => {
        release?.();
        const detach = () => {
            offMove();
            offUp();
            release = null;
        };
        const offMove = listen<MouseEvent>(document, 'mousemove', onDragMove);
        const offUp = listen<MouseEvent>(document, 'mouseup', (ev) => {
            detach();
            commitDrag(ev);
        });
        release = () => {
            detach();
            drag.value = null;
            document.body.style.cursor = '';
        };
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

    /** The grid cell under the pointer. elementsFromPoint FIRST: dragging
     *  over another (overlapping) event makes e.target that event, whose
     *  closest('td') is its ORIGIN cell, not the cell under the cursor — so
     *  point lookup is the accurate one. closest() is the fallback (and the
     *  path jsdom/tests take, where elementsFromPoint has no layout). */
    const cellFrom = (e: MouseEvent): HTMLElement | null => {
        let cell: HTMLElement | null = null;
        if (typeof document.elementsFromPoint === 'function') {
            for (const c of document.elementsFromPoint(e.clientX, e.clientY)) {
                if (c.tagName === 'TD' && c.getAttribute('data-y') !== null) {
                    cell = c as HTMLElement;
                    break;
                }
            }
        }
        if (!cell) {
            const target = e.target as Element | null;
            cell = target && target.closest ? (target.closest('td[data-y]') as HTMLElement | null) : null;
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
        document.body.style.cursor = '';
        if (!d) {
            drag.value = null;
            return;
        }
        // Ghost removal + the committed change land in ONE update pass
        batch(() => {
            drag.value = null;
            commitDragChange(d);
        });
    };

    const commitDragChange = (d: Drag): void => {
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
        activeSchedule = token; // this grid now owns the keyboard shortcuts
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
            // own the keyboard so Ctrl+C/V/Z/Y + Delete work after a click
            // (the handler lives on the root; clicking a child won't focus it)
            rootEl?.focus({ preventScroll: true });
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

    // ---- keyboard gestures (2.1.1): move, resize and create without a
    // pointer. Both commit through commitDragChange — the SAME path the
    // mouse drags take — so onbeforechange/onbeforechangeevent, conflict
    // and read-only-range guards, history and onchangeevent are identical.

    /** Alt+arrows (move) / Shift+Up/Down (resize) on the selected event */
    const nudge = (dx: number, dy: number, resize: boolean): void => {
        if (selection.value.length !== 1) {
            return;
        }
        const rec = find(selection.value[0]);
        if (!rec || rec.readonly) {
            return;
        }
        const cols = columns().filter((c): c is Column => !!c);
        let place: Place = weekly() ? (rec.weekday as number) : String(rec.date || '').substring(0, 10);
        let i = cols.findIndex((c) => placeOf(c) === place);
        if (dx) {
            const next = cols[i + dx];
            if (i < 0 || !next) {
                return; // off the visible columns (a drag cannot leave them either)
            }
            i += dx;
            place = placeOf(next);
        }
        const div = snapDiv();
        const [lo, hi] = rowWindow();
        let y1 = hourToInt(rec.start);
        let y2 = hourToInt(rec.end) - 1;
        if (resize) {
            y2 = Math.min(hi - 1, Math.max(y1, y2 + dy * div));
        } else if (dy) {
            y1 += dy * div;
            y2 += dy * div;
            if (y1 < lo || y2 >= hi) {
                return; // off the visible rows
            }
        }
        commitDragChange({
            kind: resize ? 'resize' : 'move',
            record: rec,
            guid: rec.guid || null,
            column: i >= 0 ? cols[i].x : 0,
            place,
            y1,
            y2,
        });
    };

    /** N: create an event from the keyboard — the drag-create commit path
     *  (onbeforeinsert template → addEvents → edition, so the editor opens).
     *  Lands after the selected event on its column, else on today's
     *  column, else the first visible one, at the first free snap slot. */
    const keyboardCreate = (): void => {
        const cols = columns().filter((c): c is Column => !!c);
        if (!cols.length) {
            return;
        }
        const selRec = selection.value.length === 1 ? find(selection.value[0]) : undefined;
        const selPlace: Place | undefined = selRec
            ? weekly()
                ? (selRec.weekday as number)
                : String(selRec.date || '').substring(0, 10)
            : undefined;
        const today = todayISO();
        const col =
            (selRec && cols.find((c) => placeOf(c) === selPlace)) ||
            cols.find((c) => (weekly() ? c.weekday === new Date().getDay() : c.date === today)) ||
            cols[0];
        const place = placeOf(col);
        const div = snapDiv();
        const [lo, hi] = rowWindow();
        let y = selRec && placeOf(col) === selPlace ? hourToInt(selRec.end) : lo;
        while (y + div <= hi && (inDisabledRange(y, y + div) || (!props.overlap.value && conflicts(place, y, y + div)))) {
            y += div;
        }
        if (y + div > hi) {
            return; // no free slot in the visible window
        }
        let record: ScheduleEvent = weekly() ? { weekday: col.weekday } : { date: place as string };
        const ret = call('onbeforeinsert', record);
        if (ret === false) {
            return;
        }
        if (ret && typeof ret === 'object') {
            record = ret as ScheduleEvent;
        }
        commitDragChange({ kind: 'create', record, guid: null, column: col.x, place, y1: y, y2: y + div - 1 });
    };

    const onKey = (e: KeyboardEvent): void => {
        // typing in the editor form (or any form control inside the root)
        // bubbles here — never treat it as a grid shortcut
        const t = e.target as HTMLElement | null;
        if (t && t !== rootEl && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) {
            return;
        }
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
        if (e.altKey) {
            // Alt+arrows: move the selected event (keyboard drag-move)
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                nudge(0, e.key === 'ArrowUp' ? -1 : 1, false);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                nudge(e.key === 'ArrowLeft' ? -1 : 1, 0, false);
            }
            return;
        }
        if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            // Shift+Up/Down: resize the selected event (keyboard drag-resize)
            e.preventDefault();
            nudge(0, e.key === 'ArrowUp' ? -1 : 1, true);
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
        } else if (e.key === 'Enter') {
            // keyboard alternative to double click: open the editor
            const rec = selection.value.length === 1 ? find(selection.value[0]) : undefined;
            if (rec && !rec.readonly) {
                e.preventDefault();
                edition(rec);
            }
        } else if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            keyboardCreate();
        }
    };

    // The keydown handler also lives on the root (onkeydown, for when the
    // grid is focused), but copy/paste/delete must work right after a click
    // even though the root isn't reliably focused — so listen on the
    // document too, scoped to the active instance and never while an input
    // is focused (so it can't hijack typing in the editor or elsewhere).
    onMount(() =>
        listen<KeyboardEvent>(document, 'keydown', (e) => {
            if (e.target === rootEl || activeSchedule !== token) {
                return; // root's own handler did it, or another grid is active
            }
            const ae = document.activeElement as HTMLElement | null;
            if (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable)) {
                return;
            }
            onKey(e);
        })
    );

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
        const color = ev.color || '';
        // Accessible name (4.1.2): title/times paint via CSS attr()
        // content, invisible to AT — name the event explicitly, with its
        // day so a week of "Standup, 09:00 to 10:00" stays distinguishable
        const dict = props.weekdays.value as string[] | undefined;
        const names = Array.isArray(dict) && dict.length === 7 ? dict : DEFAULT_WEEKDAYS;
        const when = weekly() ? names[(ev.weekday || 0) % 7] : String(ev.date || '').substring(0, 10);
        // Keyed by guid: deletes/pastes inside a cell move the surviving
        // siblings; a time change still rebuilds (the event leaves one
        // cell's list for another — keys are scoped per list)
        return html`<div key="${ev.guid}" class="lm-schedule-item ${selected ? 'lm-schedule-selected' : ''}"
            id="${itemId(ev.guid!)}"
            role="button"
            aria-label="${(ev.title || 'No title') + ', ' + when + ', ' + ev.start + ' to ' + ev.end}"
            aria-pressed="${selected ? 'true' : 'false'}"
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
            style="${css({
                height: heightRows * g,
                '--lm-schedule-background': color,
                '--lm-schedule-color': color && (isLight(color) ? 'black' : 'white'),
                marginLeft: staggerIndex ? staggerIndex * 10 : false,
                width: staggerIndex ? 'calc(100% - ' + staggerIndex * 10 + 'px)' : false,
            })}"></div>`;
    };

    const ghostView = (d: Drag): View => {
        const g = gridMin();
        const lo = Math.min(d.y1, d.y2);
        const hi = Math.max(d.y1, d.y2);
        const heightRows = hi - lo + 1;
        const color = d.record.color || '#2563eb';
        return html`<div class="lm-schedule-item lm-schedule-selected lm-schedule-dragging"
            aria-hidden="true"
            data-title="${d.record.title || 'No title'}"
            data-start="${intToHour(lo)}"
            data-end="${intToHour(hi + 1)}"
            data-height="${heightRows}"
            style="${css({
                height: heightRows * g,
                '--lm-schedule-background': color,
                '--lm-schedule-color': isLight(color) ? 'black' : 'white',
            })}"></div>`;
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
                        data-today="${isTodayColumn ? 'true' : false}"
                        class="${disabled ? 'lm-schedule-disabled' : ''}">${items}</td>`
                );
            }
            trs.push(html`<tr class="${hour ? 'lm-schedule-hour' : ''}" style="height:${g}px">${tds}</tr>`);
        }
        return trs;
    };

    // ---- the built-in editor (v5 event.js fields, on the Modal primitive)
    const editorView = (): View | string => {
        const dict = props.weekdays.value as string[] | undefined;
        const names = Array.isArray(dict) && dict.length === 7 ? dict : DEFAULT_WEEKDAYS;
        // time options as Dropdown data; the date uses the Calendar element
        const timeData = timeOptions().map((t) => ({ value: t, text: t }));
        return html`<div class="lm-schedule-form">
            <input type="text" class="lm-schedule-editor-title" placeholder="Title" bind="${fTitle}" />
            <div class="lm-schedule-editor-when">
                ${weekly()
                    ? html`<select class="lm-schedule-editor-weekday"
                          onchange="${(e: Event) =>
                              (fWeekday.value = parseInt((e.target as HTMLSelectElement).value, 10))}">${names.map(
                          (n, i) =>
                              html`<option value="${i}" selected="${i === fWeekday.value || false}">${n}</option>`
                      )}</select>`
                    : html`<div class="lm-schedule-editor-date">
                          <${Calendar} bind="${fDate}" placeholder="Date" />
                      </div>`}
                <div class="lm-schedule-editor-start">
                    <${Dropdown} data="${timeData}" bind="${fStart}" placeholder="Start" />
                </div>
                <div class="lm-schedule-editor-end">
                    <${Dropdown} data="${timeData}" bind="${fEnd}" placeholder="End" />
                </div>
            </div>
            <input type="text" class="lm-schedule-editor-location" placeholder="Location" bind="${fLocation}" />
            <div class="lm-schedule-editor-palette">${PALETTE.map(
                (c) => html`<button type="button" style="background-color:${c}"
                    aria-label="${COLOR_NAMES[c] || c}"
                    aria-pressed="${() => (c === fColor.value ? 'true' : 'false')}"
                    data-color="${c}" data-selected="${() => (c === fColor.value ? 'true' : false)}"
                    onclick="${() => (fColor.value = c)}"></button>`
            )}</div>
            <button type="button" class="lm-schedule-editor-save" onclick="${saveEditor}">Save</button>
        </div>`;
    };

    return html`<div class="lm-schedule ${() => (gridMin() > 9 ? 'lm-schedule-large' : '')}"
        tabindex="0"
        role="group"
        aria-label="Schedule"
        aria-activedescendant="${() => (selection.value.length === 1 ? itemId(selection.value[0]) : false)}"
        data-type="${() => (props.type.value as string) || 'week'}"
        data-weekly="${() => (weekly() ? 'true' : false)}"
        ref="${(el: HTMLElement) => (rootEl = el)}"
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
