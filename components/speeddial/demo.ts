/**
 * Local playground for <Speeddial /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Speeddial, { type SpeeddialAction } from '@lemonadejs/speeddial';

// One call, zero options: the contract derives <lm-speeddial> entirely
createWebComponent(Speeddial);

type Api = { open(): void; close(): void; toggle(): void };

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const fanned = state(false);
    let api: Api | null = null;

    const report = (line: string) => (log.value = [...log.value, line]);

    const actions: SpeeddialAction[] = [
        { name: 'Copy', icon: 'content_copy', onclick: () => report('onclick → Copy') },
        { name: 'Save', icon: 'save' },
        { name: 'Print', icon: 'print' },
        { name: 'Share', icon: 'share' },
    ];

    return html`<div class="demo">
        <h1>&lt;Speeddial /&gt;</h1>

        <h3>Default (up) — click or hover the FAB; Escape closes</h3>
        <div class="row tall">
            <${Speeddial} options="${actions}" label="Quick actions"
                onopen="${() => report('onopen')}"
                onclose="${() => report('onclose')}"
                onaction="${(name: string) => report('onaction → ' + name)}" />
        </div>

        <h3>Directions</h3>
        <div class="row wide">
            <${Speeddial} options="${actions}" direction="down" icon="menu" label="Down" />
            <${Speeddial} options="${actions}" direction="right" icon="edit" label="Right" />
            <${Speeddial} options="${actions}" direction="left" icon="navigation" label="Left" />
        </div>

        <h3>Bound (two-way) + api</h3>
        <div class="row tall">
            <${Speeddial} options="${actions}" bind="${fanned}" ref="${(a: Api) => (api = a)}" />
        </div>
        <p>Bound value: <b>${() => String(fanned.value)}</b></p>
        <button onclick="${() => (fanned.value = !fanned.value)}">write from outside (silent — no onopen/onclose)</button>
        <button onclick="${() => api?.toggle()}">api.toggle()</button>

        <h3>Disabled</h3>
        <div class="row">
            <${Speeddial} options="${actions}" disabled label="Cannot touch this" />
        </div>

        <h3>position="fixed" — bottom-right of the viewport</h3>
        <${Speeddial} options="${actions}" position="fixed" label="Fixed FAB"
            onaction="${(name: string) => report('fixed onaction → ' + name)}" />

        <h3>Web component — the same block as &lt;lm-speeddial&gt;</h3>
        <div class="row tall">
            <lm-speeddial icon="add" label="Custom element"
                onaction="${(e: Event) => report('lm-speeddial action event → ' + JSON.stringify((e as CustomEvent).detail))}"></lm-speeddial>
        </div>
        <button onclick="${() => {
            const el = document.querySelector('lm-speeddial') as HTMLElement & { options: SpeeddialAction[] };
            el.options = actions; // the core-of-HTML surface: a real element property
        }}">set options via el.options property</button>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
