/**
 * LemonadeJS v6 — reactivity
 *
 * Fine-grained signals. A Binding is a reactive computation: while it runs,
 * every state .value it reads subscribes it to that state. When a state
 * changes, only the bindings that actually depend on it re-run.
 */
export declare const isForcing: () => boolean;
/**
 * Coalesce many updates into one notification pass. Designed for bulk
 * operations on big data (paste, sort, bulk delete): every state change
 * inside the callback queues its bindings — deduped — and they run once
 * at the end, not once per change.
 *
 *   batch(() => {
 *       for (const cell of pasted) rows.value[cell.y][cell.x] = cell.v;
 *       rows.touch();
 *       selection.value = area;
 *   });
 */
export declare const batch: <R>(fn: () => R) => R;
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
 *
 * NOT immutable by design: contents may be mutated in place freely —
 * mutation is silent, and touch() notifies afterwards. No copies, no
 * proxies, no freezing: a one-cell change in a 1M-row array is O(1) plus
 * the bindings that actually re-run. See explain('LJS-201').
 */
export declare class StateImpl<T> {
    private onchange?;
    subs: Set<Binding>;
    private v;
    constructor(initial: T, onchange?: ((value: T, oldValue: T) => void) | undefined);
    get value(): T;
    set value(next: T);
    /**
     * Notify after in-place mutation of the value's contents:
     *   rows.value[i].total = 9; rows.touch();
     */
    touch(): void;
    private emit;
    /** Read without subscribing (used by inspect/tooling) */
    peek(): T;
    /**
     * Plain subscription: cb runs after every notification (assignment or
     * touch). Returns the unsubscribe function. The universal adapter to
     * other reactive worlds without adopting the renderer:
     *   React:  useSyncExternalStore(rows.subscribe, rows.peek)
     */
    subscribe(cb: (value: T) => void): () => void;
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
    touch(): void;
    subscribe(cb: (value: T) => void): () => void;
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
