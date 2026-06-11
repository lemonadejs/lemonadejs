/**
 * <Cropper /> block tests — including the registry gate: verify() must pass.
 *
 * jsdom has NO canvas: getContext('2d') returns null. The 2d contexts are
 * therefore mocked with recording stubs (one per canvas: main, filter,
 * export) and the tests assert the WIRING — load/pan/zoom/rotate call the
 * right context methods with the right arguments, the crop box follows the
 * v5 move/resize/clamp rules, save() commits the v5 value shape — never
 * pixels. jsdom also never decodes images: load events are fired manually
 * on the element exposed by api.getImage(), with naturalWidth/Height
 * defined up front.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Cropper, { type CropData } from '@lemonadejs/cropper';

type Api = {
    getValue: () => unknown;
    setValue: (v: unknown) => unknown;
    getImage: () => HTMLImageElement;
    zoom: (v: number) => unknown;
    rotate: (v: number) => unknown;
    brightness: (v: number) => unknown;
    contrast: (v: number) => unknown;
    save: () => CropData | null;
    reset: () => unknown;
    upload: () => unknown;
};

const makeCtx = () => ({
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
});

type Ctx = ReturnType<typeof makeCtx>;

let ctxs: Ctx[] = [];
let handle: ReturnType<typeof t> | null = null;

beforeEach(() => {
    ctxs = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
        const c = makeCtx();
        ctxs.push(c);
        return c as never;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,TEST');
});

afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// Context creation order: main canvas first (template ref), filter second
const main = () => ctxs[0];
const filter = () => ctxs[1];

const root = () => handle!.query('.lm-cropper')!;
const editor = () => handle!.query('.lm-cropper-editor')!;
const boxEl = () => handle!.query('.lm-cropper-box')!;
const canvasEl = () => handle!.query('canvas')!;
const ranges = () => handle!.queryAll('.lm-cropper-range input') as HTMLInputElement[];

const mouse = (type: string, x: number, y: number, extra: MouseEventInit = {}) =>
    new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, ...extra });

/** Fire the image load the way a browser would after decoding */
const loadImage = (api: Api, nw: number, nh: number) => {
    const img = api.getImage();
    Object.defineProperty(img, 'naturalWidth', { value: nw, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: nh, configurable: true });
    img.dispatchEvent(new Event('load'));
};

const mount = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Cropper, { ref: (a: Api) => (api = a), ...props });
    return api!;
};

describe('components/cropper', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Cropper as never);
        expect(report.pass).toBe(true);
    });

    it('renders the area, canvas and centered crop box from the size props', () => {
        mount();
        expect(editor().getAttribute('style')).toContain('width:800px;height:360px');
        expect(canvasEl().getAttribute('width')).toBe('800');
        expect(canvasEl().getAttribute('height')).toBe('360');
        // v5 resetCropSelection: centered, the configured crop size
        expect(boxEl().style.left).toBe('250px');
        expect(boxEl().style.top).toBe('60px');
        expect(boxEl().style.width).toBe('300px');
        expect(boxEl().style.height).toBe('240px');
        // No image yet: not in edition mode, controls disabled
        expect(root().className).not.toContain('lm-cropper-edition');
        expect(ranges().length).toBe(4);
        expect(ranges().every((r) => r.disabled)).toBe(true);
    });

    it('opens the file picker: click when empty, double click, api.upload()', () => {
        const clicks = vi
            .spyOn(HTMLInputElement.prototype, 'click')
            .mockImplementation(() => {});
        const api = mount();

        editor().dispatchEvent(mouse('click', 10, 10));
        expect(clicks).toHaveBeenCalledTimes(1);

        editor().dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(clicks).toHaveBeenCalledTimes(2);

        api.upload();
        expect(clicks).toHaveBeenCalledTimes(3);

        // With an image loaded, single click no longer opens the picker
        loadImage(api, 1600, 1440);
        editor().dispatchEvent(mouse('click', 10, 10));
        expect(clicks).toHaveBeenCalledTimes(3);
    });

    it('loads an image: fit to area, center, edition mode, onload, controls on', () => {
        const loads: unknown[] = [];
        const api = mount({ onload: (i: unknown) => loads.push(i) });

        loadImage(api, 1600, 1440); // p = min(800/1600, 360/1440) = 0.25
        expect(api.getImage().width).toBe(400);
        expect(api.getImage().height).toBe(360);
        expect(main().translate).toHaveBeenCalledWith(200, 0); // centered
        expect(main().drawImage).toHaveBeenLastCalledWith(api.getImage(), 0, 0, 400, 360);
        expect(root().className).toContain('lm-cropper-edition');
        expect(ranges().every((r) => !r.disabled)).toBe(true);
        expect(loads).toEqual([api.getImage()]);
    });

    it('src is live: writes load a new image into the editor', () => {
        const src = store('');
        const api = mount({ src });
        expect(api.getImage().getAttribute('src')).toBeNull();

        src.value = 'photo.png';
        expect(api.getImage().src).toContain('photo.png');
    });

    it('pans the image by drag, delta divided by the zoom, released on mouseup', () => {
        const api = mount();
        loadImage(api, 1600, 1440); // left 200, top 0
        canvasEl().dispatchEvent(mouse('mousedown', 100, 100));
        document.dispatchEvent(mouse('mousemove', 120, 110));
        expect(main().translate).toHaveBeenLastCalledWith(220, 10);

        document.dispatchEvent(new MouseEvent('mouseup'));
        const calls = main().translate.mock.calls.length;
        document.dispatchEvent(mouse('mousemove', 500, 500)); // released: inert
        expect(main().translate.mock.calls.length).toBe(calls);

        // Zoomed pans move by delta / scale (v5)
        api.zoom(2);
        canvasEl().dispatchEvent(mouse('mousedown', 100, 100));
        document.dispatchEvent(mouse('mousemove', 120, 110));
        // left 220+20/2=230 → zoom offset (0−230)−(0−230)×2 = 230 → 460;
        // top 10+10/2=15 → offset 15 → 30
        expect(main().translate).toHaveBeenLastCalledWith(460, 30);
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('zooms on wheel: ×1.1/×0.9 clamped, range synced, default prevented', () => {
        const api = mount();

        // No image: the wheel scrolls the page normally
        const idle = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
        editor().dispatchEvent(idle);
        expect(idle.defaultPrevented).toBe(false);

        loadImage(api, 1600, 1440);
        const e = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
        editor().dispatchEvent(e);
        expect(e.defaultPrevented).toBe(true);
        expect(main().scale).toHaveBeenLastCalledWith(1.1, 1.1);
        expect(ranges()[0].value).toBe('1.1'); // zoom range follows

        editor().dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        expect(ranges()[0].value).toBe('0.99');
    });

    it('moves the crop box by drag, clamped to the area (v5 rules)', () => {
        mount(); // resizable false (v5 wrapper): always a move
        boxEl().dispatchEvent(mouse('mousedown', 400, 180));
        document.dispatchEvent(mouse('mousemove', 420, 200));
        expect(boxEl().style.left).toBe('270px');
        expect(boxEl().style.top).toBe('80px');

        document.dispatchEvent(mouse('mousemove', 5000, 5000));
        expect(boxEl().style.left).toBe('498px'); // 800 - 300 - 2
        expect(boxEl().style.top).toBe('118px'); // 360 - 240 - 2

        document.dispatchEvent(new MouseEvent('mouseup'));
        document.dispatchEvent(mouse('mousemove', 0, 0));
        expect(boxEl().style.left).toBe('498px'); // released
    });

    it('resizes from the east edge when resizable, crop size as the minimum', () => {
        mount({ resizable: true });
        // Box: left 250, top 60, 300×240 — jsdom rects sit at 0,0
        boxEl().dispatchEvent(mouse('mousedown', 548, 180)); // rx 298 → e
        document.dispatchEvent(mouse('mousemove', 608, 180));
        expect(boxEl().style.width).toBe('360px');
        document.dispatchEvent(new MouseEvent('mouseup'));

        boxEl().dispatchEvent(mouse('mousedown', 548 + 60, 180));
        document.dispatchEvent(mouse('mousemove', 100, 180)); // way below minimum
        expect(boxEl().style.width).toBe('300px'); // clamped to cropwidth
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('resizes from a corner: nw drags left/top and grows both sides', () => {
        mount({ resizable: true });
        boxEl().dispatchEvent(mouse('mousedown', 252, 62)); // rx 2, ry 2 → nw
        document.dispatchEvent(mouse('mousemove', 222, 42));
        expect(boxEl().style.left).toBe('220px');
        expect(boxEl().style.width).toBe('330px');
        expect(boxEl().style.top).toBe('40px');
        expect(boxEl().style.height).toBe('260px');
        document.dispatchEvent(new MouseEvent('mouseup'));
    });

    it('gives live cursor feedback over the box edges (v5 5px zones)', () => {
        mount({ resizable: true });
        boxEl().dispatchEvent(mouse('mousemove', 548, 180));
        expect(boxEl().style.cursor).toBe('e-resize');
        boxEl().dispatchEvent(mouse('mousemove', 400, 180));
        expect(boxEl().style.cursor).toBe('move');
        boxEl().dispatchEvent(mouse('mousemove', 252, 62));
        expect(boxEl().style.cursor).toBe('nw-resize');
        handle!.unmount();
        handle = null;

        mount(); // not resizable: always the move cursor (v5)
        boxEl().dispatchEvent(mouse('mousemove', 548, 180));
        expect(boxEl().style.cursor).toBe('move');
    });

    it('drives the engine from the range controls (native bind)', () => {
        const api = mount();
        loadImage(api, 1600, 1440);

        const zoom = ranges()[0];
        zoom.value = '2';
        zoom.dispatchEvent(new Event('input', { bubbles: true }));
        expect(main().scale).toHaveBeenLastCalledWith(2, 2);

        const rotate = ranges()[1];
        rotate.value = '0.5';
        rotate.dispatchEvent(new Event('input', { bubbles: true }));
        expect(main().rotate).toHaveBeenCalled();
    });

    it('rotates around the image center: [-1..1] → ±180° (v5 model)', () => {
        const api = mount();
        loadImage(api, 1600, 1440); // fitted 400×360
        api.rotate(0.5);
        expect(main().translate).toHaveBeenCalledWith(200, 180);
        const angles = main().rotate.mock.calls;
        expect(angles[angles.length - 1][0]).toBeCloseTo(Math.PI / 2, 5);
        expect(main().translate).toHaveBeenLastCalledWith(-200, -180);
    });

    it('brightness runs the v5 pixel pipeline on the filter canvas', () => {
        const api = mount();
        loadImage(api, 1600, 1440);
        api.brightness(0.5);
        expect(filter().drawImage).toHaveBeenCalledWith(api.getImage(), 0, 0, 400, 360);
        const puts = filter().putImageData.mock.calls;
        const written = puts[puts.length - 1][0] as ImageData;
        expect(written.data[0]).toBe(128); // 0 + 0.5×255, clamped-rounded
        // The repaint now draws the FILTERED image, not the source
        const draws = main().drawImage.mock.calls;
        expect(draws[draws.length - 1][0]).not.toBe(api.getImage());
    });

    it('contrast runs the v5 factor curve on the filter canvas', () => {
        const api = mount();
        loadImage(api, 1600, 1440);
        api.contrast(0.5);
        const puts = filter().putImageData.mock.calls;
        const written = puts[puts.length - 1][0] as ImageData;
        expect(written.data[0]).toBe(0); // 3×(0−128)+128 = −256, clamped
        const draws = main().drawImage.mock.calls;
        expect(draws[draws.length - 1][0]).not.toBe(api.getImage());
    });

    it('save() exports the box pixels and commits the v5 value shape', () => {
        const photo = store<unknown>(null);
        const changes: unknown[] = [];
        const api = mount({
            bind: photo,
            src: 'data:image/png;base64,AAA',
            onchange: (v: unknown) => changes.push(v),
        });
        expect(api.save()).toBeNull(); // no image yet (v5 edition gate)

        loadImage(api, 1600, 1440);
        const data = api.save()!;
        // Pixels read from the canvas at the crop box coordinates
        expect(main().getImageData).toHaveBeenCalledWith(250, 60, 300, 240);
        expect(ctxs[2].putImageData).toHaveBeenCalled(); // export canvas
        expect(data).toEqual({
            file: 'data:image/png;base64,TEST',
            content: 'data:image/png;base64,TEST',
            extension: 'png', // parsed from the source data URL (v5)
        });
        expect(photo.value).toBe(data); // committed to the bound state
        expect(changes).toEqual([data]); // onchange fired once
    });

    it('original includes the source image in the saved data (v5)', () => {
        const api = mount({ original: true, src: 'data:image/png;base64,AAA' });
        loadImage(api, 1600, 1440);
        expect(api.save()!.original).toBe('data:image/png;base64,AAA');

        handle!.unmount();
        handle = null;
        const api2 = mount({ src: 'photo.png' });
        loadImage(api2, 1600, 1440);
        expect(api2.save()!.extension).toBeNull(); // not a data URL
        expect(api2.save()!.original).toBeUndefined();
    });

    it('delete leaves edition mode, resets everything and commits null', () => {
        const photo = store<unknown>(null);
        const changes: unknown[] = [];
        const api = mount({ bind: photo, onchange: (v: unknown) => changes.push(v) });
        loadImage(api, 1600, 1440);
        api.zoom(2);
        api.save();

        (handle!.query('.lm-cropper-delete') as HTMLButtonElement).click();
        expect(root().className).not.toContain('lm-cropper-edition');
        expect(ranges().every((r) => r.disabled)).toBe(true);
        expect(ranges()[0].value).toBe('1'); // zoom range back to neutral
        expect(photo.value).toBeNull();
        expect(changes[changes.length - 1]).toBeNull();
        expect(api.save()).toBeNull(); // edition gate is back
    });

    it('setValue/getValue: v5 normalization, loads the image, commits', () => {
        const changes: unknown[] = [];
        const api = mount({ onchange: (v: unknown) => changes.push(v) });

        api.setValue('photo.png'); // string → { file } (v5)
        expect(api.getValue()).toEqual({ file: 'photo.png', content: '', extension: null });
        expect(api.getImage().src).toContain('photo.png');
        expect(changes.length).toBe(1);

        api.setValue({ file: 'b.png', content: '', extension: null, original: 'a.png' });
        expect(api.getImage().src).toContain('a.png'); // original wins (v5)

        api.setValue(null); // v5: falsy resets
        expect(api.getValue()).toBeNull();
        expect(root().className).not.toContain('lm-cropper-edition');
    });

    it('loads picked files through FileReader, rejecting non-images (v5)', () => {
        const alerted = vi.spyOn(window, 'alert').mockImplementation(() => {});
        vi.stubGlobal(
            'FileReader',
            class {
                cb: ((e: unknown) => void) | null = null;
                addEventListener(type: string, cb: (e: unknown) => void) {
                    if (type === 'load') {
                        this.cb = cb;
                    }
                }
                readAsDataURL(file: File) {
                    this.cb?.({ target: { result: 'data:image/png;base64,' + file.name } });
                }
            }
        );
        const api = mount();
        const input = handle!.query('.lm-cropper-file') as HTMLInputElement;

        Object.defineProperty(input, 'files', {
            value: [new File(['x'], 'PIC', { type: 'image/png' })],
            configurable: true,
        });
        input.dispatchEvent(new Event('change', { bubbles: true }));
        expect(api.getImage().src).toBe('data:image/png;base64,PIC');
        expect(alerted).not.toHaveBeenCalled();

        Object.defineProperty(input, 'files', {
            value: [new File(['x'], 'DOC', { type: 'text/plain' })],
            configurable: true,
        });
        input.dispatchEvent(new Event('change', { bubbles: true }));
        expect(api.getImage().src).toBe('data:image/png;base64,PIC'); // unchanged
        expect(alerted).toHaveBeenCalledWith('The extension is not allowed');
    });

    it('accepts drag-and-drop files with visual feedback', () => {
        vi.stubGlobal(
            'FileReader',
            class {
                cb: ((e: unknown) => void) | null = null;
                addEventListener(type: string, cb: (e: unknown) => void) {
                    if (type === 'load') {
                        this.cb = cb;
                    }
                }
                readAsDataURL() {
                    this.cb?.({ target: { result: 'data:image/png;base64,DROPPED' } });
                }
            }
        );
        const api = mount();

        const over = new Event('dragover', { bubbles: true, cancelable: true });
        editor().dispatchEvent(over);
        expect(over.defaultPrevented).toBe(true);
        expect(root().className).toContain('lm-cropper-dragging');

        editor().dispatchEvent(new Event('dragleave', { bubbles: true }));
        expect(root().className).not.toContain('lm-cropper-dragging');

        editor().dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
        const drop = new Event('drop', { bubbles: true, cancelable: true });
        Object.defineProperty(drop, 'dataTransfer', {
            value: { files: [new File(['x'], 'd.png', { type: 'image/png' })] },
        });
        editor().dispatchEvent(drop);
        expect(drop.defaultPrevented).toBe(true);
        expect(root().className).not.toContain('lm-cropper-dragging');
        expect(api.getImage().src).toBe('data:image/png;base64,DROPPED');
    });

    it('balances document listeners: pointer-up release and unmount release', () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const count = (spy: typeof added, type: string) =>
            spy.mock.calls.filter((c) => c[0] === type).length;

        const api = mount();
        loadImage(api, 1600, 1440);

        // Completed interactions: released on pointer-up
        boxEl().dispatchEvent(mouse('mousedown', 400, 180));
        document.dispatchEvent(new MouseEvent('mouseup'));
        canvasEl().dispatchEvent(mouse('mousedown', 100, 100));
        document.dispatchEvent(new MouseEvent('mouseup'));

        // Interaction left in flight: released on unmount
        canvasEl().dispatchEvent(mouse('mousedown', 3, 3));
        expect(count(added, 'mousemove')).toBeGreaterThan(count(removed, 'mousemove'));
        handle!.unmount();
        handle = null;

        expect(count(added, 'mousemove')).toBe(count(removed, 'mousemove'));
        expect(count(added, 'mouseup')).toBe(count(removed, 'mouseup'));
    });

    it('degrades to a no-op without a 2d context (jsdom reality)', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null as never);
        const api = mount({ src: 'data:image/png;base64,AAA' });

        loadImage(api, 1600, 1440); // must not throw
        expect(root().className).toContain('lm-cropper-edition');
        canvasEl().dispatchEvent(mouse('mousedown', 100, 100));
        document.dispatchEvent(mouse('mousemove', 120, 110));
        document.dispatchEvent(new MouseEvent('mouseup'));
        editor().dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));

        const data = api.save()!; // still commits, with empty pixel output
        expect(data.content).toBe('');
        expect(data.extension).toBe('png');
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Cropper} width="500" height="300" cropwidth="100"
                cropheight="80" controls="false" resizable="true" /></main>`;
        handle = t(App);
        expect(editor().getAttribute('style')).toContain('width:500px;height:300px');
        expect(handle.query('.lm-cropper-controls')).toBeNull();
        expect(boxEl().style.left).toBe('200px'); // (500-100)/2
        expect(boxEl().style.width).toBe('100px');

        // resizable coerced: edge hit returns a resize cursor
        boxEl().dispatchEvent(mouse('mousemove', 298, 150)); // rx 98 > 95
        expect(boxEl().style.cursor).toBe('e-resize');
    });
});
