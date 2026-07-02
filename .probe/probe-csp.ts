/**
 * In-page real-browser probe for CSP compliance under a STRICT policy
 * (style-src 'self' — no 'unsafe-inline', NO nonce). jsdom doesn't enforce
 * CSP, so this is Chrome-only. Guards both core CSP guarantees:
 *   1. bound style="" applies via the CSSOM (setAttribute('style') would be
 *      blocked by style-src-attr)
 *   2. a component's hoisted <style> is injected as a CONSTRUCTED stylesheet
 *      via document.adoptedStyleSheets — a CSSOM write, so no nonce needed
 */
import { html, mount, type Component } from 'lemonadejs';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const Inline: Component = () => html`<div id="csp-inline" style="${'color: rgb(7, 8, 9)'}">x</div>`;
const Hoisted: Component = () => html`<div id="csp-hoisted" class="lm-csp-test">y</div>
    <style>.lm-csp-test { color: rgb(10, 20, 30); }</style>`;
const App: Component = () => html`<div><${Inline} /><${Hoisted} /></div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    const inline = getComputedStyle(document.getElementById('csp-inline')!).color;
    log('bound-style-applies-via-cssom', inline === 'rgb(7, 8, 9)', { color: inline });

    const hoisted = getComputedStyle(document.getElementById('csp-hoisted')!).color;
    log('hoisted-style-applies-under-strict-csp', hoisted === 'rgb(10, 20, 30)', { color: hoisted });

    // It went through adoptedStyleSheets (CSSOM), not a <style> element
    const adopted = [...document.adoptedStyleSheets].some((s) =>
        [...s.cssRules].some((r) => r.cssText.indexOf('lm-csp-test') >= 0)
    );
    log('hoisted-via-adopted-stylesheet', adopted, { sheets: document.adoptedStyleSheets.length });
    log('no-nonce-no-global-needed', !(globalThis as { lemonadeNonce?: string }).lemonadeNonce, {});

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
