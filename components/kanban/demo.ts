/**
 * Local playground for <Kanban /> — served by `npm run dev`
 * Drag cards between columns and watch the event log. The card ▾ button
 * (rendered because oncardmenu is handled) opens a <Contextmenu /> with
 * options YOU define — the board only reports the card and the click.
 * Every change (drag, api, menu) is undoable: try undo/redo below.
 */
import { html, mount, store, type Component } from 'lemonadejs';
import Kanban, { type KanbanColumn, type KanbanCard } from '@lemonadejs/kanban';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

type Api = {
    addCard(columnId: string | number, card: KanbanCard): void;
    removeCard(cardId: string | number): void;
    moveCard(cardId: string | number, columnId: string | number, index: number): void;
    undo(): void;
    redo(): void;
};

type MenuApi = {
    open(options: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

const board = store<KanbanColumn[]>([
    {
        id: 'backlog',
        title: 'Backlog',
        cards: [
            { id: 't1', title: 'Spike: keyed diff probe', description: 'Cross-list identity', color: '#bd7f40', tags: ['engine'] },
            { id: 't2', title: 'Write the contract', tags: ['api'] },
            { id: 't3', title: 'Studio styling pass', description: 'Shadows, radii, vars', color: '#6342a1', tags: ['design', 'css'] },
        ],
    },
    {
        id: 'doing',
        title: 'In progress',
        cards: [
            { id: 't4', title: 'Drag & drop gestures', description: 'listen() + Escape cancel', color: '#578163', tags: ['ux'] },
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
    let menu: MenuApi | null = null;
    let menuCard: KanbanCard | null = null;

    /** The menu content is YOURS: any ContextItem[] — icons, shortcuts,
     *  separators, submenus. The board only reports (card, event).
     *  Unicode icons keep the demo font-free; pass Material Icons names
     *  instead if your page loads that font. */
    const cardMenu: ContextItem[] = [
        {
            title: 'Edit',
            icon: '✎',
            onclick: () => note('edit ' + menuCard?.title + ' (your handler here)'),
        },
        {
            title: 'Duplicate',
            icon: '⧉',
            onclick: () => {
                if (menuCard) {
                    const col = board.value.find((c) => c.cards.some((k) => k.id === menuCard!.id));
                    const id = 't' + nextId++;
                    api?.addCard(col?.id ?? 'backlog', { ...menuCard, id, title: menuCard.title + ' (copy)' });
                }
            },
        },
        {
            title: 'Move to Done',
            icon: '✓',
            onclick: () => menuCard && api?.moveCard(menuCard.id, 'done', 0),
        },
        { type: 'line' },
        {
            title: 'Delete',
            icon: '✕',
            onclick: () => menuCard && api?.removeCard(menuCard.id),
        },
    ];

    return html`<div>
        <h1>&lt;Kanban /&gt;</h1>
        <p>Drag a card to another column — the indicator marks the slot,
        <b>Escape</b> cancels mid-drag. Hover a card and hit <b>▾</b> for
        the context menu (the options are defined by the demo, not the
        board). Double-click a card, then undo/redo any change.</p>

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
            <button onclick="${() => api?.undo()}">↩ undo</button>
            <button onclick="${() => api?.redo()}">↪ redo</button>
        </div>

        <${Kanban} data="${board}"
            ref="${(a: Api) => (api = a)}"
            oncardmove="${(id: string, from: string, to: string, index: number) =>
                note(id + ': ' + from + ' → ' + to + ' @ ' + index)}"
            oncardclick="${(card: KanbanCard) => note('clicked ' + card.title)}"
            oncarddblclick="${(card: KanbanCard) => note('double-clicked ' + card.title)}"
            oncardmenu="${(card: KanbanCard, e: MouseEvent) => {
                menuCard = card;
                menu?.openAt(e);
            }}"
            onchange="${() => note('onchange (board mutated in place + touch())')}"></${Kanban}>

        <${Contextmenu} options="${cardMenu}" ref="${(m: MenuApi) => (menu = m)}"></${Contextmenu}>

        <h3>Event log</h3>
        <pre style="font-size:12px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:10px;min-height:80px">${() =>
            log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
