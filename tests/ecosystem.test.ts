/**
 * The restored v5 capabilities in v6 idiom: store() shared state,
 * unsafe() trusted HTML, createWebComponent() interop, and the
 * lemonadejs/forms companion.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, unsafe, createWebComponent, type Component, type State } from '../src/index';
import { form } from '../src/forms';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('store() — shared state outside components', () => {
    it('shares one store across two independently mounted components', () => {
        const counter = store(0);
        const Display: Component = () => html`<p class="d">${counter}</p>`;
        const Controls: Component = () =>
            html`<button onclick="${() => counter.value++}">+</button>`;
        const App: Component = () => html`<main><${Display} /><${Controls} /></main>`;

        handle = t(App);
        handle.query('button')!.click();
        handle.query('button')!.click();
        expect(handle.query('.d')!.textContent).toBe('2');
        expect(counter.value).toBe(2);
    });

    it('works in expressions and stays live after unmount/remount', () => {
        const theme = store('light');
        const C: Component = () => html`<div class="${() => 'app ' + theme.value}"></div>`;

        const first = t(C);
        theme.value = 'dark';
        expect(first.query('div')!.className).toBe('app dark');
        first.unmount();

        handle = t(C);
        expect(handle.query('div')!.className).toBe('app dark');
        theme.value = 'light';
        expect(handle.query('div')!.className).toBe('app light');
    });

    it('persists to localStorage and restores on creation', () => {
        localStorage.removeItem('test-key');
        const a = store({ count: 1 }, 'test-key');
        a.value = { count: 7 };
        expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ count: 7 });

        const b = store({ count: 0 }, 'test-key');
        expect(b.value).toEqual({ count: 7 });
        localStorage.removeItem('test-key');
    });
});

describe('unsafe() — explicit trusted HTML', () => {
    it('renders trusted markup as real elements', () => {
        const C: Component = () => html`<div>${unsafe('<b>bold</b> and <i>italic</i>')}</div>`;
        handle = t(C);
        expect(handle.query('b')!.textContent).toBe('bold');
        expect(handle.query('i')!.textContent).toBe('italic');
    });

    it('contrasts with default escaping in the same template', () => {
        const markup = '<u>markup</u>';
        const C: Component = () => html`<div><p class="esc">${markup}</p><p class="raw">${unsafe(markup)}</p></div>`;
        handle = t(C);
        expect(handle.query('.esc u')).toBeNull();
        expect(handle.query('.esc')!.textContent).toBe('<u>markup</u>');
        expect(handle.query('.raw u')!.textContent).toBe('markup');
    });

    it('participates in conditionals like any node list', () => {
        let show!: State<boolean>;
        const content = unsafe('<em>article</em>');
        const C: Component = (p, { state }) => {
            const on = state(true);
            show = on;
            return html`<div>${() => on.value && content}</div>`;
        };
        handle = t(C);
        expect(handle.query('em')).not.toBeNull();
        show.value = false;
        expect(handle.query('em')).toBeNull();
        show.value = true;
        expect(handle.query('em')).not.toBeNull();
    });
});

describe('createWebComponent() — interop boundary', () => {
    it('defines a custom element that mounts the component on connect', () => {
        const Hello: Component<{ name?: string }> = (props) =>
            html`<p class="hello">Hello ${props.name}</p>`;
        const tag = createWebComponent('hello', Hello as Component<Record<string, unknown>>);
        expect(tag).toBe('lm-hello');

        const el = document.createElement('lm-hello');
        el.setAttribute('name', 'world');
        document.body.appendChild(el);
        expect(el.querySelector('.hello')!.textContent).toBe('Hello world');

        (el as unknown as { unmount(): void }).unmount();
        expect(el.querySelector('.hello')).toBeNull();
        el.remove();
    });

    it('supports a custom prefix and rich props via the props property', () => {
        const List: Component<{ items?: string[] }> = (props) =>
            html`<ul>${(props.items || []).map((x) => html`<li>${x}</li>`)}</ul>`;
        const tag = createWebComponent('list', List as Component<Record<string, unknown>>, { prefix: 'app' });
        expect(tag).toBe('app-list');

        const el = document.createElement('app-list') as HTMLElement & { props?: object };
        el.props = { items: ['a', 'b'] };
        document.body.appendChild(el);
        expect([...el.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['a', 'b']);
        el.remove();
    });

    it('keeps internal reactivity working inside the custom element', () => {
        const Counter: Component = (p, { state }) => {
            const n = state(0);
            return html`<div><span>${n}</span><button onclick="${() => n.value++}">+</button></div>`;
        };
        createWebComponent('counter', Counter as Component<Record<string, unknown>>);
        const el = document.createElement('lm-counter');
        document.body.appendChild(el);
        (el.querySelector('button') as HTMLButtonElement).click();
        expect(el.querySelector('span')!.textContent).toBe('1');
        el.remove();
    });
});

describe('lemonadejs/forms — form() companion', () => {
    it('creates states mirroring the data shape, nested included', () => {
        const f = form({ name: 'Ana', address: { city: 'Porto' }, age: 30 });
        expect(f.name.value).toBe('Ana');
        expect(f.address.city.value).toBe('Porto');
        expect(f.age.value).toBe(30);
    });

    it('$get returns plain data and $set applies partial nested updates', () => {
        const f = form({ name: '', address: { city: '', zip: '' } });
        f.$set({ name: 'Bia', address: { city: 'Lisboa' } });
        expect(f.$get()).toEqual({ name: 'Bia', address: { city: 'Lisboa', zip: '' } });
        f.address.zip.value = '1000';
        expect(f.$get().address.zip).toBe('1000');
    });

    it('binds form fields to inputs end to end', () => {
        const f = form({ user: { email: 'a@b.c' } });
        const C: Component = () => html`<div><input bind="${f.user.email}" /></div>`;
        handle = t(C);
        const input = handle.query('input') as HTMLInputElement;
        expect(input.value).toBe('a@b.c');

        input.value = 'new@mail.com';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(f.$get().user.email).toBe('new@mail.com');

        f.$set({ user: { email: 'set@mail.com' } });
        expect(input.value).toBe('set@mail.com');
    });

    it('$set ignores unknown keys instead of throwing', () => {
        const f = form({ a: 1 });
        expect(() => f.$set({ b: 2 } as never)).not.toThrow();
        expect(f.$get()).toEqual({ a: 1 });
    });

    it('fields are live in templates like any state', () => {
        const f = form({ title: 'first' });
        const C: Component = () => html`<h1>${f.title}</h1>`;
        handle = t(C);
        expect(handle.query('h1')!.textContent).toBe('first');
        f.title.value = 'second';
        expect(handle.query('h1')!.textContent).toBe('second');
    });
});
