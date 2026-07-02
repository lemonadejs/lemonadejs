/**
 * In-page real-browser probe for <Cropper /> — the quick image editor.
 * jsdom has NO canvas, so every claim here is Chrome-only: the native
 * ctx.filter pipeline actually BAKES into the canvas pixels, transforms
 * and flips move real pixels, the aspect lock holds true geometry, and
 * export reads a real dataURL. We read the editor canvas back with
 * getImageData and assert on pixels. Results in #lm-probe for
 * scripts/chrome-probe.mjs.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Cropper, { type CropData } from '@lemonadejs/cropper';

type Api = {
    save(): CropData | null;
    brightness(v: number): void;
    grayscale(v: number): void;
    invert(v: number): void;
    flipHorizontal(): void;
    rotateRight(): void;
    setAspect(r: number): void;
};

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));
const waitFor = async (pred: () => boolean, ms = 2000) => {
    const t0 = Date.now();
    while (!pred() && Date.now() - t0 < ms) {
        await frame();
    }
    return pred();
};

// A deterministic 800×360 source: left half flat gray (120), right half
// orange (200,80,40). With a matching editor area the image fits 1:1, so
// canvas pixel (x,y) === image pixel (x,y) — sampling is exact.
const makeSource = () => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 360;
    const x = c.getContext('2d')!;
    x.fillStyle = 'rgb(120,120,120)';
    x.fillRect(0, 0, 400, 360);
    x.fillStyle = 'rgb(200,80,40)';
    x.fillRect(400, 0, 400, 360);
    return c.toDataURL();
};

const src = store(makeSource());
let api!: Api;

const App: Component = () => html`<div style="padding:20px">
    <${Cropper} src="${src}" width="${800}" height="${360}" resizable
        ref="${(a: Api) => (api = a)}" />
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);

    const canvas = () => document.querySelector('.lm-cropper-canvas') as HTMLCanvasElement;
    const boxEl = () => document.querySelector('.lm-cropper-box') as HTMLElement;
    const cctx = () => canvas().getContext('2d')!;
    const px = (x: number, y: number) => {
        const d = cctx().getImageData(x, y, 1, 1).data;
        return [d[0], d[1], d[2], d[3]];
    };
    const near = (a: number, b: number, tol = 16) => Math.abs(a - b) <= tol;

    // ---- 0. image loads, editor enters edition mode, pixels are painted
    const ready = await waitFor(
        () => document.querySelector('.lm-cropper-edition') !== null && px(200, 180)[3] !== 0
    );
    log('image-loads-into-edition-mode', ready);

    // ---- 1. baseline: left flat gray, right orange (the source, undistorted)
    let left = px(200, 180);
    let right = px(600, 180);
    log('baseline-left-is-gray', near(left[0], 120) && near(left[1], 120) && near(left[2], 120), { left });
    log('baseline-right-is-orange', right[0] > 150 && right[0] > right[1] && right[1] > right[2], { right });

    // ---- 2. brightness baked natively: gray 120 → ~180 at brightness(1.5)
    api.brightness(0.5);
    await frame();
    left = px(200, 180);
    log('brightness-bakes-into-pixels', left[0] > 150, { left });
    api.brightness(0);
    await frame();
    log('brightness-reset-restores-pixels', near(px(200, 180)[0], 120), { left: px(200, 180) });

    // ---- 3. grayscale(1): the orange half collapses to r≈g≈b
    api.grayscale(1);
    await frame();
    right = px(600, 180);
    log('grayscale-collapses-channels', near(right[0], right[1], 10) && near(right[1], right[2], 10), { right });
    api.grayscale(0);
    await frame();

    // ---- 4. invert(1): flat 120 → ~135 (255 − 120)
    api.invert(1);
    await frame();
    left = px(200, 180);
    log('invert-bakes-into-pixels', near(left[0], 135), { left });
    api.invert(0);
    await frame();

    // ---- 5. flip horizontal: the left sample now shows the RIGHT color
    api.flipHorizontal();
    await frame();
    left = px(200, 180);
    log('flip-horizontal-swaps-pixels', left[0] > 150 && left[0] > left[1], { left });
    api.flipHorizontal(); // flip back
    await frame();
    log('flip-back-restores-pixels', near(px(200, 180)[0], 120), { left: px(200, 180) });

    // ---- 6. rotate 90°: the canvas content actually changes
    const sum = () => {
        const d = cctx().getImageData(0, 0, 800, 360).data;
        let s = 0;
        for (let i = 0; i < d.length; i += 4000) {
            s += d[i];
        }
        return s;
    };
    const before = sum();
    api.rotateRight();
    await frame();
    log('rotate-90-changes-canvas', sum() !== before, { before, after: sum() });
    api.rotateRight();
    api.rotateRight();
    api.rotateRight(); // back to 0 (4 quarter turns)
    await frame();

    // ---- 7. aspect lock — the real geometry test (jsdom-blind)
    api.setAspect(1); // 1:1
    await frame();
    let r = boxEl().getBoundingClientRect();
    log('aspect-1-1-makes-square-box', near(r.width, r.height, 2), { w: Math.round(r.width), h: Math.round(r.height) });

    api.setAspect(16 / 9);
    await frame();
    r = boxEl().getBoundingClientRect();
    log('aspect-16-9-sets-ratio', Math.abs(r.width / r.height - 16 / 9) < 0.05, {
        ratio: +(r.width / r.height).toFixed(3),
    });

    // a corner drag under the lock keeps the ratio
    r = boxEl().getBoundingClientRect();
    const downX = Math.round(r.right - 2);
    const downY = Math.round(r.bottom - 2);
    boxEl().dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: downX, clientY: downY, button: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: downX + 60, clientY: downY + 30, button: 0 }));
    await frame();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await frame();
    r = boxEl().getBoundingClientRect();
    log('aspect-lock-holds-through-resize', Math.abs(r.width / r.height - 16 / 9) < 0.06, {
        ratio: +(r.width / r.height).toFixed(3),
    });
    api.setAspect(0); // free again

    // ---- 8. export reads a real, non-empty dataURL off the canvas
    const data = api.save();
    log('export-produces-real-dataurl', !!data && data.content.startsWith('data:image/png') && data.content.length > 200, {
        len: data ? data.content.length : 0,
        ext: data ? data.extension : null,
    });

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
