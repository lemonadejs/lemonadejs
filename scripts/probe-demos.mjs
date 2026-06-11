/**
 * Demo smoke probe: every components/<name>/demo.html must load in real
 * Chrome with ZERO exceptions and a non-empty #app. The cheap guard that
 * would have caught the createWebComponent bind+value registration crash
 * (signature/rating/switch pages died before mounting anything).
 *
 *   npm run dev        (in another shell, port 3000)
 *   node scripts/probe-demos.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9230;

const demos = readdirSync('components', { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join('components', d.name, 'demo.html')))
    .map((d) => d.name);

const profile = mkdtempSync(join(tmpdir(), 'lm-demos-'));
const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox',
    `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
    `--user-data-dir=${profile}`, '--window-size=1400,1200', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;

try {
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try {
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            target = list.find((t) => t.type === 'page');
        } catch {}
    }
    if (!target) throw new Error('no DevTools page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));

    let id = 0;
    const pending = new Map();
    let exceptions = [];
    ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
        else if (msg.method === 'Runtime.exceptionThrown') {
            exceptions.push(msg.params.exceptionDetails.exception?.description?.split('\n')[0] || msg.params.exceptionDetails.text);
        }
    };
    const call = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
    await call('Runtime.enable');
    await call('Page.enable');

    for (const name of demos) {
        exceptions = [];
        await call('Page.navigate', { url: `http://localhost:3000/components/${name}/demo.html` });
        await sleep(1200);
        const r = await call('Runtime.evaluate', {
            expression: `(document.getElementById('app')?.children.length || 0) > 0`,
            returnByValue: true,
        });
        const mounted = r.result?.value === true;
        const ok = mounted && exceptions.length === 0;
        console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + (exceptions[0] || 'app is empty')));
        if (!ok) fails++;
    }
    console.log('DEMOS-PROBE-END  ' + (demos.length - fails) + '/' + demos.length);
} catch (e) {
    console.error('probe error: ' + e.message);
    fails++;
} finally {
    chrome.kill();
    setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
}
process.exit(fails ? 1 : 0);
