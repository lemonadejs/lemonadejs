/**
 * Local playground for <Navbar /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Navbar from '@lemonadejs/navbar';

// One call, zero options: the contract derives <lm-navbar> entirely
createWebComponent(Navbar);

const App: Component = (props, { state }) => {
    const page = state(1);
    // a STATE drives the live title — an inline () => arrow is not a prop
    // value the engine resolves (it renders the function source as text)
    const title = state('Page 1 of 5');
    const go = (d: number) => {
        const p = Math.min(5, Math.max(1, page.value + d));
        page.value = p;
        title.value = 'Page ' + p + ' of 5';
    };
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);

    return html`<div class="demo">
        <h1>${'<Navbar />'}</h1>

        <h3>Driving state — onprev / onnext (new in v6)</h3>
        <div class="phone">
            <${Navbar} title="${title}"
                left="‹ Prev" right="Next ›"
                onprev="${() => go(-1)}"
                onnext="${() => go(1)}" />
        </div>

        <h3>v5 style — plain links through prev / next hrefs</h3>
        <div class="phone">
            <${Navbar} title="Chapter two" left="← One" right="Three →"
                prev="#chapter-one" next="#chapter-three" />
        </div>

        <h3>One-sided — empty prev/left renders an empty cell, no href</h3>
        <div class="phone">
            <${Navbar} title="First page" right="Start →" next="#start" />
        </div>

        <h3>Web component — the same block as ${'<lm-navbar>'}</h3>
        <div class="phone">
            <lm-navbar title="Custom element" left="‹" right="›"
                onprev="${(e: Event) => note('lm-navbar prev event, detail.type = ' + (e as CustomEvent).detail.type)}"
                onnext="${(e: Event) => note('lm-navbar next event, detail.type = ' + (e as CustomEvent).detail.type)}"></lm-navbar>
        </div>
        <button onclick="${() => {
            const el = document.querySelector('lm-navbar') as HTMLElement;
            el.setAttribute('title', 'Retitled at ' + new Date().toLocaleTimeString());
        }}">retitle via setAttribute (live after mount)</button>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
