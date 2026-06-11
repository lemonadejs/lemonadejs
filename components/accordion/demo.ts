/**
 * Local playground for <Accordion /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, store, type Component } from 'lemonadejs';
import Accordion, { type AccordionItem, type Expanded } from '@lemonadejs/accordion';

// One call, zero options: the contract derives <lm-accordion> entirely
createWebComponent(Accordion);

const App: Component = (props, { state }) => {
    const expanded = store<Expanded>(0);
    const open = store<number[]>([0]);
    const options = state<AccordionItem[]>([
        { title: 'General', content: 'Plain text content — trusted text, rendered as text.' },
        { title: 'Advanced', content: 'Exclusive mode: opening this closes the others.' },
        { title: 'Danger zone', content: 'Click an open header to collapse everything.', disabled: false },
    ]);
    const log = state<string[]>([]);
    const note = (entry: string) => (log.value = [...log.value, entry]);

    return html`<div class="demo">
        <h1>&lt;Accordion /&gt;</h1>

        <h3>Bound (two-way), exclusive</h3>
        <${Accordion} options="${options}" bind="${expanded}"
            onchange="${(next: Expanded, old: Expanded) => note('onchange → ' + JSON.stringify(next) + ' (was ' + JSON.stringify(old) + ')')}" />
        <p>Bound index: <b>${() => JSON.stringify(expanded.value)}</b></p>
        <button onclick="${() => (expanded.value = 1)}">open #1 from outside (no onchange echo)</button>
        <button onclick="${() => (expanded.value = -1)}">collapse all from outside</button>
        <button onclick="${() => (options.value = [...options.value, { title: 'Added ' + (Date.now() % 1000), content: 'Live options: panels follow the data.' }])}">add a panel (live options)</button>

        <h3>Multiple — bind is an array of open indices</h3>
        <${Accordion} multiple bind="${open}"
            options="${[
                { title: 'Shipping', content: 'Several panels can stay open at once.' },
                { title: 'Billing', content: 'Each header toggles independently.' },
                { title: 'Returns', content: 'The bound state holds the open indices.' },
            ]}"
            onchange="${(next: number[]) => note('multiple onchange → [' + next.join(', ') + ']')}" />
        <p>Open indices: <b>${() => '[' + open.value.join(', ') + ']'}</b></p>

        <h3>render prop — rich panel bodies that KEEP STATE across toggles</h3>
        <${Accordion}
            options="${[
                { title: 'Type something, close me, reopen me' },
                { title: 'Second editor' },
            ]}"
            render="${(item: AccordionItem, index: number) => html`<p>
                Panel <b>${String(index)}</b> body is a live view — it never unmounts on collapse:
                <input placeholder="state survives toggles" />
            </p>`}" />

        <h3>Disabled panel</h3>
        <${Accordion}
            options="${[
                { title: 'Available', content: 'This one opens.' },
                { title: 'Locked (disabled)', content: 'Never visible.', disabled: true },
                { title: 'Keyboard: focus a header, use ArrowUp/ArrowDown', content: 'Disabled headers are skipped.' },
            ]}" />

        <h3>Web component — the same block as &lt;lm-accordion&gt;</h3>
        <lm-accordion ref="${(el: HTMLElement & { options: AccordionItem[] }) => {
            el.options = [
                { title: 'A real custom element', content: 'Array props flow in as element PROPERTIES.' },
                { title: 'Events out', content: 'bind changes dispatch a change CustomEvent.' },
            ];
        }}" onchange="${(e: Event) => note('lm-accordion change event → ' + JSON.stringify((e as CustomEvent).detail))}"></lm-accordion>

        <h3>onchange log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
