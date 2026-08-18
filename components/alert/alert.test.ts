/**
 * <Alert /> block tests — including the registry gate: verify() must pass.
 * Severity banner: severity/variant as data-attributes,
 * title/message/children body, closable × (fires onclose), visibility
 * bound two-way (external writes silent), icon=false.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Alert from '@lemonadejs/alert';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-alert');

describe('components/alert', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Alert);
        expect(report.pass).toBe(true);
    });

    it('renders visible by default with role=status and no data attributes', () => {
        handle = t(Alert, { message: 'hello' });
        expect(root()).not.toBeNull();
        expect(root()!.getAttribute('role')).toBe('status'); // '' = info: polite
        expect(root()!.hasAttribute('data-severity')).toBe(false); // '' = info
        expect(root()!.hasAttribute('data-variant')).toBe(false); // '' = standard
    });

    it('maps the severity onto the live-region urgency: status vs alert', () => {
        const severity = store('');
        handle = t(Alert, { severity });
        const role = () => root()!.getAttribute('role');
        expect(role()).toBe('status'); // info

        severity.value = 'success';
        expect(role()).toBe('status');

        severity.value = 'warning';
        expect(role()).toBe('alert');

        severity.value = 'error';
        expect(role()).toBe('alert');
    });

    it('exposes severity as a data attribute, live', () => {
        const severity = store('success');
        handle = t(Alert, { severity });
        expect(root()!.getAttribute('data-severity')).toBe('success');

        severity.value = 'warning';
        expect(root()!.getAttribute('data-severity')).toBe('warning');

        severity.value = 'error';
        expect(root()!.getAttribute('data-severity')).toBe('error');
    });

    it('exposes variant as a data attribute', () => {
        handle = t(Alert, { variant: 'outlined' });
        expect(root()!.getAttribute('data-variant')).toBe('outlined');
        handle.unmount();

        handle = t(Alert, { variant: 'filled' });
        expect(root()!.getAttribute('data-variant')).toBe('filled');
    });

    it('renders the bold title line only when provided', () => {
        handle = t(Alert, { title: 'Heads up', message: 'something happened' });
        expect(handle.query('.lm-alert-title')!.textContent).toBe('Heads up');
        expect(handle.query('.lm-alert-message')!.textContent).toBe('something happened');
        handle.unmount();

        handle = t(Alert, { message: 'just a body' });
        expect(handle.query('.lm-alert-title')).toBeNull();
    });

    it('renders children after the message', () => {
        const App: Component = () =>
            html`<main><${Alert} message="first"><b>extra</b></${Alert}></main>`;
        handle = t(App);
        const body = handle.query('.lm-alert-body')!;
        expect(body.textContent).toBe('firstextra');
        expect(body.querySelector('b')!.textContent).toBe('extra');
    });

    it('shows the × only when closable; clicking hides and fires onclose once', () => {
        handle = t(Alert, { message: 'x' });
        expect(handle.query('.lm-alert-close')).toBeNull();
        handle.unmount();

        let closed = 0;
        handle = t(Alert, { message: 'x', closable: true, onclose: () => closed++ });
        const button = handle.query('.lm-alert-close') as HTMLButtonElement;
        expect(button).not.toBeNull();

        button.click();
        expect(root()).toBeNull(); // the whole alert is a branch on visible
        expect(closed).toBe(1);
    });

    it('bind is two-way: the × writes the state, external writes are silent', () => {
        const visible = store(true);
        let closed = 0;
        handle = t(Alert, { message: 'x', closable: true, bind: visible, onclose: () => closed++ });
        expect(root()).not.toBeNull();

        visible.value = false; // external hide: silent
        expect(root()).toBeNull();
        expect(closed).toBe(0);

        visible.value = true; // external show
        expect(root()).not.toBeNull();

        (handle.query('.lm-alert-close') as HTMLButtonElement).click();
        expect(visible.value).toBe(false); // the × flows out through bind
        expect(closed).toBe(1);
    });

    it('starts hidden when bound to a false state', () => {
        const visible = store(false);
        handle = t(Alert, { message: 'x', bind: visible });
        expect(root()).toBeNull();

        visible.value = true;
        expect(root()).not.toBeNull();
    });

    it('shows the severity icon by default and hides it with icon=false', () => {
        handle = t(Alert, { message: 'x' });
        expect(handle.query('.lm-alert-icon svg')).not.toBeNull();
        handle.unmount();

        handle = t(Alert, { message: 'x', icon: false });
        expect(handle.query('.lm-alert-icon')).toBeNull();
    });

    it('swaps the icon path with the severity', () => {
        const severity = store('');
        handle = t(Alert, { severity });
        const d = () => handle!.query('.lm-alert-icon path')!.getAttribute('d');
        const info = d();

        severity.value = 'error';
        expect(d()).not.toBe(info);

        severity.value = ''; // back to the info glyph
        expect(d()).toBe(info);
    });

    it('keeps the message live when bound to a state', () => {
        const message = store('loading');
        handle = t(Alert, { message });
        expect(handle.query('.lm-alert-message')!.textContent).toBe('loading');

        message.value = 'done';
        expect(handle.query('.lm-alert-message')!.textContent).toBe('done');

        message.value = ''; // empty message drops the line entirely
        expect(handle.query('.lm-alert-message')).toBeNull();
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Alert} closable="true" icon="false" severity="error" message="m" /></main>`;
        handle = t(App);
        expect(handle.query('.lm-alert-close')).not.toBeNull();
        expect(handle.query('.lm-alert-icon')).toBeNull();
        expect(root()!.getAttribute('data-severity')).toBe('error');
    });
});
