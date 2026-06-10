/**
 * <Switch /> block tests — including the registry gate: verify() must pass.
 * Full property parity with the v5 plugin: bind/checked/label/color/name/
 * disabled/position/onchange + api.toggle.
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

const input = () => handle!.query('input') as HTMLInputElement;
const root = () => handle!.query('.lm-switch')!;

describe('components/switch', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Switch as never);
        expect(report.pass).toBe(true);
    });

    it('renders off by default and toggles through the native input', () => {
        handle = t(Switch as Component<unknown>);
        expect(root().className).toContain('lm-switch-off');

        input().click();
        expect(root().className).toContain('lm-switch-on');
        expect(input().checked).toBe(true);
    });

    it('checked sets the initial state when unbound', () => {
        handle = t(Switch as Component<unknown>, { checked: true });
        expect(root().className).toContain('lm-switch-on');
        expect(input().checked).toBe(true);
    });

    it('bind wins over checked and stays two-way', () => {
        const on = store(false);
        handle = t(Switch as Component<unknown>, { bind: on, checked: true });
        expect(root().className).toContain('lm-switch-off'); // bind wins

        input().click();
        expect(on.value).toBe(true);

        on.value = false; // external write flows in
        expect(input().checked).toBe(false);
        expect(root().className).toContain('lm-switch-off');
    });

    it('fires onchange on user toggles only', () => {
        const on = store(false);
        const changes: boolean[] = [];
        handle = t(Switch as Component<unknown>, { bind: on, onchange: (v: boolean) => changes.push(v) });

        input().click();
        expect(changes).toEqual([true]);

        on.value = false; // programmatic write: silent
        expect(changes).toEqual([true]);
    });

    it('respects disabled natively', () => {
        handle = t(Switch as Component<unknown>, { disabled: true });
        expect(root().className).toContain('lm-switch-disabled');
        expect(input().disabled).toBe(true);

        input().click();
        expect(root().className).toContain('lm-switch-off');
    });

    it('renders the text label only when provided', () => {
        handle = t(Switch as Component<unknown>, { label: 'Dark mode' });
        expect(handle.query('.lm-switch-label')!.textContent).toBe('Dark mode');
        handle.unmount();

        handle = t(Switch as Component<unknown>);
        expect(handle.query('.lm-switch-label')).toBeNull();
    });

    it('participates in forms through name', () => {
        handle = t(Switch as Component<unknown>, { name: 'darkmode' });
        expect(input().getAttribute('name')).toBe('darkmode');
    });

    it('exposes color and position as styling attributes', () => {
        handle = t(Switch as Component<unknown>, { color: 'purple', position: 'right' });
        expect(root().getAttribute('data-color')).toBe('purple');
        expect(root().getAttribute('position')).toBe('right');
        handle.unmount();

        handle = t(Switch as Component<unknown>);
        expect(root().hasAttribute('data-color')).toBe(false); // empty → no attribute
        expect(root().hasAttribute('position')).toBe(false);
    });

    it('exposes toggle() through the api, honoring disabled', () => {
        let api: { toggle: () => void } | null = null;
        handle = t(Switch as Component<unknown>, { ref: (a: { toggle: () => void }) => (api = a) });
        api!.toggle();
        expect(root().className).toContain('lm-switch-on');
        handle.unmount();

        api = null;
        handle = t(Switch as Component<unknown>, {
            disabled: true,
            ref: (a: { toggle: () => void }) => (api = a),
        });
        api!.toggle();
        expect(root().className).toContain('lm-switch-off');
    });

    it('supports sizes through lm-switch-* classes', () => {
        handle = t(Switch as Component<unknown>, { size: 'small' });
        expect(root().className).toContain('lm-switch-small');
        handle.unmount();

        handle = t(Switch as Component<unknown>, { size: 'large' });
        expect(root().className).toContain('lm-switch-large');
    });

    it('supports required and the form submit value', () => {
        handle = t(Switch as Component<unknown>, { name: 'news', value: 'yes', required: true });
        expect(input().required).toBe(true);
        expect(input().getAttribute('value')).toBe('yes');
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () => html`<main><${Switch} disabled="true" checked="true" label="x" /></main>`;
        handle = t(App);
        expect(root().className).toContain('lm-switch-disabled');
        expect(root().className).toContain('lm-switch-on');
    });
});
