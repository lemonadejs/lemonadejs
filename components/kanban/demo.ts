/**
 * Local playground for <Kanban /> — served by `npm run dev`
 * Drag cards between columns and watch the event log: the card DOM is
 * the SAME element after the move (one flat keyed list under the hood),
 * so transitions, focus and any element state ride along.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Kanban, { type KanbanColumn, type KanbanCard } from '@lemonadejs/kanban';

type Api = {
    addCard(columnId: string | number, card: KanbanCard): void;
    removeCard(cardId: string | number): void;
    moveCard(cardId: string | number, columnId: string | number, index: number): void;
};

const board = store<KanbanColumn[]>([
    {
        id: 'backlog',
        title: 'Backlog',
        cards: [
            { id: 't1', title: 'Spike: keyed diff probe', description: 'Cross-list identity', color: '#f59e0b', tags: ['engine'] },
            { id: 't2', title: 'Write the contract', tags: ['api'] },
            { id: 't3', title: 'Studio styling pass', description: 'Shadows, radii, vars', color: '#7c3aed', tags: ['design', 'css'] },
        ],
    },
    {
        id: 'doing',
        title: 'In progress',
        cards: [
            { id: 't4', title: 'Drag & drop gestures', description: 'listen() + Escape cancel', color: '#16a34a', tags: ['ux'] },
        ],
    },
    {
        id: 'review',
        title: 'Review',
        cards: [{ id: 't5', title: 'Friction report', tags: ['docs'] }],
    },
    { id: 'done', title: 'Done', cards: [] },
]);

let nextId = 6;

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-7), m]);
    let api: Api | null = null;

    return html`<div>
        <h1>&lt;Kanban /&gt;</h1>
        <p>Drag a card to another column — the indicator marks the slot,
        <b>Escape</b> cancels mid-drag. The element you grabbed is the
        element that lands: identity survives cross-column moves.</p>

        <div style="margin:0 0 14px;display:flex;gap:8px">
            <button onclick="${() => {
                const id = 't' + nextId++;
                api?.addCard('backlog', { id, title: 'Task ' + id, tags: ['new'] });
            }}">+ add to backlog</button>
            <button onclick="${() => {
                const first = board.value.find((c) => c.cards.length)?.cards[0];
                if (first) {
                    api?.moveCard(first.id, 'done', 0);
                }
            }}">move first card to Done (api)</button>
        </div>

        <${Kanban} data="${board}"
            ref="${(a: Api) => (api = a)}"
            oncardmove="${(id: string, from: string, to: string, index: number) =>
                note(id + ': ' + from + ' → ' + to + ' @ ' + index)}"
            oncardclick="${(card: KanbanCard) => note('clicked ' + card.title)}"
            onchange="${() => note('onchange (board mutated in place + touch())')}"></${Kanban}>

        <h3>Event log</h3>
        <pre style="font-size:12px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:10px;min-height:80px">${() =>
            log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
