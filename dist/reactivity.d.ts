/**
 * LemonadeJS v6 — reactivity
 *
 * Fine-grained signals. A Binding is a reactive computation: while it runs,
 * every state .value it reads subscribes it to that state. When a state
 * changes, only the bindings that actually depend on it re-run.
 */
export declare const readCount: () => number;
/**
 * A reactive computation with automatic dependency tracking
 */
export declare class Binding {
    private fn;
    deps: Set<StateImpl<unknown>>;
    constructor(fn: () => void);
    run(): void;
    dispose(): void;
}
/**
 * State container. Reading .value inside a reactive computation subscribes
 * it; assigning .value notifies exactly the subscribed computations.
 */
export declare class StateImpl<T> {
    private onchange?;
    subs: Set<Binding>;
    private v;
    constructor(initial: T, onchange?: ((value: T, oldValue: T) => void) | undefined);
    get value(): T;
    set value(next: T);
    /** Read without subscribing (used by inspect/tooling) */
    peek(): T;
}
/**
 * The state returned by the bind() tool. Delegates to a target state (the
 * external bound state, or a local one), and adds set(): a component-
 * initiated write that also notifies the owner's onchange callback —
 * while plain .value writes (e.g. by the parent) stay silent.
 */
export declare class BoundState<T> extends StateImpl<T> {
    private target;
    private notify?;
    constructor(target: StateImpl<T>, notify?: (value: T, oldValue: T) => void);
    get value(): T;
    set value(next: T);
    peek(): T;
    set(next: T): void;
}
export declare const isState: (v: unknown) => v is StateImpl<unknown>;
/**
 * Resolve a slot value reactively: states are unwrapped (and tracked),
 * functions are invoked (and tracked through whatever they read).
 */
export declare const resolve: (raw: unknown) => unknown;
/** A slot is dynamic when its value can change after the first render */
export declare const isDynamic: (raw: unknown) => boolean;
