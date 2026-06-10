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
import { component, describe, use } from './contract';
import { createWebComponent } from './webcomponents';

export type { Bindable, Bound, Component, Handle, Props, SlotValue, State, Template, Tools, View } from './types';
export { mount, inspect, setComponents, unsafe } from './runtime';
export { store } from './store';
export { batch } from './reactivity';
export { component, describe, use } from './contract';
export type { Schema, PropSchema, ContractType } from './contract';
export { createWebComponent } from './webcomponents';
export { explain } from './errors';

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
    mount,
    inspect,
    setComponents,
    store,
    batch,
    unsafe,
    component,
    describe,
    use,
    createWebComponent,
    explain,
    version: 6,
};

export default lemonade;
