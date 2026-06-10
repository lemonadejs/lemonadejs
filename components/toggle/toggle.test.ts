/**
 * <Toggle /> block tests — including the registry gate: verify() must pass.
 * Full behavioral parity with the v5 plugin: bind (v5: value)/checked/text/
 * icon/name/disabled/onchange + api.toggle.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Toggle from '@lemonadejs/toggle';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const input = () => handle!.query('input') as HTMLInputElement;
const root = () => handle!.query('.lm-toggle')!;

describe('components/toggle', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Toggle as never);
        expect(report.pass).toBe(true);
    });

    it('renders off by default and toggles through the native input', () => {
        handle = t(Toggle);
        expect(root().className).toContain('lm-toggle-off');

        input().click();
        expect(root().className).toContain('lm-toggle-on');
        expect(input().checked).toBe(true);

        input().click();
        expect(root().className).toContain('lm-toggle-off');
        expect(input().checked).toBe(false);
    });

    it('checked sets the initial state when unbound', () => {
        handle = t(Toggle, { checked: true });
        expect(root().className).toContain('lm-toggle-on');
        expect(input().checked).toBe(true);
    });

    it('bind wins over checked and stays two-way', () => {
        const pressed = store(false);
        handle = t(Toggle, { bind: pressed, checked: true });
        expect(root().className).toContain('lm-toggle-off'); // bind wins

        input().click();
        expect(pressed.value).toBe(true);

        pressed.value = false; // external write flows in
        expect(input().checked).toBe(false);
        expect(root().className).toContain('lm-toggle-off');
    });

    it('fires onchange on user toggles only', () => {
        const pressed = store(false);
        const changes: boolean[] = [];
        handle = t(Toggle, { bind: pressed, onchange: (v: boolean) => changes.push(v) });

        input().click();
        expect(changes).toEqual([true]);

        pressed.value = false; // programmatic write: silent
        expect(changes).toEqual([true]);
    });

    it('respects disabled natively', () => {
        handle = t(Toggle, { disabled: true });
        expect(root().className).toContain('lm-toggle-disabled');
        expect(input().disabled).toBe(true);

        input().click();
        expect(root().className).toContain('lm-toggle-off');
    });

    it('renders the text label only when provided', () => {
        handle = t(Toggle, { text: 'Microphone' });
        expect(handle.query('.lm-toggle-text')!.textContent).toBe('Microphone');
        handle.unmount();

        handle = t(Toggle);
        expect(handle.query('.lm-toggle-text')).toBeNull();
    });

    it('renders the material icon only when provided', () => {
        handle = t(Toggle, { icon: 'mic' });
        const icon = handle.query('.lm-toggle-icon')!;
        expect(icon.textContent).toBe('mic');
        expect(icon.className).toContain('material-icons');
        handle.unmount();

        handle = t(Toggle);
        expect(handle.query('.lm-toggle-icon')).toBeNull();
    });

    it('participates in forms through name', () => {
        handle = t(Toggle, { name: 'mic' });
        expect(input().getAttribute('name')).toBe('mic');
    });

    it('exposes toggle() through the api, honoring disabled', () => {
        let api: { toggle: () => void } | null = null;
        handle = t(Toggle, { ref: (a: { toggle: () => void }) => (api = a) });
        api!.toggle();
        expect(root().className).toContain('lm-toggle-on');
        handle.unmount();

        api = null;
        handle = t(Toggle, {
            disabled: true,
            ref: (a: { toggle: () => void }) => (api = a),
        });
        api!.toggle();
        expect(root().className).toContain('lm-toggle-off');
    });

    it('api.toggle fires onchange like a user action', () => {
        const changes: boolean[] = [];
        let api: { toggle: () => void } | null = null;
        handle = t(Toggle, {
            onchange: (v: boolean) => changes.push(v),
            ref: (a: { toggle: () => void }) => (api = a),
        });
        api!.toggle();
        api!.toggle();
        expect(changes).toEqual([true, false]);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () => html`<main><${Toggle} disabled="true" checked="true" text="x" /></main>`;
        handle = t(App);
        expect(root().className).toContain('lm-toggle-disabled');
        expect(root().className).toContain('lm-toggle-on');
    });
});
