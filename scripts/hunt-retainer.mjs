/**
 * TEMPORARY forensic tool: reproduce the retention, snapshot the heap,
 * and print the retainer chain from a GC root to the tagged object.
 * Run: node --expose-gc scripts/hunt-retainer.mjs
 */
import esbuild from 'esbuild';
import { JSDOM } from 'jsdom';
import v8 from 'node:v8';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.join(import.meta.dirname, '..');

// ---- 1. Bundle the scenario against the live source
const tmp = path.join(root, '.hunt.tmp.mjs');
await esbuild.build({
    stdin: {
        contents: `
import Modal from ${JSON.stringify(path.join(root, 'components', 'modal', 'modal.ts').replace(/\\/g, '/'))};
import { mount } from ${JSON.stringify(path.join(root, 'src', 'index.ts').replace(/\\/g, '/'))};
export const run = () => {
    let api = null;
    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    const handle = mount(Modal, rootEl, { focus: false, ref: (a) => (api = a) });
    api.open();
    document.querySelector('.lm-modal-header');   // the retention trigger
    api.close();
    handle.unmount();
    rootEl.remove();
    api.__LEAK_HUNT_TARGET__ = true;
    return api;
};`,
        resolveDir: root,
        loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    outfile: tmp,
    target: 'es2020',
    define: { __DEV__: 'true' },
});

// ---- 2. jsdom globals
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://localhost' });
for (const k of ['document', 'HTMLElement', 'Element', 'Node', 'Text', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'FocusEvent', 'customElements', 'localStorage', 'navigator', 'window']) {
    try { globalThis[k] = k === 'window' ? dom.window : dom.window[k]; } catch {}
}

// ---- 3. Reproduce, release, collect
const mod = await import(pathToFileURL(tmp).href);
new WeakRef(mod.run()); // no binding anywhere
fs.unlinkSync(tmp);
for (let i = 0; i < 5; i++) {
    globalThis.gc();
    await new Promise((r) => setTimeout(r, 1));
}

// ---- 4. Snapshot and parse
const snapFile = path.join(root, '.hunt.heapsnapshot');
v8.writeHeapSnapshot(snapFile);
const snap = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
fs.unlinkSync(snapFile);

const meta = snap.snapshot.meta;
const NF = meta.node_fields.length;
const EF = meta.edge_fields.length;
const nodes = snap.nodes;
const edges = snap.edges;
const strings = snap.strings;
const nodeTypes = meta.node_types[0];
const edgeTypes = meta.edge_types[0];
const nodeCount = nodes.length / NF;

const F = Object.fromEntries(meta.node_fields.map((f, i) => [f, i]));
const E = Object.fromEntries(meta.edge_fields.map((f, i) => [f, i]));

// Per-node first-edge offsets
const firstEdge = new Uint32Array(nodeCount + 1);
for (let i = 0, acc = 0; i < nodeCount; i++) {
    firstEdge[i] = acc;
    acc += nodes[i * NF + F.edge_count] * EF;
    firstEdge[i + 1] = acc;
}

// Find the target: the node owning a property edge named __LEAK_HUNT_TARGET__
let target = -1;
outer: for (let n = 0; n < nodeCount; n++) {
    for (let e = firstEdge[n]; e < firstEdge[n + 1]; e += EF) {
        const type = edgeTypes[edges[e + E.type]];
        if (type === 'property' && strings[edges[e + E.name_or_index]] === '__LEAK_HUNT_TARGET__') {
            target = n;
            break outer;
        }
    }
}
if (target < 0) {
    console.log('COLLECTED — no retention (the object is gone)');
    process.exit(0);
}

// Reverse edges via BFS from target up to a root
const parents = new Map(); // node -> { parent, edgeLabel }
const queue = [target];
parents.set(target, null);
let rootNode = -1;
while (queue.length && rootNode < 0) {
    const current = queue.shift();
    for (let n = 0; n < nodeCount && rootNode < 0; n++) {
        if (parents.has(n)) continue;
        for (let e = firstEdge[n]; e < firstEdge[n + 1]; e += EF) {
            if (edges[e + E.to_node] / NF === current) {
                const eType = edgeTypes[edges[e + E.type]];
                const label = eType === 'element' || eType === 'hidden'
                    ? '[' + edges[e + E.name_or_index] + ']'
                    : strings[edges[e + E.name_or_index]];
                parents.set(n, { child: current, label, eType });
                const nType = nodeTypes[nodes[n * NF + F.type]];
                if (nType === 'synthetic') {
                    rootNode = n;
                } else {
                    queue.push(n);
                }
                break;
            }
        }
    }
}

// Print the chain root → target
const chain = [];
let walk = rootNode;
while (walk !== null && walk !== undefined) {
    const info = parents.get(walk);
    const nType = nodeTypes[nodes[walk * NF + F.type]];
    const nName = strings[nodes[walk * NF + F.name]];
    chain.push(nType + ' "' + nName + '"' + (info ? '  --' + info.eType + ':' + info.label + '-->' : ''));
    walk = info ? info.child : null;
    if (walk === target) {
        chain.push('object (THE TARGET api)');
        break;
    }
}
console.log('RETAINED. Chain from GC root to target:');
console.log(chain.join('\n'));
