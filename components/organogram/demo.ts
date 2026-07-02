/**
 * Local playground for <Organogram /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, store, type Component } from 'lemonadejs';
import Organogram, { type OrgItem, type OrgId } from '@lemonadejs/organogram';

// One call, zero options: the contract derives <lm-organogram> entirely
createWebComponent(Organogram);

const people = (): OrgItem[] => [
    { id: 1, name: 'Jorge', role: 'CEO', parent: 0, status: '#90EE90', img: '/plugins/images/ceo.png' },
    { id: 2, name: 'Antonio', role: 'Vice president', parent: 1, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 3, name: 'Manoel', role: 'Production manager', parent: 1, status: '#D3D3D3', img: '/plugins/images/no-user.jpg' },
    { id: 4, name: 'Pedro', role: 'Intern', parent: 3, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 5, name: 'Carlos', role: 'Intern', parent: 3, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 6, name: 'Marcos', role: 'Marketing manager', parent: 2, status: '#D3D3D3', img: '/plugins/images/no-user.jpg' },
    { id: 7, name: 'Ana', role: 'Sales manager', parent: 2, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 8, name: 'Nicolly', role: 'Operations manager', parent: 2, status: '#D3D3D3', img: '/plugins/images/no-user.jpg' },
    { id: 9, name: 'Paulo', role: 'Sales assistant', parent: 7, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 10, name: 'Iris', role: 'Sales assistant', parent: 7, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 11, name: 'John', role: 'Operations manager', parent: 1, status: '#D3D3D3', img: '/plugins/images/no-user.jpg' },
    { id: 12, name: 'Carl', role: 'Intern', parent: 11, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 13, name: 'Paul', role: 'Intern', parent: 11, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
    { id: 14, name: 'Jeorge', role: 'Intern', parent: 11, status: '#D3D3D3', img: '/plugins/images/no-user.jpg' },
    { id: 15, name: 'Luke', role: 'Intern', parent: 11, status: '#90EE90', img: '/plugins/images/no-user.jpg' },
];

const labels = { '#90EE90': 'Active', '#D3D3D3': 'On leave' };

const App: Component = (props, { state }) => {
    const selected = store<OrgId>('');
    const data = store(people());
    const horizontal = state(false);
    const compact = store(true);
    const log = state<string[]>([]);
    const note = (entry: string) => (log.value = [...log.value, entry]);

    let api!: {
        center: (id: OrgId) => void; fit: () => void; select: (id: OrgId) => void;
        expandAll: () => void; collapseAll: () => void; zoomIn: () => void; zoomOut: () => void;
    };

    return html`<div class="demo">
        <h1>&lt;Organogram /&gt;</h1>
        <p>Drag the background to pan, scroll to zoom (anchored at the cursor), search to fly to a person,
           and use the &minus;/+ pill on a card to collapse a branch.</p>

        <${Organogram}
            data="${data}"
            bind="${selected}"
            orientation="${() => (horizontal.value ? 'horizontal' : '')}"
            compact="${compact}"
            legend="${true}"
            statuslabels="${labels}"
            ref="${(a: typeof api) => (api = a)}"
            onchange="${(id: OrgId, node: OrgItem) => note('select → ' + id + ' (' + node.name + ')')}"
            oncollapse="${(id: OrgId, c: boolean) => note('branch ' + id + ' ' + (c ? 'collapsed' : 'expanded'))}" />

        <p>Selected: <b>${() => String(selected.value || '—')}</b></p>
        <button onclick="${() => (compact.value = !compact.value)}">toggle compact (stack leaf reports)</button>
        <button onclick="${() => (horizontal.value = !horizontal.value)}">toggle orientation</button>
        <button onclick="${() => api.center(11)}">center on John (id 11)</button>
        <button onclick="${() => api.select(7)}">select Ana (id 7)</button>
        <button onclick="${() => api.collapseAll()}">collapse all</button>
        <button onclick="${() => api.expandAll()}">expand all</button>
        <button onclick="${() => api.fit()}">fit</button>

        <h3>Web component — the same block as &lt;lm-organogram&gt;</h3>
        <lm-organogram style="display:block" data="${people()}" search="${false}"></lm-organogram>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
