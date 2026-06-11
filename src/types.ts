/**
 * LemonadeJS v6 — public and internal types
 */

/** A static chunk or a slot reference inside an attribute value */
export type Part = string | { slot: number };

/** A parsed attribute */
export interface VProp {
    name: string;
    parts: Part[];
}

/**
 * A node in a parsed template. Parsed once per tagged-template call site
 * and shared (read-only) by every component instance using it.
 * - type: tag name, '#text', '#slot', { slot } for embedded components,
 *   or { name } for registered components (<Card />)
 */
export interface VNode {
    type: string | { slot: number } | { name: string };
    text?: string;
    slot?: number;
    props?: VProp[];
    children?: VNode[];
}

/** A parsed template (cached by TemplateStringsArray identity) */
export interface Template {
    nodes: VNode[];
}

/** The result of html`...` — a parsed template plus this call's values */
export interface View {
    template: Template;
    values: unknown[];
}

/** A reactive state container */
export interface State<T> {
    value: T;
    /**
     * Notify after in-place mutation. State contents are NOT immutable:
     * mutate freely (rows.value[i].total = 9) — silent and free — then
     * touch() to update. No copies, no proxies; DOM writes are delta-only.
     */
    touch(): void;
    /** Read without subscribing (tooling, snapshots) */
    peek(): T;
    /** Run cb after every notification; returns the unsubscribe function */
    subscribe(cb: (value: T) => void): () => void;
}

/**
 * A bindable state returned by the bind() tool. set() commits a
 * component-initiated change: it writes the value AND fires the owner's
 * onchange callback. Direct .value writes stay silent (no onchange).
 */
export interface Bound<T> extends State<T> {
    set(value: T): void;
}

/**
 * The two-way binding protocol for components:
 *   <${Switch} bind="${state}" onchange="${(v) => ...}" />
 * bind accepts a State (two-way) or a plain value (initial only).
 */
export interface Bindable<T> {
    bind?: State<T> | T;
    onchange?: (value: T, oldValue: T) => void;
}

/** Values accepted by ${...} slots — `object` admits arbitrary data
 *  passed whole-value into component props (options, routes, items) */
export type SlotValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | State<unknown>
    | View
    | Node
    | ((...args: never[]) => unknown)
    | readonly SlotValue[]
    | object;

/**
 * Object ref (useRef-style): pass it as ref="${myRef}" and .current
 * holds the element (or the component api). The runtime NULLS .current
 * on unmount — a surviving ref never pins a dead subtree.
 */
export interface Ref<T> {
    current: T | null;
}

/** Tools injected into every component */
export interface Tools {
    /** Create a reactive state. Assignment to .value triggers updates. */
    state<T>(initial: T, onchange?: (value: T, oldValue: T) => void): State<T>;
    /**
     * Implement the two-way binding protocol: returns the external state
     * when props.bind is a State, otherwise a local state (initialized from
     * a plain props.bind or the fallback). set() also fires props.onchange.
     */
    bind<T>(props: Bindable<T>, fallback: T): Bound<T>;
    /**
     * Derived state: fn re-evaluates whenever any state read inside it
     * changes, and the result is itself a readable state. The idiomatic
     * fix for "captured once" snapshots and hand-rolled peek pipelines:
     *   const total = computed(() => price.value * qty.value);
     * Read-only by convention — write the sources, not the result.
     * Disposed with the component.
     */
    computed<T>(fn: () => T): State<T>;
    /** Called after the component DOM is attached. Return a cleanup
     *  FUNCTION to run on unmount; any other return value is ignored
     *  (so `onMount(() => count++)` stays legal). */
    onMount(callback: (el: Node) => unknown): void;
    /** Called when the component is unmounted. */
    onUnmount(callback: () => void): void;
    /**
     * Unmount this component instance imperatively: full destroy —
     * children, bindings, cleanups, DOM. Call it from handlers or
     * lifecycle callbacks (toasts, self-dismissing banners). If the owner
     * re-renders the position with the same data, a FRESH instance is
     * created — permanent removal belongs to the owner's data.
     */
    unmount(): void;
}

/** Props as a component receives them: read-only, plus children nodes */
export type Props<P> = Readonly<P> & { readonly children?: readonly Node[] };

/** A LemonadeJS component */
export type Component<P = {}> = (props: Props<P>, tools: Tools) => View;

/** Handle returned by mount() */
export interface Handle {
    /** The root element the component was mounted into */
    el: Element;
    /** Remove the component from the DOM and dispose all bindings */
    unmount(): void;
}

/** Check that a value is a View produced by html`...` */
export function isView(v: unknown): v is View {
    return (
        typeof v === 'object' &&
        v !== null &&
        Array.isArray((v as View).values) &&
        typeof (v as View).template === 'object' &&
        Array.isArray((v as View).template?.nodes)
    );
}
