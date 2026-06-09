/**
 * LemonadeJS v6 — public API
 *
 * import { render, mount, type Component } from 'lemonadejs';
 *
 * const Counter: Component = (props, { state }) => {
 *     const count = state(0);
 *     return render`<div>
 *         <p>${count}</p>
 *         <button onclick="${() => count.value++}">+1</button>
 *     </div>`;
 * };
 *
 * mount(Counter, document.getElementById('app'));
 */

import type { SlotValue, Template, View } from './types';
import { parse } from './parser';
import { env, explain } from './errors';
import { inspect, mount } from './runtime';

export type { Component, Handle, Props, SlotValue, State, Template, Tools, View } from './types';
export { mount, inspect } from './runtime';
export { explain, env } from './errors';

/** Templates are parsed once per call site: the strings identity is the key */
const templates = new WeakMap<TemplateStringsArray, Template>();

/**
 * The template tag. Static parts are parsed on first use and cached forever;
 * each call only carries this render's values.
 */
export const render = function (strings: TemplateStringsArray, ...values: SlotValue[]): View {
    let template = templates.get(strings);
    if (!template) {
        template = parse(strings);
        templates.set(strings, template);
    }
    return { template, values };
};

/** Alias for editor tooling that recognizes html`...` (lit-style plugins) */
export const html = render;

const lemonade = {
    render,
    html,
    mount,
    inspect,
    explain,
    env,
    version: 6,
};

export default lemonade;
