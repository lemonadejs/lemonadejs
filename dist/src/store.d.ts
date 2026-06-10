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
export declare const store: <T>(initial: T, storage?: string) => State<T>;
