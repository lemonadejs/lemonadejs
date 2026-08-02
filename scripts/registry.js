/**
 * npm run registry — the docs/COLLABORATE.md phase-1 generator and gate
 *
 * For every components/<name>/<name>.ts:
 *   - extracts the contract → components/<name>/contract.json
 *   - runs verify() in jsdom → components/<name>/verify.json
 *   - aggregates everything → components/registry.json (the search index
 *     an agent reads in one request)
 *
 * THE GATE: any component whose verify() fails breaks the build.
 * Rule 2 of the commons: verify() must pass — enforced, not reviewed.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');
const { aliasPlugin } = require('./lemonade-alias');

const root = path.join(__dirname, '..');
const componentsDir = path.join(root, 'components');

const slash = function (p) {
    return p.replace(/\\/g, '/');
};

const TS_TYPES = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
    function: '(...args: unknown[]) => unknown',
    any: 'unknown',
};

const cap = function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * The .d.ts is a PROJECTION of the contract — generated, never written
 * by hand. TS humans get editor types, agents get contract.json, both
 * from the same source of truth.
 */
const generateDts = function (schema) {
    const n = cap(schema.name);
    const lines = [
        '/**',
        ' * GENERATED from contract.json by `npm run registry` — do not edit.',
        ' */',
        "import type { Bindable, Component, State } from 'lemonadejs';",
        '',
    ];
    if (schema.api.length) {
        lines.push('export interface ' + n + 'Api {');
        for (const method of schema.api) {
            lines.push('    ' + method + ': (...args: unknown[]) => unknown;');
        }
        lines.push('}', '');
    }
    const ext = schema.bind ? ' extends Bindable<' + TS_TYPES[schema.bind.type] + '>' : '';
    lines.push('export interface ' + n + 'Props' + ext + ' {');
    for (const key of Object.keys(schema.props)) {
        lines.push('    ' + key + '?: State<' + TS_TYPES[schema.props[key].type] + '> | ' + TS_TYPES[schema.props[key].type] + ';');
    }
    for (const event of schema.events) {
        if (event !== 'onchange' || !schema.bind) {
            lines.push('    ' + event + '?: (...args: unknown[]) => void;');
        }
    }
    if (schema.api.length) {
        lines.push('    ref?: ((api: ' + n + 'Api) => void) | { current: ' + n + 'Api | null };');
    }
    lines.push('}', '');
    lines.push('export declare const ' + n + ': Component<' + n + 'Props>;');
    lines.push('export default ' + n + ';');
    return lines.join('\n') + '\n';
};

const main = async function () {
    // verify() needs a DOM
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://localhost' });
    const w = dom.window;
    globalThis.window = w;
    for (const key of [
        'document', 'HTMLElement', 'Element', 'Node', 'Text', 'Event', 'CustomEvent',
        'KeyboardEvent', 'customElements', 'localStorage', 'navigator',
    ]) {
        try {
            globalThis[key] = w[key];
        } catch (e) {
            // navigator is read-only on some node versions — already compatible
        }
    }

    const registry = [];
    let failed = false;

    for (const dir of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) {
            continue;
        }
        const name = dir.name;
        const entry = path.join(componentsDir, name, 'src', 'index.ts');
        if (!fs.existsSync(entry)) {
            continue;
        }

        const tmp = path.join(componentsDir, name, '.registry.tmp.mjs');
        await esbuild.build({
            stdin: {
                contents:
                    'import C from ' + JSON.stringify(slash(entry)) + ';\n' +
                    'import { contract } from ' + JSON.stringify(slash(path.join(root, 'src', 'index.ts'))) + ';\n' +
                    'import { verify } from ' + JSON.stringify(slash(path.join(root, 'src', 'test.ts'))) + ';\n' +
                    'export const run = () => ({ schema: contract(C), report: verify(C) });\n',
                resolveDir: root,
                loader: 'ts',
            },
            bundle: true,
            format: 'esm',
            outfile: tmp,
            target: 'es2020',
            define: { __DEV__: 'true' },
            plugins: [aliasPlugin],
        });

        try {
            const mod = await import(pathToFileURL(tmp).href + '?v=' + Date.now());
            const { schema, report } = mod.run();
            fs.writeFileSync(path.join(componentsDir, name, 'contract.json'), JSON.stringify(schema, null, 4) + '\n');
            fs.writeFileSync(path.join(componentsDir, name, 'verify.json'), JSON.stringify(report, null, 4) + '\n');
            // The generated d.ts ships with the package (dist/), while the
            // monorepo itself gets real types from the source via tsconfig paths
            const dist = path.join(componentsDir, name, 'dist');
            fs.mkdirSync(dist, { recursive: true });
            fs.writeFileSync(path.join(dist, 'index.d.ts'), generateDts(schema));
            registry.push({
                name: schema.name,
                path: 'components/' + name,
                verified: report.pass,
                checks: report.checks.length,
                contract: schema,
            });
            console.log((report.pass ? 'PASS' : 'FAIL') + '  ' + name + '  (' + report.checks.length + ' checks)');
            if (!report.pass) {
                failed = true;
                console.log(JSON.stringify(report.checks.filter((c) => !c.pass), null, 2));
            }
        } finally {
            fs.unlinkSync(tmp);
        }
    }

    fs.writeFileSync(path.join(componentsDir, 'registry.json'), JSON.stringify(registry, null, 4) + '\n');
    console.log('registry.json: ' + registry.length + ' component(s)');

    if (failed) {
        console.error('REGISTRY GATE FAILED: verify() must pass before a block enters the commons');
        process.exit(1);
    }
};

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
