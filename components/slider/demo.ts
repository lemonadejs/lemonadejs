/**
 * Local playground for <Slider /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Slider from '@lemonadejs/slider';

// One call, zero options: the contract derives <lm-slider> entirely
createWebComponent(Slider);

const App: Component = (props, { state }) => {
    const volume = state(30);
    const log = state<string[]>([]);

    const push = (line: string) => {
        log.value = [...log.value.slice(-9), line];
    };

    return html`<div class="demo">
        <h1>&lt;Slider /&gt;</h1>

        <h3>Bound (two-way) — oninput on every move, onchange on release</h3>
        <${Slider} bind="${volume}" label="Volume" showvalue
            oninput="${(v: number) => push('oninput → ' + v)}"
            onchange="${(v: number, old: number) => push('onchange → ' + v + ' (was ' + old + ')')}" />
        <p>Bound value: <b>${() => String(volume.value)}</b></p>
        <button onclick="${() => (volume.value = 50)}">write 50 from outside (silent, repositions)</button>

        <h3>Steps and marks</h3>
        <${Slider} label="Step 10, marks" step="10" marks />
        <${Slider} label="Range 50–200, step 25, marks" min="50" max="200" step="25" marks showvalue />

        <h3>Colors</h3>
        <${Slider} label="Green" color="green" />
        <${Slider} label="Orange" color="orange" />
        <${Slider} label="Red" color="red" />
        <${Slider} label="Purple" color="purple" />

        <h3>Disabled</h3>
        <${Slider} label="Cannot touch this" disabled />

        <h3>Keyboard</h3>
        <p>Focus a thumb: Arrows ±step, Home/End, PageUp/PageDown ±10·step.</p>

        <h3>Web component — the same block as &lt;lm-slider&gt;</h3>
        <lm-slider label="I am a real custom element" color="red" step="5" marks showvalue
            onchange="${(e: Event) => push('lm-slider change event → ' + (e as CustomEvent).detail)}"></lm-slider>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
