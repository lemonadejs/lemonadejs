/**
 * Report extension for the JSS data grid — HTML piping / mail-merge.
 *
 * Give it an HTML template (an invoice, a letter, a certificate…) with
 * {{placeholders}}, and every spreadsheet row fills one copy of the
 * template — each row becomes ONE PAGE of a PDF generated locally in
 * the browser by the Editor block's zero-dependency writer. No server.
 *
 * Placeholders resolve against the row, most specific first:
 *   {{Client}}   a column by its TITLE (case-insensitive)
 *   {{A}} {{BC}} a column by its letter
 *   {{#}}        the 1-based row number (invoice counters)
 * Values are HTML-escaped; the TEMPLATE is your HTML, the DATA is text.
 *
 * ES module: import it and pass it to jspreadsheet.setExtensions({ report }).
 *
 *   jspreadsheet.setExtensions({ report });
 *   const spreadsheet = jspreadsheet(el, { worksheets: [...] });
 *   // every worksheet row → one PDF page, downloaded locally:
 *   report.toPdf(spreadsheet[0], template, { filename: 'invoices.pdf' });
 *   // or inspect the merged HTML first:
 *   const html = report.merge(spreadsheet[0], template);
 */
import { htmlToPdf, downloadPDF } from '@lemonadejs/editor';

/** 0-based column index → spreadsheet letter (0=A, 26=AA) */
const columnLetter = function(index) {
    let out = '';
    let n = index;
    while (n >= 0) {
        out = String.fromCharCode(65 + (n % 26)) + out;
        n = Math.floor(n / 26) - 1;
    }
    return out;
};

/** spreadsheet letter → 0-based column index, or null */
const letterIndex = function(key) {
    if (!/^[A-Z]+$/i.test(key)) {
        return null;
    }
    let n = 0;
    for (const ch of key.toUpperCase()) {
        n = n * 26 + (ch.charCodeAt(0) - 64);
    }
    return n - 1;
};

const escapeHtml = function(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

/** Column titles from the worksheet definition (empty where untitled) */
const titlesOf = function(worksheet) {
    const columns = (worksheet.options && worksheet.options.columns) || [];
    return columns.map(function(column) {
        return (column && column.title ? String(column.title) : '').toLowerCase();
    });
};

/** One filled template: {{Title}} → cell by header, {{A}} → by letter, {{#}} → row number */
const fill = function(template, values, titles, rowNumber) {
    return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, function(match, key) {
        if (key === '#') {
            return String(rowNumber);
        }
        const byTitle = titles.indexOf(key.toLowerCase());
        if (byTitle !== -1) {
            return escapeHtml(values[byTitle]);
        }
        const byLetter = letterIndex(key);
        if (byLetter !== null && byLetter < values.length) {
            return escapeHtml(values[byLetter]);
        }
        return '';
    });
};

const rowIsEmpty = function(values) {
    return values.every(function(value) {
        return value === '' || value === null || value === undefined;
    });
};

/** Rows to merge: options.rows (indexes) or every non-empty data row.
 *  PROCESSED values — the template receives what the user sees
 *  ($240.00, 2026-07-01), not the raw serials behind masks. */
const recordsOf = function(worksheet, options) {
    let data = null;
    try {
        data = worksheet.getData(false, true); // (highlighted, processed)
    } catch (e) {
        // older engines without the processed flag
    }
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
        data = worksheet.getData();
    }
    const wanted = options && options.rows;
    const records = [];
    for (let index = 0; index < data.length; index++) {
        if (wanted ? wanted.indexOf(index) !== -1 : !rowIsEmpty(data[index])) {
            records.push({ values: data[index], number: index + 1 });
        }
    }
    return records;
};

const PAGE_BREAK = '<div style="page-break-before: always"></div>';

/**
 * Merge the template against the worksheet — the piped HTML, one copy
 * per row, separated by explicit page breaks.
 */
const merge = function(worksheet, template, options) {
    const titles = titlesOf(worksheet);
    return recordsOf(worksheet, options)
        .map(function(record) {
            return fill(template, record.values, titles, record.number);
        })
        .join(PAGE_BREAK);
};

/** The merged document as PDF bytes (Uint8Array) — no download */
const toBytes = function(worksheet, template, options) {
    return htmlToPdf(merge(worksheet, template, options), options || {});
};

/** Merge + download: every row one page of a locally generated PDF */
const toPdf = function(worksheet, template, options) {
    const o = options || {};
    return downloadPDF(merge(worksheet, template, o), o.filename || 'report.pdf', o);
};

/**
 * Per-spreadsheet plugin: exposes the same api bound to the instance
 * (first worksheet by default) via spreadsheet.plugins.report
 */
const reportPlugin = (function(spreadsheet) {
    const plugin = {};

    const resolve = function(worksheet) {
        return worksheet || (spreadsheet.worksheets && spreadsheet.worksheets[0]) || spreadsheet;
    };

    plugin.merge = function(template, options, worksheet) {
        return merge(resolve(worksheet), template, options);
    };

    plugin.toBytes = function(template, options, worksheet) {
        return toBytes(resolve(worksheet), template, options);
    };

    plugin.toPdf = function(template, options, worksheet) {
        return toPdf(resolve(worksheet), template, options);
    };

    return plugin;
});

/**
 * The extension object for jspreadsheet.setExtensions({ report })
 */
const P = function() {
    return true;
};

P.oninit = function(spreadsheet) {
    spreadsheet.setPlugins({
        report: reportPlugin,
    });
};

// Static helpers — usable without the plugin wiring
P.merge = merge;
P.toBytes = toBytes;
P.toPdf = toPdf;

export default P;
