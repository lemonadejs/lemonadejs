/**
 * Local playground for <Modal /> — served by `npm run dev`
 */
import { html, mount, type Component } from '../../src/index';
import Modal from './modal';

type Api = { open(): void; close(): void; toggle(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    let plain!: Api;
    let fancy!: Api;
    let full!: Api;
    let edge!: Api;
    let panel!: Api;

    return html`<div>
        <h1>&lt;Modal /&gt;</h1>
        <button onclick="${() => plain.open()}">Open: backdrop + closable</button>
        <button onclick="${() => fancy.open()}">Open: draggable + resizable + minimizable</button>
        <button onclick="${() => full.open()}">Open: fullscreen</button>
        <button onclick="${() => edge.open()}">Open: autoadjust (placed off the edge, nudged back)</button>
        <button onclick="${() => panel.open()}">Open: headerless floating panel (header="false")</button>

        <${Modal} ref="${(a: Api) => (edge = a)}" title="Auto-adjusted" position="absolute"
            top="${window.innerHeight - 60}" left="${window.innerWidth - 80}"
            width="320" height="180" autoadjust closable draggable>
            <p>Opened beyond the bottom-right corner — autoadjust nudged it into view.</p>
        </${Modal}>

        <${Modal} ref="${(a: Api) => (panel = a)}" header="${false}" position="absolute"
            top="200" left="60" width="260" autoclose>
            <p style="margin:0">No header — the chrome for menus, chips, autocomplete.
            Click elsewhere to dismiss (autoclose).</p>
        </${Modal}>

        <${Modal} ref="${(a: Api) => (plain = a)}" title="Hello" backdrop closable
            onclose="${(origin: string) => note('closed via ' + origin)}">
            <p>Backdrop click, ×, or Escape — onclose reports the origin.</p>
        </${Modal}>

        <${Modal} ref="${(a: Api) => (fancy = a)}" title="Drag my header" position="absolute"
            top="120" left="120" width="380" height="240"
            draggable resizable minimizable closable layers
            onmove="${(x: number, y: number) => note('moved to ' + x + ',' + y)}"
            onresize="${(w: number, h: number) => note('resized to ' + w + 'x' + h)}">
            <p>Drag the header, resize the corner, minimize with –.</p>
        </${Modal}>

        <${Modal} ref="${(a: Api) => (full = a)}" title="Fullscreen (MUI-inspired)" fullscreen closable>
            <p>Covers the viewport. Escape closes.</p>
        </${Modal}>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
