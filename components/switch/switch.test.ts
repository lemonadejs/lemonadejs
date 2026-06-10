/**
 * <Switch /> block tests — including the registry gate: verify() must pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from '../../src/index';
import { render as t, verify } from '../../src/test';
import Switch from './switch';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('components/switch', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Switch as never);
        expect(report.pass).toBe(true);
    });

    it('renders off by default and toggles on click', () => {
        handle = t(Switch as Component<unknown>);
        const sw = handle.query('.lm-switch')!;
        expect(sw.className).toContain('lm-off');
        expect(sw.getAttribute('aria-checked')).toBe('false');

        sw.click();
        expect(sw.className).toContain('lm-on');
        expect(sw.getAttribute('aria-checked')).toBe('true');
    });

    it('binds an external state two-way', () => {
        const on = store(false);
        handle = t(Switch as Component<unknown>, { bind: on });
        const sw = handle.query('.lm-switch')!;

        sw.click();
        expect(on.value).toBe(true);

        on.value = false; // external write flows in
        expect(sw.className).toContain('lm-off');
    });

    it('fires onchange on user toggles only', () => {
        const on = store(false);
        const changes: boolean[] = [];
        handle = t(Switch as Component<unknown>, { bind: on, onchange: (v: boolean) => changes.push(v) });

        handle.query('.lm-switch')!.click();
        expect(changes).toEqual([true]);

        on.value = false; // programmatic write: silent
        expect(changes).toEqual([true]);
    });

    it('respects disabled', () => {
        handle = t(Switch as Component<unknown>, { disabled: true });
        const sw = handle.query('.lm-switch')!;
        expect(sw.className).toContain('lm-disabled');
        sw.click();
        expect(sw.className).toContain('lm-off');
    });

    it('toggles from the keyboard (Enter and Space)', () => {
        handle = t(Switch as Component<unknown>);
        const sw = handle.query('.lm-switch')!;
        sw.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(sw.className).toContain('lm-on');
        sw.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(sw.className).toContain('lm-off');
    });

    it('renders the label only when provided', () => {
        handle = t(Switch as Component<unknown>, { label: 'Dark mode' });
        expect(handle.query('.lm-label')!.textContent).toBe('Dark mode');
        handle.unmount();

        handle = t(Switch as Component<unknown>);
        expect(handle.query('.lm-label')).toBeNull();
    });

    it('exposes toggle() through the api', () => {
        let api: { toggle: () => void } | null = null;
        handle = t(Switch as Component<unknown>, { ref: (a: { toggle: () => void }) => (api = a) });
        api!.toggle();
        expect(handle.query('.lm-switch')!.className).toContain('lm-on');
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () => html`<main><${Switch} disabled="true" label="x" /></main>`;
        handle = t(App);
        expect(handle.query('.lm-switch')!.className).toContain('lm-disabled');
    });
});
