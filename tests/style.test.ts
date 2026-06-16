/**
 * Component-owned CSS: <style> inside html`` is lifted off the tree at
 * parse time and injected into document.head ONCE per template — a
 * component carries its styling in its own source, in every deployment.
 * Plus css(): the typed style-value helper (units, conditionals).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, css, type Component } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const headStyles = () => [...document.head.querySelectorAll('style[data-lemonade]')];

// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse to canonical "a:b;c:d"
const styleN = (el: Element) =>
    (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;$/, '');

describe('<style> hoisting: component-owned CSS', () => {
    it('lifts <style> to document.head and keeps it OUT of the component DOM', () => {
        const C: Component = () => html`<div class="lm-styletest">
            <style>.lm-styletest { color: rgb(200, 0, 0); }</style>
            <p>content</p>
        </div>`;
        handle = t(C);
        expect(handle.query('style')).toBeNull(); // not in the tree
        const injected = headStyles().find((s) => s.textContent!.indexOf('lm-styletest') >= 0);
        expect(injected).toBeTruthy();
        expect(handle.query('p')!.textContent).toBe('content');
    });

    it('injects ONCE across many instances of the same component', () => {
        const C: Component = () => html`<i><style>.lm-once { top: 0; }</style>x</i>`;
        const App: Component = () => html`<div><${C} /><${C} /><${C} /></div>`;
        handle = t(App);
        const count = headStyles().filter((s) => s.textContent!.indexOf('lm-once') >= 0).length;
        expect(count).toBe(1);
    });

    it('injects styles from branch templates when the branch first renders', () => {
        let open!: { value: boolean };
        const C: Component = (p, { state }) => {
            const o = state(false);
            open = o;
            return html`<div>${() => o.value && html`<b><style>.lm-branchy { left: 0; }</style>on</b>`}</div>`;
        };
        handle = t(C);
        expect(headStyles().some((s) => s.textContent!.indexOf('lm-branchy') >= 0)).toBe(false);
        open.value = true;
        expect(headStyles().some((s) => s.textContent!.indexOf('lm-branchy') >= 0)).toBe(true);
    });

    it('rejects expressions inside <style> (parse once = static only)', () => {
        const color = 'red';
        const Bad: Component = () => html`<div><style>p { color: ${color}; }</style></div>`;
        expect(() => t(Bad)).toThrowError(/LJS-105/);
    });

    it('rejects an unclosed <style>', () => {
        const Bad: Component = () => html`<div><style>p { color: red; }</div>`;
        expect(() => t(Bad)).toThrowError(/LJS-102/);
    });
});

describe('css(): typed style values', () => {
    it('appends px to numbers, passes strings through', () => {
        expect(css({ top: 10, left: '5%' })).toBe('top:10px;left:5%');
    });

    it('keeps unitless properties unitless', () => {
        expect(css({ opacity: 0.5, zIndex: 30, flex: 1, lineHeight: 1.4 })).toBe(
            'opacity:0.5;z-index:30;flex:1;line-height:1.4'
        );
    });

    it('grid placement and column counts are unitless (the kanban probe trap)', () => {
        expect(css({ gridColumn: 2, gridRow: 5, gridRowStart: 1, columnCount: 3 })).toBe(
            'grid-column:2;grid-row:5;grid-row-start:1;column-count:3'
        );
    });

    it('skips false/null/undefined/empty — conditionals compose without ternary noise', () => {
        const active = false;
        expect(css({ position: 'fixed', background: active && 'red', width: undefined, border: null })).toBe(
            'position:fixed'
        );
    });

    it('camelCase maps to kebab-case; custom properties pass through', () => {
        expect(css({ marginLeft: 4, '--lm-accent': 'teal' })).toBe('margin-left:4px;--lm-accent:teal');
    });

    it('composes with template style attributes', () => {
        const C: Component = (p, { state }) => {
            const y = state(12);
            return html`<div style="${() => css({ position: 'fixed', top: y.value })}"></div>`;
        };
        handle = t(C);
        expect(styleN(handle.query('div')!)).toBe('position:fixed;top:12px');
    });
});
