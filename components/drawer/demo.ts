/**
 * Local playground for <Drawer /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Drawer from '@lemonadejs/drawer';

type Api = { open(): void; close(): void; toggle(): void };

const App: Component = (props, { state }) => {
    const navOpen = state(false);
    const log = state<string[]>([]);

    let right: Api | null = null;
    let bottom: Api | null = null;

    const note = (msg: string) => {
        log.value = [...log.value, msg];
    };

    return html`<div class="demo">
        <h1>&lt;Drawer /&gt;</h1>

        <h3>Left navigation drawer (bound, two-way)</h3>
        <button onclick="${() => (navOpen.value = true)}">open via bound state (silent)</button>
        <p>Bound value: <b>${() => String(navOpen.value)}</b></p>
        <${Drawer} bind="${navOpen}" title="Navigation"
            onopen="${() => note('left → onopen')}"
            onclose="${(o: string) => note('left → onclose(' + o + ')')}">
            <ul class="nav">
                <li><a href="#inbox">Inbox</a></li>
                <li><a href="#starred">Starred</a></li>
                <li><a href="#sent">Sent</a></li>
                <li><a href="#drafts">Drafts</a></li>
                <li><a href="#trash">Trash</a></li>
            </ul>
        </${Drawer}>

        <h3>Right drawer (api, width 360)</h3>
        <button onclick="${() => right?.open()}">open right</button>
        <${Drawer} anchor="right" width="360" title="Details"
            ref="${(a: Api) => (right = a)}"
            onopen="${() => note('right → onopen')}"
            onclose="${(o: string) => note('right → onclose(' + o + ')')}">
            <p>A wider panel sliding in from the right — backdrop click or Escape closes it.</p>
            <p>Modal provides the full-height side panel; the drawer adds the chrome.</p>
        </${Drawer}>

        <h3>Bottom sheet</h3>
        <button onclick="${() => bottom?.toggle()}">toggle bottom sheet</button>
        <${Drawer} anchor="bottom" title="Share"
            ref="${(a: Api) => (bottom = a)}"
            onclose="${(o: string) => note('bottom → onclose(' + o + ')')}">
            <p>The bottom anchor maps to Modal's sheet mode: full width, rounded top corners.</p>
        </${Drawer}>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
