/**
 * LemonadeJS v6 build
 *
 * Produces zero-dependency artifacts in dist/:
 *   lemonade.mjs      ESM
 *   lemonade.js       CJS (node require)
 *   lemonade.min.js   IIFE for <script> tags (global: lemonade) — the zero-build path
 *   test.mjs/test.js  the test harness (lemonadejs/test)
 *   *.d.ts            TypeScript declarations (tsc)
 */

const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { gzipSync } = require('zlib');
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');

// dev: true keeps warnings and checks; dev: false inlines __DEV__ = false
// and every dev-only branch is eliminated — production pays zero.
// satellite: true → the core stays external (one shared engine in dist)
const targets = [
    { entry: 'src/index.ts', format: 'esm', outfile: 'lemonade.mjs', dev: true },
    { entry: 'src/index.ts', format: 'esm', outfile: 'lemonade.prod.mjs', dev: false },
    { entry: 'src/index.ts', format: 'cjs', outfile: 'lemonade.js', dev: true },
    { entry: 'src/index.ts', format: 'cjs', outfile: 'lemonade.prod.js', dev: false },
    { entry: 'src/index.ts', format: 'iife', outfile: 'lemonade.dev.js', globalName: 'lemonade', dev: true },
    { entry: 'src/index.ts', format: 'iife', outfile: 'lemonade.min.js', minify: true, globalName: 'lemonade', dev: false },
    { entry: 'src/test.ts', format: 'esm', outfile: 'test.mjs', dev: true, satellite: './lemonade.mjs' },
    { entry: 'src/test.ts', format: 'cjs', outfile: 'test.js', dev: true, satellite: './lemonade.js' },
    { entry: 'src/react.ts', format: 'esm', outfile: 'react.mjs', dev: true, satellite: './lemonade.mjs' },
    { entry: 'src/react.ts', format: 'cjs', outfile: 'react.js', dev: true, satellite: './lemonade.js' },
];

/** Satellites import the engine from ./index — rewrite to the dist core */
const coreExternal = function (corePath) {
    return {
        name: 'core-external',
        setup(build) {
            build.onResolve({ filter: /^\.\/index$/ }, function () {
                return { path: corePath, external: true };
            });
        },
    };
};

const run = async function () {
    for (const t of targets) {
        await esbuild.build({
            entryPoints: [path.join(__dirname, t.entry)],
            bundle: true,
            format: t.format,
            minify: !!t.minify,
            globalName: t.globalName,
            outfile: path.join(out, t.outfile),
            target: 'es2020',
            define: { __DEV__: String(!!t.dev) },
            external: ['react', 'react-dom'],
            plugins: t.satellite ? [coreExternal(t.satellite)] : [],
        });
    }

    // Type declarations — build scope is the ENGINE only (the root
    // tsconfig typechecks the whole monorepo incl. components/tests)
    execSync('npx tsc -p tsconfig.build.json', { cwd: __dirname, stdio: 'inherit' });

    // Size budget report — footprint is a feature
    const min = fs.readFileSync(path.join(out, 'lemonade.min.js'));
    const gzip = gzipSync(min).length;
    console.log('lemonade.min.js: ' + (min.length / 1024).toFixed(1) + ' KB, gzip ' + (gzip / 1024).toFixed(1) + ' KB');
    // Raised from 8 KB (June 2026) to fund keyed diff + portal — the bar
    // stays "value per KB", not the number itself
    if (gzip > 10 * 1024) {
        console.error('SIZE BUDGET EXCEEDED: gzip > 10 KB');
        process.exit(1);
    }
};

run().catch(function (e) {
    console.error(e);
    process.exit(1);
});
