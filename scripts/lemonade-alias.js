/**
 * esbuild resolver shared by dev.js / registry.js / probe.mjs:
 * block sources import the engine and other blocks BY PACKAGE NAME —
 * exactly what a consumer writes — and the monorepo maps the names to
 * the local sources. Publishing needs no import rewrites.
 *
 *   'lemonadejs'        → src/index.ts        (and /test, /forms, /react)
 *   '@lemonadejs/<x>'   → components/<x>/src/index.ts
 */

const path = require('path');

const root = path.join(__dirname, '..');

const aliasPlugin = {
    name: 'lemonade-alias',
    setup(build) {
        build.onResolve({ filter: /^lemonadejs(\/[\w-]+)?$/ }, function (args) {
            const sub = args.path === 'lemonadejs' ? 'index' : args.path.slice('lemonadejs/'.length);
            return { path: path.join(root, 'src', sub + '.ts') };
        });
        build.onResolve({ filter: /^@lemonadejs\/[\w-]+$/ }, function (args) {
            const name = args.path.slice('@lemonadejs/'.length);
            return { path: path.join(root, 'components', name, 'src', 'index.ts') };
        });
    },
};

module.exports = { aliasPlugin };
