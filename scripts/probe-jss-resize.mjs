// Verify the jss-gantt lane resize grip: drag it left, day width must stay
// fixed while the day count grows. Also captures a screenshot for the links.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'lm-rsz-'));
const server = spawn('python3', ['-m', 'http.server', '8899'], { cwd: join(import.meta.dirname, '..') });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--remote-debugging-port=9230', '--remote-allow-origins=*', `--user-data-dir=${profile}`,
    '--window-size=1300,600', 'http://localhost:8899/components/jss/test-gantt.html']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
    await sleep(2500);
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try {
            const list = await (await fetch('http://127.0.0.1:9230/json/list')).json();
            target = list.find((t) => t.type === 'page' && t.url.includes('test-gantt'));
        } catch {}
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
    let id = 0; const pending = new Map();
    ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } };
    const call = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expr) => (await call('Runtime.evaluate', { expression: expr, returnByValue: true }))?.result?.value;
    await sleep(2500);

    const state = () => ev(`(() => {
        const days = document.querySelectorAll('.lm-gantt-day');
        const bars = [...document.querySelectorAll('.lm-gantt-bar')].map((b) => b.getBoundingClientRect().left.toFixed(1));
        return { grip: !!document.querySelector('.jss-gantt-resize'),
                 days: days.length,
                 dayWidth: days[0].getBoundingClientRect().width.toFixed(1),
                 barLefts: bars };
    })()`);
    console.log('before:', JSON.stringify(await state()));

    const g = await ev(`(() => { const r = document.querySelector('.jss-gantt-resize').getBoundingClientRect(); return { x: r.left + 2, y: r.top + r.height / 2 }; })()`);
    const mouse = (type, x, y) => call('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
    // the grip is on the lane's RIGHT border: drag right to widen
    await mouse('mousePressed', g.x, g.y);
    await sleep(100);
    await mouse('mouseMoved', g.x + 80, g.y);
    await sleep(100);
    await mouse('mouseMoved', g.x + 160, g.y);
    await sleep(100);
    await mouse('mouseReleased', g.x + 160, g.y);
    await sleep(1200);

    console.log('after: ', JSON.stringify(await state()));
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    writeFileSync('/tmp/jss-gantt-final.png', Buffer.from(shot.data, 'base64'));
    console.log('screenshot saved');
} catch (e) {
    console.error('probe error: ' + e.message);
} finally {
    chrome.kill();
    server.kill();
    setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500);
}
