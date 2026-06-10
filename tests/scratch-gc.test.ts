/** TEMPORARY retention hunt — deleted after the bisect */
import { describe, it, expect } from 'vitest';
import { store } from '../src/index';
import { render } from '../src/test';
import Modal from '../components/modal/modal';

declare const gc: undefined | (() => void);

type Api = { open(): void; close(): void };

const collect = async (weak: WeakRef<object>) => {
    // NEVER deref between passes: the deref'd object lands on the stack and
    // conservative stack scanning keeps it alive through the next gc()
    for (let i = 0; i < 10; i++) {
        gc!();
        await new Promise((r) => setTimeout(r, 1));
    }
    return weak.deref() === undefined;
};

const cycle = (opts: Record<string, unknown>, interact: boolean, reopen: boolean) => {
    let api: Api | null = null;
    const t = render(Modal as never, { ...opts, ref: (a: Api) => (api = a) } as never);
    if (interact) {
        api!.open();
        const header = t.query('.lm-modal-header');
        header?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 9, clientY: 9 }));
        document.dispatchEvent(new MouseEvent('mouseup', {}));
        api!.close();
    }
    if (reopen) {
        api!.open();
    }
    t.unmount();
    return api as unknown as object;
};

describe('hunt', () => {
    it('G0: sanity — a plain object collects in this environment', async () => {
        const make = () => ({ payload: new Array(1000).fill(1) });
        expect(await collect(new WeakRef(make()))).toBe(true);
    });
    it('G1: harness render/unmount of a trivial non-contract component', async () => {
        const { html } = await import('../src/index');
        const make = () => {
            let api: object | null = null;
            const C = (props: { ref?: (a: object) => void }) => {
                props.ref?.({ hello: () => 1 });
                return html`<i>x</i>`;
            };
            const t = render(C as never, { ref: (a: object) => (api = a) } as never);
            t.unmount();
            return api as object;
        };
        expect(await collect(new WeakRef(make()))).toBe(true);
    });
    it('A: bare modal, never opened', async () => {
        expect(await collect(new WeakRef(cycle({}, false, false)))).toBe(true);
    });
    it('B: opened+closed, no extras', async () => {
        expect(await collect(new WeakRef(cycle({}, true, false)))).toBe(true);
    });
    it('B2: opened+closed with focus disabled', async () => {
        expect(await collect(new WeakRef(cycle({ focus: false }, true, false)))).toBe(true);
    });
    it('B3: opened+closed, body refocused after unmount', async () => {
        const api = null;
        const weak = new WeakRef(cycle({}, true, false) as object);
        (document.body as HTMLElement).focus?.();
        void api;
        expect(await collect(weak)).toBe(true);
    });
    it('B4: pure open/close via api — NO event dispatches, no queries', async () => {
        const make = () => {
            let api: Api | null = null;
            const t = render(Modal as never, { focus: false, ref: (a: Api) => (api = a) } as never);
            api!.open();
            api!.close();
            t.unmount();
            return api as unknown as object;
        };
        expect(await collect(new WeakRef(make()))).toBe(true);
    });
    it('B6: full interaction + a flush interaction on body after unmount', async () => {
        const weak = new WeakRef(cycle({ draggable: true, closable: true }, true, true) as object);
        // Move jsdom's internal last-event-target references off the modal
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(await collect(weak)).toBe(true);
    });
    it('B5: open only — unmount while open', async () => {
        const make = () => {
            let api: Api | null = null;
            const t = render(Modal as never, { focus: false, ref: (a: Api) => (api = a) } as never);
            api!.open();
            t.unmount();
            return api as unknown as object;
        };
        expect(await collect(new WeakRef(make()))).toBe(true);
    });
    it('C: opened with closable+backdrop', async () => {
        expect(await collect(new WeakRef(cycle({ closable: true, backdrop: true }, true, false)))).toBe(true);
    });
    it('D: opened with draggable (drag interaction)', async () => {
        expect(await collect(new WeakRef(cycle({ draggable: true }, true, false)))).toBe(true);
    });
    it('E: with shared store title', async () => {
        const shared = store('t');
        expect(await collect(new WeakRef(cycle({ title: shared }, true, false)))).toBe(true);
    });
    it('F: reopened before unmount', async () => {
        expect(await collect(new WeakRef(cycle({}, true, true)))).toBe(true);
    });
});
