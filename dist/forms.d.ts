/**
 * LemonadeJS v6 — forms companion (lemonadejs/forms)
 *
 * Successor of v5's lm-path/setPath: a typed object of states mirroring a
 * data shape, ready for bind, with whole-form get/set.
 *
 *   import { form } from 'lemonadejs/forms';
 *
 *   const f = form({ name: '', address: { city: '' }, age: 0 });
 *   render`<input bind="${f.name}" /><input bind="${f.address.city}" />`;
 *   f.$get();                       // { name: '...', address: { city: '...' }, age: 0 }
 *   f.$set({ name: 'Ana' });        // partial updates, nested supported
 */
import type { State } from './types';
export type Form<T> = {
    [K in keyof T]: T[K] extends Record<string, unknown> ? Form<T[K]> : State<T[K]>;
} & {
    /** Snapshot of the whole form as plain data */
    $get(): T;
    /** Apply a (partial, possibly nested) data object to the form states */
    $set(values: Partial<T>): void;
};
export declare const form: <T extends Record<string, unknown>>(initial: T) => Form<T>;
export default form;
