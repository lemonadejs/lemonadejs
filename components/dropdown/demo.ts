/**
 * Local playground for <Dropdown /> — served by `npm run dev`
 */
import { html, mount, ref, store, type Component, type Ref } from 'lemonadejs';
import Dropdown, { type DropdownItem } from '@lemonadejs/dropdown';

type Api = { open(): void; getValue(): unknown; setValue(v: unknown): void; reset(): void };

const countries: DropdownItem[] = [
    { value: 'br', text: 'Brazil', group: 'America', keywords: ['samba', 'rio'] },
    { value: 'us', text: 'United States', group: 'America' },
    { value: 'ca', text: 'Canada', group: 'America' },
    { value: 'pt', text: 'Portugal', group: 'Europe', synonym: 'lusitania' },
    { value: 'de', text: 'Germany', group: 'Europe' },
    { value: 'fr', text: 'France', group: 'Europe' },
    { value: 'jp', text: 'Japan', group: 'Asia' },
    { value: 'kr', text: 'South Korea', group: 'Asia' },
    { value: 'xx', text: 'Atlantis', disabled: true },
];

const big = Array.from({ length: 10000 }, (_, i) => ({ value: i, text: 'Option ' + (i + 1) }));

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-8), m]);
    const team = store('');
    const multi: Ref<Api> = ref();

    return html`<div>
        <h1>&lt;Dropdown /&gt;</h1>

        <h3>Single, groups, keyboard (arrows/Enter/Escape)</h3>
        <div style="width:280px">
            <${Dropdown} data="${countries}" bind="${team}" placeholder="Pick a country"
                onchange="${(v: unknown) => note('changed: ' + v)}"
                onclose="${(o: string) => note('closed via ' + o)}"></${Dropdown}>
        </div>
        <p>bound value: <b>${team}</b></p>

        <h3>Multiple + autocomplete + insert (type to filter; + adds)</h3>
        <div style="width:340px">
            <${Dropdown} ref="${multi}" data="${[...countries]}" multiple autocomplete insert
                placeholder="Select several..."
                onchange="${(v: unknown) => note('multiple: ' + JSON.stringify(v))}"
                oninsert="${(item: DropdownItem) => note('inserted: ' + item.text)}"></${Dropdown}>
        </div>
        <button onclick="${() => multi.current?.setValue('br;jp')}">setValue('br;jp')</button>
        <button onclick="${() => multi.current?.reset()}">reset()</button>

        <h3>10,000 options — virtualized panel</h3>
        <div style="width:280px">
            <${Dropdown} data="${big}" autocomplete placeholder="Type a number..."
                onchange="${(v: unknown) => note('big: ' + v)}"></${Dropdown}>
        </div>

        <h3>Inline (no modal)</h3>
        <div style="width:280px">
            <${Dropdown} data="${countries.slice(0, 6)}" type="inline" height="160"
                onchange="${(v: unknown) => note('inline: ' + v)}"></${Dropdown}>
        </div>

        <h3>Event log</h3>
        <pre style="font-size:12px">${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
