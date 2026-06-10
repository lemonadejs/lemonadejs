/**
 * LemonadeJS v6 — contracts (the publishing layer)
 *
 * A plain function is a component. component(name, contract, fn) is what
 * you do when a component becomes a PRODUCT: the contract declares its
 * interface as a runtime artifact, and everything derives from it —
 * web component wiring, framework adapters, prop validation, defaults,
 * typed attribute coercion, verify() conformance, and describe(): the
 * machine-readable schema an agent reads instead of the source.
 *
 *   export const Switch = component('switch', {
 *       bind: false,              // bindable value — type and default inferred
 *       label: '',                // prop: string, default ''
 *       disabled: false,
 *       onchange: Function,       // event out
 *       api: { toggle: Function } // imperative surface via props.ref
 *   }, (props, { bind }) => { ... });
 *
 * The key rule: DECLARED PROPS ARRIVE AS STATES — live by construction.
 * Whatever the deployment (lemonade parent, custom element attribute,
 * React adapter), props.label is a State<string> the component reads in
 * templates as ${props.label} and in logic as props.label.value.
 */
import type { Component } from './types';
export type ContractType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function' | 'any';
export interface PropSchema {
    type: ContractType;
    default?: unknown;
}
export interface Schema {
    name: string;
    props: Record<string, PropSchema>;
    bind: PropSchema | null;
    events: string[];
    api: string[];
}
/** Coerce a value (typically an attribute string) to its declared type */
export declare const coerce: (v: unknown, p: PropSchema) => unknown;
/**
 * Publish a component: wraps fn so declared props arrive as live states
 * (defaults applied, attribute strings coerced, types validated in dev)
 * and registers the schema for describe(), createWebComponent, adapters
 * and verify().
 */
export declare const component: <P>(name: string, contract: Record<string, unknown>, fn: Component<P>) => Component<P>;
/**
 * The machine-readable interface of a published component — what an agent
 * reads instead of the source. Plain JSON: name, props (type/default),
 * bind, events, api. Returns null for unpublished components.
 */
export declare const describe: (c: Function) => Schema | null;
