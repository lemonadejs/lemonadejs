/**
 * Local playground for <Alert /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Alert from '@lemonadejs/alert';

// One call, zero options: the contract derives <lm-alert> entirely
createWebComponent(Alert);

const SEVERITIES = ['', 'success', 'warning', 'error'];
const VARIANTS = ['', 'outlined', 'filled'];

const label = (s: string) => s || 'info';

const App: Component = (props, { state }) => {
    const visible = state(true);
    const log = state<string[]>([]);

    const onclose = () => {
        log.value = [...log.value, 'onclose fired'];
    };

    return html`<div class="demo">
        <h1>&lt;Alert /&gt;</h1>

        ${VARIANTS.map(
            (variant) => html`<h3>${variant || 'standard'}</h3>
                <div class="stack">
                    ${SEVERITIES.map(
                        (severity) => html`<${Alert}
                            severity="${severity}"
                            variant="${variant}"
                            title="${label(severity)[0].toUpperCase() + label(severity).slice(1)}"
                            message="This is a ${label(severity)} alert (${variant || 'standard'})." />`
                    )}
                </div>`
        )}

        <h3>Closable + bound (two-way)</h3>
        <div class="stack">
            <${Alert} severity="success" closable bind="${visible}"
                title="Saved" message="Your changes are safe. Close me — then bring me back." onclose="${onclose}" />
        </div>
        <p>Bound visible: <b>${() => String(visible.value)}</b></p>
        <button onclick="${() => (visible.value = !visible.value)}">toggle from outside (no onclose echo)</button>

        <h3>Children + no icon</h3>
        <div class="stack">
            <${Alert} severity="warning" icon="false" message="Without an icon —">
                <span>and with <b>rich children</b> after the message.</span>
            </${Alert}>
        </div>

        <h3>Web component — the same block as &lt;lm-alert&gt;</h3>
        <lm-alert severity="error" variant="filled" title="Custom element"
            message="A real element, palette via attributes." closable="true"></lm-alert>

        <h3>onclose log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
