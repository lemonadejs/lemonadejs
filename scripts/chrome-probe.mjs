/**
 * Zero-dependency real-Chrome probe runner. Launches installed Chrome
 * headless with a DevTools port, polls the page for the #lm-probe
 * results block (written by .probe/probe.ts), prints it, exits non-zero
 * on FAIL. Node >= 21 (global WebSocket).
 *
 *   node scripts/chrome-probe.mjs [url]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://localhost:3000/.probe/probe.html';
const PORT = 9223;

const profile = mkdtempSync(join(tmpdir(), 'lm-probe-'));
const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    '--window-size=1280,900',
    URL_,
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanup = () => {
    chrome.kill();
    setTimeout(() => {
        try {
            rmSync(profile, { recursive: true, force: true });
        } catch {}
    }, 500);
};

try {
    // Wait for the DevTools endpoint, find our page target
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try {
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            target = list.find((t) => t.type === 'page' && t.url.includes('probe'));
        } catch {}
    }
    if (!target) throw new Error('no page target on the DevTools port');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));

    let id = 0;
    const pending = new Map();
    ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg.result);
            pending.delete(msg.id);
        }
    };
    const call = (method, params = {}) =>
        new Promise((res) => {
            pending.set(++id, res);
            ws.send(JSON.stringify({ id, method, params }));
        });

    const evaluate = async (expression) =>
        (await call('Runtime.evaluate', { expression, returnByValue: true }))?.result?.value;

    // Poll for the probe block (probe.ts appends it when done)
    let text = null;
    for (let i = 0; i < 60 && !text; i++) {
        await sleep(250);
        text = await evaluate(`document.getElementById('lm-probe')?.textContent || null`);
    }
    if (!text) {
        const state = await evaluate(
            `JSON.stringify({ ready: document.readyState, body: document.body?.innerHTML?.slice(0, 400) })`
        );
        throw new Error('probe never finished. page state: ' + state);
    }

    console.log(text.trim());
    ws.close();
    cleanup();
    process.exit(text.includes('FAIL') || text.includes('ERROR') ? 1 : 0);
} catch (e) {
    cleanup();
    console.error('PROBE-RUNNER-ERROR ' + e.message);
    process.exit(2);
}
