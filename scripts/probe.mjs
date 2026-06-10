/**
 * npm run probe — bundles every .probe/*.ts (with the package-name
 * aliases) and runs each probe page through headless Chrome.
 * Needs `npm run dev` serving :3000.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const { aliasPlugin } = require('./lemonade-alias.js');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const probeDir = path.join(root, '.probe');

const entries = fs
    .readdirSync(probeDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(probeDir, f));

await esbuild.build({
    entryPoints: entries,
    outdir: probeDir,
    bundle: true,
    format: 'iife',
    target: 'es2020',
    define: { __DEV__: 'true' },
    plugins: [aliasPlugin],
    logLevel: 'silent',
});

let failed = false;
for (const entry of entries) {
    const page = path.basename(entry, '.ts') + '.html';
    try {
        execFileSync('node', [path.join(root, 'scripts', 'chrome-probe.mjs'), 'http://localhost:3000/.probe/' + page], {
            stdio: 'inherit',
        });
    } catch {
        failed = true;
    }
}
process.exit(failed ? 1 : 0);
