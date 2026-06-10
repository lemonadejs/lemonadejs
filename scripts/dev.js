/**
 * npm run dev — local playground server
 *
 * Discovers components/<name>/demo.ts, bundles them on the fly (watch
 * mode, dev build with all warnings) and serves the repository so each
 * demo.html runs against the live source. Zero configuration: drop a
 * folder with <name>.ts + demo.ts + demo.html and it appears here —
 * including folders created AFTER the server started (the components
 * directory is watched and the bundler restarts itself).
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { aliasPlugin } = require('./lemonade-alias');

const root = path.join(__dirname, '..');
const componentsDir = path.join(root, 'components');

const discover = function () {
    const entries = {};
    for (const dir of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (dir.isDirectory() && fs.existsSync(path.join(componentsDir, dir.name, 'demo.ts'))) {
            entries['components/' + dir.name + '/demo'] = path.join(componentsDir, dir.name, 'demo.ts');
        }
    }
    return entries;
};

const start = async function (entries) {
    const ctx = await esbuild.context({
        entryPoints: entries,
        outdir: path.join(root, '.dev'),
        bundle: true,
        format: 'iife',
        sourcemap: true,
        target: 'es2020',
        define: { __DEV__: 'true' },
        plugins: [aliasPlugin],
    });
    await ctx.watch();
    const server = await ctx.serve({ servedir: root, port: 3000 });

    console.log('LemonadeJS dev server — component playground');
    for (const key of Object.keys(entries)) {
        console.log('  http://localhost:' + server.port + '/' + key.replace(/\/demo$/, '/demo.html'));
    }
    return ctx;
};

const main = async function () {
    let entries = discover();
    let ctx = await start(entries);
    let restarting = false;

    // A new block (or a removed one) restarts the bundler with the
    // fresh entry list — no manual restart when a component is born
    fs.watch(componentsDir, { recursive: true }, function (event, file) {
        if (restarting || !file || !file.endsWith('demo.ts')) {
            return;
        }
        const fresh = discover();
        if (Object.keys(fresh).sort().join() === Object.keys(entries).sort().join()) {
            return;
        }
        restarting = true;
        setTimeout(async function () {
            try {
                entries = fresh;
                await ctx.dispose();
                ctx = await start(entries);
            } catch (e) {
                console.error(e);
            } finally {
                restarting = false;
            }
        }, 200); // debounce the burst of fs events a new folder produces
    });
};

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
