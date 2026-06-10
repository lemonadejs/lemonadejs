/**
 * npm run dev — local playground server
 *
 * Discovers components/<name>/demo.ts, bundles them on the fly (watch
 * mode, dev build with all warnings) and serves the repository so each
 * demo.html runs against the live source. Zero configuration: drop a
 * folder with <name>.ts + demo.ts + demo.html and it appears here.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const componentsDir = path.join(root, 'components');

const main = async function () {
    const entries = {};
    const demos = [];
    for (const dir of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (dir.isDirectory() && fs.existsSync(path.join(componentsDir, dir.name, 'demo.ts'))) {
            entries['components/' + dir.name + '/demo'] = path.join(componentsDir, dir.name, 'demo.ts');
            demos.push(dir.name);
        }
    }

    const ctx = await esbuild.context({
        entryPoints: entries,
        outdir: path.join(root, '.dev'),
        bundle: true,
        format: 'iife',
        sourcemap: true,
        target: 'es2020',
        define: { __DEV__: 'true' },
    });
    await ctx.watch();
    const server = await ctx.serve({ servedir: root, port: 3000 });

    console.log('LemonadeJS dev server — component playground');
    for (const name of demos) {
        console.log('  http://localhost:' + server.port + '/components/' + name + '/demo.html');
    }
};

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
