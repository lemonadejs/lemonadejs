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
import type { Bindable, Component, State } from './types';
/** Widen literal defaults and map constructors to value types */
type Widen<E> = E extends null | undefined ? unknown : E extends string ? string : E extends number ? number : E extends boolean ? boolean : E extends StringConstructor ? string : E extends NumberConstructor ? number : E extends BooleanConstructor ? boolean : E extends ArrayConstructor ? unknown[] : E extends ObjectConstructor ? Record<string, unknown> : E extends FunctionConstructor ? (...args: never[]) => unknown : E;
/**
 * The props a CALLER may pass to a published component: plain values,
 * live states, or attribute strings (coerced) — the contract layer
 * normalizes them all. This is the public face of the component.
 */
export type ContractInput<C> = {
    [K in keyof C as K extends 'bind' | 'api' ? never : K extends `on${string}` ? never : K & string]?: State<Widen<C[K]>> | Widen<C[K]>;
} & {
    [K in keyof C as K extends `on${string}` ? K & string : never]?: (...args: never[]) => unknown;
} & (C extends {
    bind: infer B;
} ? Bindable<Widen<B>> : object) & (C extends {
    api: infer A;
} ? {
    ref?: ((api: {
        [K in keyof A]: (...args: any[]) => any;
    }) => void) | {
        current: {
            [K in keyof A]: (...args: any[]) => any;
        } | null;
    };
} : object) & {
    expose?: boolean;
    children?: readonly Node[];
};
/**
 * The props a published component RECEIVES, derived from its contract:
 * declared props arrive as live states, on* keys are callbacks,
 * bind/onchange follow Bindable, api flows through ref.
 *
 * Declared props are NON-OPTIONAL: the engine constructs a state for
 * every contract entry, so `props.height.value` is a `number` — no `!`
 * and no `as` casts needed inside the component.
 */
export type ContractProps<C> = {
    [K in keyof C as K extends 'bind' | 'api' ? never : K extends `on${string}` ? never : K & string]: State<Widen<C[K]>>;
} & {
    [K in keyof C as K extends `on${string}` ? K & string : never]?: (...args: any[]) => unknown;
} & (C extends {
    bind: infer B;
} ? Bindable<Widen<B>> : object) & (C extends {
    api: infer A;
} ? {
    ref?: (api: {
        [K in keyof A]: (...args: any[]) => any;
    }) => void;
} : object) & {
    expose?: boolean;
    children?: readonly Node[];
};
/** The api object a contract component publishes, as the CALLER sees it */
export type ApiOf<C> = C extends Component<infer P> ? P extends {
    ref?: infer R;
} ? R extends (api: infer A) => void ? A : R extends {
    current: infer A | null;
} ? A : never : never : never;
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
export declare const component: <C extends Record<string, unknown>, P = ContractProps<C>>(name: string, contractDef: C, fn: Component<P>) => Component<ContractInput<C>>;
/**
 * The machine-readable interface of a published component — what an agent
 * reads instead of the source. Plain JSON: name, props (type/default),
 * bind, events, api. Returns null for unpublished components.
 * (Named contract(), not describe(), to never collide with test runners.)
 */
export declare const contract: (c: Function) => Schema | null;
export declare const use: <T = Record<string, unknown>>(c: Function) => T | null;
export {};
