/**
 * Real-browser probe for <Calendar /> — popup anchoring, day commit,
 * escape-cancel, month navigation, range preview. The special-attention
 * review pass for the heavyweight port.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Calendar from '@lemonadejs/calendar';

type Api = { open(): void; close(origin?: string): void; next(): void; prev(): void; setView(v: string): void };

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const single = store('2026-06-10');
const ranged = store('');
let api!: Api;
let rangeApi!: Api;

const App: Component = () => html`<div style="padding:40px 0 0 60px;width:240px">
    <${Calendar} ref="${(a: Api) => (api = a)}" bind="${single}"></${Calendar}>
    <div style="height:16px"></div>
    <${Calendar} ref="${(a: Api) => (rangeApi = a)}" bind="${ranged}" range></${Calendar}>
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    const inputs = () => [...document.querySelectorAll('.lm-calendar-input')] as HTMLInputElement[];
    const panel = () => document.querySelector('.lm-modal') as HTMLElement | null;
    const days = () =>
        [...document.querySelectorAll('.lm-calendar-content [data-grey="false"], .lm-calendar-content td, .lm-calendar-content button, .lm-calendar-content div')]
            .filter((el) => /^\d+$/.test((el.textContent || '').trim()) && !el.querySelector('*')) as HTMLElement[];

    // ---- 1. committed value renders in the input
    log('input-shows-value', inputs()[0].value === '2026-06-10' || inputs()[0].textContent === '2026-06-10', {
        value: inputs()[0].value || inputs()[0].textContent,
    });

    // ---- 2. the popup opens anchored under the input
    const rect = inputs()[0].getBoundingClientRect();
    inputs()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await frame();
    // measure SETTLED: the popup's entrance animation shifts the rect while it runs
    const anim = panel();
    if (anim && anim.getAnimations) {
        await Promise.allSettled(anim.getAnimations().map((a) => a.finished));
        await frame();
    }
    const p = panel();
    const pr = p ? p.getBoundingClientRect() : null;
    log('popup-anchored-under-input', !!pr && Math.abs(pr.top - (rect.bottom + 1)) <= 2 && Math.abs(pr.left - rect.left) <= 2, {
        panelTop: pr && Math.round(pr.top),
        inputBottom: Math.round(rect.bottom),
    });

    // ---- 3. clicking a day commits, closes, fires onchange
    const day24 = days().find((el) => el.textContent!.trim() === '24');
    day24!.click();
    await frame();
    log('day-click-commits-and-closes', single.value === '2026-06-24' && !panel(), {
        value: single.value,
        open: !!panel(),
    });
    log('input-reflects-commit', (inputs()[0].value || inputs()[0].textContent) === '2026-06-24', {
        shown: inputs()[0].value || inputs()[0].textContent,
    });

    // ---- 4. escape cancels: value unchanged
    api.open();
    await frame();
    const day5 = days().find((el) => el.textContent!.trim() === '5');
    void day5; // cursor move only happens via keyboard; just escape
    document.querySelector('.lm-calendar')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await frame();
    log('escape-cancels', single.value === '2026-06-24' && !panel(), { value: single.value });

    // ---- 5. month navigation via api
    api.open();
    await frame();
    api.next();
    await frame();
    const header = document.querySelector('.lm-calendar-navigation, .lm-calendar-header') as HTMLElement;
    log('next-month-navigates', (header.textContent || '').toLowerCase().includes('jul'), {
        header: (header.textContent || '').slice(0, 30),
    });
    api.close();
    await frame();

    // ---- 6. range: two clicks commit via Done (diagnostics included)
    rangeApi.open();
    await frame();
    const rdays = days();
    rdays.find((el) => el.textContent!.trim() === '8')!.click();
    rdays.find((el) => el.textContent!.trim() === '12')!.click();
    await frame();
    const marked = document.querySelectorAll('[data-range="true"], [data-start="true"], [data-end="true"]').length;
    const footerButtons = [...document.querySelectorAll('.lm-modal .lm-calendar-footer button, .lm-modal button')].map(
        (b) => (b.textContent || '').trim()
    );
    const done = [...document.querySelectorAll('.lm-modal button')].find((b) =>
        /done|update/i.test(b.textContent || '')
    ) as HTMLElement | undefined;
    done?.click();
    await frame();
    log('range-commits-array', String(ranged.value).includes('8') && String(ranged.value).includes('12'), {
        value: ranged.value,
        marked,
        footerButtons,
        doneFound: !!done,
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
