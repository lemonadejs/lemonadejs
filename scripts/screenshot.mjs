/**
 * Zero-dependency headless-Chrome full-page screenshot (CDP), for
 * eyeballing visual changes on the .probe/shot-*.html pages.
 *
 *   node scripts/screenshot.mjs <url> <out.png> [width]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2];
const OUT = process.argv[3] || 'shot.png';
const WIDTH = Number(process.argv[4]) || 860;
const PORT = 9224;

const profile = mkdtempSync(join(tmpdir(), 'lm-shot-'));
const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},1200`,
    '--allow-file-access-from-files',
    URL_,
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanup = () => {
    chrome.kill();
    setTimeout(() => {
        try { rmSync(profile, { recursive: true, force: true }); } catch {}
    }, 500);
};

try {
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try {
            const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
            target = list.find((t) => t.type === 'page' && t.url !== 'about:blank');
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
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
        }
    };
    const send = (method, params = {}) =>
        new Promise((res) => {
            const mid = ++id;
            pending.set(mid, res);
            ws.send(JSON.stringify({ id: mid, method, params }));
        });

    await send('Page.enable');
    await sleep(1200); // let the page render

    // full-page: measure the content, resize the viewport to fit
    const evalRes = await send('Runtime.evaluate', {
        expression: 'document.documentElement.scrollHeight',
        returnByValue: true,
    });
    const h = (evalRes.result && evalRes.result.result && evalRes.result.result.value) || 1200;
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: Math.min(h, 8000), deviceScaleFactor: 2, mobile: false });
    await sleep(300);

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
    console.log('saved', OUT, 'height', h);
    ws.close();
} catch (e) {
    console.error('screenshot failed:', e.message);
    process.exitCode = 1;
} finally {
    cleanup();
}
