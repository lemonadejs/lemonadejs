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
 *   - dates are 'YYYY-MM-DD' strings, all math in LOCAL time
 *   - data BY REFERENCE: mutate + touch() re-renders
 *
 * TWO MOUNTING MODES:
 *   1. In a div: the full chart — header timeline + one row per task
 *      (non-headless by default).
 *   2. OVER A TABLE: set `table` to a CSS selector — the gantt injects
 *      one lane cell per tbody row (task i ↔ row i), %-aligned, drag
 *      editing included, and renders its own element as the timeline
 *      header you place above/beside the table. Unmount removes every
 *      injected cell — the table returns to its original state.
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
    table: '',                    // CSS selector: inject lanes into that table's rows
    onchange: Function,           // (task, start, end) on drag commit
    onclick: Function,            // (task, event)
    onlink: Function,             // (fromTask, toTask) a dependency was drawn
    onunlink: Function,           // (fromTask, toTask) a dependency was removed
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
    // Live dependency-link drag: source row + anchor (%/px) + cursor (%/px)
    const linking = state<{ index: number; ax: number; ay: number; cx: number; cy: number } | null>(null);

    const computeRange = () => {
        const list = tasks();
        let from = props.start.peek() ? toMs(props.start.peek() as string) : NaN;
        let to = props.end.peek() ? toMs(props.end.peek() as string) : NaN;
        if (Number.isNaN(from) || Number.isNaN(to)) {
            let lo = Infinity;
            let hi = -Infinity;
            for (const t of list) {
                lo = Math.min(lo, toMs(t.start));
                hi = Math.max(hi, toMs(t.end || t.start));
            }
            if (!list.length) {
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
    const refresh = () => {
        // A data change mid-gesture cancels the drag: its captured geometry
        // (origin, ms-per-px, task) is stale. No-op after our own commits —
        // the gesture has already been released by then.
        releaseGesture?.();
        if (keepViewport) {
            keepViewport = false;
            range.value = { ...range.value };
        } else {
            computeRange();
        }
        preview.value = null;
    };

    /** touch() for edits made BY this component: viewport stays put */
    const touchKeepingViewport = () => {
        keepViewport = true;
        props.data.touch();
    };

    onMount(() => props.data.subscribe(refresh));
    onMount(() => props.start.subscribe(refresh));
    onMount(() => props.end.subscribe(refresh));
    computeRange();

    const totalDays = () => Math.round((range.value.to - range.value.from) / DAY) + 1;

    /** The geometry heart: date → % of the range (bars never use px) */
    const pct = (ms: number): number => {
        const { from, to } = range.value;
        return ((ms - from) / (to - from + DAY)) * 100;
    };
    const widthPct = (fromMs: number, toMs_: number): number =>
        ((toMs_ - fromMs + DAY) / (range.value.to - range.value.from + DAY)) * 100;

    const round2 = (n: number) => Math.round(n * 1000) / 1000;

    /**
     * Readable label color over a custom bar background (same luminance
     * rule as the chart's textOn). Returns '' for the default bars — the
     * stylesheet's white-on-series-color already contrasts — and for
     * unparseable colors (named colors, gradients), where white + shadow
     * stays the best guess. A LIGHT custom color (white, yellow...) flips
     * the label dark and drops the shadow.
     */
    const labelStyle = (bg?: string): string => {
        if (!bg) {
            return '';
        }
        let c: number[] | null = null;
        const hex = bg.match(/^#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
        if (hex) {
            const s = hex[1].length === 3 ? hex[1].split('').map((ch) => ch + ch).join('') : hex[1];
            c = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
        } else {
            const m = bg.match(/^rgba?\(([^)]+)\)/i);
            if (m) {
                c = m[1].split(',').slice(0, 3).map(Number);
            }
        }
        if (!c || c.some((n) => !Number.isFinite(n))) {
            return '';
        }
        const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
        return lum > 150 ? 'color:#2b2f36;text-shadow:none' : '';
    };

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
            if (t.id != null) byId.set(t.id, i);
        });
        const out: { d: string; ax: number; ay: number; ti: number; sid: string | number }[] = [];
        tasks.forEach((b, ib) => {
            const deps = b.dependencies;
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
                const stub = 1.5; // % horizontal run out of the predecessor
                let d: string;
                if (bx - stub >= aEndX + stub) {
                    // forward link: out of A → one vertical → into B's start
                    d =
                        'M ' + round2(aEndX) + ' ' + ay +
                        ' H ' + round2(bx - stub) +
                        ' V ' + by +
                        ' H ' + round2(bx);
                } else {
                    // BACK-link (B starts before A ends): a drop at A's edge
                    // would run behind B's bar. Route the horizontal leg
                    // through the GAP between the rows, then approach B's
                    // start from the left.
                    const gapY = ib > ia ? ib * rh : (ib + 1) * rh;
                    d =
                        'M ' + round2(aEndX) + ' ' + ay +
                        ' H ' + round2(aEndX + stub) +
                        ' V ' + gapY +
                        ' H ' + round2(bx - stub) +
                        ' V ' + by +
                        ' H ' + round2(bx);
                }
                out.push({ d, ax: round2(bx), ay: by, ti: ib, sid: depId });
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
     * target is whatever bar the mouse is over on release.
     */
    const startLink = (e: MouseEvent, index: number, el: HTMLElement) => {
        if (!canEditPeek()) {
            return;
        }
        const src = tasks()[index];
        if (!src || src.id == null) {
            return; // a predecessor must have an id to be referenced
        }
        e.preventDefault();
        e.stopPropagation(); // don't also start a move/resize drag on the bar
        const area = el.closest('.lm-gantt-rows') as HTMLElement;
        const areaRect = area.getBoundingClientRect();
        const rh = props.rowheight.value;
        const aFrom = toMs(src.start);
        const ax = pct(aFrom) + widthPct(aFrom, toMs(src.end || src.start));
        const ay = index * rh + rh / 2;
        let lastX = e.clientX;
        let lastY = e.clientY;
        track(
            (ev) => {
                lastX = ev.clientX;
                lastY = ev.clientY;
                linking.value = {
                    index,
                    ax,
                    ay,
                    cx: ((ev.clientX - areaRect.left) / (areaRect.width || 1)) * 100,
                    cy: ev.clientY - areaRect.top,
                };
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
                range.value = { from: from0 - deltaMs, to: to0 - deltaMs };
            },
            () => header.classList.remove('lm-gantt-panning')
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
        range.value = { from: range.value.from + step, to: range.value.to + step };
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
        const src = tasks().find((t) => t.id === sourceId);
        target.dependencies = target.dependencies.filter((d) => d !== sourceId);
        touchKeepingViewport();
        props.onunlink?.(src, target);
    };

    props.ref?.({
        getRange: () => ({ start: toIso(range.value.from), end: toIso(range.value.to) }),
        setRange: (start: string, end: string) => {
            // The range assignment re-runs every % binding and the lanes
            range.value = { from: toMs(start), to: Math.max(toMs(end), toMs(start) + DAY) };
        },
    });

    // ---- TABLE MODE: inject one %-aligned lane per tbody row.
    // Imperative by necessity (divs cannot be children of <table>), but
    // contained: cells are tagged, lanes rebuilt through the same
    // refresh pipeline, and unmount removes everything we created.
    const injectedCells: HTMLTableCellElement[] = [];

    const renderLanes = () => {
        const selector = props.table.peek() as string;
        if (!selector) {
            return;
        }
        const tableEl = document.querySelector(selector) as HTMLTableElement | null;
        if (!tableEl) {
            return;
        }
        const bodyRows = [...tableEl.querySelectorAll(':scope > tbody > tr')] as HTMLTableRowElement[];
        const list = tasks();
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
                // (one pair per created lane, auto-removed on unmount):
                // bars are rebuilt per refresh, so per-bar listeners would
                // either leak registrations or need manual release
                listen<MouseEvent>(lane, 'mousedown', (e) => {
                    const bar = (e.target as Element).closest('.lm-gantt-bar, .lm-gantt-milestone');
                    const task = tasks()[index];
                    if (bar && task) {
                        startDrag(e, index, task, bar as HTMLElement);
                    }
                });
                listen<MouseEvent>(lane, 'click', (e) => {
                    const bar = (e.target as Element).closest('.lm-gantt-bar, .lm-gantt-milestone');
                    const task = tasks()[index];
                    if (bar && task && interactive()) {
                        props.onclick?.(task, e);
                    }
                });
                listen<KeyboardEvent>(lane, 'keydown', (e) => {
                    const bar = (e.target as Element).closest('.lm-gantt-bar, .lm-gantt-milestone');
                    const task = tasks()[index];
                    if (bar && task) {
                        keyEdit(e, index, task, bar as HTMLElement);
                    }
                });
            }
            lane.textContent = '';
            const task = list[index];
            if (task) {
                lane.appendChild(buildLaneBar(task, index));
            }
        });
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
            const contrast = labelStyle(task.color);
            if (contrast) {
                label.style.cssText = contrast;
            }
            el.appendChild(label);
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
            return () => {
                stopRange();
                stopPreview();
                stopEdit();
                stopRo();
                stopDis();
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

    const dayTicks = () => {
        const { from, to } = range.value;
        const out: { day: number; left: number; width: number; weekend: boolean }[] = [];
        const showLabel = totalDays() <= 45; // keep the scale readable
        for (let ms = from; ms <= to; ms += DAY) {
            const d = new Date(ms);
            out.push({
                day: showLabel ? d.getDate() : 0,
                left: round2(pct(ms)),
                width: round2(widthPct(ms, ms)),
                weekend: d.getDay() === 0 || d.getDay() === 6,
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
            <span class="lm-gantt-label" style="${labelStyle(task.color) || false}">${task.label || ''}</span>
            ${linkable
                ? html`<div class="lm-gantt-link-handle" title="Drag to a task to link"
                      onmousedown="${(e: MouseEvent) =>
                          startLink(e, index, (e.currentTarget as HTMLElement).closest('.lm-gantt-rows') as HTMLElement)}"></div>`
                : ''}
        </div>`;
    };

    return html`<div class="lm-gantt" data-editable="${() => (canEdit() ? 'true' : false)}"
        data-readonly="${() => (props.readonly.value ? 'true' : false)}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}">
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
                aria-label="Timeline. Drag, or focus and press the arrow keys, to pan."
                onmousedown="${(e: MouseEvent) => panStart(e)}"
                onkeydown="${(e: KeyboardEvent) => panKey(e)}">
                <div class="lm-gantt-months">${() =>
                    monthSegments().map(
                        (m) => html`<div class="lm-gantt-month" style="left:${m.left}%;width:${m.width}%">${m.label}</div>`
                    )}</div>
                <div class="lm-gantt-days">${() =>
                    dayTicks().map(
                        (t) => html`<div class="lm-gantt-day" data-weekend="${t.weekend ? 'true' : false}"
                            style="left:${t.left}%;width:${t.width}%">${t.day ? String(t.day).padStart(2, '0') : ''}</div>`
                    )}</div>
            </div>`}
        ${() =>
            props.table.value
                ? '' // table mode: the rows live as lanes inside YOUR table
                : html`<div class="lm-gantt-rows">
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
                                  ${() => barView(task, index)}
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
                              (list.find((t) => t.id === l.sid)?.label || l.sid) +
                              ' to ' +
                              (list[l.ti]?.label || 'task ' + (l.ti + 1));
                          // ONE wrapper root so the whole overlay is replaced as
                          // a unit each re-run — loose arrowhead siblings would
                          // otherwise orphan when a link is removed.
                          return html`<div class="lm-gantt-link-layer">
                              <svg class="lm-gantt-links" viewBox="0 0 100 ${h}"
                                  preserveAspectRatio="none" style="height:${h}px">${ls.map(
                                  (l) => html`<path class="lm-gantt-link" d="${l.d}"></path>`
                              )}${
                                  editable
                                      ? ls.map(
                                            (l) => html`<path class="lm-gantt-link-hit" d="${l.d}"
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
                                        )
                                      : ''
                              }${
                                  lk
                                      ? html`<path class="lm-gantt-link-temp"
                                            d="M ${round2(lk.ax)} ${lk.ay} L ${round2(lk.cx)} ${lk.cy}"></path>`
                                      : ''
                              }</svg>${ls.map(
                                  (l) => html`<div class="lm-gantt-link-arrow" style="left:${l.ax}%;top:${l.ay}px"></div>`
                              )}</div>`;
                      }}
                  </div>`}
    </div>`;
});

export default Gantt;
