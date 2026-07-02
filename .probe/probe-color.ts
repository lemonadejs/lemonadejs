/**
 * In-page real-browser probe for <Color /> — the Spectrum tab. jsdom has
 * no canvas, so the gradient draw + getImageData pixel sampling (click a
 * point, read the pixel, commit the hex) is entirely Chrome-only. We mount
 * inline (selections commit immediately), switch to Spectrum, click known
 * gradient coordinates and assert the committed color. Results in #lm-probe.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Color from '@lemonadejs/color';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const picked = store('');

const App: Component = () => html`<div>
    <${Color} bind="${picked}" type="inline" />
</div>`;

const rgb = (hex: string) => {
    const h = (hex || '').replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 0. switch to the Spectrum tab (default is Grid)
    const tabs = Array.from(document.querySelectorAll('.lm-color-tab')) as HTMLButtonElement[];
    const spectrumTab = tabs.find((b) => b.textContent === 'Spectrum');
    spectrumTab?.click();
    await frame();
    const canvas = document.querySelector('.lm-color-canvas') as HTMLCanvasElement | null;
    log('spectrum-tab-shows-canvas', !!canvas, { found: !!canvas });
    if (!canvas) {
        throw new Error('no spectrum canvas');
    }

    // Click a canvas-local coordinate (buttons:1 = the picking gesture)
    const pickAt = async (lx: number, ly: number) => {
        const r = canvas.getBoundingClientRect();
        canvas.dispatchEvent(
            new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: r.left + lx,
                clientY: r.top + ly,
                button: 0,
                buttons: 1,
            })
        );
        await frame();
        return rgb(picked.value);
    };

    // gradient: horizontal hue (red→…→red), vertical white(top)→clear(mid)→black(bottom)
    // ---- 1. mid-left = pure red
    let c = await pickAt(0, 70);
    log('spectrum-left-mid-is-red', c[0] > 200 && c[1] < 70 && c[2] < 70, { hex: picked.value, rgb: c });

    // ---- 2. green band (hue stop ~0.67 → x≈161), mid row = pure green
    c = await pickAt(161, 70);
    log('spectrum-green-band', c[1] > 170 && c[0] < 100 && c[2] < 100, { hex: picked.value, rgb: c });

    // ---- 3. top row = white overlay
    c = await pickAt(0, 4);
    log('spectrum-top-is-white', c[0] > 230 && c[1] > 230 && c[2] > 230, { hex: picked.value, rgb: c });

    // ---- 4. bottom row = black overlay
    c = await pickAt(0, 136);
    log('spectrum-bottom-is-black', c[0] < 50 && c[1] < 50 && c[2] < 50, { hex: picked.value, rgb: c });

    // ---- 5. the point indicator moved to the clicked coordinate
    const point = document.querySelector('.lm-color-point') as HTMLElement;
    log('point-indicator-tracks-click', point.style.left === '0px' && point.style.top === '136px', {
        left: point.style.left,
        top: point.style.top,
    });

    // ---- 6. inline commits immediately: the bound value is a real hex
    log('inline-commits-picked-color', /^#[0-9a-f]{6}$/.test(picked.value), { value: picked.value });

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
