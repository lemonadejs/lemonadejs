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
 *   - milestones: type 'milestone' (or start === end) render a diamond
 *   - editable: drag the bar to move, drag the edges to resize — day
 *     snapping, live preview, Escape cancels mid-drag, onchange(task,
 *     start, end) fires ONLY on commit and mutates YOUR task object
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

export const Gantt = component('gantt', {
    data: Array,                  // GanttTask[] BY REFERENCE (mutate + touch())
    start: '',                    // viewport start (default: earliest task - 2 days)
    end: '',                      // viewport end (default: latest task + 2 days)
    header: true,                 // timeline header (months + day ticks)
    grid: true,                   // weekend shading + day grid (standalone look)
    rowheight: 36,
    today: true,                  // the today line
    editable: false,              // drag to move, edges to resize
    snap: 1,                      // drag snapping, in days
    table: '',                    // CSS selector: inject lanes into that table's rows
    onchange: Function,           // (task, start, end) on drag commit
    onclick: Function,            // (task, event)
    api: { getRange: Function, setRange: Function },
}, (props, { state, onMount, onUnmount }) => {
    const tasks = () => (props.data.peek() as GanttTask[]) || [];

    // ---- the range: explicit props win; otherwise fit the data
    const range = state<{ from: number; to: number }>({ from: 0, to: 1 });
    // Drag preview: task index -> { from, to } in ms, shown live
    const preview = state<{ index: number; from: number; to: number } | null>(null);
    const version = state(0); // bumped by refresh — rows re-render through it

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

    const refresh = () => {
        computeRange();
        preview.value = null;
        // Safe since subscribe() runs callbacks untracked (the engine
        // guard born from this very line — it used to LJS-203 loop)
        version.value++;
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

    // ---- drag: ONE in-flight gesture, ONE persistent cleanup
    let releaseGesture: (() => void) | null = null;
    onUnmount(() => releaseGesture?.());

    const track = (move: (e: MouseEvent) => void, done: (commit: boolean) => void) => {
        releaseGesture?.();
        const up = () => {
            cleanup();
            done(true);
        };
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cleanup();
                done(false);
            }
        };
        const cleanup = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('keydown', key);
            releaseGesture = null;
        };
        releaseGesture = () => {
            cleanup();
            done(false);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('keydown', key);
    };

    const startDrag = (e: MouseEvent, index: number, task: GanttTask, el: HTMLElement) => {
        if (!props.editable.value || task.readonly) {
            return;
        }
        e.preventDefault();
        const area = el.closest('.lm-gantt-rows') as HTMLElement;
        const areaRect = area.getBoundingClientRect();
        const barRect = el.getBoundingClientRect();
        const snapMs = Math.max(1, (props.snap.value as number) || 1) * DAY;
        const msPerPx = (range.value.to - range.value.from + DAY) / (areaRect.width || 1);

        const mode: 'move' | 'left' | 'right' =
            task.type === 'milestone' || toMs(task.start) === toMs(task.end || task.start)
                ? 'move'
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
                task.start = toIso(p.from);
                task.end = toIso(p.to);
                props.data.touch();
                props.onchange?.(
                    task,
                    task.start,
                    task.end
                );
            }
        );
    };

    props.ref?.({
        getRange: () => ({ start: toIso(range.value.from), end: toIso(range.value.to) }),
        setRange: (start: string, end: string) => {
            range.value = { from: toMs(start), to: Math.max(toMs(end), toMs(start) + DAY) };
            version.value = version.peek() + 1;
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
        const milestone = task.type === 'milestone' || from === to;
        const el = document.createElement('div');
        if (milestone) {
            el.className = 'lm-gantt-milestone' + (dragging ? ' lm-gantt-dragging' : '');
            el.style.left = round2(pct(from) + widthPct(from, from) / 2) + '%';
        } else {
            el.className =
                'lm-gantt-bar' +
                (props.editable.peek() && !task.readonly ? ' lm-gantt-editable' : '') +
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
        }
        if (task.color) {
            el.style.background = task.color;
        }
        el.title = (task.label || '') + ' · ' + toIso(from) + (milestone ? '' : ' → ' + toIso(to));
        el.addEventListener('mousedown', (e) => startDrag(e, index, task, el));
        el.addEventListener('click', (e) =>
            props.onclick?.(task, e)
        );
        return el;
    };

    onMount(() => {
        if (props.table.peek()) {
            renderLanes();
            // Lanes follow the same pipeline: data/range changes AND drag
            // previews re-render the affected lanes
            const stopVersion = version.subscribe(renderLanes);
            const stopPreview = preview.subscribe(renderLanes);
            return () => {
                stopVersion();
                stopPreview();
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
        const milestone = task.type === 'milestone' || from === to;

        if (milestone) {
            return html`<div class="lm-gantt-milestone ${dragging ? 'lm-gantt-dragging' : ''}"
                style="left:${round2(pct(from) + widthPct(from, from) / 2)}%;${task.color ? 'background:' + task.color : ''}"
                title="${(task.label || '') + ' · ' + toIso(from)}"
                onmousedown="${(e: MouseEvent) => startDrag(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
                onclick="${(e: MouseEvent) =>
                    props.onclick?.(task, e)}"></div>`;
        }

        return html`<div class="lm-gantt-bar ${dragging ? 'lm-gantt-dragging' : ''} ${
            props.editable.value && !task.readonly ? 'lm-gantt-editable' : ''
        }"
            style="left:${round2(pct(from))}%;width:${round2(widthPct(from, to))}%;${
                task.color ? 'background:' + task.color : ''
            }"
            title="${(task.label || '') + ' · ' + toIso(from) + ' → ' + toIso(to)}"
            onmousedown="${(e: MouseEvent) => startDrag(e, index, task, (e.currentTarget || e.target) as HTMLElement)}"
            onclick="${(e: MouseEvent) =>
                props.onclick?.(task, e)}">
            ${() =>
                typeof task.progress === 'number'
                    ? html`<div class="lm-gantt-progress" style="width:${Math.min(100, Math.max(0, task.progress))}%"></div>`
                    : ''}
            <span class="lm-gantt-label">${task.label || ''}</span>
        </div>`;
    };

    return html`<div class="lm-gantt" data-editable="${() => (props.editable.value ? 'true' : false)}">
        ${() =>
            props.header.value &&
            html`<div class="lm-gantt-header">
                <div class="lm-gantt-months">${() =>
                    monthSegments().map(
                        (m) => html`<div class="lm-gantt-month" style="left:${m.left}%;width:${m.width}%">${m.label}</div>`
                    )}</div>
                <div class="lm-gantt-days">${() =>
                    dayTicks().map(
                        (t) => html`<div class="lm-gantt-day" data-weekend="${t.weekend ? 'true' : false}"
                            style="left:${t.left}%;width:${t.width}%">${t.day ? String(t.day) : ''}</div>`
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
                      ${() => {
                          void version.value; // rows flow through refresh
                          return tasks().map(
                              (task, index) => html`<div class="lm-gantt-row" style="height:${props.rowheight.value}px">
                                  ${() => barView(task, index)}
                              </div>`
                          );
                      }}
                  </div>`}
    </div>`;
});

export default Gantt;
