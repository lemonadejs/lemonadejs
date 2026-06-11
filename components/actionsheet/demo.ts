/**
 * Local playground for <Actionsheet /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Actionsheet, { type ActionsheetGroup, type ActionsheetOption } from '@lemonadejs/actionsheet';

// One call, zero options: the contract derives <lm-actionsheet> entirely
createWebComponent(Actionsheet);

type Api = {
    open(): void;
    close(): void;
    toggle(): void;
    isOpened(): boolean;
};

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const opened = state(false);
    let api: Api | null = null;
    let closableApi: Api | null = null;

    const report = (line: string) => (log.value = [...log.value, line]);

    const pick = (option: ActionsheetOption) => {
        report('onclick → ' + option.title);
        api?.close(); // v5 idiom: the consumer closes the sheet
    };

    const shareActions: ActionsheetGroup[] = [
        {
            options: [
                { title: 'Share', onclick: pick },
                { title: 'Duplicate', onclick: pick },
                { title: 'Delete', className: 'demo-danger', onclick: pick },
            ],
        },
        {
            options: [{ title: 'Cancel', action: 'cancel', onclick: pick }],
        },
    ];

    const closableActions: ActionsheetGroup[] = [
        {
            options: [
                { title: 'Mark as read', onclick: (o) => report('onclick → ' + o.title) },
                { title: 'Archive', onclick: (o) => report('onclick → ' + o.title) },
            ],
        },
    ];

    return html`<div class="demo">
        <h1>&lt;Actionsheet /&gt;</h1>

        <h3>API-driven (v5 show/hide flow) — options close it themselves</h3>
        <${Actionsheet} actions="${shareActions}" ref="${(a: Api) => (api = a)}"
            onopen="${() => report('onopen')}"
            onclose="${(origin: string) => report('onclose ← ' + origin)}" />
        <button onclick="${() => api?.open()}">api.open()</button>
        <button onclick="${() => report('api.isOpened() = ' + api?.isOpened())}">api.isOpened()</button>

        <h3>closable + title/message — backdrop click or Escape closes</h3>
        <${Actionsheet} actions="${closableActions}" closable
            title="Inbox actions" message="Pick what happens to the conversation"
            ref="${(a: Api) => (closableApi = a)}"
            onclose="${(origin: string) => report('closable sheet onclose ← ' + origin)}" />
        <button onclick="${() => closableApi?.open()}">open closable sheet</button>

        <h3>Bound (two-way) — the open state is just a boolean</h3>
        <${Actionsheet} bind="${opened}" closable
            actions="${[{ options: [{ title: 'Close me from the backdrop', action: 'cancel' }] }]}" />
        <button onclick="${() => (opened.value = true)}">opened.value = true</button>
        <p>Bound value: <b>${() => String(opened.value)}</b></p>

        <h3>Web component — the same block as &lt;lm-actionsheet&gt;</h3>
        <lm-actionsheet closable title="Custom element"
            onclose="${(e: Event) => report('lm-actionsheet close event ← ' + (e as CustomEvent).detail)}"></lm-actionsheet>
        <button onclick="${() => {
            const el = document.querySelector('lm-actionsheet') as HTMLElement & {
                actions: ActionsheetGroup[];
                value: boolean;
            };
            el.actions = [{ options: [{ title: 'Set through a real element property' }] }];
            el.value = true; // the core-of-HTML surface: a real element property
        }}">open via el.value property</button>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
