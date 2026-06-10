import { describe, it, expect, afterEach, vi } from 'vitest';
import lemonade, { html, mount, batch, explain, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

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
            return html`<section>x</section>`;
        };

        handle = t(C);
        expect(log).toEqual(['mounted:SECTION:true']);
        handle.unmount();
        handle = null;
        expect(log).toEqual(['mounted:SECTION:true', 'unmounted', 'cleanup']);
    });

    it('allows in-place mutation: silent until touch(), then delta-only updates', () => {
        type Row = { id: number; title: string };
        let rows!: State<Row[]>;
        const C: Component = (props, { state }) => {
            const data = state<Row[]>([
                { id: 1, title: 'a' },
                { id: 2, title: 'b' },
                { id: 3, title: 'c' },
            ]);
            rows = data;
            return html`<ul>${() => data.value.map((r) => html`<li>${r.title}</li>`)}</ul>`;
        };
        handle = t(C);
        const before = handle.queryAll('li');

        // Mutation alone is silent — no copy, no update
        rows.value[1].title = 'B';
        expect(handle.queryAll('li')[1].textContent).toBe('b');

        // touch() notifies: same array, same row objects, no copies anywhere
        rows.touch();
        const after = handle.queryAll('li');
        expect(after.map((li) => li.textContent)).toEqual(['a', 'B', 'c']);
        // Every element instance is reused — only one text node was written
        expect(after[0]).toBe(before[0]);
        expect(after[1]).toBe(before[1]);
        expect(after[2]).toBe(before[2]);
    });

    it('touch() fires the onchange callback', () => {
        const calls: number[] = [];
        let ref!: State<number[]>;
        const C: Component = (props, { state }) => {
            const data = state([1], () => calls.push(1));
            ref = data;
            return html`<div>${() => data.value.join(',')}</div>`;
        };
        handle = t(C);
        ref.value.push(2);
        ref.touch();
        expect(calls).toHaveLength(1);
        expect(handle.text()).toBe('1,2');
    });

    it('batch() coalesces many updates into one pass, deduped across states', () => {
        let runs = 0;
        let a!: State<number>, b!: State<number[]>;
        const C: Component = (props, { state }) => {
            const x = state(0);
            const list = state([0]);
            a = x;
            b = list;
            return html`<div>${() => (runs++, x.value + ':' + b.value.join(','))}</div>`;
        };
        handle = t(C);
        const before = runs;

        batch(() => {
            a.value = 1;
            a.value = 2;
            b.value.push(9);
            b.touch();
            expect(handle!.text()).toBe('0:0'); // nothing ran yet inside the batch
        });

        expect(runs).toBe(before + 1); // ONE re-run for four changes on two states
        expect(handle.text()).toBe('2:0,9'); // and the mutation was honored (forcing)
    });

    it('state onchange callback receives new and old values', () => {
        const calls: [number, number][] = [];
        let ref!: State<number>;
        const C: Component = (props, { state }) => {
            const count = state(0, (v, old) => calls.push([v, old]));
            ref = count;
            return html`<div>${count}</div>`;
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
            return html`<div>${count.value}</div>`; // read during setup → snapshot
        };
        handle = t(C);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-202'))).toBe(true);
        spy.mockRestore();
    });

    it('throws LJS-104 for capitalized string tags', () => {
        const C: Component = () => html`<div><Card /></div>`;
        expect(() => t(C)).toThrow(/LJS-104/);
    });

    it('throws LJS-102 for unclosed tags', () => {
        const C: Component = () => html`<div><p>`;
        expect(() => t(C)).toThrow(/LJS-102/);
    });

    it('throws LJS-101 for mismatched closing tags', () => {
        const C: Component = () => html`<div><p>x</div>`;
        expect(() => t(C)).toThrow(/LJS-101/);
    });

    it('throws LJS-301 for string event handlers (CSP-safe by design)', () => {
        const C: Component = () => html`<div><button onclick="alert(1)">x</button></div>`;
        expect(() => t(C)).toThrow(/LJS-301/);
    });

    it('throws LJS-002 when a component does not return a view', () => {
        const C = (() => '<div></div>') as unknown as Component;
        expect(() => t(C)).toThrow(/LJS-002/);
    });

    it('throws LJS-003 for an invalid mount root', () => {
        const C: Component = () => html`<div></div>`;
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
            return html`<span>c</span>`;
        };
        const C: Component = (props, { state }) => {
            const count = state(11);
            void count;
            return html`<div><${Child} /></div>`;
        };

        handle = t(C);
        const info = handle.inspect() as { component: string; states: unknown[]; children: { states: unknown[] }[] };
        expect(info.states).toEqual([11]);
        expect(info.children[0].states).toEqual(['child-state']);
    });

    it('produces a deterministic snapshot', () => {
        const C: Component = () => html`<div class="a"><p>hi</p></div>`;
        handle = t(C);
        expect(handle.snapshot()).toBe('<div class="a">\n  <p>\n    "hi"');
    });

    it('default export exposes the full API', () => {
        expect(typeof lemonade.html).toBe('function');
        expect(typeof lemonade.mount).toBe('function');
        expect(typeof lemonade.inspect).toBe('function');
        expect(typeof lemonade.explain).toBe('function');
        expect(lemonade.version).toBe(6);
    });
});
