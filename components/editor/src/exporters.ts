/**
 * Output extensions for the Editor block — everything runs LOCALLY in
 * the browser, no server round-trip:
 *
 *   print / PDF   the content is staged in a hidden same-origin iframe
 *                 with real print CSS (@page size + margins, table
 *                 borders, page-break rules) and handed to the browser's
 *                 print pipeline — "Save as PDF" produces the PDF on the
 *                 user's machine. This is the only faithful local HTML→PDF
 *                 path: the browser's own layout engine paginates.
 *
 *   Word (.doc)   the content is packaged as an MHTML (MIME multipart)
 *                 Word document. Inline data: images are lifted into
 *                 real multipart entries (Word renders file parts, not
 *                 data URIs), styles ship in the head, and the Word
 *                 xmlns header makes Word open it in Print view. A Blob
 *                 download — nothing leaves the browser.
 */

/** The shared document look for both outputs — deliberately close to the
 *  on-screen editing area so print/Word match what the author saw */
export const CONTENT_CSS = [
    'body { font-family: -apple-system, system-ui, "Segoe UI", Arial, sans-serif; font-size: 12pt; color: #202020; line-height: 1.55; }',
    'h1, h2, h3, h4 { line-height: 1.25; page-break-after: avoid; }',
    'img { max-width: 100%; }',
    'hr { border: 0; border-top: 1px solid #bbbbbb; }',
    'blockquote { margin: 0; padding: 2pt 0 2pt 12pt; border-left: 3pt solid #d8d8d8; color: #646464; }',
    'pre { background: #f0f0f0; padding: 8pt; border-radius: 3pt; font-family: Consolas, monospace; font-size: 10pt; white-space: pre-wrap; page-break-inside: avoid; }',
    'table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }',
    'td, th { border: 1pt solid #8d8d8d; padding: 4pt 6pt; vertical-align: top; text-align: left; }',
    'th { background: #f0f0f0; }',
    'figure { margin: 0; page-break-inside: avoid; }',
].join('\n');

export interface PrintOptions {
    /** Document title (the print dialog / PDF metadata name) */
    title?: string;
    /** CSS @page size — 'A4', 'Letter', 'A4 landscape'… */
    pageSize?: string;
    /** CSS @page margin */
    margin?: string;
    /** Extra CSS appended after the built-in document styles */
    styles?: string;
}

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The full standalone document handed to the print pipeline — pure, so
 *  it is testable without a print dialog */
export const printableDocument = (content: string, options: PrintOptions = {}): string =>
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<title>' + escapeHtml(options.title || 'Document') + '</title>' +
    '<style>' +
    '@page { size: ' + (options.pageSize || 'A4') + '; margin: ' + (options.margin || '20mm') + '; }\n' +
    CONTENT_CSS + '\n' + (options.styles || '') +
    '</style></head><body>' + content + '</body></html>';

/**
 * Print the content (the browser dialog's "Save as PDF" is the local
 * HTML→PDF converter). Waits for images before opening the dialog.
 */
export const printHTML = (content: string, options: PrintOptions = {}): void => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(printableDocument(content, options));
    doc.close();
    const win = frame.contentWindow!;
    let cleaned = false;
    const cleanup = () => {
        if (!cleaned) {
            cleaned = true;
            frame.remove();
        }
    };
    win.onafterprint = cleanup;
    let pending = Array.from(doc.images).filter((img) => !img.complete).length;
    const go = () => {
        win.focus();
        win.print();
        // afterprint is unreliable in some engines — reclaim eventually
        setTimeout(cleanup, 60000);
    };
    if (pending === 0) {
        go();
    } else {
        const tick = () => {
            if (--pending <= 0) {
                go();
            }
        };
        for (const img of Array.from(doc.images)) {
            if (!img.complete) {
                img.onload = tick;
                img.onerror = tick;
            }
        }
        setTimeout(() => {
            if (pending > 0) {
                pending = 0;
                go(); // images that never load must not block printing
            }
        }, 3000);
    }
};

const BOUNDARY = '----=_lm-editor-word-part';
const LOCATION = 'file:///C:/lemonade/';

const wrap76 = (base64: string): string => {
    const lines: string[] = [];
    for (let i = 0; i < base64.length; i += 76) {
        lines.push(base64.slice(i, i + 76));
    }
    return lines.join('\r\n');
};

/**
 * The Word file CONTENT (MHTML) — pure and testable. Inline data: image
 * sources are replaced by relative names and emitted as multipart
 * entries next to the document part.
 */
export const wordDocument = (content: string, title = 'Document'): string => {
    const images: { name: string; type: string; data: string }[] = [];
    const html = content.replace(
        /src="data:(image\/[a-z0-9.+-]+);base64,([^"]+)"/gi,
        (match, type: string, data: string) => {
            const ext = type.split('/')[1].replace('+xml', '').replace('jpeg', 'jpg');
            const name = 'image' + (images.length + 1) + '.' + ext;
            images.push({ name, type, data });
            return 'src="' + name + '"';
        }
    );

    const head =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
        'xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title>' +
        '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
        '<w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
        '<style>' +
        '@page WordSection1 { size: 595.3pt 841.9pt; margin: 56.7pt; mso-page-orientation: portrait; }\n' +
        'div.WordSection1 { page: WordSection1; }\n' +
        CONTENT_CSS +
        '</style></head><body><div class="WordSection1">' + html + '</div></body></html>';

    const parts = [
        'MIME-Version: 1.0',
        'Content-Type: multipart/related; boundary="' + BOUNDARY + '"',
        '',
        '--' + BOUNDARY,
        'Content-Type: text/html; charset="utf-8"',
        'Content-Location: ' + LOCATION + 'document.html',
        '',
        head,
    ];
    for (const image of images) {
        parts.push(
            '',
            '--' + BOUNDARY,
            'Content-Type: ' + image.type,
            'Content-Transfer-Encoding: base64',
            'Content-Location: ' + LOCATION + image.name,
            '',
            wrap76(image.data)
        );
    }
    parts.push('', '--' + BOUNDARY + '--', '');
    return parts.join('\r\n');
};

/** Download the content as a Word file — a local Blob, no network */
export const downloadWord = (content: string, filename = 'document.doc'): void => {
    const name = /\.doc$/i.test(filename) ? filename : filename + '.doc';
    const blob = new Blob([wordDocument(content, name.replace(/\.doc$/i, ''))], {
        type: 'application/msword',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};
