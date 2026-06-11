/**
 * Local playground for <Toolbar /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Toolbar, { type ToolbarItem } from '@lemonadejs/toolbar';

type Api = { open(index: number): void; close(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    const bottomBar = state(false);
    let bar!: Api;

    const editor: ToolbarItem[] = [
        { icon: 'undo', title: 'Undo', onclick: () => note('undo') },
        { icon: 'redo', title: 'Redo', onclick: () => note('redo') },
        { type: 'divider' },
        {
            type: 'select',
            title: 'Verdana',
            options: ['Verdana', 'Arial', 'Courier New', 'Georgia'],
        },
        {
            type: 'select',
            title: 'Size',
            options: [
                { title: '10px', icon: 'format_size' },
                { title: '12px', icon: 'format_size' },
                { title: '14px', icon: 'format_size' },
            ],
        },
        { type: 'divider' },
        { icon: 'format_bold', selected: true, onclick: () => note('bold') },
        { icon: 'format_italic', onclick: () => note('italic') },
        { icon: 'format_underlined', disabled: true },
        { type: 'divider' },
        { image: 'https://lemonadejs.com/templates/default/img/components.png' },
    ];

    const rail: ToolbarItem[] = [
        { icon: 'home', title: 'Home', route: '#home', selected: true },
        { icon: 'search', title: 'Search', route: '#search' },
        { type: 'divider' },
        { icon: 'cloud', title: 'Cloud', gap: true }, // gap: pushes the rest down
        { icon: 'settings', title: 'Settings', route: '#settings' },
    ];

    const mobile: ToolbarItem[] = [
        { icon: 'home', title: 'Home', onclick: () => note('home') },
        { icon: 'favorite', title: 'Likes', onclick: () => note('likes') },
        { icon: 'person', title: 'Profile', onclick: () => note('profile') },
    ];

    return html`<div>
        <h1>&lt;Toolbar /&gt;</h1>

        <h3>Static editor bar — items, dividers, pickers</h3>
        <div class="frame">
            <${Toolbar} ref="${(a: Api) => (bar = a)}" position="static"
                options="${editor}"
                onitemclick="${(e: Event, item: ToolbarItem, index: number) =>
                    note('onitemclick → ' + (item.title || item.icon) + ' [' + index + ']')}"
                onchange="${(e: Event, item: ToolbarItem, option: { title?: string }) =>
                    note('onchange → ' + item.title + ' = ' + option.title)}" />
        </div>
        <p>
            Click or hover a picker (Verdana / Size) to open its dropdown; Escape or an
            outside click closes it.
        </p>
        <button onclick="${() => bar.open(3)}">api.open(3) — the font picker</button>
        <button onclick="${() => bar.close()}">api.close()</button>

        <h3>Left rail (data-position="left") with a gap spacer</h3>
        <div class="frame" style="height: 320px; display: flex; padding: 0">
            <${Toolbar} position="left" options="${rail}" />
        </div>

        <h3>Fixed bottom app bar (the v5 default position)</h3>
        <button onclick="${() => (bottomBar.value = !bottomBar.value)}">toggle the bottom bar (visible prop)</button>
        <${Toolbar} visible="${bottomBar}" options="${mobile}" />

        <h3>Log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
