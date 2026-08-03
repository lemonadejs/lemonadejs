/**
 * <Cropper /> — a quick image editor (crop · transform · adjust · filter · export)
 *
 * Evolved from the v5 @jsuites/cropper engine, which v6 vendored inline
 * (zero runtime deps). The pan / wheel-zoom / crop-box geometry is the v5
 * math verbatim; everything else is modernised:
 *
 *   - ADJUST + FILTER run on the native CanvasRenderingContext2D.filter
 *     (GPU-accelerated) instead of the v5 per-pixel getImageData loops:
 *     brightness, contrast, saturation, hue, blur, grayscale, sepia,
 *     invert — one filter string, baked into the canvas so the crop
 *     export picks them up for free (prefer the platform over JS emulation)
 *   - TRANSFORM: continuous rotate (v5 [-1..1] → ±180°) plus 90° steps and
 *     horizontal/vertical flip, composed in one center transform
 *   - CROP box: drag to move, resize from the 8 edges/corners when
 *     resizable, with an optional ASPECT-RATIO lock (free / 1:1 / 16:9 /
 *     custom) that constrains the box as it resizes
 *   - LOAD: file picker (click when empty, double click, Upload button,
 *     api.upload()), drag-and-drop, the src prop (live), api.setValue()
 *   - EXPORT: save() reads the box pixels into a dataURL with an optional
 *     output format (png/jpeg/webp), quality and output size, and commits
 *     { file, content, extension(, original) } — the v5 value shape — to
 *     the bound state, firing onchange
 *
 * v5 → v6 mapping is unchanged from the original port (value → bind,
 * options.area → width/height, wrapper size → cropwidth/cropheight,
 * allowResize → resizable, range controls + buttons → the controls bar).
 * New props/api are purely additive; the old contract still holds.
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

/** Filter levels that map 1:1 onto a view field and a redraw */
type NumKey =
    | 'scale' | 'rotate' | 'brightness' | 'contrast' | 'saturation'
    | 'hue' | 'blur' | 'grayscale' | 'sepia' | 'invert';

type View = {
    scale: number; rotate: number;
    brightness: number; contrast: number; saturation: number;
    hue: number; blur: number; grayscale: number; sepia: number; invert: number;
    quarter: number; flipH: boolean; flipV: boolean;
    left: number; top: number; w: number; h: number;
    originX: number; originY: number; offsetX: number; offsetY: number;
    lastX: number | null; lastY: number | null; lastScale: number;
};

export const Cropper = component('cropper', {
    bind: Object,                 // committed crop data (v5: value)
    src: '',                      // image source — initial and live
    width: 800,                   // editor area width (v5 desktop area)
    height: 360,                  // editor area height
    cropwidth: 300,               // crop box width = minimum size (v5: width)
    cropheight: 240,              // crop box height = minimum size (v5: height)
    resizable: false,             // crop box edge resize (v5: allowResize)
    controls: true,               // built-in ranges + tools + buttons bar
    original: false,              // include the source image in saved data (v5)
    aspect: 0,                    // crop aspect ratio (w/h); 0 = free
    format: 'png',                // export format: png | jpeg | webp
    quality: 0.92,                // export quality for jpeg/webp (0..1)
    outputwidth: 0,               // export width; 0 = crop box width
    outputheight: 0,              // export height; 0 = crop box height
    onchange: Function,           // fires when crop data commits (save/delete/setValue)
    onload: Function,             // fires when an image lands in the editor
    api: {
        getValue: Function, setValue: Function, getImage: Function,
        zoom: Function, rotate: Function, brightness: Function, contrast: Function,
        saturate: Function, grayscale: Function, sepia: Function,
        hue: Function, blur: Function, invert: Function,
        rotateLeft: Function, rotateRight: Function,
        flipHorizontal: Function, flipVertical: Function, setAspect: Function,
        save: Function, reset: Function, upload: Function,
    },
}, (props, { bind, state, listen, onMount }) => {
    const photo = bind(props as unknown as { bind?: CropData | null }, null as CropData | null);

    // Declared props are non-optional live states: no ! and no casts
    const num = (key: 'width' | 'height' | 'cropwidth' | 'cropheight') => props[key].value;

    const hasImage = state(false);
    const dragging = state(false);
    const box = state<Box>({
        left: (num('width') - num('cropwidth')) / 2,
        top: (num('height') - num('cropheight')) / 2,
        w: num('cropwidth'),
        h: num('cropheight'),
    });
    const aspect = state<number>(props.aspect.value || 0);

    // Control levels — the single write path into the engine
    const zoomLevel = state(1);
    const rotateLevel = state(0);
    const brightLevel = state(0);
    const contrastLevel = state(0);
    const satLevel = state(0);
    const hueLevel = state(0);
    const blurLevel = state(0);
    const grayLevel = state(0);
    const sepiaLevel = state(0);
    const invertLevel = state(0);

    // ---- engine state (v5 placement + filter/transform view, non-reactive)
    const view: View = {
        scale: 1, rotate: 0,
        brightness: 0, contrast: 0, saturation: 0,
        hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0,
        quarter: 0, flipH: false, flipV: false,
        left: 0, top: 0, w: 0, h: 0,
        originX: 0, originY: 0, offsetX: 0, offsetY: 0,
        lastX: null, lastY: null, lastScale: 1,
    };

    let editor: HTMLElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let fileInput: HTMLInputElement | null = null;

    const image = document.createElement('img');

    /** The native CSS-filter string baked into the canvas on draw */
    const filterString = (): string => {
        const p: string[] = [];
        if (view.brightness) { p.push('brightness(' + (1 + view.brightness) + ')'); }
        if (view.contrast) { p.push('contrast(' + (1 + view.contrast) + ')'); }
        if (view.saturation) { p.push('saturate(' + (1 + view.saturation) + ')'); }
        if (view.grayscale) { p.push('grayscale(' + view.grayscale + ')'); }
        if (view.sepia) { p.push('sepia(' + view.sepia + ')'); }
        if (view.invert) { p.push('invert(' + view.invert + ')'); }
        if (view.hue) { p.push('hue-rotate(' + Math.round(view.hue * 180) + 'deg)'); }
        if (view.blur) { p.push('blur(' + view.blur + 'px)'); }
        return p.length ? p.join(' ') : 'none';
    };

    /** v5 runMove/runZoom/runRotate + native-filter paint: one full repaint */
    const redraw = () => {
        if (!ctx || !canvas) {
            return;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = 'none';
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
        // Transform around the image center: continuous + 90° steps + flips
        if (view.rotate || view.quarter || view.flipH || view.flipV) {
            ctx.translate(view.w / 2, view.h / 2);
            if (view.rotate || view.quarter) {
                ctx.rotate(view.rotate * Math.PI + view.quarter * (Math.PI / 2));
            }
            if (view.flipH || view.flipV) {
                ctx.scale(view.flipH ? -1 : 1, view.flipV ? -1 : 1);
            }
            ctx.translate(-view.w / 2, -view.h / 2);
        }
        ctx.filter = filterString();
        ctx.drawImage(image, 0, 0, view.w, view.h);
        ctx.filter = 'none';
    };

    const resetView = () => {
        view.scale = 1;
        view.rotate = 0;
        view.brightness = 0;
        view.contrast = 0;
        view.saturation = 0;
        view.hue = 0;
        view.blur = 0;
        view.grayscale = 0;
        view.sepia = 0;
        view.invert = 0;
        view.quarter = 0;
        view.flipH = false;
        view.flipV = false;
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
        satLevel.value = 0;
        hueLevel.value = 0;
        blurLevel.value = 0;
        grayLevel.value = 0;
        sepiaLevel.value = 0;
        invertLevel.value = 0;
    };

    /** v5 resetCropSelection: the configured crop size, centered (ratio-aware) */
    const resetBox = () => {
        box.value = {
            left: (num('width') - num('cropwidth')) / 2,
            top: (num('height') - num('cropheight')) / 2,
            w: num('cropwidth'),
            h: num('cropheight'),
        };
        if (aspect.value) {
            reshapeBox();
        }
    };

    /** Reshape the current box to the locked aspect, centered and in-bounds */
    const reshapeBox = () => {
        if (!aspect.value) {
            return;
        }
        const aw = num('width');
        const ah = num('height');
        let w = box.value.w;
        let h = w / aspect.value;
        if (h > ah) { h = ah; w = h * aspect.value; }
        if (w > aw) { w = aw; h = w / aspect.value; }
        const left = Math.min(Math.max(0, box.value.left), aw - w);
        const top = Math.min(Math.max(0, box.value.top), ah - h);
        box.value = { left, top, w, h };
    };

    const setAspect = (r: number) => {
        aspect.value = r || 0;
        reshapeBox();
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
        redraw();
        props.onload?.(image);
    };
    listen(image, 'load', onImageLoad);

    // ---- level subscriptions: ranges, api and gestures all land here.
    // One uniform wire: write the view field, repaint (native filter — no
    // per-pixel pass). Zoom and rotate ride the same path as the filters.
    const wire = (s: { subscribe: (cb: (v: unknown) => void) => () => void }, key: NumKey) =>
        onMount(() => s.subscribe((v) => {
            if (typeof v === 'number' && v !== view[key]) {
                view[key] = v;
                redraw();
            }
        }));
    wire(zoomLevel, 'scale');
    wire(rotateLevel, 'rotate');
    wire(brightLevel, 'brightness');
    wire(contrastLevel, 'contrast');
    wire(satLevel, 'saturation');
    wire(hueLevel, 'hue');
    wire(blurLevel, 'blur');
    wire(grayLevel, 'grayscale');
    wire(sepiaLevel, 'sepia');
    wire(invertLevel, 'invert');

    // src is live: any write loads a new image (initial value in init)
    onMount(() => props.src.subscribe((v) => {
        if (v) {
            image.src = v;
        }
    }));
    // aspect is live: a written ratio reshapes the box
    onMount(() => props.aspect.subscribe((v) => {
        if (typeof v === 'number') {
            setAspect(v);
        }
    }));

    // ---- pointer interactions: one in flight, armed per gesture on listen.
    // A mid-drag unmount needs no bookkeeping (the engine removes armed
    // listeners; off() is self-pruning) — release exists only so a NEW
    // gesture supersedes a previous one whose mouseup was lost
    let release: (() => void) | null = null;

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

    /** Constrain a resized box to the locked aspect, anchored opposite the drag */
    const enforceAspect = (b: Box, start: Box, d: string, ratio: number, aw: number, ah: number, minW: number, minH: number) => {
        if (d === 'n' || d === 's') {
            b.w = b.h * ratio;
        } else {
            b.h = b.w / ratio;
        }
        if (d.indexOf('w') >= 0) {
            b.left = (start.left + start.w) - b.w;
        }
        if (d.indexOf('n') >= 0) {
            b.top = (start.top + start.h) - b.h;
        }
        if (b.left < 0) { b.left = 0; }
        if (b.top < 0) { b.top = 0; }
        if (b.left + b.w > aw) { b.w = aw - b.left; b.h = b.w / ratio; }
        if (b.top + b.h > ah) { b.h = ah - b.top; b.w = b.h * ratio; }
        if (b.w < minW) { b.w = minW; b.h = minW / ratio; }
        if (b.h < minH) { b.h = minH; b.w = minH * ratio; }
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
            if (aspect.value) {
                enforceAspect(b, start, d, aspect.value, aw, ah, minW, minH);
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

    /** Wheel zoom, PROPORTIONAL to the delta (v5 applied a fixed ×0.9/×1.1
     *  per event — one notch per event on a mouse, but trackpads fire dozens
     *  of small-delta events per gesture, which made zooming far too fast).
     *  A full mouse notch (±100) still lands at ≈ ±10%; anchored when over
     *  a painted pixel. */
    const onWheel = (e: WheelEvent) => {
        if (!hasImage.value) {
            return;
        }
        // deltaMode 1 = lines (Firefox + real wheel): ~3 lines per notch
        const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        // trackpad PINCH arrives as ctrlKey+wheel with tiny deltas (~1-10
        // per event) — it needs a much hotter factor than scroll-to-zoom
        let s = view.scale * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.001));
        s = Math.min(5, Math.max(0.1, s));
        // 3 decimals: 2 swallowed sub-notch steps at higher zoom levels
        s = parseFloat(s.toFixed(3));
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
            // listen (not raw addEventListener): a read landing after unmount
            // is dropped; off() inside the handler releases the reader to GC
            const off = listen(reader, 'load', (v) => {
                image.src = String((v.target as FileReader).result);
                off();
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

    // ---- export: read the box pixels into a dataURL of the chosen format
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
        const ow = props.outputwidth.value || b.w;
        const oh = props.outputheight.value || b.h;
        out.width = ow;
        out.height = oh;
        if (ow === b.w && oh === b.h) {
            octx.putImageData(ctx.getImageData(b.left, b.top, b.w, b.h), 0, 0);
        } else {
            // scale the box to the requested output size via an intermediate canvas
            const tmp = document.createElement('canvas');
            tmp.width = b.w;
            tmp.height = b.h;
            const tctx = tmp.getContext('2d', { willReadFrequently: true });
            if (!tctx) {
                return '';
            }
            tctx.putImageData(ctx.getImageData(b.left, b.top, b.w, b.h), 0, 0);
            octx.drawImage(tmp, 0, 0, b.w, b.h, 0, 0, ow, oh);
        }
        return out.toDataURL('image/' + props.format.value, props.quality.value);
    };

    const save = (): CropData | null => {
        if (!hasImage.value) {
            return null;
        }
        const content = croppedContent();
        const data: CropData = { file: content, content, extension: props.format.value };
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
            ctx.filter = 'none';
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
        saturate: (v: number) => (satLevel.value = v),
        grayscale: (v: number) => (grayLevel.value = v),
        sepia: (v: number) => (sepiaLevel.value = v),
        hue: (v: number) => (hueLevel.value = v),
        blur: (v: number) => (blurLevel.value = v),
        invert: (v: number) => (invertLevel.value = v),
        rotateLeft: () => { view.quarter = (view.quarter + 3) % 4; redraw(); },
        rotateRight: () => { view.quarter = (view.quarter + 1) % 4; redraw(); },
        flipHorizontal: () => { view.flipH = !view.flipH; redraw(); },
        flipVertical: () => { view.flipV = !view.flipV; redraw(); },
        setAspect,
        save,
        reset,
        upload,
    });

    const init = (el: HTMLCanvasElement) => {
        canvas = el;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (props.src.value) {
            image.src = props.src.value;
        }
    };

    const boxStyle = () => {
        const b = box.value;
        return css({ left: b.left, top: b.top, width: b.w, height: b.h });
    };

    const toggle = (s: { value: number }) => (s.value = s.value ? 0 : 1);

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
                    <label class="lm-cropper-range">Saturation<input type="range"
                        min="-1" max="1" step="0.05" bind="${satLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                    <label class="lm-cropper-range">Hue<input type="range"
                        min="-1" max="1" step="0.05" bind="${hueLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                    <label class="lm-cropper-range">Blur<input type="range"
                        min="0" max="12" step="0.5" bind="${blurLevel}"
                        disabled="${() => !hasImage.value}" /></label>
                </div>
                <div class="lm-cropper-tools">
                    <button type="button" class="lm-cropper-transform" title="Rotate left"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => { view.quarter = (view.quarter + 3) % 4; redraw(); }}"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="1.5 4 1.5 10 7.5 10" /><path d="M3.8 15a9 9 0 1 0 2.2-9.3L1.5 10" /></svg></button>
                    <button type="button" class="lm-cropper-transform" title="Rotate right"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => { view.quarter = (view.quarter + 1) % 4; redraw(); }}"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="22.5 4 22.5 10 16.5 10" /><path d="M20.2 15a9 9 0 1 1-2.2-9.3l4.5 4.3" /></svg></button>
                    <button type="button" class="lm-cropper-transform" title="Flip horizontal"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => { view.flipH = !view.flipH; redraw(); }}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18" stroke-dasharray="2.5 2.5" /><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /></svg></button>
                    <button type="button" class="lm-cropper-transform" title="Flip vertical"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => { view.flipV = !view.flipV; redraw(); }}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18" stroke-dasharray="2.5 2.5" /><path d="M8 8l4-4 4 4" /><path d="M8 16l4 4 4-4" /></svg></button>
                    <button type="button" class="lm-cropper-filter ${() => (grayLevel.value ? 'lm-active' : '')}"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => toggle(grayLevel)}">B&W</button>
                    <button type="button" class="lm-cropper-filter ${() => (sepiaLevel.value ? 'lm-active' : '')}"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => toggle(sepiaLevel)}">Sepia</button>
                    <button type="button" class="lm-cropper-filter ${() => (invertLevel.value ? 'lm-active' : '')}"
                        disabled="${() => !hasImage.value}"
                        onclick="${() => toggle(invertLevel)}">Invert</button>
                    ${() =>
                        props.resizable.value &&
                        html`<select class="lm-cropper-aspect"
                            disabled="${() => !hasImage.value}"
                            onchange="${(e: Event) => setAspect(parseFloat((e.target as HTMLSelectElement).value))}">
                            <option value="0">Free</option>
                            <option value="1">1:1</option>
                            <option value="1.7778">16:9</option>
                            <option value="1.3333">4:3</option>
                        </select>`}
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
