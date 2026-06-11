/**
 * Local playground for <Carousel /> — served by `npm run dev`
 *
 * THE SINGLE-FILE PROBE: this page links NO stylesheet for the block.
 * Everything the carousel needs ships inside the component via the
 * hoisted <style> — check document.head: one injected tag, however many
 * carousels mount below.
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Carousel from '@lemonadejs/carousel';

// One call, zero options: the contract derives <lm-carousel> entirely
createWebComponent(Carousel);

type Api = { next(): void; prev(): void; goto(i: number): void };

const SLIDES = [
    {
        image: 'https://picsum.photos/id/1015/800/360',
        title: 'River bend',
        description: 'Drag, swipe, arrow keys — or just wait for the autoplay.',
        link: 'https://lemonadejs.com',
    },
    {
        image: 'https://picsum.photos/id/1016/800/360',
        title: 'Canyon',
        description: 'Slide 2 of 4.',
    },
    {
        image: 'https://picsum.photos/id/1018/800/360',
        title: 'Peaks',
    },
    {
        title: 'Text-only slide',
        description: 'No image at all — only the provided fields render.',
        link: 'https://lemonadejs.com',
    },
];

const App: Component = (props, { state }) => {
    const current = state(0);
    const log = state<string[]>([]);
    let api: Api | null = null;

    const push = (line: string) => {
        log.value = [...log.value.slice(-9), line];
    };

    return html`<div class="demo">
        <h1>&lt;Carousel /&gt;</h1>
        <p>
            Single-file block: <b>no style.css</b> — the CSS is hoisted from the component's
            own <code>&lt;style&gt;</code> into <code>document.head</code>, once, for all
            instances on this page.
        </p>

        <h3>Bound (two-way) — autoplay 4s, loop, pauses on hover</h3>
        <${Carousel} bind="${current}" data="${SLIDES}" autoplay="4000" loop
            ref="${(a: Api) => (api = a)}"
            onchange="${(i: number) => push('onchange → ' + i)}" />
        <p>Bound index: <b>${() => String(current.value)}</b></p>
        <button onclick="${() => (current.value = 0)}">write 0 from outside (silent)</button>
        <button onclick="${() => api?.next()}">api.next()</button>
        <button onclick="${() => api?.prev()}">api.prev()</button>
        <button onclick="${() => api?.goto(3)}">api.goto(3)</button>

        <h3>No loop — arrows disable at the edges</h3>
        <${Carousel} data="${SLIDES.slice(0, 3)}" />

        <h3>Minimal — no arrows, no dots (swipe/keyboard only)</h3>
        <${Carousel} data="${SLIDES.slice(0, 3)}" arrows="${false}" dots="${false}" />

        <h3>Web component — the same block as &lt;lm-carousel&gt;</h3>
        <lm-carousel ref="${(el: { props: object }) => (el.props = { data: SLIDES.slice(1, 4), loop: true })}"></lm-carousel>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
