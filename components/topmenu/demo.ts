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
        {
            // The torture menu: FOUR levels deep, separators before every
            // submenu entry at every level (the alignment regression shape),
            // long lists, disabled entries and shortcuts mixed in
            title: 'Insert',
            submenu: [
                { title: 'Text block', icon: 'notes', onclick: () => note('Insert > Text') },
                { type: 'line' },
                {
                    title: 'Chart',
                    icon: 'bar_chart',
                    submenu: [
                        { title: 'Bar', onclick: () => note('Chart > Bar') },
                        { title: 'Line', onclick: () => note('Chart > Line') },
                        { type: 'line' },
                        {
                            title: 'Advanced',
                            submenu: [
                                { title: 'Heatmap', onclick: () => note('Advanced > Heatmap') },
                                { title: 'Treemap', onclick: () => note('Advanced > Treemap') },
                                { type: 'line' },
                                {
                                    title: 'Flow',
                                    submenu: [
                                        { title: 'Sankey', onclick: () => note('Flow > Sankey') },
                                        { title: 'Chord', onclick: () => note('Flow > Chord') },
                                        { type: 'line' },
                                        { title: 'Arc diagram', onclick: () => note('Flow > Arc') },
                                    ],
                                },
                                { title: 'Gauge', disabled: true },
                            ],
                        },
                        { title: 'Pie', onclick: () => note('Chart > Pie') },
                    ],
                },
                { type: 'line' },
                {
                    title: 'Table',
                    icon: 'table_chart',
                    submenu: [
                        { title: '2 × 2', onclick: () => note('Table > 2x2') },
                        { title: '4 × 4', onclick: () => note('Table > 4x4') },
                        { type: 'line' },
                        {
                            title: 'From template',
                            submenu: [
                                { title: 'Budget', shortcut: 'Ctrl+B', onclick: () => note('Template > Budget') },
                                { title: 'Invoice', onclick: () => note('Template > Invoice') },
                                { title: 'Timesheet', disabled: true },
                            ],
                        },
                    ],
                },
                { title: 'Image', icon: 'image', disabled: true },
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
