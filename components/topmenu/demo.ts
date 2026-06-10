/**
 * Local playground for <Topmenu /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Topmenu, { type TopmenuItem } from '@lemonadejs/topmenu';

type Api = { open(index?: number): void; close(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    let bar!: Api;

    const options: TopmenuItem[] = [
        {
            title: 'File',
            submenu: [
                { title: 'New', icon: 'note_add', shortcut: 'Ctrl+N', onclick: () => note('File > New') },
                { title: 'Open', icon: 'folder_open', shortcut: 'Ctrl+O', onclick: () => note('File > Open') },
                { type: 'line' },
                {
                    title: 'Export',
                    icon: 'ios_share',
                    submenu: [
                        { title: 'As CSV', onclick: () => note('Export > CSV') },
                        { title: 'As JSON', onclick: () => note('Export > JSON') },
                    ],
                },
                { type: 'line' },
                { title: 'Quit', icon: 'logout', onclick: () => note('File > Quit') },
            ],
        },
        {
            title: 'Edit',
            submenu: [
                { title: 'Copy', icon: 'content_copy', shortcut: 'Ctrl+C', onclick: () => note('Edit > Copy') },
                { title: 'Paste', icon: 'content_paste', shortcut: 'Ctrl+V', onclick: () => note('Edit > Paste') },
                { title: 'Locked action', icon: 'block', disabled: true, tooltip: 'Not available' },
            ],
        },
        {
            title: 'View',
            submenu: [
                { title: 'Zoom in', shortcut: 'Ctrl++', onclick: () => note('View > Zoom in') },
                { title: 'Zoom out', shortcut: 'Ctrl+-', onclick: () => note('View > Zoom out') },
            ],
        },
        { title: 'Disabled', disabled: true, submenu: [{ title: 'Never shown' }] },
        { title: 'Plain' }, // no submenu
    ];

    return html`<div>
        <h1>&lt;Topmenu /&gt;</h1>
        <div class="frame">
            <${Topmenu} ref="${(a: Api) => (bar = a)}" options="${options}" />
        </div>
        <p>
            Click a title to open its menu, hover across titles while open, or use
            ArrowLeft / ArrowRight / Enter / Escape from the keyboard.
        </p>
        <button onclick="${() => bar.open()}">api.open()</button>
        <button onclick="${() => bar.open(2)}">api.open(2)</button>
        <button onclick="${() => bar.close()}">api.close()</button>
        <h3>Log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
