/**
 * <Formify /> — v6 port of v5's "pico smart HTML forms" (@lemonadejs/formify).
 *
 * v5 is NOT a field generator: it is a smart <form> wrapper around YOUR
 * markup. Any child carrying a name attribute participates; Formify
 * collects them into one data object and applies data objects back —
 * including nested names: name="address[city]" ⇄ { address: { city } }.
 *
 * v5 → v6 mapping:
 *   get()/set()       → api.get/api.set, PLUS bind="${state}": the whole
 *                       form as one two-way data object (user edits flow
 *                       out, external writes flow in)
 *   load(url)         → api.load(url) — now returns the promise — plus a
 *                       url prop that loads on mount; onload(data) fires
 *                       (declared but unused in v5)
 *   save(url, cb)     → api.save(url, cb) — same wire format as v5
 *                       (POST, JSON body, X-Requested-With header)
 *   .val() protocol   → still honored on custom children; v6 web
 *                       components are covered through their value
 *                       property and any inner [name] native inputs
 *
 * Deliberate fixes over v5 (the v5 code, not its intent):
 *   - radio groups: the checked value wins regardless of DOM order
 *     (v5 let a later unchecked sibling erase it)
 *   - multiple <select>: runtime selections are read (v5 queried the
 *     selected ATTRIBUTE, so user picks were invisible)
 *   - get() returns NESTED data for bracket names, symmetric with set()
 *     (v5 returned flat 'a[b]' keys but consumed nested data)
 *   - bare checkboxes are booleans; value-carrying ones submit their
 *     value ('' when off) — v5 returned the browser default 'on'
 *
 * Validation and submit stay native: required/pattern/etc on the children
 * block submission by constraint validation; a declared onsubmit receives
 * (data, event) with the default prevented.
 */

import { component, html } from 'lemonadejs';

export type FormifyData = Record<string, unknown>;

export interface FormifyApi {
    /** Collect every named field into one (nested) data object */
    get(): FormifyData;
    /** Apply a data object to the form — unmatched fields are cleared (v5) */
    set(data: FormifyData): void;
    /** GET url as JSON and apply it to the form (v5 load) */
    load(url: string): Promise<FormifyData | null>;
    /** POST the current data as JSON to url (v5 save, same wire format) */
    save(url: string, callback?: (result: unknown) => void): Promise<unknown>;
}

type FieldElement = HTMLElement & {
    value?: unknown;
    val?: (v?: unknown) => unknown;
};

/** Elements that can carry name but are never form fields */
const SKIP = /^(BUTTON|OPTION|OPTGROUP|FIELDSET|FORM|LABEL|OUTPUT|OBJECT|IFRAME|IMG|A|MAP|META|PARAM|SLOT)$/;

/** v5: name="user[address][city]" → the path user.address.city */
const parsePath = function (name: string): string[] {
    return name
        .replace(/\[(.*?)\]/g, '.$1')
        .split('.')
        .filter(function (part) {
            return part !== '';
        });
};

const deepGet = function (data: unknown, keys: string[]): unknown {
    let node: unknown = data;
    for (const key of keys) {
        if (node === null || typeof node !== 'object') {
            return undefined;
        }
        node = (node as Record<string, unknown>)[key];
    }
    return node;
};

/** Deep-set creating containers on the way — arrays for numeric keys */
const deepSet = function (data: FormifyData, keys: string[], value: unknown): void {
    let node: Record<string, unknown> = data;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (node[key] === null || typeof node[key] !== 'object') {
            node[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        }
        node = node[key] as Record<string, unknown>;
    }
    node[keys[keys.length - 1]] = value;
};

const fields = function (root: HTMLElement): FieldElement[] {
    return [...root.querySelectorAll<FieldElement>('[name]')].filter(function (el) {
        return !SKIP.test(el.tagName) && el.getAttribute('name');
    });
};

/** v5 get(): one data object out of every named field */
const collect = function (root: HTMLElement): FormifyData {
    const out: FormifyData = {};
    for (const el of fields(root)) {
        const keys = parsePath(el.getAttribute('name') as string);
        if (el.tagName === 'INPUT') {
            const input = el as unknown as HTMLInputElement;
            if (input.type === 'radio') {
                // The checked radio wins regardless of group order
                if (input.checked) {
                    deepSet(out, keys, input.value);
                } else if (deepGet(out, keys) === undefined) {
                    deepSet(out, keys, '');
                }
            } else if (input.type === 'checkbox') {
                // Bare checkbox = boolean; valued = its value or '' (off)
                const explicit = input.hasAttribute('value');
                const v = input.checked ? (explicit ? input.value : true) : explicit ? '' : false;
                if (input.checked || deepGet(out, keys) === undefined) {
                    deepSet(out, keys, v);
                }
            } else if (input.type === 'file') {
                deepSet(out, keys, input.files);
            } else {
                deepSet(out, keys, input.value);
            }
        } else if (el.tagName === 'SELECT') {
            const select = el as unknown as HTMLSelectElement;
            deepSet(
                out,
                keys,
                select.multiple
                    ? [...select.selectedOptions].map(function (o) {
                          return o.value;
                      })
                    : select.value
            );
        } else if (el.tagName === 'TEXTAREA') {
            deepSet(out, keys, (el as unknown as HTMLTextAreaElement).value);
        } else if (typeof el.val === 'function') {
            // v5 custom component protocol
            const v = el.val();
            deepSet(out, keys, v === undefined || v === null ? '' : v);
        } else if ('value' in el) {
            // v6 web components expose a value property
            deepSet(out, keys, el.value === undefined || el.value === null ? '' : el.value);
        } else {
            deepSet(out, keys, '');
        }
    }
    return out;
};

/** v5 set(): whole-form apply — fields missing from data are cleared */
const apply = function (root: HTMLElement, data: unknown): void {
    const source = data && typeof data === 'object' ? data : {};
    for (const el of fields(root)) {
        let v = deepGet(source, parsePath(el.getAttribute('name') as string));
        if (v === undefined || v === null) {
            v = '';
        }
        if (el.tagName === 'INPUT') {
            const input = el as unknown as HTMLInputElement;
            if (input.type === 'radio') {
                input.checked = v !== '' && String(v) === input.value;
            } else if (input.type === 'checkbox') {
                input.checked =
                    typeof v === 'boolean'
                        ? v
                        : input.hasAttribute('value')
                          ? v !== '' && String(v) === input.value
                          : !!v;
            } else if (input.type !== 'file') {
                // v5: files cannot be set programmatically
                input.value = String(v);
            }
        } else if (el.tagName === 'SELECT') {
            const select = el as unknown as HTMLSelectElement;
            if (select.multiple) {
                const wanted = (Array.isArray(v) ? v : v === '' ? [] : [v]).map(String);
                for (const option of [...select.options]) {
                    option.selected = wanted.indexOf(option.value) >= 0;
                }
            } else {
                select.value = String(v);
            }
        } else if (el.tagName === 'TEXTAREA') {
            (el as unknown as HTMLTextAreaElement).value = String(v);
        } else if (typeof el.val === 'function') {
            el.val(v);
        } else if ('value' in el) {
            el.value = v;
        }
    }
};

export const Formify = component('formify', {
    bind: Object,                 // the whole form as one two-way data object (v5: get/set only)
    url: '',                      // remote JSON applied to the form on mount (v5: load())
    onchange: Function,           // (data, previous) after any user edit
    onsubmit: Function,           // (data, event) — declaring it intercepts native submit
    onload: Function,             // (data) after url / api.load() data lands
    api: { get: Function, set: Function, load: Function, save: Function },
}, (props, { bind, onMount }) => {
    const values = bind(props, {} as FormifyData);

    let root: HTMLFormElement | null = null;
    let applying = false;         // an external write being applied to the DOM
    let lastSync = '';            // dedupes the input+change double-fire of one edit

    const get = (): FormifyData => (root ? collect(root) : {});

    const writeDom = (data: unknown) => {
        if (root) {
            apply(root, data);
            lastSync = '';
        }
    };

    /** User edit → collect → push into the bound state (fires onchange) */
    const sync = () => {
        const data = get();
        let json = '';
        try {
            json = JSON.stringify(data);
        } catch {
            json = '';
        }
        if (json && json === lastSync) {
            return;
        }
        lastSync = json;
        applying = true;
        values.set(data);
        applying = false;
    };

    const load = (url: string): Promise<FormifyData | null> => {
        if (!url || typeof fetch !== 'function') {
            return Promise.resolve(null);
        }
        try {
            return fetch(url, { headers: { 'X-Requested-With': 'http' } })
                .then((result) => result.json())
                .then((data: FormifyData) => {
                    values.value = data; // silent (no onchange); the subscriber applies it
                    props.onload?.(data);
                    return data;
                })
                .catch(() => null);
        } catch {
            return Promise.resolve(null);
        }
    };

    /** v5 save(): POST the data as JSON — wire format preserved verbatim */
    const save = (url: string, callback?: (result: unknown) => void): Promise<unknown> => {
        if (!url || typeof fetch !== 'function') {
            return Promise.resolve(null);
        }
        try {
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'http',
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(get()),
            })
                .then((result) => result.json())
                .then((result: unknown) => {
                    callback?.(result);
                    return result;
                })
                .catch(() => null);
        } catch {
            return Promise.resolve(null);
        }
    };

    const set = (data: FormifyData) => {
        values.value = data; // silent; the subscriber writes the DOM
    };

    props.ref?.({ get, set, load, save });

    onMount((el) => {
        root = el as HTMLFormElement;
        const initial = values.peek();
        if (initial && typeof initial === 'object' && Object.keys(initial).length) {
            writeDom(initial);
        }
        if (props.url.value) {
            load(props.url.value as string);
        }
        // External writes (bound state or api.set) flow into the DOM
        return values.subscribe((v) => {
            if (!applying) {
                writeDom(v);
            }
        });
    });

    return html`<form class="lm-formify"
        oninput="${sync}"
        onchange="${sync}"
        onsubmit="${(e: Event) => {
            const handler = props.onsubmit as ((data: FormifyData, e: Event) => void) | undefined;
            if (handler) {
                e.preventDefault();
                handler(get(), e);
            }
        }}">${props.children}</form>`;
});

export default Formify;
