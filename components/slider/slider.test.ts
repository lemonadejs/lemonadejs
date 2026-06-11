/**
 * <Slider /> block tests — including the registry gate: verify() must pass.
 *
 * jsdom rects are zero, so geometry is asserted two ways:
 *   - value → position: the fill width% / thumb left% inline styles are
 *     deterministic from value/min/max (no layout needed)
 *   - pointer → value: the track's getBoundingClientRect is stubbed
 *     (the modal setRect pattern) and mouse events drive the mapping
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Slider from '@lemonadejs/slider';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-slider')!;
const track = () => handle!.query('.lm-slider-track')!;
const fill = () => handle!.query('.lm-slider-fill')!;
const thumb = () => handle!.query('.lm-slider-thumb')!;

const setRect = (el: HTMLElement, r: { top: number; left: number; width: number; height: number }) => {
    el.getBoundingClientRect = () =>
        ({ ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => '' }) as DOMRect;
};

const mouse = (type: string, x: number, y = 0, extra: MouseEventInit = {}) =>
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons: 1, ...extra });

const key = (k: string) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });

/** Mount and stub the track rect: 200px wide at x=0 → clientX/2 = percent */
const mount = (props: Record<string, unknown> = {}) => {
    handle = t(Slider as never, props as never);
    setRect(track(), { top: 0, left: 0, width: 200, height: 24 });
};

describe('components/slider', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Slider as never).pass).toBe(true);
    });

    it('positions fill and thumb deterministically from the bound value', () => {
        mount({ bind: store(30) });
        expect(fill().style.width).toBe('30%');
        expect(thumb().style.left).toBe('30%');
        expect(thumb().getAttribute('role')).toBe('slider');
        expect(thumb().getAttribute('tabindex')).toBe('0');
        expect(thumb().getAttribute('aria-valuemin')).toBe('0');
        expect(thumb().getAttribute('aria-valuemax')).toBe('100');
        expect(thumb().getAttribute('aria-valuenow')).toBe('30');
    });

    it('starts at min when unbound', () => {
        mount({ min: 20, max: 120 });
        expect(fill().style.width).toBe('0%');
        expect(thumb().style.left).toBe('0%');
        expect(thumb().getAttribute('aria-valuenow')).toBe('20');
    });

    it('maps custom min/max ranges onto percent geometry', () => {
        mount({ bind: store(125), min: 50, max: 200 });
        expect(fill().style.width).toBe('50%');
        expect(thumb().style.left).toBe('50%');
        expect(thumb().getAttribute('aria-valuemin')).toBe('50');
        expect(thumb().getAttribute('aria-valuemax')).toBe('200');
    });

    it('drags: oninput per move, ONE onchange on release with the final value', () => {
        const value = store(0);
        const inputs: number[] = [];
        const changes: [number, number][] = [];
        mount({
            bind: value,
            oninput: (v: number) => inputs.push(v),
            onchange: (v: number, old: number) => changes.push([v, old]),
        });

        track().dispatchEvent(mouse('mousedown', 120)); // jump to 60
        expect(value.value).toBe(60);
        expect(fill().style.width).toBe('60%');

        document.dispatchEvent(mouse('mousemove', 100)); // 50
        document.dispatchEvent(mouse('mousemove', 140)); // 70
        document.dispatchEvent(mouse('mousemove', 140)); // same spot: no echo
        expect(inputs).toEqual([60, 50, 70]);
        expect(changes).toEqual([]); // nothing committed mid-drag

        document.dispatchEvent(mouse('mouseup', 140));
        expect(changes).toEqual([[70, 0]]); // ONE commit, final value, old value

        // listeners are gone: further moves change nothing
        document.dispatchEvent(mouse('mousemove', 20));
        expect(value.value).toBe(70);
        expect(inputs).toEqual([60, 50, 70]);
    });

    it('track click jumps to the pointer and commits on release', () => {
        const value = store(20);
        const changes: [number, number][] = [];
        mount({ bind: value, onchange: (v: number, old: number) => changes.push([v, old]) });

        track().dispatchEvent(mouse('mousedown', 100)); // 50%
        document.dispatchEvent(mouse('mouseup', 100));
        expect(value.value).toBe(50);
        expect(fill().style.width).toBe('50%');
        expect(changes).toEqual([[50, 20]]);

        // clicking the value it already has: no commit (v5-style)
        track().dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mouseup', 100));
        expect(changes).toEqual([[50, 20]]);
    });

    it('snaps to the step grid', () => {
        const value = store(0);
        mount({ bind: value, step: 10 });

        track().dispatchEvent(mouse('mousedown', 68)); // raw 34 → 30
        document.dispatchEvent(mouse('mouseup', 68));
        expect(value.value).toBe(30);
        expect(fill().style.width).toBe('30%');

        thumb().dispatchEvent(key('ArrowRight')); // keyboard steps by 10 too
        expect(value.value).toBe(40);
    });

    it('clamps to min/max while dragging past the track', () => {
        const value = store(50);
        mount({ bind: value });

        track().dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mousemove', 5000)); // way right
        expect(value.value).toBe(100);
        expect(fill().style.width).toBe('100%');

        document.dispatchEvent(mouse('mousemove', -5000)); // way left
        expect(value.value).toBe(0);
        expect(fill().style.width).toBe('0%');
        document.dispatchEvent(mouse('mouseup', -5000));
    });

    it('keyboard: Arrows ±step, Home/End, PageUp/PageDown ±10·step — each press commits', () => {
        const value = store(50);
        const inputs: number[] = [];
        const changes: [number, number][] = [];
        mount({
            bind: value,
            oninput: (v: number) => inputs.push(v),
            onchange: (v: number, old: number) => changes.push([v, old]),
        });

        thumb().dispatchEvent(key('ArrowRight'));
        expect(value.value).toBe(51);
        thumb().dispatchEvent(key('ArrowUp'));
        expect(value.value).toBe(52);
        thumb().dispatchEvent(key('ArrowLeft'));
        expect(value.value).toBe(51);
        thumb().dispatchEvent(key('ArrowDown'));
        expect(value.value).toBe(50);
        thumb().dispatchEvent(key('PageUp'));
        expect(value.value).toBe(60);
        thumb().dispatchEvent(key('PageDown'));
        expect(value.value).toBe(50);
        thumb().dispatchEvent(key('Home'));
        expect(value.value).toBe(0);
        thumb().dispatchEvent(key('End'));
        expect(value.value).toBe(100);

        expect(inputs).toEqual([51, 52, 51, 50, 60, 50, 0, 100]);
        expect(changes.length).toBe(8); // every key press is its own commit
        expect(changes[7]).toEqual([100, 0]);
    });

    it('keyboard clamps at the bounds without committing', () => {
        const value = store(100);
        const changes: number[] = [];
        mount({ bind: value, onchange: (v: number) => changes.push(v) });

        thumb().dispatchEvent(key('ArrowRight'));
        thumb().dispatchEvent(key('PageUp'));
        thumb().dispatchEvent(key('End'));
        expect(value.value).toBe(100);
        expect(changes).toEqual([]); // unchanged: silent

        value.value = 0;
        thumb().dispatchEvent(key('ArrowLeft'));
        thumb().dispatchEvent(key('Home'));
        expect(value.value).toBe(0);
        expect(changes).toEqual([]);
    });

    it('two-way bind: external writes are silent and reposition the thumb', () => {
        const value = store(20);
        const inputs: number[] = [];
        const changes: number[] = [];
        mount({ bind: value, oninput: (v: number) => inputs.push(v), onchange: (v: number) => changes.push(v) });

        value.value = 80; // external write flows in
        expect(fill().style.width).toBe('80%');
        expect(thumb().style.left).toBe('80%');
        expect(thumb().getAttribute('aria-valuenow')).toBe('80');
        expect(inputs).toEqual([]); // silent
        expect(changes).toEqual([]);

        value.value = 150; // out of range: display clamps, state untouched
        expect(fill().style.width).toBe('100%');
        expect(value.value).toBe(150);
    });

    it('disabled: inert to pointer and keyboard, unfocusable', () => {
        const value = store(40);
        const changes: number[] = [];
        mount({ bind: value, disabled: true, onchange: (v: number) => changes.push(v) });

        expect(root().className).toContain('lm-slider-disabled');
        expect(thumb().getAttribute('tabindex')).toBe('-1');
        expect(thumb().getAttribute('aria-disabled')).toBe('true');

        track().dispatchEvent(mouse('mousedown', 180));
        document.dispatchEvent(mouse('mousemove', 180));
        document.dispatchEvent(mouse('mouseup', 180));
        thumb().dispatchEvent(key('ArrowRight'));
        thumb().dispatchEvent(key('End'));

        expect(value.value).toBe(40);
        expect(fill().style.width).toBe('40%');
        expect(changes).toEqual([]);
    });

    it('balances document listeners after unmount MID-DRAG', () => {
        const added: Record<string, number> = {};
        const removed: Record<string, number> = {};
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        addSpy.mockImplementation((type, ...rest) => {
            added[type] = (added[type] || 0) + 1;
            return (EventTarget.prototype.addEventListener as Function).call(document, type, ...rest);
        });
        removeSpy.mockImplementation((type, ...rest) => {
            removed[type] = (removed[type] || 0) + 1;
            return (EventTarget.prototype.removeEventListener as Function).call(document, type, ...rest);
        });

        try {
            mount({ bind: store(0) });
            // two full gestures must not accumulate listeners…
            track().dispatchEvent(mouse('mousedown', 50));
            document.dispatchEvent(mouse('mousemove', 60));
            document.dispatchEvent(mouse('mouseup', 60));
            track().dispatchEvent(mouse('mousedown', 80));
            document.dispatchEvent(mouse('mouseup', 80));
            // …and the third is abandoned mid-drag: unmount must release it
            track().dispatchEvent(mouse('mousedown', 100));
            document.dispatchEvent(mouse('mousemove', 120));
            handle!.unmount();
            handle = null;

            expect(added['mousemove'] || 0).toBeGreaterThan(0);
            expect(removed['mousemove'] || 0).toBe(added['mousemove'] || 0);
            expect(removed['mouseup'] || 0).toBe(added['mouseup'] || 0);
        } finally {
            addSpy.mockRestore();
            removeSpy.mockRestore();
        }
    });

    it('marks=true ticks every step when feasible, highlighting up to the value', () => {
        mount({ bind: store(50), marks: true, step: 25 });
        const marks = handle!.queryAll('.lm-slider-mark');
        expect(marks.length).toBe(5); // 0, 25, 50, 75, 100
        expect(marks.map((m) => m.style.left)).toEqual(['0%', '25%', '50%', '75%', '100%']);
        expect(marks.map((m) => m.getAttribute('data-active'))).toEqual(['1', '1', '1', null, null]);
        handle!.unmount();

        // infeasible density (> 100 marks) renders none; marks=false renders none
        mount({ marks: true, step: 0.5 });
        expect(handle!.queryAll('.lm-slider-mark').length).toBe(0);
        handle!.unmount();
        mount({ step: 25 });
        expect(handle!.queryAll('.lm-slider-mark').length).toBe(0);
    });

    it('showvalue: the bubble appears while dragging or focused, with the live value', () => {
        mount({ bind: store(30), showvalue: true });
        expect(handle!.query('.lm-slider-bubble')).toBeNull();

        track().dispatchEvent(mouse('mousedown', 120)); // dragging → bubble
        expect(handle!.query('.lm-slider-bubble')!.textContent).toBe('60');
        document.dispatchEvent(mouse('mousemove', 160));
        expect(handle!.query('.lm-slider-bubble')!.textContent).toBe('80');
        document.dispatchEvent(mouse('mouseup', 160));

        thumb().blur(); // release kept it visible through focus
        expect(handle!.query('.lm-slider-bubble')).toBeNull();

        thumb().focus(); // keyboard users see it too
        expect(handle!.query('.lm-slider-bubble')!.textContent).toBe('80');
        handle!.unmount();

        // without showvalue the bubble never exists
        mount({ bind: store(30) });
        track().dispatchEvent(mouse('mousedown', 120));
        expect(handle!.query('.lm-slider-bubble')).toBeNull();
        document.dispatchEvent(mouse('mouseup', 120));
    });

    it('renders the label only when provided and exposes color as a data attribute', () => {
        mount({ label: 'Volume', color: 'purple' });
        expect(handle!.query('.lm-slider-label')!.textContent).toBe('Volume');
        expect(thumb().getAttribute('aria-label')).toBe('Volume');
        expect(root().getAttribute('data-color')).toBe('purple');
        handle!.unmount();

        mount({});
        expect(handle!.query('.lm-slider-label')).toBeNull();
        expect(root().hasAttribute('data-color')).toBe(false); // empty → no attribute
        expect(thumb().hasAttribute('aria-label')).toBe(false);
    });
});
