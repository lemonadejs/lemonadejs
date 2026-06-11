/**
 * Local playground for <Cropper /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Cropper, { type CropData } from '@lemonadejs/cropper';

// One call, zero options: the contract derives <lm-cropper> entirely
createWebComponent(Cropper);

type Api = {
    setValue: (v: unknown) => unknown;
    zoom: (v: number) => unknown;
    rotate: (v: number) => unknown;
    save: () => CropData | null;
    reset: () => unknown;
    upload: () => unknown;
};

/** A sample photo, generated locally — no network, no fixtures */
const sample = (() => {
    const c = document.createElement('canvas');
    c.width = 900;
    c.height = 600;
    const x = c.getContext('2d');
    if (!x) {
        return '';
    }
    const sky = x.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#0ea5e9');
    sky.addColorStop(1, '#fde68a');
    x.fillStyle = sky;
    x.fillRect(0, 0, 900, 380);
    x.fillStyle = '#fbbf24';
    x.beginPath();
    x.arc(660, 300, 70, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#16a34a';
    x.fillRect(0, 380, 900, 220);
    x.fillStyle = '#166534';
    for (let i = 0; i < 9; i++) {
        x.beginPath();
        x.moveTo(60 + i * 100, 420);
        x.lineTo(100 + i * 100, 330);
        x.lineTo(140 + i * 100, 420);
        x.fill();
    }
    return c.toDataURL();
})();

const App: Component = (props, { state }) => {
    const photo = state<CropData | null>(null);
    const log = state<string[]>([]);
    let api: Api | null = null;

    const onchange = (v: CropData | null) => {
        log.value = [...log.value, v ? 'onchange → saved ' + (v.extension || 'image') : 'onchange → deleted'];
    };

    return html`<div class="demo">
        <h1>&lt;Cropper /&gt;</h1>

        <h3>Bound (two-way) + api — pan with the mouse, zoom with the wheel</h3>
        <${Cropper} bind="${photo}" src="${sample}" width="640" height="320"
            cropwidth="240" cropheight="180" resizable
            ref="${(a: Api) => (api = a)}"
            onchange="${onchange}"
            onload="${() => (log.value = [...log.value, 'onload → image in the editor'])}" />
        <p>
            <button onclick="${() => api?.zoom(2)}">api.zoom(2)</button>
            <button onclick="${() => api?.rotate(0.25)}">api.rotate(0.25)</button>
            <button onclick="${() => api?.save()}">api.save()</button>
            <button onclick="${() => api?.reset()}">api.reset()</button>
            <button onclick="${() => api?.setValue(sample)}">api.setValue(sample)</button>
        </p>
        ${() =>
            photo.value &&
            html`<p>Saved crop (${() => photo.value!.content.length} chars):<br />
                <img src="${() => photo.value!.content}" alt="cropped export"
                    style="border:1px solid #cbd5e1;border-radius:6px" /></p>`}

        <h3>Empty editor — click or drop an image to start, no controls bar</h3>
        <${Cropper} width="640" height="220" cropwidth="160" cropheight="120" controls="false" />

        <h3>Web component — the same block as &lt;lm-cropper&gt;</h3>
        <lm-cropper width="640" height="200" cropwidth="150" cropheight="100"
            controls="false" src="${sample}"></lm-cropper>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
