/**
 * Local playground for <Toggle /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Toggle from '@lemonadejs/toggle';

// One call, zero options: the contract derives <lm-toggle> entirely
createWebComponent(Toggle);

const App: Component = (props, { state }) => {
    const mic = state(false);
    const log = state<string[]>([]);

    const onchange = (v: boolean) => {
        log.value = [...log.value, 'onchange → ' + v];
    };

    return html`<div class="demo">
        <h1>&lt;Toggle /&gt;</h1>

        <h3>Bound (two-way)</h3>
        <${Toggle} bind="${mic}" icon="mic" text="Microphone" onchange="${onchange}" />
        <p>Bound value: <b>${() => String(mic.value)}</b></p>
        <button onclick="${() => (mic.value = !mic.value)}">write from outside (no onchange echo)</button>

        <h3>Standalone + initial checked</h3>
        <${Toggle} text="Local state" />
        <${Toggle} checked text="Starts pressed" />

        <h3>Icon only / text only</h3>
        <${Toggle} icon="videocam" />
        <${Toggle} text="No icon" />

        <h3>Disabled</h3>
        <${Toggle} disabled icon="mic" text="Cannot touch this" />
        <${Toggle} disabled checked text="Disabled, pressed" />

        <h3>Form participation</h3>
        <form>
            <${Toggle} name="mic" icon="mic" text="name=mic" />
        </form>

        <h3>Web component — the same block as &lt;lm-toggle&gt;</h3>
        <lm-toggle icon="videocam" text="I am a real custom element" checked="true"
            onchange="${(e: Event) =>
                (log.value = [...log.value, 'lm-toggle change event → ' + (e as CustomEvent).detail])}"></lm-toggle>
        <br />
        <button onclick="${() => {
            const el = document.querySelector('lm-toggle') as HTMLElement & { value: boolean };
            el.value = !el.value; // the core-of-HTML surface: a real element property
        }}">toggle via el.value property</button>

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
