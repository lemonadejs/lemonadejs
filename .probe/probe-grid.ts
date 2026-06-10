/**
 * Real-browser probe for <Datagrid /> — the big-data claims, measured:
 * 100k rows mount under budget, constant DOM while scrolling, correct
 * last row at the bottom, in-place mutation + touch() under budget.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Datagrid, { type Column } from '@lemonadejs/datagrid';

type Row = Record<string, unknown>;

const out: string[] = [];
const log = (name: string, ok: boolean, detail: object = {}) =>
    out.push((ok ? 'PASS' : 'FAIL') + ' ' + name + ' ' + JSON.stringify(detail));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))));

const N = 100000;
const data = store<Row[]>(
    Array.from({ length: N }, (_, i) => ({
        id: i + 1,
        name: 'Person ' + (i + 1),
        amount: ((i * 37) % 100000) / 10,
    }))
);
const columns: Column[] = [
    { name: 'id', title: 'ID', type: 'number', width: '90px' },
    { name: 'name', title: 'Name' },
    { name: 'amount', title: 'Amount', type: 'number', editable: true },
];

const App: Component = () => html`<div style="width:700px">
    <${Datagrid} data="${data}" columns="${columns}" height="400" rowheight="36" search></${Datagrid}>
</div>`;

const run = async () => {
    // ---- 1. mount 100k rows under budget
    const t0 = performance.now();
    mount(App, document.getElementById('app') as Element);
    const mountMs = Math.round(performance.now() - t0);
    await frame();
    log('mount-100k-under-300ms', mountMs < 300, { mountMs, rows: N });

    const rowCount = () => document.querySelectorAll('.lm-datagrid-row').length;
    const scroller = document.querySelector('.lm-datagrid-body') as HTMLElement;
    const atMount = rowCount();
    log('dom-is-a-window-not-100k', atMount > 0 && atMount < 40, { domRows: atMount });

    // ---- 2. scroll through: DOM stays constant, content tracks position
    let maxRows = atMount;
    for (const fraction of [0.25, 0.5, 0.75]) {
        scroller.scrollTop = (N * 36 - 400) * fraction;
        scroller.dispatchEvent(new Event('scroll'));
        await frame();
        maxRows = Math.max(maxRows, rowCount());
    }
    log('dom-constant-while-scrolling', maxRows === atMount, { maxRows, atMount });

    // ---- 3. scroll to the very end: the LAST row is rendered and visible
    scroller.scrollTop = scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll'));
    await frame();
    const rows = [...document.querySelectorAll('.lm-datagrid-row')];
    const lastText = rows[rows.length - 1].textContent || '';
    const lastRect = rows[rows.length - 1].getBoundingClientRect();
    const bodyRect = scroller.getBoundingClientRect();
    log('end-of-100k-correct-and-visible', lastText.includes('Person 100000') && Math.abs(lastRect.bottom - bodyRect.bottom) < 40, {
        lastText: lastText.slice(0, 40),
        offBottom: Math.round(lastRect.bottom - bodyRect.bottom),
    });

    // ---- 4. the big-data promise: mutate 5k rows IN PLACE + touch()
    const t1 = performance.now();
    for (let i = 0; i < N; i += 20) {
        data.value[i].amount = 1.5;
    }
    data.touch();
    const touchMs = Math.round(performance.now() - t1);
    await frame();
    log('mutate-5k-in-place-under-150ms', touchMs < 150, { touchMs });

    // ---- 5. sticky header stays put at depth
    const header = document.querySelector('.lm-datagrid-header') as HTMLElement;
    log('header-rendered', header !== null && header.getBoundingClientRect().height > 20, {});

    // ---- 6. in-cell editing: contenteditable INSIDE the cell, focused,
    // text selected, commit renders through the column formatter
    const cell = document.querySelectorAll('.lm-datagrid-row')[2].querySelectorAll('.lm-datagrid-cell')[2] as HTMLElement;
    const cellRect = cell.getBoundingClientRect();
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await frame();
    const editor = document.querySelector('.lm-datagrid-editor') as HTMLElement;
    const editorRect = editor.getBoundingClientRect();
    const selection = window.getSelection();
    log(
        'edit-in-cell-focused-and-selected',
        editor.isContentEditable &&
            editor.parentElement === cell &&
            document.activeElement === editor &&
            selection !== null && selection.toString() === editor.textContent &&
            editorRect.top >= cellRect.top - 1 && editorRect.bottom <= cellRect.bottom + 1,
        { active: document.activeElement?.className, selected: selection?.toString() }
    );
    editor.textContent = '123.4';
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await frame();
    log('edit-commit-renders-in-place', cell.textContent === '123.4' && !document.querySelector('.lm-datagrid-editor'), {
        text: cell.textContent,
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
