/**
 * Local playground for <List /> — served by `npm run dev`
 * The v5 list (search + pagination + remote mode) wearing the v6 item
 * clothes: avatar/icon slots, secondary text, dense/divider variants,
 * plus the v6 headline — 100,000 items virtualized, mutable in place.
 */
import { createWebComponent, html, mount, store, type Component } from 'lemonadejs';
import List, { type ListItem } from '@lemonadejs/list';

// One call, zero options: the contract derives <lm-list>
createWebComponent(List as never);

const FIRST = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eva', 'Felix', 'Gina', 'Hugo', 'Iris', 'Jonas'];
const LAST = ['Silva', 'Mendes', 'Rocha', 'Keller', 'Tanaka', 'Moreau', 'Costa', 'Weber', 'Olsen', 'Russo'];
const ROLES = ['Engineering', 'Design', 'Sales', 'Support', 'Finance', 'Legal'];

const makePeople = (n: number, offset = 0): ListItem[] =>
    Array.from({ length: n }, (_, k) => {
        const i = k + offset;
        return {
            id: i + 1,
            title: FIRST[i % 10] + ' ' + LAST[(i * 7) % 10],
            secondary: ROLES[i % 6] + ' — #' + (i + 1),
            avatar: 'https://i.pravatar.cc/72?img=' + ((i % 70) + 1),
        };
    });

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-8), m]);

    // ---- the big one: 100k items BY REFERENCE, virtualized
    const big = store<ListItem[]>(
        Array.from({ length: 100000 }, (_, i) => ({
            title: 'Record ' + (i + 1),
            secondary: 'Generated row #' + (i + 1),
            icon: '#',
        }))
    );
    const mutateInPlace = () => {
        for (let i = 0; i < big.value.length; i += 20) {
            big.value[i].title = 'MUTATED ' + Math.round(Math.random() * 9999);
        }
        big.touch();
        note('mutated 5,000 of 100,000 items in place + touch() — no cloning');
    };

    // ---- remote mode: a fake server owning filter + slice
    const SERVER = makePeople(87);
    const pageSize = 8;
    let serverQuery = '';
    const remoteData = store<ListItem[]>(SERVER.slice(0, pageSize));
    const remoteTotal = store(0);
    const fetchPage = (p: number) => {
        const hits = SERVER.filter((r) => !serverQuery || String(r.title).toLowerCase().includes(serverQuery));
        remoteTotal.value = hits.length;
        remoteData.value = hits.slice(p * pageSize, p * pageSize + pageSize);
        note('server: page ' + (p + 1) + (serverQuery ? ' for "' + serverQuery + '"' : '') + ' (' + hits.length + ' hits)');
    };
    remoteTotal.value = SERVER.length;

    return html`<div class="demo">
        <h1>&lt;List /&gt;</h1>

        <h3>Default item renderer — avatar, secondary text, divider</h3>
        <${List} data="${makePeople(5)}" divider
            onitemclick="${(item: ListItem, i: number) => note('clicked #' + i + ': ' + item.title)}" />

        <h3>Dense, icon slot</h3>
        <${List} dense divider data="${[
            { title: 'Inbox', secondary: '12 new', icon: '✉' },
            { title: 'Starred', icon: '★' },
            { title: 'Sent', icon: '➤' },
            { title: 'Trash', secondary: 'empties in 30 days', icon: '🗑' },
        ] as ListItem[]}" />

        <h3>Search + pagination (local mode, the v5 behavior)</h3>
        <${List} data="${makePeople(45)}" search pagination="10" divider
            onsearch="${(q: string) => note('onsearch: "' + q + '"')}"
            onchangepage="${(p: number) => note('onchangepage: ' + p)}" />

        <h3>Custom render — the v5 children template, as a function</h3>
        <${List} data="${makePeople(3)}" divider
            render="${(item: ListItem, i: number) =>
                html`<div style="display:flex;gap:12px;align-items:baseline">
                    <b>${String(i + 1)}.</b>
                    <span>${String(item.title)}</span>
                    <small style="color:#71717a">${String(item.secondary)}</small>
                    <button onclick="${() => note('action on ' + item.title)}">act</button>
                </div>`}" />

        <h3>Remote mode — total drives the pager, the server owns the data</h3>
        <${List} data="${remoteData}" total="${remoteTotal}" pagination="${pageSize}" search divider
            onsearch="${(q: string) => {
                serverQuery = q.trim().toLowerCase();
                fetchPage(0);
            }}"
            onchangepage="${(p: number) => fetchPage(p)}" />

        <h3>100,000 items — virtualized (height + rowheight), mutable in place</h3>
        <button onclick="${mutateInPlace}">Mutate 5,000 items in place + touch()</button>
        <${List} data="${big}" height="320" rowheight="48" search dense divider />

        <h3>Custom element — &lt;lm-list&gt; (works in plain HTML or any framework)</h3>
        <lm-list data="${makePeople(4, 50)}" dense divider></lm-list>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
