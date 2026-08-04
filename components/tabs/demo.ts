/**
 * Local playground for <Tabs /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, store, type Component } from 'lemonadejs';
import Tabs, { type TabItem } from '@lemonadejs/tabs';

// One call, zero options: the contract derives <lm-tabs> entirely
createWebComponent(Tabs);

const App: Component = (props, { state }) => {
    const index = store(0);
    const variant = store('modern');
    const log = state<string[]>([]);
    const note = (entry: string) => (log.value = [...log.value, entry]);

    // A long tab set to demonstrate the header overflow scroll
    const many: TabItem[] = Array.from({ length: 14 }, (_, i) => ({
        title: 'Section ' + (i + 1),
        content: '<h4>Section ' + (i + 1) + '</h4><p>The header row scrolls horizontally when the tabs overflow.</p>',
    }));

    let api: { open: (i: number) => void; create: (item: TabItem, position?: number | null, select?: boolean) => void };

    return html`<div class="demo">
        <h1>&lt;Tabs /&gt;</h1>

        <h3>Bound (two-way) + data tabs with content and icons</h3>
        <${Tabs}
            bind="${index}"
            data="${[
                { title: 'Home', icon: 'home', content: '<h4>Home</h4><p>Trusted <b>HTML</b> content. Type here: <input /></p>' },
                { title: 'Profile', icon: 'person', content: '<h4>Profile</h4><p>Panels stay ALIVE across switches — the input on the Home tab keeps its text.</p>' },
                { title: 'Settings', icon: 'settings', content: '<h4>Settings</h4><p>Drag the headers to reorder.</p>' },
            ]}"
            onchange="${(i: number, old: number) => note('onchange → ' + i + ' (was ' + old + ')')}"
            onopen="${(i: number) => note('onopen → ' + i)}"
            onchangeposition="${(from: number, to: number) => note('onchangeposition → ' + from + ' → ' + to)}" />
        <p>Bound index: <b>${() => String(index.value)}</b></p>
        <button onclick="${() => (index.value = (index.value + 1) % 3)}">write from outside (no onchange echo)</button>

        <h3>Style variant (basic / modern / segmented) + animated indicator</h3>
        <button onclick="${() => (variant.value = 'basic')}">basic</button>
        <button onclick="${() => (variant.value = 'modern')}">modern</button>
        <button onclick="${() => (variant.value = 'segmented')}">segmented</button>
        <span> current: <b>${() => variant.value || 'basic'}</b></span>
        <${Tabs}
            variant="${variant}"
            data="${[
                { title: 'Overview', icon: 'dashboard', content: '<h4>Overview</h4><p>Switch the variant above — the panel fades and the modern indicator slides in.</p>' },
                { title: 'Activity', icon: 'bolt', content: '<h4>Activity</h4><p>Same block, two looks.</p>' },
                { title: 'Reports', icon: 'bar_chart', content: '<h4>Reports</h4><p>Animations respect prefers-reduced-motion.</p>' },
            ]}" />

        <h3>Segmented — the modern inset quick-tabs style</h3>
        <${Tabs}
            variant="segmented"
            data="${[
                { title: 'Preview', icon: 'visibility', content: '<p>The strip is a soft well; the selected tab is a raised card.</p>' },
                { title: 'Code', icon: 'code', content: '<p>Same tabs API — only the variant changes.</p>' },
                { title: 'Settings', icon: 'settings', content: '<p>Works with icons, keyboard and drag sorting.</p>' },
            ]}" />

        <h3>Overflow scroll — many tabs (modern), header scrolls horizontally</h3>
        <div style="max-width: 420px; border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px;">
            <${Tabs} variant="modern" data="${many}" />
        </div>

        <h3>Element children as tabs, selected attribute, center position, round</h3>
        <${Tabs} position="center" round>
            <div title="First">The child element IS the panel.</div>
            <div title="Second" selected="true">Initially selected via the selected attribute.</div>
            <div title="Third" data-icon="star">With an icon.</div>
        </${Tabs}>

        <h3>allowcreate + api (open / create) + bottom position</h3>
        <${Tabs}
            allowcreate
            position="bottom"
            data="${[
                { title: 'One', content: 'Headers below the content (position=bottom).' },
                { title: 'Two', content: 'Click the + button to add tabs.' },
            ]}"
            ref="${(a: never) => (api = a)}"
            onbeforecreate="${(item: TabItem) => note('onbeforecreate → ' + item.title)}"
            oncreate="${(item: TabItem, position: number) => note('oncreate → ' + item.title + ' @ ' + position)}" />
        <button onclick="${() => api.open(0)}">api.open(0)</button>
        <button onclick="${() => api.create({ title: 'Made ' + Date.now() % 1000, content: 'via api.create' }, null, true)}">api.create(select)</button>

        <h3>Web component — the same block as &lt;lm-tabs&gt;</h3>
        <lm-tabs selected="1" round="true"
            onchange="${(e: Event) => note('lm-tabs change event → ' + (e as CustomEvent).detail)}">
            <div title="Alpha">A real custom element.</div>
            <div title="Beta">Attributes are live after mount.</div>
        </lm-tabs>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
