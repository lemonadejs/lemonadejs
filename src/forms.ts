/**
 * LemonadeJS v6 — forms companion (lemonadejs/forms)
 *
 * Successor of v5's lm-path/setPath: a typed object of states mirroring a
 * data shape, ready for bind, with whole-form get/set.
 *
 *   import { form } from 'lemonadejs/forms';
 *
 *   const f = form({ name: '', address: { city: '' }, age: 0 });
 *   html`<input bind="${f.name}" /><input bind="${f.address.city}" />`;
 *   f.$get();                       // { name: '...', address: { city: '...' }, age: 0 }
 *   f.$set({ name: 'Ana' });        // partial updates, nested supported
 */

import type { State } from './types';
// Satellite entry: values come only from ./index (one shared engine)
import { store } from './index';

export type Form<T> = {
    [K in keyof T]: T[K] extends Record<string, unknown> ? Form<T[K]> : State<T[K]>;
} & {
    /** Snapshot of the whole form as plain data */
    $get(): T;
    /** Apply a (partial, possibly nested) data object to the form states */
    $set(values: Partial<T>): void;
};

const isPlainObject = function (v: unknown): v is Record<string, unknown> {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
        return false;
    }
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
};

export const form = function <T extends Record<string, unknown>>(initial: T): Form<T> {
    const fields: Record<string, unknown> = {};

    for (const key of Object.keys(initial)) {
        const v = initial[key];
        fields[key] = isPlainObject(v) ? form(v) : store(v);
    }

    const isGroup = function (field: unknown): field is Form<Record<string, unknown>> {
        return typeof (field as { $get?: unknown }).$get === 'function';
    };

    Object.defineProperty(fields, '$get', {
        value: function (): T {
            const out: Record<string, unknown> = {};
            for (const key of Object.keys(fields)) {
                const field = fields[key];
                out[key] = isGroup(field) ? field.$get() : (field as State<unknown>).peek();
            }
            return out as T;
        },
    });

    Object.defineProperty(fields, '$set', {
        value: function (values: Partial<T>): void {
            if (!values || typeof values !== 'object') {
                return;
            }
            for (const key of Object.keys(values)) {
                const field = fields[key];
                if (field === undefined) {
                    continue;
                }
                const v = (values as Record<string, unknown>)[key];
                if (isGroup(field)) {
                    field.$set(v as Record<string, unknown>);
                } else {
                    (field as State<unknown>).value = v;
                }
            }
        },
    });

    return fields as Form<T>;
};

export default form;
