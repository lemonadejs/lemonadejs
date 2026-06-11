/**
 * Local playground for <Dialog /> — served by `npm run dev`
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Dialog, { type DialogOptions, type DialogResult } from '@lemonadejs/dialog';

type Api = {
    open(options?: DialogOptions): Promise<DialogResult>;
    close(): void;
};

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const name = store('');
    let confirmApi: Api | null = null;
    let imperativeApi: Api | null = null;
    let nameApi: Api | null = null;

    const report = (line: string) => (log.value = [...log.value, line]);

    return html`<div class="demo">
        <h1>&lt;Dialog /&gt;</h1>

        <h3>Confirm (default type) — declared props + callbacks</h3>
        <${Dialog} title="Delete this file?" message="This action cannot be undone."
            confirmlabel="Delete"
            onconfirm="${() => report('onconfirm')}"
            oncancel="${() => report('oncancel')}"
            ref="${(a: Api) => (confirmApi = a)}" />
        <button onclick="${() => confirmApi?.open()}">open()</button>
        <button onclick="${async () => {
            const result = await confirmApi!.open();
            report('promise → confirmed: ' + result.confirmed);
        }}">await open()</button>

        <h3>Imperative — one instance, per-open options (v5 show(options))</h3>
        <${Dialog} ref="${(a: Api) => (imperativeApi = a)}" />
        <button onclick="${() =>
            imperativeApi?.open({
                type: 'alert',
                title: 'Heads up',
                message: 'Left-aligned alert layout, no Cancel.',
                cancel: false,
                onconfirm: () => report('alert dismissed'),
            })}">alert</button>
        <button onclick="${async () => {
            const result = await imperativeApi!.open({
                type: 'input',
                title: 'Rename',
                message: 'Pick a new name for the file.',
                placeholder: 'File name',
                input: 'notes.txt',
            });
            report(result.confirmed ? 'renamed to: ' + result.value : 'rename cancelled');
        }}">prompt (await)</button>

        <h3>Prompt with a two-way bind</h3>
        <${Dialog} type="input" title="What is your name?" bind="${name}"
            onconfirm="${(v: string) => report('hello, ' + (v || 'stranger'))}"
            ref="${(a: Api) => (nameApi = a)}" />
        <button onclick="${() => nameApi?.open()}">open()</button>
        <p>Bound value: <b>${() => name.value || '(empty)'}</b></p>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
