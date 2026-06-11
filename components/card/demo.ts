/**
 * Local playground for <Card /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Card, { type CardAction } from '@lemonadejs/card';

// One call, zero options: the contract derives <lm-card> entirely
createWebComponent(Card);

const PHOTO = 'https://picsum.photos/seed/lemonade/640/360';
const AVATAR =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
            '<circle cx="20" cy="20" r="20" fill="#fbbf24"/>' +
            '<text x="20" y="26" font-family="system-ui" font-size="16" text-anchor="middle" fill="#78350f">L</text>' +
            '</svg>'
    );

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);

    const say = (message: string) => {
        log.value = [...log.value, message];
    };

    const actions: CardAction[] = [
        { label: 'Share', onclick: () => say('Share clicked') },
        { label: 'Learn more', onclick: () => say('Learn more clicked') },
        { label: 'Delete', color: 'error', onclick: () => say('Delete clicked') },
    ];

    return html`<div class="demo">
        <h1>&lt;Card /&gt;</h1>

        <h3>Media card (elevated — the default)</h3>
        <${Card}
            image="${PHOTO}"
            avatar="${AVATAR}"
            title="Lemonade stand"
            subtitle="June 11, 2026"
            content="A media card: top image, avatar header, body text — every section is a branch on its props." />

        <h3>Outlined, with actions</h3>
        <${Card} variant="outlined"
            title="Plain and bordered"
            content="1px border instead of the shadow; the footer row keeps its buttons to the right."
            actions="${actions}" />

        <h3>Clickable surface</h3>
        <${Card} clickable="true"
            title="Click anywhere on me"
            subtitle="hover lift + onclick"
            content="Action buttons stop propagation, so this card-level onclick never double-fires."
            actions="${[{ label: 'Action only', onclick: () => say('Action clicked (no card echo)') }] as CardAction[]}"
            onclick="${() => say('Card surface clicked')}" />

        <h3>Children in the content area</h3>
        <${Card} title="Rich body" content="Plain text first —">
            <ul style="margin:0;padding-left:18px">
                <li>then <b>children</b>,</li>
                <li>rendered after the content text.</li>
            </ul>
        </${Card}>

        <h3>Web component — the same block as &lt;lm-card&gt;</h3>
        <lm-card title="Custom element" subtitle="attributes only"
            content="A real element; sections branch from attributes." variant="outlined"></lm-card>

        <h3>onclick log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
