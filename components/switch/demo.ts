/**
 * Local playground for <Switch /> — served by `npm run dev`
 */
import { html, mount, type Component } from '../../src/index';
import Switch from './switch';

const App: Component = (props, { state }) => {
    const enabled = state(false);
    const log = state<string[]>([]);

    const onchange = (v: boolean) => {
        log.value = [...log.value, 'onchange → ' + v];
    };

    return html`<div class="demo">
        <h1>&lt;Switch /&gt;</h1>

        <h3>Bound (two-way)</h3>
        <${Switch} bind="${enabled}" label="Dark mode" onchange="${onchange}" />
        <p>Bound value: <b>${() => String(enabled.value)}</b></p>
        <button onclick="${() => (enabled.value = !enabled.value)}">write from outside (no onchange echo)</button>

        <h3>Standalone</h3>
        <${Switch} label="Local state" />

        <h3>Disabled</h3>
        <${Switch} disabled label="Cannot touch this" />

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
