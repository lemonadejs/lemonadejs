/**
 * LemonadeJS v6 — reactivity
 *
 * Fine-grained signals. A Binding is a reactive computation: while it runs,
 * every state .value it reads subscribes it to that state. When a state
 * changes, only the bindings that actually depend on it re-run.
 */

import { env, fail } from './errors';

let current: Binding | null = null;
let depth = 0;

/** Counts state reads — used by the dev-mode snapshot heuristic (LJS-202) */
let reads = 0;

export const readCount = function (): number {
    return reads;
};

/**
 * A reactive computation with automatic dependency tracking
 */
export class Binding {
    deps = new Set<StateImpl<unknown>>();

    constructor(private fn: () => void) {}

    run(): void {
        // Re-track dependencies from scratch on every run
        for (const dep of this.deps) {
            dep.subs.delete(this);
        }
        this.deps.clear();
        const previous = current;
        current = this;
        try {
            this.fn();
        } finally {
            current = previous;
        }
    }

    dispose(): void {
        for (const dep of this.deps) {
            dep.subs.delete(this);
        }
        this.deps.clear();
    }
}

/**
 * Freeze plain objects/arrays stored in states (dev mode only), so silent
 * mutation — which would never trigger an update — throws immediately.
 * See LJS-201.
 */
const devFreeze = function <T>(value: T): T {
    if (env.dev && value && typeof value === 'object') {
        const proto = Object.getPrototypeOf(value);
        if (Array.isArray(value) || proto === Object.prototype || proto === null) {
            Object.freeze(value);
        }
    }
    return value;
};

/**
 * State container. Reading .value inside a reactive computation subscribes
 * it; assigning .value notifies exactly the subscribed computations.
 */
export class StateImpl<T> {
    subs = new Set<Binding>();
    private v: T;

    constructor(initial: T, private onchange?: (value: T, oldValue: T) => void) {
        this.v = devFreeze(initial);
    }

    get value(): T {
        reads++;
        if (current) {
            this.subs.add(current);
            current.deps.add(this as StateImpl<unknown>);
        }
        return this.v;
    }

    set value(next: T) {
        if (Object.is(next, this.v)) {
            return;
        }
        const old = this.v;
        this.v = devFreeze(next);
        if (depth > 100) {
            fail('LJS-203');
        }
        depth++;
        try {
            // Copy: a binding re-run mutates the subscription set
            for (const binding of [...this.subs]) {
                binding.run();
            }
        } finally {
            depth--;
        }
        if (typeof this.onchange === 'function') {
            this.onchange(this.v, old);
        }
    }

    /** Read without subscribing (used by inspect/tooling) */
    peek(): T {
        return this.v;
    }
}

export const isState = function (v: unknown): v is StateImpl<unknown> {
    return v instanceof StateImpl;
};

/**
 * Resolve a slot value reactively: states are unwrapped (and tracked),
 * functions are invoked (and tracked through whatever they read).
 */
export const resolve = function (raw: unknown): unknown {
    if (isState(raw)) {
        return raw.value;
    }
    if (typeof raw === 'function') {
        return (raw as () => unknown)();
    }
    return raw;
};

/** A slot is dynamic when its value can change after the first render */
export const isDynamic = function (raw: unknown): boolean {
    return isState(raw) || typeof raw === 'function';
};
