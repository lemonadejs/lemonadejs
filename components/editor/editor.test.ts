/**
 * <Editor /> block tests — the component surface (mount, bind, api,
 * toolbar hosting) plus the pure engines behind it: span-aware table
 * surgery, the paste sanitizer and the local exporters (print document /
 * Word MHTML), all of which run without layout so jsdom covers them.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Editor from '@lemonadejs/editor';
import {
    buildGrid, cellPosition, columnCount, createTable, deleteColumn, deleteRow,
    ensureColgroup, insertColumn, insertRow, mergeCells, splitCell,
    toggleHeaderColumn, toggleHeaderRow,
} from './src/table';
import { prettyHtml, sanitize } from './src/clean';
import { printableDocument, wordDocument } from './src/exporters';
import { htmlToPdf, jpegSize, parseColor } from './src/pdf';

type Api = {
    getData(): string;
    setData(value: string): void;
    getText(): string;
    insertTable(rows?: number, cols?: number): void;
    undo(): void;
    redo(): void;
    print(): void;
    exportWord(filename?: string): void;
    exec(command: string, value?: string): void;
    focus(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const mountEditor = (props: Record<string, unknown> = {}) => {
    handle = t(Editor, props);
};

const area = () => handle!.query('.lm-editor-area') as HTMLElement;

describe('components/editor — the component surface', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Editor).pass).toBe(true);
    });

    it('renders the initial value into the writing area', () => {
        mountEditor({ value: '<p>Hello <b>world</b></p>' });
        expect(area().innerHTML).toBe('<p>Hello <b>world</b></p>');
        expect(area().getAttribute('contenteditable')).toBe('true');
        expect(area().getAttribute('role')).toBe('textbox');
    });

    it('hosts the Toolbar block; toolbar="false" removes it', () => {
        mountEditor({});
        expect(handle!.query('.lm-toolbar')).not.toBeNull();
        expect(handle!.queryAll('.lm-toolbar-item').length).toBeGreaterThan(10);
        handle!.unmount();

        mountEditor({ toolbar: false });
        expect(handle!.query('.lm-toolbar')).toBeNull();
    });

    it('bind is two-way: external writes land in the DOM, edits fire onchange', () => {
        const value = store('<p>first</p>');
        const log: string[] = [];
        mountEditor({ bind: value, onchange: (v: string) => log.push(v) });
        expect(area().innerHTML).toBe('<p>first</p>');

        value.value = '<p>second</p>'; // external write
        expect(area().innerHTML).toBe('<p>second</p>');

        area().innerHTML = '<p>typed</p>'; // a user edit...
        area().dispatchEvent(new Event('input', { bubbles: true }));
        expect(log).toEqual(['<p>typed</p>']); // ...reports through onchange
        expect(value.value).toBe('<p>typed</p>'); // ...and lands on the bound state
    });

    it('api: getData / setData / getText / undo / redo', () => {
        let api!: Api;
        mountEditor({ value: '<p>one</p>', ref: (a: Api) => (api = a) });
        expect(api.getData()).toBe('<p>one</p>');
        expect(api.getText()).toBe('one');

        api.setData('<p>two</p>');
        expect(api.getData()).toBe('<p>two</p>');

        api.undo();
        expect(api.getData()).toBe('<p>one</p>');
        api.redo();
        expect(api.getData()).toBe('<p>two</p>');
    });

    it('api.insertTable builds a colgroup-backed table with a trailing paragraph', () => {
        let api!: Api;
        mountEditor({ ref: (a: Api) => (api = a) });
        api.insertTable(2, 3);
        const table = area().querySelector('table')!;
        expect(table).not.toBeNull();
        expect(table.rows).toHaveLength(2);
        expect(table.rows[0].cells).toHaveLength(3);
        expect(table.querySelectorAll('colgroup col')).toHaveLength(3);
        expect(table.nextElementSibling?.tagName).toBe('P'); // the caret can leave
    });

    it('readonly is live: the area locks and the toolbar dims', () => {
        const readonly = store(false);
        mountEditor({ readonly });
        expect(area().getAttribute('contenteditable')).toBe('true');
        readonly.value = true;
        expect(area().getAttribute('contenteditable')).toBe('false');
        expect((handle!.query('.lm-editor') as HTMLElement).getAttribute('data-readonly')).toBe('true');
    });

    it('placeholder shows through data-empty until there is content', () => {
        mountEditor({ placeholder: 'Write…' });
        expect(area().getAttribute('data-placeholder')).toBe('Write…');
        expect(area().getAttribute('data-empty')).toBe('true');
        area().innerHTML = '<p>text</p>';
        area().dispatchEvent(new Event('input', { bubbles: true }));
        expect(area().hasAttribute('data-empty')).toBe(false);
    });

    it('getData strips the cell-selection editing artifacts', () => {
        let api!: Api;
        mountEditor({
            value: '<table><tbody><tr><td class="lm-editor-cell-selected">a</td></tr></tbody></table>',
            ref: (a: Api) => (api = a),
        });
        expect(api.getData()).not.toContain('lm-editor-cell-selected');
        expect(api.getData()).toContain('<td>a</td>');
    });
});

describe('components/editor — span-aware table surgery', () => {
    it('createTable: n×m with a colgroup and <br> fillers', () => {
        const table = createTable(2, 3);
        expect(table.rows).toHaveLength(2);
        expect(columnCount(table)).toBe(3);
        expect(table.rows[1].cells[2].innerHTML).toBe('<br>');
    });

    it('buildGrid expands col/rowspans into occupancy', () => {
        const table = createTable(2, 2);
        table.rows[0].cells[0].colSpan = 2;
        table.rows[0].deleteCell(1);
        const grid = buildGrid(table);
        expect(grid[0][0]).toBe(grid[0][1]); // the span covers both coordinates
        expect(cellPosition(grid, table.rows[1].cells[1])).toEqual({ row: 1, col: 1 });
    });

    it('insertRow above/below; a crossing rowspan grows instead of splitting', () => {
        const table = createTable(3, 2);
        // rows 0-1 of column 0 merged
        const merged = mergeCells(table, table.rows[0].cells[0], table.rows[1].cells[0])!;
        expect(merged.rowSpan).toBe(2);
        // inserting at the line INSIDE the merge grows the span
        insertRow(table, table.rows[1].cells[0], false); // reference: row 1 (the covered row)
        expect(table.rows).toHaveLength(4);
        expect(merged.rowSpan).toBe(3);
        // inserting below the last row appends plain fillers
        insertRow(table, table.rows[3].cells[0], true);
        expect(table.rows).toHaveLength(5);
        expect(table.rows[4].cells).toHaveLength(2);
    });

    it('deleteRow relocates the remainder of a rowspan that starts there', () => {
        const table = createTable(3, 2);
        const merged = mergeCells(table, table.rows[0].cells[0], table.rows[1].cells[0])!;
        merged.innerHTML = 'keep';
        deleteRow(table, merged); // deletes row 0, where the merge starts
        expect(table.rows).toHaveLength(2);
        expect(table.contains(merged)).toBe(true); // moved into the next row
        expect(merged.rowSpan).toBe(1);
        expect(table.rows[0].cells[0]).toBe(merged);
    });

    it('insertColumn left/right; a crossing colspan grows instead of splitting', () => {
        const table = createTable(2, 3);
        const merged = mergeCells(table, table.rows[0].cells[0], table.rows[0].cells[1])!;
        expect(merged.colSpan).toBe(2);
        insertColumn(table, table.rows[1].cells[1], false); // boundary inside the merge
        expect(columnCount(table)).toBe(4);
        expect(merged.colSpan).toBe(3);
        expect(table.rows[1].cells).toHaveLength(4);
        expect(table.querySelectorAll('colgroup col')).toHaveLength(4);
    });

    it('deleteColumn shrinks spans that overlap and removes covered cells', () => {
        const table = createTable(2, 3);
        const merged = mergeCells(table, table.rows[0].cells[0], table.rows[0].cells[1])!;
        deleteColumn(table, table.rows[1].cells[1], );
        expect(columnCount(table)).toBe(2);
        expect(merged.colSpan).toBe(1);
        expect(table.querySelectorAll('colgroup col')).toHaveLength(2);
    });

    it('mergeCells expands the rectangle to swallow protruding spans', () => {
        const table = createTable(3, 3);
        const tall = mergeCells(table, table.rows[0].cells[1], table.rows[1].cells[1])!; // (0,1)-(1,1)
        // merging (0,0) with (0,1) must drag row 1 in — the tall neighbor protrudes
        const merged = mergeCells(table, table.rows[0].cells[0], tall)!;
        expect(merged.colSpan).toBe(2);
        expect(merged.rowSpan).toBe(2);
        const grid = buildGrid(table);
        expect(grid[1][0]).toBe(merged);
    });

    it('mergeCells keeps content and splitCell restores the grid with fillers', () => {
        const table = createTable(2, 2);
        table.rows[0].cells[0].innerHTML = 'a';
        table.rows[0].cells[1].innerHTML = 'b';
        const merged = mergeCells(table, table.rows[0].cells[0], table.rows[1].cells[1])!;
        expect(merged.textContent).toContain('a');
        expect(merged.textContent).toContain('b');

        splitCell(table, merged);
        expect(merged.colSpan).toBe(1);
        expect(merged.rowSpan).toBe(1);
        expect(table.rows[0].cells).toHaveLength(2);
        expect(table.rows[1].cells).toHaveLength(2);
    });

    it('header row/column toggles swap th ⇄ td preserving content', () => {
        const table = createTable(2, 2);
        table.rows[0].cells[0].innerHTML = 'x';
        toggleHeaderRow(table);
        expect(table.rows[0].cells[0].tagName).toBe('TH');
        expect(table.rows[0].cells[0].innerHTML).toBe('x');
        toggleHeaderRow(table);
        expect(table.rows[0].cells[0].tagName).toBe('TD');

        toggleHeaderColumn(table);
        expect(table.rows[0].cells[0].tagName).toBe('TH');
        expect(table.rows[1].cells[0].tagName).toBe('TH');
        expect(table.rows[1].cells[1].tagName).toBe('TD');
    });

    it('ensureColgroup tracks the real column count', () => {
        const table = createTable(2, 2);
        table.querySelector('colgroup')!.remove();
        const cols = ensureColgroup(table);
        expect(cols).toHaveLength(2);
        insertColumn(table, table.rows[0].cells[0], true);
        expect(table.querySelectorAll('colgroup col')).toHaveLength(3);
    });
});

describe('components/editor — paste sanitizer', () => {
    it('drops script/style wholesale and unwraps unknown containers', () => {
        const out = sanitize('<article><p>keep</p><script>alert(1)</script><style>p{}</style></article>');
        expect(out).toBe('<p>keep</p>');
    });

    it('removes event handlers, classes and javascript: URLs', () => {
        const out = sanitize('<p onclick="x()" class="mso" id="a"><a href="javascript:x()">l</a></p>');
        expect(out).toBe('<p><a>l</a></p>');
    });

    it('keeps semantic structure: headings, lists, tables with spans', () => {
        const input = '<h2>t</h2><ul><li>i</li></ul><table><tbody><tr><td colspan="2">c</td></tr></tbody></table>';
        expect(sanitize(input)).toBe(input);
    });

    it('filters inline styles to the safe subset', () => {
        const out = sanitize('<p style="color: red; position: fixed; mso-style: x">t</p>');
        expect(out).toBe('<p style="color:red">t</p>');
    });

    it('keeps data: URLs on images only', () => {
        expect(sanitize('<img src="data:image/png;base64,AA==">')).toContain('data:image/png');
        expect(sanitize('<a href="data:text/html,x">l</a>')).toBe('<a>l</a>');
    });
});

describe('components/editor — HTML source mode', () => {
    type SourceApi = Api & { toggleSource(on?: boolean): void };

    const sourceArea = () => handle!.query('.lm-editor-source') as HTMLTextAreaElement | null;

    it('prettyHtml: structure expands, inline-only blocks stay on one line, pre is untouched', () => {
        const pretty = prettyHtml(
            '<p>Hello <b>world</b></p><table><tbody><tr><td>a</td></tr></tbody></table><pre>x\n  y</pre>'
        );
        expect(pretty).toBe([
            '<p>Hello <b>world</b></p>',
            '<table>',
            '    <tbody>',
            '        <tr>',
            '            <td>a</td>',
            '        </tr>',
            '    </tbody>',
            '</table>',
            '<pre>x\n  y</pre>',
        ].join('\n'));
    });

    it('toggling in shows the formatted source and disables the formatting items', () => {
        let api!: SourceApi;
        mountEditor({ value: '<p>Hi</p>', ref: (a: SourceApi) => (api = a) });
        expect(sourceArea()).toBeNull();

        api.toggleSource(true);
        expect(sourceArea()).not.toBeNull();
        expect(sourceArea()!.value).toBe('<p>Hi</p>');
        expect((handle!.query('.lm-editor') as HTMLElement).getAttribute('data-source')).toBe('true');
        const bold = Array.from(handle!.queryAll('.lm-editor-toolbar .lm-toolbar-item'))
            .find((el) => el.querySelector('i')?.textContent === 'format_bold')!;
        const code = Array.from(handle!.queryAll('.lm-editor-toolbar .lm-toolbar-item'))
            .find((el) => el.querySelector('i')?.textContent === 'code')!;
        expect(bold.getAttribute('data-disabled')).toBe('true');
        expect(code.hasAttribute('data-disabled')).toBe(false);
        expect(code.getAttribute('data-selected')).toBe('true');
    });

    it('toggling out applies the edited source as one undo step and fires onchange', () => {
        let api!: SourceApi;
        const log: string[] = [];
        mountEditor({ value: '<p>before</p>', ref: (a: SourceApi) => (api = a), onchange: (v: string) => log.push(v) });
        api.toggleSource(true);
        sourceArea()!.value = '<h2>from source</h2>';
        api.toggleSource(false);
        expect(sourceArea()).toBeNull();
        expect(area().innerHTML).toBe('<h2>from source</h2>');
        expect(log[log.length - 1]).toBe('<h2>from source</h2>');
        api.undo();
        expect(area().innerHTML).toBe('<p>before</p>');
    });

    it('the returned source is filtered like paste: script vectors are dropped', () => {
        let api!: SourceApi;
        mountEditor({ value: '<p>x</p>', ref: (a: SourceApi) => (api = a) });
        api.toggleSource(true);
        sourceArea()!.value = '<p onclick="x()">safe</p><script>alert(1)</script>';
        api.toggleSource(false);
        expect(area().innerHTML).toBe('<p>safe</p>');
    });

    it('getData reflects the live source text while the source view is open', () => {
        let api!: SourceApi;
        mountEditor({ value: '<p>x</p>', ref: (a: SourceApi) => (api = a) });
        api.toggleSource(true);
        sourceArea()!.value = '<p>live</p>';
        expect(api.getData()).toBe('<p>live</p>');
    });
});

describe('components/editor — image controls', () => {
    const IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

    const selectImg = () => {
        const img = area().querySelector('img') as HTMLImageElement;
        img.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        return img;
    };

    it('pressing an image shows the selection box, handles and alignment bar', () => {
        mountEditor({ value: '<p><img src="' + IMG + '"></p>' });
        expect(handle!.query('.lm-editor-img-box')).toBeNull();
        selectImg();
        const box = handle!.query('.lm-editor-img-box');
        expect(box).not.toBeNull();
        expect(box!.querySelectorAll('.lm-editor-img-handle')).toHaveLength(8); // 4 corners + 4 edges
        expect(box!.querySelectorAll('.lm-editor-img-bar .lm-toolbar-item').length).toBeGreaterThanOrEqual(6);
    });

    it('edge handles stretch one axis; corner handles restore the bitmap ratio', () => {
        mountEditor({ value: '<p><img src="' + IMG + '"></p>' });
        const img = selectImg();
        const drag = (corner: string, dx: number, dy: number) => {
            const grip = handle!.query('.lm-editor-img-handle[data-corner="' + corner + '"]') as HTMLElement;
            grip.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }));
            document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: dx, clientY: dy }));
            document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
        };
        drag('e', 30, 0);
        expect(img.style.width).toBe('30px'); // east: width only
        drag('s', 0, 25);
        expect(img.style.height).toBe('25px'); // south: height only
        drag('se', 40, 0);
        expect(img.style.width).toBe('40px');
        expect(img.style.height).toBe('auto'); // corners go back to proportional
    });

    it('the alignment menu writes float / centered-block styles', () => {
        mountEditor({ value: '<p><img src="' + IMG + '"></p>' });
        const img = selectImg();
        const itemFor = (icon: string) =>
            Array.from(handle!.queryAll('.lm-editor-img-bar .lm-toolbar-item'))
                .find((el) => el.querySelector('i')?.textContent === icon)!
                .querySelector('a') as HTMLElement;

        itemFor('format_align_left').click();
        expect(img.style.float).toBe('left');

        itemFor('format_align_center').click();
        expect(img.style.float).toBe('');
        expect(img.style.display).toBe('block');
        expect(img.style.margin).toContain('auto');

        itemFor('notes').click(); // inline resets everything
        expect(img.style.display).toBe('');
        expect(img.style.margin).toBe('');

        itemFor('open_in_full').click(); // full width
        expect(img.style.width).toBe('100%');
    });

    it('Delete removes the selected image and deselects', () => {
        mountEditor({ value: '<p><img src="' + IMG + '"></p>' });
        selectImg();
        area().dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
        expect(area().querySelector('img')).toBeNull();
        expect(handle!.query('.lm-editor-img-box')).toBeNull();
    });

    it('pressing outside the image deselects it', () => {
        mountEditor({ value: '<p>text <img src="' + IMG + '"></p>' });
        selectImg();
        expect(handle!.query('.lm-editor-img-box')).not.toBeNull();
        area().dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        expect(handle!.query('.lm-editor-img-box')).toBeNull();
    });
});

describe('components/editor — direct PDF generation', () => {
    const bytesText = (bytes: Uint8Array) => {
        let out = '';
        for (let i = 0; i < bytes.length; i++) {
            out += String.fromCharCode(bytes[i]);
        }
        return out;
    };

    it('emits a well-formed PDF: header, xref, trailer, fonts', async () => {
        const pdf = bytesText(await htmlToPdf('<h1>Title</h1><p>Hello <b>world</b></p>'));
        expect(pdf.startsWith('%PDF-1.4')).toBe(true);
        expect(pdf).toContain('%%EOF');
        expect(pdf).toContain('/Type /Catalog');
        expect(pdf).toContain('/BaseFont /Helvetica');
        expect(pdf).toContain('(Hello) Tj');
        expect(pdf).toContain('/F2'); // the bold run and the heading
        expect(pdf).toContain('startxref');
    });

    it('paginates long content across multiple pages', async () => {
        const paragraphs = new Array(200).fill('<p>A paragraph of body text.</p>').join('');
        const pdf = bytesText(await htmlToPdf(paragraphs));
        const pages = pdf.match(/\/Type \/Page[^s]/g) || [];
        expect(pages.length).toBeGreaterThan(1);
        expect(pdf).toContain('/Count ' + pages.length);
    });

    it('escapes PDF string delimiters in text and metadata', async () => {
        const pdf = bytesText(await htmlToPdf('<p>(parens) and \\slash</p>', { title: 'A (title)' }));
        expect(pdf).toContain('\\(parens\\)');
        expect(pdf).toContain('\\\\slash');
        expect(pdf).toContain('/Title (A \\(title\\))');
    });

    it('draws tables: borders, header fill, cell background colors', async () => {
        const pdf = bytesText(await htmlToPdf(
            '<table><tbody><tr><th>H</th><td style="background-color:#ff0000">x</td></tr></tbody></table>'
        ));
        expect(pdf).toContain(' re'); // cell rectangles
        expect(pdf).toContain('0.95 0.95 0.95 rg'); // th fill
        expect(pdf).toContain('1 0 0 rg'); // the red cell background
    });

    it('links become real /URI annotations', async () => {
        const pdf = bytesText(await htmlToPdf('<p><a href="https://lemonadejs.com">site</a></p>'));
        expect(pdf).toContain('/Subtype /Link');
        expect(pdf).toContain('/URI (https://lemonadejs.com)');
    });

    it('embeds JPEG images as DCTDecode XObjects with SOF dimensions', async () => {
        // a crafted minimal JPEG: SOI + SOF0 (16 × 32) + EOI
        const bytes = [0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x20,
            0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xd9];
        expect(jpegSize(new Uint8Array(bytes))).toEqual({ width: 32, height: 16 });
        const b64 = btoa(String.fromCharCode(...bytes));
        const pdf = bytesText(await htmlToPdf('<p><img src="data:image/jpeg;base64,' + b64 + '"></p>'));
        expect(pdf).toContain('/Subtype /Image');
        expect(pdf).toContain('/Filter /DCTDecode');
        expect(pdf).toContain('/Width 32');
        expect(pdf).toContain('/Height 16');
        expect(pdf).toContain('/Im1 Do');
    });

    it('honors independent width/height styles on images (edge-handle stretch)', async () => {
        const bytes = [0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x20,
            0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xd9];
        const b64 = btoa(String.fromCharCode(...bytes));
        const pdf = bytesText(await htmlToPdf(
            '<p><img style="width:40px;height:20px" src="data:image/jpeg;base64,' + b64 + '"></p>'
        ));
        // 40px × 0.75 = 30pt wide, 20px × 0.75 = 15pt tall — the cm matrix
        expect(pdf).toContain('30 0 0 15');
    });

    it('explicit page breaks start new pages (one record per page)', async () => {
        const record = '<h2>Invoice</h2><p>body</p>';
        const html = [record, record, record]
            .join('<div style="page-break-before: always"></div>');
        const pdf = bytesText(await htmlToPdf(html));
        const pages = pdf.match(/\/Type \/Page[^s]/g) || [];
        expect(pages.length).toBe(3);
    });

    it('parseColor covers hex, rgb() and names', () => {
        expect(parseColor('#ff0000')).toEqual([1, 0, 0]);
        expect(parseColor('#0f0')).toEqual([0, 1, 0]);
        expect(parseColor('rgb(0, 0, 255)')).toEqual([0, 0, 1]);
        expect(parseColor('white')).toEqual([1, 1, 1]);
        expect(parseColor('bogus')).toBeNull();
    });
});

describe('components/editor — local exporters', () => {
    it('printableDocument stages a full print document with @page rules', () => {
        const doc = printableDocument('<p>body</p>', { title: 'A <b>title</b>', pageSize: 'Letter', margin: '10mm' });
        expect(doc).toContain('<p>body</p>');
        expect(doc).toContain('@page { size: Letter; margin: 10mm; }');
        expect(doc).toContain('A &lt;b&gt;title&lt;/b&gt;'); // title is escaped
        expect(doc).toContain('border-collapse'); // the shared document look ships
    });

    it('wordDocument packages MHTML with the Word namespace header', () => {
        const doc = wordDocument('<p>hello</p>', 'Report');
        expect(doc).toContain('MIME-Version: 1.0');
        expect(doc).toContain('multipart/related');
        expect(doc).toContain('urn:schemas-microsoft-com:office:word');
        expect(doc).toContain('<p>hello</p>');
        expect(doc).toContain('<title>Report</title>');
    });

    it('wordDocument lifts inline data: images into multipart entries', () => {
        const doc = wordDocument('<p><img src="data:image/png;base64,iVBORw0KGgo="></p>');
        expect(doc).toContain('src="image1.png"'); // the document references the part…
        expect(doc).toContain('Content-Location: file:///C:/lemonade/image1.png'); // …declared here
        expect(doc).toContain('Content-Transfer-Encoding: base64');
        expect(doc).toContain('iVBORw0KGgo=');
        expect(doc).not.toContain('src="data:image/png');
    });
});
