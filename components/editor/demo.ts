/**
 * Local playground for <Editor /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Editor from '@lemonadejs/editor';

type Api = {
    getData(): string;
    setData(value: string): void;
    getText(): string;
    insertTable(rows?: number, cols?: number): void;
    print(): void;
    exportPDF(filename?: string): void;
    exportWord(filename?: string): void;
    undo(): void;
    redo(): void;
};

const START = [
    '<h1>The Editor block</h1>',
    '<p>Rich text on the <b>Toolbar</b> block — try the table below: click inside it for the ',
    'row/column/cell balloon, drag a column border to resize, drag across cells and merge them.</p>',
    '<table><colgroup><col><col><col></colgroup><tbody>',
    '<tr><th>Block</th><th>Checks</th><th>Notes</th></tr>',
    '<tr><td>Toolbar</td><td>20</td><td>drives this editor</td></tr>',
    '<tr><td>Editor</td><td>—</td><td>tables, print, Word</td></tr>',
    '</tbody></table>',
    '<blockquote>Print goes through the browser print pipeline — pick “Save as PDF”.</blockquote>',
].join('');

const App: Component = (props, { state }) => {
    const output = state('');
    let editor!: Api;

    return html`<div>
        <h1>&lt;Editor /&gt;</h1>

        <${Editor} value="${START}" height="380px" placeholder="Write something…"
            ref="${(a: Api) => (editor = a)}"
            onchange="${(value: string) => (output.value = value)}" />

        <h3>API</h3>
        <button onclick="${() => editor.insertTable(3, 3)}">insertTable(3, 3)</button>
        <button onclick="${() => editor.exportPDF('lemonade.pdf')}">export PDF (direct)</button>
        <button onclick="${() => editor.print()}">print</button>
        <button onclick="${() => editor.exportWord('lemonade.doc')}">export Word</button>
        <button onclick="${() => editor.undo()}">undo</button>
        <button onclick="${() => editor.redo()}">redo</button>
        <button onclick="${() => (output.value = editor.getData())}">getData()</button>
        <button onclick="${() => editor.setData('<p>Reset from the API.</p>')}">setData()</button>

        <h3>onchange payload (live HTML)</h3>
        <pre>${() => output.value}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
