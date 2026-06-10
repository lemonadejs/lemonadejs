/**
 * In-page real-browser probe for <Router /> slide animation: during a
 * slide both pages must be visible at FULL container width, with the
 * container transformed — the new page pushes the old completely out.
 */
import { html, mount, type Component } from '../src/index';
import Router, { type Route } from '../components/router/router';

type Api = { setPath(p: string, ignore?: boolean): Route | null; current(): Route | null };

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const P1: Component = () => html`<div><h1>P1</h1></div>`;
const P2: Component = () => html`<div><h1>P2</h1></div>`;

let api!: Api;
const App: Component = () => html`<div style="width:600px;height:300px;display:flex">
    <${Router} ref="${(a: Api) => (api = a)}" animation
        routes="${[
            { path: '(.*)probe-router.html', component: P1 },
            { path: '/p2', component: P2 },
        ] as Route[]}"></${Router}>
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await sleep(50);

    const router = document.querySelector('.lm-router') as HTMLElement;
    const pages = () => [...document.querySelectorAll('.lm-router-page')] as HTMLElement[];
    const shown = () => pages().filter((p) => p.style.display !== 'none');
    const W = Math.round(router.getBoundingClientRect().width);

    // ---- forward slide: freeze mid-animation and measure
    api.setPath('/p2');
    await sleep(120); // ~30% into the 400ms slide
    const vis = shown();
    const widths = vis.map((p) => Math.round(p.getBoundingClientRect().width));
    const transform = getComputedStyle(router).transform;
    log('mid-slide-both-pages-full-width', vis.length === 2 && widths.every((w) => Math.abs(w - W) <= 1), {
        container: W,
        widths,
    });
    log('mid-slide-container-transformed', transform !== 'none' && router.className.includes('lm-router-slide-out'), {
        transform,
    });

    await sleep(400);
    const after = shown();
    log(
        'after-slide-old-page-hidden-new-settled',
        after.length === 1 &&
            after[0].textContent!.includes('P2') &&
            getComputedStyle(router).transform === 'none' &&
            Math.round(after[0].getBoundingClientRect().left) === Math.round(router.getBoundingClientRect().left),
        { shown: after.length, transform: getComputedStyle(router).transform }
    );

    // ---- backward slide uses the opposite direction class
    api.setPath(window.location.pathname.replace('/p2', '/.probe/probe-router.html'));
    await sleep(120);
    log('backward-slide-direction', router.className.includes('lm-router-slide-in') && shown().length === 2, {
        cls: router.className,
    });
    await sleep(400);
    log('backward-settled', shown().length === 1 && shown()[0].textContent!.includes('P1'));

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
