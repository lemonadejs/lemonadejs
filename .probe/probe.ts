/**
 * In-page real-browser probe for <Modal /> — runs in headless Chrome via
 * --dump-dom, writes PASS/FAIL lines into a <pre>. jsdom cannot do
 * layout; this is the truth loop for autoadjust/centering/minimize.
 */
import { html, mount, type Component } from '../src/index';
import Modal from '../components/modal/modal';

type Api = { open(): void; close(): void; toggle(): void };

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));
const modal = () => document.querySelector('.lm-modal') as HTMLElement | null;
const rect = () => {
    const r = modal()!.getBoundingClientRect();
    return {
        top: Math.round(r.top),
        left: Math.round(r.left),
        w: Math.round(r.width),
        h: Math.round(r.height),
        overRight: Math.round(r.right - window.innerWidth),
        overBottom: Math.round(r.bottom - window.innerHeight),
    };
};

let edge!: Api;
let plain!: Api;
let fancy!: Api;
let chat2!: Api;
let chat3!: Api;

const App: Component = () => html`<div>
    <${Modal} ref="${(a: Api) => (edge = a)}" title="Edge" position="absolute"
        top="${window.innerHeight - 60}" left="${window.innerWidth - 80}"
        width="320" height="180" autoadjust closable draggable></${Modal}>
    <${Modal} ref="${(a: Api) => (plain = a)}" title="Plain" backdrop closable>
        <p>centered</p>
    </${Modal}>
    <${Modal} ref="${(a: Api) => (fancy = a)}" title="Fancy" position="absolute"
        top="120" left="120" width="380" height="240"
        draggable resizable minimizable closable layers></${Modal}>
    <${Modal} ref="${(a: Api) => (chat2 = a)}" title="Chat 2" position="absolute"
        top="180" left="220" width="300" height="200" draggable minimizable closable layers></${Modal}>
    <${Modal} ref="${(a: Api) => (chat3 = a)}" title="Chat 3" position="absolute"
        top="240" left="320" width="300" height="200" draggable minimizable closable layers></${Modal}>
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);

    // ---- 1. autoadjust: first open fully inside the viewport
    edge.open();
    await frame();
    let r = rect();
    log('autoadjust-first-open', r.overRight <= 0 && r.overBottom <= 0 && r.top >= 0 && r.left >= 0, r);

    // ---- 2. close → REOPEN: per-open setup must run again
    modal()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await frame();
    log('escape-closes', modal() === null);
    edge.open();
    await frame();
    r = rect();
    log('autoadjust-reopen', r.overRight <= 0 && r.overBottom <= 0 && r.top >= 0 && r.left >= 0, r);
    edge.close();
    await frame();

    // ---- 2b. drag halfway off-screen, close, REOPEN: autoadjust must recover it
    edge.open();
    await frame();
    let el = modal()!;
    let er = el.getBoundingClientRect();
    const mouse = (type: string, x: number, y: number) =>
        new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons: 1 });
    el.dispatchEvent(mouse('mousedown', er.left + 100, er.top + 15)); // grab the bar
    document.dispatchEvent(mouse('mousemove', window.innerWidth + 500, er.top + 15)); // drag off right
    await frame();
    const midDrag = rect(); // clamped but allowed to hang off-screen while held
    document.dispatchEvent(mouse('mouseup', window.innerWidth + 500, er.top + 15));
    await frame();
    r = rect();
    log(
        'autoadjust-drag-release-nudges-back',
        midDrag.overRight > 0 && r.overRight <= 0 && r.overBottom <= 0 && r.top >= 0 && r.left >= 0,
        { midDrag, released: r }
    );
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await frame();
    edge.open();
    await frame();
    r = rect();
    log('autoadjust-reopen-after-drag', r.overRight <= 0 && r.overBottom <= 0 && r.top >= 0 && r.left >= 0, r);
    edge.close();
    await frame();

    // ---- 3. centered open + reopen
    plain.open();
    await frame();
    r = rect();
    const centered = () =>
        Math.abs(r.left - (window.innerWidth - r.w) / 2) <= 2 && Math.abs(r.top - (window.innerHeight - r.h) / 2) <= 2;
    log('plain-open-centered', centered(), r);
    plain.close();
    await frame();
    plain.open();
    await frame();
    r = rect();
    log('plain-reopen-centered', centered(), r);
    plain.close();
    await frame();

    // ---- 4. minimize → restore returns the exact rect
    fancy.open();
    await frame();
    const before = rect();
    (document.querySelector('.lm-modal-minimize') as HTMLElement).click();
    await frame();
    const docked = rect();
    (document.querySelector('.lm-modal-minimize') as HTMLElement).click();
    await frame();
    const after = rect();
    log(
        'minimize-restore-exact',
        after.w === before.w && after.h === before.h && after.top === before.top && after.left === before.left &&
            docked.w === 195 && docked.h === 40,
        { before, docked, after }
    );

    // ---- 5. header buttons: flex-centered hover boxes
    const b = document.querySelector('.lm-modal-minimize') as HTMLElement;
    const br = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    // inline-flex blockifies to flex as a flex item — both prove the rule applied
    log('control-button-box', Math.round(br.width) === 30 && Math.round(br.height) === 30 && cs.display.includes('flex'), {
        w: Math.round(br.width),
        h: Math.round(br.height),
        display: cs.display,
    });

    // ---- 7. mousedown on a docked bar must NOT move it (layers front()
    // used to wipe the dock position, so the restore click never landed)
    (document.querySelector('.lm-modal-minimize') as HTMLElement).click();
    await frame();
    const bar = document.querySelector('.lm-modal') as HTMLElement;
    const slot = { top: bar.style.top, left: bar.style.left };
    bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 50, clientY: window.innerHeight - 40, buttons: 1 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    log('docked-bar-survives-mousedown', slot.left === '10px' && bar.style.left === slot.left && bar.style.top === slot.top, {
        slot,
        after: { top: bar.style.top, left: bar.style.left },
    });
    (bar.querySelector('.lm-modal-header') as HTMLElement).click();
    await frame();
    log('bar-click-restores-fully', !bar.className.includes('lm-modal-minimized'), { cls: bar.className });

    // ---- 8. three modals docked in successive slots; restore reflows
    chat2.open();
    chat3.open();
    await frame();
    const bars = [...document.querySelectorAll('.lm-modal')] as HTMLElement[]; // fancy, chat2, chat3
    for (const x of bars) {
        (x.querySelector('.lm-modal-minimize') as HTMLElement).click();
    }
    await frame();
    const lefts = bars.map((x) => x.style.left);
    log('three-docked-slots', lefts.join(',') === '10px,215px,420px', { lefts });

    (bars[1].querySelector('.lm-modal-header') as HTMLElement).click(); // restore the middle
    await frame();
    log(
        'dock-reflows-on-restore',
        bars[0].style.left === '10px' && bars[2].style.left === '215px' && !bars[1].className.includes('lm-modal-minimized'),
        { first: bars[0].style.left, third: bars[2].style.left }
    );

    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\n' + out.join('\n') + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
};

run().catch((e) => {
    const pre = document.createElement('pre');
    pre.id = 'lm-probe';
    pre.textContent = '\nLM-PROBE-BEGIN\nERROR ' + (e && (e as Error).message) + '\nLM-PROBE-END\n';
    document.body.appendChild(pre);
});
