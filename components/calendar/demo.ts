/**
 * Local playground for <Calendar /> — served by `npm run dev`
 */
import { html, mount, ref, store, type Component, type Ref } from 'lemonadejs';
import Calendar from '@lemonadejs/calendar';

type Api = {
    open(): void;
    setValue(v: unknown): void;
    reset(): void;
    next(): void;
    prev(): void;
    setView(name: string): void;
};

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value.slice(-8), m]);
    const date = store('2026-06-15');
    const inlineApi: Ref<Api> = ref();

    return html`<div>
        <h1>&lt;Calendar /&gt;</h1>

        <h3>Input + popup, format mask (type digits — separators auto-insert)</h3>
        <div style="width:240px">
            <${Calendar} bind="${date}" format="DD/MM/YYYY" placeholder="DD/MM/YYYY"
                onchange="${(v: unknown) => note('changed: ' + v)}"
                onclose="${(o: string) => note('closed via ' + o)}"></${Calendar}>
        </div>
        <p>bound value: <b>${date}</b></p>

        <h3>Inline, today bold, event markers, Monday start</h3>
        <div style="width:320px;border:1px solid #e4e4e7;border-radius:8px">
            <${Calendar} type="inline" startingday="1"
                data="${[{ date: '2026-06-10', title: 'Review' }, { date: '2026-06-24', title: 'Demo' }]}"
                ref="${inlineApi}"
                onchange="${(v: unknown) => note('inline: ' + v)}"
                onupdate="${(v: string) => note('cursor: ' + v)}"></${Calendar}>
        </div>
        <button onclick="${() => inlineApi.current?.prev()}">prev()</button>
        <button onclick="${() => inlineApi.current?.next()}">next()</button>
        <button onclick="${() => inlineApi.current?.setView('years')}">setView('years')</button>
        <button onclick="${() => inlineApi.current?.setValue('2026-12-25')}">setValue('2026-12-25')</button>
        <button onclick="${() => inlineApi.current?.reset()}">reset()</button>

        <h3>Range (two clicks + Done), inline</h3>
        <div style="width:320px;border:1px solid #e4e4e7;border-radius:8px">
            <${Calendar} type="inline" range
                onchange="${(v: unknown) => note('range: ' + JSON.stringify(v))}"></${Calendar}>
        </div>

        <h3>Date and time (a day click holds the panel open; Update commits)</h3>
        <div style="width:240px">
            <${Calendar} time bind="${store('2026-06-15 09:30:00')}"
                onchange="${(v: unknown) => note('datetime: ' + v)}"></${Calendar}>
        </div>

        <h3>min/max + weekends disabled</h3>
        <div style="width:240px">
            <${Calendar} min="2026-06-05" max="2026-07-20" bind="${store('2026-06-15')}"
                validate="${(d: number, m: number, y: number) => [0, 6].includes(new Date(y, m, d).getDay())}"
                onchange="${(v: unknown) => note('bounded: ' + v)}"></${Calendar}>
        </div>

        <h3>Numeric (Excel serial) + grid lines, inline</h3>
        <div style="width:320px;border:1px solid #e4e4e7;border-radius:8px">
            <${Calendar} type="inline" numeric grid bind="${store(46188)}"
                onchange="${(v: unknown) => note('serial: ' + v)}"></${Calendar}>
        </div>

        <h3>Picker (bottom sheet) and auto</h3>
        <div style="width:240px">
            <${Calendar} type="picker" placeholder="Bottom sheet…"
                onchange="${(v: unknown) => note('picker: ' + v)}"></${Calendar}>
        </div>

        <h3>Event log</h3>
        <pre style="font-size:12px">${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
