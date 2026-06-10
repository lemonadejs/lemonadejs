/**
 * Local playground for <Signature /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Signature from '@lemonadejs/signature';

// One call, zero options: the contract derives <lm-signature> entirely
createWebComponent(Signature);

type PadApi = { clear: () => unknown; getImage: () => unknown; getValue: () => unknown };

const App: Component = (props, { state }) => {
    const strokes = state<unknown[]>([]);
    const image = state('');
    const log = state<string[]>([]);
    let pad: PadApi | null = null;

    const onchange = (v: unknown[]) => {
        log.value = [...log.value, 'onchange → ' + v.length + ' entries'];
    };

    return html`<div class="demo">
        <h1>&lt;Signature /&gt;</h1>

        <h3>Bound (two-way) + api</h3>
        <${Signature} bind="${strokes}" width="400" height="180"
            instructions="Sign above — mouse or touch"
            ref="${(a: PadApi) => (pad = a)}"
            onchange="${onchange}" />
        <p>Entries recorded: <b>${() => strokes.value.length}</b></p>
        <button onclick="${() => pad?.clear()}">clear()</button>
        <button onclick="${() => (image.value = String(pad ? pad.getImage() : ''))}">getImage()</button>
        <button onclick="${() => (strokes.value = [[40, 60], [180, 110], [360, 50], '1'])}">
            write strokes from outside (no onchange echo)
        </button>
        ${() => image.value && html`<p><img src="${image.value}" alt="signature export" /></p>`}

        <h3>Thicker red line</h3>
        <${Signature} width="400" height="120" line="6" color="#dc2626" />

        <h3>Preloaded value, disabled</h3>
        <${Signature} width="400" height="120" disabled
            value="${[[40, 60], [140, 90], [240, 50], [360, 80], '1']}" />

        <h3>Form participation</h3>
        <form>
            <${Signature} name="signature" width="400" height="100"
                instructions="name=signature — a hidden input carries the JSON value" />
        </form>

        <h3>Web component — the same block as &lt;lm-signature&gt;</h3>
        <lm-signature width="300" height="100" instructions="I am a real custom element"></lm-signature>

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
