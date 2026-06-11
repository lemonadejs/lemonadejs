/**
 * trace(): causality as data — the agent debugging loop for "my update
 * did not happen". Arm, act, read events back as plain JSON.
 * Plus the containment seam: one throwing expression must not take down
 * the update pass (LJS-205), while engine diagnostics still propagate.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, trace, store, component, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    trace(false);
    handle?.unmount();
    handle = null;
});

describe('trace(): arm, act, read', () => {
    it('captures writes with labels, summaries and the triggered runs', () => {
        let count!: State<number>;
        const Counter: Component = (p, { state }) => {
            count = state(0);
            return html`<p>${count}</p>`;
        };
        handle = t(Counter);

        trace(50);
        count.value = 7;
        const events = trace();

        const write = events.find((e) => e.kind === 'write')!;
        expect(write.state).toMatch(/\.s0$/); // component.s0
        expect(write.old).toBe(0);
        expect(write.value).toBe(7);
        expect(write.by).toBeUndefined(); // external write, no binding running

        const run = events.find((e) => e.kind === 'run')!;
        expect(run.cause).toBe(write.state); // the run names its cause
    });

    it('contract props and stores carry readable labels', () => {
        const Badge = component('tracebadge', { label: '' }, (props) => html`<b>${props.label}</b>`);
        const title = store('x');
        const App: Component = () => html`<div><${Badge} label="${title}" /></div>`;
        handle = t(App);

        trace(50);
        title.value = 'hello';
        const events = trace();
        const write = events.find((e) => e.kind === 'write')!;
        expect(String(write.state)).toMatch(/^store\./);
    });

    it('touch() is recorded as its own kind', () => {
        const rows = store([1, 2]);
        handle = t((() => html`<i>${() => (rows.value as number[]).length}</i>`) as Component);
        trace(10);
        (rows.value as number[]).push(3);
        rows.touch();
        const events = trace();
        expect(events.some((e) => e.kind === 'touch')).toBe(true);
    });

    it('values are SUMMARIZED — the buffer never holds references', () => {
        const data = store<unknown>(null);
        trace(10);
        const big = { a: 1, b: 2 };
        data.value = big;
        data.value = [1, 2, 3, 4, 5];
        data.value = 'a very long string that should be cut down to something shorter than this';
        const events = trace().filter((e) => e.kind === 'write');
        expect(events[0].value).toBe('Object'); // not the object itself
        expect(events[1].value).toBe('Array(5)');
        expect(String(events[2].value).length).toBeLessThanOrEqual(41);
    });

    it('LJS warnings land in the trace', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Probe = component('traceprobe401', { size: 0 }, () => html`<i></i>`);
        trace(20);
        const App: Component = () => html`<main><${Probe} wrong="${1}" /></main>`;
        handle = t(App);
        const warnEvent = trace().find((e) => e.kind === 'warn');
        expect(warnEvent?.code).toBe('LJS-402');
        spy.mockRestore();
    });

    it('ring buffer keeps only the last n events; trace(false) disarms and clears', () => {
        const n = store(0);
        trace(3);
        for (let i = 1; i <= 10; i++) {
            n.value = i;
        }
        const events = trace();
        expect(events.length).toBe(3);
        expect(events[events.length - 1].at).toBeGreaterThan(events[0].at);

        trace(false);
        n.value = 99;
        expect(trace()).toEqual([]);
    });

    it('writes from inside a binding carry the writer (by)', () => {
        const Comp: Component = (p, { state, computed }) => {
            const a = state(1);
            const double = computed(() => a.value * 2);
            queueMicrotask(() => void double); // keep referenced
            setTimeout(() => (a.value = 5), 0);
            return html`<i>${double}</i>`;
        };
        handle = t(Comp);
        trace(20);
        return new Promise<void>((resolve) =>
            setTimeout(() => {
                const writes = trace().filter((e) => e.kind === 'write');
                const computedWrite = writes.find((e) => String(e.state).indexOf('computed') >= 0)!;
                expect(String(computedWrite.by)).toContain('computed'); // written BY the computed binding
                resolve();
            }, 5)
        );
    });
});

describe('LJS-205: the containment seam', () => {
    it('one throwing expression does not take down the update pass', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        let user!: State<{ name: string } | null>;
        const C: Component = (p, { state }) => {
            user = state<{ name: string } | null>({ name: 'ana' });
            return html`<div>
                <b>${() => user.value!.name.toUpperCase()}</b>
                <i>${() => (user.value ? 'in' : 'out')}</i>
            </div>`;
        };
        handle = t(C);
        expect(handle.query('b')!.textContent).toBe('ANA');

        user.value = null; // <b> throws (null.name); <i> must still update
        expect(handle.query('i')!.textContent).toBe('out');
        expect(handle.query('b')!.textContent).toBe('ANA'); // last good content kept
        expect(spy.mock.calls.some((c) => String(c[0]).includes('LJS-205'))).toBe(true);
        spy.mockRestore();
    });

    it('logs once while failing, recovers and re-arms when the expression succeeds', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        let user!: State<{ name: string } | null>;
        const C: Component = (p, { state }) => {
            user = state<{ name: string } | null>(null);
            return html`<b>${() => (user.value === null ? 'none' : user.value.name.length > 0 && oops())}</b>`;
        };
        const oops = () => {
            throw new Error('boom');
        };
        handle = t(C);

        user.value = { name: 'x' }; // throws — logged
        user.value = { name: 'y' }; // throws again — suppressed
        expect(spy.mock.calls.filter((c) => String(c[0]).includes('LJS-205')).length).toBe(1);

        user.value = null; // recovers (clean run re-arms logging)
        expect(handle.query('b')!.textContent).toBe('none');
        user.value = { name: 'z' }; // throws — logged AGAIN
        expect(spy.mock.calls.filter((c) => String(c[0]).includes('LJS-205')).length).toBe(2);
        spy.mockRestore();
    });

    it('the error lands in the trace with the binding label', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        let v!: State<number>;
        const C: Component = (p, { state }) => {
            v = state(1);
            return html`<b>${() => {
                if (v.value === 2) {
                    throw new Error('expression exploded');
                }
                return v.value;
            }}</b>`;
        };
        handle = t(C);
        trace(20);
        v.value = 2;
        const err = trace().find((e) => e.kind === 'error')!;
        expect(err.detail).toContain('expression exploded');
        expect(String(err.binding)).toContain('#slot');
        spy.mockRestore();
    });

    it('engine diagnostics still PROPAGATE: the LJS-203 loop guard is not contained', () => {
        let a!: State<number>;
        const C: Component = (p, { state }) => {
            a = state(0);
            // Self-loop: the slot expression writes the state it reads
            return html`<b>${() => (a.value < 1000 ? ++a.value : a.value)}</b>`;
        };
        expect(() => {
            handle = t(C);
        }).toThrowError(/LJS-203/);
        handle = null;
    });
});
