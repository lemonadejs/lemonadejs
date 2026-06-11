/**
 * <Formify /> block tests — including the registry gate: verify() must pass.
 * v5 parity: smart <form> wrapper over named children — get/set (nested
 * bracket names), load/save wire format, the .val() custom protocol —
 * plus the v6 surface: bind (whole-form data), onchange, onsubmit, url.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store, type Component, type State } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Formify, { type FormifyApi, type FormifyData } from '@lemonadejs/formify';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.unstubAllGlobals();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

interface MountProps {
    bind?: State<FormifyData>;
    url?: string;
    onchange?: (data: FormifyData) => void;
    onsubmit?: (data: FormifyData, e: Event) => void;
    onload?: (data: FormifyData) => void;
}

/** Mount Formify with children (markup is the v5 model) and grab the api */
const mountForm = (props: MountProps = {}) => {
    let api: FormifyApi | null = null;
    const App: Component = () =>
        html`<${Formify} ref="${(a: FormifyApi) => (api = a)}" bind="${props.bind}"
            url="${props.url}" onchange="${props.onchange}" onsubmit="${props.onsubmit}"
            onload="${props.onload}">
            <input type="text" name="first" value="Paul" />
            <input type="text" name="address[city]" value="London" />
            <input type="checkbox" name="newsletter" />
            <input type="checkbox" name="plan" value="pro" />
            <input type="radio" name="gender" value="male" />
            <input type="radio" name="gender" value="female" checked />
            <select name="role">
                <option value="">none</option>
                <option value="admin">Admin</option>
                <option value="user" selected>User</option>
            </select>
            <select name="tags" multiple>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
            </select>
            <textarea name="bio">hello</textarea>
            <input type="submit" value="Send" />
        </${Formify}>`;
    handle = t(App);
    return api!;
};

const field = <T extends HTMLElement>(selector: string) => handle!.query(selector) as T;

const edit = (el: HTMLElement, value?: string) => {
    if (value !== undefined) {
        (el as HTMLInputElement).value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('components/formify', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Formify).pass).toBe(true);
    });

    it('renders a <form class="lm-formify"> wrapping the children (v5 model)', () => {
        mountForm();
        const form = handle!.query('form.lm-formify')!;
        expect(form).not.toBeNull();
        expect(form.querySelector('input[name="first"]')).not.toBeNull();
    });

    it('api.get collects every named field into one data object', () => {
        const api = mountForm();
        const data = api.get();
        expect(data.first).toBe('Paul');
        expect(data.role).toBe('user');
        expect(data.bio).toBe('hello');
        expect(data.gender).toBe('female'); // checked radio wins, any order
        expect(data.newsletter).toBe(false); // bare checkbox = boolean
        expect(data.plan).toBe(''); // valued checkbox off = ''
        expect(Array.isArray(data.tags)).toBe(true); // multiple select = array
    });

    it('bracket names build NESTED data, symmetric with set (fixes v5 flat get)', () => {
        const api = mountForm();
        expect(api.get().address).toEqual({ city: 'London' });

        api.set({ first: 'Ana', address: { city: 'Porto' } });
        expect(field<HTMLInputElement>('[name="address[city]"]').value).toBe('Porto');
        expect(api.get().address).toEqual({ city: 'Porto' });
    });

    it('numeric path segments create arrays', () => {
        let api: FormifyApi | null = null;
        const App: Component = () =>
            html`<${Formify} ref="${(a: FormifyApi) => (api = a)}">
                <input type="text" name="items[0]" value="one" />
                <input type="text" name="items[1]" value="two" />
            </${Formify}>`;
        handle = t(App);
        expect(api!.get().items).toEqual(['one', 'two']);
    });

    it('checkbox and radio semantics through get/set', () => {
        const api = mountForm();
        api.set({ newsletter: true, plan: 'pro', gender: 'male' });
        expect(field<HTMLInputElement>('[name="newsletter"]').checked).toBe(true);
        expect(field<HTMLInputElement>('[name="plan"]').checked).toBe(true);
        expect(field<HTMLInputElement>('[name="gender"][value="male"]').checked).toBe(true);
        expect(field<HTMLInputElement>('[name="gender"][value="female"]').checked).toBe(false);

        const data = api.get();
        expect(data.newsletter).toBe(true);
        expect(data.plan).toBe('pro');
        expect(data.gender).toBe('male');
    });

    it('reads RUNTIME selections of a multiple select (fixes v5 attribute query)', () => {
        const api = mountForm();
        const select = field<HTMLSelectElement>('[name="tags"]');
        select.options[0].selected = true; // property, not attribute
        select.options[2].selected = true;
        expect(api.get().tags).toEqual(['a', 'c']);

        api.set({ tags: ['b'] });
        expect([...select.selectedOptions].map((o) => o.value)).toEqual(['b']);
    });

    it('api.set is a WHOLE-form apply: unmatched fields are cleared (v5)', () => {
        const api = mountForm();
        api.set({ first: 'Only' });
        expect(field<HTMLInputElement>('[name="first"]').value).toBe('Only');
        expect(field<HTMLInputElement>('[name="address[city]"]').value).toBe('');
        expect(field<HTMLSelectElement>('[name="role"]').value).toBe('');
        expect(field<HTMLInputElement>('[name="gender"][value="female"]').checked).toBe(false);
    });

    it('bind applies the initial data on mount and stays two-way', () => {
        const data = store<FormifyData>({ first: 'Bound', address: { city: 'Berlin' } });
        mountForm({ bind: data });
        expect(field<HTMLInputElement>('[name="first"]').value).toBe('Bound');
        expect(field<HTMLInputElement>('[name="address[city]"]').value).toBe('Berlin');

        // initial bind is a whole-form apply (v5 set): unmatched cleared
        expect(field<HTMLInputElement>('[name="gender"][value="female"]').checked).toBe(false);

        // user edit flows out — a full snapshot of the form
        edit(field('[name="first"]'), 'Typed');
        expect((data.value as FormifyData).first).toBe('Typed');
        expect((data.value as FormifyData).gender).toBe('');

        // external write flows in
        data.value = { first: 'External' };
        expect(field<HTMLInputElement>('[name="first"]').value).toBe('External');
    });

    it('fires onchange ONCE per user edit, never on programmatic writes', () => {
        const changes: FormifyData[] = [];
        const api = mountForm({ onchange: (d: FormifyData) => changes.push(d) });

        edit(field('[name="first"]'), 'a'); // input + change = one edit
        expect(changes.length).toBe(1);
        expect(changes[0].first).toBe('a');

        edit(field('[name="first"]'), 'ab');
        expect(changes.length).toBe(2);

        api.set({ first: 'silent' }); // programmatic: silent
        expect(changes.length).toBe(2);

        edit(field('[name="first"]'), 'a'); // back to a previous value still fires
        expect(changes.length).toBe(3);
    });

    it('declared onsubmit intercepts native submit with the collected data', () => {
        const submits: FormifyData[] = [];
        mountForm({ onsubmit: (d: FormifyData) => submits.push(d) });

        const form = handle!.query('form') as HTMLFormElement;
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(submits.length).toBe(1);
        expect(submits[0].first).toBe('Paul');
    });

    it('without onsubmit the native submit is untouched (v5)', () => {
        mountForm();
        const form = handle!.query('form') as HTMLFormElement;
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
    });

    it('url loads remote JSON on mount, applies it and fires onload', async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve({ json: () => Promise.resolve({ first: 'Remote', role: 'admin' }) })
        );
        vi.stubGlobal('fetch', fetchMock);

        const loads: FormifyData[] = [];
        mountForm({ url: '/profile', onload: (d: FormifyData) => loads.push(d) });
        await flush();

        expect(fetchMock).toHaveBeenCalledWith('/profile', { headers: { 'X-Requested-With': 'http' } });
        expect(field<HTMLInputElement>('[name="first"]').value).toBe('Remote');
        expect(field<HTMLSelectElement>('[name="role"]').value).toBe('admin');
        expect(loads).toEqual([{ first: 'Remote', role: 'admin' }]);
    });

    it('api.save POSTs the collected data with the v5 wire format', async () => {
        const fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: 1 }) }));
        vi.stubGlobal('fetch', fetchMock);

        const api = mountForm();
        const results: unknown[] = [];
        const returned = await api.save('/save', (r) => results.push(r));

        const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('/save');
        expect(options.method).toBe('POST');
        expect((options.headers as Record<string, string>)['X-Requested-With']).toBe('http');
        expect(JSON.parse(options.body as string).first).toBe('Paul');
        expect(results).toEqual([{ success: 1 }]); // v5 callback
        expect(returned).toEqual({ success: 1 }); // v6 promise
    });

    it('honors the v5 .val() protocol on custom children', () => {
        let api: FormifyApi | null = null;
        const App: Component = () =>
            html`<${Formify} ref="${(a: FormifyApi) => (api = a)}">
                <div name="color"></div>
            </${Formify}>`;
        handle = t(App);

        let held: unknown = 'red';
        const custom = handle.query('[name="color"]') as HTMLElement & { val?: (v?: unknown) => unknown };
        custom.val = (v?: unknown) => (v === undefined ? held : (held = v));

        expect(api!.get().color).toBe('red');
        api!.set({ color: 'blue' });
        expect(held).toBe('blue');
    });

    it('destroy-clean: unmount releases the bound store subscription', () => {
        const data = store<FormifyData>({ first: 'x' });
        const subsOf = (s: unknown): number => (s as { subs: Set<unknown> }).subs.size;
        const before = subsOf(data);
        mountForm({ bind: data });
        expect(subsOf(data)).toBeGreaterThan(before);

        handle!.unmount();
        handle = null;
        expect(subsOf(data)).toBe(before);
        data.value = { first: 'y' }; // must not touch the dead DOM
    });
});
