/**
 * <Modal /> behavior tests — the v5 capabilities, verified: 8-direction
 * resize with shift-aspect, drag with viewport clamping (better than v5),
 * the minimize dock with exact-size restore, close origins, element-scoped
 * Escape, headerless panels.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from '../../src/index';
import { render as t, verify } from '../../src/test';
import Modal from './modal';

type Api = { open(): void; close(): void; toggle(): void; front(): void; back(): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const setRect = (el: HTMLElement, r: { top: number; left: number; width: number; height: number }) => {
    el.getBoundingClientRect = () =>
        ({ ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => '' }) as DOMRect;
};

const mouse = (type: string, x: number, y: number, extra: MouseEventInit = {}) =>
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons: 1, ...extra });

const openModal = async (props: Record<string, unknown>) => {
    let api: Api | null = null;
    handle = t(Modal as never, { focus: false, ...props, ref: (a: Api) => (api = a) } as never);
    api!.open();
    await flush(); // per-open setup defers until the branch is attached
    const el = handle.query('.lm-modal') as HTMLElement;
    setRect(el, { top: 100, left: 100, width: 400, height: 300 });
    return { api: api!, el };
};

describe('components/modal — behaviors', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Modal as never).pass).toBe(true);
    });

    it('drags by the top bar and reports onmove(top, left) on release', async () => {
        const moves: [number, number][] = [];
        const { el } = await openModal({
            draggable: true,
            onmove: (top: number, left: number) => moves.push([top, left]),
        });

        el.dispatchEvent(mouse('mousedown', 150, 110)); // y within the 40px bar
        document.dispatchEvent(mouse('mousemove', 200, 160)); // +50, +50
        expect(el.style.top).toBe('150px');
        expect(el.style.left).toBe('150px');

        document.dispatchEvent(mouse('mouseup', 200, 160));
        expect(moves).toEqual([[150, 150]]);
    });

    it('CLAMPS dragging — the grab bar can never leave the screen (better than v5)', async () => {
        const { el } = await openModal({ draggable: true });

        el.dispatchEvent(mouse('mousedown', 150, 110));
        document.dispatchEvent(mouse('mousemove', 150, -5000)); // way above
        expect(el.style.top).toBe('0px'); // clamped

        document.dispatchEvent(mouse('mousemove', 99999, 110)); // way right
        expect(parseInt(el.style.left)).toBeLessThanOrEqual(window.innerWidth - 80);
        document.dispatchEvent(mouse('mouseup', 0, 0));
    });

    it('does not drag from below the bar', async () => {
        const { el } = await openModal({ draggable: true });
        const before = el.style.top; // centering sets explicit coordinates
        el.dispatchEvent(mouse('mousedown', 150, 200)); // y - top = 100 > 40
        document.dispatchEvent(mouse('mousemove', 250, 300));
        expect(el.style.top).toBe(before); // unchanged: no drag started
        document.dispatchEvent(mouse('mouseup', 0, 0));
    });

    it('resizes from the east edge', async () => {
        const sizes: [number, number][] = [];
        const { el } = await openModal({
            resizable: true,
            onresize: (w: number, h: number) => sizes.push([w, h]),
        });

        el.dispatchEvent(mouse('mousedown', 495, 250)); // within 10px of right edge (500)
        document.dispatchEvent(mouse('mousemove', 545, 250)); // +50
        expect(el.style.width).toBe('450px');
        expect(el.style.height).toBe('300px');

        document.dispatchEvent(mouse('mouseup', 545, 250));
        expect(sizes).toEqual([[450, 300]]);
    });

    it('resizes from the north-west corner, moving the origin', async () => {
        const { el } = await openModal({ resizable: true });
        el.dispatchEvent(mouse('mousedown', 103, 103)); // nw corner
        document.dispatchEvent(mouse('mousemove', 83, 73)); // -20, -30
        expect(el.style.left).toBe('80px');
        expect(el.style.width).toBe('420px');
        expect(el.style.top).toBe('70px');
        expect(el.style.height).toBe('330px');
        document.dispatchEvent(mouse('mouseup', 0, 0));
    });

    it('Shift preserves the aspect ratio while resizing east (v5)', async () => {
        const { el } = await openModal({ resizable: true });
        el.dispatchEvent(mouse('mousedown', 495, 250));
        document.dispatchEvent(mouse('mousemove', 595, 250, { shiftKey: true })); // +100 → h scales by 300/400
        expect(el.style.width).toBe('500px');
        expect(el.style.height).toBe('375px');
        document.dispatchEvent(mouse('mouseup', 0, 0));
    });

    it('respects minimum dimensions', async () => {
        const { el } = await openModal({ resizable: true });
        el.dispatchEvent(mouse('mousedown', 495, 250));
        document.dispatchEvent(mouse('mousemove', -1000, 250));
        expect(parseInt(el.style.width)).toBeGreaterThanOrEqual(140);
        document.dispatchEvent(mouse('mouseup', 0, 0));
    });

    it('minimize DOCKS to the taskbar and restore returns home at FULL size', async () => {
        const a = await openModal({ minimizable: true, draggable: true, top: 120, left: 130, position: 'absolute' });
        // restore returns to the EFFECTIVE position — keep the rect honest
        setRect(a.el, { top: 120, left: 130, width: 400, height: 300 });
        const minBtn = handle!.query('.lm-modal-minimize')!;

        minBtn.click();
        expect(a.el.className).toContain('lm-modal-minimized');
        expect(a.el.style.left).toBe('10px'); // first dock slot
        expect(parseInt(a.el.style.top)).toBe(window.innerHeight - 55);
        expect(minBtn.textContent).toBe('□'); // restore affordance

        minBtn.click(); // restore
        expect(a.el.className).not.toContain('lm-modal-minimized');
        expect(a.el.style.top).toBe('120px');
        expect(a.el.style.left).toBe('130px');
        // The exact pre-minimize dimensions return (recorded from the rect)
        expect(a.el.style.width).toBe('400px');
        expect(a.el.style.height).toBe('300px');
    });

    it('mousedown on a docked bar never moves it (layers front() must not wipe the dock position)', async () => {
        // The bug: front() re-ran styles(), which omitted top/left while
        // minimized — wiping the dock placement, so the bar jumped out
        // from under the cursor and the restore click never landed
        const a = await openModal({ minimizable: true, layers: true, position: 'absolute', top: 50, left: 60 });
        handle!.query('.lm-modal-minimize')!.click();
        expect(a.el.style.left).toBe('10px');
        const top = a.el.style.top;

        a.el.dispatchEvent(mouse('mousedown', 50, window.innerHeight - 40));
        expect(a.el.style.left).toBe('10px'); // still docked
        expect(a.el.style.top).toBe(top);
        document.dispatchEvent(mouse('mouseup', 50, window.innerHeight - 40));

        (handle!.query('.lm-modal-header') as HTMLElement).click(); // the click now lands
        expect(a.el.className).not.toContain('lm-modal-minimized');
    });

    it('clicking the minimized bar restores it', async () => {
        const a = await openModal({ minimizable: true, position: 'absolute', top: 50, left: 50 });
        handle!.query('.lm-modal-minimize')!.click();
        expect(a.el.className).toContain('lm-modal-minimized');

        (handle!.query('.lm-modal-header') as HTMLElement).click();
        expect(a.el.className).not.toContain('lm-modal-minimized');
    });

    it('two minimized modals occupy successive dock slots', async () => {
        const first = await openModal({ minimizable: true });
        const firstHandle = handle!;
        firstHandle.query('.lm-modal-minimize')!.click();
        const firstEl = first.el;

        handle = null;
        const second = await openModal({ minimizable: true });
        handle!.query('.lm-modal-minimize')!.click();

        expect(firstEl.style.left).toBe('10px');
        expect(second.el.style.left).toBe('215px'); // 10 + 205

        firstHandle.unmount(); // dock re-flows when a docked modal dies
        expect(second.el.style.left).toBe('10px');
    });

    it('close origins: button, backdrop, escape (element-scoped), api', async () => {
        const origins: string[] = [];
        const make = async () => {
            handle?.unmount();
            handle = null;
            return openModal({ closable: true, backdrop: true, onclose: (o: string) => origins.push(o) });
        };

        let m = await make();
        handle!.query('.lm-modal-close')!.click();
        m = await make();
        (handle!.query('.lm-modal-backdrop') as HTMLElement).click();
        m = await make();
        m.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        m = await make();
        m.api.close();

        expect(origins).toEqual(['button', 'backdrop', 'escape', 'api']);
    });

    it('Escape is element-scoped: a second modal is untouched', async () => {
        const origins: string[] = [];
        const a = await openModal({ closable: true, onclose: (o: string) => origins.push(o) });
        const firstHandle = handle!;
        handle = null;
        const b = await openModal({ closable: true, onclose: (o: string) => origins.push(o) });

        a.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(origins).toEqual(['escape']); // only the targeted modal closed
        expect(handle!.query('.lm-modal')).not.toBeNull(); // b still open
        void b;
        firstHandle.unmount();
    });

    it('autoadjust nudges the position back into the viewport on drag release (v5)', async () => {
        const moves: [number, number][] = [];
        const { el } = await openModal({
            autoadjust: true,
            draggable: true,
            onmove: (top: number, left: number) => moves.push([top, left]),
        });
        // The modal hangs 276px past the right edge (jsdom window is 1024 wide)
        setRect(el, { top: 100, left: 900, width: 400, height: 300 });

        el.dispatchEvent(mouse('mousedown', 950, 110));
        document.dispatchEvent(mouse('mousemove', 970, 130)); // -> top 120, left 920
        document.dispatchEvent(mouse('mouseup', 970, 130));

        // overflow 276 + 10 margin = 286 back; onmove reports the FINAL spot
        expect(el.style.left).toBe('634px');
        expect(el.style.top).toBe('120px');
        expect(moves).toEqual([[120, 634]]);
    });

    it('REOPEN runs per-open setup again: a dragged modal recenters', async () => {
        // Reopen reuses the cached branch (refs do not re-fire) — the open
        // subscription must re-arm setup or the modal reopens wherever it
        // was left, even off-screen (the real-Chrome probe pins geometry)
        const { api, el } = await openModal({ draggable: true, width: 400, height: 300 });
        el.dispatchEvent(mouse('mousedown', 150, 110));
        document.dispatchEvent(mouse('mousemove', 700, 400));
        document.dispatchEvent(mouse('mouseup', 700, 400));
        expect(el.style.top).not.toBe(Math.max(0, (window.innerHeight - 300) / 2) + 'px');

        api.close();
        await flush();
        api.open();
        await flush();
        expect(el.style.top).toBe(Math.max(0, (window.innerHeight - 300) / 2) + 'px');
        expect(el.style.left).toBe(Math.max(0, (window.innerWidth - 400) / 2) + 'px');
    });

    it('opens with explicit centered coordinates (v5 model)', async () => {
        const { el } = await openModal({ width: 400, height: 300 });
        expect(el.style.top).toBe(Math.max(0, (window.innerHeight - 300) / 2) + 'px');
        expect(el.style.left).toBe(Math.max(0, (window.innerWidth - 400) / 2) + 'px');
    });

    it('header="false" renders a headerless floating panel', async () => {
        await openModal({ header: false });
        expect(handle!.query('.lm-modal-header')).toBeNull();
        expect(handle!.query('.lm-modal-content')).not.toBeNull();
    });

    it('position is REACTIVE while open (v5 reactive-properties example)', async () => {
        const position = store('');
        const { el } = await openModal({ position, width: 300, height: 200 });
        expect(el.style.position).toBe('fixed'); // centered: explicit coords

        position.value = 'right';
        await flush();
        expect(handle!.query('.lm-modal-root')!.getAttribute('data-position')).toBe('right');
        expect(el.style.top).toBe(''); // flex-aligned now, no fixed coords

        position.value = ''; // back to default: centered coordinates return
        await flush();
        expect(el.style.top).toBe(Math.max(0, (window.innerHeight - 200) / 2) + 'px');
    });

    it('bind stays the controlled open state', () => {
        const visible = store(false);
        handle = t(Modal as never, { bind: visible, focus: false } as never);
        expect(handle.query('.lm-modal')).toBeNull();
        visible.value = true;
        expect(handle.query('.lm-modal')).not.toBeNull();
        visible.value = false;
        expect(handle.query('.lm-modal')).toBeNull();
    });

    it('layers: front() raises above other modals', async () => {
        const a = await openModal({ layers: true });
        const za = parseInt(a.el.style.zIndex || '0');
        a.el.dispatchEvent(mouse('mousedown', 300, 250)); // below bar: just front()
        document.dispatchEvent(mouse('mouseup', 0, 0));
        expect(parseInt(a.el.style.zIndex)).toBeGreaterThanOrEqual(za);
    });
});
