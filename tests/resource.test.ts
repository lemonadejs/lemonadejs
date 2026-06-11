/**
 * resource(): async data whose lifecycle the component owns. The fetcher
 * is TRACKED (state reads re-run it), the previous request aborts, only
 * the LATEST response writes, unmount aborts everything — the
 * out-of-order race and the zombie write are not writable.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, type Component, type Resource, type State } from '../src/index';
import { render as t, flush } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** A fetcher whose promises resolve only when the test says so */
const makeFetcher = <T,>() => {
    const calls: { resolve: (v: T) => void; reject: (e: unknown) => void; signal: AbortSignal; arg: unknown }[] = [];
    const fetcher = (arg: unknown) => (signal: AbortSignal) =>
        new Promise<T>((resolve, reject) => {
            calls.push({ resolve, reject, signal, arg });
        });
    return { calls, fetcher };
};

describe('resource(): the async lifecycle tool', () => {
    it('loads on mount: loading flips, data lands, loading clears', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let r!: Resource<string>;
        const C: Component = (p, { resource }) => {
            r = resource(fetcher('a'));
            return html`<i>${() => (r.loading.value ? '…' : r.data.value || 'empty')}</i>`;
        };
        handle = t(C);
        expect(handle.text()).toBe('…');
        expect(r.loading.peek()).toBe(true);

        calls[0].resolve('hello');
        await flush();
        expect(r.data.peek()).toBe('hello');
        expect(r.loading.peek()).toBe(false);
        expect(handle.text()).toBe('hello');
    });

    it('is TRACKED: a state read in the fetcher re-fetches and aborts the previous request', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let id!: State<number>;
        let r!: Resource<string>;
        const C: Component = (p, { state, resource }) => {
            id = state(1);
            r = resource((signal) => fetcher('user' + id.value)(signal));
            return html`<i>${() => r.data.value || ''}</i>`;
        };
        handle = t(C);
        expect(calls.length).toBe(1);

        id.value = 2; // tracked dependency → re-fetch
        expect(calls.length).toBe(2);
        expect(calls[0].signal.aborted).toBe(true); // the stale request was aborted
        expect(calls[1].signal.aborted).toBe(false);

        calls[1].resolve('two');
        await flush();
        expect(r.data.peek()).toBe('two');
    });

    it('OUT-OF-ORDER responses: only the latest run writes', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let id!: State<number>;
        let r!: Resource<string>;
        const C: Component = (p, { state, resource }) => {
            id = state(1);
            r = resource((signal) => fetcher(id.value)(signal));
            return html`<i></i>`;
        };
        handle = t(C);
        id.value = 2; // two requests in flight

        calls[1].resolve('SECOND'); // newest resolves first
        await flush();
        expect(r.data.peek()).toBe('SECOND');

        calls[0].resolve('FIRST'); // the stale response arrives late
        await flush();
        expect(r.data.peek()).toBe('SECOND'); // and is dropped
        expect(r.error.peek()).toBeUndefined();
    });

    it('errors land in error and clear on the next attempt', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let r!: Resource<string>;
        const C: Component = (p, { resource }) => {
            r = resource(fetcher('x'));
            return html`<i>${() => (r.error.value ? 'failed' : 'ok')}</i>`;
        };
        handle = t(C);
        calls[0].reject(new Error('500'));
        await flush();
        expect(handle.text()).toBe('failed');
        expect(r.loading.peek()).toBe(false);

        r.reload(); // new attempt clears the error immediately
        expect(r.error.peek()).toBeUndefined();
        expect(r.loading.peek()).toBe(true);
        calls[1].resolve('recovered');
        await flush();
        expect(handle.text()).toBe('ok');
        expect(r.data.peek()).toBe('recovered');
    });

    it('unmount aborts the in-flight request; a late response writes NOTHING', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let r!: Resource<string>;
        const C: Component = (p, { resource }) => {
            r = resource(fetcher('x'));
            return html`<i></i>`;
        };
        handle = t(C);
        handle.unmount();
        handle = null;
        expect(calls[0].signal.aborted).toBe(true);

        calls[0].resolve('zombie');
        await flush();
        expect(r.data.peek()).toBeUndefined(); // the zombie write never happened
        expect(r.loading.peek()).toBe(true); // frozen mid-flight: no further writes at all
    });

    it('a rejection from the superseded request is SILENT (no error state)', async () => {
        const { calls, fetcher } = makeFetcher<string>();
        let r!: Resource<string>;
        const C: Component = (p, { resource }) => {
            r = resource(fetcher('x'));
            return html`<i></i>`;
        };
        handle = t(C);
        r.reload(); // supersedes the first request
        calls[0].reject(new DOMException('aborted', 'AbortError'));
        await flush();
        expect(r.error.peek()).toBeUndefined();
        calls[1].resolve('fine');
        await flush();
        expect(r.data.peek()).toBe('fine');
    });

    it('a SYNCHRONOUS throw in the fetcher becomes error, not an unhandled exception', () => {
        let r!: Resource<string>;
        const C: Component = (p, { resource }) => {
            r = resource(() => {
                throw new Error('no fetch here');
            });
            return html`<i></i>`;
        };
        handle = t(C);
        expect(String(r.error.peek())).toContain('no fetch here');
        expect(r.loading.peek()).toBe(false);
    });

    it('sync (non-promise) fetcher values work', async () => {
        let r!: Resource<number>;
        const C: Component = (p, { resource }) => {
            r = resource(() => 42);
            return html`<i>${() => r.data.value ?? ''}</i>`;
        };
        handle = t(C);
        await flush();
        expect(handle.text()).toBe('42');
    });

    it('warns LJS-206 in dev when the fetcher reads its own states (on a re-run)', async () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let id!: State<number>;
        const C: Component = (p, { state, resource }) => {
            id = state(1);
            // The handle exists only AFTER setup — an own-read can only
            // happen on re-runs, which is exactly when the loop starts
            const r: Resource<string> = resource(() => Promise.resolve('v' + id.value + (r ? r.data.value || '' : '')));
            return html`<i></i>`;
        };
        handle = t(C);
        expect(spy.mock.calls.some((c) => String(c[0]).includes('LJS-206'))).toBe(false);

        id.value = 2; // re-run: now the fetcher reads r.data — the loop seed
        expect(spy.mock.calls.some((c) => String(c[0]).includes('LJS-206'))).toBe(true);
        // Unmount WHILE the spy is active: the async loop keeps warning on
        // every microtask until disposal — restoring first leaked to stderr
        handle.unmount();
        handle = null;
        await flush();
        spy.mockRestore();
    });
});
