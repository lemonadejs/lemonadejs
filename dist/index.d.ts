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
import type { SlotValue, View } from './types';
export type { Bindable, Bound, Component, Handle, Props, SlotValue, State, Template, Tools, View } from './types';
export { mount, inspect, setComponents } from './runtime';
export { explain, env } from './errors';
/**
 * The template tag. Static parts are parsed on first use and cached forever;
 * each call only carries this render's values.
 */
export declare const render: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
/** Alias for editor tooling that recognizes html`...` (lit-style plugins) */
export declare const html: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
declare const lemonade: {
    render: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
    html: (strings: TemplateStringsArray, ...values: SlotValue[]) => View;
    mount: <P>(component: import("./types").Component<P>, root: Element, props?: P) => import("./types").Handle;
    inspect: (target: Node) => import("./runtime").InspectReport | null;
    setComponents: (map: Record<string, import("./types").Component<never>>) => void;
    explain: (code: string) => string;
    env: {
        dev: boolean;
    };
    version: number;
};
export default lemonade;
