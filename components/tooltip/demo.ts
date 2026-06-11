/**
 * Local playground for <Tooltip /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Tooltip from '@lemonadejs/tooltip';

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    const liveTitle = state('I update live');

    return html`<div class="demo">
        <h1>&lt;Tooltip /&gt;</h1>

        <h3>Four sides</h3>
        <div class="row">
            <${Tooltip} title="I am on top" position="top"><button>Top</button></${Tooltip}>
            <${Tooltip} title="I am below" position="bottom"><button>Bottom</button></${Tooltip}>
            <${Tooltip} title="I am on the left" position="left"><button>Left</button></${Tooltip}>
            <${Tooltip} title="I am on the right" position="right"><button>Right</button></${Tooltip}>
        </div>

        <h3>Flipping at the viewport edge</h3>
        <p>These ask for a side that does not fit — the popper flips to the opposite side.</p>
        <div class="row">
            <${Tooltip} title="Asked for top, flipped to bottom near the top edge" position="top">
                <button onclick="${() => window.scrollTo(0, 0)}">Scroll to top, then hover me</button>
            </${Tooltip}>
        </div>

        <h3>Options</h3>
        <div class="row">
            <${Tooltip} title="No arrow on this one" arrow="${false}"><button>arrow=false</button></${Tooltip}>
            <${Tooltip} title="Took 600ms to appear" delay="600"><button>delay=600</button></${Tooltip}>
            <${Tooltip} title="You will never see me" disabled><button>disabled</button></${Tooltip}>
            <${Tooltip} title="Focus works too — Tab to me, Escape hides"><button>focus/Escape</button></${Tooltip}>
        </div>

        <h3>Live title</h3>
        <div class="row">
            <${Tooltip} title="${liveTitle}"><button>Hover and type below</button></${Tooltip}>
            <input type="text" bind="${liveTitle}" />
        </div>

        <h3>Events</h3>
        <div class="row">
            <${Tooltip} title="Watch the log" onopen="${() => note('onopen')}" onclose="${() => note('onclose')}">
                <button>onopen / onclose</button>
            </${Tooltip}>
        </div>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
