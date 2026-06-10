/**
 * THE destroy stress test — v5's deepest wound was that components could
 * not really be destroyed: memory only grew. This suite proves v6 destroy
 * under mass creation with the heaviest interactive blocks (Modal:
 * document listeners, drag/resize handlers, backdrops; Contextmenu:
 * document-level dismissal listeners), three ways:
 *
 *   1. LISTENER BALANCE — every document.addEventListener is matched by a
 *      removeEventListener after unmount. Deterministic, the exact v5
 *      failure class.
 *   2. COLLECTABILITY — WeakRefs to component internals must be garbage
 *      collected after unmount. If anything retains the component graph,
 *      deref() survives and the test fails.
 *   3. HEAP GROWTH — hundreds of create/interact/destroy cycles may not
 *      grow the heap beyond noise.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, store, type Component, type State } from '../src/index';
import { render } from '../src/test';
import Modal from '../components/modal/modal';
import Contextmenu from '../components/contextmenu/contextmenu';

declare const gc: undefined | (() => void);

const subsOf = (s: State<unknown>): number => (s as unknown as { subs: Set<unknown> }).subs.size;

/** Track the net balance of document-level listeners */
const balance = { count: 0 };
const originalAdd = document.addEventListener.bind(document);
const originalRemove = document.removeEventListener.bind(document);

beforeEach(() => {
    balance.count = 0;
    document.addEventListener = ((...args: Parameters<typeof originalAdd>) => {
        balance.count++;
        return originalAdd(...args);
    }) as typeof document.addEventListener;
    document.removeEventListener = ((...args: Parameters<typeof originalRemove>) => {
        balance.count--;
        return originalRemove(...args);
    }) as typeof document.removeEventListener;
});

afterEach(() => {
    document.addEventListener = originalAdd;
    document.removeEventListener = originalRemove;
});

type ModalApi = { open(): void; close(): void };
type MenuApi = { openAt(x: number, y: number): void; close(): void };

const modalCycle = (shared: State<string>) => {
    let api: ModalApi | null = null;
    const t = render(Modal as never, {
        title: shared, // subscribes the shared store
        closable: true,
        draggable: true,
        resizable: true,
        backdrop: true,
        ref: (a: ModalApi) => (api = a),
    } as never);
    api!.open();
    // Interact: drag (document mousemove/mouseup listeners in flight)
    const header = t.query('.lm-modal-header')!;
    header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 50, clientY: 50 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 80 }));
    document.dispatchEvent(new MouseEvent('mouseup', {}));
    api!.close();
    api!.open(); // detach-cache reattach path
    t.unmount();
    return api!;
};

const menuCycle = (shared: State<string>) => {
    let api: MenuApi | null = null;
    const t = render(Contextmenu as never, {
        options: [
            { title: 'One', onclick: () => {} },
            { type: 'line' },
            { title: shared.peek(), submenu: [{ title: 'Nested' }] },
        ],
        ref: (a: MenuApi) => (api = a),
    } as never);
    api!.openAt(40, 40);
    api!.close();
    t.unmount();
    return api!;
};

describe('Destroy under mass creation (the v5 wound, gated)', () => {
    it('300 modal create/interact/destroy cycles: zero leaked listeners, zero subscriptions', () => {
        const shared = store('title');
        for (let i = 0; i < 300; i++) {
            modalCycle(shared);
        }
        expect(subsOf(shared)).toBe(0);
        expect(balance.count).toBe(0); // every document listener removed
        expect(document.querySelectorAll('.lm-modal').length).toBe(0);
        expect(document.querySelectorAll('.lm-modal-backdrop').length).toBe(0);
    });

    it('300 contextmenu create/open/destroy cycles: zero leaked listeners', () => {
        const shared = store('item');
        for (let i = 0; i < 300; i++) {
            menuCycle(shared);
        }
        expect(balance.count).toBe(0);
        expect(document.querySelectorAll('.lm-contextmenu').length).toBe(0);
    });

    it('an in-flight drag at unmount time is still released', () => {
        const shared = store('x');
        let api: ModalApi | null = null;
        const t = render(Modal as never, {
            title: shared,
            draggable: true,
            ref: (a: ModalApi) => (api = a),
        } as never);
        api!.open();
        const header = t.query('.lm-modal-header')!;
        header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }));
        // No mouseup — unmount mid-drag
        t.unmount();
        expect(balance.count).toBe(0);
        expect(subsOf(shared)).toBe(0);
    });

    it('the unmount tool lets a component end itself, completely', () => {
        const shared = store('toast');
        const Toast: Component = (props, { unmount }) =>
            html`<div class="toast">${shared}<button onclick="${unmount}">×</button></div>`;
        const App: Component = () => html`<main><${Toast} /></main>`;

        const t = render(App);
        expect(t.query('.toast')).not.toBeNull();
        expect(subsOf(shared)).toBe(1);

        t.query('button')!.click(); // the component destroys itself
        expect(t.query('.toast')).toBeNull();
        expect(subsOf(shared)).toBe(0); // full disposal, not just DOM removal
        t.unmount();
    });

    it('self-unmounted instances are never resurrected as zombies', () => {
        const items = store<number[]>([1]);
        let api: { unmount(): void } | null = null;
        const Item: Component<{ ref?: (a: { unmount(): void }) => void }> = (props, { unmount }) => {
            props.ref?.({ unmount });
            return html`<li class="zomb">alive</li>`;
        };
        const App: Component = () =>
            html`<ul>${() => items.value.map(() => html`<${Item} ref="${(a: never) => (api = a)}" />`)}</ul>`;

        const t = render(App);
        expect(t.query('.zomb')).not.toBeNull();

        api!.unmount(); // child ends itself
        expect(t.query('.zomb')).toBeNull();

        // The owner re-renders the same position with the same values:
        // the dead instance must NOT come back — a FRESH one is built
        items.touch();
        expect(t.query('.zomb')).not.toBeNull();
        expect(t.query('.zomb')!.textContent).toBe('alive');
        t.unmount();
        expect(subsOf(items)).toBe(0);
    });

    it('unmounted components are garbage-collectable (WeakRef proof)', async function () {
        if (typeof gc !== 'function') {
            return; // requires --expose-gc (enabled in vitest config)
        }
        const shared = store('alive');
        // Methodology, established forensically (scripts/hunt-retainer.mjs):
        // 1. no local binding for the target and NO deref between gc passes —
        //    V8 conservative stack scanning pins anything touching the stack;
        // 2. jsdom memoizes querySelector results PER SELECTOR
        //    (DocumentImpl._nwsapi.selectResolvers) — re-running the same
        //    selectors after unmount releases the cached elements. This is
        //    jsdom-only; browsers do not memo querySelector.
        const weak = new WeakRef(modalCycle(shared) as object);
        document.querySelector('.lm-modal-header');
        for (let i = 0; i < 10; i++) {
            gc();
            await new Promise((r) => setTimeout(r, 0));
        }
        // The api object closes over the entire component scope — if it is
        // collectable, the whole component graph is
        expect(weak.deref()).toBeUndefined();
        expect(subsOf(shared)).toBe(0);
    });

    it('heap does not grow across 600 mixed cycles', async function () {
        if (typeof gc !== 'function') {
            return; // requires --expose-gc
        }
        const shared = store('stress');
        // Warmup: stabilize caches, shapes, jsdom internals
        for (let i = 0; i < 50; i++) {
            modalCycle(shared);
            menuCycle(shared);
        }
        gc();
        await new Promise((r) => setTimeout(r, 0));
        gc();
        const baseline = process.memoryUsage().heapUsed;

        for (let i = 0; i < 300; i++) {
            modalCycle(shared);
            menuCycle(shared);
        }
        gc();
        await new Promise((r) => setTimeout(r, 0));
        gc();
        const after = process.memoryUsage().heapUsed;
        const growth = (after - baseline) / (1024 * 1024);

        // v5 grew without bound; v6 must stay within allocator noise
        expect(growth).toBeLessThan(4);
        expect(subsOf(shared)).toBe(0);
    });
});
