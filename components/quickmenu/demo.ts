/**
 * Local playground for <Quickmenu /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Quickmenu, { type QuickmenuItem } from '@lemonadejs/quickmenu';

type Api = { open(): void; close(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const width = state(200);
    const note = (m: string) => (log.value = [...log.value, m]);
    let api!: Api;

    const options: QuickmenuItem[] = [
        { title: 'Save', icon: 'save', shortcut: 'Ctrl+S', onclick: () => note('Save') },
        { title: 'Duplicate', icon: 'content_copy', onclick: () => note('Duplicate') },
        { type: 'line' },
        {
            title: 'Export',
            icon: 'ios_share',
            submenu: [
                { title: 'As CSV', onclick: () => note('Export > CSV') },
                { title: 'As JSON', onclick: () => note('Export > JSON') },
            ],
        },
        { title: 'Locked action', icon: 'block', disabled: true, tooltip: 'Not available' },
        { type: 'line' },
        { title: 'Delete', icon: 'delete', onclick: () => note('Delete') },
    ];

    return html`<div>
        <h1>&lt;Quickmenu /&gt;</h1>
        <p>Hover, click or right-click the header — the options menu opens right under it (v5 behavior).</p>

        <${Quickmenu} ref="${(a: Api) => (api = a)}" title="Actions" width="${width}"
            options="${options}"
            onopen="${() => note('onopen')}"
            onclose="${() => note('onclose')}" />

        <h3>Live width (v5 :width)</h3>
        <input type="range" min="120" max="420" bind="${width}" />
        <span>${() => width.value}px</span>

        <h3>Programmatic + disabled</h3>
        <button onclick="${() => api.open()}">api.open()</button>
        <button onclick="${() => api.close()}">api.close()</button>
        <span style="margin-left: 16px">
            <${Quickmenu} title="Disabled" disabled options="${options}" />
        </span>

        <h3>Log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
