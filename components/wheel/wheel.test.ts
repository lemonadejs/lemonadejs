/**
 * <Wheel /> block tests — including the registry gate: verify() must pass.
 * The v5 behaviors: one row per option, mouse-wheel notch = one row,
 * trackpad glide + settle, press/drag with snap-on-release, value commit
 * on release. Geometry is driven by rowheight × visible (jsdom has no
 * layout): every position asserts against the style attribute transform.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Wheel from '@lemonadejs/wheel';

type Api = {
    getIndex(): number;
    setIndex(i: number): void;
    getValue(): unknown;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const COLORS = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];

const root = () => handle!.query('.lm-wheel')!;
const list = () => handle!.query('.lm-wheel-options')!;
const rows = () => handle!.queryAll('.lm-wheel-option');
const transform = () => list().style.transform;
const selectedRow = () => handle!.query('.lm-wheel-option[data-selected="true"]');

const wheel = (deltaY: number) =>
    root().dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));

const mouse = (type: string, y: number) => {
    const e = new MouseEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clientY', { value: y });
    return e;
};

const touch = (type: string, y: number) => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'changedTouches', { value: [{ clientY: y }] });
    return e;
};

/** press on `target` then move across `points`, release on the document */
const drag = (target: Element, from: number, ...points: number[]) => {
    target.dispatchEvent(mouse('mousedown', from));
    for (const y of points) {
        document.dispatchEvent(mouse('mousemove', y));
    }
    document.dispatchEvent(mouse('mouseup', points[points.length - 1] ?? from));
};

describe('components/wheel — the iOS-style option wheel', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Wheel as never).pass).toBe(true);
    });

    it('renders one row per option: strings and v5 { title } objects', () => {
        handle = t(Wheel, { options: [{ title: 'January' }, { title: 'February' }, 'March', 4] });
        expect(rows().map((r) => r.textContent)).toEqual(['January', 'February', 'March', '4']);
    });

    it('geometry derives from rowheight × visible (the jsdom-deterministic model)', () => {
        handle = t(Wheel, { options: COLORS, rowheight: 40, visible: 5 });
        expect(root().style.height).toBe('200px'); // 5 × 40 (the v5 viewport)
        expect(rows()[0].style.height).toBe('40px');
        expect(rows()[0].style.lineHeight).toBe('40px');
        // The masks cover the 2 rows above and below the selection band (v5: 80px)
        expect((handle.query('.lm-wheel-mask-top') as HTMLElement).style.height).toBe('80px');
        expect((handle.query('.lm-wheel-mask-bottom') as HTMLElement).style.height).toBe('80px');
    });

    it('starts at index 0, centered: translateY(pad)', () => {
        handle = t(Wheel, { options: COLORS });
        expect(transform()).toBe('translateY(80px)');
        expect(selectedRow()!.textContent).toBe('Red');
        expect(selectedRow()!.getAttribute('aria-selected')).toBe('true');
    });

    it('selected sets the initial index when unbound', () => {
        handle = t(Wheel, { options: COLORS, selected: 3 });
        expect(transform()).toBe('translateY(-40px)'); // 80 - 3×40
        expect(selectedRow()!.textContent).toBe('Yellow');
    });

    it('bind wins over selected and stays two-way — external writes are silent', () => {
        const current = store(2);
        const changes: number[] = [];
        handle = t(Wheel, { bind: current, selected: 4, options: COLORS, onchange: (i: number) => changes.push(i) });
        expect(transform()).toBe('translateY(0px)'); // bind wins: 80 - 2×40
        expect(selectedRow()!.textContent).toBe('Blue');

        current.value = 0; // external write flows in, silently
        expect(transform()).toBe('translateY(80px)');
        expect(changes).toEqual([]);

        wheel(120); // user notch writes back
        expect(current.value).toBe(1);
        expect(changes).toEqual([1]);
    });

    it('a mouse-wheel notch steps exactly one row and commits (v5: 40px per notch)', () => {
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, onchange: (i: number) => changes.push(i) });

        wheel(120);
        wheel(120);
        expect(transform()).toBe('translateY(0px)');
        expect(selectedRow()!.textContent).toBe('Blue');

        wheel(-120);
        expect(transform()).toBe('translateY(40px)');
        expect(changes).toEqual([1, 2, 1]);

        wheel(-120);
        wheel(-120); // clamped at the first row: no extra onchange
        expect(transform()).toBe('translateY(80px)');
        expect(changes).toEqual([1, 2, 1, 0]);
    });

    it('trackpad deltas glide freely, then settle commits the nearest row once', () => {
        vi.useFakeTimers();
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, onchange: (i: number) => changes.push(i) });

        wheel(12);
        wheel(12);
        wheel(12);
        expect(transform()).toBe('translateY(44px)'); // 80 - 36: mid-glide, off-grid
        expect(selectedRow()!.textContent).toBe('Green'); // live preview: round(36/40) = 1
        expect(changes).toEqual([]); // not committed yet

        vi.advanceTimersByTime(150);
        expect(transform()).toBe('translateY(40px)'); // snapped to row 1
        expect(changes).toEqual([1]); // one commit
    });

    it('drag follows the pointer (snap suspended), release snaps to the nearest row', () => {
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, onchange: (i: number) => changes.push(i) });

        root().dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mousemove', 15)); // dy = 85: v5 scrollTop = start - yDiff
        expect(root().className).toContain('lm-wheel-dragging');
        expect(transform()).toBe('translateY(-5px)'); // 80 - 85: tracking, off-grid

        document.dispatchEvent(mouse('mouseup', 15));
        expect(root().className).not.toContain('lm-wheel-dragging');
        expect(transform()).toBe('translateY(0px)'); // round(85/40) = row 2
        expect(changes).toEqual([2]);
    });

    it('dragging clamps at both ends (v5: native scrollTop bounds)', () => {
        handle = t(Wheel, { options: COLORS });

        drag(root(), 1000, 0); // pointer up = scroll down: far past the last row
        expect(transform()).toBe('translateY(-80px)'); // 80 - 4×40

        drag(root(), 0, 1000); // pointer down: far past the first row
        expect(transform()).toBe('translateY(80px)');
    });

    it('touch drags the wheel too (new over v5 — it only wired the mouse)', () => {
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, onchange: (i: number) => changes.push(i) });

        root().dispatchEvent(touch('touchstart', 200));
        document.dispatchEvent(touch('touchmove', 120)); // dy = 80
        expect(transform()).toBe('translateY(0px)');
        document.dispatchEvent(touch('touchend', 120));
        expect(changes).toEqual([2]);
        expect(selectedRow()!.textContent).toBe('Blue');
    });

    it('a tap (press + release without movement) selects the tapped row', () => {
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, onchange: (i: number) => changes.push(i) });

        rows()[3].dispatchEvent(mouse('mousedown', 50));
        document.dispatchEvent(mouse('mouseup', 50));
        expect(transform()).toBe('translateY(-40px)');
        expect(changes).toEqual([3]);
    });

    it('shrinking the option list clamps the selection (component-initiated: onchange fires)', () => {
        const options = store<unknown[]>(COLORS);
        const changes: number[] = [];
        handle = t(Wheel, { options, selected: 4, onchange: (i: number) => changes.push(i) });
        expect(selectedRow()!.textContent).toBe('Purple');

        options.value = COLORS.slice(0, 2);
        expect(changes).toEqual([1]);
        expect(transform()).toBe('translateY(40px)'); // re-centered on the new last row
        expect(selectedRow()!.textContent).toBe('Green');
    });

    it('exposes getIndex/setIndex/getValue through the api — setIndex clamps', () => {
        const months = [{ title: 'Jan' }, { title: 'Feb' }, { title: 'Mar' }];
        let api: Api | null = null;
        handle = t(Wheel, { options: months, ref: (a: Api) => (api = a) });

        api!.setIndex(2);
        expect(api!.getIndex()).toBe(2);
        expect(api!.getValue()).toBe(months[2]); // the entry itself (v5: self.value)
        expect(transform()).toBe('translateY(0px)');

        api!.setIndex(99); // clamps to the last row
        expect(api!.getIndex()).toBe(2);
        api!.setIndex(-5);
        expect(api!.getIndex()).toBe(0);
    });

    it('keyboard: arrows step a row, Home/End jump (new over v5)', () => {
        handle = t(Wheel, { options: COLORS });
        const key = (k: string) =>
            root().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

        expect(root().getAttribute('tabindex')).toBe('0');
        key('ArrowDown');
        key('ArrowDown');
        expect(selectedRow()!.textContent).toBe('Blue');
        key('ArrowUp');
        expect(selectedRow()!.textContent).toBe('Green');
        key('End');
        expect(selectedRow()!.textContent).toBe('Purple');
        key('Home');
        expect(selectedRow()!.textContent).toBe('Red');
    });

    it('disabled blocks every interaction and removes the tab stop', () => {
        const changes: number[] = [];
        handle = t(Wheel, { options: COLORS, disabled: true, onchange: (i: number) => changes.push(i) });
        expect(root().getAttribute('data-disabled')).toBe('true');
        expect(root().hasAttribute('tabindex')).toBe(false);

        wheel(120);
        drag(root(), 100, 20);
        root().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        expect(transform()).toBe('translateY(80px)'); // never moved
        expect(changes).toEqual([]);

        handle.unmount();
        handle = t(Wheel, { options: COLORS });
        expect(root().hasAttribute('data-disabled')).toBe(false);
    });

    it('balances document listeners: release on pointer-up AND on mid-drag unmount', () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const count = (spy: typeof added, type: string) =>
            spy.mock.calls.filter((c) => c[0] === type).length;

        handle = t(Wheel, { options: COLORS });
        drag(root(), 100, 50); // a completed gesture releases on pointer-up
        expect(count(added, 'mousemove')).toBe(count(removed, 'mousemove'));

        root().dispatchEvent(mouse('mousedown', 100)); // a gesture left in flight…
        expect(count(added, 'mouseup')).toBeGreaterThan(count(removed, 'mouseup'));
        handle.unmount(); // …is released by unmount
        handle = null;

        for (const type of ['mousemove', 'touchmove', 'mouseup', 'touchend']) {
            expect(count(added, type)).toBe(count(removed, type));
        }
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Wheel} options="${COLORS}" selected="2" rowheight="50" visible="3" /></main>`;
        handle = t(App);
        expect(root().style.height).toBe('150px'); // 3 × 50
        expect(transform()).toBe('translateY(-50px)'); // pad 50 - 2×50
        expect(selectedRow()!.textContent).toBe('Blue');
    });

    it('renders empty-safe with no props at all', () => {
        handle = t(Wheel);
        expect(rows()).toHaveLength(0);
        expect(transform()).toBe('translateY(80px)');
        wheel(120); // interactions on an empty wheel are no-ops
        drag(root(), 100, 20);
        expect(transform()).toBe('translateY(80px)');
    });
});
