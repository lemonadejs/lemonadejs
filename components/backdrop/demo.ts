/**
 * Local playground for <Backdrop /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Backdrop from '@lemonadejs/backdrop';

// One call, zero options: the contract derives <lm-backdrop> entirely
createWebComponent(Backdrop);

const App: Component = (props, { state }) => {
    const loading = state(false);
    const opened = state(false);
    const log = state<string[]>([]);

    const note = (line: string) => {
        log.value = [...log.value, line];
    };

    // Loading overlay: a CSS spinner over the dim, auto-hides
    const showLoading = () => {
        loading.value = true;
        setTimeout(() => (loading.value = false), 2500);
    };

    return html`<div class="demo">
        <h1>&lt;Backdrop /&gt;</h1>

        <h3>Loading overlay (spinner, auto-hides after 2.5s)</h3>
        <button onclick="${showLoading}">show loading backdrop</button>
        <${Backdrop} bind="${loading}">
            <span class="demo-spinner" aria-label="Loading"></span>
        </${Backdrop}>

        <h3>Closable + blur + custom opacity (click anywhere to dismiss)</h3>
        <button onclick="${() => (opened.value = true)}">open closable backdrop</button>
        <${Backdrop} bind="${opened}" closable blur opacity="70"
            onclick="${() => note('onclick')}"
            onclose="${() => note('onclose')}">
            <div class="demo-card">Click anywhere to close</div>
        </${Backdrop}>

        <h3>event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
