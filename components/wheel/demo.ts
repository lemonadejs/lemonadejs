/**
 * Local playground for <Wheel /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Wheel from '@lemonadejs/wheel';

// One call, zero options: the contract derives <lm-wheel> entirely
createWebComponent(Wheel);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

type Api = { getIndex(): number; setIndex(i: number): void; getValue(): unknown };

const App: Component = (props, { state }) => {
    const month = state(5); // June
    const log = state<string[]>([]);

    const onchange = (i: number) => {
        log.value = [...log.value, 'onchange → ' + i + ' (' + MONTHS[i] + ')'];
    };

    let hours: Api | null = null;
    const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
    const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

    return html`<div class="demo">
        <h1>&lt;Wheel /&gt;</h1>

        <h3>Bound (two-way) — wheel, trackpad, drag or tap</h3>
        <${Wheel} bind="${month}" options="${MONTHS}" onchange="${onchange}" />
        <p>Bound index: <b>${() => String(month.value)}</b> — ${() => MONTHS[month.value] || ''}</p>
        <button onclick="${() => (month.value = 0)}">write from outside (no onchange echo)</button>

        <h3>A time picker: two wheels, custom geometry</h3>
        <${Wheel} options="${hourOptions}" selected="9" rowheight="32" visible="5"
            ref="${(a: Api) => (hours = a)}" />
        <${Wheel} options="${minuteOptions}" selected="30" rowheight="32" visible="5" />
        <br />
        <button onclick="${() => hours?.setIndex(hours.getIndex() + 1)}">api: next hour</button>

        <h3>v5 { title } options</h3>
        <${Wheel} options="${[{ title: 'Small' }, { title: 'Medium' }, { title: 'Large' }]}" selected="1" visible="3" />

        <h3>Disabled</h3>
        <${Wheel} options="${['Cannot', 'touch', 'this']}" selected="1" visible="3" disabled />

        <h3>Web component — the same block as &lt;lm-wheel&gt;</h3>
        <lm-wheel selected="2" rowheight="36" visible="3"
            onchange="${(e: Event) =>
                (log.value = [...log.value, 'lm-wheel change event → ' + (e as CustomEvent).detail])}"></lm-wheel>
        <br />
        <button onclick="${() => {
            const el = document.querySelector('lm-wheel') as HTMLElement & { options: unknown[] };
            el.options = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // a real element property
        }}">set options via el.options property</button>
        <button onclick="${() => {
            const el = document.querySelector('lm-wheel') as HTMLElement & { value: number };
            el.value = (el.value + 1) % 3; // bind surfaces as el.value
        }}">step via el.value property</button>

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
