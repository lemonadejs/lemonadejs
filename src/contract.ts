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

import type { Bindable, Component, Props, State, Tools, View } from './types';
import { isState, StateImpl } from './reactivity';
import { DEV } from './env';
import { warn } from './errors';

/** Widen literal defaults and map constructors to value types */
type Widen<E> = E extends null | undefined // contract 'any'
    ? unknown
    : E extends string
    ? string
    : E extends number
      ? number
      : E extends boolean
        ? boolean
        : E extends StringConstructor
          ? string
          : E extends NumberConstructor
            ? number
            : E extends BooleanConstructor
              ? boolean
              : E extends ArrayConstructor
                ? unknown[]
                : E extends ObjectConstructor
                  ? Record<string, unknown>
                  : E extends FunctionConstructor
                    ? (...args: never[]) => unknown
                    : E;

/**
 * The props a CALLER may pass to a published component: plain values,
 * live states, or attribute strings (coerced) — the contract layer
 * normalizes them all. This is the public face of the component.
 */
export type ContractInput<C> = {
    [K in keyof C as K extends 'bind' | 'api' ? never : K extends `on${string}` ? never : K & string]?:
        | State<Widen<C[K]>>
        | Widen<C[K]>;
} & {
    [K in keyof C as K extends `on${string}` ? K & string : never]?: (...args: never[]) => unknown;
} & (C extends { bind: infer B }
        ? C extends { onchange: unknown }
            ? // The contract declares its OWN onchange: its signature wins —
              // Bindable's (value, oldValue) must not confiscate the event
              Omit<Bindable<Widen<B>>, 'onchange'>
            : Bindable<Widen<B>>
        : object) &
    (C extends { api: infer A }
        ? // any, not never[]: the CALLER's ref callback carries the real
          // signatures; never[] rejects every concretely-typed callback.
          // Object refs (useRef-style) are accepted too: .current = api
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
              ref?:
                  | ((api: { [K in keyof A]: (...args: any[]) => any }) => void)
                  | { current: { [K in keyof A]: (...args: any[]) => any } | null };
          }
        : object) & {
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
    [K in keyof C as K extends 'bind' | 'api' ? never : K extends `on${string}` ? never : K & string]: State<
        Widen<C[K]>
    >;
} & {
    // Events are directly invocable: props.onchange?.(value)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof C as K extends `on${string}` ? K & string : never]?: (...args: any[]) => unknown;
} & (C extends { bind: infer B }
        ? C extends { onchange: unknown }
            ? Omit<Bindable<Widen<B>>, 'onchange'> // declared onchange wins
            : Bindable<Widen<B>>
        : object) &
    (C extends { api: infer A }
        ? // INSIDE the component props.ref is always CALLABLE — the
          // runtime normalizes object refs into setters before setup
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { ref?: (api: { [K in keyof A]: (...args: any[]) => any }) => void }
        : object) & {
        expose?: boolean;
        children?: readonly Node[];
    };

/** The api object a contract component publishes, as the CALLER sees it */
export type ApiOf<C> = C extends Component<infer P>
    ? P extends { ref?: infer R }
        ? R extends (api: infer A) => void
            ? A
            : R extends { current: infer A | null }
              ? A
              : never
        : never
    : never;

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

const schemas = new WeakMap<Function, Schema>();

/**
 * The renderer-facing handle for patching a LIVING instance: the states
 * the wrapper constructed for declared props, and the event cells behind
 * the trampolines. Keyed by the exact props object the wrapper received.
 */
export interface LiveProps {
    states: Record<string, unknown>;
    events: Record<string, unknown>;
}

const liveRegistry = new WeakMap<object, LiveProps>();

export const liveProps = function (props: object): LiveProps | undefined {
    return liveRegistry.get(props);
};

/** Infer type (and default) from a contract entry */
const kindOf = function (v: unknown): PropSchema {
    if (v === String) return { type: 'string' };
    if (v === Number) return { type: 'number' };
    if (v === Boolean) return { type: 'boolean' };
    if (v === Array) return { type: 'array' };
    if (v === Object) return { type: 'object' };
    if (v === Function) return { type: 'function' };
    if (v === null || v === undefined) return { type: 'any' };
    if (Array.isArray(v)) return { type: 'array', default: v };
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') {
        return { type: t, default: v };
    }
    if (t === 'object') return { type: 'object', default: v };
    return { type: 'any', default: v };
};

const buildSchema = function (name: string, contract: Record<string, unknown>): Schema {
    const schema: Schema = { name, props: {}, bind: null, events: [], api: [] };
    for (const key of Object.keys(contract)) {
        const v = contract[key];
        if (key === 'bind') {
            schema.bind = kindOf(v);
        } else if (key === 'api' && v && typeof v === 'object' && !Array.isArray(v)) {
            schema.api = Object.keys(v);
        } else if (key.length > 2 && key.startsWith('on')) {
            schema.events.push(key);
            if (DEV && /[A-Z]/.test(key)) {
                warn('LJS-305', 'use ' + key.toLowerCase() + ' in the contract of <' + name + '>');
            }
        } else {
            schema.props[key] = kindOf(v);
            if (DEV && /[A-Z]/.test(key)) {
                warn('LJS-401', key + ' in <' + name + '> — contract prop names must be lowercase (they become HTML attributes)');
            }
        }
    }
    return schema;
};

/** Coerce a value (typically an attribute string) to its declared type */
export const coerce = function (v: unknown, p: PropSchema): unknown {
    if (v === null) {
        // Removed attribute
        return p.type === 'boolean' ? false : p.default;
    }
    if (typeof v === 'string') {
        if (p.type === 'number') {
            const n = Number(v);
            return Number.isNaN(n) ? v : n;
        }
        if (p.type === 'boolean') {
            // HTML semantics: present (even empty) is true, "false"/"0" opt out
            return !(v === 'false' || v === '0');
        }
    }
    return v;
};

const matches = function (v: unknown, type: ContractType): boolean {
    if (type === 'any' || v === undefined || v === null) {
        return true;
    }
    if (type === 'array') {
        return Array.isArray(v);
    }
    return typeof v === type;
};

// Dev-only LJS-402 check. The `!DEV ? null :` ternary and the `DEV &&`
// call site are EXPRESSIONS on purpose: esbuild folds expression-level
// literal conditions at print time (dropping the dead arm), while a
// statement-level `if (false) {...}` survives the late cross-module
// inlining of DEV and would ship dead bytes in the production build.
const warnUnknownProps = !DEV ? null : function (incoming: Record<string, unknown>, schema: Schema): void {
    const editDistance = function (a: string, b: string): number {
        if (Math.abs(a.length - b.length) > 2) {
            return 3; // beyond suggestion range, skip the table
        }
        let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            const cur = [i];
            for (let j = 1; j <= b.length; j++) {
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = cur;
        }
        return prev[b.length];
    };
    const closest = function (key: string, names: string[]): string {
        let best = '';
        let bestDistance = 3; // suggest only within edit distance 2
        const k = key.toLowerCase();
        for (const name of names) {
            const d = editDistance(k, name.toLowerCase());
            if (d < bestDistance) {
                bestDistance = d;
                best = name;
            }
        }
        return best;
    };
    // A prop the contract does not declare is never read (LJS-402)
    for (const key of Object.keys(incoming)) {
        if (
            key in schema.props ||
            schema.events.indexOf(key) >= 0 ||
            key === 'ref' ||
            key === 'children' ||
            key === 'expose' ||
            // A bind contract implies the Bindable protocol: bind AND
            // onchange are both legitimate without separate declarations
            ((key === 'bind' || key === 'onchange') && schema.bind !== null)
        ) {
            continue;
        }
        const hint = closest(key, Object.keys(schema.props).concat(schema.events));
        warn('LJS-402', key + ' in <' + schema.name + '>' + (hint ? " — did you mean '" + hint + "'?" : ''));
    }
};

/**
 * Publish a component: wraps fn so declared props arrive as live states
 * (defaults applied, attribute strings coerced, types validated in dev)
 * and registers the schema for describe(), createWebComponent, adapters
 * and verify().
 */
export const component = function <C extends Record<string, unknown>, P = ContractProps<C>>(
    name: string,
    contractDef: C,
    fn: Component<P>
): Component<ContractInput<C>> {
    const schema = buildSchema(name, contractDef);

    const wrapped = function (props: Props<P>, tools: Tools): View {
        const incoming = (props || {}) as Record<string, unknown>;
        // Unknown keys (children, ref, undeclared) pass through untouched
        const final: Record<string, unknown> = { ...incoming };

        for (const key of Object.keys(schema.props)) {
            const p = schema.props[key];
            const raw = incoming[key];
            if (isState(raw)) {
                // Shared live state — the caller keeps write access
                final[key] = raw;
                continue;
            }
            const v = raw === undefined ? p.default : coerce(raw, p);
            if (DEV && v !== undefined && !matches(v, p.type)) {
                warn('LJS-401', key + ' expects ' + p.type + ', got ' + typeof v + ' in <' + name + '>');
            }
            // Published props are live by construction
            const s = new StateImpl(v);
            DEV && (s.label = name + '.' + key);
            final[key] = s;
        }

        DEV && warnUnknownProps!(incoming, schema);

        if (schema.bind && incoming.bind === undefined && schema.bind.default !== undefined) {
            // The contract default feeds the bind() tool when unbound
            final.bind = schema.bind.default;
        }

        // Sugar: <${C} expose /> publishes the declared api as a singleton
        if (incoming.expose) {
            const previousRef = incoming.ref as ((api: Record<string, unknown>) => void) | undefined;
            final.ref = function (api: Record<string, unknown>) {
                if (schema.api.length) {
                    // Only the declared surface crosses the boundary
                    const published: Record<string, unknown> = {};
                    for (const method of schema.api) {
                        published[method] = api[method];
                    }
                    if (DEV && exposed.has(wrapped)) {
                        warn('LJS-501', '<' + name + '> was already exposed — singleton overwritten');
                    }
                    exposed.set(wrapped, published);
                    tools.onUnmount(function () {
                        if (exposed.get(wrapped) === published) {
                            exposed.delete(wrapped);
                        }
                    });
                } else if (DEV) {
                    warn('LJS-501', '<' + name + '> has no api in its contract — nothing to expose');
                }
                if (previousRef) {
                    previousRef(api);
                }
            };
        }

        if (DEV) {
            for (const e of schema.events) {
                if (incoming[e] !== undefined && typeof incoming[e] !== 'function') {
                    warn('LJS-401', e + ' expects a function in <' + name + '>');
                }
            }
        }

        // Live props: declared events become stable TRAMPOLINES over a
        // mutable cell, and the cells + the prop states are registered so
        // the renderer can PATCH a reused entry (new closures, new values)
        // into a living instance instead of rebuilding it. The component
        // closes over frozen props; the cells are the update channel.
        const cells: Record<string, unknown> = {};
        for (const e of schema.events) {
            const handler = final[e];
            if (typeof handler === 'function') {
                cells[e] = handler;
                final[e] = function (...args: unknown[]) {
                    return (cells[e] as (...a: unknown[]) => unknown)(...args);
                };
            }
        }
        liveRegistry.set(incoming, { states: final, events: cells });

        return fn(Object.freeze(final) as Props<P>, tools);
    };

    Object.defineProperty(wrapped, 'name', { value: fn.name || name });
    schemas.set(wrapped, schema);
    return wrapped as unknown as Component<ContractInput<C>>;
};

/**
 * The machine-readable interface of a published component — what an agent
 * reads instead of the source. Plain JSON: name, props (type/default),
 * bind, events, api. Returns null for unpublished components.
 * (Named contract(), not describe(), to never collide with test runners.)
 */
export const contract = function (c: Function): Schema | null {
    return schemas.get(c) || null;
};

/**
 * Sugar: singleton component services. An instance mounted with `expose`
 * publishes its DECLARED api (and nothing else — internals stay closed
 * over, unreachable) for the whole application:
 *
 *   <${Notifications} expose />
 *   use(Notifications)?.notify('saved');   // typed by the import itself
 *
 * Singletons by definition: re-exposing warns LJS-501 (last wins);
 * unmounting withdraws the api. This is the pattern that replaces
 * external state tools — store() for shared data, expose/use for
 * component-owned services.
 */
const exposed = new Map<Function, Record<string, unknown>>();

export const use = function <T = Record<string, unknown>>(c: Function): T | null {
    return (exposed.get(c) as T) || null;
};
