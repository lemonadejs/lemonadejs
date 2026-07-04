/**
 * <Editor /> — a rich text editor built ON the Toolbar block (the bar is
 * a dependency, not a fork: the editor drives it through live item
 * mutations + api.refresh()). Contenteditable engine, semantic HTML out.
 *
 *   - formatting: block styles (paragraph, headings, quote, code), bold /
 *     italic / underline / strikethrough, sub / superscript, text and
 *     highlight colors (the Color block panel, hosted by the Toolbar's
 *     color items), alignment, ordered / unordered lists, indent /
 *     outdent, links (inline balloon), inline images (file picker, paste
 *     and drop — stored as data URLs), horizontal rule, clear
 *     formatting, fullscreen
 *   - images are objects: click one for drag-resize — corner handles
 *     keep the aspect ratio, edge handles stretch width or height
 *     independently — and an alignment menu: wrap left / center / wrap
 *     right / inline, full width, remove; Delete removes the selection
 *   - tables, CKEditor-style: a hover grid picker inserts; a floating
 *     balloon over the active table carries Row / Column / Cell menus
 *     (insert above/below/left/right, header row/column, delete), cell
 *     merge (drag across cells to select, or merge right/down), split,
 *     cell background color and table delete. Column boundaries, row
 *     boundaries and the table edge grow DRAG HANDLES for resizing —
 *     widths land on the colgroup, so they survive as plain HTML.
 *   - own undo/redo stack (snapshots, typing coalesced) — structural
 *     table surgery is undoable, which native execCommand undo never was
 *   - paste is sanitized to a semantic subset (Word/Docs noise dropped,
 *     script vectors removed) — raw paste with filterpaste="false"
 *   - output extensions, all local to the browser: DIRECT PDF generation
 *     (api.exportPDF — the built-in zero-dependency writer lays the
 *     content out and downloads real selectable-text PDF bytes), print
 *     through a staged print document (api.print), and Word export as an
 *     MHTML .doc download (api.exportWord)
 *
 * Two-way value: bind carries the HTML (onchange fires per input); the
 * value prop seeds an unbound editor.
 */

import { component, html } from 'lemonadejs';
import Toolbar, { type ToolbarItem } from '@lemonadejs/toolbar';
import { prettyHtml, sanitize } from './clean';
import {
    buildGrid, cellPosition, columnCount, createTable, deleteColumn, deleteRow,
    ensureColgroup, insertColumn, insertRow, mergeCells, selectionRect, splitCell,
    toggleHeaderColumn, toggleHeaderRow,
} from './table';
import { downloadWord, printHTML, type PrintOptions } from './exporters';
import { downloadPDF, type PdfOptions } from './pdf';

export type { PrintOptions, PdfOptions };
export { sanitize, prettyHtml } from './clean';
export { htmlToPdf, downloadPDF } from './pdf';

type BarApi = { open(index: number): void; close(): void; refresh(): void };

const BLOCKS: [string, string][] = [
    ['Paragraph', 'p'],
    ['Heading 1', 'h1'],
    ['Heading 2', 'h2'],
    ['Heading 3', 'h3'],
    ['Quote', 'blockquote'],
    ['Code', 'pre'],
];

const EDGE = 5; // px of tolerance around a table boundary before the resize handle appears
const GRID_ROWS = 8;
const GRID_COLS = 10;

export const Editor = component('editor', {
    bind: String, // two-way HTML content (the value prop seeds it when unbound)
    value: '', // initial HTML when unbound
    placeholder: '', // hint shown while the editor is empty
    toolbar: true, // false hides the formatting bar
    height: '', // CSS height of the writing area ('' grows with content)
    readonly: false, // true locks editing (toolbar disabled, content selectable)
    filterpaste: true, // sanitize pasted HTML to the semantic subset
    acceptimages: true, // paste / drop / pick images as inline data URLs
    onfocus: Function, // (e) the writing area gained focus
    onblur: Function, // (e) the writing area lost focus
    api: {
        getData: Function, setData: Function, getText: Function, exec: Function,
        focus: Function, insertTable: Function, undo: Function, redo: Function,
        toggleSource: Function, print: Function, exportPDF: Function, exportWord: Function,
    },
}, (props, { state, bind, onMount, listen }) => {
    let root: HTMLElement | null = null;
    let area: HTMLElement | null = null;
    let fileInput: HTMLInputElement | null = null;
    let sourceEl: HTMLTextAreaElement | null = null;
    let pendingSource = ''; // formatted HTML handed to the textarea on mount
    let bar: BarApi | null = null;

    const content = bind(props, (props.value.value as string) || '');
    const empty = state(true);
    const full = state(false);
    const source = state(false); // HTML source-editing mode
    const balloon = state({ on: false, top: 0, left: 0 });
    const grid = state({ on: false, top: 0, left: 0, rows: 0, cols: 0 });
    const link = state({ on: false, top: 0, left: 0 });
    const colHandle = state({ on: false, left: 0, top: 0, height: 0 });
    const rowHandle = state({ on: false, left: 0, top: 0, width: 0 });

    const readonly = () => props.readonly.value === true;
    const within = (node: Node | null | undefined): boolean => !!(node && area && area.contains(node));

    // ---- content pipeline -------------------------------------------------

    /** Content with editing artifacts (cell-selection marks) stripped.
     *  In source mode the textarea IS the content (filtered like paste). */
    const getData = (): string => {
        if (source.value && sourceEl) {
            return props.filterpaste.value !== false ? sanitize(sourceEl.value) : sourceEl.value;
        }
        if (!area) {
            return (content.value as string) || '';
        }
        const clone = area.cloneNode(true) as HTMLElement;
        for (const el of Array.from(clone.querySelectorAll('.lm-editor-cell-selected'))) {
            el.classList.remove('lm-editor-cell-selected');
            if (!el.getAttribute('class')) {
                el.removeAttribute('class');
            }
        }
        return clone.innerHTML;
    };

    const isEmpty = (): boolean =>
        !!area && !(area.textContent || '').trim() && !area.querySelector('img, table, hr');

    // Own undo model: innerHTML snapshots, typing coalesced by time,
    // structural ops (table surgery, paste, drops) snapshot individually.
    // Native execCommand undo cannot revert programmatic DOM surgery.
    let last = '';
    let undoStack: string[] = [];
    let redoStack: string[] = [];
    let lastPush = 0;

    const commit = (structural = false) => {
        if (!area) {
            return;
        }
        const raw = area.innerHTML;
        if (raw !== last) {
            const now = Date.now();
            if (structural || now - lastPush > 500) {
                undoStack.push(last);
                if (undoStack.length > 100) {
                    undoStack.shift();
                }
                redoStack = [];
                lastPush = now;
            }
            last = raw;
            content.set(getData()); // fires the owner's onchange
        }
        empty.value = isEmpty();
        refreshBar();
    };

    const restore = (snapshot: string) => {
        if (!area) {
            return;
        }
        area.innerHTML = snapshot;
        last = snapshot;
        content.set(getData());
        empty.value = isEmpty();
        hideTableUi();
        deselectImage();
        refreshBar();
    };

    const undo = () => {
        if (area && undoStack.length) {
            redoStack.push(area.innerHTML);
            restore(undoStack.pop()!);
        }
    };

    const redo = () => {
        if (area && redoStack.length) {
            undoStack.push(area.innerHTML);
            restore(redoStack.pop()!);
        }
    };

    const setData = (value: string) => {
        if (source.value && sourceEl) {
            sourceEl.value = prettyHtml(value || ''); // the open source view follows
        }
        if (area && area.innerHTML !== value) {
            area.innerHTML = value || '';
            commit(true);
        }
    };

    // ---- selection helpers ------------------------------------------------

    let saved: Range | null = null;

    const saveRange = () => {
        const sel = window.getSelection?.();
        if (sel && sel.rangeCount && within(sel.anchorNode)) {
            saved = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreRange = () => {
        if (saved) {
            const sel = window.getSelection?.();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(saved);
            }
        }
    };

    const insertNodeAtCaret = (node: Node) => {
        if (!area) {
            return;
        }
        const sel = window.getSelection?.();
        if (sel && sel.rangeCount && within(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            range.setStartAfter(node);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            area.appendChild(node);
        }
    };

    const insertHtmlAtCaret = (value: string) => {
        if (!area) {
            return;
        }
        const sel = window.getSelection?.();
        if (sel && sel.rangeCount && within(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const fragment = range.createContextualFragment(value);
            const lastNode = fragment.lastChild;
            range.insertNode(fragment);
            if (lastNode) {
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            area.insertAdjacentHTML('beforeend', value);
        }
    };

    const exec = (command: string, value?: string) => {
        if (readonly() || !area) {
            return;
        }
        area.focus();
        try {
            document.execCommand('styleWithCSS', false,
                command === 'foreColor' || command === 'hiliteColor' ? 'true' : 'false');
        } catch (e) { /* not every engine implements it */ }
        try {
            document.execCommand(command, false, value);
        } catch (e) { /* unknown command — nothing to apply */ }
        commit(true);
    };

    // ---- toolbar ------------------------------------------------------------

    const toggles: { item: ToolbarItem; command: string }[] = [];

    const toggle = (icon: string, tooltip: string, command: string): ToolbarItem => {
        const item: ToolbarItem = { icon, tooltip, onclick: () => exec(command) };
        toggles.push({ item, command });
        return item;
    };

    const undoItem: ToolbarItem = { icon: 'undo', tooltip: 'Undo (Ctrl+Z)', disabled: true, onclick: () => undo() };
    const redoItem: ToolbarItem = { icon: 'redo', tooltip: 'Redo (Ctrl+Y)', disabled: true, onclick: () => redo() };

    const blockItem: ToolbarItem = {
        type: 'select',
        title: 'Paragraph',
        tooltip: 'Block format',
        options: BLOCKS.map(([label, tag]) => ({
            title: label,
            onclick: () => exec('formatBlock', '<' + tag.toUpperCase() + '>'),
        })),
    };

    /** Source mode: the writing surface becomes the raw (pretty-printed)
     *  HTML; leaving applies it — filtered like paste — as one undo step */
    const applySource = () => {
        if (!sourceEl || !area) {
            return;
        }
        let value = sourceEl.value;
        if (props.filterpaste.value !== false) {
            value = sanitize(value);
        }
        area.innerHTML = value;
        commit(true);
    };

    const toggleSource = (on?: boolean) => {
        const next = on === undefined ? !source.value : !!on;
        if (next === source.value || readonly()) {
            return;
        }
        if (next) {
            hideTableUi();
            deselectImage();
            grid.value = { ...grid.value, on: false };
            link.value = { ...link.value, on: false };
            pendingSource = prettyHtml(getData());
            source.value = true; // mounts the textarea (ref hands it pendingSource)
            for (const item of items) {
                if (item !== sourceItem && item !== fullItem) {
                    item.disabled = true; // formatting has no meaning on raw text
                }
            }
            sourceItem.selected = true;
            bar?.refresh();
            queueMicrotask(() => sourceEl?.focus());
        } else {
            source.value = false; // unmount first: commit() must read the AREA
            applySource();
            sourceEl = null;
            for (const item of items) {
                if (item !== sourceItem && item !== fullItem) {
                    item.disabled = false;
                }
            }
            sourceItem.selected = false;
            bar?.refresh();
            refreshBar(); // undo/redo re-derive their disabled state
            area?.focus();
        }
    };

    const sourceItem: ToolbarItem = { icon: 'code', tooltip: 'Edit HTML source', onclick: () => toggleSource() };

    const fullItem: ToolbarItem = {
        icon: 'fullscreen',
        tooltip: 'Fullscreen',
        onclick: () => {
            full.value = !full.value;
            fullItem.icon = full.value ? 'fullscreen_exit' : 'fullscreen';
            fullItem.selected = full.value;
            bar?.refresh();
        },
    };

    const openGrid = (e: Event) => {
        saveRange();
        if (!root) {
            return;
        }
        const anchor = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const origin = root.getBoundingClientRect();
        grid.value = {
            on: !grid.value.on,
            left: Math.max(4, anchor.left - origin.left),
            top: anchor.bottom - origin.top + 6,
            rows: 0,
            cols: 0,
        };
    };

    const openLink = (e: Event) => {
        if (readonly() || !root) {
            return;
        }
        saveRange();
        const sel = window.getSelection?.();
        const rect = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
        const anchor = rect && (rect.width || rect.height || rect.top)
            ? rect
            : (e.currentTarget as HTMLElement).getBoundingClientRect();
        const origin = root.getBoundingClientRect();
        link.value = { on: true, left: Math.max(4, anchor.left - origin.left), top: anchor.bottom - origin.top + 6 };
        queueMicrotask(() => {
            const input = root?.querySelector('.lm-editor-link input') as HTMLInputElement | null;
            if (input) {
                const a = (sel && sel.anchorNode && within(sel.anchorNode))
                    ? (sel.anchorNode.nodeType === 1 ? (sel.anchorNode as Element) : sel.anchorNode.parentElement)?.closest('a')
                    : null;
                input.value = a?.getAttribute('href') || '';
                input.focus();
            }
        });
    };

    const applyLink = () => {
        const input = root?.querySelector('.lm-editor-link input') as HTMLInputElement | null;
        const url = (input?.value || '').trim();
        link.value = { ...link.value, on: false };
        area?.focus();
        restoreRange();
        if (!url) {
            exec('unlink');
            return;
        }
        exec('createLink', /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : 'https://' + url);
    };

    const insertImages = (files: FileList | File[]) => {
        if (readonly() || props.acceptimages.value === false) {
            return;
        }
        for (const file of Array.from(files)) {
            if (!/^image\//.test(file.type)) {
                continue;
            }
            const reader = new FileReader();
            reader.onload = () => {
                area?.focus();
                restoreRange();
                const img = document.createElement('img');
                img.src = reader.result as string;
                insertNodeAtCaret(img);
                saveRange();
                commit(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const items: ToolbarItem[] = [
        undoItem, redoItem,
        { type: 'divider' },
        blockItem,
        { type: 'divider' },
        toggle('format_bold', 'Bold (Ctrl+B)', 'bold'),
        toggle('format_italic', 'Italic (Ctrl+I)', 'italic'),
        toggle('format_underlined', 'Underline (Ctrl+U)', 'underline'),
        toggle('strikethrough_s', 'Strikethrough', 'strikeThrough'),
        toggle('subscript', 'Subscript', 'subscript'),
        toggle('superscript', 'Superscript', 'superscript'),
        { type: 'divider' },
        // the Color panel steals no selection (toolbar mousedown is
        // cancelled) but the range is kept across the popover anyway
        {
            type: 'color', icon: 'format_color_text', tooltip: 'Text color',
            onclick: () => saveRange(),
            onchange: (color) => {
                area?.focus();
                restoreRange();
                exec('foreColor', color);
            },
        },
        {
            type: 'color', icon: 'format_color_fill', tooltip: 'Highlight color',
            onclick: () => saveRange(),
            onchange: (color) => {
                area?.focus();
                restoreRange();
                exec('hiliteColor', color);
            },
        },
        { type: 'divider' },
        toggle('format_align_left', 'Align left', 'justifyLeft'),
        toggle('format_align_center', 'Align center', 'justifyCenter'),
        toggle('format_align_right', 'Align right', 'justifyRight'),
        toggle('format_align_justify', 'Justify', 'justifyFull'),
        { type: 'divider' },
        toggle('format_list_bulleted', 'Bulleted list', 'insertUnorderedList'),
        toggle('format_list_numbered', 'Numbered list', 'insertOrderedList'),
        { icon: 'format_indent_decrease', tooltip: 'Decrease indent', onclick: () => exec('outdent') },
        { icon: 'format_indent_increase', tooltip: 'Increase indent', onclick: () => exec('indent') },
        { type: 'divider' },
        { icon: 'link', tooltip: 'Insert link', onclick: openLink },
        { icon: 'link_off', tooltip: 'Remove link', onclick: () => exec('unlink') },
        { icon: 'image', tooltip: 'Insert image', onclick: () => { saveRange(); fileInput?.click(); } },
        { icon: 'grid_on', tooltip: 'Insert table', onclick: openGrid },
        { icon: 'horizontal_rule', tooltip: 'Horizontal line', onclick: () => exec('insertHorizontalRule') },
        { icon: 'format_clear', tooltip: 'Clear formatting', onclick: () => { exec('removeFormat'); exec('unlink'); } },
        { type: 'divider' },
        sourceItem,
        { icon: 'picture_as_pdf', tooltip: 'Export PDF', onclick: () => { downloadPDF(getData()); } },
        { icon: 'print', tooltip: 'Print', onclick: () => printHTML(getData()) },
        { icon: 'description', tooltip: 'Export to Word', onclick: () => downloadWord(getData()) },
        fullItem,
    ];

    const commandState = (command: string): boolean => {
        try {
            return !!document.queryCommandState?.(command);
        } catch (e) {
            return false;
        }
    };

    const refreshBar = () => {
        if (!bar || source.value) {
            return; // source mode owns the item states
        }
        const sel = window.getSelection?.();
        const inside = !!(sel && sel.anchorNode && within(sel.anchorNode));
        for (const entry of toggles) {
            entry.item.selected = inside && commandState(entry.command);
        }
        let block = '';
        if (inside) {
            try {
                block = String(document.queryCommandValue?.('formatBlock') || '').toLowerCase();
            } catch (e) { /* fine — label falls back to Paragraph */ }
        }
        const known = BLOCKS.find(([, tag]) => tag === block);
        blockItem.title = known ? known[0] : 'Paragraph';
        undoItem.disabled = !undoStack.length;
        redoItem.disabled = !redoStack.length;
        bar.refresh();
    };

    // ---- tables: active-cell tracking + balloon ----------------------------

    let currentTable: HTMLTableElement | null = null;
    let currentCell: HTMLTableCellElement | null = null;
    let selA: HTMLTableCellElement | null = null; // cell-selection rectangle ends
    let selB: HTMLTableCellElement | null = null;
    let selectedCells: HTMLTableCellElement[] = [];
    let dragAnchor: HTMLTableCellElement | null = null; // mouse-drag origin

    const cellOf = (node: Node | null | undefined): HTMLTableCellElement | null => {
        if (!node || !area) {
            return null;
        }
        const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
        const cell = el?.closest?.('td, th') as HTMLTableCellElement | null;
        return cell && area.contains(cell) ? cell : null;
    };

    const clearCellSelection = () => {
        for (const cell of selectedCells) {
            cell.classList.remove('lm-editor-cell-selected');
            if (!cell.getAttribute('class')) {
                cell.removeAttribute('class');
            }
        }
        selectedCells = [];
        selA = null;
        selB = null;
    };

    const hideTableUi = () => {
        currentTable = null;
        currentCell = null;
        clearCellSelection();
        if (balloon.value.on) {
            balloon.value = { ...balloon.value, on: false };
        }
        if (colHandle.value.on) {
            colHandle.value = { ...colHandle.value, on: false };
        }
        if (rowHandle.value.on) {
            rowHandle.value = { ...rowHandle.value, on: false };
        }
    };

    const positionBalloon = () => {
        if (!currentTable || !root || readonly()) {
            if (balloon.value.on) {
                balloon.value = { ...balloon.value, on: false };
            }
            return;
        }
        const origin = root.getBoundingClientRect();
        const rect = currentTable.getBoundingClientRect();
        let top = rect.top - origin.top - 46;
        if (top < 2) {
            top = rect.top - origin.top + 8;
        }
        balloon.value = { on: true, top, left: Math.max(4, rect.left - origin.left) };
    };

    const trackSelection = () => {
        const sel = window.getSelection?.();
        const node = sel && sel.anchorNode;
        if (!within(node)) {
            // a cell-drag clears the text selection on purpose — keep the
            // table UI alive while a rectangle is selected or being dragged
            if (!selectedCells.length && !dragAnchor && !balloonHasFocus()) {
                hideTableUi();
            }
            refreshBar();
            return;
        }
        const cell = cellOf(node!);
        currentCell = cell || (selectedCells.length ? currentCell : null);
        const table = (cell?.closest('table') as HTMLTableElement | null) || (selectedCells.length ? currentTable : null);
        if (table !== currentTable) {
            clearCellSelection();
        }
        currentTable = table;
        positionBalloon();
        refreshBar();
    };

    const balloonHasFocus = (): boolean =>
        !!(root && document.activeElement && root.contains(document.activeElement) && area !== document.activeElement);

    /** Run a structural op on the active cell, then re-anchor the UI */
    const tableOp = (op: (table: HTMLTableElement, cell: HTMLTableCellElement) => void) => {
        if (currentTable && currentCell && !readonly()) {
            op(currentTable, currentCell);
            if (!currentTable.rows.length || !currentTable.querySelector('td, th')) {
                currentTable.remove();
                hideTableUi();
            }
            commit(true);
            positionBalloon();
        }
    };

    const mergeNeighbor = (down: boolean) => {
        tableOp((table, cell) => {
            const gridMap = buildGrid(table);
            const pos = cellPosition(gridMap, cell);
            if (!pos) {
                return;
            }
            const other = down
                ? gridMap[pos.row + (cell.rowSpan || 1)]?.[pos.col]
                : gridMap[pos.row]?.[pos.col + (cell.colSpan || 1)];
            if (other) {
                const merged = mergeCells(table, cell, other);
                if (merged) {
                    currentCell = merged;
                }
            }
        });
    };

    const mergeSelected = () => {
        if (currentTable && selA && selB) {
            const merged = mergeCells(currentTable, selA, selB);
            if (merged) {
                currentCell = merged;
                clearCellSelection();
                commit(true);
                positionBalloon();
            }
        } else {
            mergeNeighbor(false);
        }
    };

    const tableItems: ToolbarItem[] = [
        {
            type: 'select',
            title: 'Row',
            options: [
                { title: 'Insert row above', icon: 'arrow_upward', onclick: () => tableOp((t, c) => insertRow(t, c, false)) },
                { title: 'Insert row below', icon: 'arrow_downward', onclick: () => tableOp((t, c) => insertRow(t, c, true)) },
                { title: 'Header row', icon: 'title', onclick: () => tableOp((t) => toggleHeaderRow(t)) },
                { type: 'line' },
                { title: 'Delete row', icon: 'delete', onclick: () => tableOp((t, c) => deleteRow(t, c)) },
            ],
        },
        {
            type: 'select',
            title: 'Column',
            options: [
                { title: 'Insert column left', icon: 'arrow_back', onclick: () => tableOp((t, c) => insertColumn(t, c, false)) },
                { title: 'Insert column right', icon: 'arrow_forward', onclick: () => tableOp((t, c) => insertColumn(t, c, true)) },
                { title: 'Header column', icon: 'title', onclick: () => tableOp((t) => toggleHeaderColumn(t)) },
                { type: 'line' },
                { title: 'Delete column', icon: 'delete', onclick: () => tableOp((t, c) => deleteColumn(t, c)) },
            ],
        },
        {
            type: 'select',
            title: 'Cell',
            options: [
                { title: 'Merge selected cells', icon: 'call_merge', onclick: () => mergeSelected() },
                { title: 'Merge cell right', icon: 'east', onclick: () => mergeNeighbor(false) },
                { title: 'Merge cell down', icon: 'south', onclick: () => mergeNeighbor(true) },
                { type: 'line' },
                { title: 'Split cell', icon: 'call_split', onclick: () => tableOp((t, c) => splitCell(t, c)) },
            ],
        },
        { type: 'divider' },
        {
            type: 'color',
            icon: 'format_color_fill',
            tooltip: 'Cell background',
            onchange: (color) => {
                const targets = selectedCells.length ? selectedCells : currentCell ? [currentCell] : [];
                for (const cell of targets) {
                    cell.style.backgroundColor = color;
                }
                commit(true);
            },
        },
        { type: 'divider' },
        {
            icon: 'delete_forever',
            tooltip: 'Delete table',
            onclick: () => {
                if (currentTable && !readonly()) {
                    currentTable.remove();
                    hideTableUi();
                    commit(true);
                }
            },
        },
    ];

    const insertTableAt = (rows: number, cols: number) => {
        if (readonly() || !area || rows < 1 || cols < 1) {
            return;
        }
        grid.value = { ...grid.value, on: false };
        area.focus();
        restoreRange();
        const table = createTable(rows, cols);
        insertNodeAtCaret(table);
        if (!table.nextElementSibling) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            table.parentElement!.appendChild(p); // the caret must be able to leave the table
        }
        const first = table.querySelector('td');
        if (first) {
            const sel = window.getSelection?.();
            const range = document.createRange();
            range.selectNodeContents(first);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
        commit(true);
        trackSelection();
    };

    const focusCell = (cell: HTMLTableCellElement) => {
        const sel = window.getSelection?.();
        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
    };

    /** Tab walks the grid; Tab past the last cell grows the table (CKEditor) */
    const tabNavigate = (cell: HTMLTableCellElement, backwards: boolean) => {
        const table = cell.closest('table') as HTMLTableElement;
        const cells: HTMLTableCellElement[] = [];
        for (const row of Array.from(table.rows)) {
            for (const entry of Array.from(row.cells)) {
                cells.push(entry);
            }
        }
        const at = cells.indexOf(cell) + (backwards ? -1 : 1);
        if (at < 0) {
            return;
        }
        if (at >= cells.length) {
            insertRow(table, cell, true);
            commit(true);
            const next = table.rows[table.rows.length - 1]?.cells[0];
            if (next) {
                focusCell(next);
            }
            return;
        }
        focusCell(cells[at]);
    };

    // ---- tables: resize handles --------------------------------------------

    let hotColumn: { table: HTMLTableElement; index: number } | null = null;
    let hotRow: { table: HTMLTableElement; index: number } | null = null;
    let drag: {
        kind: 'col' | 'row';
        table: HTMLTableElement;
        cols: HTMLTableColElement[];
        index: number;
        x: number;
        y: number;
        widths: number[];
        tableWidth: number;
        rowHeight: number;
        origin: number;
    } | null = null;

    const measureColumnWidths = (table: HTMLTableElement): number[] => {
        const gridMap = buildGrid(table);
        const count = columnCount(table);
        const widths: number[] = new Array(count).fill(0);
        for (let c = 0; c < count; c++) {
            for (let r = 0; r < gridMap.length; r++) {
                const el = gridMap[r][c];
                if (el && (el.colSpan || 1) === 1) {
                    const pos = cellPosition(gridMap, el);
                    if (pos && pos.col === c) {
                        widths[c] = el.getBoundingClientRect().width;
                        break;
                    }
                }
            }
        }
        const total = table.getBoundingClientRect().width;
        const missing = widths.filter((w) => !w).length;
        if (missing) {
            const used = widths.reduce((sum, w) => sum + w, 0);
            const each = Math.max(24, (total - used) / missing);
            for (let c = 0; c < count; c++) {
                if (!widths[c]) {
                    widths[c] = each;
                }
            }
        }
        return widths.map((w) => Math.max(24, Math.round(w)));
    };

    const hideHandles = () => {
        if (colHandle.value.on) {
            colHandle.value = { ...colHandle.value, on: false };
        }
        if (rowHandle.value.on) {
            rowHandle.value = { ...rowHandle.value, on: false };
        }
        hotColumn = null;
        hotRow = null;
    };

    const hover = (e: MouseEvent) => {
        if (drag || readonly() || !root) {
            return;
        }
        const cell = cellOf(e.target as Node);
        if (!cell) {
            hideHandles();
            return;
        }
        const table = cell.closest('table') as HTMLTableElement;
        const origin = root.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();
        const gridMap = buildGrid(table);
        const pos = cellPosition(gridMap, cell);
        if (!pos) {
            return;
        }
        const atRight = Math.abs(e.clientX - cellRect.right) <= EDGE;
        const atLeft = Math.abs(e.clientX - cellRect.left) <= EDGE && pos.col > 0;
        const atBottom = Math.abs(e.clientY - cellRect.bottom) <= EDGE;
        if (atRight || atLeft) {
            hotColumn = { table, index: atRight ? pos.col + (cell.colSpan || 1) : pos.col };
            hotRow = null;
            colHandle.value = {
                on: true,
                left: (atRight ? cellRect.right : cellRect.left) - origin.left - 2,
                top: tableRect.top - origin.top,
                height: tableRect.height,
            };
            if (rowHandle.value.on) {
                rowHandle.value = { ...rowHandle.value, on: false };
            }
        } else if (atBottom) {
            hotRow = { table, index: pos.row + (cell.rowSpan || 1) };
            hotColumn = null;
            rowHandle.value = {
                on: true,
                left: tableRect.left - origin.left,
                top: cellRect.bottom - origin.top - 2,
                width: tableRect.width,
            };
            if (colHandle.value.on) {
                colHandle.value = { ...colHandle.value, on: false };
            }
        } else {
            hideHandles();
        }
    };

    const dragMove = (e: PointerEvent) => {
        if (!drag) {
            return;
        }
        if (drag.kind === 'col') {
            const dx = e.clientX - drag.x;
            const { cols, widths, index } = drag;
            let applied = dx;
            if (index >= cols.length) {
                // the table's right edge — resize the table itself
                applied = Math.max(24 - widths[cols.length - 1], dx);
                cols[cols.length - 1].style.width = widths[cols.length - 1] + applied + 'px';
                drag.table.style.width = drag.tableWidth + applied + 'px';
            } else {
                // an inner boundary — the neighbor pair trades width, the table stays
                applied = Math.max(-(widths[index - 1] - 24), Math.min(dx, widths[index] - 24));
                cols[index - 1].style.width = widths[index - 1] + applied + 'px';
                cols[index].style.width = widths[index] - applied + 'px';
            }
            colHandle.value = { ...colHandle.value, left: drag.origin + applied };
        } else {
            const dy = e.clientY - drag.y;
            const row = drag.table.rows[drag.index - 1];
            if (row) {
                const applied = Math.max(24 - drag.rowHeight, dy);
                row.style.height = drag.rowHeight + applied + 'px';
                rowHandle.value = { ...rowHandle.value, top: drag.origin + applied };
            }
        }
    };

    const startDrag = (e: PointerEvent, kind: 'col' | 'row') => {
        const hot = kind === 'col' ? hotColumn : hotRow;
        if (!hot || readonly()) {
            return;
        }
        e.preventDefault();
        const { table, index } = hot;
        const cols = ensureColgroup(table);
        const widths = measureColumnWidths(table);
        if (kind === 'col') {
            cols.forEach((col, i) => (col.style.width = widths[i] + 'px'));
            table.style.tableLayout = 'fixed';
            table.style.width = table.getBoundingClientRect().width + 'px';
        }
        const row = table.rows[index - 1];
        drag = {
            kind, table, cols, index,
            x: e.clientX,
            y: e.clientY,
            widths,
            tableWidth: table.getBoundingClientRect().width,
            rowHeight: kind === 'row' && row ? row.getBoundingClientRect().height : 0,
            origin: kind === 'col' ? colHandle.value.left : rowHandle.value.top,
        };
        const offMove = listen<PointerEvent>(document, 'pointermove', dragMove);
        const offUp = listen(document, 'pointerup', () => {
            offMove();
            offUp();
            drag = null;
            hideHandles();
            commit(true);
            positionBalloon();
        });
    };

    // ---- images: selection, corner resize, alignment menu -------------------

    let currentImage: HTMLImageElement | null = null;
    let imgBar: BarApi | null = null;
    let imgDrag: { x: number; y: number; width: number; height: number; corner: string } | null = null;
    const imageBox = state({ on: false, left: 0, top: 0, width: 0, height: 0 });

    const imageAlignOf = (img: HTMLImageElement): string => {
        if (img.style.float === 'left' || img.style.float === 'right') {
            return img.style.float;
        }
        if (img.style.display === 'block' && /auto/.test(img.style.margin)) {
            return 'center';
        }
        return 'inline';
    };

    const refreshImageBar = () => {
        if (!currentImage || !imgBar) {
            return;
        }
        const mode = imageAlignOf(currentImage);
        imgLeftItem.selected = mode === 'left';
        imgCenterItem.selected = mode === 'center';
        imgRightItem.selected = mode === 'right';
        imgInlineItem.selected = mode === 'inline';
        imgFullItem.selected = currentImage.style.width === '100%';
        imgBar.refresh();
    };

    const updateImageBox = () => {
        if (!currentImage || !root || readonly() || !currentImage.isConnected) {
            currentImage = currentImage && currentImage.isConnected ? currentImage : null;
            if (imageBox.value.on) {
                imageBox.value = { ...imageBox.value, on: false };
            }
            return;
        }
        const origin = root.getBoundingClientRect();
        const rect = currentImage.getBoundingClientRect();
        imageBox.value = {
            on: true,
            left: rect.left - origin.left,
            top: rect.top - origin.top,
            width: rect.width,
            height: rect.height,
        };
        refreshImageBar();
    };

    const deselectImage = () => {
        currentImage = null;
        if (imageBox.value.on) {
            imageBox.value = { ...imageBox.value, on: false };
        }
    };

    const selectImage = (img: HTMLImageElement) => {
        currentImage = img;
        hideTableUi(); // one floating UI at a time
        updateImageBox();
    };

    const imageAlign = (mode: 'left' | 'center' | 'right' | 'inline') => {
        if (!currentImage) {
            return;
        }
        const style = currentImage.style;
        style.float = '';
        style.display = '';
        style.margin = '';
        if (mode === 'left') {
            style.float = 'left';
            style.margin = '4px 12px 8px 0';
        } else if (mode === 'right') {
            style.float = 'right';
            style.margin = '4px 0 8px 12px';
        } else if (mode === 'center') {
            style.display = 'block';
            style.margin = '8px auto';
        }
        commit(true);
        updateImageBox();
    };

    const imgLeftItem: ToolbarItem = { icon: 'format_align_left', tooltip: 'Wrap text right', onclick: () => imageAlign('left') };
    const imgCenterItem: ToolbarItem = { icon: 'format_align_center', tooltip: 'Center', onclick: () => imageAlign('center') };
    const imgRightItem: ToolbarItem = { icon: 'format_align_right', tooltip: 'Wrap text left', onclick: () => imageAlign('right') };
    const imgInlineItem: ToolbarItem = { icon: 'notes', tooltip: 'Inline with text', onclick: () => imageAlign('inline') };
    const imgFullItem: ToolbarItem = {
        icon: 'open_in_full',
        tooltip: 'Full width',
        onclick: () => {
            if (currentImage) {
                const full = currentImage.style.width === '100%';
                currentImage.style.width = full ? '' : '100%';
                currentImage.style.height = 'auto';
                commit(true);
                updateImageBox();
            }
        },
    };

    const removeImage = () => {
        if (currentImage) {
            currentImage.remove();
            deselectImage();
            commit(true);
        }
    };

    const imageItems: ToolbarItem[] = [
        imgLeftItem, imgCenterItem, imgRightItem, imgInlineItem,
        { type: 'divider' },
        imgFullItem,
        { type: 'divider' },
        { icon: 'delete', tooltip: 'Remove image', onclick: () => removeImage() },
    ];

    /** Corners resize proportionally (height follows the bitmap); the
     *  E/W edges stretch width only, N/S stretch height only — the other
     *  axis is pinned at its current rendered size */
    const startImageDrag = (e: PointerEvent, corner: string) => {
        if (!currentImage || readonly()) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const rect = currentImage.getBoundingClientRect();
        imgDrag = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, corner };
        const offMove = listen<PointerEvent>(document, 'pointermove', (event) => {
            if (!imgDrag || !currentImage) {
                return;
            }
            const { corner: mode } = imgDrag;
            const dx = event.clientX - imgDrag.x;
            const dy = event.clientY - imgDrag.y;
            if (mode === 'e' || mode === 'w') {
                const width = Math.max(16, Math.round(imgDrag.width + (mode === 'e' ? dx : -dx)));
                currentImage.style.width = width + 'px';
                if (imgDrag.height > 0) {
                    currentImage.style.height = Math.round(imgDrag.height) + 'px'; // pin the other axis
                }
            } else if (mode === 'n' || mode === 's') {
                const height = Math.max(16, Math.round(imgDrag.height + (mode === 's' ? dy : -dy)));
                currentImage.style.height = height + 'px';
                if (imgDrag.width > 0) {
                    currentImage.style.width = Math.round(imgDrag.width) + 'px';
                }
            } else {
                const sign = mode === 'ne' || mode === 'se' ? 1 : -1;
                const width = Math.max(16, Math.round(imgDrag.width + sign * dx));
                currentImage.style.width = width + 'px';
                currentImage.style.height = 'auto'; // corners return to the bitmap ratio
            }
            updateImageBox();
        });
        const offUp = listen(document, 'pointerup', () => {
            offMove();
            offUp();
            imgDrag = null;
            commit(true);
            updateImageBox();
        });
    };

    // ---- writing-area events -----------------------------------------------

    const onKeydown = (e: KeyboardEvent) => {
        if (readonly()) {
            return;
        }
        const meta = e.ctrlKey || e.metaKey;
        if (meta && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
            return;
        }
        if (meta && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            redo();
            return;
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && currentImage) {
            e.preventDefault();
            removeImage();
            return;
        }
        if (e.key === 'Tab') {
            const cell = cellOf(window.getSelection?.()?.anchorNode);
            if (cell) {
                e.preventDefault();
                tabNavigate(cell, e.shiftKey);
            }
        }
        if (e.key === 'Escape') {
            grid.value = { ...grid.value, on: false };
            link.value = { ...link.value, on: false };
            clearCellSelection();
            deselectImage();
        }
    };

    const onPaste = (e: ClipboardEvent) => {
        if (readonly()) {
            e.preventDefault();
            return;
        }
        const data = e.clipboardData;
        if (!data) {
            return;
        }
        if (data.files && data.files.length && props.acceptimages.value !== false) {
            e.preventDefault();
            saveRange();
            insertImages(data.files);
            return;
        }
        if (props.filterpaste.value !== false) {
            const value = data.getData('text/html');
            if (value) {
                e.preventDefault();
                insertHtmlAtCaret(sanitize(value));
                commit(true);
            }
        }
    };

    const onDrop = (e: DragEvent) => {
        if (e.dataTransfer && e.dataTransfer.files.length && props.acceptimages.value !== false && !readonly()) {
            e.preventDefault();
            saveRange();
            insertImages(e.dataTransfer.files);
        }
    };

    const onCellPress = (e: MouseEvent) => {
        if (e.button !== 0) {
            return;
        }
        // an image press selects it as an object; anything else deselects
        const target = e.target as HTMLElement;
        if (target instanceof HTMLImageElement && area?.contains(target) && !readonly()) {
            selectImage(target);
        } else if (currentImage) {
            deselectImage();
        }
        clearCellSelection();
        dragAnchor = cellOf(e.target as Node);
    };

    const onCellSweep = (e: MouseEvent) => {
        if (!dragAnchor || !(e.buttons & 1) || readonly()) {
            return;
        }
        const cell = cellOf(e.target as Node);
        if (!cell || cell === selB) {
            return;
        }
        const table = dragAnchor.closest('table') as HTMLTableElement | null;
        if (!table || cell.closest('table') !== table || cell === dragAnchor && !selB) {
            return;
        }
        selA = dragAnchor;
        selB = cell;
        const rect = selectionRect(table, selA, selB);
        for (const el of selectedCells) {
            el.classList.remove('lm-editor-cell-selected');
        }
        selectedCells = rect ? rect.cells : [];
        for (const el of selectedCells) {
            el.classList.add('lm-editor-cell-selected');
        }
        window.getSelection?.()?.removeAllRanges(); // rectangle replaces text selection
        currentTable = table;
        currentCell = selA;
        positionBalloon();
    };

    listen(document, 'mouseup', () => {
        dragAnchor = null;
    });

    listen(document, 'selectionchange', () => {
        trackSelection();
    });

    listen<MouseEvent>(document, 'mousedown', (e) => {
        const target = e.target as Element | null;
        if (grid.value.on && !target?.closest?.('.lm-editor-grid, .lm-toolbar')) {
            grid.value = { ...grid.value, on: false };
        }
        if (link.value.on && !target?.closest?.('.lm-editor-link, .lm-toolbar')) {
            link.value = { ...link.value, on: false };
        }
    });

    // ---- api + mount ---------------------------------------------------------

    props.ref?.({
        getData,
        setData,
        getText: () => area?.textContent || '',
        exec,
        focus: () => area?.focus(),
        insertTable: (rows = 3, cols = 3) => insertTableAt(rows, cols),
        undo,
        redo,
        toggleSource: (on?: boolean) => toggleSource(on),
        print: (options?: PrintOptions) => printHTML(getData(), options),
        exportPDF: (filename?: string, options?: PdfOptions) => downloadPDF(getData(), filename, options),
        exportWord: (filename?: string) => downloadWord(getData(), filename),
    });

    onMount(() => {
        if (area) {
            area.innerHTML = (content.value as string) || '';
            last = area.innerHTML;
            empty.value = isEmpty();
        }
        try {
            document.execCommand('defaultParagraphSeparator', false, 'p');
        } catch (e) { /* optional nicety */ }
        // external writes through the bound state land in the DOM
        const unsubscribe = content.subscribe((value) => {
            if (area && area.innerHTML !== value && getData() !== value) {
                area.innerHTML = (value as string) || '';
                last = area.innerHTML;
                empty.value = isEmpty();
                hideTableUi();
                deselectImage();
            }
        });
        return () => unsubscribe();
    });

    const gridCells = () => {
        const cells = [] as ReturnType<typeof html>[];
        for (let r = 1; r <= GRID_ROWS; r++) {
            for (let c = 1; c <= GRID_COLS; c++) {
                cells.push(html`<div class="lm-editor-grid-cell"
                    data-on="${() => (grid.value.rows >= r && grid.value.cols >= c ? 'true' : false)}"
                    onmouseenter="${() => (grid.value = { ...grid.value, rows: r, cols: c })}"
                    onclick="${() => insertTableAt(r, c)}"></div>`);
            }
        }
        return cells;
    };

    return html`<div class="lm-editor"
        ref="${(el: HTMLElement) => (root = el)}"
        data-fullscreen="${() => (full.value ? 'true' : false)}"
        data-source="${() => (source.value ? 'true' : false)}"
        data-readonly="${() => (readonly() ? 'true' : false)}">
        ${() =>
            props.toolbar.value !== false &&
            html`<div class="lm-editor-toolbar"
                onmousedown="${(e: MouseEvent) => {
                    // the writing selection must survive toolbar clicks
                    if ((e.target as Element).tagName !== 'INPUT') {
                        e.preventDefault();
                    }
                }}">
                <${Toolbar} position="static" options="${items}" ref="${(a: BarApi) => (bar = a)}" />
            </div>`}
        <div class="lm-editor-area" ref="${(el: HTMLElement) => (area = el)}"
            contenteditable="${() => (readonly() ? 'false' : 'true')}"
            role="textbox" aria-multiline="true"
            data-empty="${() => (empty.value ? 'true' : false)}"
            data-placeholder="${() => props.placeholder.value || false}"
            style="${() => (props.height.value ? 'height:' + props.height.value + ';overflow-y:auto;' : false)}"
            oninput="${() => commit()}"
            onkeydown="${onKeydown}"
            onpaste="${onPaste}"
            ondragover="${(e: DragEvent) => {
                if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.types, (t: string) => t === 'Files')) {
                    e.preventDefault();
                }
            }}"
            ondrop="${onDrop}"
            onmousedown="${onCellPress}"
            onmouseover="${onCellSweep}"
            onmousemove="${hover}"
            onmouseleave="${(e: MouseEvent) => {
                if (!drag && !(e.relatedTarget as Element)?.closest?.('.lm-editor-col-resize, .lm-editor-row-resize')) {
                    hideHandles();
                }
            }}"
            onscroll="${() => {
                hideHandles();
                positionBalloon();
                updateImageBox();
            }}"
            onfocus="${(e: FocusEvent) => props.onfocus?.(e)}"
            onblur="${(e: FocusEvent) => {
                commit();
                props.onblur?.(e);
            }}"></div>
        ${() =>
            source.value &&
            html`<textarea class="lm-editor-source" spellcheck="false"
                aria-label="HTML source"
                style="${() => (props.height.value ? 'height:' + props.height.value + ';' : false)}"
                ref="${(el: HTMLTextAreaElement) => {
                    sourceEl = el;
                    el.value = pendingSource;
                }}"
                onkeydown="${(e: KeyboardEvent) => {
                    if (e.key === 'Escape') {
                        toggleSource(false);
                    }
                }}"></textarea>`}
        ${() =>
            balloon.value.on &&
            html`<div class="lm-editor-balloon"
                style="${() => 'top:' + balloon.value.top + 'px;left:' + balloon.value.left + 'px'}"
                onmousedown="${(e: MouseEvent) => {
                    if ((e.target as Element).tagName !== 'INPUT') {
                        e.preventDefault();
                    }
                }}">
                <${Toolbar} position="static" options="${tableItems}" />
            </div>`}
        ${() =>
            grid.value.on &&
            html`<div class="lm-editor-grid"
                style="${() => 'top:' + grid.value.top + 'px;left:' + grid.value.left + 'px'}">
                <div class="lm-editor-grid-cells"
                    onmouseleave="${() => (grid.value = { ...grid.value, rows: 0, cols: 0 })}">
                    ${gridCells()}
                </div>
                <div class="lm-editor-grid-label">${() =>
                    grid.value.rows ? grid.value.rows + ' × ' + grid.value.cols : 'Insert table'}</div>
            </div>`}
        ${() =>
            link.value.on &&
            html`<div class="lm-editor-link"
                style="${() => 'top:' + link.value.top + 'px;left:' + link.value.left + 'px'}">
                <input type="url" placeholder="https://"
                    onkeydown="${(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            applyLink();
                        }
                        if (e.key === 'Escape') {
                            link.value = { ...link.value, on: false };
                            area?.focus();
                        }
                    }}" />
                <button type="button" title="Apply link" onclick="${applyLink}">
                    <i class="material-icons material-symbols-outlined">check</i>
                </button>
                <button type="button" title="Remove link" onclick="${() => {
                    link.value = { ...link.value, on: false };
                    area?.focus();
                    restoreRange();
                    exec('unlink');
                }}">
                    <i class="material-icons material-symbols-outlined">link_off</i>
                </button>
            </div>`}
        ${() =>
            colHandle.value.on &&
            html`<div class="lm-editor-col-resize"
                style="${() =>
                    'left:' + colHandle.value.left + 'px;top:' + colHandle.value.top + 'px;height:' + colHandle.value.height + 'px'}"
                onpointerdown="${(e: PointerEvent) => startDrag(e, 'col')}"></div>`}
        ${() =>
            rowHandle.value.on &&
            html`<div class="lm-editor-row-resize"
                style="${() =>
                    'left:' + rowHandle.value.left + 'px;top:' + rowHandle.value.top + 'px;width:' + rowHandle.value.width + 'px'}"
                onpointerdown="${(e: PointerEvent) => startDrag(e, 'row')}"></div>`}
        ${() =>
            imageBox.value.on && props.readonly.value !== true &&
            html`<div class="lm-editor-img-box"
                style="${() =>
                    'left:' + imageBox.value.left + 'px;top:' + imageBox.value.top + 'px;width:' +
                    imageBox.value.width + 'px;height:' + imageBox.value.height + 'px'}">
                <div class="lm-editor-img-bar"
                    onmousedown="${(e: MouseEvent) => e.preventDefault()}">
                    <${Toolbar} position="static" options="${imageItems}" ref="${(a: BarApi) => (imgBar = a)}" />
                </div>
                <div class="lm-editor-img-handle" data-corner="nw"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'nw')}"></div>
                <div class="lm-editor-img-handle" data-corner="ne"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'ne')}"></div>
                <div class="lm-editor-img-handle" data-corner="sw"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'sw')}"></div>
                <div class="lm-editor-img-handle" data-corner="se"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'se')}"></div>
                <div class="lm-editor-img-handle" data-corner="n"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'n')}"></div>
                <div class="lm-editor-img-handle" data-corner="s"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 's')}"></div>
                <div class="lm-editor-img-handle" data-corner="e"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'e')}"></div>
                <div class="lm-editor-img-handle" data-corner="w"
                    onpointerdown="${(e: PointerEvent) => startImageDrag(e, 'w')}"></div>
            </div>`}
        <input type="file" accept="image/*" multiple class="lm-editor-file"
            ref="${(el: HTMLInputElement) => (fileInput = el)}"
            onchange="${(e: Event) => {
                const input = e.target as HTMLInputElement;
                if (input.files) {
                    insertImages(input.files);
                }
                input.value = '';
            }}" />
    </div>`;
});

export default Editor;
