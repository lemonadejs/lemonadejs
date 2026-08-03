// Reproduce the jss-gantt header squeeze: drag a bar, drop it, and compare
// the timeline header (day tick count, month labels, range) before/after.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8899;
const profile = mkdtempSync(join(tmpdir(), 'lm-jssg-'));
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: join(import.meta.dirname, '..') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox',
    '--remote-debugging-port=9228', '--remote-allow-origins=*', `--user-data-dir=${profile}`,
    '--window-size=1500,900', `http://localhost:${PORT}/components/jss/test-gantt.html`]);

try {
    await sleep(2000);
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try {
            const list = await (await fetch('http://127.0.0.1:9228/json/list')).json();
            target = list.find((t) => t.type === 'page' && t.url.includes('test-gantt'));
        } catch {}
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
    let id = 0; const pending = new Map();
    ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } };
    const call = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expr) => (await call('Runtime.evaluate', { expression: expr, returnByValue: true }))?.result?.value;
    await sleep(2500); // jss + gantt mount

    const snap = (label) => ev(`(() => {
        const days = document.querySelectorAll('.lm-gantt-day');
        const months = [...document.querySelectorAll('.lm-gantt-month')].map((m) => m.textContent.trim());
        const widths = [...days].slice(0, 3).map((d) => d.getBoundingClientRect().width.toFixed(1));
        return { label: '${label}', dayCount: days.length, months, sampleDayWidths: widths };
    })()`);

    console.log(JSON.stringify(await snap('before'), null, 1));

    // Drag the first bar 2 days to the right with real input events
    const rect = await ev(`(() => { const b = document.querySelector('.lm-gantt-bar'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    const dayPx = await ev(`(() => { const d = document.querySelector('.lm-gantt-day'); return d.getBoundingClientRect().width; })()`);
    const mouse = (type, x, y) => call('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
    await mouse('mousePressed', rect.x, rect.y);
    await sleep(120);
    await mouse('mouseMoved', rect.x + dayPx, rect.y);
    await sleep(120);
    await mouse('mouseMoved', rect.x + dayPx * 2, rect.y);
    await sleep(120);
    await mouse('mouseReleased', rect.x + dayPx * 2, rect.y);
    await sleep(1200); // sync + rebuild

    console.log(JSON.stringify(await snap('after-drop-1'), null, 1));

    // Second drop — the user says it depends on the drop; move it back
    const rect2 = await ev(`(() => { const b = document.querySelector('.lm-gantt-bar'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await mouse('mousePressed', rect2.x, rect2.y);
    await sleep(120);
    await mouse('mouseMoved', rect2.x - dayPx * 2, rect2.y);
    await sleep(120);
    await mouse('mouseReleased', rect2.x - dayPx * 2, rect2.y);
    await sleep(1200);

    console.log(JSON.stringify(await snap('after-drop-2'), null, 1));

    // The screenshot scenario: drag the LAST bar far into the future —
    // day width must stay fixed; the window shifts instead of squeezing
    const rect3 = await ev(`(() => { const b = [...document.querySelectorAll('.lm-gantt-bar')].pop(); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await mouse('mousePressed', rect3.x, rect3.y);
    await sleep(120);
    for (let i = 1; i <= 6; i++) {
        await mouse('mouseMoved', rect3.x + dayPx * i * 5, rect3.y);
        await sleep(60);
    }
    await mouse('mouseReleased', rect3.x + dayPx * 30, rect3.y);
    await sleep(1200);

    console.log(JSON.stringify(await snap('after-far-future-drop'), null, 1));

    // PAN the header, then drop a bar: the viewport must stay at the
    // panned position (the extension adopts the block's current window)
    const header = await ev(`(() => { const h = document.querySelector('.lm-gantt-header'); const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await mouse('mousePressed', header.x, header.y);
    await sleep(100);
    await mouse('mouseMoved', header.x - dayPx * 10, header.y); // pan ~10 days forward
    await sleep(100);
    await mouse('mouseReleased', header.x - dayPx * 10, header.y);
    await sleep(400);
    const panned = await snap('after-pan');
    console.log(JSON.stringify(panned, null, 1));

    const rect4 = await ev(`(() => { const b = document.querySelector('.lm-gantt-bar'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await mouse('mousePressed', rect4.x, rect4.y);
    await sleep(120);
    await mouse('mouseMoved', rect4.x + dayPx, rect4.y);
    await sleep(120);
    await mouse('mouseReleased', rect4.x + dayPx, rect4.y);
    await sleep(1200);
    const afterDrop = await snap('drop-after-pan');
    console.log(JSON.stringify(afterDrop, null, 1));
    console.log('PAN KEPT ON DROP:', JSON.stringify(panned.months) === JSON.stringify(afterDrop.months) ? 'PASS' : 'FAIL');
    console.log(JSON.stringify(await ev(`(() => {
        const bars = document.querySelectorAll('.lm-gantt-bar').length;
        const rows = window.grid ? window.grid[0].getData().map((r) => [r[1], r[2]]) : null;
        return { visibleBars: bars, dates: rows };
    })()`), null, 1));
} catch (e) {
    console.error('probe error: ' + e.message);
} finally {
    chrome.kill();
    server.kill();
    setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
}
