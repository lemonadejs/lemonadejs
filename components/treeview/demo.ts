/**
 * Local playground for <TreeView /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, store, type Component } from 'lemonadejs';
import TreeView, { type TreeNode, type TreeNodeId } from '@lemonadejs/treeview';

// One call, zero options: the contract derives <lm-treeview> entirely
createWebComponent(TreeView);

const files = (): TreeNode[] => [
    {
        id: 'src', label: 'src', icon: 'folder', open: true,
        children: [
            { id: 'index', label: 'index.ts', icon: 'description' },
            { id: 'style', label: 'style.css', icon: 'palette' },
            {
                id: 'utils', label: 'utils', icon: 'folder',
                children: [
                    { id: 'walk', label: 'walk.ts', icon: 'description' },
                    { id: 'keys', label: 'keys.ts', icon: 'description' },
                ],
            },
        ],
    },
    {
        id: 'docs', label: 'docs', icon: 'folder',
        children: [{ id: 'readme', label: 'README.md', icon: 'article' }],
    },
    { id: 'pkg', label: 'package.json', icon: 'data_object' },
];

const App: Component = (props, { state }) => {
    const selected = store('index');
    const log = state<string[]>([]);
    const note = (entry: string) => (log.value = [...log.value, entry]);

    const tree = store(files());
    let api!: { open: (id: TreeNodeId) => void; close: (id: TreeNodeId) => void; select: (id: TreeNodeId) => void; toggle: (id: TreeNodeId) => void };
    let n = 0;

    return html`<div class="demo">
        <h1>&lt;TreeView /&gt;</h1>

        <h3>Bound (two-way), icons, recursion to any depth</h3>
        <${TreeView}
            bind="${selected}"
            data="${tree}"
            ref="${(a: typeof api) => (api = a)}"
            onchange="${(id: TreeNodeId, node: TreeNode) => note('onchange → ' + id + ' (' + node.label + ')')}"
            ontoggle="${(id: TreeNodeId, open: boolean) => note('ontoggle → ' + id + ' ' + (open ? 'open' : 'closed'))}" />
        <p>Bound id: <b>${() => String(selected.value)}</b></p>
        <button onclick="${() => (selected.value = 'readme')}">write from outside (no onchange echo)</button>
        <button onclick="${() => api.toggle('src')}">api.toggle('src')</button>
        <button onclick="${() => { api.open('docs'); api.select('readme'); }}">api.open + select readme</button>
        <button onclick="${() => {
            // in-place mutation + touch: keyed diff keeps existing DOM
            tree.value[0].children!.splice(1, 0, { id: 'gen' + ++n, label: 'generated-' + n + '.ts', icon: 'bolt' });
            tree.touch();
        }}">insert a child into src</button>
        <button onclick="${() => { tree.value.reverse(); tree.touch(); }}">reverse the roots (DOM moves)</button>

        <h3>Web component — the same block as &lt;lm-treeview&gt;</h3>
        <lm-treeview
            data="${[
                { id: 'a', label: 'Alpha', open: true, children: [{ id: 'a1', label: 'Nested' }] },
                { id: 'b', label: 'Beta' },
            ]}"
            onchange="${(e: Event) => note('lm-treeview change event → ' + (e as CustomEvent).detail)}"></lm-treeview>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
