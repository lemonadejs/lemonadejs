/**
 * <Topmenu /> block tests — composed on the Contextmenu block (v5
 * architecture). The dropdown renders as the Contextmenu's headerless
 * Modal: tests await one flush() after every open because the Modal
 * defers its per-open setup one microtask.
 *
 * jsdom has no layout — getBoundingClientRect is all zeros, so the
 * dropdown POSITION cannot be asserted here; structure and state are.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render as t, verify } from 'lemonadejs/test';
import Topmenu, { type TopmenuItem } from '@lemonadejs/topmenu';

type Api = { open(index?: number): void; close(): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const options = (clicked: string[] = []): TopmenuItem[] => [
    {
        title: 'File',
        submenu: [
            { title: 'New', onclick: () => clicked.push('New') },
            { title: 'Open', onclick: () => clicked.push('Open') },
        ],
    },
    {
        title: 'Edit',
        submenu: [
            { title: 'Copy', onclick: () => clicked.push('Copy') },
            { title: 'Paste', onclick: () => clicked.push('Paste') },
        ],
    },
    { title: 'Blocked', disabled: true, submenu: [{ title: 'Never' }] },
    { title: 'About' }, // no submenu — inert title (v5)
];

const mountBar = (clicked: string[] = []) => {
    let api: Api | null = null;
    handle = t(Topmenu, {
        options: options(clicked),
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const bar = () => handle!.query('.lm-topmenu') as HTMLElement;
const titles = () => handle!.queryAll('.lm-topmenu-title');
const menus = () => handle!.queryAll('.lm-modal');
const rows = () => [...menus()[0].querySelectorAll('[data-item]')] as HTMLElement[];
const press = (i: number) => titles()[i].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
const hover = (i: number) => titles()[i].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
const key = (el: HTMLElement, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('components/topmenu — a menubar on the Contextmenu block', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Topmenu).pass).toBe(true);
    });

    it('renders the bar items with the v5 ARIA model', () => {
        mountBar();
        // the menubar role sits on the options row so it DIRECTLY owns the
        // menuitems (the composed Contextmenu renders outside it)
        const menubar = handle!.query('.lm-topmenu-options') as HTMLElement;
        expect(menubar.getAttribute('role')).toBe('menubar');
        expect(menubar.getAttribute('aria-orientation')).toBe('horizontal');
        expect(bar().hasAttribute('role')).toBe(false);
        expect(titles().map((el) => el.textContent)).toEqual(['File', 'Edit', 'Blocked', 'About']);
        expect(titles()[0].getAttribute('role')).toBe('menuitem');
        expect(titles()[0].getAttribute('aria-haspopup')).toBe('true');
        expect(titles()[3].getAttribute('aria-haspopup')).toBe('false');
        expect(titles()[0].getAttribute('tabindex')).toBe('0'); // the roving stop
        expect(titles()[1].getAttribute('tabindex')).toBe('-1'); // one tab stop only
        expect(titles()[2].hasAttribute('tabindex')).toBe(false); // disabled: unreachable
        expect(titles()[2].getAttribute('data-disabled')).toBe('true');
        expect(menus()).toHaveLength(0); // closed by default
    });

    it('roving tabindex follows the selection', () => {
        mountBar();
        titles()[1].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(titles()[1].getAttribute('tabindex')).toBe('0');
        expect(titles()[0].getAttribute('tabindex')).toBe('-1');
    });

    it('mousedown on a top item opens its dropdown as a Contextmenu Modal', async () => {
        mountBar();
        press(0);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].querySelector('.lm-modal-header')).toBeNull(); // headerless panel
        expect(menus()[0].textContent).toContain('New');
        expect(titles()[0].getAttribute('aria-expanded')).toBe('true');
        expect(titles()[0].getAttribute('data-selected')).toBe('true');
    });

    it('mousedown on the same item again closes (toggle)', async () => {
        mountBar();
        press(0);
        await flush();
        expect(menus()).toHaveLength(1);
        press(0);
        await flush();
        expect(menus()).toHaveLength(0);
        expect(titles()[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('mousedown on another item switches the dropdown', async () => {
        mountBar();
        press(0);
        await flush();
        press(1);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('Copy');
        expect(titles()[0].getAttribute('aria-expanded')).toBe('false');
        expect(titles()[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('while open, hovering another top item moves the dropdown (v5 menubar behavior)', async () => {
        mountBar();
        press(0);
        await flush();
        hover(1);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('Paste');
        expect(titles()[1].getAttribute('data-selected')).toBe('true');
        expect(titles()[0].getAttribute('data-selected')).toBeNull();
    });

    it('hover does NOT open anything while the menu is closed', async () => {
        mountBar();
        hover(1);
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('disabled and submenu-less items never open', async () => {
        mountBar();
        press(2); // Blocked
        await flush();
        expect(menus()).toHaveLength(0);
        press(3); // About: no submenu
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('clicking a dropdown item fires its onclick and closes everything', async () => {
        const clicked: string[] = [];
        mountBar(clicked);
        press(0);
        await flush();
        rows()[1].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        expect(clicked).toEqual(['Open']);
        expect(menus()).toHaveLength(0);
        expect(titles()[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('outside mousedown closes the dropdown', async () => {
        mountBar();
        press(0);
        await flush();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(menus()).toHaveLength(0);
    });

    it('keyboard: ArrowRight/ArrowLeft walk enabled items, skipping disabled and wrapping', () => {
        mountBar();
        titles()[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true })); // v5: focusin selects
        expect(titles()[0].getAttribute('data-selected')).toBe('true');

        key(bar(), 'ArrowRight');
        expect(titles()[1].getAttribute('data-selected')).toBe('true');
        key(bar(), 'ArrowRight'); // skips Blocked
        expect(titles()[3].getAttribute('data-selected')).toBe('true');
        key(bar(), 'ArrowRight'); // wraps
        expect(titles()[0].getAttribute('data-selected')).toBe('true');
        key(bar(), 'ArrowLeft'); // wraps backwards
        expect(titles()[3].getAttribute('data-selected')).toBe('true');
        expect(menus()).toHaveLength(0); // selection only — menu stays closed
    });

    it('keyboard: Enter toggles the selected dropdown', async () => {
        mountBar();
        titles()[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        key(bar(), 'Enter');
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('New');
        key(bar(), 'Enter');
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('keyboard: Space toggles and ArrowDown opens the selected dropdown', async () => {
        mountBar();
        titles()[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        key(bar(), ' ');
        await flush();
        expect(menus()).toHaveLength(1);
        key(bar(), ' ');
        await flush();
        expect(menus()).toHaveLength(0);

        key(bar(), 'ArrowDown');
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('New');
    });

    it('Escape in the open dropdown lands focus back on the menubar item (WCAG 2.4.3)', async () => {
        mountBar();
        titles()[0].focus();
        key(bar(), 'Enter'); // keyboard open — the Contextmenu wrapper takes focus
        await flush();
        expect(menus()).toHaveLength(1);
        const wrapper = handle!.query('.lm-contextmenu') as HTMLElement;
        expect(document.activeElement).toBe(wrapper);
        key(wrapper, 'Escape');
        expect(menus()).toHaveLength(0);
        expect(document.activeElement).toBe(titles()[0]);
    });

    it('keyboard while open: unhandled arrows bubble out of the Contextmenu and move the open dropdown', async () => {
        mountBar();
        press(0);
        await flush();
        // The Contextmenu wrapper holds focus while open; ArrowRight with no
        // submenu under its cursor is unhandled there and bubbles to the bar
        const wrapper = handle!.query('.lm-contextmenu') as HTMLElement;
        key(wrapper, 'ArrowRight');
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('Copy'); // Edit's dropdown now
        expect(titles()[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('keyboard inside the dropdown stays the Contextmenu system (Escape closes)', async () => {
        mountBar();
        press(0);
        await flush();
        const wrapper = handle!.query('.lm-contextmenu') as HTMLElement;
        key(wrapper, 'ArrowDown');
        expect(menus()[0].querySelector('.lm-contextmenu-cursor')?.textContent).toContain('New');
        key(wrapper, 'Escape');
        expect(menus()).toHaveLength(0);
    });

    it('focusout of the whole bar clears the selection highlight', () => {
        mountBar();
        titles()[1].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(titles()[1].getAttribute('data-selected')).toBe('true');

        bar().dispatchEvent(new FocusEvent('focusout', { bubbles: true })); // relatedTarget: outside
        expect(titles()[1].getAttribute('data-selected')).toBeNull();
    });

    it('api.open(index) opens programmatically; api.close() dismisses; bare open() reuses the remembered index (v5)', async () => {
        const api = mountBar();
        api.open(); // nothing remembered yet → v5 default 0
        await flush();
        expect(menus()[0].textContent).toContain('New');

        api.open(1);
        await flush();
        expect(menus()[0].textContent).toContain('Copy');

        api.close();
        await flush();
        expect(menus()).toHaveLength(0);

        api.open(); // v5: defaults to currentIndex — still Edit
        await flush();
        expect(menus()[0].textContent).toContain('Copy');
    });

    it('options is live: replacing it re-renders the bar', async () => {
        mountBar();
        handle!.unmount();
        const { store } = await import('lemonadejs');
        const opts = store<TopmenuItem[]>([{ title: 'One' }]);
        handle = t(Topmenu, { options: opts });
        expect(titles().map((el) => el.textContent)).toEqual(['One']);
        opts.value = [{ title: 'One' }, { title: 'Two' }];
        expect(titles().map((el) => el.textContent)).toEqual(['One', 'Two']);
    });
});
