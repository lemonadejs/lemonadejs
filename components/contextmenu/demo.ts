/**
 * Local playground for <Contextmenu /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

type Api = { openAt(e: MouseEvent): void; close(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    let menu!: Api;

    const items: ContextItem[] = [
        { title: 'Open', icon: 'folder_open', shortcut: 'Ctrl+O', onclick: () => note('Open') },
        { title: 'Save', icon: 'save', shortcut: 'Ctrl+S', onclick: () => note('Save') },
        { type: 'line' },
        {
            title: 'Export',
            icon: 'ios_share',
            submenu: [
                { title: 'As CSV', onclick: () => note('CSV') },
                { title: 'As JSON', onclick: () => note('JSON') },
            ],
        },
        { title: 'Disabled item', icon: 'block', disabled: true, tooltip: 'Not available' },
        { type: 'line' },
        { title: 'Delete', icon: 'delete', onclick: () => note('Delete') },
    ];

    return html`<div>
        <h1>&lt;Contextmenu /&gt;</h1>
        <div class="area" oncontextmenu="${(e: MouseEvent) => menu.openAt(e)}">
            Right-click anywhere in this area
        </div>
        <${Contextmenu} ref="${(a: Api) => (menu = a)}" options="${items}"
            onopen="${() => note('opened')}" onclose="${() => note('closed')}" />
        <h3>Log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
