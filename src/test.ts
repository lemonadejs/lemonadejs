/**
 * LemonadeJS v6 — test harness (lemonadejs/test)
 *
 * Headless verification for components: render, query, snapshot, unmount.
 * Works anywhere a DOM exists (browser or jsdom). Designed so an agent can
 * close the loop on its own output:
 *
 *   const t = test(Counter, { start: 5 });
 *   t.query('button')!.click();
 *   assert(t.query('p')!.textContent === '6');
 *   console.log(t.snapshot());
 *   t.unmount();
 */

import type { Component } from './types';
import { mount, inspect } from './runtime';

export interface TestHandle {
    /** The container the component is mounted into */
    root: HTMLElement;
    /** querySelector scoped to the component */
    query(selector: string): HTMLElement | null;
    /** querySelectorAll scoped to the component, as a real array */
    queryAll(selector: string): HTMLElement[];
    /** The full visible text of the component */
    text(): string;
    /** Deterministic, diff-friendly text rendering of the DOM tree */
    snapshot(): string;
    /** The live component tree: names, state values, children (plain JSON) */
    inspect(): unknown;
    /** Remove the component and dispose everything */
    unmount(): void;
}

/** Serialize a DOM tree into a stable, indented, diffable text form */
const serialize = function (node: Node, depth: number): string[] {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) {
        const text = (node.nodeValue || '').trim();
        return text ? [pad + '"' + text + '"'] : [];
    }
    if (node.nodeType !== 1) {
        return [];
    }
    const el = node as Element;
    const attrs = [...el.attributes]
        .map(function (a) {
            return a.value === '' ? a.name : a.name + '="' + a.value + '"';
        })
        .sort()
        .join(' ');
    const open = '<' + el.tagName.toLowerCase() + (attrs ? ' ' + attrs : '') + '>';
    const lines = [pad + open];
    for (const child of [...el.childNodes]) {
        lines.push(...serialize(child, depth + 1));
    }
    return lines;
};

/**
 * Mount a component into a fresh detached-from-your-app container and
 * return query/snapshot helpers for assertions.
 */
export const test = function <P>(component: Component<P>, props?: P): TestHandle {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handle = mount(component, root, props);

    return {
        root,
        query: function (selector: string) {
            return root.querySelector<HTMLElement>(selector);
        },
        queryAll: function (selector: string) {
            return [...root.querySelectorAll<HTMLElement>(selector)];
        },
        text: function () {
            return root.textContent || '';
        },
        snapshot: function () {
            const lines: string[] = [];
            for (const child of [...root.childNodes]) {
                lines.push(...serialize(child, 0));
            }
            return lines.join('\n');
        },
        inspect: function () {
            return inspect(root);
        },
        unmount: function () {
            handle.unmount();
            root.remove();
        },
    };
};

export default test;
