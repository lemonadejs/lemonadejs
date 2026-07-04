/**
 * In-page real-browser probe for <Editor /> — everything jsdom cannot
 * cover: execCommand formatting + toolbar toggle tracking, the table
 * grid picker, the floating table balloon, boundary hover → resize
 * handle → drag writes colgroup widths, cell rectangle selection +
 * merge, and the print/Word exporters' document builders against a real
 * DOM. Results in #lm-probe.
 */
import { html, mount, type Component } from 'lemonadejs';
import Editor, { htmlToPdf } from '@lemonadejs/editor';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

type Api = {
    getData(): string;
    setData(v: string): void;
    insertTable(r?: number, c?: number): void;
    exec(cmd: string, v?: string): void;
    undo(): void;
    redo(): void;
};

let editor!: Api;
let changes = 0;

const App: Component = () => html`<div style="width: 760px">
    <${Editor} value="<p>Hello world</p>" height="420px"
        ref="${(a: Api) => (editor = a)}"
        onchange="${() => changes++}" />
</div>`;

const area = () => document.querySelector('.lm-editor-area') as HTMLElement;

const caretIn = (el: Element, toEnd = false) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(!toEnd);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
};

const mouse = (el: Element, type: string, x: number, y: number, buttons = 0) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons }));

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 1. mounted: toolbar hosted, content in place
    log('mounts-with-toolbar', !!document.querySelector('.lm-editor .lm-toolbar'), {
        items: document.querySelectorAll('.lm-toolbar-item').length,
    });
    log('value-rendered', area().innerHTML === '<p>Hello world</p>', { html: area().innerHTML });

    // ---- 2. real execCommand formatting + toolbar toggle tracking
    area().focus();
    const p = area().querySelector('p')!;
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(p);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.exec('bold');
    await frame();
    log('exec-bold-applies', /<(b|strong)>/i.test(area().innerHTML), { html: area().innerHTML });
    const boldItem = Array.from(document.querySelectorAll('.lm-toolbar-item'))
        .find((el) => el.querySelector('i')?.textContent === 'format_bold') as HTMLElement;
    document.dispatchEvent(new Event('selectionchange'));
    await frame();
    log('bold-toggle-tracks-selection', boldItem.getAttribute('data-selected') === 'true', {
        selected: boldItem.getAttribute('data-selected'),
    });
    log('onchange-fired', changes > 0, { changes });

    // ---- 3. grid picker: open from the toolbar, hover 3×4, insert
    const gridButton = Array.from(document.querySelectorAll('.lm-toolbar-item'))
        .find((el) => el.querySelector('i')?.textContent === 'grid_on') as HTMLElement;
    (gridButton.querySelector('a') as HTMLElement).click();
    await frame();
    const picker = document.querySelector('.lm-editor-grid');
    log('grid-picker-opens', !!picker, {});
    const cells = Array.from(document.querySelectorAll('.lm-editor-grid-cell')) as HTMLElement[];
    // hover the cell at row 3, col 4 (index (3-1)*10 + 4-1)
    cells[2 * 10 + 3].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await frame();
    const lit = document.querySelectorAll('.lm-editor-grid-cell[data-on="true"]').length;
    const label = document.querySelector('.lm-editor-grid-label')?.textContent;
    log('grid-picker-highlights-3x4', lit === 12 && label === '3 × 4', { lit, label });
    cells[2 * 10 + 3].click();
    await frame();
    const table = area().querySelector('table')!;
    log('grid-click-inserts-table', !!table && table.rows.length === 3 && table.rows[0].cells.length === 4, {
        rows: table?.rows.length,
        cols: table?.rows[0]?.cells.length,
        colgroup: table?.querySelectorAll('col').length,
    });

    // ---- 4. caret in a cell → floating balloon with Row/Column/Cell menus
    caretIn(table.rows[0].cells[0]);
    await frame();
    const balloon = document.querySelector('.lm-editor-balloon');
    const headers = Array.from(document.querySelectorAll('.lm-editor-balloon .lm-toolbar-picker-header')).map(
        (el) => el.textContent
    );
    log('table-balloon-appears', !!balloon, { headers });
    log('balloon-has-row-column-cell', JSON.stringify(headers) === JSON.stringify(['Row', 'Column', 'Cell']), { headers });

    // ---- 5. balloon Row menu → insert row below
    const rowHeader = document.querySelectorAll('.lm-editor-balloon .lm-toolbar-picker-header')[0] as HTMLElement;
    mouse(rowHeader, 'mousedown', 0, 0, 1);
    await frame();
    const options = Array.from(document.querySelectorAll('.lm-contextmenu-item')) as HTMLElement[];
    const below = options.find((el) => el.textContent!.includes('Insert row below'))!;
    below.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await frame();
    log('balloon-inserts-row', table.rows.length === 4, { rows: table.rows.length });

    // ---- 6. hover a column boundary → handle appears; drag → colgroup widths
    const cell = table.rows[0].cells[0];
    const rect = cell.getBoundingClientRect();
    mouse(cell, 'mousemove', rect.right - 1, rect.top + 8); // bubbles to the area handler with the cell as target
    await frame();
    const handle = document.querySelector('.lm-editor-col-resize') as HTMLElement;
    log('column-handle-on-boundary-hover', !!handle, { left: handle?.style.left });
    const before = cell.getBoundingClientRect().width;
    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: rect.right, clientY: rect.top + 8 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rect.right + 40, clientY: rect.top + 8 }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: rect.right + 40, clientY: rect.top + 8 }));
    await frame();
    const after = table.rows[0].cells[0].getBoundingClientRect().width;
    const colWidths = Array.from(table.querySelectorAll('col')).map((c) => (c as HTMLElement).style.width);
    log('column-drag-resizes', after > before + 20, { before, after, colWidths });
    log('widths-land-on-colgroup', colWidths[0] !== '' && table.style.tableLayout === 'fixed', { colWidths });

    // ---- 7. drag across cells → rectangle selection; merge via Cell menu
    const a = table.rows[0].cells[0];
    const b = table.rows[1].cells[1];
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    mouse(a, 'mousedown', ar.left + 4, ar.top + 4, 1);
    mouse(b, 'mouseover', br.left + 4, br.top + 4, 1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await frame();
    const marked = table.querySelectorAll('.lm-editor-cell-selected').length;
    log('cell-drag-selects-rectangle', marked === 4, { marked });
    const cellHeader = document.querySelectorAll('.lm-editor-balloon .lm-toolbar-picker-header')[2] as HTMLElement;
    mouse(cellHeader, 'mousedown', 0, 0, 1);
    await frame();
    const merge = (Array.from(document.querySelectorAll('.lm-contextmenu-item')) as HTMLElement[])
        .find((el) => el.textContent!.includes('Merge selected cells'))!;
    merge.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await frame();
    const mergedCell = table.querySelector('td[colspan="2"][rowspan="2"]');
    log('merge-selected-cells', !!mergedCell, { html: table.rows[0].innerHTML.slice(0, 120) });

    // ---- 8. undo restores the pre-merge table (structural undo)
    editor.undo();
    await frame();
    const tableNow = area().querySelector('table')!;
    log('structural-undo', !tableNow.querySelector('td[colspan="2"][rowspan="2"]'), {});
    editor.redo();
    await frame();
    log('structural-redo', !!area().querySelector('td[colspan="2"][rowspan="2"]'), {});

    // ---- 9. text color through the hosted Color block panel
    // (step 3 replaced the selected text with the table — insert over a
    // selection replaces it — so give the paragraph fresh prose first)
    const p2 = area().querySelector('p')!;
    p2.innerHTML = 'Colored words';
    const sel2 = window.getSelection()!;
    const range2 = document.createRange();
    range2.selectNodeContents(p2);
    sel2.removeAllRanges();
    sel2.addRange(range2);
    const colorItem = document.querySelector('.lm-editor-toolbar .lm-toolbar-color a') as HTMLElement;
    colorItem.click();
    await frame();
    const pop = document.querySelector('.lm-toolbar-color-pop');
    log('color-popover-hosts-color-block', !!pop && !!pop.querySelector('.lm-color-grid'), {});
    (pop!.querySelector('.lm-color-cell[data-value="#f44336"]') as HTMLElement).click();
    await frame();
    log('color-pick-applies-forecolor', /rgb\(244, 67, 54\)|#f44336/.test(area().innerHTML), {
        html: area().querySelector('p')!.outerHTML.slice(0, 120),
    });
    log('color-popover-closes-on-pick', !document.querySelector('.lm-toolbar-color-pop'), {});

    // ---- 10. image object: select → box + bar; drag corner; align; delete
    const cv = document.createElement('canvas');
    cv.width = 60;
    cv.height = 40;
    cv.getContext('2d')!.fillStyle = '#c62828';
    cv.getContext('2d')!.fillRect(0, 0, 60, 40);
    const dataUrl = cv.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = dataUrl;
    area().appendChild(img);
    await new Promise((r) => (img.complete ? r(0) : (img.onload = () => r(0))));
    img.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await frame();
    const box = document.querySelector('.lm-editor-img-box');
    log('image-press-selects', !!box && box.querySelectorAll('.lm-editor-img-handle').length === 8, {});

    const se = document.querySelector('.lm-editor-img-handle[data-corner="se"]') as HTMLElement;
    const ir = img.getBoundingClientRect();
    se.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: ir.right, clientY: ir.bottom }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: ir.right + 40, clientY: ir.bottom + 20 }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: ir.right + 40, clientY: ir.bottom + 20 }));
    await frame();
    log('image-corner-drag-resizes', img.style.width === '100px', { width: img.style.width });
    log('image-eight-handles', document.querySelectorAll('.lm-editor-img-handle').length === 8, {});

    // east edge: width-only stretch (height pinned in px), then a corner
    // drag returns to the bitmap ratio
    const east = document.querySelector('.lm-editor-img-handle[data-corner="e"]') as HTMLElement;
    const ir2 = img.getBoundingClientRect();
    east.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: ir2.right, clientY: ir2.top + 10 }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: ir2.right + 20, clientY: ir2.top + 10 }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await frame();
    log('image-edge-stretch-independent', img.style.width === '120px' && /px$/.test(img.style.height), {
        width: img.style.width,
        height: img.style.height,
    });
    const se2 = document.querySelector('.lm-editor-img-handle[data-corner="se"]') as HTMLElement;
    const ir3 = img.getBoundingClientRect();
    se2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: ir3.right, clientY: ir3.bottom }));
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: ir3.right - 20, clientY: ir3.bottom }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await frame();
    log('image-corner-restores-ratio', img.style.width === '100px' && img.style.height === 'auto', {
        width: img.style.width,
        height: img.style.height,
    });

    const imgItem = (icon: string) =>
        (Array.from(document.querySelectorAll('.lm-editor-img-bar .lm-toolbar-item')) as HTMLElement[])
            .find((el) => el.querySelector('i')?.textContent === icon)!
            .querySelector('a') as HTMLElement;
    imgItem('format_align_center').click();
    await frame();
    log('image-align-center', img.style.display === 'block' && /auto/.test(img.style.margin), {
        display: img.style.display,
        margin: img.style.margin,
    });
    area().dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
    await frame();
    log('image-delete-key-removes', !area().querySelector('img[style]'), {});

    // ---- 11. direct PDF generation: real bytes, image re-encoded + embedded
    const pdfBytes = await htmlToPdf('<h1>Report</h1><p>Body</p><p><img src="' + dataUrl + '"></p>');
    let head = '';
    for (let i = 0; i < Math.min(pdfBytes.length, 8); i++) {
        head += String.fromCharCode(pdfBytes[i]);
    }
    let all = '';
    for (let i = 0; i < pdfBytes.length; i++) {
        all += String.fromCharCode(pdfBytes[i]);
    }
    log('pdf-direct-bytes', head.startsWith('%PDF-1.4') && all.indexOf('%%EOF') > 0, {
        size: pdfBytes.length,
    });
    log('pdf-embeds-canvas-image', all.indexOf('/DCTDecode') > 0 && all.indexOf('/Im1 Do') > 0, {});

    // ---- 12. HTML source mode: formatted source in, edited HTML out
    const toolItem = (icon: string) =>
        (Array.from(document.querySelectorAll('.lm-editor-toolbar .lm-toolbar-item')) as HTMLElement[])
            .find((el) => el.querySelector('i')?.textContent === icon)!
            .querySelector('a') as HTMLElement;
    toolItem('code').click();
    await frame();
    const sourceView = document.querySelector('.lm-editor-source') as HTMLTextAreaElement | null;
    log('source-mode-opens-formatted', !!sourceView && /\n {8}<tr>/.test(sourceView!.value), {
        head: sourceView ? JSON.stringify(sourceView.value.slice(0, 60)) : 'none',
    });
    const boldEl = (Array.from(document.querySelectorAll('.lm-editor-toolbar .lm-toolbar-item')) as HTMLElement[])
        .find((el) => el.querySelector('i')?.textContent === 'format_bold')!;
    log('source-mode-disables-formatting', boldEl.getAttribute('data-disabled') === 'true', {});
    sourceView!.value = sourceView!.value + '\n<h2>From the source view</h2>';
    toolItem('code').click();
    await frame();
    log('source-edit-applies', !!area().querySelector('h2') &&
        area().textContent!.indexOf('From the source view') !== -1 &&
        boldEl.getAttribute('data-disabled') !== 'true', {});

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
