/**
 * Local playground for <Rating /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from '../../src/index';
import Rating from './rating';

// One call, zero options: the contract derives <lm-rating> entirely
createWebComponent(Rating);

const App: Component = (props, { state }) => {
    const score = state(3);
    const count = state(5);
    const log = state<string[]>([]);

    const onchange = (v: number) => {
        log.value = [...log.value, 'onchange → ' + v];
    };

    let api: { getValue: () => number; setValue: (v: number) => void } | null = null;

    return html`<div class="demo">
        <h1>&lt;Rating /&gt;</h1>

        <h3>Bound (two-way), live star count, tooltips</h3>
        <${Rating} bind="${score}" number="${count}" tooltip="Bad,Poor,Ok,Good,Great" onchange="${onchange}" />
        <p>Bound value: <b>${() => String(score.value)}</b> of ${count}</p>
        <button onclick="${() => (score.value = 5)}">write from outside (no onchange echo)</button>
        <button onclick="${() => count.value++}">+ star</button>
        <button onclick="${() => count.value--}">- star (clamps the value, v5 behavior)</button>

        <h3>Standalone + initial value</h3>
        <${Rating} value="${2}" />

        <h3>Colors and sizes</h3>
        <${Rating} value="${3}" color="yellow" />
        <${Rating} value="${3}" color="green" size="small" />
        <${Rating} value="${3}" color="purple" size="large" />

        <h3>Disabled and readonly</h3>
        <${Rating} disabled value="${2}" />
        <${Rating} readonly value="${4}" color="yellow" />

        <h3>api via ref</h3>
        <${Rating} value="${1}" ref="${(a: typeof api) => (api = a)}" onchange="${onchange}" />
        <button onclick="${() => api?.setValue(4)}">setValue(4)</button>
        <button onclick="${() => (log.value = [...log.value, 'getValue → ' + api?.getValue()])}">getValue()</button>

        <h3>Web component — the same block as &lt;lm-rating&gt;</h3>
        <lm-rating value="2" number="5" color="orange"
            onchange="${(e: Event) =>
                (log.value = [...log.value, 'lm-rating change event → ' + (e as CustomEvent).detail])}"></lm-rating>
        <br />
        <button onclick="${() => {
            const el = document.querySelector('lm-rating') as HTMLElement & { value: number };
            el.value = (el.value || 0) + 1; // the core-of-HTML surface: a real element property
        }}">bump via el.value property</button>

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
