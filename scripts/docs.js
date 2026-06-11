/**
 * npm run docs — generates README.md for every block, synthesized from
 * the artifacts that are already maintained:
 *
 *   - the source header JSDoc      → Overview (the real feature docs)
 *   - the contract literal         → Props table WITH the inline
 *                                    per-prop comments as descriptions
 *   - contract.json / verify.json  → types, defaults, events, api,
 *                                    the verification badge
 *   - package.json                 → name, description, dependencies
 *
 * READMEs ship with the npm packages automatically. Run after
 * `npm run registry` (it consumes contract.json/verify.json).
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const componentsDir = path.join(root, 'components');

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** The header JSDoc of src/index.ts, de-starred */
const extractOverview = function (source) {
    const m = source.match(/^\/\*\*([\s\S]*?)\*\//);
    if (!m) {
        return '';
    }
    return m[1]
        .split('\n')
        .map((line) => line.replace(/^\s*\* ?/, ''))
        .join('\n')
        .trim();
};

/** Inline comments from the contract literal: key: default, // comment */
const extractPropComments = function (source) {
    const comments = {};
    const block = source.match(/component\([\s\S]*?\}, \(props/);
    if (!block) {
        return comments;
    }
    for (const line of block[0].split('\n')) {
        const m = line.match(/^\s{4}([a-z]+):.*?\/\/\s*(.*)$/);
        if (m) {
            comments[m[1]] = m[2].trim();
        }
    }
    return comments;
};

const typeName = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    array: 'array',
    object: 'object',
    function: 'function',
    any: 'any',
};

const renderDefault = function (v) {
    if (v === undefined || v === null) {
        return '—';
    }
    if (Array.isArray(v)) {
        return v.length ? '`' + JSON.stringify(v) + '`' : '`[]`';
    }
    if (v === '') {
        return "`''`";
    }
    return '`' + JSON.stringify(v) + '`';
};

const generate = function (name) {
    const base = path.join(componentsDir, name);
    const pkgPath = path.join(base, 'package.json');
    const contractPath = path.join(base, 'contract.json');
    const sourcePath = path.join(base, 'src', 'index.ts');
    if (!fs.existsSync(pkgPath) || !fs.existsSync(contractPath) || !fs.existsSync(sourcePath)) {
        return false;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const schema = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const verifyPath = path.join(base, 'verify.json');
    const report = fs.existsSync(verifyPath) ? JSON.parse(fs.readFileSync(verifyPath, 'utf8')) : null;
    const source = fs.readFileSync(sourcePath, 'utf8');
    const overview = extractOverview(source);
    const comments = extractPropComments(source);
    const N = cap(name);

    const deps = Object.keys(pkg.dependencies || {});
    const lines = [];

    lines.push('# `<' + N + ' />` — ' + pkg.name);
    lines.push('');
    lines.push(pkg.description || '');
    lines.push('');
    if (report) {
        lines.push(
            (report.pass ? '**✓ verified**' : '**✗ verify failing**') +
                ' — ' +
                report.checks.length +
                ' contract checks · framework-agnostic · zero dependencies' +
                (deps.length ? ' beyond ' + deps.map((d) => '`' + d + '`').join(', ') : '')
        );
        lines.push('');
    }

    lines.push('## Overview');
    lines.push('');
    lines.push(overview || '_See the source header._');
    lines.push('');

    lines.push('## Install');
    lines.push('');
    lines.push('```bash');
    lines.push('npm install ' + pkg.name);
    lines.push('```');
    lines.push('');
    lines.push('```js');
    lines.push("import " + N + " from '" + pkg.name + "';");
    lines.push("import '" + pkg.name + "/style.css';");
    deps.forEach((d) => lines.push("import '" + d + "/style.css'; // composed primitive"));
    lines.push('```');
    lines.push('');

    lines.push('## Usage');
    lines.push('');
    lines.push('```js');
    lines.push("import { html, mount } from 'lemonadejs';");
    lines.push('');
    lines.push('const App = () => html`<div>');
    lines.push('    <${' + N + '} />');
    lines.push('</div>`;');
    lines.push('');
    lines.push("mount(App, document.getElementById('root'));");
    lines.push('```');
    lines.push('');
    lines.push('Three deployment forms, one component:');
    lines.push('');
    lines.push('```js');
    lines.push('html`<${' + N + '} />`                       // by value (no registration)');
    lines.push('setComponents({ ' + N + ' });               // then <' + N + ' /> by name anywhere');
    lines.push('createWebComponent(' + N + ');              // <lm-' + name + '> in plain HTML/any framework');
    lines.push('```');
    lines.push('');

    const propKeys = Object.keys(schema.props || {});
    if (schema.bind || propKeys.length) {
        lines.push('## Props');
        lines.push('');
        lines.push('Every declared prop arrives as a **live state** — pass a value for a snapshot or a');
        lines.push('state for a two-way live wire. Attribute strings are coerced to the declared type.');
        lines.push('');
        lines.push('| Prop | Type | Default | Description |');
        lines.push('|---|---|---|---|');
        if (schema.bind) {
            lines.push(
                '| `bind` | ' +
                    (typeName[schema.bind.type] || schema.bind.type) +
                    ' | ' +
                    renderDefault(schema.bind.default) +
                    ' | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. ' +
                    (comments.bind || '') +
                    ' |'
            );
        }
        for (const key of propKeys) {
            const p = schema.props[key];
            lines.push(
                '| `' +
                    key +
                    '` | ' +
                    (typeName[p.type] || p.type) +
                    ' | ' +
                    renderDefault(p.default) +
                    ' | ' +
                    (comments[key] || '') +
                    ' |'
            );
        }
        lines.push('');
    }

    if ((schema.events || []).length) {
        lines.push('## Events');
        lines.push('');
        lines.push('All event names are lowercase (the platform convention — LJS-305 warns otherwise).');
        lines.push('');
        for (const event of schema.events) {
            lines.push('- `' + event + '`' + (comments[event] ? ' — ' + comments[event] : ''));
        }
        lines.push('');
    }

    if ((schema.api || []).length) {
        lines.push('## API (via `ref`)');
        lines.push('');
        lines.push('```js');
        lines.push("import { ref } from 'lemonadejs';");
        lines.push('const ' + name + ' = ref();');
        lines.push('html`<${' + N + '} ref="${' + name + '}" />`;');
        lines.push('// ' + schema.api.map((m) => name + '.current.' + m + '(...)').join('  ·  '));
        lines.push('```');
        lines.push('');
        for (const method of schema.api) {
            lines.push('- `' + method + '()`' + (comments[method] ? ' — ' + comments[method] : ''));
        }
        lines.push('');
    }

    lines.push('## Styling');
    lines.push('');
    lines.push('All classes follow the `lm-' + name + '-*` convention; visual variants are `data-*`');
    lines.push('attributes on the root. Override freely — there is no styling engine to fight.');
    lines.push('');
    lines.push('## Contract');
    lines.push('');
    lines.push('The machine-readable schema ships with the package:');
    lines.push('');
    lines.push('```js');
    lines.push("import contract from '" + pkg.name + "/contract.json';");
    lines.push('```');
    lines.push('');
    lines.push('`verify.json` carries the conformance proof produced by `verify(' + N + ')`.');
    lines.push('');

    fs.writeFileSync(path.join(base, 'README.md'), lines.join('\n'));
    return { name, description: pkg.description, checks: report ? report.checks.length : 0 };
};

const main = function () {
    const index = [];
    for (const dir of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (dir.isDirectory()) {
            const entry = generate(dir.name);
            if (entry) {
                index.push(entry);
                console.log('README: ' + dir.name);
            }
        }
    }

    // The catalog index
    const lines = [
        '# LemonadeJS Studio — the block catalog',
        '',
        index.length + ' contract-verified blocks. Every block: a publishable npm package,',
        'a machine-readable contract, a conformance proof, a live playground demo, and',
        'three deployment forms (by value, by name, custom element).',
        '',
        '| Block | Package | Checks | Description |',
        '|---|---|---|---|',
    ];
    for (const e of index.sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(
            '| [' + cap(e.name) + '](./' + e.name + '/README.md) | `@lemonadejs/' + e.name + '` | ' + e.checks + ' | ' + (e.description || '') + ' |'
        );
    }
    lines.push('');
    lines.push('Run `npm run dev` and open http://localhost:3000/ for the live playground.');
    lines.push('');
    fs.writeFileSync(path.join(componentsDir, 'README.md'), lines.join('\n'));
    console.log('catalog index: components/README.md (' + index.length + ' blocks)');
};

main();
