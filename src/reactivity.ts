/**
 * LemonadeJS v6 — reactivity
 *
 * Fine-grained signals. A Binding is a reactive computation: while it runs,
 * every state .value it reads subscribes it to that state. When a state
 * changes, only the bindings that actually depend on it re-run.
 */

import { fail } from './errors';
import { DEV } from './env';
import { isTracing, record, summarize } from './trace';

let current: Binding | null = null;
let depth = 0;

/**
 * True while touch() notifications run: reference-equality shortcuts must
 * be skipped, because identical references may hold mutated contents.
 */
let forcing = false;

export const isForcing = function (): boolean {
    return forcing;
};

/**
 * Run fn with dependency tracking suspended. Imperative escape hatches
 * (ref callbacks, component setup bodies) must never subscribe the
 * enclosing binding to the states they happen to read.
 */
export const untracked = function <R>(fn: () => R): R {
    const previous = current;
    current = null;
    try {
        return fn();
    } finally {
        current = previous;
    }
};

/** Pending bindings while a batch() is open (deduped across states) */
let batching: Set<Binding> | null = null;
let batchForcing = false;

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
export const batch = function <R>(fn: () => R): R {
    if (batching) {
        // Nested batch: the outer flush covers it
        return fn();
    }
    batching = new Set();
    try {
        return fn();
    } finally {
        const queue = batching;
        const wasForcing = batchForcing;
        batching = null;
        batchForcing = false;
        const previous = forcing;
        forcing = forcing || wasForcing;
        try {
            for (const binding of queue) {
                DEV && isTracing() && record!({ kind: 'run', binding: binding.label, cause: 'batch' });
                binding.run();
            }
        } finally {
            forcing = previous;
        }
    }
};

/** Counts state reads — used by the dev-mode snapshot heuristic (LJS-202) */
let reads = 0;

export const readCount = function (): number {
    return reads;
};

/**
 * Run fn with the read counter restored afterwards: reads made inside
 * tool-owned bindings (computed's initial evaluation) are NOT template-
 * construction reads and must not trip the LJS-202 snapshot heuristic.
 */
export const withReadsRestored = function <R>(fn: () => R): R {
    const before = reads;
    try {
        return fn();
    } finally {
        reads = before;
    }
};

/**
 * A reactive computation with automatic dependency tracking
 */
export class Binding {
    deps = new Set<StateImpl<unknown>>();
    /** Dev label for trace()/containment messages (component#slot, ...) */
    label?: string;
    /** A previous run threw — suppresses repeat logging until it recovers */
    failed = false;

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
            this.failed = false; // a clean run re-arms error logging
        } catch (e) {
            // CONTAINMENT SEAM: one broken expression must not take down
            // the whole update pass — siblings still run, the app stays
            // consistent everywhere else. Engine diagnostics (LJS-xxx,
            // e.g. the LJS-203 loop guard) PROPAGATE: they are the
            // engine refusing to continue, not a user expression failing.
            if (e instanceof Error && /^LJS-\d/.test(e.message)) {
                throw e;
            }
            DEV && isTracing() && record!({ kind: 'error', binding: this.label, detail: String(e) });
            if (!this.failed) {
                this.failed = true; // log once until it recovers
                console.error(
                    'LJS-205: expression threw — contained, other updates continued' +
                        (this.label ? ' — ' + this.label : ''),
                    e
                );
            }
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
 * State container. Reading .value inside a reactive computation subscribes
 * it; assigning .value notifies exactly the subscribed computations.
 *
 * NOT immutable by design: contents may be mutated in place freely —
 * mutation is silent, and touch() notifies afterwards. No copies, no
 * proxies, no freezing: a one-cell change in a 1M-row array is O(1) plus
 * the bindings that actually re-run. See explain('LJS-201').
 */
export class StateImpl<T> {
    subs = new Set<Binding>();
    /** Dev label for trace() (component.prop, component.s0, store.key) */
    label?: string;
    private v: T;

    constructor(initial: T, private onchange?: (value: T, oldValue: T) => void) {
        this.v = initial;
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
        this.v = next;
        DEV &&
            isTracing() &&
            record!({
                kind: 'write',
                state: this.label,
                by: current ? current.label : undefined,
                old: summarize!(old),
                value: summarize!(next),
            });
        this.emit(old);
    }

    /**
     * Notify after in-place mutation of the value's contents:
     *   rows.value[i].total = 9; rows.touch();
     */
    touch(): void {
        const previous = forcing;
        forcing = true;
        DEV &&
            isTracing() &&
            record!({ kind: 'touch', state: this.label, by: current ? current.label : undefined });
        try {
            this.emit(this.v);
        } finally {
            forcing = previous;
        }
    }

    private emit(old: T): void {
        if (batching) {
            // Inside batch(): queue (deduped), run once at the end
            for (const binding of this.subs) {
                batching.add(binding);
            }
            if (forcing) {
                batchForcing = true;
            }
        } else {
            if (depth > 100) {
                fail('LJS-203');
            }
            depth++;
            try {
                // Copy: a binding re-run mutates the subscription set
                for (const binding of [...this.subs]) {
                    DEV && isTracing() && record!({ kind: 'run', binding: binding.label, cause: this.label });
                    binding.run();
                }
            } finally {
                depth--;
            }
        }
        if (typeof this.onchange === 'function') {
            this.onchange(this.v, old);
        }
    }

    /** Read without subscribing (used by inspect/tooling) */
    peek(): T {
        return this.v;
    }

    /**
     * Plain subscription: cb runs after every notification (assignment or
     * touch). Returns the unsubscribe function. The universal adapter to
     * other reactive worlds without adopting the renderer:
     *   React:  useSyncExternalStore(rows.subscribe, rows.peek)
     */
    subscribe(cb: (value: T) => void): () => void {
        const self = this;
        const binding = new Binding(function () {
            // addEventListener semantics: the callback is IMPERATIVE —
            // it runs UNTRACKED so reads inside it never collect
            // dependencies. (A read-modify-write like count.value++
            // would otherwise subscribe the callback to the very state
            // it writes: the LJS-203 self-loop class.) The subscription
            // stays pinned to THIS state only, re-added after each run
            // because Binding.run() re-tracks from scratch.
            untracked(function () {
                cb(self.peek());
            });
            self.subs.add(binding);
            binding.deps.add(self as StateImpl<unknown>);
        });
        // Initial wiring without running cb
        this.subs.add(binding);
        binding.deps.add(this as StateImpl<unknown>);
        return function () {
            binding.dispose();
        };
    }
}

/**
 * The state returned by the bind() tool. Delegates to a target state (the
 * external bound state, or a local one), and adds set(): a component-
 * initiated write that also notifies the owner's onchange callback —
 * while plain .value writes (e.g. by the parent) stay silent.
 */
export class BoundState<T> extends StateImpl<T> {
    private target: StateImpl<T>;
    private notify?: (value: T, oldValue: T) => void;

    constructor(target: StateImpl<T>, notify?: (value: T, oldValue: T) => void) {
        super(undefined as T);
        this.target = target;
        this.notify = notify;
    }

    override get value(): T {
        return this.target.value;
    }

    override set value(next: T) {
        this.target.value = next;
    }

    override peek(): T {
        return this.target.peek();
    }

    override touch(): void {
        this.target.touch();
    }

    override subscribe(cb: (value: T) => void): () => void {
        return this.target.subscribe(cb);
    }

    set(next: T): void {
        const old = this.target.peek();
        this.target.value = next;
        if (!Object.is(next, old) && typeof this.notify === 'function') {
            this.notify(next, old);
        }
    }
}

/**
 * Brand-based check (not instanceof): states must be recognizable across
 * bundle copies (app + lemonadejs/test) and realms.
 */
const STATE_BRAND = Symbol.for('lemonadejs.state');
(StateImpl.prototype as unknown as Record<symbol, boolean>)[STATE_BRAND] = true;

export const isState = function (v: unknown): v is StateImpl<unknown> {
    return !!v && typeof v === 'object' && (v as Record<symbol, unknown>)[STATE_BRAND] === true;
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
