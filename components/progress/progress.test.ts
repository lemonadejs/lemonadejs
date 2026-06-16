/**
 * <Progress /> block tests — including the registry gate: verify() must pass.
 * Linear (inline width:%) and circular (stroke-dasharray/offset from the
 * radius math) are asserted as rendered strings; indeterminate is a pure
 * data-attribute + CSS concern, asserted through data-indeterminate and
 * the absence of aria-valuenow.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Progress from '@lemonadejs/progress';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse to canonical "a:b;c:d"
const styleN = (el: Element) =>
    (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;$/, '');
const root = () => handle!.query('.lm-progress')!;
const bar = () => handle!.query('.lm-progress-bar')!;
const circle = () => handle!.query('.lm-progress-circle-bar')!;
const svg = () => handle!.query('.lm-progress-svg')!;

// The same deterministic math the component renders
const round = (n: number) => Math.round(n * 1000) / 1000;
const circumference = (size: number, thickness: number) => 2 * Math.PI * ((size - thickness) / 2);

describe('components/progress', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Progress);
        expect(report.pass).toBe(true);
    });

    it('linear: renders the bound percent as an inline width', () => {
        handle = t(Progress, { bind: store(50) });
        expect(root().getAttribute('role')).toBe('progressbar');
        expect(styleN(bar())).toContain('width:50%');
        expect(root().getAttribute('aria-valuenow')).toBe('50');
        expect(root().hasAttribute('data-indeterminate')).toBe(false);
        expect(root().hasAttribute('data-type')).toBe(false); // '' = linear
    });

    it('linear: live updates flow in through the bound store', () => {
        const pct = store(10);
        handle = t(Progress, { bind: pct });
        expect(styleN(bar())).toContain('width:10%');

        pct.value = 80;
        expect(styleN(bar())).toContain('width:80%');
        expect(root().getAttribute('aria-valuenow')).toBe('80');
    });

    it('clamps the percent to [0, 100]', () => {
        const pct = store(150);
        handle = t(Progress, { bind: pct });
        expect(styleN(bar())).toContain('width:100%');
        expect(root().getAttribute('aria-valuenow')).toBe('100');

        pct.value = -20;
        expect(styleN(bar())).toContain('width:0%');
        expect(root().getAttribute('aria-valuenow')).toBe('0');
    });

    it('circular: computes stroke-dasharray/offset from the radius math', () => {
        const pct = store(50);
        handle = t(Progress, { type: 'circular', bind: pct });
        expect(root().getAttribute('data-type')).toBe('circular');

        // Defaults: size 40, thickness 3.6 → r = 18.2, C = 2πr
        const c = circumference(40, 3.6);
        expect(circle().getAttribute('r')).toBe('18.2');
        expect(circle().getAttribute('stroke-dasharray')).toBe(String(round(c)));
        expect(circle().getAttribute('stroke-dashoffset')).toBe(String(round(c * 0.5)));

        pct.value = 25;
        expect(circle().getAttribute('stroke-dashoffset')).toBe(String(round(c * 0.75)));

        pct.value = 100;
        expect(circle().getAttribute('stroke-dashoffset')).toBe('0');
    });

    it('unbound defaults to indeterminate: data-attr on, aria-valuenow off', () => {
        handle = t(Progress);
        expect(root().getAttribute('data-indeterminate')).toBe('true');
        expect(root().hasAttribute('aria-valuenow')).toBe(false);
        expect(bar().hasAttribute('style')).toBe(false); // CSS keyframes drive the bar
    });

    it('indeterminate forces the animation even with a bound value', () => {
        handle = t(Progress, { bind: store(50), indeterminate: true });
        expect(root().getAttribute('data-indeterminate')).toBe('true');
        expect(root().hasAttribute('aria-valuenow')).toBe(false);
        expect(bar().hasAttribute('style')).toBe(false);
    });

    it('indeterminate circular: spins a fixed 25% arc', () => {
        handle = t(Progress, { type: 'circular' });
        const c = circumference(40, 3.6);
        expect(root().getAttribute('data-indeterminate')).toBe('true');
        expect(circle().getAttribute('stroke-dashoffset')).toBe(String(round(c * 0.75)));
    });

    it('shows the % label only when asked — and only when determinate', () => {
        handle = t(Progress, { bind: store(62.4), label: true });
        expect(handle.query('.lm-progress-label')!.textContent).toBe('62%');
        handle.unmount();

        handle = t(Progress, { bind: store(62.4) });
        expect(handle.query('.lm-progress-label')).toBeNull();
        handle.unmount();

        handle = t(Progress, { label: true }); // unbound → indeterminate → no number to show
        expect(handle.query('.lm-progress-label')).toBeNull();
    });

    it('circular: centers the label inside the ring', () => {
        handle = t(Progress, { type: 'circular', bind: store(75), label: true });
        const label = handle.query('.lm-progress-circular .lm-progress-label');
        expect(label).not.toBeNull();
        expect(label!.textContent).toBe('75%');
    });

    it('size and thickness reshape the svg geometry', () => {
        handle = t(Progress, { type: 'circular', bind: store(50), size: 60, thickness: 6 });
        expect(svg().getAttribute('viewBox')).toBe('0 0 60 60');
        expect(styleN(handle.query('.lm-progress-circular')!)).toBe('width:60px;height:60px'); // css() format

        // r = (60 - 6) / 2 = 27
        const c = circumference(60, 6);
        expect(circle().getAttribute('r')).toBe('27');
        expect(circle().getAttribute('cx')).toBe('30');
        expect(circle().getAttribute('stroke-width')).toBe('6');
        expect(circle().getAttribute('stroke-dasharray')).toBe(String(round(c)));
        expect(circle().getAttribute('stroke-dashoffset')).toBe(String(round(c * 0.5)));
    });

    it('thickness sets the linear track height', () => {
        handle = t(Progress, { bind: store(50), thickness: 8 });
        expect(styleN(handle.query('.lm-progress-track')!)).toBe('height:8px');
        handle.unmount();

        handle = t(Progress, { bind: store(50) });
        expect(handle.query('.lm-progress-track')!.hasAttribute('style')).toBe(false); // CSS default
    });

    it('exposes color as a styling attribute', () => {
        handle = t(Progress, { bind: store(50), color: 'purple' });
        expect(root().getAttribute('data-color')).toBe('purple');
        handle.unmount();

        handle = t(Progress, { bind: store(50) });
        expect(root().hasAttribute('data-color')).toBe(false); // empty → no attribute
    });

    it('switches between linear and circular markup by type', () => {
        const type = store('');
        handle = t(Progress, { bind: store(50), type });
        expect(handle.query('.lm-progress-track')).not.toBeNull();
        expect(handle.query('svg')).toBeNull();

        type.value = 'circular';
        expect(handle.query('.lm-progress-track')).toBeNull();
        expect(handle.query('svg')).not.toBeNull();
        expect(root().getAttribute('data-type')).toBe('circular');
    });

    it('display-only: external bind writes re-render SILENTLY (onchange never fires)', () => {
        // Progress never originates a change (no .set() inside), so the
        // bind-contract onchange stays quiet by design: assignment is
        // silent in v6 and only the component itself could .set()
        const changes: unknown[] = [];
        const pct = store(10);
        handle = t(Progress, { bind: pct, onchange: (v: unknown) => changes.push(v) });
        pct.value = 80;
        expect(styleN(bar())).toContain('width:80%');
        expect(changes).toEqual([]);
    });
});
