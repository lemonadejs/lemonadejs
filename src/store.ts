/**
 * LemonadeJS v6 — shared state
 *
 * store() creates a state OUTSIDE any component: module-scope app state
 * that any component can interpolate or assign. Same State<T> contract as
 * the state() tool — interpolation subscribes, assignment notifies.
 *
 *   export const session = store({ user: null });
 *   export const theme = store('light', 'app-theme');   // persisted
 */

import type { State } from './types';
import { StateImpl } from './reactivity';
import { DEV } from './env';

let storeSeq = 0;

export const store = function <T>(initial: T, storage?: string): State<T> {
    let value = initial;
    if (storage && typeof localStorage !== 'undefined') {
        try {
            const raw = localStorage.getItem(storage);
            if (raw !== null) {
                value = JSON.parse(raw) as T;
            }
        } catch {
            // Unreadable storage: fall back to the initial value
        }
    }
    const persist = storage
        ? function (v: T) {
              try {
                  localStorage.setItem(storage, JSON.stringify(v));
              } catch {
                  // Storage unavailable (quota, privacy mode): stay in memory
              }
          }
        : undefined;
    const s = new StateImpl<T>(value, persist);
    DEV && (s.label = 'store.' + (storage || storeSeq++));
    return s;
};
