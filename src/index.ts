/**
 * LemonadeJS v6 — public API
 *
 * import { html, mount, type Component } from 'lemonadejs';
 *
 * const Counter: Component = (props, { state }) => {
 *     const count = state(0);
 *     return html`<div>
 *         <p>${count}</p>
 *         <button onclick="${() => count.value++}">+1</button>
 *     </div>`;
 * };
 *
 * mount(Counter, document.getElementById('app'));
 */

import type { SlotValue, Template, View } from './types';
import { parse } from './parser';
import { explain } from './errors';
import { inspect, mount, setComponents, unsafe } from './runtime';
import { store } from './store';
import { batch } from './reactivity';
import { component, contract, use } from './contract';
import { createWebComponent } from './webcomponents';

export type { Bindable, Bound, Component, Handle, Props, Ref, SlotValue, State, Template, Tools, View } from './types';
export { isDisposing, mount, inspect, ref, setComponents, unsafe } from './runtime';
export { store } from './store';
export { batch } from './reactivity';
export { component, contract, use } from './contract';
export type { ContractInput, ContractProps, ApiOf, Schema, PropSchema, ContractType } from './contract';
export { createWebComponent } from './webcomponents';
export { explain } from './errors';

/** Properties whose numeric values are unitless (everything else gets px) */
const UNITLESS =
    /^(opacity|z-index|zoom|order|flex|flex-grow|flex-shrink|font-weight|line-height|scale|aspect-ratio|grid-(area|row|column)(-start|-end)?|column-count|columns|orphans|widows|tab-size|animation-iteration-count|--.*)$/;

/**
 * Build an inline style string from an object — typed keys, automatic
 * units, conditional values:
 *
 *   style="${() => css({ top: y.value, left: x.value, color: active.value && 'red' })}"
 *
 * Numbers get px (except unitless properties like opacity/z-index/flex);
 * false/null/undefined entries are skipped, so conditionals compose
 * without ternary noise. camelCase keys map to kebab-case; --custom
 * properties pass through. A value helper, not a binding: it returns a
 * plain string and composes with static parts.
 */
export const css = function (styles: Record<string, string | number | false | null | undefined>): string {
    const parts: string[] = [];
    for (const key of Object.keys(styles)) {
        const v = styles[key];
        if (v === false || v === null || v === undefined || v === '') {
            continue;
        }
        const name = key.indexOf('--') === 0 ? key : key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        parts.push(name + ':' + (typeof v === 'number' && !UNITLESS.test(name) ? v + 'px' : v));
    }
    return parts.join(';');
};

/** Templates are parsed once per call site: the strings identity is the key */
const templates = new WeakMap<TemplateStringsArray, Template>();

/**
 * The template tag — html`...` describes what it returns: a parsed HTML
 * template plus this call's values. It renders nothing; mount() renders.
 * Static parts are parsed on first use and cached forever (the
 * TemplateStringsArray identity is the key). The name also unlocks
 * lit-style editor tooling (highlighting, completion) for free.
 */
export const html = function (strings: TemplateStringsArray, ...values: SlotValue[]): View {
    let template = templates.get(strings);
    if (!template) {
        template = parse(strings);
        templates.set(strings, template);
    }
    return { template, values };
};

const lemonade = {
    html,
    css,
    mount,
    inspect,
    setComponents,
    store,
    batch,
    unsafe,
    component,
    contract,
    use,
    createWebComponent,
    explain,
    version: 6,
};

export default lemonade;
