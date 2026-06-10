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
import type { SlotValue, View } from './types';
import { createWebComponent } from './webcomponents';
export type { Bindable, Bound, Component, Handle, Props, SlotValue, State, Template, Tools, View } from './types';
export { mount, inspect, setComponents, unsafe } from './runtime';
export { store } from './store';
export { batch } from './reactivity';
export { component, describe } from './contract';
export type { Schema, PropSchema, ContractType } from './contract';
export { createWebComponent } from './webcomponents';
export { explain } from './errors';
/**
 * The template tag — html`...` describes what it returns: a parsed HTML
 * template plus this call's values. It renders nothing; mount() renders.
 * Static parts are parsed on first use and cached forever (the
 * TemplateStringsArray identity is the key). The name also unlocks
 * lit-style editor tooling (highlighting, completion) for free.
 */
export declare const html: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
declare const lemonade: {
    html: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
    mount: <P>(component: import("./types").Component<P>, root: Element, props?: P) => import("./types").Handle;
    inspect: (target: Node) => import("./runtime").InspectReport | null;
    setComponents: (map: Record<string, import("./types").Component<never>>) => void;
    store: <T>(initial: T, storage?: string) => import("./types").State<T>;
    batch: <R>(fn: () => R) => R;
    unsafe: (html: string) => Node[];
    component: <P>(name: string, contract: Record<string, unknown>, fn: import("./types").Component<P>) => import("./types").Component<P>;
    describe: (c: Function) => import("./contract").Schema | null;
    createWebComponent: typeof createWebComponent;
    explain: (code: string) => string;
    version: number;
};
export default lemonade;
