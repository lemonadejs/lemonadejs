/**
 * In-page real-browser probe for <Contextmenu /> on Modal — corner
 * opens, cursor anchoring, submenu flip at the right edge. Results in
 * #lm-probe for scripts/chrome-probe.mjs.
 */
import { html, mount, type Component } from '../src/index';
import Contextmenu, { type ContextItem } from '../components/contextmenu/contextmenu';

type Api = {
    open(list: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));
const menus = () => [...document.querySelectorAll('.lm-modal')] as HTMLElement[];
const rectOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return {
        top: Math.round(r.top),
        left: Math.round(r.left),
        w: Math.round(r.width),
        h: Math.round(r.height),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        overRight: Math.round(r.right - window.innerWidth),
        overBottom: Math.round(r.bottom - window.innerHeight),
    };
};

const options: ContextItem[] = [
    { title: 'Open', icon: 'folder', shortcut: 'Ctrl+O' },
    { title: 'Save as...', icon: 'save' },
    { type: 'line' },
    { title: 'Blocked', disabled: true },
    {
        title: 'Export',
        submenu: [{ title: 'CSV' }, { title: 'JSON' }, { title: 'XLSX' }],
    },
    { title: 'Delete', icon: 'delete' },
];

let api!: Api;
const App: Component = () => html`<div style="height:100vh">
    <${Contextmenu} options="${options}" ref="${(a: Api) => (api = a)}" />
</div>`;

const run = async () => {
    mount(App, document.getElementById('app') as Element);

    // ---- 1. open in the middle: menu sits exactly at the cursor
    api.openAt(300, 200);
    await frame();
    let m = menus();
    let r = rectOf(m[0]);
    log('open-at-cursor', m.length === 1 && Math.abs(r.left - 300) <= 1 && Math.abs(r.top - 200) <= 1, r);
    api.close();
    await frame();

    // ---- 2. open at the bottom-right corner: must anchor right/bottom at the cursor
    const cx = window.innerWidth - 10;
    const cy = window.innerHeight - 10;
    api.openAt(cx, cy);
    await frame();
    m = menus();
    r = rectOf(m[0]);
    log(
        'corner-open-inside-viewport',
        m.length === 1 && r.overRight <= 0 && r.overBottom <= 0 && r.top >= 0 && r.left >= 0,
        { ...r, cursor: { cx, cy } }
    );
    log('corner-open-anchored-at-cursor', Math.abs(r.right - cx) <= 3 && Math.abs(r.bottom - cy) <= 3, {
        right: r.right,
        bottom: r.bottom,
        cx,
        cy,
    });

    // Opening a submenu must NOT move the cursor-anchored parent
    const anchored = r;
    const exp = [...m[0].querySelectorAll('[data-item]')].find((x) => x.textContent!.includes('Export'))!;
    exp.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await new Promise((res) => setTimeout(res, 300));
    await frame();
    m = menus();
    r = rectOf(m[0]);
    log(
        'parent-stays-anchored-when-submenu-opens',
        m.length === 2 && r.top === anchored.top && r.left === anchored.left,
        { before: anchored, after: r, levels: m.length }
    );
    api.close();
    await frame();

    // ---- 3. REOPEN after corner: fresh position at the new cursor
    api.openAt(400, 300);
    await frame();
    m = menus();
    r = rectOf(m[0]);
    log('reopen-at-new-cursor', m.length === 1 && Math.abs(r.left - 400) <= 1 && Math.abs(r.top - 300) <= 1, r);

    // ---- 4. submenu opens to the RIGHT of the parent when there is room
    let exportItem = [...m[0].querySelectorAll('[data-item]')].find((x) => x.textContent!.includes('Export'))!;
    exportItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await new Promise((res) => setTimeout(res, 300));
    await frame();
    m = menus();
    const parentR = rectOf(m[0]);
    let subR = m[1] ? rectOf(m[1]) : null;
    log('submenu-opens-right', m.length === 2 && !!subR && Math.abs(subR.left - (parentR.right - 2)) <= 2, {
        parent: parentR,
        sub: subR,
    });
    api.close();
    await frame();

    // ---- 5. submenu FLIPS LEFT at the right edge
    api.openAt(window.innerWidth - 240, 200); // parent fits, submenu would overflow
    await frame();
    m = menus();
    exportItem = [...m[0].querySelectorAll('[data-item]')].find((x) => x.textContent!.includes('Export'))!;
    exportItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await new Promise((res) => setTimeout(res, 300));
    await frame();
    m = menus();
    const pR = rectOf(m[0]);
    subR = m[1] ? rectOf(m[1]) : null;
    log('submenu-flips-left-at-edge', m.length === 2 && !!subR && subR.left < pR.left && subR.overRight <= 0, {
        parent: pR,
        sub: subR,
    });
    api.close();
    await frame();
    log('close-removes-all', menus().length === 0);

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
