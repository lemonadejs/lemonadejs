/**
 * Charts extension for the JSS data grid — LemonadeJS v6.
 *
 * @lemonadejs/charts renders the charts (zero dependencies, CSS/SVG — no
 * canvas, no redraw loop). Each chart media record owns a set of live
 * stores; sheet edits reassign them and only the dependent bindings
 * re-render.
 *
 * The editor mirrors the original ChartJS extension panel: a right-side
 * Modal with Configuration / Styling tabs, the JSS.picker range field,
 * a Labels field selector and Series picked through field dropdowns
 * (add/remove) — with LIVE preview; Save persists to the media record,
 * Cancel/close restores.
 *
 * Charts are jss MEDIA records (floating, movable, resizable):
 *   worksheet.setMedia({ type: 'chart', top, left, width, height,
 *       options: { type: 'column', range: 'A1:C5', title: '' } })
 *
 * options: { type, range, orientation (0 horizontal | 1 vertical),
 *   headers, labels ('auto' | 'none' | field index), datasets ([field
 *   indexes] | null = auto), title, subtitle, legend, legendposition,
 *   gridlines, palette }
 *
 * ES module: import it and pass it to jspreadsheet.setExtensions({ charts }).
 */
import { html, mount, store } from 'lemonadejs';
import Modal from '@lemonadejs/modal';
import Chart from '@lemonadejs/charts';
import Dropdown from '@lemonadejs/dropdown';
import Switch from '@lemonadejs/switch';

let JSS = null;

const T = function(t) {
    if (typeof(document) !== 'undefined' && document.dictionary) {
        return document.dictionary[t] || t;
    }
    return t;
}

// jss chart types -> block props (both hyphenated and legacy spellings)
const TYPES = {
    'line': { type: 'line' },
    'area': { type: 'line', area: true },
    'stacked-area': { type: 'stackedarea' },
    'percent-area': { type: 'stackedarea', stackmode: 'percent' },
    'bar': { type: 'bar', horizontal: true },
    'stacked-bar': { type: 'stackedbar', horizontal: true },
    'percent-bar': { type: 'stackedbar', stackmode: 'percent', horizontal: true },
    'column': { type: 'bar' },
    'stacked-column': { type: 'stackedbar' },
    'percent-column': { type: 'stackedbar', stackmode: 'percent' },
    'pie': { type: 'pie' },
    'doughnut': { type: 'pie', innerradius: 55 },
    'scatter': { type: 'scatter' },
    'radar': { type: 'radar' },
    'filled-radar': { type: 'radar', area: true },
    'histogram': { type: 'histogram' },
    'pareto': { type: 'pareto' },
    // legacy unhyphenated spellings
    'stackedarea': { type: 'stackedarea' },
    'percentarea': { type: 'stackedarea', stackmode: 'percent' },
    'stackedbar': { type: 'stackedbar', horizontal: true },
    'percentbar': { type: 'stackedbar', stackmode: 'percent', horizontal: true },
    'stackedcolumn': { type: 'stackedbar' },
    'percentcolumn': { type: 'stackedbar', stackmode: 'percent' },
    'filledradar': { type: 'radar', area: true },
    'bubble': { type: 'bubble' },
};

// The type dropdown — the original extension's grouped list
const TYPEGROUPS = [
    ['Line', [['line', 'Line']]],
    ['Area', [['area', 'Area Chart'], ['stacked-area', 'Stacked Area Chart'], ['percent-area', '100% Stacked Area Chart']]],
    ['Bar', [['bar', 'Bar Chart'], ['stacked-bar', 'Stacked Bar Chart'], ['percent-bar', '100% Stacked Bar Chart']]],
    ['Column', [['column', 'Column Chart'], ['stacked-column', 'Stacked Column Chart'], ['percent-column', '100% Stacked Column Chart']]],
    ['Pie', [['pie', 'Pie'], ['doughnut', 'Doughnut']]],
    ['Scatter', [['scatter', 'Scatter']]],
    ['Radar', [['radar', 'Radar'], ['filled-radar', 'Filled radar']]],
    ['Other', [['histogram', 'Histogram'], ['pareto', 'Pareto']]],
];

const isNumeric = function(v) {
    return v !== '' && v !== null && typeof v !== 'boolean' && isFinite(v);
}

const rangeCoords = function(worksheet, range) {
    if (range.indexOf('!') !== -1) {
        const parts = range.split('!');
        if (worksheet.parent && worksheet.parent.getWorksheetInstanceByName) {
            worksheet = worksheet.parent.getWorksheetInstanceByName(parts[0]) || worksheet;
        }
        range = parts[1];
    }
    if (range.indexOf(':') === -1) {
        range = range + ':' + range;
    }
    const cells = range.split(':');
    const a = worksheet.helpers.getCoordsFromColumnName(cells[0]);
    const b = worksheet.helpers.getCoordsFromColumnName(cells[1]);
    return {
        worksheet: worksheet,
        x1: Math.min(a[0], b[0]),
        x2: Math.max(a[0], b[0]),
        y1: Math.min(a[1], b[1]),
        y2: Math.max(a[1], b[1]),
    };
}

/**
 * The editable model for a range: the FIELDS (columns when vertical,
 * rows when horizontal) with their labels — header value or the field's
 * own range (like the original) — plus the automatic labels/datasets.
 */
const analyze = function(worksheet, options) {
    const c = rangeCoords(worksheet, options.range);
    const vertical = options.orientation !== 0; // default: series in columns

    let grid = [];
    for (let y = c.y1; y <= c.y2; y++) {
        const row = [];
        for (let x = c.x1; x <= c.x2; x++) {
            row.push(c.worksheet.getValueFromCoords(x, y));
        }
        grid.push(row);
    }
    if (! vertical) {
        grid = grid[0].map(function(cell, x) {
            return grid.map(function(row) {
                return row[x];
            });
        });
    }
    if (! grid.length || ! grid[0].length) {
        return null;
    }

    const width = grid[0].length;
    const headers = typeof options.headers === 'boolean' ?
        options.headers :
        grid.length > 1 && grid[0].some(function(v, i) {
            return (width === 1 || i > 0) && v !== '' && v !== null && ! isNumeric(v);
        });
    const body = headers ? grid.slice(1) : grid;

    // 'B2:B5' style identity for headerless fields
    const span = function(i) {
        const h = c.worksheet.helpers;
        if (vertical) {
            return h.getCellNameFromCoords(c.x1 + i, c.y1 + (headers ? 1 : 0)) + ':' +
                h.getCellNameFromCoords(c.x1 + i, c.y2);
        }
        return h.getCellNameFromCoords(c.x1 + (headers ? 1 : 0), c.y1 + i) + ':' +
            h.getCellNameFromCoords(c.x2, c.y1 + i);
    }

    const fields = [];
    for (let i = 0; i < width; i++) {
        const data = body.map(function(row) {
            return row[i];
        });
        fields.push({
            index: i,
            label: headers && grid[0][i] != null && grid[0][i] !== '' ? String(grid[0][i]) : span(i),
            data: data,
            numeric: data.some(isNumeric),
        });
    }

    let autoLabels = 'none';
    for (let i = 0; i < fields.length; i++) {
        if (! fields[i].numeric) {
            autoLabels = i;
            break;
        }
    }
    const autoDatasets = fields.filter(function(f) {
        return f.numeric && f.index !== autoLabels;
    }).map(function(f) {
        return f.index;
    });

    return { fields: fields, headers: headers, autoLabels: autoLabels, autoDatasets: autoDatasets, rows: body.length };
}

/** options -> { series, categories } for the chart block */
const resolve = function(worksheet, options) {
    const a = analyze(worksheet, options);
    if (! a) {
        return { series: [], categories: [] };
    }
    const labelsSel = options.labels === undefined || options.labels === 'auto' ? a.autoLabels : options.labels;
    const labelsIndex = labelsSel === 'none' ? null : labelsSel;

    let datasets = Array.isArray(options.datasets) && options.datasets.length ? options.datasets : a.autoDatasets;
    datasets = datasets.filter(function(i) {
        return a.fields[i] && i !== labelsIndex;
    });

    const categories = labelsIndex != null && a.fields[labelsIndex] ?
        a.fields[labelsIndex].data.map(function(v) {
            return String(v == null ? '' : v);
        }) :
        (a.fields[0] ? a.fields[0].data.map(function(v, i) {
            return String(i + 1);
        }) : []);

    const series = datasets.map(function(i) {
        return {
            name: a.fields[i].label,
            data: a.fields[i].data.map(function(v) {
                return isNumeric(v) ? parseFloat(v) : 0;
            }),
        };
    });

    return { series: series, categories: categories, analysis: a };
}

/**
 * Create a plugin object
 * @param {object} spreadsheet object.
 * @param {object} plugin options
 */
const pluginChart = (function(spreadsheet) {

    // Living charts by media record id
    const charts = new Map();
    let queued = false;

    // ---- one living chart per media record: live stores in, block renders
    const createChart = function(worksheet, record) {
        const type = store('bar');
        const series = store([]);
        const categories = store([]);
        const title = store('');
        const subtitle = store('');
        const horizontal = store(false);
        const area = store(false);
        const innerradius = store(0);
        const stackmode = store('normal');
        const legend = store(true);
        const legendposition = store('');
        const gridlines = store(true);
        const palette = store('lemonade');

        const View = function() {
            return html`<${Chart} type="${type}" series="${series}" categories="${categories}"
                title="${title}" subtitle="${subtitle}" horizontal="${horizontal}" area="${area}"
                innerradius="${innerradius}" stackmode="${stackmode}"
                legend="${legend}" legendposition="${legendposition}" gridlines="${gridlines}"
                palette="${palette}" height="100%" animate="${false}" />`;
        }

        const chart = {};

        // jss hands a FRESH record object on onchangemedia — never keep
        // the construction-time one
        chart.setRecord = function(r) {
            record = r;
        }

        chart.record = function() {
            return record;
        }

        /** Render from the given options (live preview) or the record's */
        chart.update = function(o) {
            o = o || record.options || {};
            const t = TYPES[o.type] || { type: o.type || 'bar' };
            type.value = t.type;
            horizontal.value = !! t.horizontal;
            area.value = !! t.area;
            innerradius.value = t.innerradius || 0;
            stackmode.value = t.stackmode || 'normal';
            title.value = o.title || '';
            subtitle.value = o.subtitle || '';
            legend.value = o.legend !== false;
            legendposition.value = o.legendposition || '';
            gridlines.value = o.gridlines !== false;
            palette.value = o.palette || 'lemonade';
            if (o.range) {
                const d = resolve(worksheet, o);
                series.value = d.series;
                categories.value = d.categories;
            }
        }

        record.el.classList.add('jss_charts');
        record.el.addEventListener('dblclick', function() {
            if (worksheet.isEditable()) {
                openPanel(worksheet, null, chart.record());
            }
        });
        const handle = mount(View, record.el);

        chart.destroy = function() {
            handle.unmount();
        }

        return chart;
    }

    const initComponent = function(worksheet, record) {
        let chart = charts.get(record.id);
        if (! chart) {
            chart = createChart(worksheet, record);
            charts.set(record.id, chart);
        } else {
            chart.setRecord(record);
        }
        try {
            chart.update();
            record.el.classList.remove('jss_charts_error');
        } catch (e) {
            record.el.classList.add('jss_charts_error');
        }
    }

    /** Sheet changed: re-read every chart's range (microtask-deduped) */
    const refresh = function() {
        if (queued) {
            return;
        }
        queued = true;
        queueMicrotask(function() {
            queued = false;
            charts.forEach(function(chart) {
                chart.update();
            });
        });
    }

    // ---- the editor panel
    const dlgOpen = store(false);
    const dlgHeading = store('');
    const dlgTab = store(0);
    const dlgType = store('column');
    const dlgRange = store('');
    const dlgOrientation = store('1');
    const dlgHeaders = store(true);
    const dlgLabels = store('auto');
    const dlgDatasets = store([]);
    const dlgFields = store([]);
    const dlgTitle = store('');
    const dlgSubtitle = store('');
    const dlgLegend = store(true);
    const dlgLegendPosition = store('');
    const dlgGridlines = store(true);
    const dlgPalette = store('lemonade');
    // Dropdown item lists + the orientation-dependent switch label live in
    // stores: component props only stay live when they receive a store
    // (an inline arrow is kept as a FUNCTION value, not a binding)
    const dlgFieldItems = store([]);
    const dlgLabelItems = store([]);
    const dlgHeadersText = store('');
    let dlgWorksheet = null;
    let dlgRecord = null;
    let pickerEl = null;

    const syncHeadersText = function() {
        dlgHeadersText.value = T(dlgOrientation.value === '0' ?
            'Use the first column as headers' : 'Use the first row as headers');
    }

    const collect = function() {
        return {
            type: dlgType.value,
            range: dlgRange.value,
            orientation: parseInt(dlgOrientation.value),
            headers: dlgHeaders.value,
            labels: dlgLabels.value === 'auto' || dlgLabels.value === 'none' ? dlgLabels.value : parseInt(dlgLabels.value),
            datasets: dlgDatasets.value.slice(),
            title: dlgTitle.value,
            subtitle: dlgSubtitle.value,
            legend: dlgLegend.value,
            legendposition: dlgLegendPosition.value,
            gridlines: dlgGridlines.value,
            palette: dlgPalette.value,
        };
    }

    /** Recompute the field list; reset labels/datasets to the automatic
     *  picks unless `keep` (initial open with saved selections) */
    const loadFields = function(keep) {
        let a = null;
        if (dlgRange.value) {
            try {
                a = analyze(dlgWorksheet, {
                    range: dlgRange.value,
                    orientation: parseInt(dlgOrientation.value),
                    headers: dlgHeaders.value,
                });
            } catch (e) {
            }
        }
        if (! a) {
            dlgFields.value = [];
            dlgDatasets.value = [];
            dlgFieldItems.value = [];
            dlgLabelItems.value = [
                { value: 'auto', text: T('Automatic') },
                { value: 'none', text: T('None') },
            ];
            return;
        }
        dlgFields.value = a.fields.map(function(f) {
            return { index: f.index, label: f.label, numeric: f.numeric };
        });
        dlgFieldItems.value = a.fields.map(function(f) {
            return { value: String(f.index), text: f.label };
        });
        dlgLabelItems.value = [
            { value: 'auto', text: T('Automatic') },
            { value: 'none', text: T('None') },
        ].concat(dlgFieldItems.value);
        if (! keep) {
            dlgLabels.value = 'auto';
            dlgDatasets.value = a.autoDatasets.slice();
        } else {
            // Drop selections that fell outside the new range
            dlgDatasets.value = dlgDatasets.value.filter(function(i) {
                return i < a.fields.length;
            });
        }
    }

    /** Live preview on the edited chart */
    const changed = function() {
        if (dlgRecord) {
            const chart = charts.get(dlgRecord.id);
            if (chart) {
                try {
                    chart.update(collect());
                } catch (e) {
                    // mid-edit ranges can be invalid; keep the last good paint
                }
            }
        }
    }

    const rangeChanged = function(value) {
        dlgRange.value = value;
        loadFields(false);
        changed();
    }

    const openPanel = function(worksheet, range, record) {
        dlgWorksheet = worksheet;
        dlgRecord = record || null;
        dlgHeading.value = T(record ? 'Chart settings' : 'Insert chart');
        dlgTab.value = 0;
        const o = record && record.options || {};
        dlgType.value = o.type || 'column';
        dlgRange.value = o.range || range || '';
        dlgOrientation.value = String(typeof o.orientation === 'number' ? o.orientation : 1);
        dlgHeaders.value = typeof o.headers === 'boolean' ? o.headers : true;
        dlgLabels.value = o.labels === undefined ? 'auto' : String(o.labels);
        dlgDatasets.value = Array.isArray(o.datasets) ? o.datasets.slice() : [];
        dlgTitle.value = o.title || '';
        dlgSubtitle.value = o.subtitle || '';
        dlgLegend.value = o.legend !== false;
        dlgLegendPosition.value = o.legendposition || '';
        dlgGridlines.value = o.gridlines !== false;
        dlgPalette.value = o.palette || 'lemonade';
        loadFields(true);
        if (! dlgDatasets.value.length) {
            loadFields(false);
            dlgLabels.value = o.labels === undefined ? 'auto' : String(o.labels);
        }
        syncHeadersText();
        if (pickerEl) {
            pickerEl.innerText = dlgRange.value;
        }
        dlgOpen.value = true;
    }

    const closePanel = function(restore) {
        if (restore && dlgRecord) {
            const chart = charts.get(dlgRecord.id);
            if (chart) {
                chart.update();
            }
        }
        dlgRecord = null;
        dlgOpen.value = false;
    }

    const save = function() {
        if (! dlgRange.value) {
            return;
        }
        const options = collect();
        if (options.range.indexOf(':') === -1 && options.range.indexOf('!') === -1) {
            options.range = options.range + ':' + options.range;
        }
        if (dlgRecord) {
            // Geometry travels with the update (jss media positions by top/left)
            dlgWorksheet.setMedia([{
                id: dlgRecord.id,
                top: dlgRecord.top,
                left: dlgRecord.left,
                width: dlgRecord.width,
                height: dlgRecord.height,
                options: options,
            }]);
        } else {
            dlgWorksheet.setMedia({ type: 'chart', top: 20, left: 20, width: 420, height: 300, options: options });
        }
        dlgRecord = null;
        dlgOpen.value = false;
    }

    const createPicker = function(el) {
        pickerEl = el;
        el.innerText = dlgRange.value;
        JSS.picker(el, {
            type: 'picker',
            onchange: function(v) {
                rangeChanged(v);
            }
        });
    }

    const addSeries = function() {
        const fields = dlgFields.value;
        if (! fields.length) {
            return;
        }
        const used = dlgDatasets.value;
        const labels = dlgLabels.value;
        const free = function(f) {
            return used.indexOf(f.index) === -1 && String(f.index) !== labels;
        }
        // Prefer an unused NUMERIC field (never the labels pick)
        const next = fields.find(function(f) {
            return free(f) && f.numeric;
        }) || fields.find(free) || fields[0];
        dlgDatasets.value = used.concat([next.index]);
        changed();
    }

    const Panel = function() {
        // grouped chart-type list for the Dropdown (v5 optgroup look)
        const typeItems = TYPEGROUPS.flatMap(function(g) {
            return g[1].map(function(t) {
                return { value: t[0], text: T(t[1]), group: T(g[0]) };
            });
        });
        const orientationItems = [
            { value: '1', text: T('Vertical') },
            { value: '0', text: T('Horizontal') },
        ];
        const legendPositionItems = [
            { value: '', text: T('Automatic') },
            { value: 'top', text: T('Top') },
            { value: 'bottom', text: T('Bottom') },
            { value: 'left', text: T('Left') },
            { value: 'right', text: T('Right') },
        ];
        const paletteItems = [
            { value: 'lemonade', text: T('Lemonade') },
            { value: 'classic', text: T('Classic') },
            { value: 'category10', text: T('Category 10') },
        ];
        const removeIcon = () => html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>`;

        return html`<${Modal} bind="${dlgOpen}" title="${dlgHeading}" position="right" closable="${true}" width="${380}" focus="${false}" onclose="${() => closePanel(true)}">
            <div class="jss_charts_panel">
                <div class="jss_charts_tabs">
                    <div class="${() => 'jss_charts_tab' + (dlgTab.value === 0 ? ' selected' : '')}" onclick="${() => { dlgTab.value = 0; }}">${T('Configuration')}</div>
                    <div class="${() => 'jss_charts_tab' + (dlgTab.value === 1 ? ' selected' : '')}" onclick="${() => { dlgTab.value = 1; }}">${T('Styling')}</div>
                </div>

                <div style="${() => dlgTab.value === 0 ? '' : 'display: none'}">
                    <div class="jss_charts_cols">
                        <div>
                            <label class="jss_charts_label">${T('Chart type')}</label>
                            <${Dropdown} data="${typeItems}" bind="${dlgType}" onchange="${changed}" />
                        </div>
                        <div>
                            <label class="jss_charts_label">${T('Data orientation')}</label>
                            <${Dropdown} data="${orientationItems}" bind="${dlgOrientation}"
                                onchange="${() => { syncHeadersText(); loadFields(false); changed(); }}" />
                        </div>
                    </div>

                    <label class="jss_charts_label">${T('Data range')}</label>
                    <div class="jss_charts_picker" ref="${createPicker}"></div>

                    <label class="jss_charts_label">${T('Labels')}</label>
                    <${Dropdown} data="${dlgLabelItems}" bind="${dlgLabels}" onchange="${changed}" />

                    <label class="jss_charts_label">${T('Series')}</label>
                    <div class="jss_charts_series">
                        ${() => dlgDatasets.value.map(function(sel, i) {
                            return html`<div class="jss_charts_serie">
                                <${Dropdown} data="${dlgFieldItems}" bind="${String(sel)}"
                                    onchange="${(v) => { const n = parseInt(v); if (isNaN(n)) { return; } const d = dlgDatasets.value.slice(); d[i] = n; dlgDatasets.value = d; changed(); }}" />
                                <button type="button" class="jss_charts_remove" title="${T('Remove this series')}"
                                    onclick="${() => { const d = dlgDatasets.value.slice(); d.splice(i, 1); dlgDatasets.value = d; changed(); }}">${removeIcon()}</button>
                            </div>`;
                        })}
                    </div>
                    <div>
                        <button type="button" class="jss_charts_add" onclick="${addSeries}">${T('Add new series')}</button>
                    </div>

                    <div class="jss_charts_switch">
                        <${Switch} label="${dlgHeadersText}" bind="${dlgHeaders}"
                            onchange="${() => { loadFields(false); changed(); }}" />
                    </div>
                </div>

                <div style="${() => dlgTab.value === 1 ? '' : 'display: none'}">
                    <label class="jss_charts_label">${T('Chart title')}</label>
                    <input type="text" class="jss_charts_input jss_charts_ctl_title" bind="${dlgTitle}" onchange="${changed}" oninput="${changed}" />

                    <label class="jss_charts_label">${T('Chart subtitle')}</label>
                    <input type="text" class="jss_charts_input jss_charts_ctl_subtitle" bind="${dlgSubtitle}" onchange="${changed}" oninput="${changed}" />

                    <div class="jss_charts_cols">
                        <div>
                            <label class="jss_charts_label">${T('Legend position')}</label>
                            <${Dropdown} data="${legendPositionItems}" bind="${dlgLegendPosition}" onchange="${changed}" />
                        </div>
                        <div>
                            <label class="jss_charts_label">${T('Color palette')}</label>
                            <${Dropdown} data="${paletteItems}" bind="${dlgPalette}" onchange="${changed}" />
                        </div>
                    </div>

                    <div class="jss_charts_row">
                        <div class="jss_charts_switch"><${Switch} label="${T('Show legend')}" bind="${dlgLegend}" onchange="${changed}" /></div>
                        <div class="jss_charts_switch"><${Switch} label="${T('Gridlines')}" bind="${dlgGridlines}" onchange="${changed}" /></div>
                    </div>
                </div>

                <div class="jss_charts_buttons">
                    <button type="button" class="jss_charts_btn jss_charts_btn_primary" onclick="${save}">${T('Save')}</button>
                    <button type="button" class="jss_charts_btn" onclick="${() => closePanel(true)}">${T('Cancel')}</button>
                </div>
            </div>
        </${Modal}>`;
    }

    // Plugin object
    const plugin = {}

    plugin.init = function(worksheet) {
        const media = worksheet.options.media;
        if (media) {
            media.forEach(function(record) {
                if (record.type === 'chart') {
                    initComponent(worksheet, record);
                }
            });
        }
    }

    plugin.onevent = function(event, worksheet, a, b, c) {
        if (event === 'onchangemedia') {
            const newValue = a;
            const affectedRecords = c;
            newValue.forEach(function(value, index) {
                const record = affectedRecords[index];
                if (record.type !== 'chart') {
                    return;
                }
                // Only an id means the record was deleted
                if (Object.keys(value).length === 1) {
                    const chart = charts.get(record.id);
                    if (chart) {
                        chart.destroy();
                        charts.delete(record.id);
                    }
                } else {
                    initComponent(worksheet, record);
                }
            });
        } else if (event === 'onchange' || event === 'onafterchanges' ||
                event === 'oninsertrow' || event === 'ondeleterow' ||
                event === 'oninsertcolumn' || event === 'ondeletecolumn' ||
                event === 'onsort' || event === 'onundo' || event === 'onredo') {
            refresh();
        }
    }

    plugin.toolbar = function(toolbar) {
        toolbar.items.push({
            content: 'addchart',
            type: 'i',
            tooltip: T('Insert chart'),
            onclick: function() {
                let range = JSS.current.getRange();
                if (range) {
                    range = range.split('!')[1] || range;
                }
                openPanel(JSS.current, range);
            },
            updateState: function(a, b, c, d) {
                if (d.isEditable()) {
                    c.classList.remove('jtoolbar-disabled');
                } else {
                    c.classList.add('jtoolbar-disabled');
                }
            }
        });

        return toolbar;
    }

    plugin.contextMenu = function(obj, x, y, e, items, section) {
        if (x != null && y != null) {
            items.push({ type: 'line' });
            items.push({
                title: T('Insert chart'),
                icon: 'addchart',
                onclick: function() {
                    let range = obj.getRange();
                    if (range) {
                        range = range.split('!')[1] || range;
                    }
                    openPanel(obj, range);
                }
            });
        }
        return items;
    }

    // Mount the panel once per spreadsheet
    const container = document.createElement('div');
    spreadsheet.tools.appendChild(container);
    mount(Panel, container);

    return plugin;
});


/**
 * Create the extension
 * @param {object} extension options
 */
const P = (function(opt) {
    return true;
});

/**
 * on create spreadsheet
 */
P.oninit = function(spreadsheet, options) {
    spreadsheet.setPlugins({
        charts: pluginChart
    });
}

P.license = function(v) {
    // Jspreadsheet binding
    if (JSS === null) {
        JSS = this;
    }
}

export default P;
