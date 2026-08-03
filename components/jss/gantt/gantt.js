/**
 * Gantt extension for the JSS data grid — LemonadeJS v6.
 *
 * Smartsheet-style: the @lemonadejs/gantt block injects a %-aligned
 * timeline lane into every grid row (task i ↔ row i), and the block's
 * own element — which renders only the timeline header in table mode —
 * is mounted into an extra header cell of the same table. Same table,
 * same column: grid rows and chart lanes stay aligned with no measuring,
 * through horizontal scroll included.
 *
 * Two-way: editing the sheet rebuilds the tasks; dragging a bar writes
 * the date cells back through the normal setValue pipeline (undo works).
 *
 * ES module: import it and pass it to jspreadsheet.setExtensions({ ganttChart }).
 */
import { html, mount, store } from 'lemonadejs';
import Gantt from '@lemonadejs/gantt';

const DAY = 86400000;

let config = {
    // column indexes (x) per task field; progress/color/predecessors are
    // optional — predecessors holds comma-separated 1-based row numbers
    // (the Smartsheet model) and enables the dependency arrows
    columns: { label: 0, start: 1, end: 2, progress: 3, color: 4 },
    width: 420,       // lane column width in px
    editable: true,   // drag bars to move, drag edges to resize
    readonly: false,  // host override: view-only (a readonly worksheet) regardless of `editable`
    snap: 1,          // drag snapping, in days
    daywidth: 16,     // FIXED px per day slot; the window = width/daywidth days (0 = fit the data)
    resizable: true,  // grip on the lane's right border to resize the timeline viewport
};

/** The single edit gate: `editable` opts in, `readonly` overrides it */
const canEdit = function() {
    return config.editable !== false && config.readonly !== true;
}

let instances = 0;

const isDate = function(v) {
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
}

const toMs = function(s) {
    const t = s.split('-').map(Number);
    return new Date(t[0], t[1] - 1, t[2], 12).getTime();
}

const toIso = function(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// jss auto-detects typed dates and stores them as Excel-style serial
// numbers (days since 1899-12-30) — getData() returns those, not strings
const SERIAL_EPOCH = Date.UTC(1899, 11, 30);

const serialToIso = function(n) {
    const d = new Date(SERIAL_EPOCH + Math.round(n) * DAY);
    const p = (v) => String(v).padStart(2, '0');
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
}

/** Cell value -> 'YYYY-MM-DD' (ISO string, date serial, or null) */
const normalizeDate = function(v) {
    if (isDate(v)) {
        return v.substring(0, 10);
    }
    const n = typeof v === 'number' ? v : (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) ? parseFloat(v) : NaN);
    if (! isNaN(n) && n > 0) {
        return serialToIso(n);
    }
    return null;
}

/** Predecessors cell ('2' or '1, 3') -> 0-based row indexes, or null */
const parsePreds = function(v) {
    if (v == null || v === '') {
        return null;
    }
    const out = [];
    String(v).split(',').forEach(function(part) {
        const n = parseInt(part.trim(), 10);
        if (! isNaN(n) && n >= 1) {
            out.push(n - 1);
        }
    });
    return out.length ? out : null;
}

const SVG = 'http://www.w3.org/2000/svg';

/**
 * Create a plugin object
 * @param {object} spreadsheet object.
 * @param {object} plugin options
 */
const ganttChart = (function(spreadsheet, opt) {

    // Reactive state feeding the <Gantt> block (one set per spreadsheet)
    const data = store([]);
    const start = store('');
    const end = store('');

    // Imperative references owned by the plugin
    let worksheet = null;
    let table = null;
    let laneCol = null;
    let headerCell = null;
    let linkLayer = null;
    let handleLayer = null;
    let api = null;      // the block's getRange/setRange (captures pans)
    let observer = null;
    let queued = false;
    let redrawQueued = false;

    // Unique marker class: the gantt block finds the table by selector
    const marker = 'jss-gantt-' + (++instances);

    /**
     * Row-aligned SPARSE task list: tasks[i] belongs to tbody row i, rows
     * without a valid start date stay undefined (empty lane). The gantt
     * never iterates the sparse array because start/end are always given.
     */
    const buildTasks = function() {
        const cols = config.columns;
        const rows = worksheet.getData() || [];
        const tasks = [];
        let lo = Infinity;
        let hi = -Infinity;

        for (let y = 0; y < rows.length; y++) {
            const row = rows[y] || [];
            const s = normalizeDate(row[cols.start]);
            if (! s) {
                tasks.push(undefined);
                continue;
            }
            const e = normalizeDate(row[cols.end]) || s;
            const task = {
                id: y,
                _row: y,
                label: row[cols.label] != null ? String(row[cols.label]) : '',
                start: s,
                end: e,
            };
            const progress = parseFloat(row[cols.progress]);
            if (! isNaN(progress)) {
                task.progress = progress;
            }
            if (typeof cols.color === 'number' && row[cols.color]) {
                task.color = String(row[cols.color]);
            }
            if (typeof cols.predecessors === 'number') {
                const deps = parsePreds(row[cols.predecessors]);
                if (deps) {
                    task.dependencies = deps.filter(function(d) {
                        return d !== y;
                    });
                }
            }
            tasks.push(task);
            lo = Math.min(lo, toMs(s));
            hi = Math.max(hi, toMs(e));
        }

        if (lo === Infinity) {
            // No tasks yet: a viewport around today
            lo = Date.now() - 7 * DAY;
            hi = Date.now() + 21 * DAY;
        }

        return { tasks, from: toIso(lo - 2 * DAY), to: toIso(hi + 2 * DAY) };
    }

    /** Bar drag committed on the chart -> write the date cells back.
     *  The viewport NEVER moves on a drop — a bar dragged past the edge
     *  clips out of view; the header pan or the resize grip brings it back. */
    const onBarChange = function(task, s, e) {
        const cols = config.columns;
        worksheet.setValue(worksheet.helpers.getCellNameFromCoords(cols.start, task._row), s);
        worksheet.setValue(worksheet.helpers.getCellNameFromCoords(cols.end, task._row), e);
    }

    /** Click on a connector -> remove that predecessor from the cell */
    const removeLink = function(toRow, fromRow) {
        const cols = config.columns;
        const task = data.value[toRow];
        const deps = (task && task.dependencies || []).filter(function(d) {
            return d !== fromRow;
        });
        const value = deps.map(function(d) {
            return d + 1;
        }).join(',');
        worksheet.setValue(worksheet.helpers.getCellNameFromCoords(cols.predecessors, toRow), value);
    }

    /** Drop on a task row -> append the source to its predecessors cell */
    const createLink = function(fromRow, toRow) {
        const target = data.value[toRow];
        if (! target || fromRow === toRow) {
            return;
        }
        const deps = Array.isArray(target.dependencies) ? target.dependencies.slice() : [];
        if (deps.indexOf(fromRow) !== -1) {
            return;
        }
        deps.push(fromRow);
        const cols = config.columns;
        const value = deps.map(function(d) {
            return d + 1;
        }).join(',');
        worksheet.setValue(worksheet.helpers.getCellNameFromCoords(cols.predecessors, toRow), value);
    }

    /**
     * Drag a handle onto another task's row to create the dependency —
     * the extension's own gesture (the block's link handles exist only in
     * div mode). The dashed preview line lives on the handle layer.
     */
    const startLink = function(e, fromRow, anchorX, anchorY) {
        e.preventDefault();
        e.stopPropagation();

        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('class', 'lm-gantt-links');
        svg.style.width = '100%';
        svg.style.height = '100%';
        const temp = document.createElementNS(SVG, 'path');
        temp.setAttribute('class', 'lm-gantt-link-temp');
        svg.appendChild(temp);
        handleLayer.appendChild(svg);

        const layerRect = function() {
            return handleLayer.getBoundingClientRect();
        }

        const move = function(ev) {
            const r = layerRect();
            temp.setAttribute('d', 'M ' + anchorX + ' ' + anchorY +
                ' L ' + (ev.clientX - r.left) + ' ' + (ev.clientY - r.top));
        }

        const finish = function(commit, ev) {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('keydown', key);
            svg.remove();
            if (commit && ev) {
                const tr = ev.target && ev.target.closest ? ev.target.closest('tbody > tr') : null;
                if (tr && table.contains(tr)) {
                    const toRow = [...tr.parentNode.children].indexOf(tr);
                    createLink(fromRow, toRow);
                }
            }
        }

        const up = function(ev) {
            finish(true, ev);
        }

        const key = function(ev) {
            if (ev.key === 'Escape') {
                finish(false);
            }
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('keydown', key);
    }

    /**
     * Dependency arrows — finish→start elbows, drawn by the extension:
     * in table mode the bars live in separate row cells, so the block has
     * no shared coordinate space to draw connectors in. This overlay uses
     * the block's own link classes (same look as div mode) with px
     * geometry measured from the injected lane bars, and sits over the
     * table inside the scrolling container (scrolls with the grid).
     */
    const redrawLinks = function() {
        if (typeof config.columns.predecessors !== 'number' || ! table || ! table.isConnected) {
            return;
        }
        const content = worksheet.content;
        if (getComputedStyle(content).position === 'static') {
            content.style.position = 'relative';
        }
        if (! linkLayer) {
            linkLayer = document.createElement('div');
            linkLayer.className = 'lm-gantt-link-layer jss-gantt-link-layer';
            // The handle layer sits ABOVE the bars (the line layer sits
            // below them) so the connect handles stay grabbable
            handleLayer = document.createElement('div');
            handleLayer.className = 'lm-gantt-link-layer jss-gantt-handle-layer';
        }
        if (linkLayer.parentNode !== content) {
            content.appendChild(linkLayer);
            content.appendChild(handleLayer);
        }

        const tRect = table.getBoundingClientRect();
        const cRect = content.getBoundingClientRect();
        const lanes = table.querySelectorAll(':scope > tbody > tr > td.lm-gantt-cell');
        // Clip the overlays to the LANE COLUMN: bar rects ignore the lane
        // cells' overflow clipping, so a bar outside the date viewport
        // would otherwise paint connectors/handles over the data columns
        const laneRect = lanes.length ? lanes[0].getBoundingClientRect() : tRect;
        [linkLayer, handleLayer].forEach(function(layer) {
            layer.style.left = (laneRect.left - cRect.left + content.scrollLeft) + 'px';
            layer.style.top = (tRect.top - cRect.top + content.scrollTop) + 'px';
            layer.style.width = laneRect.width + 'px';
            layer.style.height = tRect.height + 'px';
        });
        linkLayer.textContent = '';
        handleLayer.textContent = '';
        const barOf = function(y) {
            return lanes[y] && lanes[y].querySelector('.lm-gantt-bar, .lm-gantt-milestone');
        }

        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('class', 'lm-gantt-links');
        svg.style.width = '100%';
        svg.style.height = '100%';
        linkLayer.appendChild(svg);

        // A connect handle on every bar: drag it onto another task's row
        // to write the dependency into the predecessors column
        if (canEdit()) {
            data.value.forEach(function(task) {
                if (! task) {
                    return;
                }
                const bar = barOf(task._row);
                if (! bar) {
                    return;
                }
                const rect = bar.getBoundingClientRect();
                const hx = rect.right - laneRect.left + 3;
                const hy = rect.top + rect.height / 2 - tRect.top;
                const handle = document.createElement('div');
                handle.className = 'jss-gantt-link-handle';
                handle.title = 'Drag to another task to link';
                handle.style.left = hx + 'px';
                handle.style.top = hy + 'px';
                handle.addEventListener('mousedown', function(e) {
                    startLink(e, task._row, hx, hy);
                });
                handleLayer.appendChild(handle);
            });
        }

        const G = 10; // px horizontal stub out of the predecessor
        data.value.forEach(function(task) {
            if (! task || ! Array.isArray(task.dependencies)) {
                return;
            }
            const toBar = barOf(task._row);
            if (! toBar) {
                return;
            }
            const toRect = toBar.getBoundingClientRect();
            const x2 = toRect.left - laneRect.left;
            const y2 = toRect.top + toRect.height / 2 - tRect.top;

            task.dependencies.forEach(function(fromRow) {
                const fromBar = barOf(fromRow);
                if (! fromBar) {
                    return;
                }
                const fromRect = fromBar.getBoundingClientRect();
                const x1 = fromRect.right - laneRect.left;
                const y1 = fromRect.top + fromRect.height / 2 - tRect.top;
                // Same routing as the block: forward links take one drop;
                // BACK-links (B starts before A ends) run through the gap
                // between the rows so the line never crosses B's bar
                let d;
                if (x2 - G >= x1 + G) {
                    d = 'M ' + x1 + ' ' + y1 + ' H ' + (x2 - G) + ' V ' + y2 + ' H ' + x2;
                } else {
                    // The leg must sit in the MIDDLE of the visual gap
                    // between the bars — ON a bar edge it hides behind the
                    // bar (connectors render underneath). Adjacent rows:
                    // midway between A's bottom and B's top edges; farther
                    // apart: just clear of B's edge.
                    // −3px: stroke width + air, so the leg sits visibly
                    // clear of the bar edge
                    const gapY = y2 > y1
                        ? Math.max((fromRect.bottom + toRect.top) / 2, toRect.top - 3) - tRect.top - 3
                        : Math.min((toRect.bottom + fromRect.top) / 2, toRect.bottom + 3) - tRect.top + 3;
                    d = 'M ' + x1 + ' ' + y1 + ' H ' + (x1 + G) + ' V ' + gapY +
                        ' H ' + (x2 - G) + ' V ' + y2 + ' H ' + x2;
                }

                const path = document.createElementNS(SVG, 'path');
                path.setAttribute('class', 'lm-gantt-link');
                path.setAttribute('d', d);
                svg.appendChild(path);

                if (canEdit()) {
                    const hit = document.createElementNS(SVG, 'path');
                    hit.setAttribute('class', 'lm-gantt-link-hit');
                    hit.setAttribute('d', d);
                    const title = document.createElementNS(SVG, 'title');
                    title.textContent = 'Click to remove this dependency';
                    hit.appendChild(title);
                    hit.addEventListener('click', function() {
                        removeLink(task._row, fromRow);
                    });
                    svg.appendChild(hit);
                }

                const arrow = document.createElement('div');
                arrow.className = 'lm-gantt-link-arrow';
                arrow.style.left = x2 + 'px';
                arrow.style.top = y2 + 'px';
                linkLayer.appendChild(arrow);
            });
        });
    }

    const Chart = function() {
        return html`<${Gantt} data="${data}" start="${start}" end="${end}"
            table="${'.' + marker}"
            editable="${config.editable !== false}" readonly="${config.readonly === true}" snap="${config.snap || 1}"
            onchange="${onBarChange}" ref="${(a) => { api = a; }}" />`;
    }

    /** Adopt the block's CURRENT window into the stores — the user may
     *  have panned the header, which lives only inside the block. Every
     *  rebuild recomputes the range from these props, so they must
     *  describe what is on screen, or a drop after a pan snaps back. */
    const adoptRange = function() {
        if (api) {
            const r = api.getRange();
            start.value = r.start;
            end.value = r.end;
        }
    }

    /** Content-box calibration. Table chrome (cell borders/padding) makes
     *  the lane's content box a little narrower than the <col> width, so
     *  a day slot lands NEAR daywidth, not on it — and the deficit spread
     *  over a varying day count nudges every bar on each resize step.
     *  Measure the rendered lane and nudge the col until one slot is
     *  daywidth px exactly. */
    const calibrate = function() {
        if (! (config.daywidth > 0) || ! laneCol || ! table || ! start.value || ! end.value) {
            return;
        }
        const lane = table.querySelector('td.lm-gantt-cell > .lm-gantt-lane');
        if (! lane) {
            return;
        }
        const ticks = Math.round((toMs(end.value) - toMs(start.value)) / DAY) + 1;
        const diff = Math.round(ticks * config.daywidth - lane.getBoundingClientRect().width);
        if (diff) {
            const applied = parseInt(laneCol.getAttribute('width'), 10) || config.width;
            laneCol.setAttribute('width', applied + diff);
        }
    }

    /** The injected chrome jss does not know about: marker class on the
     *  table, a <col> for the lane column, the header cell hosting the
     *  timeline. Re-checked every sync in case jss rebuilt a section. */
    /** Coalesced arrow redraw: one per frame no matter how many lane
     *  mutations arrive (a header pan rebuilds every lane per tick) */
    const scheduleRedraw = function() {
        if (redrawQueued) {
            return;
        }
        redrawQueued = true;
        requestAnimationFrame(function() {
            redrawQueued = false;
            redrawLinks();
        });
    }

    const ensureCells = function() {
        if (! table || ! table.isConnected) {
            table = worksheet.content.querySelector('table');
            if (! table) {
                return;
            }
            table.classList.add(marker);
            // The bars move without any jss event (header pan, live drag
            // preview — the block re-renders lanes on its own): follow the
            // DOM instead of the causes. The overlay lives OUTSIDE the
            // table, so redraws never feed back into this observer.
            if (! observer) {
                observer = new MutationObserver(scheduleRedraw);
            }
            observer.disconnect();
            observer.observe(table, { childList: true, subtree: true });
        }

        const colgroup = table.querySelector(':scope > colgroup');
        if (colgroup) {
            if (! laneCol) {
                laneCol = document.createElement('col');
                laneCol.setAttribute('width', config.width);
            }
            if (laneCol.parentNode !== colgroup) {
                colgroup.appendChild(laneCol);
            }
        }

        const headerRow = table.querySelector(':scope > thead > tr:last-child');
        if (headerRow) {
            if (! headerCell) {
                headerCell = document.createElement('th');
                headerCell.className = 'lm-gantt-header-cell';
                headerRow.appendChild(headerCell);
                // Resize grip on the lane's RIGHT border — the one jss
                // cannot provide (its column resizing stops at the previous
                // column; the lane's right edge is the table edge). Day
                // width stays fixed: a wider lane shows more days, it does
                // not stretch the slots.
                if (config.resizable !== false) {
                    const grip = document.createElement('div');
                    grip.className = 'jss-gantt-resize';
                    grip.title = 'Drag to resize the timeline';
                    grip.addEventListener('mousedown', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        adoptRange(); // resize extends the CURRENT (possibly panned) window
                        const x0 = e.clientX;
                        const w0 = config.width;
                        const move = function(ev) {
                            const raw = Math.max(120, w0 + (ev.clientX - x0));
                            // QUANTIZED to whole day slots with EXACT math:
                            // width = ticks × daywidth and window = ticks
                            // days keeps one slot at daywidth px precisely,
                            // so existing bars keep their exact px position
                            // through every step — no drift, no flicker
                            const ticks = config.daywidth > 0 ? Math.max(8, Math.round(raw / config.daywidth)) : 0;
                            const w = ticks ? ticks * config.daywidth : raw;
                            if (w === config.width) {
                                return;
                            }
                            config.width = w;
                            if (laneCol) {
                                laneCol.setAttribute('width', w);
                            }
                            if (ticks && start.value) {
                                end.value = toIso(toMs(start.value) + (ticks - 1) * DAY);
                            }
                            calibrate();
                            // SYNCHRONOUS redraw: the observer's rAF redraw
                            // lands a frame after the bars move — connectors
                            // and handles blink out for that frame. Same-frame
                            // keeps them glued.
                            redrawLinks();
                        };
                        const up = function() {
                            document.removeEventListener('mousemove', move);
                            document.removeEventListener('mouseup', up);
                            sync();
                        };
                        document.addEventListener('mousemove', move);
                        document.addEventListener('mouseup', up);
                    });
                    headerCell.appendChild(grip);
                }
                // Mounted ONCE: re-appending the same cell keeps the
                // living chart when jss re-attaches the header row
                mount(Chart, headerCell);
            } else if (headerCell.parentNode !== headerRow) {
                headerRow.appendChild(headerCell);
            }
        }
    }

    /** Rebuild tasks from the sheet (microtask-deduped: jss fires bursts
     *  of events per operation) */
    const sync = function() {
        if (queued) {
            return;
        }
        queued = true;
        queueMicrotask(function() {
            queued = false;
            if (! worksheet) {
                return;
            }
            ensureCells();
            const built = buildTasks();
            // The viewport is set ONCE and NEVER resized by edits: the day
            // slot width stays fixed. With `daywidth` the window length is
            // width/daywidth days (predictable at any data spread); 0 falls
            // back to fitting the whole envelope. Bars dragged outside the
            // window SHIFT it (see onBarChange) — a scroll, not a squeeze.
            if (! start.value || ! end.value) {
                start.value = built.from;
                if (config.daywidth > 0) {
                    // EXACT slots: width = ticks × daywidth and window =
                    // ticks days, so one slot is daywidth px PRECISELY and
                    // a bar at day k sits at exactly k × daywidth px —
                    // independent of the window length. Anything less and
                    // every resize step nudges every bar sub-pixel.
                    const ticks = Math.max(8, Math.round(config.width / config.daywidth));
                    config.width = ticks * config.daywidth;
                    if (laneCol) {
                        laneCol.setAttribute('width', config.width);
                    }
                    end.value = toIso(toMs(built.from) + (ticks - 1) * DAY);
                } else {
                    end.value = built.to;
                }
            } else {
                adoptRange();
            }
            data.value = built.tasks;
            // Lanes re-rendered synchronously above — geometry is fresh
            calibrate();
            redrawLinks();
        });
    }

    /** Structural row changes shift the row ↔ task indices: drop the
     *  injected lane cells so they rebuild with fresh delegation */
    const purge = function() {
        if (table) {
            table.querySelectorAll('td.lm-gantt-cell').forEach(function(td) {
                td.remove();
            });
        }
        sync();
    }

    // Plugin object
    const plugin = {}

    plugin.init = function(w) {
        // v1 binds the chart to the first worksheet
        if (! worksheet) {
            worksheet = w;
            sync();
        }
    }

    plugin.onevent = function(method) {
        if (method === 'onchange' || method === 'onafterchanges' ||
                method === 'onresizecolumn' || method === 'onresizerow') {
            sync();
        } else if (method === 'oninsertrow' || method === 'ondeleterow' ||
                method === 'onmoverow' || method === 'onsort' ||
                method === 'onundo' || method === 'onredo') {
            purge();
        }
    }

    return plugin;
});


/**
 * Create the extension
 * @param {object} extension options
 */
const P = (function(opt) {
    if (opt) {
        if (opt.columns) {
            config.columns = opt.columns;
        }
        if (opt.width) {
            config.width = opt.width;
        }
        if (typeof opt.editable === 'boolean') {
            config.editable = opt.editable;
        }
        if (typeof opt.readonly === 'boolean') {
            config.readonly = opt.readonly;
        }
        if (typeof opt.daywidth === 'number') {
            config.daywidth = opt.daywidth;
        }
        if (typeof opt.resizable === 'boolean') {
            config.resizable = opt.resizable;
        }
        if (opt.snap) {
            config.snap = opt.snap;
        }
    }

    return true;
});

/**
 * on create spreadsheet
 */
P.oninit = function(spreadsheet, options) {
    spreadsheet.setPlugins({
        ganttChart: ganttChart
    });
}

P.license = function(v) {
    // No premium gate for this extension
}

export default P;
