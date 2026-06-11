/**
 * <Cropper /> — image crop editor, ported from the v5 plugin
 *
 * The v5 plugin was a thumbnail + modal + contextmenu shell around the
 * @jsuites/cropper engine. v6 keeps blocks orthogonal: THIS block is the
 * editor itself (compose it with @lemonadejs/modal for the v5 dialog UX);
 * the engine behaviors are ported faithfully from the source:
 *
 *   - load an image: file picker (click when empty, double click, the
 *     Upload button, api.upload()), drag-and-drop, the src prop (live),
 *     api.setValue() — scaled to fit the area and centered
 *   - drag the IMAGE to pan (mouse or touch, delta divided by the zoom)
 *   - wheel zoom (×0.9 / ×1.1 clamped to [0.1, 5], anchored at the cursor
 *     when it sits on a painted pixel — the v5 zoom-origin math verbatim),
 *     pinch zoom on touch, plus zoom/rotate/brightness/contrast levels
 *     (rotate is the v5 [-1..1] → ±180° model; the filters run the v5
 *     per-pixel pipelines on an offscreen canvas)
 *   - a crop BOX: drag to move (clamped to the area), resize from the
 *     8 edges/corners with live cursor feedback when resizable (5px hit
 *     zones, the configured crop size is the minimum — v5 rules)
 *   - export: save() reads the box pixels off the canvas into a dataURL
 *     and commits { file, content, extension(, original) } — the v5 value
 *     shape — to the bound state, firing onchange
 *
 * v5 → v6 mapping: value → bind (commits on save/delete/setValue, exactly
 * like v5's Save/Delete buttons); options.area → width/height; the v5
 * wrapper width/height (the crop size) → cropwidth/cropheight;
 * allowResize → resizable; the modal's range controls + Save/Upload/Delete
 * buttons → the built-in controls bar (controls, default true);
 * original kept. Dropped: the thumbnail/modal/contextmenu shell, remote
 * URL parsing (remoteParser) and the HTML-drop path.
 *
 * jsdom has no canvas: a null 2d context downgrades drawing to a no-op.
 */

import { component, css, html } from 'lemonadejs';

export type CropData = {
    file: string;
    content: string;
    extension: string | null;
    original?: string;
};

type Box = { left: number; top: number; w: number; h: number };

export const Cropper = component('cropper', {
    bind: Object,                 // committed crop data (v5: value)
    src: '',                      // image source — initial and live
    width: 800,                   // editor area width (v5 desktop area)
    height: 360,                  // editor area height
    cropwidth: 300,               // crop box width = minimum size (v5: width)
    cropheight: 240,              // crop box height = minimum size (v5: height)
    resizable: false,             // crop box edge resize (v5: allowResize)
    controls: true,               // built-in ranges + save/upload/delete bar
    original: false,              // include the source image in saved data (v5)
    onchange: Function,           // fires when crop data commits (save/delete/setValue)
    onload: Function,             // fires when an image lands in the editor
    api: {
        getValue: Function, setValue: Function, getImage: Function,
        zoom: Function, rotate: Function, brightness: Function, contrast: Function,
        save: Function, reset: Function, upload: Function,
    },
}, (props, { bind, state, listen, onMount, onUnmount }) => {
    const photo = bind(props as unknown as { bind?: CropData | null }, null as CropData | null);

    const num = (key: 'width' | 'height' | 'cropwidth' | 'cropheight') =>
        props[key]!.value as number;

    const hasImage = state(false);
    const dragging = state(false);
    const box = state<Box>({
        left: (num('width') - num('cropwidth')) / 2,
        top: (num('height') - num('cropheight')) / 2,
        w: num('cropwidth'),
        h: num('cropheight'),
    });

    // Range-control levels — the single write path into the engine
    const zoomLevel = state(1);
    const rotateLevel = state(0);
    const brightLevel = state(0);
    const contrastLevel = state(0);

    // ---- engine state (v5 properties + image metrics, non-reactive)
    const view = {
        scale: 1,
        rotate: 0,
        brightness: 0,
        contrast: 0,
        // image placement and fitted size
        left: 0,
        top: 0,
        w: 0,
        h: 0,
        // v5 zoom-origin bookkeeping
        originX: 0,
        originY: 0,
        offsetX: 0,
        offsetY: 0,
        lastX: null as number | null,
        lastY: null as number | null,
        lastScale: 1,
    };

    let editor: HTMLElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let filterCanvas: HTMLCanvasElement | null = null;
    let filterCtx: CanvasRenderingContext2D | null = null;
    let fileInput: HTMLInputElement | null = null;

    const image = document.createElement('img');
    const filtered = document.createElement('img');
    filtered.addEventListener('load', () => {
        if (view.brightness || view.contrast) {
            redraw();
        }
    });

    /** v5 refreshResizers + runMove/runZoom/runRotate: one full repaint */
    const redraw = () => {
        if (!ctx || !canvas) {
            return;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // v5 runMove: keep the zoom anchored at the wheel origin
        if (view.lastX && view.lastX !== view.originX) {
            let t = Math.abs(view.originX - view.offsetX - view.left);
            t /= view.lastScale;
            t -= view.originX - view.left;
            view.left -= t;
        }
        if (view.lastY && view.lastY !== view.originY) {
            let t = Math.abs(view.originY - view.offsetY - view.top);
            t /= view.lastScale;
            t -= view.originY - view.top;
            view.top -= t;
        }
        view.offsetX = (view.originX - view.left) - (view.originX - view.left) * view.scale;
        view.offsetY = (view.originY - view.top) - (view.originY - view.top) * view.scale;
        view.lastX = view.originX;
        view.lastY = view.originY;
        view.lastScale = view.scale;
        ctx.translate(view.left + view.offsetX, view.top + view.offsetY);
        if (view.scale !== 1) {
            ctx.scale(view.scale, view.scale);
        }
        if (view.rotate) {
            // v5: [-1..1] → ±180°, around the image center
            ctx.translate(view.w / 2, view.h / 2);
            ctx.rotate(view.rotate * 180 * (Math.PI / 180));
            ctx.translate(-view.w / 2, -view.h / 2);
        }
        const source = view.brightness || view.contrast ? filtered : image;
        ctx.drawImage(source, 0, 0, view.w, view.h);
    };

    /** v5 runBrightness: shift every channel by level × 255 */
    const runBrightness = () => {
        const data = filterCtx!.getImageData(0, 0, view.w, view.h);
        const level = view.brightness * 255;
        for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] += level;
            data.data[i + 1] += level;
            data.data[i + 2] += level;
        }
        filterCtx!.putImageData(data, 0, 0);
    };

    /** v5 runContrast: factor curve around the 128 midpoint */
    const runContrast = () => {
        const data = filterCtx!.getImageData(0, 0, view.w, view.h);
        const level = view.contrast * 255;
        const factor = (level + 255) / (255.01 - level);
        for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] = factor * (data.data[i] - 128) + 128;
            data.data[i + 1] = factor * (data.data[i + 1] - 128) + 128;
            data.data[i + 2] = factor * (data.data[i + 2] - 128) + 128;
        }
        filterCtx!.putImageData(data, 0, 0);
    };

    /** v5 refreshFilters: rebuild the filtered copy on an offscreen canvas */
    const refreshFilters = () => {
        if (!filterCtx || !filterCanvas || !ctx) {
            return;
        }
        filterCanvas.width = view.w;
        filterCanvas.height = view.h;
        filterCtx.clearRect(0, 0, filterCanvas.width, filterCanvas.height);
        filterCtx.drawImage(image, 0, 0, view.w, view.h);
        if (view.contrast) {
            runContrast();
        }
        if (view.brightness) {
            runBrightness();
        }
        filtered.width = view.w;
        filtered.height = view.h;
        filtered.src = filterCanvas.toDataURL();
    };

    const resetView = () => {
        view.scale = 1;
        view.rotate = 0;
        view.brightness = 0;
        view.contrast = 0;
        view.originX = 0;
        view.originY = 0;
        view.offsetX = 0;
        view.offsetY = 0;
        view.lastX = null;
        view.lastY = null;
        view.lastScale = 1;
        zoomLevel.value = 1;
        rotateLevel.value = 0;
        brightLevel.value = 0;
        contrastLevel.value = 0;
    };

    /** v5 resetCropSelection: the configured crop size, centered */
    const resetBox = () => {
        box.value = {
            left: (num('width') - num('cropwidth')) / 2,
            top: (num('height') - num('cropheight')) / 2,
            w: num('cropwidth'),
            h: num('cropheight'),
        };
    };

    /** v5 image.onload: fit to the area, center, enter edition mode */
    const onImageLoad = () => {
        resetView();
        if (ctx && canvas) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const aw = num('width');
        const ah = num('height');
        const nw = image.naturalWidth || aw;
        const nh = image.naturalHeight || ah;
        const p = Math.min(aw / nw, ah / nh);
        view.w = nw * p;
        view.h = nh * p;
        image.width = view.w;
        image.height = view.h;
        view.left = aw > view.w ? (aw - view.w) / 2 : 0;
        view.top = ah > view.h ? (ah - view.h) / 2 : 0;
        hasImage.value = true;
        resetBox();
        refreshFilters();
        redraw();
        props.onload?.(image);
    };
    image.addEventListener('load', onImageLoad);

    // ---- level subscriptions: ranges, api and gestures all land here
    onMount(() => zoomLevel.subscribe((v) => {
        if (typeof v === 'number' && v !== view.scale) {
            view.scale = v;
            redraw();
        }
    }));
    onMount(() => rotateLevel.subscribe((v) => {
        if (typeof v === 'number' && v !== view.rotate) {
            view.rotate = v;
            redraw();
        }
    }));
    onMount(() => brightLevel.subscribe((v) => {
        if (typeof v === 'number' && v !== view.brightness) {
            view.brightness = v;
            refreshFilters();
            redraw();
        }
    }));
    onMount(() => contrastLevel.subscribe((v) => {
        if (typeof v === 'number' && v !== view.contrast) {
            view.contrast = v;
            refreshFilters();
            redraw();
        }
    }));

    // src is live: any write loads a new image (initial value in init)
    onMount(() => props.src.subscribe((v) => {
        if (v) {
            image.src = v as string;
        }
    }));

    // ---- pointer interactions: one in flight, armed per gesture on listen;
    // ONE setup-time release covers a mid-drag unmount (a single cleanup
    // releasing every off keeps the engine's unmount iteration intact)
    let release: (() => void) | null = null;
    onUnmount(() => release?.());

    const track = (move: (e: MouseEvent) => void) => {
        release?.();
        const offs = [
            listen<MouseEvent>(document, 'mousemove', move),
            listen(document, 'mouseup', () => release?.()),
        ];
        release = () => {
            offs.forEach((off) => off());
            release = null;
        };
    };

    /** v5 5px hit zones on the crop box (resize only when resizable) */
    const hitBox = (e: MouseEvent): string => {
        if (!props.resizable.value) {
            return 'move';
        }
        const r = editor ? editor.getBoundingClientRect() : ({ left: 0, top: 0 } as DOMRect);
        const b = box.value;
        const rx = e.clientX - r.left - b.left;
        const ry = e.clientY - r.top - b.top;
        if (ry < 5) {
            return rx > b.w - 5 ? 'ne' : rx < 5 ? 'nw' : 'n';
        }
        if (b.h - ry < 5) {
            return rx > b.w - 5 ? 'se' : rx < 5 ? 'sw' : 's';
        }
        if (b.w - rx < 5) {
            return 'e';
        }
        if (rx < 5) {
            return 'w';
        }
        return 'move';
    };

    const onHoverBox = (e: MouseEvent) => {
        if (!e.buttons) {
            const d = hitBox(e);
            (e.target as HTMLElement).style.cursor = d === 'move' ? 'move' : d + '-resize';
        }
    };

    /** v5 editorMouseMove: move or resize the box, clamped to the area */
    const moveBox = (e: MouseEvent, start: Box & { x: number; y: number }, d: string) => {
        const aw = num('width');
        const ah = num('height');
        const minW = num('cropwidth');
        const minH = num('cropheight');
        const b = { ...box.value };
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (d === 'move') {
            b.left = Math.min(Math.max(0, start.left + dx), aw - b.w - 2);
            b.top = Math.min(Math.max(0, start.top + dy), ah - b.h - 2);
        } else {
            if (d.indexOf('e') >= 0) {
                b.w = Math.max(minW, Math.min(start.w + dx, aw - start.left - 2));
            } else if (d.indexOf('w') >= 0) {
                const right = start.left + start.w;
                let left = start.left + dx;
                let w = start.w - dx;
                if (w < minW) {
                    left = right - minW;
                    w = minW;
                }
                if (left < 0) {
                    left = 0;
                    w = right;
                }
                b.left = left;
                b.w = w;
            }
            if (d.indexOf('s') >= 0) {
                b.h = Math.max(minH, Math.min(start.h + dy, ah - start.top - 2));
            } else if (d.indexOf('n') >= 0) {
                const bottom = start.top + start.h;
                let top = start.top + dy;
                let h = start.h - dy;
                if (h < minH) {
                    top = bottom - minH;
                    h = minH;
                }
                if (top < 0) {
                    top = 0;
                    h = bottom;
                }
                b.top = top;
                b.h = h;
            }
        }
        box.value = b;
    };

    const onPress = (e: MouseEvent) => {
        const target = e.target as Element;
        if (target.classList && target.classList.contains('lm-cropper-box')) {
            const d = hitBox(e);
            const start = { ...box.value, x: e.clientX, y: e.clientY };
            track((ev) => moveBox(ev, start, d));
            e.preventDefault();
        } else if (hasImage.value) {
            // v5 image pan: delta divided by the zoom scale
            let lx = e.clientX;
            let ly = e.clientY;
            track((ev) => {
                view.left += (ev.clientX - lx) / view.scale;
                view.top += (ev.clientY - ly) / view.scale;
                lx = ev.clientX;
                ly = ev.clientY;
                redraw();
                ev.preventDefault();
            });
            e.preventDefault();
        }
    };

    /** v5 wheel: ×0.9 / ×1.1 clamped, anchored when over a painted pixel */
    const onWheel = (e: WheelEvent) => {
        if (!hasImage.value) {
            return;
        }
        let s = view.scale;
        if (e.deltaY > 0) {
            if (s > 0.1) {
                s *= 0.9;
            }
        } else {
            if (s < 5) {
                s *= 1.1;
            }
        }
        s = parseFloat(s.toFixed(2));
        if (editor && ctx) {
            const rect = editor.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            try {
                const c = ctx.getImageData(x, y, 1, 1).data;
                if (c[3] !== 0) {
                    view.originX = x;
                    view.originY = y;
                }
            } catch {
                // pixel access unavailable (tainted canvas, jsdom)
            }
        }
        view.scale = s;
        redraw();
        zoomLevel.value = s; // sync the range (the subscriber sees no delta)
        e.preventDefault();
    };

    // ---- touch: pan + pinch zoom (v5 mobile events, element-scoped)
    let touching = false;
    let scaling = false;
    let pinch = 0;
    let tx = 0;
    let ty = 0;

    const applyZoom = (v: number) => {
        view.scale = v;
        redraw();
        zoomLevel.value = v;
    };

    const onTouchStart = (e: TouchEvent) => {
        const target = e.target as Element;
        if (!(target.classList && target.classList.contains('lm-cropper-box'))) {
            touching = true;
        }
        const p = e.changedTouches && e.changedTouches[0];
        if (p) {
            tx = p.clientX;
            ty = p.clientY;
        }
        if (e.touches && e.touches.length === 2) {
            touching = false;
            scaling = true;
            const r = editor!.getBoundingClientRect();
            pinch = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            view.originX = (e.touches[0].pageX - r.left + (e.touches[1].pageX - r.left)) / 2;
            view.originY = (e.touches[0].pageY - r.top + (e.touches[1].pageY - r.top)) / 2;
        }
    };

    const onTouchMove = (e: TouchEvent) => {
        if (hasImage.value && !scaling) {
            const p = e.changedTouches && e.changedTouches[0];
            if (p) {
                const dx = p.clientX - tx;
                const dy = p.clientY - ty;
                tx = p.clientX;
                ty = p.clientY;
                if (touching) {
                    view.left += dx / view.scale;
                    view.top += dy / view.scale;
                    redraw();
                }
            }
            e.preventDefault();
        }
        if (scaling && e.touches && e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            if (dist > pinch) {
                const next = view.scale + view.scale * (dist - pinch) * 0.0025;
                if (next <= 5.09) {
                    applyZoom(next);
                }
            }
            if (dist < pinch) {
                const next = view.scale - view.scale * (pinch - dist) * 0.0025;
                if (next >= 0.1) {
                    applyZoom(next);
                }
            }
            pinch = dist;
        }
    };

    const onTouchEnd = () => {
        touching = false;
        scaling = false;
    };

    // ---- loading
    const addFromFile = (file: File) => {
        if (file.type && file.type.split('/')[0] === 'image') {
            const reader = new FileReader();
            reader.addEventListener('load', (v) => {
                image.src = String((v.target as FileReader).result);
            });
            reader.readAsDataURL(file);
        } else if (typeof alert === 'function') {
            alert('The extension is not allowed'); // v5 text
        }
    };

    const onFile = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                addFromFile(files[i]);
            }
        }
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.value = false;
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
                addFromFile(files[i]);
            }
        }
    };

    const upload = () => fileInput?.click();

    // ---- export (v5 getImageType / getCroppedContent / updatePhoto)
    const imageType = (): string | null => {
        const t = (image.src || '').substring(0, 20);
        return t.indexOf('data') >= 0 ? t.split('/')[1].split(';')[0] : null;
    };

    const croppedContent = (): string => {
        if (!ctx) {
            return '';
        }
        const b = box.value;
        const out = document.createElement('canvas');
        const octx = out.getContext('2d', { willReadFrequently: true });
        if (!octx) {
            return '';
        }
        out.width = b.w;
        out.height = b.h;
        octx.putImageData(ctx.getImageData(b.left, b.top, b.w, b.h), 0, 0);
        return out.toDataURL();
    };

    const save = (): CropData | null => {
        if (!hasImage.value) {
            return null;
        }
        const content = croppedContent();
        const data: CropData = { file: content, content, extension: imageType() };
        if (props.original.value) {
            data.original = image.src;
        }
        photo.set(data); // commits + onchange (v5 Save Photo)
        return data;
    };

    /** v5 deletePhoto + reset: leave edition mode and commit the removal */
    const reset = () => {
        resetView();
        if (ctx && canvas) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        resetBox();
        hasImage.value = false;
        if (fileInput) {
            fileInput.value = '';
        }
        photo.set(null);
    };

    const getValue = () => photo.value;

    const setValue = (v: CropData | string | null) => {
        if (!v) {
            reset();
            return;
        }
        const data: CropData = typeof v === 'string'
            ? { file: v, content: '', extension: null }
            : v;
        const src = data.original || data.file || data.content;
        if (src) {
            image.src = src;
        }
        photo.set(data);
    };

    props.ref?.({
        getValue,
        setValue,
        getImage: () => image,
        zoom: (v: number) => (zoomLevel.value = v),
        rotate: (v: number) => (rotateLevel.value = v),
        brightness: (v: number) => (brightLevel.value = v),
        contrast: (v: number) => (contrastLevel.value = v),
        save,
        reset,
        upload,
    });

    const init = (el: HTMLCanvasElement) => {
        canvas = el;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        filterCanvas = document.createElement('canvas');
        filterCtx = filterCanvas.getContext('2d', { willReadFrequently: true });
        if (props.src.value) {
            image.src = props.src.value as string;
        }
    };

    const boxStyle = () => {
        const b = box.value;
        return css({ left: b.left, top: b.top, width: b.w, height: b.h });
    };

    return html`<div class="lm-cropper ${() => (hasImage.value ? 'lm-cropper-edition' : '')} ${() =>
        dragging.value ? 'lm-cropper-dragging' : ''}">
        <div class="lm-cropper-editor"
            style="${() => css({ width: num('width'), height: num('height') })}"
            ref="${(el: HTMLElement) => (editor = el)}"
            onmousedown="${onPress}"
            onclick="${() => !hasImage.value && upload()}"
            ondblclick="${upload}"
            onwheel="${onWheel}"
            ontouchstart="${onTouchStart}"
            ontouchmove="${onTouchMove}"
            ontouchend="${onTouchEnd}"
            ondragover="${(e: DragEvent) => {
                e.preventDefault();
                dragging.value = true;
            }}"
            ondragleave="${() => (dragging.value = false)}"
            ondrop="${onDrop}">
            <canvas class="lm-cropper-canvas"
                width="${props.width}" height="${props.height}"
                ref="${init}"></canvas>
            <div class="lm-cropper-box" style="${boxStyle}" onmousemove="${onHoverBox}"></div>
        </div>
        ${() =>
            props.controls.value &&
            html`<div class="lm-cropper-controls">
                <div class="lm-cropper-ranges">
                    <label class="lm-cropper-range">Zoom<input type="range"
                        min="0.1" max="5.45" step="0.05" bind="${zoomLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                    <label class="lm-cropper-range">Rotate<input type="range"
                        min="-1" max="1" step="0.05" bind="${rotateLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                    <label class="lm-cropper-range">Brightness<input type="range"
                        min="-1" max="1" step="0.05" bind="${brightLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                    <label class="lm-cropper-range">Contrast<input type="range"
                        min="-1" max="1" step="0.05" bind="${contrastLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                </div>
                <div class="lm-cropper-buttons">
                    <button type="button" class="lm-cropper-save"
                        disabled="${() => !hasImage.value}"
                        onclick="${save}">Save photo</button>
                    <button type="button" class="lm-cropper-upload"
                        onclick="${upload}">Upload photo</button>
                    <button type="button" class="lm-cropper-delete"
                        disabled="${() => !hasImage.value}"
                        onclick="${reset}">Delete photo</button>
                </div>
            </div>`}
        <input type="file" class="lm-cropper-file" accept="image/*"
            onchange="${onFile}"
            ref="${(el: HTMLInputElement) => (fileInput = el)}" />
    </div>`;
});

export default Cropper;
