/**
 * <Button /> block tests — including the registry gate: verify() must pass.
 * Contract surface: label/variant/color/size/disabled/loading/
 * fullwidth/href/type/icon/onclick. No api surface by design.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Button from '@lemonadejs/button';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-button')!;

describe('components/button', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Button);
        expect(report.pass).toBe(true);
    });

    it('renders a real <button type="button"> with the label', () => {
        handle = t(Button, { label: 'Save' });
        expect(root().tagName).toBe('BUTTON');
        expect(root().getAttribute('type')).toBe('button');
        expect(handle.query('.lm-button-label')!.textContent).toBe('Save');
    });

    it('passes submit/reset through the type attribute', () => {
        handle = t(Button, { type: 'submit', label: 'Send' });
        expect(root().getAttribute('type')).toBe('submit');
        handle.unmount();

        handle = t(Button, { type: 'reset', label: 'Clear' });
        expect(root().getAttribute('type')).toBe('reset');
    });

    it('exposes variant, color and size as data attributes', () => {
        handle = t(Button, { variant: 'outlined', color: 'error', size: 'small' });
        expect(root().getAttribute('data-variant')).toBe('outlined');
        expect(root().getAttribute('data-color')).toBe('error');
        expect(root().getAttribute('data-size')).toBe('small');
        handle.unmount();

        handle = t(Button); // defaults: contained, primary, medium → no attributes
        expect(root().hasAttribute('data-variant')).toBe(false);
        expect(root().hasAttribute('data-color')).toBe(false);
        expect(root().hasAttribute('data-size')).toBe(false);
    });

    it('fires onclick with the event on activation', () => {
        const clicks: string[] = [];
        handle = t(Button, { label: 'Go', onclick: (e: MouseEvent) => clicks.push(e.type) });
        root().click();
        root().click();
        expect(clicks).toEqual(['click', 'click']);
    });

    it('disabled blocks the click natively', () => {
        let clicks = 0;
        handle = t(Button, { label: 'No', disabled: true, onclick: () => clicks++ });
        expect((root() as HTMLButtonElement).disabled).toBe(true);
        expect(root().className).toContain('lm-button-disabled');
        root().click();
        expect(clicks).toBe(0);
    });

    it('loading shows the spinner instead of the content and blocks clicks (live)', () => {
        const busy = store(false);
        let clicks = 0;
        handle = t(Button, { label: 'Save', loading: busy, onclick: () => clicks++ });

        root().click();
        expect(clicks).toBe(1);
        expect(handle.query('.lm-button-spinner')).toBeNull();

        busy.value = true; // spinner replaces the content, button disables
        expect(handle.query('.lm-button-spinner')).not.toBeNull();
        expect(handle.query('.lm-button-label')).toBeNull();
        expect((root() as HTMLButtonElement).disabled).toBe(true);
        root().click();
        expect(clicks).toBe(1); // unchanged

        busy.value = false; // content comes back
        expect(handle.query('.lm-button-spinner')).toBeNull();
        expect(handle.query('.lm-button-label')!.textContent).toBe('Save');
        root().click();
        expect(clicks).toBe(2);
    });

    it('href renders a real <a> that still fires onclick', () => {
        let clicks = 0;
        handle = t(Button, { href: '/docs', label: 'Docs', onclick: () => clicks++ });
        expect(root().tagName).toBe('A');
        expect(root().getAttribute('href')).toBe('/docs');
        expect(root().hasAttribute('type')).toBe(false);

        handle.root.addEventListener('click', (e) => e.preventDefault()); // no jsdom navigation
        root().click();
        expect(clicks).toBe(1);
    });

    it('a disabled or loading anchor blocks onclick (no native disabled on <a>)', () => {
        let clicks = 0;
        handle = t(Button, { href: '/docs', label: 'Docs', disabled: true, onclick: () => clicks++ });
        expect(root().getAttribute('aria-disabled')).toBe('true');
        root().click();
        expect(clicks).toBe(0);
        handle.unmount();

        handle = t(Button, { href: '/docs', loading: true, onclick: () => clicks++ });
        expect(handle.query('.lm-button-spinner')).not.toBeNull();
        root().click();
        expect(clicks).toBe(0);
    });

    it('fullwidth stretches through the lm-button-fullwidth class', () => {
        handle = t(Button, { label: 'Wide', fullwidth: true });
        expect(root().className).toContain('lm-button-fullwidth');
        handle.unmount();

        handle = t(Button, { label: 'Narrow' });
        expect(root().className).not.toContain('lm-button-fullwidth');
    });

    it('label is live: replacing the state re-renders the text', () => {
        const label = store('Save');
        handle = t(Button, { label });
        expect(handle.query('.lm-button-label')!.textContent).toBe('Save');
        label.value = 'Saving…';
        expect(handle.query('.lm-button-label')!.textContent).toBe('Saving…');
    });

    it('renders children content inside the button', () => {
        const App: Component = () =>
            html`<main><${Button}><b>Rich</b> child</${Button}></main>`;
        handle = t(App);
        expect(root().tagName).toBe('BUTTON');
        expect(root().querySelector('b')!.textContent).toBe('Rich');
        expect(root().textContent).toContain('Rich child');
    });

    it('shows the material icon before the label', () => {
        handle = t(Button, { icon: 'send', label: 'Send' });
        const icon = handle.query('.lm-button-icon')!;
        expect(icon.textContent).toBe('send');
        expect(icon.className).toContain('material-icons');
        const next = icon.nextElementSibling as HTMLElement;
        expect(next.className).toContain('lm-button-label');
    });

    it('aria-label names an icon-only button; the icon is decorative', () => {
        handle = t(Button, { icon: 'send', 'aria-label': 'Send message' });
        expect(root().getAttribute('aria-label')).toBe('Send message');
        expect(handle.query('.lm-button-icon')!.getAttribute('aria-hidden')).toBe('true');
        handle.unmount();

        handle = t(Button, { label: 'Send' }); // no prop → no attribute
        expect(root().hasAttribute('aria-label')).toBe(false);
    });

    it('loading sets aria-busy and keeps the accessible name', () => {
        const busy = store(false);
        handle = t(Button, { label: 'Save', loading: busy });
        expect(root().hasAttribute('aria-busy')).toBe(false);

        busy.value = true; // spinner replaces the text — the label steps in
        expect(root().getAttribute('aria-busy')).toBe('true');
        expect(root().getAttribute('aria-label')).toBe('Save');
        expect(handle.query('.lm-button-spinner')!.getAttribute('aria-hidden')).toBe('true');

        busy.value = false; // text content is back: no redundant aria-label
        expect(root().hasAttribute('aria-busy')).toBe(false);
        expect(root().hasAttribute('aria-label')).toBe(false);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Button} disabled="true" fullwidth="true" label="x" /></main>`;
        handle = t(App);
        expect((root() as HTMLButtonElement).disabled).toBe(true);
        expect(root().className).toContain('lm-button-fullwidth');
    });
});
