/**
 * <Navbar /> block tests — including the registry gate: verify() must pass.
 * Full property parity with the v5 plugin: title/left/right/prev/next,
 * plus the v6 onprev/onnext click events.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Navbar from '@lemonadejs/navbar';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const links = () => handle!.queryAll('.lm-navbar-icon a');
const title = () => handle!.query('.lm-navbar-title')!;

describe('components/navbar', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Navbar).pass).toBe(true);
    });

    it('renders the three v5 cells: left link, title, right link', () => {
        handle = t(Navbar, { title: 'Inbox', left: 'Back', right: 'Forward', prev: '/a', next: '/b' });
        expect(title().textContent).toBe('Inbox');
        expect(links().length).toBe(2);
        expect(links()[0].textContent).toBe('Back');
        expect(links()[1].textContent).toBe('Forward');
        expect(links()[0].getAttribute('href')).toBe('/a');
        expect(links()[1].getAttribute('href')).toBe('/b');
    });

    it('mounts with defaults: full structure, empty cells, no hrefs', () => {
        handle = t(Navbar);
        expect(handle.query('.lm-navbar')).not.toBeNull();
        expect(handle.query('.lm-navbar-container')).not.toBeNull();
        expect(links().length).toBe(2);
        expect(title().textContent).toBe('');
        expect(links()[0].hasAttribute('href')).toBe(false); // empty → no attribute
        expect(links()[1].hasAttribute('href')).toBe(false);
    });

    it('declared props are live states: external writes flow into the DOM', () => {
        const heading = store('Day 1');
        const prev = store('');
        handle = t(Navbar, { title: heading, prev, left: 'Older' });

        heading.value = 'Day 2';
        expect(title().textContent).toBe('Day 2');

        prev.value = '/day/1';
        expect(links()[0].getAttribute('href')).toBe('/day/1');

        prev.value = ''; // back to empty → attribute removed again
        expect(links()[0].hasAttribute('href')).toBe(false);
    });

    it('renders title and labels as TEXT, never HTML', () => {
        handle = t(Navbar, { title: '<b>bold</b>', left: '<i>x</i>' });
        expect(title().textContent).toBe('<b>bold</b>');
        expect(title().querySelector('b')).toBeNull();
        expect(links()[0].querySelector('i')).toBeNull();
    });

    it('fires onprev/onnext with the click event', () => {
        const fired: string[] = [];
        let event: MouseEvent | null = null;
        handle = t(Navbar, {
            left: 'Back',
            right: 'Next',
            onprev: (e: MouseEvent) => {
                fired.push('prev');
                event = e;
            },
            onnext: () => fired.push('next'),
        });

        links()[0].click();
        expect(fired).toEqual(['prev']);
        expect(event).toBeInstanceOf(MouseEvent);

        links()[1].click();
        links()[1].click();
        expect(fired).toEqual(['prev', 'next', 'next']);
    });

    it('clicks are safe without handlers (v5: links only)', () => {
        handle = t(Navbar, { left: 'Back', right: 'Next' });
        links()[0].click();
        links()[1].click();
        expect(title().textContent).toBe('');
    });

    it('uses contract coercion: attribute-style strings work when embedded', () => {
        const App: Component = () =>
            html`<main><${Navbar} title="Home" left="Back" prev="/back" /></main>`;
        handle = t(App);
        expect(title().textContent).toBe('Home');
        expect(links()[0].textContent).toBe('Back');
        expect(links()[0].getAttribute('href')).toBe('/back');
    });

    it('unmounts clean: nothing left in the container', () => {
        handle = t(Navbar, { title: 'Bye' });
        const root = handle.root;
        handle.unmount();
        handle = null;
        expect(root.querySelector('.lm-navbar')).toBeNull();
    });
});
