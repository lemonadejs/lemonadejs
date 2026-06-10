/**
 * Local playground for <Modal /> — served by `npm run dev`
 */
import { html, mount, type Component } from '../../src/index';
import Modal from './modal';

type Api = { open(): void; close(): void; toggle(): void };

const frame = () => new Promise((r) => requestAnimationFrame(r));
const heap = () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
const mb = (n: number) => (n / 1048576).toFixed(1) + ' MB';

/** One disposable victim per cycle: opened, dragged, resized, destroyed */
const Victim: Component = () => {
    let api!: Api;
    queueMicrotask(() => api.open());
    return html`<div>
        <${Modal} ref="${(a: Api) => (api = a)}" title="Stress" position="absolute"
            top="160" left="160" width="340" height="200"
            draggable resizable minimizable closable>
            <p>cycle victim</p>
        </${Modal}>
    </div>`;
};

const stress = async (cycles: number, note: (m: string) => void) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const before = heap();
    const t0 = performance.now();

    for (let i = 0; i < cycles; i++) {
        const handle = mount(Victim, host);
        await frame(); // let the deferred per-open setup + paint happen

        // poke the interactions so their listeners must come and go too
        const el = host.querySelector('.lm-modal') as HTMLElement;
        if (el) {
            const r = el.getBoundingClientRect();
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r.left + 50, clientY: r.top + 15 }));
            document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + 90, clientY: r.top + 45 }));
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: r.left + 90, clientY: r.top + 45 }));
        }
        handle.unmount();
    }

    const ms = Math.round(performance.now() - t0);
    const leftovers = document.querySelectorAll('.lm-modal').length;
    host.remove();

    note(`stress: ${cycles} create+open+drag+destroy cycles in ${ms}ms`);
    note(`stress: leftover .lm-modal elements in DOM: ${leftovers}${leftovers ? '  ← LEAK' : ' ✓'}`);
    const after = heap();
    if (before !== undefined && after !== undefined) {
        note(`stress: heap ${mb(before)} → ${mb(after)} (pre-GC; Chrome only, DevTools GC for the real number)`);
    }
};

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    let plain!: Api;
    let fancy!: Api;
    let full!: Api;
    let edge!: Api;
    let panel!: Api;
    const chats: Api[] = [];

    return html`<div>
        <h1>&lt;Modal /&gt;</h1>
        <button onclick="${() => plain.open()}">Open: backdrop + closable</button>
        <button onclick="${() => fancy.open()}">Open: draggable + resizable + minimizable</button>
        <button onclick="${() => full.open()}">Open: fullscreen</button>
        <button onclick="${() => edge.open()}">Open: autoadjust (placed off the edge, nudged back)</button>
        <button onclick="${() => panel.open()}">Open: headerless floating panel (header="false")</button>
        <button onclick="${(e: MouseEvent) => {
            const b = e.target as HTMLButtonElement;
            b.disabled = true;
            stress(100, note).finally(() => (b.disabled = false));
        }}">Stress: create + destroy 100×</button>
        <button onclick="${() => chats.forEach((c) => c.open())}">Open: 3 minimizable chats (dock test)</button>

        ${[1, 2, 3].map(
            (n) => html`<${Modal} ref="${(a: Api) => (chats[n - 1] = a)}" title="${'Chat ' + n}"
                position="absolute" top="${80 + n * 50}" left="${80 + n * 70}"
                width="300" height="200" draggable minimizable closable layers>
                <p>Chat window ${n} — minimize me to the dock.</p>
            </${Modal}>`
        )}

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
