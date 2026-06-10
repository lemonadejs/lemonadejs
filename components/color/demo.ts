/**
 * Local playground for <Color /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from '../../src/index';
import Color from './color';

// One call, zero options: the contract derives <lm-color> entirely
createWebComponent(Color);

type Api = {
    open(): void;
    close(): void;
    reset(): void;
    setValue(v: string): void;
    getValue(): string;
};

const App: Component = (props, { state }) => {
    const current = state('#2196f3');
    const log = state<string[]>([]);
    let api: Api | null = null;

    const report = (line: string) => (log.value = [...log.value, line]);
    const onchange = (v: string) => report('onchange → ' + (v || '(cleared)'));

    return html`<div class="demo">
        <h1>&lt;Color /&gt;</h1>

        <h3>Input toggle (two-way bound) — v5 pending/Done flow</h3>
        <${Color} type="input" bind="${current}" placeholder="Pick a color"
            onchange="${onchange}"
            onopen="${() => report('onopen')}"
            onclose="${(origin: string) => report('onclose ← ' + origin)}" />
        <p>Bound value: <b style="${() => (current.value ? 'color:' + current.value : '')}">${() =>
            current.value || '(none)'}</b></p>
        <button onclick="${() => (current.value = '#e91e63')}">write #e91e63 from outside (no onchange echo)</button>

        <h3>closeonchange — picking commits and closes immediately</h3>
        <${Color} type="input" closeonchange placeholder="Closes on pick" onchange="${onchange}" />

        <h3>API-driven (no input)</h3>
        <${Color} ref="${(a: Api) => (api = a)}" onchange="${onchange}"
            onclose="${(origin: string) => report('api picker onclose ← ' + origin)}" />
        <button onclick="${() => api?.open()}">api.open()</button>
        <button onclick="${() => api?.setValue('#4caf50')}">api.setValue('#4caf50')</button>
        <button onclick="${() => report('api.getValue() = ' + api?.getValue())}">api.getValue()</button>
        <button onclick="${() => api?.reset()}">api.reset()</button>

        <h3>Inline with a custom palette</h3>
        <${Color} type="inline" onchange="${onchange}" palette="${[
            ['#b71c1c', '#880e4f', '#4a148c', '#1a237e', '#0d47a1'],
            ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3'],
            ['#ef9a9a', '#f48fb1', '#ce93d8', '#9fa8da', '#90caf9'],
        ]}" />

        <h3>Web component — the same block as &lt;lm-color&gt;</h3>
        <lm-color type="input" placeholder="custom element"
            onchange="${(e: Event) => report('lm-color change event → ' + (e as CustomEvent).detail)}"></lm-color>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
