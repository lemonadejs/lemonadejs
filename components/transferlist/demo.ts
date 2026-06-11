/**
 * Local playground for <Transferlist /> — served by `npm run dev`
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Transferlist from '@lemonadejs/transferlist';

type Api = {
    getChosen(): (string | number)[];
    moveAll(direction?: 'right' | 'left'): void;
    reset(): void;
};

const App: Component = (props, { state }) => {
    const chosen = store<(string | number)[]>(['react', 'svelte']);
    const data = store<unknown[]>([
        'react',
        'vue',
        'svelte',
        'solid',
        'angular',
        { value: 'jquery', label: 'jQuery (legacy)', disabled: true },
    ]);
    const log = state<string[]>([]);
    let api: Api | null = null;
    let extra = 0;

    const onchange = (v: (string | number)[]) => {
        log.value = [...log.value, 'onchange → [' + v.join(', ') + ']'];
    };

    return html`<div class="demo">
        <h1>&lt;Transferlist /&gt;</h1>

        <h3>Bound (two-way) + live data + api</h3>
        <${Transferlist} data="${data}" bind="${chosen}" onchange="${onchange}" ref="${(a: Api) => (api = a)}" />
        <p>Chosen: <b>${() => '[' + (chosen.value || []).join(', ') + ']'}</b></p>
        <div class="row">
            <button onclick="${() => (chosen.value = ['vue'])}">write from outside (no onchange echo)</button>
            <button onclick="${() => (data.value = [...data.value, 'lib-' + ++extra])}">add a data item</button>
            <button onclick="${() => (data.value = data.value.slice(0, -1))}">remove the last data item</button>
        </div>
        <div class="row">
            <button onclick="${() => api?.moveAll()}">api.moveAll()</button>
            <button onclick="${() => api?.moveAll('left')}">api.moveAll('left')</button>
            <button onclick="${() => api?.reset()}">api.reset()</button>
            <button onclick="${() => (log.value = [...log.value, 'getChosen → [' + (api?.getChosen() || []).join(', ') + ']'])}">api.getChosen()</button>
        </div>

        <h3>Search, custom titles, height, disabled item</h3>
        <${Transferlist} search height="200"
            titles="${['Fruit basket', 'Shopping cart']}"
            data="${[
                'apple', 'apricot', 'banana', 'blueberry', 'cherry', 'cranberry',
                'date', 'elderberry', 'fig', 'grape', 'kiwi', 'lemon', 'lime',
                { value: 'durian', label: 'Durian (banned)', disabled: true },
            ]}" />

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
