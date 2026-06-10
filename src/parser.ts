/**
 * LemonadeJS v6 — template parser
 *
 * Parses the static strings of a tagged template into a JSON tree (Template).
 * Runs ONCE per call site: the TemplateStringsArray identity is the cache key
 * (see html in index.ts). Slots are recorded by position; values are never
 * seen here.
 *
 * Slot positions supported:
 *   text:       <div>${...}</div>          → { type: '#slot', slot: i }
 *   attribute:  value="${...}" / a="x ${y}" → prop parts
 *   component:  <${Card} prop="1">...</${Card}>  → { type: { slot: i } }
 */

import type { Part, Template, VNode, VProp } from './types';
import { fail } from './errors';

const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

const enum Mode {
    Text,
    Tag,
    Attr,
    Eq,
    Value,
    Comment,
    Close,
}

export const parse = function (strings: readonly string[]): Template {
    const root: VNode = { type: '#root', children: [] };
    const stack: VNode[] = [root];

    let mode = Mode.Text;
    let text = '';
    let tag: VNode | null = null;
    let tagName = '';
    let attrName = '';
    let parts: Part[] = [];
    let valBuf = '';
    let quote = '';
    let selfClose = false;
    let closeName = '';
    let closeIsSlot = false;
    let commentTail = '';

    const parent = function (): VNode {
        return stack[stack.length - 1];
    };

    const children = function (node: VNode): VNode[] {
        if (!node.children) {
            node.children = [];
        }
        return node.children;
    };

    /**
     * Commit buffered text. Whitespace-only runs that contain a newline are
     * template indentation and are dropped; inline newlines collapse to a space.
     */
    const flushText = function (): void {
        if (!text) {
            return;
        }
        let t: string;
        if (/\S/.test(text)) {
            t = text.replace(/\s*\r?\n\s*/g, ' ');
        } else {
            t = /\n/.test(text) ? '' : text;
        }
        if (t) {
            children(parent()).push({ type: '#text', text: t });
        }
        text = '';
    };

    const commitAttr = function (): void {
        if (attrName) {
            if (valBuf) {
                parts.push(valBuf);
            }
            // Boolean attributes (<input disabled />) keep empty parts
            if (!tag!.props) {
                tag!.props = [];
            }
            tag!.props.push({ name: attrName, parts } as VProp);
        }
        attrName = '';
        parts = [];
        valBuf = '';
    };

    const openTag = function (): void {
        commitAttr();
        const node = tag!;
        // Capitalized tags are registered components: resolved at build time
        if (typeof node.type === 'string' && /^[A-Z]/.test(node.type)) {
            node.type = { name: node.type };
        }
        children(parent()).push(node);
        const isVoid = typeof node.type === 'string' && VOID_TAGS.has(node.type);
        if (!selfClose && !isVoid) {
            stack.push(node);
        }
        tag = null;
        tagName = '';
        selfClose = false;
        mode = Mode.Text;
    };

    const closeTag = function (name: string | null): void {
        if (stack.length < 2) {
            fail('LJS-101', name ? '</' + name + '>' : '</...>');
        }
        const top = stack.pop()!;
        const topName =
            typeof top.type === 'string' ? top.type : 'name' in top.type ? top.type.name : null;
        if (name && topName !== name) {
            fail('LJS-101', '</' + name + '> (expected </' + String(topName ?? 'component') + '>)');
        }
        closeName = '';
        closeIsSlot = false;
        mode = Mode.Text;
    };

    for (let s = 0; s < strings.length; s++) {
        const seg = strings[s];
        for (let i = 0; i < seg.length; i++) {
            const c = seg[i];
            switch (mode) {
                case Mode.Text:
                    if (c === '<') {
                        if (seg.startsWith('!--', i + 1)) {
                            flushText();
                            mode = Mode.Comment;
                            commentTail = '';
                            i += 3;
                        } else if (seg[i + 1] === '/') {
                            flushText();
                            mode = Mode.Close;
                            closeName = '';
                            closeIsSlot = false;
                            i++;
                        } else if (seg[i + 1] === undefined || /[a-zA-Z]/.test(seg[i + 1])) {
                            // Tag start — or component when the segment ends here: <${Card}
                            flushText();
                            tag = { type: '' };
                            tagName = '';
                            mode = Mode.Tag;
                        } else {
                            // Literal "<" in text: a < b
                            text += c;
                        }
                    } else {
                        text += c;
                    }
                    break;

                case Mode.Tag:
                    if (/[a-zA-Z0-9-]/.test(c)) {
                        tagName += c;
                        tag!.type = tagName;
                    } else if (c === '>') {
                        openTag();
                    } else if (c === '/') {
                        selfClose = true;
                    } else if (/\s/.test(c)) {
                        mode = Mode.Attr;
                    }
                    break;

                case Mode.Attr:
                    if (c === '>') {
                        commitAttr();
                        openTag();
                    } else if (c === '/') {
                        commitAttr();
                        selfClose = true;
                    } else if (c === '=') {
                        mode = Mode.Eq;
                    } else if (/\s/.test(c)) {
                        if (attrName) {
                            commitAttr();
                        }
                    } else {
                        attrName += c;
                    }
                    break;

                case Mode.Eq:
                    if (c === '"' || c === "'") {
                        quote = c;
                        valBuf = '';
                        mode = Mode.Value;
                    } else if (c === '>') {
                        commitAttr();
                        openTag();
                    } else if (!/\s/.test(c)) {
                        quote = '';
                        valBuf = c;
                        mode = Mode.Value;
                    }
                    break;

                case Mode.Value:
                    if (quote) {
                        if (c === quote) {
                            commitAttr();
                            quote = '';
                            mode = Mode.Attr;
                        } else {
                            valBuf += c;
                        }
                    } else if (/\s/.test(c)) {
                        commitAttr();
                        mode = Mode.Attr;
                    } else if (c === '>') {
                        commitAttr();
                        openTag();
                    } else if (c === '/') {
                        commitAttr();
                        selfClose = true;
                        mode = Mode.Attr;
                    } else {
                        valBuf += c;
                    }
                    break;

                case Mode.Comment:
                    commentTail = (commentTail + c).slice(-3);
                    if (commentTail === '-->') {
                        mode = Mode.Text;
                    }
                    break;

                case Mode.Close:
                    if (/[a-zA-Z0-9-]/.test(c)) {
                        closeName += c;
                    } else if (c === '>') {
                        closeTag(closeIsSlot ? null : closeName || null);
                    }
                    break;
            }
        }

        // Slot boundary between strings[s] and strings[s + 1]
        if (s < strings.length - 1) {
            const slot = s;
            switch (mode) {
                case Mode.Text:
                    flushText();
                    children(parent()).push({ type: '#slot', slot });
                    break;
                case Mode.Tag:
                    if (!tagName) {
                        // Component: <${Card}
                        tag!.type = { slot };
                        mode = Mode.Attr;
                    } else {
                        fail('LJS-105', 'expression inside a tag name');
                    }
                    break;
                case Mode.Eq:
                    // Unquoted: attr=${value}
                    parts.push({ slot });
                    commitAttr();
                    mode = Mode.Attr;
                    break;
                case Mode.Value:
                    if (valBuf) {
                        parts.push(valBuf);
                        valBuf = '';
                    }
                    parts.push({ slot });
                    if (!quote) {
                        commitAttr();
                        mode = Mode.Attr;
                    }
                    break;
                case Mode.Close:
                    // Component close: </${Card}>
                    closeIsSlot = true;
                    break;
                case Mode.Comment:
                    // Expressions inside comments are ignored
                    break;
                default:
                    fail('LJS-105', 'expression in an attribute name');
            }
        }
    }

    flushText();
    if (stack.length > 1) {
        const top = stack[stack.length - 1];
        const name =
            typeof top.type === 'string' ? top.type : 'name' in top.type ? top.type.name : 'component';
        fail('LJS-102', '<' + name + '>');
    }

    return { nodes: root.children || [] };
};
