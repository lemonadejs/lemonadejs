/**
 * Diff two Chrome .heapsnapshot files: aggregate node count + self size
 * per constructor name, print the biggest deltas, and flag detached DOM.
 *
 *   node scripts/diff-snapshots.mjs A.heapsnapshot B.heapsnapshot
 */
import { readFileSync } from 'node:fs';

const load = (file) => {
    const snap = JSON.parse(readFileSync(file, 'utf8'));
    const meta = snap.snapshot.meta;
    const fields = meta.node_fields; // e.g. [type, name, id, self_size, edge_count, ...]
    const types = meta.node_types[fields.indexOf('type')];
    const NAME = fields.indexOf('name');
    const TYPE = fields.indexOf('type');
    const SIZE = fields.indexOf('self_size');
    const stride = fields.length;
    const nodes = snap.nodes;
    const strings = snap.strings;

    const agg = new Map(); // key -> { count, size }
    let total = 0;
    let detachedCount = 0;
    let detachedSize = 0;

    for (let i = 0; i < nodes.length; i += stride) {
        const type = types[nodes[i + TYPE]];
        const name = strings[nodes[i + NAME]];
        const size = nodes[i + SIZE];
        total += size;

        // Group: objects by constructor, everything else by its node type
        const key =
            type === 'object' || type === 'native'
                ? name
                : type === 'closure'
                  ? `(closure) ${name}`
                  : `(${type})`;
        const e = agg.get(key) || { count: 0, size: 0 };
        e.count++;
        e.size += size;
        agg.set(key, e);

        if (name && name.startsWith('Detached')) {
            detachedCount++;
            detachedSize += size;
        }
    }
    return { agg, total, detachedCount, detachedSize };
};

const [, , fileA, fileB] = process.argv;
const A = load(fileA);
const B = load(fileB);

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

console.log(`A total: ${mb(A.total)}   detached DOM: ${A.detachedCount} nodes, ${kb(A.detachedSize)}`);
console.log(`B total: ${mb(B.total)}   detached DOM: ${B.detachedCount} nodes, ${kb(B.detachedSize)}`);
console.log(`delta:   ${mb(B.total - A.total)}\n`);

const keys = new Set([...A.agg.keys(), ...B.agg.keys()]);
const rows = [];
for (const k of keys) {
    const a = A.agg.get(k) || { count: 0, size: 0 };
    const b = B.agg.get(k) || { count: 0, size: 0 };
    if (b.size !== a.size || b.count !== a.count) {
        rows.push({ k, dCount: b.count - a.count, dSize: b.size - a.size, bCount: b.count, bSize: b.size });
    }
}
rows.sort((x, y) => Math.abs(y.dSize) - Math.abs(x.dSize));

console.log('Top deltas (B - A), by size:');
console.log('Δsize'.padStart(12), 'Δcount'.padStart(8), 'B count'.padStart(9), '  constructor');
for (const r of rows.slice(0, 35)) {
    console.log(kb(r.dSize).padStart(12), String(r.dCount).padStart(8), String(r.bCount).padStart(9), ' ', r.k);
}
