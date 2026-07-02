/**
 * In-page real-browser probe for <Tabs /> — drag-and-drop header sorting.
 * jsdom does not implement the HTML5 DnD machinery (DataTransfer /
 * DragEvent / setDragImage), so the reorder path is Chrome-only. The
 * headline this proves: reordering is a KEYED move — the dragged header
 * <li> and its panel are the SAME DOM nodes after the drop (identity, so
 * panel state/focus survive), not rebuilt. Results in #lm-probe.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Tabs, { type TabItem } from '@lemonadejs/tabs';

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const data: TabItem[] = [
    { title: 'A', content: '<p>panel A</p>' },
    { title: 'B', content: '<p>panel B</p>' },
    { title: 'C', content: '<p>panel C</p>' },
    { title: 'D', content: '<p>panel D</p>' },
];

const selected = store(0);
let positions: number[][] = [];

const App: Component = () => html`<div>
    <${Tabs} data="${data}" bind="${selected}"
        onchangeposition="${(from: number, to: number) => positions.push([from, to])}" />
</div>`;

const ul = () => document.querySelector('.lm-tabs-headers ul') as HTMLElement;
const headers = () => Array.from(ul().children) as HTMLElement[];
const panels = () => Array.from(document.querySelector('.lm-tabs-content')!.children) as HTMLElement[];
const titles = () => headers().map((li) => li.textContent);

/** Synthesize an HTML5 drag of header[from] dropped onto header[to] */
const dragReorder = (from: number, to: number) => {
    const dt = new DataTransfer();
    const src = headers()[from];
    const dst = headers()[to];
    src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    dst.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    dst.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    src.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
};

const run = async () => {
    mount(App, document.getElementById('app') as Element);
    await frame();

    // ---- 0. baseline order + a click select (sanity)
    log('initial-order', titles().join('') === 'ABCD', { titles: titles() });
    headers()[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await frame();
    log('click-selects-tab', selected.value === 1, { selected: selected.value });

    // capture identities BEFORE the drag
    const liA = headers()[0]; // 'A'
    const panelA = panels()[0]; // A's panel element

    // ---- 1. drag A (index 0) onto C (index 2)
    positions = [];
    dragReorder(0, 2);
    await frame();

    log('reorder-updates-order', titles().join('') === 'BCAD', { titles: titles() });
    log('onchangeposition-fired', positions.length === 1 && positions[0][0] === 0 && positions[0][1] === 2, { positions });
    log('moved-tab-is-selected', selected.value === 2, { selected: selected.value });

    // THE HEADLINE: the dragged header <li> is the SAME node, now at index 2
    log('header-identity-survives-reorder', headers()[2] === liA && headers()[2].textContent === 'A', {
        sameNode: headers()[2] === liA,
    });
    // and its panel element is the SAME node, moved alongside (panels kept alive)
    log('panel-identity-survives-reorder', panels()[2] === panelA, { sameNode: panels()[2] === panelA });
    // the moved tab carries the selected class
    log('moved-header-has-selected-class', headers()[2].classList.contains('lm-tabs-selected'), {});

    // ---- 2. dragend cleared the drag opacity
    log('dragend-clears-opacity', liA.style.opacity === '', { opacity: liA.style.opacity });

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
