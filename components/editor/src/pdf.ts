/**
 * Direct PDF generation for the Editor block — a zero-dependency PDF
 * writer that runs entirely in the browser (no print dialog, no server).
 *
 * The semantic subset the editor produces is laid out by a small text
 * engine: word wrap against real text metrics (canvas measureText when
 * available, a Helvetica approximation otherwise), headings, inline
 * marks (bold/italic/underline/strike, sub/superscript, colors,
 * highlights, links → real /URI annotations), lists, quotes, code
 * blocks, images (JPEG embedded directly, anything else re-encoded
 * through a canvas), and tables laid out on the same occupancy grid the
 * editor edits with — colgroup widths, col/rowspans, header fills and
 * cell backgrounds all survive. Pages use the standard 14 fonts
 * (Helvetica + Courier, WinAnsi), so files are small and text stays
 * selectable. Non-Latin-1 characters fall back to '?' — the price of
 * shipping no font files.
 */

import { buildGrid, cellPosition, columnCount } from './table';

export interface PdfOptions {
    /** PDF metadata title */
    title?: string;
    /** 'A4' (default) | 'Letter' | [width, height] in points */
    pageSize?: 'A4' | 'Letter' | [number, number];
    /** Page margin in points (default 56.7 = 20mm) */
    margin?: number;
}

const SIZES: Record<string, [number, number]> = { A4: [595.28, 841.89], Letter: [612, 792] };

// ---- text metrics ---------------------------------------------------------

let metricsContext: CanvasRenderingContext2D | null | undefined;

const context2d = (): CanvasRenderingContext2D | null => {
    if (metricsContext === undefined) {
        try {
            metricsContext = document.createElement('canvas').getContext('2d');
        } catch (e) {
            metricsContext = null;
        }
    }
    return metricsContext;
};

/** Rough Helvetica advance widths (em) for environments without canvas */
const approxChar = (ch: string): number => {
    if (' iIljt.,:;|!\'"`()[]{}f'.indexOf(ch) !== -1) {
        return 0.31;
    }
    if ('mwMW@%'.indexOf(ch) !== -1) {
        return 0.89;
    }
    if (ch >= 'A' && ch <= 'Z') {
        return 0.68;
    }
    return 0.53;
};

const measure = (text: string, size: number, bold: boolean, italic: boolean, mono: boolean): number => {
    const ctx = context2d();
    if (ctx) {
        ctx.font = (italic ? 'italic ' : '') + (bold ? 'bold ' : '') + size + 'px ' + (mono ? 'Courier, monospace' : 'Helvetica, Arial, sans-serif');
        return ctx.measureText(text).width;
    }
    if (mono) {
        return text.length * 0.6 * size;
    }
    let width = 0;
    for (const ch of text) {
        width += approxChar(ch);
    }
    return width * size * (bold ? 1.05 : 1);
};

// ---- PDF string encoding --------------------------------------------------

/** CP1252 positions for the common non-Latin-1 punctuation */
const CP1252: Record<string, number> = {
    '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133,
    '†': 134, '‡': 135, '‰': 137, '‹': 139, '‘': 145,
    '’': 146, '“': 147, '”': 148, '•': 149, '–': 150,
    '—': 151, '˜': 152, '™': 153, '›': 155,
};

const winAnsi = (text: string): string => {
    let out = '';
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (code === 0x5c) {
            out += '\\\\';
        } else if (code === 0x28) {
            out += '\\(';
        } else if (code === 0x29) {
            out += '\\)';
        } else if (code === 0x0a || code === 0x0d) {
            out += ' ';
        } else if (code < 256) {
            out += ch;
        } else if (CP1252[ch]) {
            out += String.fromCharCode(CP1252[ch]);
        } else {
            out += '?';
        }
    }
    return out;
};

const num = (v: number): string => (Math.round(v * 100) / 100).toString();

// ---- colors ---------------------------------------------------------------

export type Rgb = [number, number, number];

const NAMED: Record<string, Rgb> = {
    black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], green: [0, 0.5, 0],
    blue: [0, 0, 1], gray: [0.5, 0.5, 0.5], grey: [0.5, 0.5, 0.5],
    yellow: [1, 1, 0], orange: [1, 0.65, 0], purple: [0.5, 0, 0.5],
};

export const parseColor = (value: string | null | undefined): Rgb | null => {
    if (!value) {
        return null;
    }
    const v = value.trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) {
        return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16) / 255) as Rgb;
    }
    m = v.match(/^#([0-9a-f]{6})/);
    if (m) {
        return [0, 1, 2].map((i) => parseInt(m![1].slice(i * 2, i * 2 + 2), 16) / 255) as Rgb;
    }
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
    }
    return NAMED[v] || null;
};

// ---- image decoding -------------------------------------------------------

interface Jpeg {
    bytes: Uint8Array;
    width: number;
    height: number;
}

const base64Bytes = (b64: string): Uint8Array => {
    const bin = atob(b64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
};

/** Read dimensions from the JPEG SOF marker */
export const jpegSize = (bytes: Uint8Array): { width: number; height: number } | null => {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        return null;
    }
    let at = 2;
    while (at + 9 < bytes.length) {
        if (bytes[at] !== 0xff) {
            at++;
            continue;
        }
        const marker = bytes[at + 1];
        // SOF0..SOF15 minus DHT(C4)/JPGext(C8)/DAC(CC)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            return { height: (bytes[at + 5] << 8) | bytes[at + 6], width: (bytes[at + 7] << 8) | bytes[at + 8] };
        }
        at += 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
    }
    return null;
};

/** Any drawable src → JPEG bytes + dimensions. JPEG data URLs decode
 *  directly; everything else goes through an <img> + canvas re-encode
 *  (browser only — environments without canvas skip the image). */
const toJpeg = async (src: string): Promise<Jpeg | null> => {
    const dataJpeg = src.match(/^data:image\/jpe?g;base64,(.+)$/i);
    if (dataJpeg) {
        const bytes = base64Bytes(dataJpeg[1]);
        const size = jpegSize(bytes);
        return size ? { bytes, width: size.width, height: size.height } : null;
    }
    if (!context2d()) {
        return null;
    }
    try {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('image load failed'));
            image.src = src;
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || 1;
        canvas.height = image.naturalHeight || 1;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff'; // JPEG has no alpha — flatten on white
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
        const bytes = base64Bytes(data);
        return { bytes, width: canvas.width, height: canvas.height };
    } catch (e) {
        return null; // unreadable image — the document flows on without it
    }
};

// ---- document model -------------------------------------------------------

interface Run {
    text: string;
    size: number;
    bold: boolean;
    italic: boolean;
    mono: boolean;
    underline: boolean;
    strike: boolean;
    color: Rgb;
    background: Rgb | null;
    rise: number; // sub/superscript baseline shift
    href: string | null;
    br?: boolean; // forced line break marker
}

interface Placed {
    run: Run;
    text: string;
    x: number;
    width: number;
}

interface Line {
    parts: Placed[];
    width: number;
    ascent: number;
    height: number;
}

interface InlineCtx {
    size: number;
    bold: boolean;
    italic: boolean;
    mono: boolean;
    underline: boolean;
    strike: boolean;
    color: Rgb;
    background: Rgb | null;
    rise: number;
    href: string | null;
}

const BASE: InlineCtx = {
    size: 11, bold: false, italic: false, mono: false, underline: false,
    strike: false, color: [0.125, 0.125, 0.125], background: null, rise: 0, href: null,
};

const HEADINGS: Record<string, number> = { H1: 22, H2: 17, H3: 14, H4: 12.5, H5: 11.5, H6: 11 };

const styleOf = (el: Element, name: string): string => {
    const style = el.getAttribute('style');
    if (!style) {
        return '';
    }
    const m = style.match(new RegExp('(?:^|;)\\s*' + name + '\\s*:\\s*([^;]+)', 'i'));
    return m ? m[1].trim() : '';
};

/** Flatten an element's inline content into styled runs */
const collectRuns = (el: Element, ctx: InlineCtx, runs: Run[], images: Element[]): void => {
    for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === 3) {
            const text = (node.textContent || '').replace(/\s+/g, ' ');
            if (text) {
                runs.push({ ...ctx, text });
            }
            continue;
        }
        if (node.nodeType !== 1) {
            continue;
        }
        const child = node as Element;
        const tag = child.tagName;
        if (tag === 'BR') {
            runs.push({ ...ctx, text: '', br: true });
            continue;
        }
        if (tag === 'IMG') {
            images.push(child);
            continue;
        }
        const next: InlineCtx = { ...ctx };
        if (tag === 'B' || tag === 'STRONG' || tag === 'TH') {
            next.bold = true;
        }
        if (tag === 'I' || tag === 'EM') {
            next.italic = true;
        }
        if (tag === 'U') {
            next.underline = true;
        }
        if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
            next.strike = true;
        }
        if (tag === 'CODE') {
            next.mono = true;
        }
        if (tag === 'SUB') {
            next.size = ctx.size * 0.72;
            next.rise = -ctx.size * 0.18;
        }
        if (tag === 'SUP') {
            next.size = ctx.size * 0.72;
            next.rise = ctx.size * 0.36;
        }
        if (tag === 'A') {
            next.href = child.getAttribute('href');
            next.color = [0.15, 0.39, 0.92];
            next.underline = true;
        }
        const color = parseColor(styleOf(child, 'color'));
        if (color) {
            next.color = color;
        }
        const background = parseColor(styleOf(child, 'background-color'));
        if (background) {
            next.background = background;
        }
        collectRuns(child, next, runs, images);
    }
};

/** Word-wrap runs into lines of the given width */
const wrap = (runs: Run[], width: number): Line[] => {
    const lines: Line[] = [];
    let parts: Placed[] = [];
    let x = 0;

    const flush = () => {
        let ascent = 0;
        let height = 0;
        for (const part of parts) {
            ascent = Math.max(ascent, part.run.size);
            height = Math.max(height, part.run.size * 1.5);
        }
        lines.push({ parts, width: x, ascent: ascent || 11, height: height || 16.5 });
        parts = [];
        x = 0;
    };

    for (const run of runs) {
        if (run.br) {
            flush();
            continue;
        }
        for (const word of run.text.split(/(?<=\s)/)) {
            if (!word) {
                continue;
            }
            const w = measure(word, run.size, run.bold, run.italic, run.mono);
            if (x > 0 && x + measure(word.replace(/\s+$/, ''), run.size, run.bold, run.italic, run.mono) > width) {
                flush();
            }
            const last = parts[parts.length - 1];
            if (last && last.run === run) {
                last.text += word;
                last.width += w;
            } else {
                parts.push({ run, text: word, x, width: w });
            }
            x += w;
        }
    }
    if (parts.length || !lines.length) {
        flush();
    }
    return lines;
};

// ---- the writer -----------------------------------------------------------

const FONTS = [
    ['F1', 'Helvetica'], ['F2', 'Helvetica-Bold'], ['F3', 'Helvetica-Oblique'],
    ['F4', 'Helvetica-BoldOblique'], ['F5', 'Courier'],
] as const;

const fontOf = (run: { bold: boolean; italic: boolean; mono: boolean }): string =>
    run.mono ? 'F5' : run.bold && run.italic ? 'F4' : run.bold ? 'F2' : run.italic ? 'F3' : 'F1';

interface LinkRect {
    x: number;
    y: number;
    w: number;
    h: number;
    url: string;
}

class Writer {
    pageW: number;
    pageH: number;
    margin: number;
    title: string;
    pages: string[][] = [];
    links: LinkRect[][] = [];
    images: { name: string; jpeg: Jpeg }[] = [];
    pageImages: Set<string>[] = [];
    y = 0; // cursor from the TOP of the page

    constructor(options: PdfOptions) {
        const size = Array.isArray(options.pageSize) ? options.pageSize : SIZES[options.pageSize || 'A4'] || SIZES.A4;
        this.pageW = size[0];
        this.pageH = size[1];
        this.margin = options.margin ?? 56.7;
        this.title = options.title || 'Document';
        this.newPage();
    }

    get contentW(): number {
        return this.pageW - this.margin * 2;
    }

    get limit(): number {
        return this.pageH - this.margin; // max cursor
    }

    newPage(): void {
        this.pages.push([]);
        this.links.push([]);
        this.pageImages.push(new Set());
        this.y = this.margin;
    }

    ensure(height: number): void {
        if (this.y + height > this.limit && this.y > this.margin + 1) {
            this.newPage();
        }
    }

    op(code: string): void {
        this.pages[this.pages.length - 1].push(code);
    }

    /** y from top → PDF y (origin bottom-left) */
    py(fromTop: number): number {
        return this.pageH - fromTop;
    }

    rect(x: number, yTop: number, w: number, h: number, fill: Rgb | null, stroke: Rgb | null, lineWidth = 0.7): void {
        const ops: string[] = [];
        if (fill) {
            ops.push(num(fill[0]) + ' ' + num(fill[1]) + ' ' + num(fill[2]) + ' rg');
        }
        if (stroke) {
            ops.push(num(stroke[0]) + ' ' + num(stroke[1]) + ' ' + num(stroke[2]) + ' RG', num(lineWidth) + ' w');
        }
        ops.push(num(x) + ' ' + num(this.py(yTop + h)) + ' ' + num(w) + ' ' + num(h) + ' re');
        ops.push(fill && stroke ? 'B' : fill ? 'f' : 'S');
        this.op(ops.join('\n'));
    }

    /** Draw one wrapped line at the cursor; the caller advances y */
    drawLine(line: Line, x: number, align: string, boxWidth: number): void {
        let dx = 0;
        if (align === 'center') {
            dx = Math.max(0, (boxWidth - line.width) / 2);
        } else if (align === 'right') {
            dx = Math.max(0, boxWidth - line.width);
        }
        const baseline = this.y + line.ascent;
        for (const part of line.parts) {
            const run = part.run;
            const px = x + dx + part.x;
            if (run.background) {
                this.rect(px, baseline - run.size, part.width, run.size * 1.3, run.background, null);
            }
            const text = winAnsi(part.text.replace(/\s+$/, ''));
            if (text) {
                this.op(
                    'BT\n/' + fontOf(run) + ' ' + num(run.size) + ' Tf\n' +
                    num(run.color[0]) + ' ' + num(run.color[1]) + ' ' + num(run.color[2]) + ' rg\n' +
                    (run.rise ? num(run.rise) + ' Ts\n' : '') +
                    num(px) + ' ' + num(this.py(baseline)) + ' Td\n(' + text + ') Tj\nET'
                );
            }
            if (run.underline) {
                this.rect(px, baseline + 1.5, part.width, 0.6, run.color, null);
            }
            if (run.strike) {
                this.rect(px, baseline - run.size * 0.3, part.width, 0.6, run.color, null);
            }
            if (run.href) {
                this.links[this.links.length - 1].push({
                    x: px, y: this.py(baseline + 3), w: part.width, h: run.size + 4, url: run.href,
                });
            }
        }
    }

    image(name: string, jpeg: Jpeg, x: number, yTop: number, w: number, h: number): void {
        if (!this.images.some((entry) => entry.name === name)) {
            this.images.push({ name, jpeg });
        }
        this.pageImages[this.pageImages.length - 1].add(name);
        this.op('q\n' + num(w) + ' 0 0 ' + num(h) + ' ' + num(x) + ' ' + num(this.py(yTop + h)) + ' cm\n/' + name + ' Do\nQ');
    }

    // ---- assembly ----------------------------------------------------------

    finish(): Uint8Array {
        const chunks: (string | Uint8Array)[] = [];
        const offsets: number[] = [];
        let position = 0;

        const push = (chunk: string | Uint8Array) => {
            chunks.push(chunk);
            position += typeof chunk === 'string' ? chunk.length : chunk.length;
        };
        // objects are emitted in id order — every emit records its offset
        const emit = (id: number, body: string) => {
            offsets.push(position);
            push(id + ' 0 obj\n' + body + '\nendobj\n');
        };

        push('%PDF-1.4\n%ÂµÂ¶\n');

        // ids are sequential: catalog, info, then everything else
        const total = this.pages.length;
        const catalogId = 1;
        const infoId = 2;
        const pagesId = 3;
        const fontIds: Record<string, number> = {};
        let nextId = 4;
        for (const [name] of FONTS) {
            fontIds[name] = nextId++;
        }
        const imageIds: Record<string, number> = {};
        for (const entry of this.images) {
            imageIds[entry.name] = nextId++;
        }
        const contentIds = this.pages.map(() => nextId++);
        const pageIds = this.pages.map(() => nextId++);
        const annotIds = this.links.map((list) => list.map(() => nextId++));

        emit(catalogId, '<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>');
        emit(infoId, '<< /Title (' + winAnsi(this.title) + ') /Producer (LemonadeJS Editor) >>');
        emit(pagesId, '<< /Type /Pages /Count ' + total + ' /Kids [' + pageIds.map((id) => id + ' 0 R').join(' ') + '] >>');
        for (const [name, base] of FONTS) {
            emit(fontIds[name], '<< /Type /Font /Subtype /Type1 /BaseFont /' + base + ' /Encoding /WinAnsiEncoding >>');
        }
        for (const entry of this.images) {
            offsets.push(position);
            push(
                imageIds[entry.name] + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + entry.jpeg.width +
                ' /Height ' + entry.jpeg.height +
                ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + entry.jpeg.bytes.length +
                ' >>\nstream\n'
            );
            push(entry.jpeg.bytes);
            push('\nendstream\nendobj\n');
        }
        this.pages.forEach((ops, index) => {
            const stream = ops.join('\n');
            emit(contentIds[index], '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
        });
        this.pages.forEach((ops, index) => {
            const fonts = FONTS.map(([name]) => '/' + name + ' ' + fontIds[name] + ' 0 R').join(' ');
            const xobjects = Array.from(this.pageImages[index])
                .map((name) => '/' + name + ' ' + imageIds[name] + ' 0 R')
                .join(' ');
            const annots = annotIds[index].length
                ? ' /Annots [' + annotIds[index].map((id) => id + ' 0 R').join(' ') + ']'
                : '';
            emit(
                pageIds[index],
                '<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + num(this.pageW) + ' ' + num(this.pageH) + ']' +
                ' /Resources << /Font << ' + fonts + ' >>' + (xobjects ? ' /XObject << ' + xobjects + ' >>' : '') + ' >>' +
                ' /Contents ' + contentIds[index] + ' 0 R' + annots + ' >>'
            );
        });
        this.links.forEach((list, index) => {
            list.forEach((link, li) => {
                emit(
                    annotIds[index][li],
                    '<< /Type /Annot /Subtype /Link /Rect [' + num(link.x) + ' ' + num(link.y) + ' ' +
                    num(link.x + link.w) + ' ' + num(link.y + link.h) + '] /Border [0 0 0]' +
                    ' /A << /S /URI /URI (' + winAnsi(link.url) + ') >> >>'
                );
            });
        });

        const xrefAt = position;
        let xref = 'xref\n0 ' + (offsets.length + 1) + '\n0000000000 65535 f \n';
        for (const offset of offsets) {
            xref += String(offset).padStart(10, '0') + ' 00000 n \n';
        }
        push(
            xref + 'trailer\n<< /Size ' + (offsets.length + 1) + ' /Root ' + catalogId + ' 0 R /Info ' + infoId +
            ' 0 R >>\nstartxref\n' + xrefAt + '\n%%EOF'
        );

        let length = 0;
        for (const chunk of chunks) {
            length += chunk.length;
        }
        const out = new Uint8Array(length);
        let at = 0;
        for (const chunk of chunks) {
            if (typeof chunk === 'string') {
                for (let i = 0; i < chunk.length; i++) {
                    out[at++] = chunk.charCodeAt(i) & 0xff;
                }
            } else {
                out.set(chunk, at);
                at += chunk.length;
            }
        }
        return out;
    }
}

// ---- block layout ---------------------------------------------------------

interface BlockCtx {
    x: number;
    width: number;
    inline: InlineCtx;
    align: string;
}

const alignOf = (el: Element, fallback: string): string => {
    const style = styleOf(el, 'text-align');
    return style || el.getAttribute('align') || fallback;
};

const drawParagraph = (
    pdf: Writer,
    el: Element,
    ctx: BlockCtx,
    images: Map<string, Jpeg>,
    spacing = 5
): void => {
    const runs: Run[] = [];
    const imgRefs: Element[] = [];
    collectRuns(el, ctx.inline, runs, imgRefs);
    const align = alignOf(el, ctx.align);
    if (runs.some((run) => run.text.trim() || run.br)) {
        const lines = wrap(runs, ctx.width);
        for (const line of lines) {
            pdf.ensure(line.height);
            pdf.drawLine(line, ctx.x, align, ctx.width);
            pdf.y += line.height;
        }
        pdf.y += spacing;
    }
    for (const img of imgRefs) {
        drawImage(pdf, img, ctx, images, align);
    }
};

let imageCounter = 0;
const imageNames = new Map<string, string>();

const drawImage = (pdf: Writer, el: Element, ctx: BlockCtx, images: Map<string, Jpeg>, fallback: string): void => {
    const src = el.getAttribute('src') || '';
    const jpeg = images.get(src);
    if (!jpeg) {
        return;
    }
    let name = imageNames.get(src);
    if (!name) {
        name = 'Im' + ++imageCounter;
        imageNames.set(src, name);
    }
    // the editor's image alignment (float / centered block) carries over
    const float = styleOf(el, 'float');
    const align =
        float === 'left' || float === 'right'
            ? float
            : styleOf(el, 'display') === 'block' && /auto/.test(styleOf(el, 'margin'))
                ? 'center'
                : fallback;
    // natural px → pt, honoring explicit width AND height (edge-handle
    // stretches set both; corners set width with height auto), fitted to
    // column + page
    let w = jpeg.width * 0.75;
    let h = jpeg.height * 0.75;
    const ratio = h / (w || 1);
    const styleWidth = styleOf(el, 'width');
    const styleHeight = styleOf(el, 'height');
    if (/%$/.test(styleWidth)) {
        w = (parseFloat(styleWidth) / 100) * ctx.width;
        h = w * ratio;
    } else if (parseFloat(styleWidth) > 0) {
        w = parseFloat(styleWidth) * 0.75;
        h = w * ratio;
    }
    if (parseFloat(styleHeight) > 0) {
        h = parseFloat(styleHeight) * 0.75;
        if (!(parseFloat(styleWidth) > 0) && !/%$/.test(styleWidth)) {
            w = h / (ratio || 1); // height-only stretch keeps width from the ratio
        }
    }
    const maxH = pdf.limit - pdf.margin;
    const scale = Math.min(1, ctx.width / w, maxH / h);
    w *= scale;
    h *= scale;
    pdf.ensure(h);
    const x = align === 'center' ? ctx.x + (ctx.width - w) / 2 : align === 'right' ? ctx.x + ctx.width - w : ctx.x;
    pdf.image(name, jpeg, x, pdf.y, w, h);
    pdf.y += h + 5;
};

const drawList = (pdf: Writer, el: Element, ctx: BlockCtx, images: Map<string, Jpeg>, level: number): void => {
    const ordered = el.tagName === 'OL';
    let index = 1;
    for (const item of Array.from(el.children)) {
        if (item.tagName !== 'LI') {
            continue;
        }
        const marker = ordered ? index + '.' : '•';
        const markerWidth = 16;
        const inner: BlockCtx = { ...ctx, x: ctx.x + markerWidth, width: ctx.width - markerWidth };
        // marker on the first line of the item
        pdf.ensure(ctx.inline.size * 1.5);
        pdf.drawLine(
            {
                parts: [{ run: { ...ctx.inline, text: marker, href: null } as Run, text: marker, x: 0, width: markerWidth }],
                width: markerWidth,
                ascent: ctx.inline.size,
                height: 0,
            },
            ctx.x + (ordered ? 0 : 3),
            'left',
            markerWidth
        );
        // nested lists inside the item render after its own inline content
        const nested = Array.from(item.children).filter((child) => child.tagName === 'UL' || child.tagName === 'OL');
        const clone = item.cloneNode(true) as Element;
        for (const list of Array.from(clone.children)) {
            if (list.tagName === 'UL' || list.tagName === 'OL') {
                list.remove();
            }
        }
        drawParagraph(pdf, clone, inner, images, 2);
        for (const list of nested) {
            drawList(pdf, list, inner, images, level + 1);
        }
        index++;
    }
    pdf.y += 3;
};

const drawTable = async (pdf: Writer, table: HTMLTableElement, ctx: BlockCtx, images: Map<string, Jpeg>): Promise<void> => {
    const grid = buildGrid(table);
    if (!grid.length) {
        return;
    }
    const count = columnCount(table);
    if (!count) {
        return;
    }
    // column weights: colgroup px widths when present, else equal
    const cols = Array.from(table.querySelectorAll(':scope > colgroup > col'));
    let weights: number[] = new Array(count).fill(1);
    if (cols.length === count) {
        const px = cols.map((col) => parseFloat((col as HTMLElement).style.width) || 0);
        if (px.every((w) => w > 0)) {
            weights = px;
        }
    }
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const colW = weights.map((w) => (w / totalWeight) * ctx.width);
    const padding = 4;
    const border: Rgb = [0.65, 0.65, 0.65];
    const rows = grid.length;

    // lay out every starting cell once: lines + natural height
    interface CellBox {
        el: HTMLTableCellElement;
        row: number;
        col: number;
        colSpan: number;
        rowSpan: number;
        lines: Line[];
        width: number;
        height: number;
    }
    const boxes: CellBox[] = [];
    const seen = new Set<HTMLTableCellElement>();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const cell = grid[r][c];
            if (!cell || seen.has(cell)) {
                continue;
            }
            seen.add(cell);
            const pos = cellPosition(grid, cell)!;
            const colSpan = cell.colSpan || 1;
            const width = colW.slice(pos.col, pos.col + colSpan).reduce((sum, w) => sum + w, 0);
            const inline: InlineCtx = { ...ctx.inline, size: 10, bold: cell.tagName === 'TH' };
            const runs: Run[] = [];
            const imgRefs: Element[] = [];
            collectRuns(cell, inline, runs, imgRefs);
            const lines = runs.some((run) => run.text.trim() || run.br) ? wrap(runs, width - padding * 2) : [];
            const height = lines.reduce((sum, line) => sum + line.height, 0) + padding * 2;
            boxes.push({
                el: cell, row: pos.row, col: pos.col, colSpan, rowSpan: cell.rowSpan || 1,
                lines, width, height: Math.max(height, 18),
            });
        }
    }

    // row heights from single-row cells; rowspan overflow grows the last row
    const rowH: number[] = new Array(rows).fill(18);
    for (const box of boxes) {
        if (box.rowSpan === 1) {
            rowH[box.row] = Math.max(rowH[box.row], box.height);
        }
    }
    for (const box of boxes) {
        if (box.rowSpan > 1) {
            const covered = rowH.slice(box.row, box.row + box.rowSpan).reduce((sum, h) => sum + h, 0);
            if (box.height > covered) {
                rowH[box.row + box.rowSpan - 1] += box.height - covered;
            }
        }
    }

    // Pagination unit: runs of rows welded together by rowspans (a page
    // break may only fall on a boundary no span crosses). Each group is
    // placed, then its cells draw immediately — so every op lands on the
    // page the group actually lives on.
    const groups: [number, number][] = [];
    let groupStart = 0;
    for (let r = 1; r <= rows; r++) {
        const breakable = r === rows || !(grid[r] || []).some((cell, c) => cell && grid[r - 1]?.[c] === cell);
        if (breakable) {
            groups.push([groupStart, r - 1]);
            groupStart = r;
        }
    }

    const xOf = (col: number): number => ctx.x + colW.slice(0, col).reduce((sum, w) => sum + w, 0);
    const rowTop: number[] = new Array(rows).fill(0);

    for (const [g0, g1] of groups) {
        const groupH = rowH.slice(g0, g1 + 1).reduce((sum, h) => sum + h, 0);
        if (pdf.y + groupH > pdf.limit && pdf.y > pdf.margin + 1 && groupH <= pdf.limit - pdf.margin) {
            pdf.newPage();
        }
        for (let r = g0; r <= g1; r++) {
            rowTop[r] = pdf.y;
            pdf.y += rowH[r];
        }
        const savedY = pdf.y;
        for (const box of boxes) {
            if (box.row < g0 || box.row > g1) {
                continue;
            }
            const x = xOf(box.col);
            const yTop = rowTop[box.row];
            const height = rowH.slice(box.row, box.row + box.rowSpan).reduce((sum, h) => sum + h, 0);
            const background =
                parseColor(styleOf(box.el, 'background-color')) || (box.el.tagName === 'TH' ? [0.945, 0.945, 0.945] as Rgb : null);
            pdf.rect(x, yTop, box.width, height, background, border, 0.7);
            let lineY = yTop + padding;
            const align = alignOf(box.el, 'left');
            for (const line of box.lines) {
                pdf.y = lineY;
                pdf.drawLine(line, x + padding, align, box.width - padding * 2);
                lineY += line.height;
            }
        }
        pdf.y = savedY;
    }
    pdf.y += 8;
};

const walkBlocks = async (pdf: Writer, parent: Element, ctx: BlockCtx, images: Map<string, Jpeg>): Promise<void> => {
    for (const el of Array.from(parent.children)) {
        const tag = el.tagName;
        // explicit page breaks (mail-merge: one record per page)
        if (
            styleOf(el, 'page-break-before') === 'always' ||
            styleOf(el, 'break-before') === 'page' ||
            el.classList.contains('lm-page-break')
        ) {
            if (pdf.pages[pdf.pages.length - 1].length || pdf.y > pdf.margin) {
                pdf.newPage();
            }
        }
        if (HEADINGS[tag]) {
            pdf.y += 4;
            drawParagraph(pdf, el, { ...ctx, inline: { ...ctx.inline, size: HEADINGS[tag], bold: true } }, images, 6);
        } else if (tag === 'P' || tag === 'DIV') {
            // a div wrapping blocks recurses; a div of prose is a paragraph
            if (el.querySelector(':scope > table, :scope > ul, :scope > ol, :scope > blockquote, :scope > pre, :scope > p, :scope > div, :scope > h1, :scope > h2, :scope > h3')) {
                await walkBlocks(pdf, el, ctx, images);
            } else {
                drawParagraph(pdf, el, ctx, images);
            }
        } else if (tag === 'UL' || tag === 'OL') {
            drawList(pdf, el, ctx, images, 0);
        } else if (tag === 'BLOCKQUOTE') {
            const start = pdf.y;
            const inner: BlockCtx = {
                ...ctx, x: ctx.x + 12, width: ctx.width - 12,
                inline: { ...ctx.inline, color: [0.39, 0.39, 0.39] },
            };
            const hasBlocks = Array.from(el.children).some((child) =>
                /^(P|DIV|UL|OL|TABLE|PRE|BLOCKQUOTE|H[1-6])$/.test(child.tagName));
            if (hasBlocks) {
                await walkBlocks(pdf, el, inner, images);
            } else {
                drawParagraph(pdf, el, inner, images);
            }
            pdf.rect(ctx.x + 2, start, 2.5, Math.max(4, pdf.y - start - 5), [0.85, 0.85, 0.85], null);
        } else if (tag === 'PRE') {
            const text = el.textContent || '';
            const lines = text.replace(/\n$/, '').split('\n');
            const lineH = 13;
            const blockH = lines.length * lineH + 10;
            pdf.ensure(Math.min(blockH, pdf.limit - pdf.margin));
            const boxStart = pdf.y;
            pdf.rect(ctx.x, boxStart, ctx.width, Math.min(blockH, pdf.limit - boxStart), [0.94, 0.94, 0.94], null);
            pdf.y += 5;
            const mono: InlineCtx = { ...ctx.inline, mono: true, size: 9.5 };
            for (const line of lines) {
                pdf.ensure(lineH);
                pdf.drawLine(
                    { parts: [{ run: { ...mono, text: line, href: null } as Run, text: line, x: 0, width: 0 }], width: 0, ascent: 9.5, height: lineH },
                    ctx.x + 6, 'left', ctx.width - 12
                );
                pdf.y += lineH;
            }
            pdf.y += 10;
        } else if (tag === 'HR') {
            pdf.ensure(12);
            pdf.rect(ctx.x, pdf.y + 5, ctx.width, 0.7, [0.73, 0.73, 0.73], null);
            pdf.y += 14;
        } else if (tag === 'TABLE') {
            await drawTable(pdf, el as HTMLTableElement, ctx, images);
        } else if (tag === 'IMG') {
            drawImage(pdf, el, ctx, images, alignOf(el, ctx.align));
        } else if (tag === 'FIGURE') {
            await walkBlocks(pdf, el, ctx, images);
        } else {
            drawParagraph(pdf, el, ctx, images);
        }
    }
};

// ---- public api -----------------------------------------------------------

/** Generate a PDF from editor HTML — fully local, returns the bytes */
export const htmlToPdf = async (html: string, options: PdfOptions = {}): Promise<Uint8Array> => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    imageNames.clear();
    imageCounter = 0;

    // decode every image up front (async) so layout itself stays sync
    const images = new Map<string, Jpeg>();
    const sources = new Set<string>();
    for (const img of Array.from(doc.images)) {
        const src = img.getAttribute('src');
        if (src) {
            sources.add(src);
        }
    }
    for (const src of sources) {
        const jpeg = await toJpeg(src);
        if (jpeg) {
            images.set(src, jpeg);
        }
    }

    const pdf = new Writer(options);
    await walkBlocks(pdf, doc.body, { x: pdf.margin, width: pdf.contentW, inline: BASE, align: 'left' }, images);
    return pdf.finish();
};

/** Generate and download — a local Blob, nothing leaves the browser */
export const downloadPDF = async (html: string, filename = 'document.pdf', options: PdfOptions = {}): Promise<void> => {
    const name = /\.pdf$/i.test(filename) ? filename : filename + '.pdf';
    const bytes = await htmlToPdf(html, { title: name.replace(/\.pdf$/i, ''), ...options });
    const copy = new Uint8Array(bytes); // fresh ArrayBuffer — BlobPart wants a non-shared buffer type
    const blob = new Blob([copy.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};
