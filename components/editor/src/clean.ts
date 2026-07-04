/**
 * Paste sanitizer for the Editor block — semantic HTML in, safe subset
 * out. Word/Google-Docs paste arrives wrapped in kilobytes of spans,
 * classes and mso styles; this keeps structure (headings, lists, tables,
 * images, links, basic inline marks + a few inline styles) and drops the
 * rest. Scripting vectors (script/style tags, on* attributes,
 * javascript: URLs) are removed outright.
 */

const KEEP = new Set([
    'P', 'DIV', 'BR', 'SPAN', 'A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE',
    'UL', 'OL', 'LI', 'HR', 'SUB', 'SUP',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'COLGROUP', 'COL', 'CAPTION',
    'IMG', 'FIGURE', 'FIGCAPTION',
]);

/** Removed WITH their content — nothing inside them is user prose */
const DROP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'TITLE', 'HEAD', 'NOSCRIPT', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']);

const STYLES = [
    'color', 'background-color', 'text-align', 'width', 'height',
    'font-weight', 'font-style', 'text-decoration',
    'float', 'display', 'margin', // image alignment survives a round trip
];

const safeUrl = (value: string, image: boolean): string | null => {
    const url = value.trim();
    if (/^javascript:/i.test(url) || /^data:/i.test(url) && !(image && /^data:image\//i.test(url))) {
        return null;
    }
    return url;
};

const cleanAttributes = (el: Element): void => {
    for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        let keep = false;
        if (name === 'href' && el.tagName === 'A') {
            const url = safeUrl(attr.value, false);
            if (url) {
                el.setAttribute('href', url);
                keep = true;
            }
        } else if (name === 'src' && el.tagName === 'IMG') {
            const url = safeUrl(attr.value, true);
            if (url) {
                el.setAttribute('src', url);
                keep = true;
            }
        } else if (name === 'alt' || name === 'colspan' || name === 'rowspan') {
            keep = true;
        } else if (name === 'style') {
            const kept: string[] = [];
            for (const rule of attr.value.split(';')) {
                const at = rule.indexOf(':');
                if (at > 0) {
                    const prop = rule.slice(0, at).trim().toLowerCase();
                    if (STYLES.indexOf(prop) !== -1) {
                        kept.push(prop + ':' + rule.slice(at + 1).trim());
                    }
                }
            }
            if (kept.length) {
                el.setAttribute('style', kept.join(';'));
                keep = true;
            }
        }
        if (!keep) {
            el.removeAttribute(attr.name);
        }
    }
};

const walk = (node: Element): void => {
    for (const child of Array.from(node.children)) {
        if (DROP.has(child.tagName)) {
            child.remove();
            continue;
        }
        walk(child);
        if (KEEP.has(child.tagName)) {
            cleanAttributes(child);
        } else {
            // unknown container: unwrap, keep the prose inside
            while (child.firstChild) {
                node.insertBefore(child.firstChild, child);
            }
            child.remove();
        }
    }
};

export const sanitize = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    walk(doc.body);
    return doc.body.innerHTML;
};

// ---- pretty printer (the source-editing view) ------------------------------

/** Kept on one line with their content — breaking them would inject
 *  whitespace into prose */
const INLINE = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'A', 'SPAN', 'CODE', 'SUB', 'SUP', 'BR', 'IMG', 'FONT']);

const openTag = (el: Element): string => {
    let out = '<' + el.tagName.toLowerCase();
    for (const attr of Array.from(el.attributes)) {
        out += ' ' + attr.name + '="' + attr.value.replace(/"/g, '&quot;') + '"';
    }
    return out + '>';
};

/**
 * Indented HTML for the source-editing textarea. Blocks whose children
 * are purely inline stay on one line (<p>Hello <b>x</b></p>); structure
 * (tables, lists, quotes) expands one level per line. <pre> is never
 * reformatted — its whitespace is content.
 */
export const prettyHtml = (html: string): string => {
    const body = new DOMParser().parseFromString(html, 'text/html').body;
    const out: string[] = [];
    const pad = (depth: number) => '    '.repeat(depth);
    const inlineOnly = (el: Element): boolean =>
        Array.from(el.childNodes).every(
            (node) => node.nodeType === 3 || (node.nodeType === 1 && INLINE.has((node as Element).tagName))
        );
    const walkNodes = (parent: Element, depth: number) => {
        for (const node of Array.from(parent.childNodes)) {
            if (node.nodeType === 3) {
                const text = (node.textContent || '').trim();
                if (text) {
                    out.push(pad(depth) + text);
                }
            } else if (node.nodeType === 1) {
                const el = node as Element;
                if (INLINE.has(el.tagName) || el.tagName === 'PRE' || !el.firstChild || inlineOnly(el)) {
                    out.push(pad(depth) + el.outerHTML);
                } else {
                    out.push(pad(depth) + openTag(el));
                    walkNodes(el, depth + 1);
                    out.push(pad(depth) + '</' + el.tagName.toLowerCase() + '>');
                }
            }
        }
    };
    walkNodes(body, 0);
    return out.join('\n');
};
