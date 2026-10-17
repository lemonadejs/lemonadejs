/**
 * <Gantt /> — a simple, beautiful gantt chart designed to be EMBEDDED:
 * bars are positioned in PERCENTAGES of a date range, never pixels, so
 * any number of instances sharing the same start/end stay perfectly
 * aligned regardless of container width. That makes the table case
 * trivial — one headerless <Gantt> per row div, same range, done:
 *
 *   <tr><td>Design</td><td><div><!-- <Gantt header=false ...> --></div></td></tr>
 *   <tr><td>Build</td> <td><div><!-- <Gantt header=false ...> --></div></td></tr>
 *
 * Standalone mode adds the timeline header (months + days), weekend
 * shading and the today line — same engine, same percentages.
 *
 *   - tasks { label, start, end, color, progress, type, readonly }
 *   - milestones: type 'milestone' renders a diamond (explicit only — a
 *     task collapsed to one day stays a narrow, still-resizable bar)
 *   - editable: drag the bar to move, drag the edges to resize — day
 *     snapping, live preview, Escape cancels mid-drag, onchange(task,
 *     start, end) fires ONLY on commit and mutates YOUR task object
 *   - keyboard: bars are focusable buttons (label + dates in the
 *     accessible name); Ctrl/Alt+Arrow moves a snap step, Shift+Arrow
 *     resizes the end — the SAME commit path (and onchange) as drag.
 *     Enter/Space activates (onclick); the header pans with arrows
 *   - the viewport: drag the header to pan, Shift + mouse wheel over the
 *     timeline to zoom around the date under the cursor; both report
 *     through onrangechange(start, end, daywidth) and outlive data
 *     refreshes (a data change never snaps the timeline back; a change
 *     of the start/end props always wins)
 *   - daywidth: a fixed slot width in px — the chart grows with the
 *     range instead of fitting the container (scroll the container);
 *     zoom then steps the slot width in whole pixels. 0 fits the width.
 *   - dates are 'YYYY-MM-DD' strings, all math in LOCAL time
 *   - data BY REFERENCE: mutate + touch() re-renders
 *
 * TWO MOUNTING MODES:
 *   1. In a div: the full chart — header timeline + one row per task
 *      (non-headless by default).
 *   2. OVER A TABLE: set `table` to a CSS selector — the gantt injects
 *      one lane cell per tbody row (task i ↔ row i), %-aligned, drag
 *      editing, link handles and the dependency connectors included
 *      (drawn on an overlay over the table, clipped to the lane column),
 *      and renders its own element as the timeline header you place
 *      above/beside the table. The lane width is the cell's: the host
 *      sizes the column. Unmount removes every injected cell and the
 *      overlay — the table returns to its original state.
 */

import { component, html } from 'lemonadejs';

export interface GanttTask {
    id?: string | number;
    label?: string;
    start: string;            // 'YYYY-MM-DD'
    end: string;              // 'YYYY-MM-DD' (inclusive)
    color?: string;
    progress?: number;        // 0-100 fill
    type?: 'task' | 'milestone';
    readonly?: boolean;
    /** ids of predecessor tasks; draws a finish→start link arrow from each */
    dependencies?: (string | number)[];
    [key: string]: unknown;
}

const DAY = 86400000;
const EDGE = 8; // px hit zone for the resize handles

/** 'YYYY-MM-DD' → local ms (noon, immune to DST edges) */
const toMs = (s: string): number => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 12).getTime();
};

const toIso = (ms: number): string => {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A connector ends in an arrowhead a few px short of the successor bar:
// the line stops at the arrowhead's base. Same values as the stylesheet
// (.lm-gantt-link-arrow: 6px long, 3px gap)
const ARROW_LEN = 6;
const ARROW_GAP = 3;
// Table mode draws in px: the horizontal stub out of the predecessor runs
// past the link handle (11px dot over the bar edge) so the line leaves it
const STUB_PX = 14;

// Zoom bounds: the window in days (fit mode) and the slot in px (daywidth mode)
const ZOOM_MIN_DAYS = 7;
const ZOOM_MAX_DAYS = 3660;
const ZOOM_MIN_PX = 2;
const ZOOM_MAX_PX = 64;

const SVG = 'http://www.w3.org/2000/svg';

const round2 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * A finish→start connector from (x1, y1) to (x2, y2), in whatever unit
 * the caller draws in. Forward links take one drop right after the
 * predecessor; a BACK-link (the successor starts before the predecessor
 * ends) routes its horizontal leg through `gapY`, between the rows, so
 * the line never crosses the successor's bar. `tail` is the arrowhead
 * length plus its gap: the line stops at the arrowhead's base.
 */
const elbow = (x1: number, y1: number, x2: number, y2: number, stub: number, tail: number, gapY: number): string =>
    x2 - stub >= x1 + stub
        ? 'M ' + round2(x1) + ' ' + y1 + ' H ' + round2(x1 + stub) + ' V ' + y2 + ' H ' + round2(x2 - tail)
        : 'M ' + round2(x1) + ' ' + y1 + ' H ' + round2(x1 + stub) + ' V ' + gapY +
          ' H ' + round2(x2 - tail - stub) + ' V ' + y2 + ' H ' + round2(x2 - tail);

let uid = 0; // unique suffix per instance for the visually hidden keyboard hint id

export const Gantt = component('gantt', {
    data: Array,                  // GanttTask[] BY REFERENCE (mutate + touch())
    start: '',                    // viewport start (default: earliest task - 2 days)
    end: '',                      // viewport end (default: latest task + 2 days)
    header: true,                 // timeline header (months + day ticks)
    grid: true,                   // weekend shading + day grid (standalone look)
    rowheight: 36,
    today: true,                  // the today line
    editable: false,              // drag to move, edges to resize
    readonly: false,              // host override: view-only regardless of `editable` (clicks/pan still work)
    disabled: false,              // blocks ALL interaction (clicks, pan, edits) and dims the chart
    snap: 1,                      // drag snapping, in days
    zoom: true,                   // Shift + mouse wheel over the timeline zooms around the cursor
    daywidth: 0,                  // px per day slot: the chart grows with the range (0 = fit the container)
    table: '',                    // CSS selector: inject lanes into that table's rows
    onchange: Function,           // (task, start, end) on drag commit
    onclick: Function,            // (task, event)
    onlink: Function,             // (fromTask, toTask) a dependency was drawn
    onunlink: Function,           // (fromTask, toTask) a dependency was removed
    onrangechange: Function,      // (start, end, daywidth) the viewport moved: pan, keyboard or zoom
    api: { getRange: Function, setRange: Function },
}, (props, { state, onMount, onUnmount, listen }) => {
    const tasks = () => (props.data.peek() as GanttTask[]) || [];

    // The edit gate: `editable` opts in, `readonly`/`disabled` override the
    // host's opt-in (e.g. a jss worksheet flipped to readonly). Tracked and
    // peek flavors — templates need the reads tracked, gestures do not.
    const canEdit = () => props.editable.value && !props.readonly.value && !props.disabled.value;
    const canEditPeek = () => (props.editable.peek() as boolean) && !props.readonly.peek() && !props.disabled.peek();
    const interactive = () => !props.disabled.peek();

    // Every focusable bar points its aria-describedby at ONE visually
    // hidden hint (rendered off the root, so table-mode lanes reach it
    // too) — the keyboard instructions the title tooltips can't convey
    const hintId = 'lm-gantt-hint-' + ++uid;

    // ---- the range: explicit props win; otherwise fit the data
    const range = state<{ from: number; to: number }>({ from: 0, to: 1 });
    // Drag preview: task index -> { from, to } in ms, shown live
    const preview = state<{ index: number; from: number; to: number } | null>(null);
    // Live dependency-link drag: source index, the anchor on the bar's right
    // edge and the cursor — all in CLIENT px, so both modes draw it
    const linking = state<{ index: number; sx: number; sy: number; cx: number; cy: number } | null>(null);
    // The slot width in px (daywidth mode); zoom steps it, the prop resets it
    const dayPx = state<number>((props.daywidth.peek() as number) || 0);
    onMount(() => props.daywidth.subscribe(() => { dayPx.value = (props.daywidth.peek() as number) || 0; }));

    const computeRange = () => {
        const list = tasks();
        let from = props.start.peek() ? toMs(props.start.peek() as string) : NaN;
        let to = props.end.peek() ? toMs(props.end.peek() as string) : NaN;
        if (Number.isNaN(from) || Number.isNaN(to)) {
            let lo = Infinity;
            let hi = -Infinity;
            for (const t of list) {
                if (!t) continue;
                lo = Math.min(lo, toMs(t.start));
                hi = Math.max(hi, toMs(t.end || t.start));
            }
            if (lo === Infinity) {
                lo = hi = toMs(toIso(Date.now()));
            }
            if (Number.isNaN(from)) {
                from = lo - 2 * DAY;
            }
            if (Number.isNaN(to)) {
                to = hi + 2 * DAY;
            }
        }
        range.value = { from, to: Math.max(to, from + DAY) };
    };

    // No version counter: the rows binding tracks props.data directly
    // (touch() and assignment both re-run it), and computeRange always
    // ASSIGNS range a fresh object — so every refresh notifies the range
    // subscribers (the table lanes) even when the bounds are unchanged
    //
    // Internal edits (drag commit, link/unlink) must NOT re-fit the
    // viewport: the user is looking at the spot they just edited, and a
    // drop that shifts the whole timeline reads as a scroll jump. The
    // flag makes the next notification keep the current bounds — still
    // assigned fresh, so the lanes pipeline flows as always.
    let keepViewport = false;
    // The viewport the USER set (pan, keyboard, zoom, setRange) outlives
    // data refreshes too: a host rebuilding its task list must not snap
    // the timeline back to the start/end props. A change of those props
    // is the host speaking, and always wins.
    let userRange = false;
    const refresh = (fromProps: boolean) => {
        // A data change mid-gesture cancels the drag: its captured geometry
        // (origin, ms-per-px, task) is stale. No-op after our own commits —
        // the gesture has already been released by then.
        releaseGesture?.();
        if (keepViewport || (userRange && !fromProps)) {
            keepViewport = false;
            range.value = { ...range.value };
        } else {
            userRange = false;
            computeRange();
        }
        preview.value = null;
    };

    /** The start/end props changed. The host echoing our own onrangechange
     *  (the values it was just told) is not a change: nothing to do. */
    const propsChanged = () => {
        const s = props.start.peek() as string;
        const e = props.end.peek() as string;
        if (s && e && toMs(s) === range.value.from && toMs(e) === range.value.to) {
            return;
        }
        refresh(true);
    };

    /** touch() for edits made BY this component: viewport stays put */
    const touchKeepingViewport = () => {
        keepViewport = true;
        props.data.touch();
    };

    onMount(() => props.data.subscribe(() => refresh(false)));
    onMount(() => props.start.subscribe(propsChanged));
    onMount(() => props.end.subscribe(propsChanged));
    computeRange();

    const totalDays = () => Math.round((range.value.to - range.value.from) / DAY) + 1;

    /** The geometry heart: date → % of the range (bars never use px) */
    const pct = (ms: number): number => {
        const { from, to } = range.value;
        return ((ms - from) / (to - from + DAY)) * 100;
    };
    const widthPct = (fromMs: number, toMs_: number): number =>
        ((toMs_ - fromMs + DAY) / (range.value.to - range.value.from + DAY)) * 100;

    /** daywidth mode: the chart's own width in px, or '' to fit the container */
    const fixedWidth = (): string => (dayPx.value > 0 ? totalDays() * dayPx.value + 'px' : '');

    /** A viewport change made by the user: pan, keyboard, zoom */
    const setUserRange = (from: number, to: number) => {
        userRange = true;
        range.value = { from, to };
        props.onrangechange?.(toIso(from), toIso(to), dayPx.peek());
    };

    // Standalone mode: the rows width, so the px arrow tail becomes a %
    // of the x axis (the links re-run when the chart is resized)
    const rowsWidth = state(0);
    let rowsEl: HTMLElement | null = null;
    let widthObserver: ResizeObserver | null = null;
    const watchWidth = (el: HTMLElement) => {
        rowsEl = el;
        rowsWidth.value = el.clientWidth;
        if (typeof ResizeObserver !== 'undefined' && !widthObserver) {
            widthObserver = new ResizeObserver(() => {
                rowsWidth.value = el.clientWidth;
            });
            widthObserver.observe(el);
        }
    };
    onUnmount(() => widthObserver?.disconnect());

    /**
     * Dependency links — finish→start connectors. For each task carrying
     * `dependencies: [id,...]`, draw an elbow from the predecessor's RIGHT
     * edge to this task's LEFT edge. x is in % (the bar coordinate space),
     * y in px (row centres); the SVG stretches on x with a non-scaling
     * stroke so the lines stay crisp at any width — no resize listener.
     *
     * Reads `preview` so the connectors track the live drag (mousemove),
     * not just the committed start/end on drop: the dragged task uses its
     * preview span, everything else its stored dates.
     */
    const links = (): { d: string; ax: number; ay: number; ti: number; sid: string | number }[] => {
        const tasks = (props.data.value as GanttTask[]) || [];
        const rh = props.rowheight.value;
        const p = preview.value; // tracked read → re-runs on each drag move
        const span = (t: GanttTask, i: number): { from: number; to: number } =>
            p && p.index === i
                ? { from: p.from, to: p.to }
                : { from: toMs(t.start), to: toMs(t.end || t.start) };
        const byId = new Map<string | number, number>();
        tasks.forEach((t, i) => {
            if (t && t.id != null) byId.set(t.id, i);
        });
        const out: { d: string; ax: number; ay: number; ti: number; sid: string | number }[] = [];
        // The arrowhead and its gap, in % of the axis (0 before the first layout)
        const tail = rowsWidth.value ? ((ARROW_LEN + ARROW_GAP) * 100) / rowsWidth.value : 0;
        tasks.forEach((b, ib) => {
            const deps = b && b.dependencies;
            if (!Array.isArray(deps) || !deps.length) {
                return;
            }
            const bx = pct(span(b, ib).from);
            const by = ib * rh + rh / 2;
            deps.forEach((depId) => {
                const ia = byId.get(depId);
                if (ia == null || ia === ib) {
                    return;
                }
                const as = span(tasks[ia], ia);
                const aEndX = pct(as.from) + widthPct(as.from, as.to);
                const ay = ia * rh + rh / 2;
                // the horizontal leg of a back-link runs through the row gap
                const gapY = ib > ia ? ib * rh : (ib + 1) * rh;
                out.push({ d: elbow(aEndX, ay, bx, by, 1.5, tail, gapY), ax: round2(bx), ay: by, ti: ib, sid: depId });
            });
        });
        return out;
    };

    // ---- drag: ONE in-flight gesture, listeners armed per drag via
    // listen() (off() is idempotent and self-pruning). The unmount hook
    // cancels a mid-drag gesture so the live preview state resets
    let releaseGesture: (() => void) | null = null;
    onUnmount(() => releaseGesture?.());

    const track = (move: (e: MouseEvent) => void, done: (commit: boolean) => void) => {
        releaseGesture?.();
        const finish = (commit: boolean) => {
            offMove();
            offUp();
            offKey();
            releaseGesture = null;
            done(commit);
        };
        const offMove = listen<MouseEvent>(document, 'mousemove', move);
        const offUp = listen(document, 'mouseup', () => finish(true));
        // Escape cancels mid-drag: the keydown listener is part of the gesture
        const offKey = listen<KeyboardEvent>(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                finish(false);
            }
        });
        releaseGesture = () => finish(false);
    };

    /**
     * The ONE commit path — mouse drops and keyboard edits both land
     * here: mutate the host's task object, keep the viewport put and
     * fire onchange with the committed dates.
     */
    const commitSpan = (task: GanttTask, from: number, to: number) => {
        task.start = toIso(from);
        task.end = toIso(to);
        touchKeepingViewport();
        props.onchange?.(
            task,
            task.start,
            task.end
        );
    };

    const startDrag = (e: MouseEvent, index: number, task: GanttTask, el: HTMLElement) => {
        if (!canEditPeek() || task.readonly) {
            return;
        }
        e.preventDefault();
        const area = el.closest('.lm-gantt-rows') as HTMLElement;
        const areaRect = area.getBoundingClientRect();
        const barRect = el.getBoundingClientRect();
        const snapMs = Math.max(1, (props.snap.value as number) || 1) * DAY;
        const msPerPx = (range.value.to - range.value.from + DAY) / (areaRect.width || 1);

        // Only explicit milestones are move-only. A one-day BAR keeps its
        // resize affordance — otherwise shrinking a bar to a single day
        // would trap it (no edge to grab to widen it back). On a bar too
        // narrow for three zones, the right edge wins (the natural
        // "widen it again" gesture) and the rest moves.
        const mode: 'move' | 'left' | 'right' =
            task.type === 'milestone'
                ? 'move'
                : barRect.width < EDGE * 3
                  ? barRect.right - e.clientX < EDGE
                      ? 'right'
                      : 'move'
                  : e.clientX - barRect.left < EDGE
                    ? 'left'
                    : barRect.right - e.clientX < EDGE
                      ? 'right'
                      : 'move';

        const origin = e.clientX;
        const from0 = toMs(task.start);
        const to0 = toMs(task.end || task.start);

        track(
            (ev) => {
                const deltaMs = Math.round(((ev.clientX - origin) * msPerPx) / snapMs) * snapMs;
                let from = from0;
                let to = to0;
                if (mode === 'move') {
                    from = from0 + deltaMs;
                    to = to0 + deltaMs;
                } else if (mode === 'left') {
                    from = Math.min(from0 + deltaMs, to0);
                } else {
                    to = Math.max(to0 + deltaMs, from0);
                }
                preview.value = { index, from, to };
            },
            (commit) => {
                const p = preview.value;
                preview.value = null;
                if (!commit || !p || (p.from === from0 && p.to === to0)) {
                    return;
                }
                commitSpan(task, p.from, p.to);
            }
        );
    };

    /**
     * Keyboard editing on a focused bar — the non-drag path (WCAG 2.1.1).
     * Ctrl/Alt+Arrow moves the whole span one snap step, Shift+Arrow
     * resizes the END edge (clamped at the start; milestones move only),
     * Enter/Space activates (onclick). Commits through commitSpan — the
     * exact same mutation + onchange as a mouse drop.
     */
    const keyEdit = (e: KeyboardEvent, index: number, task: GanttTask, el: HTMLElement) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (interactive()) {
                e.preventDefault();
                props.onclick?.(task, e);
            }
            return;
        }
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
            return;
        }
        const resize = e.shiftKey && task.type !== 'milestone';
        const move = e.ctrlKey || e.metaKey || e.altKey;
        if ((!move && !resize) || !canEditPeek() || task.readonly) {
            return; // plain arrows keep their native meaning (scroll, caret...)
        }
        e.preventDefault();
        const step = (e.key === 'ArrowRight' ? 1 : -1) * Math.max(1, (props.snap.peek() as number) || 1) * DAY;
        const from0 = toMs(task.start);
        const to0 = toMs(task.end || task.start);
        const from = resize ? from0 : from0 + step;
        const to = resize ? Math.max(to0 + step, from0) : to0 + step;
        if (from === from0 && to === to0) {
            return;
        }
        // The commit re-renders the row, replacing the bar element:
        // capture the container FIRST, then hand focus to the fresh bar
        const area = el.closest('.lm-gantt-rows') as HTMLElement | null;
        commitSpan(task, from, to);
        (area?.querySelector('[data-index="' + index + '"]') as HTMLElement | null)?.focus();
    };

    /**
     * Draw a dependency by dragging from a predecessor's link handle to the
     * task that should depend on it. Uses the same `track()` gesture; the
     * target is whatever bar the mouse is over on release. Geometry in
     * client px: the same gesture serves the rows and the table lanes.
     */
    const startLink = (e: MouseEvent, index: number, bar: HTMLElement) => {
        if (!canEditPeek()) {
            return;
        }
        const src = tasks()[index];
        if (!src || src.id == null) {
            return; // a predecessor must have an id to be referenced
        }
        e.preventDefault();
        e.stopPropagation(); // don't also start a move/resize drag on the bar
        const r = bar.getBoundingClientRect();
        const sx = r.right;
        const sy = r.top + r.height / 2;
        let lastX = e.clientX;
        let lastY = e.clientY;
        track(
            (ev) => {
                lastX = ev.clientX;
                lastY = ev.clientY;
                linking.value = { index, sx, sy, cx: ev.clientX, cy: ev.clientY };
            },
            (commit) => {
                linking.value = null;
                if (!commit) {
                    return;
                }
                const hit = (document.elementFromPoint(lastX, lastY) as Element | null)?.closest(
                    '.lm-gantt-bar, .lm-gantt-milestone'
                ) as HTMLElement | null;
                const ti = hit && hit.dataset.index != null ? Number(hit.dataset.index) : -1;
                if (ti < 0 || ti === index) {
                    return;
                }
                const target = tasks()[ti];
                if (!target) {
                    return;
                }
                const deps = Array.isArray(target.dependencies) ? target.dependencies.slice() : [];
                const srcDeps = Array.isArray(src.dependencies) ? src.dependencies : [];
                // skip duplicates and a direct A→B / B→A reverse loop
                if (deps.includes(src.id!) || srcDeps.includes(target.id as string | number)) {
                    return;
                }
                target.dependencies = [...deps, src.id!];
                touchKeepingViewport();
                props.onlink?.(src, target);
            }
        );
    };

    /**
     * Pan the viewport by dragging the timeline header left/right — shifts
     * the whole range by the cursor delta (great for large schedules). The
     * range drives every % binding, so the bars/grid/today all follow.
     * onrangechange reports the window once, on release.
     */
    const panStart = (e: MouseEvent) => {
        if (!interactive()) {
            return;
        }
        const header = e.currentTarget as HTMLElement;
        const width = header.getBoundingClientRect().width || 1;
        const msPerPx = (range.value.to - range.value.from + DAY) / width;
        const origin = e.clientX;
        const from0 = range.value.from;
        const to0 = range.value.to;
        e.preventDefault();
        header.classList.add('lm-gantt-panning');
        track(
            (ev) => {
                const deltaMs = Math.round((ev.clientX - origin) * msPerPx);
                userRange = true;
                range.value = { from: from0 - deltaMs, to: to0 - deltaMs };
            },
            () => {
                header.classList.remove('lm-gantt-panning');
                if (range.value.from !== from0) {
                    props.onrangechange?.(toIso(range.value.from), toIso(range.value.to), dayPx.peek());
                }
            }
        );
    };

    /** Keyboard pan — the header is focusable; arrows shift the viewport
     *  one day (Shift: one week), mirroring the drag-to-pan gesture. */
    const panKey = (e: KeyboardEvent) => {
        if (!interactive() || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) {
            return;
        }
        e.preventDefault();
        const step = (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 7 : 1) * DAY;
        setUserRange(range.value.from + step, range.value.to + step);
    };

    /**
     * Shift + wheel over the timeline (the header, or a lane in table
     * mode): zoom around the date under the cursor, which stays under the
     * cursor. Fit mode scales the number of days in the window; daywidth
     * mode steps the slot width in whole px and keeps the window's px
     * width, so the day count follows. Shift, because a plain wheel over
     * a chart in a page must keep scrolling the page.
     */
    const wheel = (e: WheelEvent, el: HTMLElement) => {
        if (!props.zoom.peek() || !e.shiftKey || !interactive()) {
            return;
        }
        // With shift held, browsers report the wheel as a horizontal delta
        const delta = e.deltaY || e.deltaX;
        if (!delta) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / (rect.width || 1)));
        const { from } = range.value;
        const days = totalDays();
        const zoomIn = delta < 0;
        let nextDays: number;
        const px = dayPx.peek();
        if (px > 0) {
            let next = Math.round(px * (zoomIn ? 1.25 : 0.8));
            if (next === px) {
                next += zoomIn ? 1 : -1;
            }
            next = Math.min(ZOOM_MAX_PX, Math.max(ZOOM_MIN_PX, next));
            if (next === px) {
                return;
            }
            nextDays = Math.max(ZOOM_MIN_DAYS, Math.round((days * px) / next));
            dayPx.value = next;
        } else {
            nextDays = Math.round(days * (zoomIn ? 0.8 : 1.25));
            if (nextDays === days) {
                nextDays += zoomIn ? -1 : 1;
            }
            nextDays = Math.min(ZOOM_MAX_DAYS, Math.max(ZOOM_MIN_DAYS, nextDays));
            if (nextDays === days) {
                return;
            }
        }
        // The date under the cursor, kept there; the window snaps to whole days
        const anchor = from + frac * days * DAY;
        const newFrom = toMs(toIso(anchor - frac * nextDays * DAY));
        setUserRange(newFrom, newFrom + (nextDays - 1) * DAY);
    };

    /** Remove dependency `sourceId` from the task at `targetIndex`. */
    const removeLink = (targetIndex: number, sourceId: string | number) => {
        if (!canEditPeek()) {
            return;
        }
        const target = tasks()[targetIndex];
        if (!target || !Array.isArray(target.dependencies)) {
            return;
        }
        const src = tasks().find((t) => t && t.id === sourceId);
        target.dependencies = target.dependencies.filter((d) => d !== sourceId);
        touchKeepingViewport();
        props.onunlink?.(src, target);
    };

    props.ref?.({
        getRange: () => ({ start: toIso(range.value.from), end: toIso(range.value.to), daywidth: dayPx.peek() }),
        setRange: (start: string, end: string) => {
            // The range assignment re-runs every % binding and the lanes;
            // a host-set window is kept through data refreshes like a pan
            userRange = true;
            range.value = { from: toMs(start), to: Math.max(toMs(end), toMs(start) + DAY) };
        },
    });

    // ---- TABLE MODE: inject one %-aligned lane per tbody row.
    // Imperative by necessity (divs cannot be children of <table>), but
    // contained: cells are tagged, lanes rebuilt through the same
    // refresh pipeline, and unmount removes everything we created.
    let injectedCells: HTMLTableCellElement[] = [];

    const tableEl = (): HTMLTableElement | null => {
        const selector = props.table.peek() as string;
        return selector ? (document.querySelector(selector) as HTMLTableElement | null) : null;
    };

    /** The task behind a lane bar: its data-index is the ROW index, read at
     *  event time — the host may insert, delete or reorder rows under the
     *  lanes, and the cells move with their rows */
    const laneTask = (e: Event): { bar: HTMLElement; index: number; task: GanttTask } | null => {
        const bar = (e.target as Element).closest('.lm-gantt-bar, .lm-gantt-milestone') as HTMLElement | null;
        if (!bar || bar.dataset.index == null) {
            return null;
        }
        const index = Number(bar.dataset.index);
        const task = tasks()[index];
        return task ? { bar, index, task } : null;
    };

    const renderLanes = () => {
        const table = tableEl();
        if (!table) {
            return;
        }
        const bodyRows = [...table.querySelectorAll(':scope > tbody > tr')] as HTMLTableRowElement[];
        const list = tasks();
        // Rows the host dropped took their lanes with them
        injectedCells = injectedCells.filter((cell) => cell.isConnected);
        bodyRows.forEach((tr, index) => {
            let cell = tr.querySelector(':scope > td.lm-gantt-cell') as HTMLTableCellElement | null;
            if (!cell) {
                cell = document.createElement('td');
                cell.className = 'lm-gantt-cell';
                tr.appendChild(cell);
                injectedCells.push(cell);
            }
            let lane = cell.firstElementChild as HTMLElement | null;
            if (!lane || !lane.classList.contains('lm-gantt-lane')) {
                lane = document.createElement('div');
                lane.className = 'lm-gantt-lane lm-gantt-rows';
                cell.textContent = '';
                cell.appendChild(lane);
                // Handlers DELEGATE from the persistent lane via listen()
                // (one set per created lane, auto-removed on unmount):
                // bars are rebuilt per refresh, so per-bar listeners would
                // either leak registrations or need manual release
                listen<MouseEvent>(lane, 'mousedown', (e) => {
                    const hit = laneTask(e);
                    if (hit) {
                        startDrag(e, hit.index, hit.task, hit.bar);
                    }
                });
                listen<MouseEvent>(lane, 'click', (e) => {
                    const hit = laneTask(e);
                    if (hit && interactive()) {
                        props.onclick?.(hit.task, e);
                    }
                });
                listen<KeyboardEvent>(lane, 'keydown', (e) => {
                    const hit = laneTask(e);
                    if (hit) {
                        keyEdit(e, hit.index, hit.task, hit.bar);
                    }
                });
                listen<WheelEvent>(lane, 'wheel', (e) => wheel(e, lane as HTMLElement), { passive: false });
            }
            lane.textContent = '';
            // The day grid lines and the today line come from the stylesheet
            lane.style.setProperty('--lm-gantt-days', String(totalDays()));
            const today = props.today.peek() ? todayLeft() : null;
            if (today === null) {
                lane.style.removeProperty('--lm-gantt-today-left');
            } else {
                lane.style.setProperty('--lm-gantt-today-left', today + '%');
            }
            const task = list[index];
            if (task) {
                lane.appendChild(buildLaneBar(task, index));
            }
        });
        drawTableLinks(table);
    };

    /** A lane bar: same % math and drag editing as the declarative bars */
    const buildLaneBar = (task: GanttTask, index: number): HTMLElement => {
        const p = preview.peek();
        const dragging = p && p.index === index;
        const from = dragging ? p!.from : toMs(task.start);
        const to = dragging ? p!.to : toMs(task.end || task.start);
        const milestone = task.type === 'milestone';
        const el = document.createElement('div');
        if (milestone) {
            el.className = 'lm-gantt-milestone' + (dragging ? ' lm-gantt-dragging' : '');
            el.style.left = round2(pct(from) + widthPct(from, from) / 2) + '%';
        } else {
            el.className =
                'lm-gantt-bar' +
                (canEditPeek() && !task.readonly ? ' lm-gantt-editable' : '') +
                (dragging ? ' lm-gantt-dragging' : '');
            el.style.left = round2(pct(from)) + '%';
            el.style.width = round2(widthPct(from, to)) + '%';
            if (typeof task.progress === 'number') {
                const fill = document.createElement('div');
                fill.className = 'lm-gantt-progress';
                fill.style.width = Math.min(100, Math.max(0, task.progress)) + '%';
                el.appendChild(fill);
            }
            const label = document.createElement('span');
            label.className = 'lm-gantt-label';
            label.textContent = task.label || '';
            el.appendChild(label);
            // The link handle, like the declarative bars: drag it onto another
            // task to draw a dependency. Its own listener stops the lane's
            // delegated mousedown from starting a move; the element is
            // rebuilt with the bar, so the listener goes with it
            if (canEditPeek() && !task.readonly && task.id != null) {
                const handle = document.createElement('div');
                handle.className = 'lm-gantt-link-handle';
                handle.title = 'Drag to a task to link';
                handle.addEventListener('mousedown', (e) => startLink(e, index, el));
                el.appendChild(handle);
            }
        }
        if (task.color) {
            el.style.background = task.color;
        }
        el.title = (task.label || '') + ' · ' + toIso(from) + (milestone ? '' : ' → ' + toIso(to));
        // Same accessibility contract as the declarative bars: focusable
        // button, dates in the name, the keyboard hint when editable
        el.dataset.index = String(index);
        el.setAttribute('role', 'button');
        if (interactive()) {
            el.tabIndex = 0;
        }
        el.setAttribute(
            'aria-label',
            milestone
                ? (task.label || 'Milestone') + ', milestone, ' + toIso(from)
                : (task.label || 'Task') + ', ' + toIso(from) + ' to ' + toIso(to)
        );
        if (canEditPeek() && !task.readonly) {
            el.setAttribute('aria-describedby', hintId);
        }
        // No listeners here: mousedown/click/keydown delegate from the lane
        return el;
    };

    /**
     * Table mode connectors. The bars live in separate row cells, so the
     * links are drawn on an overlay over the table — in px, measured from
     * the lane bars — placed in the table's parent (made the positioning
     * context when static) and clipped to the lane column. Two layers:
     * the lines sit UNDER the bars (an elbow never paints across a bar
     * face; the arrowheads land just outside the target bar) and the live
     * link preview ABOVE them. Redrawn with the lanes (range, data, drag
     * preview) and when the table changes size (host row/column resizes).
     */
    let overlay: { lines: HTMLElement; top: HTMLElement; host: HTMLElement } | null = null;
    let tableObserver: ResizeObserver | null = null;

    const ensureOverlay = (table: HTMLTableElement) => {
        if (overlay) {
            return overlay;
        }
        const host = table.parentElement;
        if (!host) {
            return null;
        }
        const position = getComputedStyle(host).position;
        if (!position || position === 'static') {
            host.style.position = 'relative';
        }
        const lines = document.createElement('div');
        lines.className = 'lm-gantt-link-layer lm-gantt-table-links';
        const top = document.createElement('div');
        top.className = 'lm-gantt-link-layer lm-gantt-table-temp';
        host.appendChild(lines);
        host.appendChild(top);
        if (typeof ResizeObserver !== 'undefined') {
            tableObserver = new ResizeObserver(() => {
                const t = tableEl();
                if (t) {
                    drawTableLinks(t);
                }
            });
            tableObserver.observe(table);
        }
        overlay = { lines, top, host };
        return overlay;
    };

    const removeOverlay = () => {
        tableObserver?.disconnect();
        tableObserver = null;
        if (overlay) {
            overlay.lines.remove();
            overlay.top.remove();
            overlay = null;
        }
    };

    const svgEl = (tag: string, className: string): SVGElement => {
        const el = document.createElementNS(SVG, tag);
        el.setAttribute('class', className);
        return el;
    };

    const drawTableLinks = (table: HTMLTableElement) => {
        const list = tasks();
        const lk = linking.peek();
        const hasLinks = list.some((t) => t && Array.isArray(t.dependencies) && t.dependencies.length > 0);
        if (!hasLinks && !lk) {
            if (overlay) {
                overlay.lines.textContent = '';
                overlay.top.textContent = '';
            }
            return;
        }
        const o = ensureOverlay(table);
        if (!o) {
            return;
        }
        const lanes = table.querySelectorAll(':scope > tbody > tr > td.lm-gantt-cell');
        const tRect = table.getBoundingClientRect();
        const hRect = o.host.getBoundingClientRect();
        // Clipped to the LANE COLUMN: bar rects ignore the lane cells'
        // overflow clipping, so a bar outside the date viewport would
        // otherwise paint connectors over the other columns
        const laneRect = lanes.length ? lanes[0].getBoundingClientRect() : tRect;
        // The layers go on WHOLE screen pixels over the table's corner. The
        // offset is placed, then MEASURED and corrected: the host's border,
        // padding and scroll position all shift where an absolute child
        // lands, and a fractional offset would blur every line inside
        const screenLeft = Math.round(laneRect.left);
        const screenTop = Math.round(tRect.top);
        let left = screenLeft - hRect.left + o.host.scrollLeft;
        let top = screenTop - hRect.top + o.host.scrollTop;
        const place = () => {
            [o.lines, o.top].forEach((layer) => {
                layer.style.left = left + 'px';
                layer.style.top = top + 'px';
                layer.style.width = Math.round(laneRect.width) + 'px';
                layer.style.height = Math.round(tRect.height) + 'px';
            });
        };
        place();
        const landed = o.lines.getBoundingClientRect();
        const dx = Math.round(landed.left - screenLeft);
        const dy = Math.round(landed.top - screenTop);
        if (dx || dy) {
            left -= dx;
            top -= dy;
            place();
        }
        o.lines.textContent = '';
        o.top.textContent = '';
        const barOf = (y: number) => lanes[y] && (lanes[y].querySelector('.lm-gantt-bar, .lm-gantt-milestone') as HTMLElement | null);
        // Positions land on a half pixel: the 1.5px stroke centred there
        // fills one pixel row, and the arrowhead, centred by its -50%
        // transform, lands on whole pixels
        const snap = (v: number) => Math.round(v - 0.5) + 0.5;
        const X = (v: number) => snap(v - screenLeft);
        const Y = (v: number) => snap(v - screenTop);

        const svg = svgEl('svg', 'lm-gantt-links');
        o.lines.appendChild(svg);
        const byId = new Map<string | number, number>();
        list.forEach((t, i) => {
            if (t && t.id != null) byId.set(t.id, i);
        });
        const editable = canEditPeek();
        list.forEach((b, ib) => {
            const deps = b && b.dependencies;
            if (!Array.isArray(deps) || !deps.length) {
                return;
            }
            const toBar = barOf(ib);
            if (!toBar) {
                return;
            }
            const tr = toBar.getBoundingClientRect();
            deps.forEach((depId) => {
                const ia = byId.get(depId);
                const fromBar = ia != null && ia !== ib ? barOf(ia) : null;
                if (!fromBar) {
                    return;
                }
                const fr = fromBar.getBoundingClientRect();
                const x1 = X(fr.right);
                const y1 = Y(fr.top + fr.height / 2);
                const x2 = X(tr.left);
                const y2 = Y(tr.top + tr.height / 2);
                // a back-link's horizontal leg runs midway between the two bars
                const gapY = ib > ia! ? Y((fr.bottom + tr.top) / 2) : Y((tr.bottom + fr.top) / 2);
                const d = elbow(x1, y1, x2, y2, STUB_PX, ARROW_LEN + ARROW_GAP, gapY);

                // The visible line and its hit line share a group: the hover
                // highlight lands on the visible line (stylesheet, :has) while
                // the hit line keeps its width under the cursor
                const pair = svgEl('g', 'lm-gantt-link-pair');
                svg.appendChild(pair);
                const path = svgEl('path', 'lm-gantt-link');
                path.setAttribute('d', d);
                pair.appendChild(path);
                if (editable) {
                    const hit = svgEl('path', 'lm-gantt-link-hit');
                    hit.setAttribute('d', d);
                    hit.setAttribute('role', 'button');
                    hit.setAttribute('tabindex', '0');
                    const name = 'Remove the dependency from ' + (list[ia!]?.label || depId) + ' to ' + (b.label || 'task ' + (ib + 1));
                    hit.setAttribute('aria-label', name);
                    const title = document.createElementNS(SVG, 'title');
                    title.textContent = 'Click to remove this dependency';
                    hit.appendChild(title);
                    hit.addEventListener('click', () => removeLink(ib, depId));
                    hit.addEventListener('keydown', (e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            removeLink(ib, depId);
                        }
                    });
                    pair.appendChild(hit);
                }
                const arrow = document.createElement('div');
                arrow.className = 'lm-gantt-link-arrow';
                // A box, not a stroke: its edges on whole pixels
                arrow.style.left = (x2 + 0.5) + 'px';
                arrow.style.top = y2 + 'px';
                o.lines.appendChild(arrow);
            });
        });

        if (lk) {
            const temp = svgEl('svg', 'lm-gantt-links');
            const line = svgEl('path', 'lm-gantt-link-temp');
            line.setAttribute('d', 'M ' + (lk.sx - screenLeft) + ' ' + (lk.sy - screenTop) + ' L ' + (lk.cx - screenLeft) + ' ' + (lk.cy - screenTop));
            temp.appendChild(line);
            o.top.appendChild(temp);
        }
    };

    onMount(() => {
        if (props.table.peek()) {
            renderLanes();
            // Lanes follow the pipeline through range (every refresh —
            // data/start/end — assigns it) and the live drag preview
            const stopRange = range.subscribe(renderLanes);
            const stopPreview = preview.subscribe(renderLanes);
            // A live editable/readonly/disabled flip re-tags the lane bars
            const stopEdit = props.editable.subscribe(renderLanes);
            const stopRo = props.readonly.subscribe(renderLanes);
            const stopDis = props.disabled.subscribe(renderLanes);
            // The link preview line follows the cursor on the overlay
            const stopLinking = linking.subscribe(() => {
                const t = tableEl();
                if (t) {
                    drawTableLinks(t);
                }
            });
            return () => {
                stopRange();
                stopPreview();
                stopEdit();
                stopRo();
                stopDis();
                stopLinking();
                removeOverlay();
                for (const cell of injectedCells) {
                    cell.remove();
                }
                injectedCells.length = 0;
            };
        }
    });

    // ---- header scale: month segments + day ticks (% widths)
    const monthSegments = () => {
        const { from, to } = range.value;
        const out: { label: string; left: number; width: number }[] = [];
        let cursor = from;
        while (cursor <= to) {
            const d = new Date(cursor);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).getTime();
            const segEnd = Math.min(monthEnd, to);
            out.push({
                label: MONTHS[d.getMonth()] + (d.getMonth() === 0 || cursor === from ? ' ' + d.getFullYear() : ''),
                left: round2(pct(cursor)),
                width: round2(widthPct(cursor, segEnd)),
            });
            cursor = segEnd + DAY;
        }
        return out;
    };

    /** ISO week number of the week holding `ms` (weeks run Monday to Sunday) */
    const isoWeek = (ms: number): number => {
        const d = new Date(ms);
        d.setHours(12, 0, 0, 0);
        // The Thursday of this week decides the year the week belongs to
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
        const firstThursday = new Date(d.getFullYear(), 0, 4, 12);
        firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
        return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * DAY));
    };

    /** Week segments: Sunday to Saturday, named by their ISO week number
     *  (the Thursday inside the segment) — the scale for windows of up to
     *  a few months; longer windows keep the month segments */
    const weekSegments = () => {
        const { from, to } = range.value;
        const out: { week: number; range: string; left: number; width: number }[] = [];
        let cursor = from;
        while (cursor <= to) {
            const d = new Date(cursor);
            const weekEnd = cursor + (6 - d.getDay()) * DAY;
            const segEnd = Math.min(weekEnd, to);
            const a = new Date(weekEnd - 6 * DAY);
            const b = new Date(weekEnd);
            out.push({
                week: isoWeek(weekEnd - 2 * DAY),
                range: MONTHS[a.getMonth()] + ' ' + a.getDate() + ' - ' + MONTHS[b.getMonth()] + ' ' + b.getDate(),
                left: round2(pct(cursor)),
                width: round2(widthPct(cursor, segEnd)),
            });
            cursor = segEnd + DAY;
        }
        return out;
    };

    const weekScale = () => totalDays() <= 120;

    const dayTicks = () => {
        const { from, to } = range.value;
        const out: { day: number; left: number; width: number; weekend: boolean; today: boolean }[] = [];
        const showLabel = totalDays() <= 60; // keep the scale readable
        const today = toMs(toIso(Date.now()));
        for (let ms = from; ms <= to; ms += DAY) {
            const d = new Date(ms);
            out.push({
                day: showLabel ? d.getDate() : 0,
                left: round2(pct(ms)),
                width: round2(widthPct(ms, ms)),
                weekend: d.getDay() === 0 || d.getDay() === 6,
                today: ms === today,
            });
        }
        return out;
    };

    const todayLeft = (): number | null => {
        const now = toMs(toIso(Date.now()));
        if (now < range.value.from || now > range.value.to) {
            return null;
        }
        return round2(pct(now) + widthPct(now, now) / 2);
    };

    // ---- rendering
    const barView = (task: GanttTask, index: number) => {
        const p = preview.value;
        const dragging = p && p.index === index;
        const from = dragging ? p!.from : toMs(task.start);
        const to = dragging ? p!.to : toMs(task.end || task.start);
        // Diamonds are EXPLICIT (type: 'milestone') — a task collapsed to
        // one day stays a narrow bar, so it can be resized back out
        const milestone = task.type === 'milestone';

        if (milestone) {
            return html`<div class="lm-gantt-milestone ${dragging ? 'lm-gantt-dragging' : ''}"
                data-index="${index}"
                role="button"
                tabindex="${props.disabled.value ? false : '0'}"
                aria-label="${(task.label || 'Milestone') + ', milestone, ' + toIso(from)}"
                aria-describedby="${canEdit() && !task.readonly ? hintId : false}"
                style="left:${round2(pct(from) + widthPct(from, from) / 2)}%;${task.color ? 'background:' + task.color : ''}"
                title="${(task.label || '') + ' · ' + toIso(from)}"
                onmousedown="${(e: MouseEvent) => startDrag(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
                onkeydown="${(e: KeyboardEvent) => keyEdit(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
                onclick="${(e: MouseEvent) =>
                    interactive() && props.onclick?.(task, e)}"></div>`;
        }

        const linkable = canEdit() && !task.readonly && task.id != null;
        return html`<div class="lm-gantt-bar ${dragging ? 'lm-gantt-dragging' : ''} ${
            canEdit() && !task.readonly ? 'lm-gantt-editable' : ''
        }"
            data-index="${index}"
            role="button"
            tabindex="${props.disabled.value ? false : '0'}"
            aria-label="${(task.label || 'Task') + ', ' + toIso(from) + ' to ' + toIso(to)}"
            aria-describedby="${canEdit() && !task.readonly ? hintId : false}"
            style="left:${round2(pct(from))}%;width:${round2(widthPct(from, to))}%;${
                task.color ? 'background:' + task.color : ''
            }"
            title="${(task.label || '') + ' · ' + toIso(from) + ' → ' + toIso(to)}"
            onmousedown="${(e: MouseEvent) => startDrag(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
            onkeydown="${(e: KeyboardEvent) => keyEdit(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
            onclick="${(e: MouseEvent) =>
                interactive() && props.onclick?.(task, e)}">
            ${() =>
                typeof task.progress === 'number'
                    ? html`<div class="lm-gantt-progress" style="width:${Math.min(100, Math.max(0, task.progress))}%"></div>`
                    : ''}
            <span class="lm-gantt-label">${task.label || ''}</span>
            ${linkable
                ? html`<div class="lm-gantt-link-handle" title="Drag to a task to link"
                      onmousedown="${(e: MouseEvent) =>
                          startLink(e, index, (e.currentTarget as HTMLElement).closest('.lm-gantt-bar') as HTMLElement)}"></div>`
                : ''}
        </div>`;
    };

    /** The live link preview in the rows: client px → % of the rows on x, px on y */
    const tempLine = () => {
        const lk = linking.value;
        if (!lk || !rowsEl) {
            return '';
        }
        const r = rowsEl.getBoundingClientRect();
        const x = (v: number) => round2(((v - r.left) / (r.width || 1)) * 100);
        return html`<path class="lm-gantt-link-temp"
            d="M ${x(lk.sx)} ${round2(lk.sy - r.top)} L ${x(lk.cx)} ${round2(lk.cy - r.top)}"></path>`;
    };

    return html`<div class="lm-gantt" data-editable="${() => (canEdit() ? 'true' : false)}"
        data-readonly="${() => (props.readonly.value ? 'true' : false)}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}"
        data-daywidth="${() => (dayPx.value > 0 ? 'true' : false)}">
        ${() =>
            canEdit()
                ? html`<span class="lm-gantt-sr" id="${hintId}">Control or Alt with the Left and Right arrow
                      keys moves the focused task; Shift with the arrow keys resizes its end date.</span>`
                : ''}
        ${() =>
            props.header.value &&
            html`<div class="lm-gantt-header" title="Drag to pan the timeline"
                role="group"
                tabindex="${props.disabled.value ? false : '0'}"
                aria-label="Timeline. Drag, or focus and press the arrow keys, to pan. Shift and the mouse wheel zoom."
                style="${() => (fixedWidth() ? 'width:' + fixedWidth() : '')}"
                onmousedown="${(e: MouseEvent) => panStart(e)}"
                onkeydown="${(e: KeyboardEvent) => panKey(e)}"
                onwheel="${(e: WheelEvent) => wheel(e, e.currentTarget as HTMLElement)}">
                <div class="lm-gantt-months">${() =>
                    weekScale()
                        ? weekSegments().map(
                              (w) => html`<div class="lm-gantt-month lm-gantt-week" style="left:${w.left}%;width:${w.width}%"><b>Week ${w.week}</b><span>${w.range}</span></div>`
                          )
                        : monthSegments().map(
                              (m) => html`<div class="lm-gantt-month" style="left:${m.left}%;width:${m.width}%">${m.label}</div>`
                          )}</div>
                <div class="lm-gantt-days">${() =>
                    dayTicks().map(
                        (t) => html`<div class="lm-gantt-day" data-weekend="${t.weekend ? 'true' : false}" data-today="${t.today ? 'true' : false}"
                            style="left:${t.left}%;width:${t.width}%">${t.day ? String(t.day) : ''}</div>`
                    )}</div>
            </div>`}
        ${() =>
            props.table.value
                ? '' // table mode: the rows live as lanes inside YOUR table
                : html`<div class="lm-gantt-rows" style="${() => '--lm-gantt-days:' + totalDays() + (fixedWidth() ? ';width:' + fixedWidth() : '')}"
                      ref="${(el: HTMLElement) => watchWidth(el)}"
                      onwheel="${(e: WheelEvent) => wheel(e, e.currentTarget as HTMLElement)}">
                      ${() =>
                          props.grid.value &&
                          html`<div class="lm-gantt-grid">${() =>
                              dayTicks()
                                  .filter((t) => t.weekend)
                                  .map(
                                      (t) =>
                                          html`<div class="lm-gantt-weekend" style="left:${t.left}%;width:${t.width}%"></div>`
                                  )}</div>`}
                      ${() =>
                          props.today.value && todayLeft() !== null
                              ? html`<div class="lm-gantt-today" style="left:${todayLeft()}%"></div>`
                              : ''}
                      ${() =>
                          // Tracked read: assignment AND touch() re-run the
                          // row list directly. Positional on purpose — rows
                          // map 1:1 to task indices (drag previews address
                          // them BY index) and carry no per-row state
                          ((props.data.value as GanttTask[]) || []).map(
                              (task, index) => html`<div class="lm-gantt-row" style="height:${props.rowheight.value}px">
                                  ${() => (task ? barView(task, index) : '')}
                              </div>`
                          )}
                      ${() => {
                          const ls = links();
                          const lk = linking.value; // tracked → temp line follows the cursor
                          if (!ls.length && !lk) {
                              return '';
                          }
                          const editable = canEdit();
                          const list = (props.data.value as GanttTask[]) || [];
                          const h = list.length * props.rowheight.value;
                          // Accessible name for a removable connector: name
                          // BOTH ends so "which link?" never needs the mouse
                          const linkName = (l: { ti: number; sid: string | number }) =>
                              'Remove the dependency from ' +
                              (list.find((t) => t && t.id === l.sid)?.label || l.sid) +
                              ' to ' +
                              (list[l.ti]?.label || 'task ' + (l.ti + 1));
                          // ONE wrapper root so the whole overlay is replaced as
                          // a unit each re-run — loose arrowhead siblings would
                          // otherwise orphan when a link is removed.
                          return html`<div class="lm-gantt-link-layer">
                              <svg class="lm-gantt-links" viewBox="0 0 100 ${h}"
                                  preserveAspectRatio="none" style="height:${h}px">${ls.map(
                                  // The visible line and its hit line share a group: the
                                  // hover highlight lands on the visible line (CSS :has)
                                  // while the hit line keeps its width under the cursor
                                  (l) => html`<g class="lm-gantt-link-pair"><path class="lm-gantt-link" d="${l.d}"></path>${
                                      editable
                                          ? html`<path class="lm-gantt-link-hit" d="${l.d}"
                                                role="button" tabindex="0"
                                                aria-label="${linkName(l)}"
                                                title="Click to remove this dependency"
                                                onclick="${() => removeLink(l.ti, l.sid)}"
                                                onkeydown="${(e: KeyboardEvent) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        removeLink(l.ti, l.sid);
                                                    }
                                                }}"></path>`
                                          : ''
                                  }</g>`
                              )}${tempLine()}</svg>${ls.map(
                                  (l) => html`<div class="lm-gantt-link-arrow" style="left:${l.ax}%;top:${l.ay}px"></div>`
                              )}</div>`;
                      }}
                  </div>`}
    </div>`;
});

export default Gantt;
