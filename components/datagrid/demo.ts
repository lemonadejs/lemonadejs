/**
 * Local playground for <Datagrid /> — served by `npm run dev`
 * The headline: 100,000 rows, mutable in place (touch()), a window of
 * DOM. This is the block the v6 state model was designed for.
 */
import { html, mount, store, setComponents, createWebComponent, type Component } from 'lemonadejs';
import Datagrid, { type Column } from '@lemonadejs/datagrid';
import Switch from '@lemonadejs/switch';

// One block, three deployments: by value <${Datagrid}>, by name
// <Datagrid /> (registered once), and <lm-datagrid> (custom element)
setComponents({ Datagrid: Datagrid as never });
createWebComponent(Datagrid as never);

type Row = Record<string, unknown>;
type Api = { getSelected(): Row[]; setSearch(q: string): void; sort(n: string): void; refresh(): void };

const FIRST = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eva', 'Felix', 'Gina', 'Hugo', 'Iris', 'Jonas'];
const LAST = ['Silva', 'Mendes', 'Rocha', 'Keller', 'Tanaka', 'Moreau', 'Costa', 'Weber', 'Olsen', 'Russo'];

const makeRows = (n: number): Row[] =>
    Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        name: FIRST[i % 10] + ' ' + LAST[(i * 7) % 10],
        country: ['BR', 'PT', 'DE', 'JP', 'FR', 'US'][i % 6],
        amount: Math.round(((i * 9973) % 100000) / 7) / 10,
        active: (i * 13) % 3 === 0,
    }));

const t0 = performance.now();
const big = store(makeRows(100000));
const buildMs = Math.round(performance.now() - t0);

const columns: Column[] = [
    { name: 'id', title: 'ID', type: 'number', width: '80px' },
    { name: 'name', title: 'Name', width: '2fr', editable: true },
    { name: 'country', title: 'Country', width: '90px', align: 'center' },
    { name: 'amount', title: 'Amount', type: 'number', editable: true, render: (v) => '$' + Number(v).toFixed(1) },
    {
        // ANY block can live in a cell: render returns an html`` view
        name: 'active',
        title: 'Active',
        width: '110px',
        align: 'center',
        render: (value, row) =>
            html`<${Switch} checked="${!!value}" size="small"
                onchange="${(on: boolean) => {
                    row.active = on;
                    big.touch();
                }}" />`,
    },
];

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-8), m]);
    let grid!: Api;

    const mutateInPlace = () => {
        // The big-data promise: touch 5,000 rows WITHOUT cloning 100k
        const rows = big.value;
        const start = performance.now();
        for (let i = 0; i < rows.length; i += 20) {
            rows[i].amount = Math.round(Math.random() * 99999) / 10;
        }
        big.touch();
        note('mutated 5,000 of 100,000 rows in place — ' + Math.round(performance.now() - start) + 'ms (no cloning)');
    };

    return html`<div>
        <h1>&lt;Datagrid /&gt; — 100,000 rows</h1>
        <p>Data built in ${buildMs}ms and passed BY REFERENCE. Scroll it, sort it,
        search it, double-click Name/Amount to edit. Only a window of rows exists in the DOM.</p>

        <button onclick="${mutateInPlace}">Mutate 5,000 rows in place + touch()</button>
        <button onclick="${() => grid.sort('amount')}">Sort by amount</button>
        <button onclick="${() => grid.setSearch('Ana')}">Search "Ana"</button>
        <button onclick="${() => grid.setSearch('')}">Clear search</button>

        <${Datagrid} ref="${(a: Api) => (grid = a)}"
            data="${big}" columns="${columns}"
            height="420" rowheight="36"
            search selectable="multiple"
            onchange="${(row: Row, name: string, v: unknown, old: unknown) =>
                note('row #' + row.id + ' ' + name + ': ' + old + ' → ' + v)}"
            onselect="${(rows: Row[]) => note(rows.length + ' selected')}"
            onsort="${(name: string, dir: number | null) => note('sort ' + name + ' ' + (dir || 'off'))}">
        </${Datagrid}>

        <h3>Paginated flavor — deployed BY NAME: &lt;Datagrid /&gt;</h3>
        <Datagrid data="${makeRows(45)}" columns="${[
            { name: 'id', title: 'ID', type: 'number', width: '80px' },
            { name: 'name', title: 'Name', width: '2fr', editable: true },
            { name: 'country', title: 'Country', width: '90px', align: 'center' },
            { name: 'active', title: 'Active', type: 'checkbox', width: '80px', editable: true },
        ] as Column[]}" pagination="10" selectable="single"></Datagrid>

        <h3>Custom element — &lt;lm-datagrid&gt; (works in plain HTML or any framework)</h3>
        <lm-datagrid data="${makeRows(8)}" columns="${[
            { name: 'id', title: 'ID', type: 'number', width: '80px' },
            { name: 'name', title: 'Name' },
        ] as Column[]}" pagination="4"></lm-datagrid>

        <h3>Event log</h3>
        <pre style="font-size:12px">${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
