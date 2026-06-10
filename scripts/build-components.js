/**
 * npm run build:components — builds a publishable dist/ for every block.
 *
 * For each components/<name>/ with a package.json:
 *   dist/index.mjs   ESM
 *   dist/index.js    CJS
 *   dist/style.css   copied from src/
 *   dist/index.d.ts  written by `npm run registry` (run it first)
 *
 * 'lemonadejs' and '@lemonadejs/*' imports stay EXTERNAL — the package
 * declares them as peer/dependencies; the source already imports by
 * package name so no rewriting happens at build time.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const componentsDir = path.join(root, 'components');

const main = async function () {
    let count = 0;
    for (const dir of fs.readdirSync(componentsDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) {
            continue;
        }
        const name = dir.name;
        const base = path.join(componentsDir, name);
        const entry = path.join(base, 'src', 'index.ts');
        if (!fs.existsSync(entry) || !fs.existsSync(path.join(base, 'package.json'))) {
            continue;
        }
        const dist = path.join(base, 'dist');
        fs.mkdirSync(dist, { recursive: true });

        const shared = {
            entryPoints: [entry],
            bundle: true,
            target: 'es2020',
            external: ['lemonadejs', '@lemonadejs/*'],
            define: { __DEV__: 'false' },
        };
        await esbuild.build({ ...shared, format: 'esm', outfile: path.join(dist, 'index.mjs') });
        await esbuild.build({ ...shared, format: 'cjs', outfile: path.join(dist, 'index.js') });

        const css = path.join(base, 'src', 'style.css');
        if (fs.existsSync(css)) {
            fs.copyFileSync(css, path.join(dist, 'style.css'));
        }

        const size = fs.statSync(path.join(dist, 'index.mjs')).size;
        console.log('@lemonadejs/' + name + '  dist ready  (' + (size / 1024).toFixed(1) + ' KB esm)');
        count++;
    }
    console.log(count + ' package(s) built');
};

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
