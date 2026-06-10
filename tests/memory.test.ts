/**
 * Destroy receipts — the permanent gate against v5's deepest wound:
 * "memory only grows, almost impossible to destroy."
 *
 * The observable proof of complete disposal: a module-scope store's
 * subscription set returns to EMPTY after consumers unmount. If any
 * binding survives unmount, these tests fail — destroy-completeness can
 * never silently regress again.
 */
import { describe, it, expect } from 'vitest';
import { html, store, batch, createWebComponent, component, use, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

const subsOf = (s: State<unknown>): number => (s as unknown as { subs: Set<unknown> }).subs.size;

describe('Destroy: nothing survives unmount', () => {
    it('200 mount/unmount cycles against a shared store leave zero subscriptions', () => {
        const counter = store(0);
        const C: Component = () =>
            html`<div class="${() => 'c' + counter.value}"><p>${counter}</p><span>${() => counter.value * 2}</span></div>`;

        for (let i = 0; i < 200; i++) {
            const handle = t(C);
            counter.value = i; // exercise the bindings while mounted
            handle.unmount();
        }
        expect(subsOf(counter)).toBe(0);
        expect(document.body.querySelectorAll('div').length).toBe(0);
    });

    it('branch churn (lists growing and emptying) does not accumulate subscriptions', () => {
        const items = store<number[]>([]);
        const C: Component = () =>
            html`<ul>${() => items.value.map((x) => html`<li class="${() => 'i' + x}">${() => x + items.value.length}</li>`)}</ul>`;

        const handle = t(C);
        for (let i = 0; i < 50; i++) {
            items.value = Array.from({ length: 100 }, (_, k) => k);
            items.value = [];
        }
        handle.unmount();
        expect(subsOf(items)).toBe(0);
    });

    it('detach-cache holds ONE bounded generation; replacement and unmount release it', () => {
        const shared = store('x');
        const items = store<number[]>([1, 2, 3]);
        const Item: Component<{ id?: State<number> }> = () => html`<li>${shared}</li>`;
        const App: Component = () => html`<ul>${() => items.value.map((x) => html`<${Item} id="${x}" />`)}</ul>`;

        const handle = t(App);
        expect(subsOf(shared)).toBe(3);

        // Emptying DETACHES (the show/hide cache): the hidden generation is
        // kept — bounded to exactly one generation per slot, by design
        items.value = [];
        expect(subsOf(shared)).toBe(3);

        // Different content rebuilds those positions: cached generation disposed
        items.value = [9];
        expect(subsOf(shared)).toBe(1);

        // Unmount releases everything, cached or live
        items.value = [];
        handle.unmount();
        expect(subsOf(shared)).toBe(0);
    });

    it('native bind directives release their store on unmount', () => {
        const name = store('lemon');
        const C: Component = () => html`<div><input bind="${name}" /><textarea bind="${name}"></textarea></div>`;
        for (let i = 0; i < 50; i++) {
            t(C).unmount();
        }
        expect(subsOf(name)).toBe(0);
    });

    it('batch() does not strand queued bindings after unmount', () => {
        const a = store(0);
        const handle = t((() => html`<p>${a}</p>`) as Component);
        batch(() => {
            a.value = 1;
            a.value = 2;
        });
        handle.unmount();
        expect(subsOf(a)).toBe(0);
    });

    it('subscribe() is fully released by its unsubscribe function', () => {
        const s = store(0);
        const offs = Array.from({ length: 100 }, () => s.subscribe(() => {}));
        expect(subsOf(s)).toBe(100);
        for (const off of offs) {
            off();
        }
        expect(subsOf(s)).toBe(0);
    });

    it('web components auto-destroy on real removal but survive same-tick moves', async () => {
        const external = store('live');
        const Probe = component('memprobe', { label: '' }, (props: { label?: State<string> }) =>
            html`<p class="probe">${external}:${props.label}</p>`);
        createWebComponent(Probe);

        // Same-tick move: stays mounted, no remount
        const el = document.createElement('lm-memprobe');
        document.body.appendChild(el);
        expect(el.querySelector('.probe')).not.toBeNull();
        const target = document.createElement('div');
        document.body.appendChild(target);
        target.appendChild(el); // disconnect + reconnect within one tick
        await Promise.resolve(); // the grace microtask
        expect(el.querySelector('.probe')).not.toBeNull();
        expect(subsOf(external)).toBeGreaterThan(0);

        // Real removal: auto-unmounts and releases the store
        el.remove();
        await Promise.resolve();
        expect(el.querySelector('.probe')).toBeNull();
        expect(subsOf(external)).toBe(0);

        // Reconnect: remounts fresh and works again
        document.body.appendChild(el);
        expect(el.querySelector('.probe')).not.toBeNull();
        el.remove();
        await Promise.resolve();
        expect(subsOf(external)).toBe(0);
        target.remove();
    });

    it('sugar singletons are withdrawn on unmount', () => {
        const Service = component('memsugar', { api: { ping: Function } }, (props: { ref?: (a: object) => void }) => {
            props.ref?.({ ping: () => 'pong' });
            return html`<i></i>`;
        });
        const App: Component = () => html`<main><${Service} expose /></main>`;
        for (let i = 0; i < 20; i++) {
            const handle = t(App);
            expect(use(Service)).not.toBeNull();
            handle.unmount();
            expect(use(Service)).toBeNull();
        }
    });
});
