import { describe, it, expect, afterEach, vi } from 'vitest';
import lemonade, { render, mount, explain, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('Lifecycle, dev mode and errors', () => {
    it('runs onMount after attach and cleanups + onUnmount on unmount', () => {
        const log: string[] = [];
        const C: Component = (props, { onMount, onUnmount }) => {
            onMount((el) => {
                log.push('mounted:' + (el as Element).tagName + ':' + document.contains(el as Node));
                return () => log.push('cleanup');
            });
            onUnmount(() => log.push('unmounted'));
            return render`<section>x</section>`;
        };

        handle = t(C);
        expect(log).toEqual(['mounted:SECTION:true']);
        handle.unmount();
        handle = null;
        expect(log).toEqual(['mounted:SECTION:true', 'unmounted', 'cleanup']);
    });

    it('freezes state contents in dev mode so silent mutation throws', () => {
        const C: Component = (props, { state }) => {
            const items = state([1, 2]);
            expect(() => (items.value as number[]).push(3)).toThrow(TypeError);
            return render`<div></div>`;
        };
        handle = t(C);
    });

    it('state onchange callback receives new and old values', () => {
        const calls: [number, number][] = [];
        let ref!: State<number>;
        const C: Component = (props, { state }) => {
            const count = state(0, (v, old) => calls.push([v, old]));
            ref = count;
            return render`<div>${count}</div>`;
        };
        handle = t(C);
        ref.value = 1;
        ref.value = 5;
        expect(calls).toEqual([
            [1, 0],
            [5, 1],
        ]);
    });

    it('warns LJS-202 when a snapshot looks like a mistake', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const C: Component = (props, { state }) => {
            const count = state(1);
            return render`<div>${count.value}</div>`; // read during setup → snapshot
        };
        handle = t(C);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-202'))).toBe(true);
        spy.mockRestore();
    });

    it('throws LJS-104 for capitalized string tags', () => {
        const C: Component = () => render`<div><Card /></div>`;
        expect(() => t(C)).toThrow(/LJS-104/);
    });

    it('throws LJS-102 for unclosed tags', () => {
        const C: Component = () => render`<div><p>`;
        expect(() => t(C)).toThrow(/LJS-102/);
    });

    it('throws LJS-101 for mismatched closing tags', () => {
        const C: Component = () => render`<div><p>x</div>`;
        expect(() => t(C)).toThrow(/LJS-101/);
    });

    it('throws LJS-301 for string event handlers (CSP-safe by design)', () => {
        const C: Component = () => render`<div><button onclick="alert(1)">x</button></div>`;
        expect(() => t(C)).toThrow(/LJS-301/);
    });

    it('throws LJS-002 when a component does not return a view', () => {
        const C = (() => '<div></div>') as unknown as Component;
        expect(() => t(C)).toThrow(/LJS-002/);
    });

    it('throws LJS-003 for an invalid mount root', () => {
        const C: Component = () => render`<div></div>`;
        expect(() => mount(C, null as unknown as Element)).toThrow(/LJS-003/);
    });

    it('explain() returns offline documentation for every code', () => {
        for (const code of ['LJS-001', 'LJS-002', 'LJS-101', 'LJS-104', 'LJS-201', 'LJS-202', 'LJS-301']) {
            expect(explain(code).length).toBeGreaterThan(40);
        }
    });

    it('inspect() reports the live component tree as plain JSON', () => {
        const Child: Component = (props, { state }) => {
            state('child-state');
            return render`<span>c</span>`;
        };
        const C: Component = (props, { state }) => {
            const count = state(11);
            void count;
            return render`<div><${Child} /></div>`;
        };

        handle = t(C);
        const info = handle.inspect() as { component: string; states: unknown[]; children: { states: unknown[] }[] };
        expect(info.states).toEqual([11]);
        expect(info.children[0].states).toEqual(['child-state']);
    });

    it('produces a deterministic snapshot', () => {
        const C: Component = () => render`<div class="a"><p>hi</p></div>`;
        handle = t(C);
        expect(handle.snapshot()).toBe('<div class="a">\n  <p>\n    "hi"');
    });

    it('default export exposes the full API', () => {
        expect(typeof lemonade.render).toBe('function');
        expect(typeof lemonade.mount).toBe('function');
        expect(typeof lemonade.inspect).toBe('function');
        expect(typeof lemonade.explain).toBe('function');
        expect(lemonade.version).toBe(6);
    });
});
