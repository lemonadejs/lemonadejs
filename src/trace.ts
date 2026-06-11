/**
 * LemonadeJS v6 — trace(): causality as data (dev builds only)
 *
 * The agent debugging loop for "my update didn't happen" / "what did this
 * write trigger": arm a ring buffer, act, read the events back as plain
 * JSON — which state changed, written by whom, which bindings re-ran,
 * what warned, what threw.
 *
 *   trace(50);                 // arm: keep the last 50 events
 *   count.value++;             // act
 *   trace();                   // → [{ kind:'write', state:'counter.s0', ... },
 *                              //    { kind:'run', binding:'counter#text', cause:'counter.s0' }]
 *   trace(false);              // disarm and clear
 *
 * Lean by design: events store SUMMARIES (primitives, 'Array(n)',
 * 'Object'), never references — tracing cannot pin your data in memory.
 * Production builds eliminate every hook and this module's bodies (DCE);
 * trace() returns [] there — it is a development tool, like explain().
 */

import { DEV } from './env';

export interface TraceEvent {
    /** Monotonic sequence number within the armed session */
    at: number;
    kind: 'write' | 'touch' | 'run' | 'error' | 'warn';
    /** The state's dev label (component.prop, component.s0, store.key) */
    state?: string;
    /** The binding's dev label (component#slot, component#attr) */
    binding?: string;
    /** Who wrote: the binding running at write time, if any */
    by?: string;
    /** Summarized previous value (writes) */
    old?: unknown;
    /** Summarized new value (writes) */
    value?: unknown;
    /** What made a binding run: the emitting state's label, or 'batch' */
    cause?: string;
    /** LJS code (warn) */
    code?: string;
    detail?: string;
}

let armed = 0;
let seq = 0;
let buffer: TraceEvent[] = [];

/** Cheap guard for the hooks: `DEV && isTracing() && record!(...)` */
export const isTracing = function (): boolean {
    return armed > 0;
};

// Gated as expressions (!DEV ? null : fn): statement-level if(false) bodies
// survive esbuild's late cross-module DEV inlining and would ship dead bytes
export const record = !DEV
    ? null
    : function (e: Omit<TraceEvent, 'at'>): void {
          const event = e as TraceEvent;
          event.at = seq++;
          buffer.push(event);
          if (buffer.length > armed) {
              buffer.shift();
          }
      };

/** Values become summaries IMMEDIATELY — the buffer never holds references */
export const summarize = !DEV
    ? null
    : function (v: unknown): unknown {
          if (v === null || v === undefined || typeof v === 'number' || typeof v === 'boolean') {
              return v;
          }
          if (typeof v === 'string') {
              return v.length > 40 ? v.slice(0, 40) + '…' : v;
          }
          if (Array.isArray(v)) {
              return 'Array(' + v.length + ')';
          }
          if (typeof v === 'function') {
              return 'fn';
          }
          return 'Object';
      };

/**
 * trace(n)      arm: record the last n events (clears previous capture)
 * trace()       read: snapshot of the captured events (plain JSON)
 * trace(false)  disarm and clear
 */
export const trace = function (arg?: number | false): TraceEvent[] {
    if (!DEV) {
        return []; // dev builds only — production pays zero
    }
    if (arg === false) {
        armed = 0;
        seq = 0;
        buffer = [];
        return [];
    }
    if (typeof arg === 'number') {
        armed = Math.max(1, Math.floor(arg));
        seq = 0;
        buffer = [];
        return [];
    }
    return buffer.slice();
};
