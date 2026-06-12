/**
 * <Card /> block tests — including the registry gate: verify() must pass.
 * The card sections collapsed into one block: conditional media/header/
 * content/actions sections, children in the content area, right-aligned
 * action buttons (clicks never bubble to the card onclick), elevated/
 * outlined variants, clickable surface.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Card, { type CardAction } from '@lemonadejs/card';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-card') as HTMLElement;

describe('components/card', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Card);
        expect(report.pass).toBe(true);
    });

    it('renders bare by default: no media, header, content or actions sections', () => {
        handle = t(Card);
        expect(root()).not.toBeNull();
        expect(handle.query('.lm-card-media')).toBeNull();
        expect(handle.query('.lm-card-header')).toBeNull();
        expect(handle.query('.lm-card-content')).toBeNull();
        expect(handle.query('.lm-card-actions')).toBeNull();
        expect(root().hasAttribute('data-variant')).toBe(false); // '' = elevated
    });

    it('renders the header section when title/subtitle are set', () => {
        handle = t(Card, { title: 'Lemon tart', subtitle: 'Pastry of the day' });
        expect(handle.query('.lm-card-title')!.textContent).toBe('Lemon tart');
        expect(handle.query('.lm-card-subtitle')!.textContent).toBe('Pastry of the day');
        expect(handle.query('.lm-card-avatar')).toBeNull(); // avatar not set
        handle.unmount();

        handle = t(Card, { subtitle: 'only a subtitle' });
        expect(handle.query('.lm-card-header')).not.toBeNull();
        expect(handle.query('.lm-card-title')).toBeNull();
    });

    it('renders the avatar beside the header when set', () => {
        handle = t(Card, { avatar: '/me.png', title: 'Paul' });
        const avatar = handle.query('.lm-card-avatar') as HTMLImageElement;
        expect(avatar).not.toBeNull();
        expect(avatar.getAttribute('src')).toBe('/me.png');
        // avatar alone is enough to open the header section
        handle.unmount();
        handle = t(Card, { avatar: '/me.png' });
        expect(handle.query('.lm-card-header')).not.toBeNull();
    });

    it('renders the media image with the default 180px height', () => {
        handle = t(Card, { image: '/photo.jpg' });
        const media = handle.query('.lm-card-media') as HTMLImageElement;
        expect(media.getAttribute('src')).toBe('/photo.jpg');
        expect(media.style.height).toBe('180px');
    });

    it('imageheight sets the media height in px', () => {
        handle = t(Card, { image: '/photo.jpg', imageheight: 240 });
        expect((handle.query('.lm-card-media') as HTMLImageElement).style.height).toBe('240px');
    });

    it('keeps the image live: appearing, swapping and disappearing with a state', () => {
        const image = store('');
        handle = t(Card, { image });
        expect(handle.query('.lm-card-media')).toBeNull();

        image.value = '/a.jpg';
        expect(handle.query('.lm-card-media')!.getAttribute('src')).toBe('/a.jpg');

        image.value = '/b.jpg';
        expect(handle.query('.lm-card-media')!.getAttribute('src')).toBe('/b.jpg');

        image.value = ''; // branch closes
        expect(handle.query('.lm-card-media')).toBeNull();
    });

    it('keeps the title live: the header section follows the state', () => {
        const title = store('');
        handle = t(Card, { title });
        expect(handle.query('.lm-card-header')).toBeNull();

        title.value = 'Now I exist';
        expect(handle.query('.lm-card-title')!.textContent).toBe('Now I exist');

        title.value = 'Renamed';
        expect(handle.query('.lm-card-title')!.textContent).toBe('Renamed');

        title.value = ''; // branch closes
        expect(handle.query('.lm-card-header')).toBeNull();
    });

    it('renders the content text only when set', () => {
        handle = t(Card, { content: 'Body text' });
        expect(handle.query('.lm-card-text')!.textContent).toBe('Body text');
        handle.unmount();

        handle = t(Card, { title: 'No body' });
        expect(handle.query('.lm-card-content')).toBeNull();
    });

    it('renders children in the content area, after the content text', () => {
        const App: Component = () =>
            html`<main><${Card} content="first"><b>extra</b></${Card}></main>`;
        handle = t(App);
        const content = handle.query('.lm-card-content')!;
        expect(content.textContent).toBe('firstextra');
        expect(content.querySelector('b')!.textContent).toBe('extra');
    });

    it('children alone open the content area (no content prop needed)', () => {
        const App: Component = () => html`<main><${Card}><i>only children</i></${Card}></main>`;
        handle = t(App);
        const content = handle.query('.lm-card-content')!;
        expect(content).not.toBeNull();
        expect(content.querySelector('i')!.textContent).toBe('only children');
        expect(handle.query('.lm-card-text')).toBeNull();
    });

    it('renders action buttons with labels and color attributes', () => {
        handle = t(Card, {
            actions: [
                { label: 'Share' },
                { label: 'Delete', color: 'error' },
            ] as CardAction[],
        });
        const buttons = Array.from(root().querySelectorAll('.lm-card-action'));
        expect(buttons.map((b) => b.textContent)).toEqual(['Share', 'Delete']);
        expect(buttons[0].hasAttribute('data-color')).toBe(false); // '' = primary
        expect(buttons[1].getAttribute('data-color')).toBe('error');
    });

    it('action buttons fire their own onclick', () => {
        const fired: string[] = [];
        handle = t(Card, {
            actions: [
                { label: 'A', onclick: (e: MouseEvent, a: CardAction) => fired.push('A:' + a.label) },
                { label: 'B', onclick: () => fired.push('B') },
            ] as CardAction[],
        });
        const buttons = root().querySelectorAll<HTMLButtonElement>('.lm-card-action');
        buttons[0].click();
        buttons[1].click();
        expect(fired).toEqual(['A:A', 'B']);
    });

    it('clickable card fires onclick on the surface; idle cards stay silent', () => {
        let clicks = 0;
        handle = t(Card, { clickable: true, onclick: () => clicks++ });
        expect(root().className).toContain('lm-card-clickable');
        expect(root().getAttribute('role')).toBe('button');
        expect(root().getAttribute('tabindex')).toBe('0');

        root().click();
        expect(clicks).toBe(1);
        handle.unmount();

        clicks = 0;
        handle = t(Card, { onclick: () => clicks++ }); // not clickable
        expect(root().className).not.toContain('lm-card-clickable');
        expect(root().hasAttribute('role')).toBe(false);
        root().click();
        expect(clicks).toBe(0);
    });

    it('action clicks never double-fire the card onclick (stopPropagation)', () => {
        let card = 0;
        let action = 0;
        handle = t(Card, {
            clickable: true,
            onclick: () => card++,
            actions: [{ label: 'Buy', onclick: () => action++ }] as CardAction[],
        });

        (root().querySelector('.lm-card-action') as HTMLButtonElement).click();
        expect(action).toBe(1);
        expect(card).toBe(0); // the action swallowed the bubble

        root().click(); // the surface itself still works
        expect(card).toBe(1);
    });

    it('exposes the variant as a data attribute', () => {
        handle = t(Card, { variant: 'outlined' });
        expect(root().getAttribute('data-variant')).toBe('outlined');
        handle.unmount();

        handle = t(Card);
        expect(root().hasAttribute('data-variant')).toBe(false); // '' = elevated
    });

    it('keeps the action row live when bound to a state', () => {
        const actions = store<CardAction[]>([]);
        handle = t(Card, { actions });
        expect(handle.query('.lm-card-actions')).toBeNull();

        actions.value = [{ label: 'One' }, { label: 'Two' }];
        expect(root().querySelectorAll('.lm-card-action').length).toBe(2);

        actions.value = []; // branch closes
        expect(handle.query('.lm-card-actions')).toBeNull();
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Card} clickable="true" variant="outlined"
                image="/x.jpg" imageheight="320" title="Coerced" /></main>`;
        handle = t(App);
        expect(root().className).toContain('lm-card-clickable');
        expect(root().getAttribute('data-variant')).toBe('outlined');
        expect((handle.query('.lm-card-media') as HTMLImageElement).style.height).toBe('320px');
    });
});
