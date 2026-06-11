/**
 * The three agent-footgun guards, built after the 40-block campaign:
 *
 *   1. subscribe() runs callbacks UNTRACKED, pinned to its source —
 *      the read-modify-write self-loop class (LJS-203) is dead
 *   2. computed() — derived state that stays live; the idiomatic fix
 *      for captured-once snapshots and hand-rolled peek pipelines
 *   3. isDisposing() — renderer-caused focusout/blur is detectable
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store, isDisposing, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('guard 1: subscribe() is untracked + pinned', () => {
    it('read-modify-write inside a subscription does NOT loop', () => {
        const data = store([1, 2, 3]);
        const version = store(0);
        let runs = 0;
        const stop = data.subscribe(() => {
            runs++;
            version.value++; // the exact pattern that used to be LJS-203
        });
        data.touch();
        data.touch();
        expect(runs).toBe(2);
        expect(version.value).toBe(2);
        stop();
    });

    it('reading OTHER states inside a subscription does not widen it', () => {
        const source = store(0);
        const other = store('a');
        let runs = 0;
        const stop = source.subscribe(() => {
            runs++;
            void other.value; // must NOT subscribe to `other`
        });
        source.value = 1;
        expect(runs).toBe(1);
        other.value = 'b'; // unrelated change
        other.value = 'c';
        expect(runs).toBe(1); // still pinned to source only
        stop();
    });

    it('the subscription keeps firing across many notifications (re-pinned)', () => {
        const source = store(0);
        let runs = 0;
        const stop = source.subscribe(() => runs++);
        for (let i = 1; i <= 5; i++) {
            source.value = i;
        }
        expect(runs).toBe(5);
        stop();
        source.value = 99;
        expect(runs).toBe(5); // unsubscribe still works
    });
});

describe('guard 2: computed() derived state', () => {
    it('derives, stays live, and renders', () => {
        let price!: State<number>;
        const C: Component = (p, { state, computed }) => {
            price = state(10);
            const qty = state(3);
            const total = computed(() => price.value * qty.value);
            return html`<div><b>${total}</b><button onclick="${() => qty.value++}">+</button></div>`;
        };
        handle = t(C);
        expect(handle.query('b')!.textContent).toBe('30');
        handle.query('button')!.click();
        expect(handle.query('b')!.textContent).toBe('40');
        price.value = 100;
        expect(handle.query('b')!.textContent).toBe('400');
    });

    it('fixes the captured-once snapshot: props flow through live', () => {
        const top = store(5);
        const Child = (props: Record<string, State<number>>, { computed }: { computed<T>(fn: () => T): State<T> }) => {
            // The Modal-anchor class of bug: a local DERIVED position that
            // FOLLOWS the prop instead of freezing its construction value
            const position = computed(() => (props.top ? props.top.value * 2 : 0));
            return html`<i>${position}</i>`;
        };
        const App: Component = () => html`<div><${Child} top="${top}" /></div>`;
        handle = t(App);
        expect(handle.text()).toBe('10');
        top.value = 50;
        expect(handle.text()).toBe('100');
    });

    it('is disposed with the component (no recompute after unmount)', () => {
        const source = store(1);
        let computations = 0;
        const C: Component = (p, { computed }) => {
            const double = computed(() => {
                computations++;
                return source.value * 2;
            });
            return html`<span>${double}</span>`;
        };
        handle = t(C);
        expect(computations).toBe(1);
        source.value = 2;
        expect(computations).toBe(2);
        handle.unmount();
        handle = null;
        source.value = 3;
        source.value = 4;
        expect(computations).toBe(2); // dead components do not compute
    });
});

describe('guard 3: isDisposing() — renderer-caused blurs are detectable', () => {
    it('a branch swap disposing the focused element reports isDisposing', () => {
        const userLeaves: boolean[] = [];
        let show!: State<boolean>;
        const C: Component = (p, { state }) => {
            show = state(true);
            return html`<div>${() =>
                show.value
                    ? html`<input class="field" onfocusout="${() => userLeaves.push(isDisposing())}" />`
                    : html`<p>gone</p>`}</div>`;
        };
        handle = t(C);
        const input = handle.query('.field') as HTMLInputElement;
        input.focus();

        // A REAL departure first: focus moves elsewhere — not disposing
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        expect(userLeaves).toEqual([false]);

        // Now refocus and swap the branch away: the disposal focusout
        input.focus();
        show.value = false;
        expect(userLeaves).toEqual([false, true]); // renderer-caused, flagged
        outside.remove();
    });

    it('unmounting a focused component reports isDisposing', () => {
        const flags: boolean[] = [];
        const C: Component = () =>
            html`<input class="f" onfocusout="${() => flags.push(isDisposing())}" />`;
        handle = t(C);
        (handle.query('.f') as HTMLInputElement).focus();
        handle.unmount();
        handle = null;
        expect(flags).toEqual([true]);
    });

    it('is false in normal flow', () => {
        expect(isDisposing()).toBe(false);
    });
});

describe('LJS-202 heuristic vs tool-owned bindings (regression)', () => {
    it('computed() + a primitive slot does not warn LJS-202 (binding reads are not template reads)', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const C: Component = (p, { state, computed }) => {
            const anchor = state('left');
            const position = computed(() => (anchor.value === 'top' ? 'row' : 'column'));
            // The primitive slot below is a legitimate snapshot — with the
            // computed() reads counted, this used to flag LJS-202 and fail verify()
            return html`<div data-mode="${'static'}"><i>${position}</i></div>`;
        };
        handle = t(C);
        expect(spy.mock.calls.some((c: unknown[]) => String(c[0]).includes('LJS-202'))).toBe(false);
        spy.mockRestore();
    });

    it('resource() + a primitive slot does not warn LJS-202 either', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const C: Component = (p, { state, resource }) => {
            const id = state(1);
            const r = resource(() => Promise.resolve('user' + id.value));
            queueMicrotask(() => void r);
            return html`<div data-mode="${'static'}"></div>`;
        };
        handle = t(C);
        expect(spy.mock.calls.some((c: unknown[]) => String(c[0]).includes('LJS-202'))).toBe(false);
        spy.mockRestore();
    });
});
