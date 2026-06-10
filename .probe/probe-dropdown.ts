/**
 * Real-browser probe for <Dropdown /> — the panel anchors under the
 * input, virtualizes 10k options, filters while typing, commits on
 * selection. Results in #lm-probe for scripts/chrome-probe.mjs.
 */
import { html, mount, type Component } from 'lemonadejs';
import Dropdown from '@lemonadejs/dropdown';

type Api = { open(): void; close(): void; getValue(): unknown };

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const big = Array.from({ length: 10000 }, (_, i) => ({ value: i, text: 'Option ' + (i + 1) }));

let api!: Api;
const App: Component = () => html`<div style="padding:60px 0 0 80px;width:280px">
    <${Dropdown} ref="${(a: Api) => (api = a)}" data="${big}" autocomplete
        placeholder="probe"></${Dropdown}>
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 1. the panel opens anchored UNDER the input
    const input = document.querySelector('.lm-dropdown-header') as HTMLElement;
    const inputRect = input.getBoundingClientRect();
    api.open();
    await frame();
    const panel = document.querySelector('.lm-modal') as HTMLElement;
    const panelRect = panel.getBoundingClientRect();
    log(
        'panel-anchored-under-input',
        Math.abs(panelRect.top - (inputRect.bottom + 1)) <= 2 && Math.abs(panelRect.left - inputRect.left) <= 2,
        { panelTop: Math.round(panelRect.top), inputBottom: Math.round(inputRect.bottom), panelLeft: Math.round(panelRect.left), inputLeft: Math.round(inputRect.left) }
    );
    log('panel-at-least-input-width', panelRect.width >= inputRect.width - 1, {
        panel: Math.round(panelRect.width),
        input: Math.round(inputRect.width),
    });

    // ---- 2. 10k options stay a window of DOM
    const count = document.querySelectorAll('.lm-dropdown-item').length;
    log('options-virtualized', count > 0 && count < 30, { domRows: count, total: big.length });

    // ---- 3. scrolling reaches deep options
    const lazy = document.querySelector('.lm-dropdown-lazy') as HTMLElement;
    lazy.scrollTop = 5000 * 28;
    lazy.dispatchEvent(new Event('scroll'));
    await frame();
    const texts = [...document.querySelectorAll('.lm-dropdown-item')].map((el) => el.textContent || '');
    log('scroll-reaches-the-middle', texts.some((t) => t.includes('Option 5001')), { sample: texts[5] });

    // ---- 4. typing filters
    const field = document.querySelector('.lm-dropdown-input') as HTMLElement;
    field.textContent = 'Option 9999';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await frame();
    const filtered = document.querySelectorAll('.lm-dropdown-item').length;
    log('typing-filters', filtered === 1, { filtered }); // exactly 'Option 9999'

    // ---- 5. clicking commits and closes
    (document.querySelector('.lm-dropdown-item') as HTMLElement).click();
    await frame();
    log('select-commits-and-closes', api.getValue() === 9998 && !document.querySelector('.lm-modal'), {
        value: api.getValue(),
    });

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
