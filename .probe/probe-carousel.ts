/**
 * In-page real-browser probe for <Carousel /> — the swipe gesture. jsdom
 * has no layout, so the commit threshold (a drag past 25% of the REAL
 * viewport width advances the slide) is Chrome-only. We drive pointer
 * events at coordinates derived from getBoundingClientRect and assert the
 * bound index + track transform. Results in #lm-probe for chrome-probe.mjs.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Carousel, { type CarouselSlide } from '@lemonadejs/carousel';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const slides: CarouselSlide[] = [
    { title: 'One' },
    { title: 'Two' },
    { title: 'Three' },
    { title: 'Four' },
];

const index = store(0);
let changes: number[] = [];

const App: Component = () => html`<div>
    <${Carousel} bind="${index}" data="${slides}"
        onchange="${(i: number) => changes.push(i)}" />
</div>`;

const vp = () => document.querySelector('.lm-carousel-viewport') as HTMLElement;
const track = () => document.querySelector('.lm-carousel-track') as HTMLElement;
const transform = () => track().getAttribute('style') || '';

const press = (el: EventTarget, type: string, x: number, y: number) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));

// A full swipe: down at center, move by frac×width, up. frac<0 = leftward.
const swipe = async (frac: number, cancel = false) => {
    const r = vp().getBoundingClientRect();
    const x0 = r.left + r.width / 2;
    const y0 = r.top + r.height / 2;
    press(vp(), 'mousedown', x0, y0);
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: x0 + frac * r.width, clientY: y0 }));
    await frame();
    if (cancel) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await frame();
    }
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await frame();
};

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 0. baseline: slide 0, no offset
    log('initial-slide-zero', index.value === 0 && transform().includes('0% + 0px'), { transform: transform() });

    // ---- 1. swipe LEFT past 25% advances to the next slide
    changes = [];
    await swipe(-0.35);
    log('swipe-left-advances', index.value === 1 && changes[changes.length - 1] === 1, { index: index.value, changes });
    log('track-transform-follows', transform().includes('-100%'), { transform: transform() });

    // ---- 2. swipe RIGHT past 25% goes back
    changes = [];
    await swipe(0.35);
    log('swipe-right-goes-back', index.value === 0 && changes[changes.length - 1] === 0, { index: index.value, changes });

    // ---- 3. a small swipe (<25%) snaps back, no change
    changes = [];
    await swipe(-0.15);
    log('small-swipe-snaps-back', index.value === 0 && changes.length === 0 && transform().includes('0% + 0px'), {
        index: index.value,
        changes,
    });

    // ---- 4. Escape mid-drag cancels the swipe
    changes = [];
    await swipe(-0.5, true);
    log('escape-cancels-swipe', index.value === 0 && changes.length === 0, { index: index.value, changes });

    // ---- 5. arrows navigate (and the bound state drives them)
    changes = [];
    (document.querySelector('.lm-carousel-next') as HTMLButtonElement).click();
    await frame();
    log('next-arrow-advances', index.value === 1, { index: index.value });
    (document.querySelector('.lm-carousel-prev') as HTMLButtonElement).click();
    await frame();
    log('prev-arrow-goes-back', index.value === 0, { index: index.value });

    // ---- 6. prev arrow disabled at the start (loop=false default)
    log('prev-disabled-at-edge', (document.querySelector('.lm-carousel-prev') as HTMLButtonElement).disabled, {});

    // ---- 7. dots jump to a slide and mark the active one
    const dots = document.querySelectorAll('.lm-carousel-dot');
    (dots[3] as HTMLButtonElement).click();
    await frame();
    log('dot-jumps-to-slide', index.value === 3, { index: index.value });
    log('active-dot-marked', document.querySelectorAll('.lm-carousel-dot')[3].getAttribute('data-active') === 'true', {});

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
