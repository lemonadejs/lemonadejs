/**
 * <Calendar /> — date, datetime and range picker on the Modal primitive.
 *
 * v5 parity, the full nuance set:
 *   - value shapes: 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM:SS' (time), Excel
 *     serial numbers (numeric — 1900 leap-bug compatible), arrays or
 *     comma strings (range), Date instances accepted on the way in
 *   - three views: 42-cell day grid (grey out-of-month days), 12-month
 *     picker, 16-year pages; month/year header buttons drill, selecting
 *     a month/year returns to the day grid
 *   - range: first click starts, second ends (clicking at/before the
 *     start restarts), live mouseover preview, commit via Done/Update
 *   - time: hour/minute selects; a day click commits but keeps the
 *     panel open, Update closes (v5)
 *   - min/max ISO bounds + validate(day, month, year, cell) hook (v5
 *     validRange array/function split into three clean props)
 *   - input mode: the calendar owns its input; typing is masked per
 *     format (inlined jSuites date tokens) and steers the view live —
 *     commit happens on Enter/click/Done only; the popup is a Modal
 *     anchored beneath the input (anchor measured at open)
 *   - input adoption: `input` accepts an EXISTING HTMLInputElement (v5
 *     `input`; v5's 'auto' is simply v6's default internal input) — the
 *     calendar renders no internal input and drives the host's element
 *     instead: value kept formatted per `format` (an initial input value
 *     seeds an empty calendar), open on focus/click, masked typing
 *     steers the view, keyboard, and a bubbling `change` event on every
 *     commit; every listener goes through listen() so unmount removes
 *     them all
 *   - initinput=false (v5 initInput): the interactive listeners are NOT
 *     wired on the input (adopted or internal — v5 applied it to
 *     whichever input the option configured): no open-on-focus/click,
 *     no type-to-update, no input keyboard; the input text still tracks
 *     the committed value
 *   - types: default (anchored panel) | picker (bottom sheet) | inline
 *     (no modal, always visible) | auto (viewport width at open)
 *   - keyboard: closed Enter/arrows open; input arrows focus the grid;
 *     grid arrows move the cursor (7/4 vertical jump), wrapping across
 *     months/years/pages; Enter selects; Escape CANCELS (uncommitted
 *     cursor/range/typed text revert) — like every v6 overlay block
 *   - wheel month navigation (wheel=false opts out), event markers from
 *     data=[{date}], today bold, starting weekday (live), grid lines,
 *     footer toggle, disabled, placeholder
 *   - localization through document.dictionary (month/weekday names and
 *     the Reset/Done/Update labels), v5's T()/Helpers hooks
 *
 * Events: onchange(value), onupdate(cursorIso) on every cursor move,
 * onopen(), onclose(origin: 'button' | 'escape' | 'focusout').
 */

import { batch, component, html, isDisposing } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

export interface CalendarEvent {
    date: string;
    [key: string]: unknown;
}

export interface CalendarCell {
    title: string;
    value: number; // month index (months view) or year (years view)
    y: number;
    m: number;
    d: number;
    serial: number;
    grey: boolean;
    selected: boolean;
    disabled: boolean;
    bold: boolean;
    event: boolean;
    start: boolean;
    end: boolean;
    range: boolean;
    last: boolean;
}

type Parts = { y: number; m: number; d: number; h: number; i: number; s: number };

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** v5 T(): every label and name runs through document.dictionary */
const translate = (t: string): string => {
    if (typeof document !== 'undefined') {
        const dictionary = (document as Document & { dictionary?: Record<string, string> }).dictionary;
        if (dictionary && dictionary[t]) {
            return dictionary[t];
        }
    }
    return t;
};

const two = (n: number): string => String(n).padStart(2, '0');

// ---- pure calendar arithmetic (UTC integer math only — never parse
// date STRINGS through new Date(); timezone can never leak in)
const DAY = 86400000;
const EPOCH = Date.UTC(1899, 11, 31); // Excel serial day 0

const daysInMonth = (y: number, m: number): number => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const dayOfWeek = (y: number, m: number, d: number): number => new Date(Date.UTC(y, m, d)).getUTCDay();

/** Excel serial (with the 1900 leap-year bug, v5 dateToNum) */
const toSerial = (y: number, m: number, d: number): number => {
    let n = Math.round((Date.UTC(y, m, d) - EPOCH) / DAY);
    if (n >= 60) {
        n += 1;
    }
    return n;
};

/** v5 numToDate: serial (fraction = time of day) back to components */
const fromSerial = (num: number): Parts => {
    let whole = Math.floor(num);
    const frac = num - whole;
    if (whole >= 60) {
        whole -= 1;
    }
    const t = new Date(EPOCH + whole * DAY + Math.round(frac * 86400) * 1000);
    return {
        y: t.getUTCFullYear(),
        m: t.getUTCMonth(),
        d: t.getUTCDate(),
        h: t.getUTCHours(),
        i: t.getUTCMinutes(),
        s: t.getUTCSeconds(),
    };
};

const serialOf = (p: Parts, withTime: boolean): number =>
    toSerial(p.y, p.m, p.d) + (withTime ? (p.h * 3600 + p.i * 60 + p.s) / 86400 : 0);

const isoOf = (p: Parts, withTime: boolean): string =>
    p.y + '-' + two(p.m + 1) + '-' + two(p.d) + (withTime ? ' ' + two(p.h) + ':' + two(p.i) + ':' + two(p.s) : '');

const parseIso = (text: string): Parts | null => {
    const m = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (!m) {
        return null;
    }
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (mo < 0 || mo > 11 || d < 1 || d > daysInMonth(y, mo)) {
        return null;
    }
    return {
        y,
        m: mo,
        d,
        h: m[4] ? Number(m[4]) % 24 : 0,
        i: m[5] ? Number(m[5]) % 60 : 0,
        s: m[6] ? Number(m[6]) % 60 : 0,
    };
};

// ---- the jSuites date-mask tokens v5 used through utils.Mask, inlined
const TOKENS = /AM\/PM|YYYY|YY|MMMM|MMM|MM|MI|M|DDDD|DDD|DD|D|HH24|HH12|HH|H|SS/gi;

const hour12 = (h: number): number => {
    const v = h % 12;
    return v === 0 ? 12 : v;
};

/** v5 Mask.render for dates: render parts through a format mask */
const formatParts = (p: Parts, format: string): string => {
    const twelve = /AM\/PM/i.test(format);
    return format.replace(TOKENS, (token) => {
        switch (token.toUpperCase()) {
            case 'YYYY':
                return String(p.y).padStart(4, '0');
            case 'YY':
                return two(p.y % 100);
            case 'MMMM':
                return translate(MONTHS[p.m]);
            case 'MMM':
                return translate(MONTHS[p.m]).substring(0, 3);
            case 'MM':
                return two(p.m + 1);
            case 'M':
                return String(p.m + 1);
            case 'DDDD':
                return translate(WEEKDAYS[dayOfWeek(p.y, p.m, p.d)]);
            case 'DDD':
                return translate(WEEKDAYS[dayOfWeek(p.y, p.m, p.d)]).substring(0, 3);
            case 'DD':
                return two(p.d);
            case 'D':
                return String(p.d);
            case 'HH24':
                return two(p.h);
            case 'HH':
                return two(twelve ? hour12(p.h) : p.h);
            case 'HH12':
                return two(hour12(p.h));
            case 'H':
                return String(twelve ? hour12(p.h) : p.h);
            case 'MI':
                return two(p.i);
            case 'SS':
                return two(p.s);
            case 'AM/PM':
                return p.h >= 12 ? 'PM' : 'AM';
            default:
                return token;
        }
    });
};

/** v5 Mask.extractDateFromString: read a typed string through the mask */
const parseFormat = (text: string, format: string): Parts | null => {
    // Tokenize the format preserving the literals between tokens
    const tokens: { t?: string; lit?: string }[] = [];
    let last = 0;
    format.replace(TOKENS, (token, at: number) => {
        if (at > last) {
            tokens.push({ lit: format.substring(last, at) });
        }
        tokens.push({ t: token.toUpperCase() });
        last = at + token.length;
        return token;
    });
    if (last < format.length) {
        tokens.push({ lit: format.substring(last) });
    }

    let pos = 0;
    let y = NaN;
    let m = NaN;
    let d = NaN;
    let h = NaN;
    let i = NaN;
    let s = NaN;
    let half = '';

    const digits = (max: number): number => {
        let n = '';
        while (n.length < max && pos < text.length && /\d/.test(text[pos])) {
            n += text[pos++];
        }
        return n === '' ? NaN : Number(n);
    };

    for (const tk of tokens) {
        if (tk.lit !== undefined) {
            for (const ch of tk.lit) {
                if (text[pos] === ch) {
                    pos++;
                }
            }
            continue;
        }
        switch (tk.t) {
            case 'YYYY':
                y = digits(4);
                break;
            case 'YY': {
                const v = digits(2);
                y = Number.isNaN(v) ? NaN : 2000 + v;
                break;
            }
            case 'MMMM':
            case 'MMM': {
                const rest = text.substring(pos).toLowerCase();
                for (let at = 0; at < 12; at++) {
                    for (const name of [translate(MONTHS[at]), MONTHS[at]]) {
                        const piece = tk.t === 'MMM' ? name.substring(0, 3) : name;
                        if (rest.startsWith(piece.toLowerCase())) {
                            m = at;
                            pos += piece.length;
                            at = 12;
                            break;
                        }
                    }
                }
                break;
            }
            case 'MM':
            case 'M':
                m = digits(2) - 1;
                break;
            case 'DDDD':
            case 'DDD': {
                const rest = text.substring(pos).toLowerCase();
                for (const name of WEEKDAYS) {
                    for (const candidate of [translate(name), name]) {
                        const piece = tk.t === 'DDD' ? candidate.substring(0, 3) : candidate;
                        if (rest.startsWith(piece.toLowerCase())) {
                            pos += piece.length;
                            break;
                        }
                    }
                }
                break;
            }
            case 'DD':
            case 'D':
                d = digits(2);
                break;
            case 'HH24':
            case 'HH12':
            case 'HH':
            case 'H':
                h = digits(2);
                break;
            case 'MI':
                i = digits(2);
                break;
            case 'SS':
                s = digits(2);
                break;
            case 'AM/PM': {
                const piece = text.substring(pos, pos + 2).toLowerCase();
                if (piece === 'am' || piece === 'pm') {
                    half = piece;
                    pos += 2;
                }
                break;
            }
        }
    }

    if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) {
        return null;
    }
    if (Number.isNaN(d)) {
        d = 1; // v5: year+month complete, day defaults to 1
    }
    if (d < 1 || d > daysInMonth(y, m)) {
        return null;
    }
    if (Number.isNaN(h)) {
        h = 0;
    }
    if (half === 'pm' && h < 12) {
        h += 12;
    } else if (half === 'am' && h === 12) {
        h = 0;
    }
    return { y, m, d, h: h % 24, i: Number.isNaN(i) ? 0 : i % 60, s: Number.isNaN(s) ? 0 : s % 60 };
};

/**
 * v5 Mask.oninput, the progressive typing mask: numeric formats become
 * a digit/literal pattern; separators are auto-inserted while typing.
 * Formats with name tokens (MMM, DDDD, AM/PM) cannot be masked — null.
 */
const maskPattern = (format: string): string | null => {
    let pattern = '';
    let bad = false;
    let last = 0;
    format.replace(TOKENS, (token, at: number) => {
        pattern += format.substring(last, at);
        last = at + token.length;
        const t = token.toUpperCase();
        if (t === 'MMMM' || t === 'MMM' || t === 'DDDD' || t === 'DDD' || t === 'AM/PM') {
            bad = true;
        } else {
            pattern += 'd'.repeat(t === 'YYYY' ? 4 : 2);
        }
        return token;
    });
    pattern += format.substring(last);
    return bad ? null : pattern;
};

const applyMask = (raw: string, pattern: string): string => {
    let out = '';
    let at = 0;
    for (const p of pattern) {
        if (at >= raw.length) {
            break;
        }
        if (p === 'd') {
            while (at < raw.length && !/\d/.test(raw[at])) {
                at++;
            }
            if (at >= raw.length) {
                break;
            }
            out += raw[at++];
        } else {
            out += p;
            if (raw[at] === p) {
                at++;
            }
        }
    }
    return out;
};

const SERIAL = /^\d+(\.\d+)?$/;

/** Parse one value entry: Date | serial | ISO | format-masked string */
const parseEntry = (v: unknown, format: string): Parts | null => {
    if (v === null || v === undefined || v === '') {
        return null;
    }
    if (v instanceof Date) {
        if (Number.isNaN(v.getTime())) {
            return null;
        }
        // Local components by design: the Date the caller built locally
        // is the date they mean (v5 read UTC — a -1 day surprise west of
        // Greenwich)
        return { y: v.getFullYear(), m: v.getMonth(), d: v.getDate(), h: v.getHours(), i: v.getMinutes(), s: 0 };
    }
    if (typeof v === 'number' || (typeof v === 'string' && SERIAL.test(v.trim()))) {
        return fromSerial(Number(v));
    }
    if (typeof v !== 'string') {
        return null;
    }
    return parseIso(v) || (format ? parseFormat(v, format) : null);
};

export const Calendar = component('calendar', {
    bind: String,                 // selected value (v5: value) — see formats above
    name: '',                     // form field name — when set, the root reflects
                                  // its value as a native el.value (form-associated;
                                  // Formify & FormData read it with no hidden input)
    range: false,                 // two-click range selection
    time: false,                  // hour/minute picker, value carries time
    numeric: false,               // value as Excel serial number(s)
    format: '',                   // input display/typing mask (default YYYY-MM-DD)
    type: '',                     // '' | default | picker | inline | auto
    data: Array,                  // [{ date: 'YYYY-MM-DD', ... }] event markers
    min: '',                      // first selectable date (v5 validRange[0])
    max: '',                      // last selectable date (v5 validRange[1])
    validate: Function,           // (day, month, year, cell) -> disabled (v5 validRange fn)
    startingday: 0,               // first weekday: 0 Sunday .. 6 Saturday (live)
    disabled: false,              // blocks selection, dims the grid
    grid: false,                  // grid-line styling (data-grid)
    footer: true,                 // Update button / time row
    wheel: true,                  // mouse wheel month navigation
    placeholder: '',              // input placeholder
    input: null,                  // 'any': an existing HTMLInputElement to adopt
                                  // instead of rendering the internal input (v5 input)
    initinput: true,              // wire the interactive input listeners: open on
                                  // focus/click, type-to-update, keyboard (v5 initInput);
                                  // false keeps only the value sync
    width: 300,                   // popup panel width (v5 modal width)
    onchange: Function,           // (value) on commit
    onupdate: Function,           // (cursorIso) on every cursor move
    onopen: Function,
    onclose: Function,            // (origin: 'button' | 'escape' | 'focusout')
    api: {
        open: Function, close: Function, isClosed: Function,
        getValue: Function, setValue: Function, update: Function, reset: Function,
        next: Function, prev: Function, setView: Function,
    },
}, (props, { bind, state, onMount, listen }) => {
    const picked = bind(props, '');

    // ---- adopted external input (v5 `input`): an existing element replaces
    // the internal input entirely; `{ current }` refs unwrap (v5 getInput)
    const adopted: HTMLInputElement | null = (() => {
        let v = props.input.peek() as unknown;
        if (v && typeof v === 'object' && 'current' in (v as Record<string, unknown>)) {
            v = (v as { current: unknown }).current;
        }
        return v && typeof v === 'object' && (v as Node).nodeType === 1 && typeof (v as Element).tagName === 'string'
            ? (v as HTMLInputElement)
            : null;
    })();

    /** v5 initInput !== false: are the interactive input listeners wired? */
    const wired = () => props.initinput.peek() !== false;

    const boot = new Date();
    const cells = state<CalendarCell[]>([]);

    const refresh = () => {
        const vw = view.peek();
        cells.value = vw === 'days' ? buildDays() : vw === 'months' ? buildMonths() : buildYears();
    };

    const view = state<'days' | 'months' | 'years'>('days', refresh);
    const page = state({ y: boot.getFullYear(), m: boot.getMonth() }, refresh);
    const cursor = state({ y: boot.getFullYear(), m: boot.getMonth(), d: boot.getDate() }, refresh);
    const hour = state<number | string>(0);
    const minute = state<number | string>(0);
    const display = state('');          // the input text
    const opened = state(false);
    const resolvedType = state('');     // 'auto' resolves at open (v5)
    const panelPosition = state('fixed');
    const anchorTop = state(0);
    const anchorLeft = state(0);
    const panelWidth = state(0);

    let rangeStart: number | null = null; // serials (uncommitted while open)
    let rangeEnd: number | null = null;
    let hovered: number | null = null;    // range preview end (mouseover)
    let root: HTMLElement | null = null;
    let gridEl: HTMLElement | null = null;
    let modalApi: { open(): void; close(): void } | null = null;

    const kind = () => resolvedType.value || (props.type.value as string) || 'default';
    const inline = () => kind() === 'inline';
    const fmt = () => (props.format.peek() as string) || 'YYYY-MM-DD';

    // ---- view building (v5 Views): one cell list per view
    const buildDays = (): CalendarCell[] => {
        const pg = page.peek();
        const cur = cursor.peek();
        const start = Number(props.startingday.peek()) || 0;
        const offset = (dayOfWeek(pg.y, pg.m, 1) - start + 7) % 7;
        const base = toSerial(pg.y, pg.m, 1) - offset;
        const today = new Date();
        const min = String((props.min.peek() as string) || '').substring(0, 10);
        const max = String((props.max.peek() as string) || '').substring(0, 10);
        const validate = props.validate.peek() as
            | ((day: number, month: number, year: number, cell: CalendarCell) => unknown)
            | undefined;
        const events = new Set(
            ((props.data.peek() as CalendarEvent[]) || [])
                .filter((entry) => entry && typeof entry === 'object' && typeof entry.date === 'string')
                .map((entry) => entry.date.substring(0, 10))
        );
        const rangeOn = !!props.range.peek();
        const previewEnd =
            rangeEnd !== null
                ? rangeEnd
                : rangeStart !== null && hovered !== null && hovered >= rangeStart
                  ? hovered
                  : null;

        const out: CalendarCell[] = [];
        for (let at = 0; at < 42; at++) {
            const serial = base + at;
            const p = fromSerial(serial);
            const iso = isoOf(p, false);
            const grey = p.m !== pg.m || p.y !== pg.y;
            const cell: CalendarCell = {
                title: String(p.d),
                value: 0,
                y: p.y,
                m: p.m,
                d: p.d,
                serial,
                grey,
                selected: cur.y === p.y && cur.m === p.m && cur.d === p.d,
                disabled: false,
                bold: today.getFullYear() === p.y && today.getMonth() === p.m && today.getDate() === p.d,
                event: !grey && events.has(iso),
                start: false,
                end: false,
                range: false,
                last: false,
            };
            if ((min && iso < min) || (max && iso > max)) {
                cell.disabled = true;
            }
            if (typeof validate === 'function') {
                const ret = validate(p.d, p.m, p.y, cell);
                if (ret !== undefined) {
                    cell.disabled = !!ret;
                }
            }
            if (rangeOn && rangeStart !== null) {
                cell.start = serial === rangeStart;
                cell.end = rangeEnd !== null && serial === rangeEnd;
                cell.range = cell.start || (previewEnd !== null && serial >= rangeStart && serial <= previewEnd);
                cell.last = rangeEnd === null && hovered !== null && serial === hovered && hovered >= rangeStart;
            }
            out.push(cell);
        }
        return out;
    };

    const buildMonths = (): CalendarCell[] => {
        const pg = page.peek();
        const cur = cursor.peek();
        return MONTHS.map((name, at) => ({
            title: translate(name).substring(0, 3),
            value: at,
            y: pg.y,
            m: at,
            d: 1,
            serial: 0,
            grey: false,
            selected: cur.y === pg.y && cur.m === at,
            disabled: false,
            bold: false,
            event: false,
            start: false,
            end: false,
            range: false,
            last: false,
        }));
    };

    const buildYears = (): CalendarCell[] => {
        const pg = page.peek();
        const cur = cursor.peek();
        const first = pg.y - (pg.y % 16);
        return Array.from({ length: 16 }, (_, at) => ({
            title: String(first + at),
            value: first + at,
            y: first + at,
            m: 0,
            d: 1,
            serial: 0,
            grey: false,
            selected: cur.y === first + at,
            disabled: false,
            bold: false,
            event: false,
            start: false,
            end: false,
            range: false,
            last: false,
        }));
    };

    // ---- value plumbing (v5 normalize/getValue/setValue)
    const entriesOf = (v: unknown): unknown[] => {
        if (v === null || v === undefined || v === '') {
            return [];
        }
        if (Array.isArray(v)) {
            return v;
        }
        if (v instanceof Date || typeof v === 'number') {
            return [v];
        }
        return String(v).split(',');
    };

    /** Normalize any accepted shape into the canonical committed value */
    const canonical = (v: unknown): unknown => {
        const entries = entriesOf(v);
        if (!entries.length) {
            return '';
        }
        const withTime = !!props.time.peek();
        const mapped = entries.map((entry) => {
            const p = parseEntry(entry, fmt());
            if (!p) {
                return '';
            }
            return props.numeric.peek() ? serialOf(p, withTime) : isoOf(p, withTime);
        });
        if (Array.isArray(v)) {
            return mapped;
        }
        return mapped.length > 1 ? mapped.join(',') : mapped[0];
    };

    const renderDisplay = (v: unknown): string => {
        const entries = entriesOf(v);
        if (!entries.length) {
            return '';
        }
        return entries
            .map((entry) => {
                const p = parseEntry(entry, fmt());
                return p ? formatParts(p, fmt()) : '';
            })
            .join(',');
    };

    /** Sync the whole view state (cursor/page/time/range/input) from a value */
    const syncFromValue = (v: unknown) => {
        const entries = entriesOf(v);
        const first = entries.length ? parseEntry(entries[0], fmt()) : null;
        const now = new Date();
        const p = first || {
            y: now.getFullYear(),
            m: now.getMonth(),
            d: now.getDate(),
            h: now.getHours(),
            i: now.getMinutes(),
            s: 0,
        };
        // Five state writes + the rebuild: one update pass
        batch(() => {
            cursor.value = { y: p.y, m: p.m, d: p.d };
            page.value = { y: p.y, m: p.m };
            hour.value = p.h;
            minute.value = p.i;
            rangeStart = null;
            rangeEnd = null;
            hovered = null;
            if (props.range.peek() && first) {
                rangeStart = toSerial(p.y, p.m, p.d);
                const second = entries.length > 1 ? parseEntry(entries[1], fmt()) : null;
                rangeEnd = second ? toSerial(second.y, second.m, second.d) : null;
            }
            display.value = renderDisplay(v);
            refresh();
        });
    };

    // ---- commit (the ONLY paths that write the bound value)
    const commitValue = (v: unknown) => {
        if (JSON.stringify(v) !== JSON.stringify(picked.peek())) {
            picked.set(v as never); // fires onchange (v6 .set semantics)
            // form-associated: a user value change notifies the enclosing <form>
            // exactly like a native input would (Formify listens for bubbling input)
            root?.dispatchEvent(new Event('input', { bubbles: true }));
            // v5 dispatched change on the configured input on every value
            // change — the host's own form logic keeps hearing its element
            adopted?.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const commitSingle = () => {
        const c = cursor.peek();
        const withTime = !!props.time.peek();
        const p: Parts = { y: c.y, m: c.m, d: c.d, h: Number(hour.peek()) || 0, i: Number(minute.peek()) || 0, s: 0 };
        commitValue(props.numeric.peek() ? serialOf(p, withTime) : isoOf(p, withTime));
    };

    const commitRange = () => {
        if (rangeStart === null) {
            commitValue('');
            return;
        }
        const entry = (serial: number): unknown =>
            props.numeric.peek() ? serial : isoOf(fromSerial(serial), false);
        commitValue([entry(rangeStart), rangeEnd !== null ? entry(rangeEnd) : '']);
    };

    const commit = () => (props.range.peek() ? commitRange() : commitSingle());

    // ---- cursor and navigation
    const fireUpdate = () => {
        const c = cursor.peek();
        props.onupdate?.(isoOf({ ...c, h: 0, i: 0, s: 0 }, false));
    };

    const setCursorTo = (cell: CalendarCell) => {
        cursor.value = { y: cell.y, m: cell.m, d: cell.d };
        const pg = page.peek();
        if (pg.y !== cell.y || pg.m !== cell.m) {
            page.value = { y: cell.y, m: cell.m };
        }
        fireUpdate();
    };

    /** Page navigation: month, year or 16-year block per view (v5 move) */
    const move = (direction: number) => {
        const pg = page.peek();
        const vw = view.peek();
        if (vw === 'days') {
            const total = pg.y * 12 + pg.m + direction;
            page.value = { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
        } else if (vw === 'months') {
            page.value = { y: pg.y + direction, m: pg.m };
        } else {
            page.value = { y: pg.y + direction * 16, m: pg.m };
        }
    };

    /** Keyboard cursor movement: date arithmetic, the page follows */
    const moveCursor = (delta: number) => {
        const cur = cursor.peek();
        const vw = view.peek();
        if (vw === 'days') {
            const p = fromSerial(toSerial(cur.y, cur.m, cur.d) + delta);
            cursor.value = { y: p.y, m: p.m, d: p.d };
        } else if (vw === 'months') {
            const total = cur.y * 12 + cur.m + delta;
            const y = Math.floor(total / 12);
            const m = ((total % 12) + 12) % 12;
            cursor.value = { y, m, d: Math.min(cur.d, daysInMonth(y, m)) };
        } else {
            const y = cur.y + delta;
            cursor.value = { y, m: cur.m, d: Math.min(cur.d, daysInMonth(y, cur.m)) };
        }
        const c = cursor.peek();
        const pg = page.peek();
        if (pg.y !== c.y || pg.m !== c.m) {
            page.value = { y: c.y, m: c.m };
        }
        // Keyboard range preview: drive the same `hovered` end the mouse does,
        // so the connecting highlight follows arrow-key movement while picking
        // the second date (v5 bug: only mouseover updated the preview).
        if (props.range.peek() && view.peek() === 'days' && rangeStart !== null && rangeEnd === null) {
            hovered = toSerial(c.y, c.m, c.d);
            refresh();
        }
        fireUpdate();
    };

    // ---- selection (v5 select)
    const select = (cell: CalendarCell) => {
        if (props.disabled.peek() || cell.disabled) {
            return;
        }
        const vw = view.peek();
        if (vw === 'months') {
            // Drill back to days: month/year picks move the PAGE only (v5)
            page.value = { y: page.peek().y, m: cell.value };
            view.value = 'days';
            return;
        }
        if (vw === 'years') {
            page.value = { y: cell.value, m: page.peek().m };
            view.value = 'days';
            return;
        }
        setCursorTo(cell);
        if (props.range.peek()) {
            // Clicking at/before the start (or with a finished range) restarts (v5)
            if (rangeStart !== null && (rangeStart >= cell.serial || rangeEnd !== null)) {
                rangeStart = null;
                rangeEnd = null;
                hovered = null;
            }
            if (rangeStart === null) {
                rangeStart = cell.serial;
            } else {
                rangeEnd = cell.serial;
            }
            refresh();
        } else {
            commitSingle();
            if (!props.time.peek()) {
                // time mode: the panel stays open for the time picker (v5)
                closePanel('button');
            }
        }
    };

    const hover = (cell: CalendarCell) => {
        if (props.range.peek() && view.peek() === 'days' && rangeStart !== null && rangeEnd === null) {
            if (hovered !== cell.serial) {
                hovered = cell.serial;
                refresh();
            }
        }
    };

    // ---- open / close (v5 modal + onopen/onclose semantics)
    const open = () => {
        if (inline() || opened.peek()) {
            return;
        }
        if ((props.type.peek() as string) === 'auto') {
            resolvedType.value = window.innerWidth > 640 ? 'default' : 'picker';
        }
        panelPosition.value = kind() === 'picker' ? 'bottom' : 'fixed';
        if (kind() === 'picker') {
            panelWidth.value = 0; // CSS pins the sheet to 100%
        } else {
            panelWidth.value = (props.width.peek() as number) || 300;
            const input = adopted || root?.querySelector('.lm-calendar-input');
            if (input) {
                const rect = input.getBoundingClientRect();
                anchorTop.value = rect.bottom + 1;
                anchorLeft.value = rect.left;
            }
        }
        // The typed text wins over the committed value (v5 onopen)
        const text = display.peek();
        const typed = text ? parseEntry(text.split(',')[0], fmt()) : null;
        syncFromValue(typed && !SERIAL.test(text.trim()) ? text : picked.peek());
        opened.value = true;
        modalApi?.open();
        props.onopen?.();
    };

    const closePanel = (origin: string) => {
        if (inline() || !opened.peek()) {
            return;
        }
        opened.value = false;
        modalApi?.close();
        // Anything uncommitted reverts: cursor, range preview, typed text
        syncFromValue(picked.peek());
        props.onclose?.(origin);
    };

    /** Done/Update/Enter: commit the current cursor (or range) and close */
    const update = () => {
        commit();
        closePanel('button');
    };

    const reset = () => {
        rangeStart = null;
        rangeEnd = null;
        hovered = null;
        commitValue('');
        closePanel('button');
    };

    // ---- input typing: mask + live view steering, commit on Enter only
    const onType = (e: Event) => {
        const el = e.target as HTMLInputElement;
        if (props.format.peek()) {
            const pattern = maskPattern(props.format.peek() as string);
            if (pattern && !((e as InputEvent).inputType || '').includes('delete')) {
                const masked = applyMask(el.value, pattern);
                if (masked !== el.value) {
                    el.value = masked;
                }
            }
        }
        batch(() => {
            display.value = el.value;
            if (!props.range.peek() && !SERIAL.test(el.value.trim())) {
                const p = parseEntry(el.value, fmt());
                if (p) {
                    cursor.value = { y: p.y, m: p.m, d: p.d };
                    page.value = { y: p.y, m: p.m };
                    hour.value = p.h;
                    minute.value = p.i;
                }
            }
        });
    };

    // ---- keyboard (v5 events.keydown + el keydown, one root handler)
    const verticalJump = () => (view.peek() === 'days' ? 7 : 4);

    const onKey = (e: KeyboardEvent) => {
        const k = e.key;
        const target = e.target as HTMLElement | null;
        if (target && target.tagName === 'SELECT') {
            return; // the time selects keep their native arrows
        }
        const isInput = !!(target && target.classList && target.classList.contains('lm-calendar-input'));
        if (isInput && !wired()) {
            return; // initinput=false: the input carries no keyboard behavior (v5)
        }
        const handled = () => {
            e.preventDefault();
            e.stopImmediatePropagation();
        };
        if (!inline() && !opened.peek()) {
            if (isInput && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'Enter')) {
                open();
                handled();
            }
            return;
        }
        if (k === 'Escape') {
            if (!inline()) {
                closePanel('escape');
                handled();
            }
            return;
        }
        if (isInput) {
            // Left/Right stay with the text caret (v5)
            if (k === 'ArrowUp' || k === 'ArrowDown') {
                gridEl?.focus();
                handled();
            } else if (k === 'Enter') {
                update();
                handled();
            }
            return;
        }
        if (k === 'ArrowUp' || k === 'ArrowLeft') {
            moveCursor(-(k === 'ArrowUp' ? verticalJump() : 1));
            handled();
        } else if (k === 'ArrowDown' || k === 'ArrowRight') {
            moveCursor(k === 'ArrowDown' ? verticalJump() : 1);
            handled();
        } else if (k === 'Enter' && target === gridEl) {
            const current = cells.peek().find((c) => c.selected);
            if (current) {
                select(current);
                handled();
            }
        }
    };

    // Wheel month navigation. v5 stepped a month per EVENT — right for a
    // mouse (one event per notch) but a trackpad fires dozens of tiny-delta
    // events per swipe and months flew past. Small deltas ACCUMULATE to a
    // notch (±100) before stepping; a cooldown + discard keeps macOS
    // momentum scroll from paging on after the fingers lift.
    let wheelAcc = 0;
    let wheelLast = 0;
    let wheelStepAt = 0;
    const onWheel = (e: WheelEvent) => {
        if (props.wheel.peek() === false) {
            return;
        }
        e.preventDefault();
        const now = Date.now();
        const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; // lines → px
        if (Math.abs(dy) >= 100) {
            // a real mouse notch: always exactly one step
            move(dy < 0 ? -1 : 1);
            wheelAcc = 0;
            wheelStepAt = now;
            return;
        }
        if (now - wheelLast > 250 || (wheelAcc && Math.sign(dy) !== Math.sign(wheelAcc))) {
            wheelAcc = 0; // a new gesture / direction flip: stale remainder gone
        }
        wheelLast = now;
        wheelAcc += dy;
        if (Math.abs(wheelAcc) >= 100) {
            if (now - wheelStepAt > 150) {
                move(wheelAcc < 0 ? -1 : 1);
                wheelStepAt = now;
            }
            // reached-but-cooling counts for nothing: the momentum tail
            // must re-earn a full notch to step again
            wheelAcc = 0;
        }
    };

    const onFocusOut = (e: FocusEvent) => {
        if (isDisposing() || inline() || !opened.peek() || !root) {
            return;
        }
        // Focus travelling between the panel and the adopted external input
        // stays inside the widget (v5: relatedTarget !== input)
        if (e.relatedTarget && (root.contains(e.relatedTarget as Node) || e.relatedTarget === adopted)) {
            return;
        }
        closePanel('focusout');
    };

    // ---- api
    props.ref?.({
        open,
        close: (origin?: string) => closePanel(origin || 'button'),
        isClosed: () => !opened.peek(),
        getValue: () => picked.peek(),
        setValue: (v: unknown) => commitValue(canonical(v)),
        update,
        reset,
        next: () => move(1),
        prev: () => move(-1),
        setView: (name: string) => {
            if (name === 'days' || name === 'months' || name === 'years') {
                view.value = name;
            }
        },
    });

    // ---- lifecycle: external writes are silent; live props re-render
    onMount(() => picked.subscribe(() => syncFromValue(picked.peek())));
    onMount(() => props.data.subscribe(refresh));
    onMount(() => props.min.subscribe(refresh));
    onMount(() => props.max.subscribe(refresh));
    onMount(() => props.range.subscribe(refresh));
    onMount(() => props.startingday.subscribe(refresh));
    onMount(() =>
        props.format.subscribe(() => {
            display.value = renderDisplay(picked.peek());
        })
    );
    onMount(() => {
        syncFromValue(picked.peek());
    });

    // ---- adopted external input plumbing (v5 onload input block).
    // Runs AFTER the syncFromValue mount above so `display` already holds
    // the rendered text. Interactive listeners only when initinput (v5
    // initInput !== false); everything goes through listen() so unmount
    // removes every handler from the host's element.
    onMount(() => {
        if (!adopted) {
            return;
        }
        if (wired()) {
            // The class is what onKey keys `isInput` off (v5 added it too)
            adopted.classList.add('lm-calendar-input');
            const ph = props.placeholder.peek() as string;
            if (ph && !adopted.getAttribute('placeholder')) {
                adopted.setAttribute('placeholder', ph);
            }
            listen(adopted, 'click', open);
            listen(adopted, 'focusin', open);
            listen(adopted, 'input', onType);
            listen(adopted, 'keydown', onKey as (e: Event) => void);
            listen(adopted, 'focusout', onFocusOut as (e: Event) => void);
            // v5: no calendar value + a pre-filled input — the input seeds
            // the value (silent assignment: adoption is not a user commit;
            // v5 kept this inside the initInput block, so unwired skips it)
            if (!picked.peek() && adopted.value) {
                const seeded = canonical(adopted.value);
                if (seeded !== '') {
                    picked.value = seeded as never; // re-syncs the view via subscribe
                }
            }
        }
        // The element mirrors `display` for its whole life: commit, api
        // setValue, escape revert and open all land here formatted
        const off = display.subscribe(() => {
            if (adopted.value !== display.peek()) {
                adopted.value = display.peek();
            }
        });
        adopted.value = display.peek();
        return off;
    });

    // ---- form-associated: the root reflects a native `value` property wired
    // to the bound state, so any [name] reader (Formify's `'value' in el`
    // path, or hand-written FormData logic) treats the calendar exactly like a
    // native field — no hidden mirror input. The SETTER is silent (assignment,
    // not commit) so an external form write does NOT echo back as an input
    // event; only genuine user commits dispatch input (see commitValue).
    onMount((node) => {
        const el = node as HTMLElement;
        Object.defineProperty(el, 'value', {
            configurable: true,
            get: () => picked.peek(),
            set: (v: unknown) => {
                picked.value = canonical(v) as never;
            },
        });
    });

    // ---- rendering
    const cellView = (c: CalendarCell) => html`<div
        data-grey="${c.grey ? 'true' : false}"
        data-selected="${c.selected ? 'true' : false}"
        data-disabled="${c.disabled ? 'true' : false}"
        data-bold="${c.bold ? 'true' : false}"
        data-event="${c.event ? 'true' : false}"
        data-start="${c.start ? 'true' : false}"
        data-end="${c.end ? 'true' : false}"
        data-range="${c.range ? 'true' : false}"
        data-last="${c.last ? 'true' : false}"
        onclick="${() => select(c)}"
        onmouseover="${() => hover(c)}">${c.title}</div>`;

    const panelView = () => html`<div class="lm-calendar-container" data-view="${view}">
        ${() =>
            inline()
                ? ''
                : html`<div class="lm-calendar-options">
                      <button type="button" onclick="${reset}">${() => translate('Reset')}</button>
                      <button type="button" onclick="${update}">${() => translate('Done')}</button>
                  </div>`}
        <div class="lm-calendar-header">
            <div>
                <div class="lm-calendar-labels">
                    <button type="button" class="lm-calendar-label" onclick="${() => (view.value = 'months')}">${() =>
                        translate(MONTHS[page.value.m])}</button>
                    <button type="button" class="lm-calendar-label" onclick="${() => (view.value = 'years')}">${() =>
                        String(page.value.y)}</button>
                </div>
                <div class="lm-calendar-navigation">
                    <button type="button" class="lm-calendar-icon lm-calendar-prev lm-calendar-ripple"
                        onclick="${() => move(-1)}"></button>
                    <button type="button" class="lm-calendar-icon lm-calendar-next lm-calendar-ripple"
                        onclick="${() => move(1)}"></button>
                </div>
            </div>
            <div class="lm-calendar-weekdays">${() => {
                const start = Number(props.startingday.value) || 0;
                return Array.from({ length: 7 }, (_, at) =>
                    html`<div>${translate(WEEKDAYS[(start + at) % 7]).substring(0, 1)}</div>`
                );
            }}</div>
        </div>
        <div class="lm-calendar-content" tabindex="0"
            ref="${(el: HTMLElement) => (gridEl = el)}"
            onwheel="${onWheel}">
            ${() =>
                // Positional on purpose: a fixed 42/12/16-cell page that is
                // recomputed wholesale — cells never reorder mid-list
                cells.value.map(cellView)}
        </div>
        <div class="lm-calendar-footer" data-visible="${() => (props.footer.value === false ? 'false' : 'true')}">
            <div class="lm-calendar-time" data-visible="${() => (props.time.value ? 'true' : 'false')}">
                <select class="lm-calendar-control" bind="${hour}">${HOURS.map(
                    (h) => html`<option value="${h}">${two(h)}</option>`
                )}</select>
                <span>:</span>
                <select class="lm-calendar-control" bind="${minute}">${MINUTES.map(
                    (i) => html`<option value="${i}">${two(i)}</option>`
                )}</select>
            </div>
            <div class="lm-calendar-update">
                <button type="button" class="lm-calendar-ripple" onclick="${update}">${() =>
                    translate('Update')}</button>
            </div>
        </div>
    </div>`;

    return html`<div class="lm-calendar"
        data-type="${() => kind()}"
        data-grid="${() => (props.grid.value ? 'true' : false)}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}"
        name="${() => (props.name.value as string) || false}"
        ref="${(el: HTMLElement) => (root = el)}"
        onkeydown="${onKey}"
        onfocusout="${onFocusOut}">
        ${() =>
            inline() || adopted
                ? '' // adopted: the host's element IS the input
                : html`<input type="text" class="lm-calendar-input" bind="${display}"
                      placeholder="${() => (props.placeholder.value as string) || false}"
                      onclick="${() => wired() && open()}"
                      onfocusin="${() => wired() && open()}"
                      oninput="${(e: Event) => wired() && onType(e)}" />`}
        ${() =>
            inline()
                ? panelView()
                : html`<${Modal} ref="${(a: { open(): void; close(): void }) => (modalApi = a)}"
                      header="${false}" focus="${false}" responsive="${false}" autoadjust
                      position="${panelPosition}"
                      top="${anchorTop}" left="${anchorLeft}" width="${panelWidth}">
                      ${panelView()}
                  </${Modal}>`}
    </div>`;
});

export default Calendar;
