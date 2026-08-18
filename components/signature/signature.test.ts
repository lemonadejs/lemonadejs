/**
 * <Signature /> block tests — including the registry gate: verify() must pass.
 *
 * jsdom has NO canvas: getContext('2d') returns null. The 2d context is
 * therefore mocked with a recording stub and the tests assert the WIRING —
 * pointer sequences call the right context methods with the right
 * arguments, the value follows the v5 format ([x, y] points with '1'
 * stroke separators), the api surface works, and document listeners are
 * balanced after unmount.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Signature from '@lemonadejs/signature';

type Api = {
    getValue: () => unknown;
    setValue: (...args: never[]) => unknown;
    getImage: () => unknown;
    clear: () => unknown;
};

const makeCtx = () => ({
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    lineWidth: 0,
    lineCap: '',
    strokeStyle: '',
});

let ctx: ReturnType<typeof makeCtx>;
let handle: ReturnType<typeof t> | null = null;

beforeEach(() => {
    ctx = makeCtx();
    // jsdom has no canvas — the mock context stands in for CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,TEST');
});

afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
});

const canvas = () => handle!.query('canvas') as HTMLCanvasElement;
const root = () => handle!.query('.lm-signature')!;

const mouse = (type: string, x: number, y: number) => {
    const e = new MouseEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'offsetX', { value: x });
    Object.defineProperty(e, 'offsetY', { value: y });
    return e;
};

const touch = (type: string, x: number, y: number) => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
    return e;
};

/** mousedown → mousemove… → document mouseup */
const drag = (...points: [number, number][]) => {
    canvas().dispatchEvent(mouse('mousedown', points[0][0], points[0][1]));
    for (const [x, y] of points.slice(1)) {
        canvas().dispatchEvent(mouse('mousemove', x, y));
    }
    document.dispatchEvent(new MouseEvent('mouseup'));
};

describe('components/signature', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Signature);
        expect(report.pass).toBe(true);
    });

    it('renders the canvas with width/height only when provided', () => {
        handle = t(Signature, { width: 400, height: 200 });
        expect(canvas().getAttribute('width')).toBe('400');
        expect(canvas().getAttribute('height')).toBe('200');
        handle.unmount();

        handle = t(Signature);
        expect(canvas().hasAttribute('width')).toBe(false); // 0 → browser default
        expect(canvas().hasAttribute('height')).toBe(false);
    });

    it('draws a stroke: pen setup, lineTo per move, commit replay on release', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { onchange: (v: unknown) => changes.push(v) });
        ctx.clearRect.mockClear(); // initial redraw on init

        canvas().dispatchEvent(mouse('mousedown', 10, 10));
        expect(ctx.stroke).not.toHaveBeenCalled(); // v5: down only records the point

        canvas().dispatchEvent(mouse('mousemove', 20, 25));
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.lineWidth).toBe(3); // default thickness
        expect(ctx.lineCap).toBe('round');
        expect(ctx.strokeStyle).toBe('#000'); // default color
        expect(ctx.moveTo).toHaveBeenCalledWith(10, 10);
        expect(ctx.lineTo).toHaveBeenCalledWith(20, 25);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);

        document.dispatchEvent(new MouseEvent('mouseup'));
        // v5 commit: clear + replay the whole value as one path
        expect(ctx.clearRect).toHaveBeenCalledTimes(1);
        expect(ctx.moveTo).toHaveBeenLastCalledWith(10, 10);
        expect(ctx.lineTo).toHaveBeenLastCalledWith(20, 25);
        // onchange fires once per stroke with the v5 value format
        expect(changes).toEqual([[[10, 10], [20, 25], '1']]);
    });

    it('prevents default on canvas move events (v5)', () => {
        handle = t(Signature);
        const e = mouse('mousemove', 5, 5);
        canvas().dispatchEvent(e);
        expect(e.defaultPrevented).toBe(true);
    });

    it('honors line and color when stroking', () => {
        handle = t(Signature, { line: 6, color: '#dc2626' });
        drag([1, 1], [2, 2]);
        expect(ctx.lineWidth).toBe(6);
        expect(ctx.strokeStyle).toBe('#dc2626');
    });

    it('supports touch drawing relative to the canvas rect', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { onchange: (v: unknown) => changes.push(v) });

        canvas().dispatchEvent(touch('touchstart', 30, 40));
        canvas().dispatchEvent(touch('touchmove', 50, 60));
        document.dispatchEvent(new Event('touchend'));

        // jsdom rects are at 0,0 → coordinates equal clientX/clientY
        expect(ctx.moveTo).toHaveBeenCalledWith(30, 40);
        expect(ctx.lineTo).toHaveBeenCalledWith(50, 60);
        expect(changes).toEqual([[[30, 40], [50, 60], '1']]);
    });

    it('bind is two-way: strokes flow out, external writes redraw silently', () => {
        const data = store<unknown[]>([]);
        const changes: unknown[] = [];
        handle = t(Signature, { bind: data, onchange: (v: unknown) => changes.push(v) });

        drag([10, 10], [20, 25]);
        expect(data.value).toEqual([[10, 10], [20, 25], '1']);
        expect(changes.length).toBe(1);

        ctx.clearRect.mockClear();
        ctx.moveTo.mockClear();
        ctx.lineTo.mockClear();
        data.value = [[1, 1], [5, 5], '1']; // external write
        expect(ctx.clearRect).toHaveBeenCalledTimes(1); // replayed...
        expect(ctx.moveTo).toHaveBeenCalledWith(1, 1);
        expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
        expect(changes.length).toBe(1); // ...without an onchange echo
    });

    it('loads an existing value on mount, multi-stroke replay included', () => {
        handle = t(Signature, { value: [[1, 2], [3, 4], '1', [9, 9], '1'] });
        expect(ctx.clearRect).toHaveBeenCalledTimes(1);
        expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 1, 2);
        expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
        // second stroke: jump + zero-length segment — a click is a dot (v5)
        expect(ctx.moveTo).toHaveBeenNthCalledWith(2, 9, 9);
        expect(ctx.lineTo).toHaveBeenLastCalledWith(9, 9);
    });

    it('disabled blocks drawing and styles the block', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { disabled: true, onchange: (v: unknown) => changes.push(v) });
        expect(root().className).toContain('lm-signature-disabled');

        ctx.clearRect.mockClear();
        drag([10, 10], [20, 25]);
        expect(ctx.beginPath).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
        expect(ctx.clearRect).not.toHaveBeenCalled();
        expect(changes).toEqual([]);
    });

    it('exposes getValue/setValue/getImage/clear through the api', () => {
        let api: Api | null = null;
        const changes: unknown[] = [];
        handle = t(Signature, {
            ref: (a: Api) => (api = a),
            onchange: (v: unknown) => changes.push(v),
        });

        (api!.setValue as (v: unknown) => void)([[1, 2], [3, 4], '1']);
        expect(api!.getValue()).toEqual([[1, 2], [3, 4], '1']);
        expect(ctx.moveTo).toHaveBeenCalledWith(1, 2); // setValue redraws (v5 commit)
        expect(changes.length).toBe(1); // ...and fires onchange (v5)

        api!.clear();
        expect(api!.getValue()).toEqual([]);
        expect(changes.length).toBe(2);

        expect(api!.getImage()).toBe('data:image/png;base64,TEST');
        expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalled();
    });

    it('fires onload once the canvas is ready (v5)', () => {
        const loads: unknown[] = [];
        handle = t(Signature, { onload: (a: unknown) => loads.push(a) });
        expect(loads.length).toBe(1);
        expect(typeof (loads[0] as Api).getValue).toBe('function');
    });

    it('renders the instructions only when provided', () => {
        handle = t(Signature, { instructions: 'Sign here' });
        expect(handle.query('.lm-signature-instructions')!.textContent).toBe('Sign here');
        handle.unmount();

        handle = t(Signature);
        expect(handle.query('.lm-signature-instructions')).toBeNull();
    });

    it('participates in forms: hidden input mirrors the value as JSON', () => {
        handle = t(Signature, { name: 'sig' });
        const input = handle.query('.lm-signature-input') as HTMLInputElement;
        expect(input.getAttribute('name')).toBe('sig');
        expect(input.value).toBe('[]');

        drag([10, 10], [20, 25]);
        expect(input.value).toBe(JSON.stringify([[10, 10], [20, 25], '1']));
        handle.unmount();

        handle = t(Signature);
        expect(handle.query('.lm-signature-input')).toBeNull(); // no name → no input
    });

    it('balances document listeners: pointer-up release and unmount release', () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const count = (spy: typeof added, type: string) =>
            spy.mock.calls.filter((c) => c[0] === type).length;

        // Completed stroke: released on pointer-up
        handle = t(Signature);
        drag([1, 1], [2, 2]);

        // Stroke left in flight: released on unmount
        canvas().dispatchEvent(mouse('mousedown', 3, 3));
        expect(count(added, 'mouseup')).toBeGreaterThan(count(removed, 'mouseup'));
        handle.unmount();
        handle = null;

        expect(count(added, 'mouseup')).toBe(count(removed, 'mouseup'));
        expect(count(added, 'touchend')).toBe(count(removed, 'touchend'));
    });

    it('degrades to a no-op without a 2d context (jsdom reality)', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
        const changes: unknown[] = [];
        let api: Api | null = null;
        handle = t(Signature, {
            onchange: (v: unknown) => changes.push(v),
            ref: (a: Api) => (api = a),
        });

        drag([10, 10], [20, 25]); // must not throw
        expect(changes).toEqual([]);
        expect(api!.getValue()).toEqual([]);
    });

    it('consecutive strokes accumulate in the v5 wire format', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { onchange: (v: unknown) => changes.push(v) });
        drag([1, 1], [2, 2]);
        drag([3, 3], [4, 4]);
        expect(changes).toEqual([
            [[1, 1], [2, 2], '1'],
            [[1, 1], [2, 2], '1', [3, 3], [4, 4], '1'],
        ]);
    });

    it('a click-only stroke commits a single point + separator', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { onchange: (v: unknown) => changes.push(v) });
        canvas().dispatchEvent(mouse('mousedown', 5, 5));
        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(changes).toEqual([[[5, 5], '1']]);
    });

    it('setValue coerces a non-array to the empty value', () => {
        let api: Api | null = null;
        handle = t(Signature, { ref: (a: Api) => (api = a) });
        (api!.setValue as (v: unknown) => void)([[1, 1], '1']);
        (api!.setValue as (v: unknown) => void)('garbage');
        expect(api!.getValue()).toEqual([]);
        (api!.setValue as (v: unknown) => void)(null);
        expect(api!.getValue()).toEqual([]);
    });

    it('disabled is LIVE: toggling through a store blocks and unblocks drawing', () => {
        const disabled = store(false);
        const changes: unknown[] = [];
        handle = t(Signature, { disabled, onchange: (v: unknown) => changes.push(v) });

        drag([1, 1], [2, 2]);
        expect(changes.length).toBe(1);
        expect(root().className).not.toContain('lm-signature-disabled');

        disabled.value = true;
        expect(root().className).toContain('lm-signature-disabled');
        drag([3, 3], [4, 4]);
        expect(changes.length).toBe(1); // blocked

        disabled.value = false;
        drag([5, 5], [6, 6]);
        expect(changes.length).toBe(2); // unblocked again
    });

    it('line and color are LIVE: the next stroke picks up store writes', () => {
        const line = store(2);
        const color = store('#111111');
        handle = t(Signature, { line, color });

        drag([1, 1], [2, 2]);
        expect(ctx.lineWidth).toBe(2);
        expect(ctx.strokeStyle).toBe('#111111');

        line.value = 8;
        color.value = '#dc2626';
        drag([3, 3], [4, 4]);
        expect(ctx.lineWidth).toBe(8);
        expect(ctx.strokeStyle).toBe('#dc2626');
    });

    it('a second mousedown mid-stroke (lost mouseup) commits the first stroke', () => {
        const changes: unknown[] = [];
        handle = t(Signature, { onchange: (v: unknown) => changes.push(v) });
        canvas().dispatchEvent(mouse('mousedown', 1, 1));
        canvas().dispatchEvent(mouse('mousemove', 2, 2));
        canvas().dispatchEvent(mouse('mousedown', 7, 7)); // re-arm releases + commits
        expect(changes).toEqual([[[1, 1], [2, 2], '1']]);
        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(changes.length).toBe(2); // the second stroke commits normally
    });

    it('clearlabel renders a real, keyboard-operable clear button (WCAG 2.1.1)', () => {
        const changes: unknown[] = [];
        handle = t(Signature, {
            value: [[1, 1], [2, 2], '1'],
            clearlabel: 'Clear signature',
            onchange: (v: unknown) => changes.push(v),
        });

        const button = handle.query('.lm-signature-clear') as HTMLButtonElement;
        expect(button.tagName).toBe('BUTTON'); // native button: focusable, Enter/Space fire click
        expect(button.getAttribute('type')).toBe('button'); // never submits a host form
        expect(button.textContent).toBe('Clear signature'); // accessible name

        button.click(); // pointer-free activation
        expect(changes).toEqual([[]]);
        handle.unmount();

        handle = t(Signature);
        expect(handle.query('.lm-signature-clear')).toBeNull(); // opt-in: no label, no button
    });

    it('disabled is LIVE on the clear button too', () => {
        const disabled = store(false);
        handle = t(Signature, { clearlabel: 'Clear', disabled });
        const button = handle.query('.lm-signature-clear') as HTMLButtonElement;
        expect(button.disabled).toBe(false);

        disabled.value = true;
        expect(button.disabled).toBe(true);

        disabled.value = false;
        expect(button.disabled).toBe(false);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Signature} width="400" height="120" line="5" disabled="true" /></main>`;
        handle = t(App);
        expect(canvas().getAttribute('width')).toBe('400');
        expect(root().className).toContain('lm-signature-disabled');

        drag([1, 1], [2, 2]); // disabled: coerced boolean blocks drawing
        expect(ctx.stroke).not.toHaveBeenCalled();
    });
});
