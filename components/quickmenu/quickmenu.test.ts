/**
 * <Quickmenu /> block tests — a dropdown button composed on the
 * Contextmenu block (v5 architecture). The menu renders as the
 * Contextmenu's headerless Modal: tests await one flush() after every
 * open because the Modal defers its per-open setup one microtask.
 *
 * jsdom has no layout — getBoundingClientRect is all zeros, so the menu
 * POSITION cannot be asserted here; structure and state are.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Quickmenu, { type QuickmenuItem } from '@lemonadejs/quickmenu';

type Api = { open(): void; close(): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const options = (clicked: string[] = []): QuickmenuItem[] => [
    { title: 'Save', onclick: () => clicked.push('Save') },
    { type: 'line' },
    { title: 'Export', submenu: [{ title: 'As CSV', onclick: () => clicked.push('CSV') }] },
    { title: 'Blocked', disabled: true },
];

const mountMenu = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Quickmenu as never, {
        title: 'Actions',
        options: options(),
        ref: (a: Api) => (api = a),
        ...props,
    } as never);
    return api!;
};

const root = () => handle!.query('.lm-quickmenu') as HTMLElement;
const header = () => handle!.query('.lm-quickmenu-header') as HTMLElement;
const menus = () => handle!.queryAll('.lm-modal');
const rows = () => [...menus()[0].querySelectorAll('[data-item]')] as HTMLElement[];
const fire = (type: string) =>
    header().dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
const key = (k: string) =>
    header().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('components/quickmenu — a dropdown button on the Contextmenu block', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Quickmenu as never).pass).toBe(true);
    });

    it('renders the header with the title and the v6 button ARIA model', () => {
        mountMenu();
        expect(header().textContent).toBe('Actions');
        expect(header().getAttribute('role')).toBe('button');
        expect(header().getAttribute('aria-haspopup')).toBe('true');
        expect(header().getAttribute('aria-expanded')).toBe('false');
        expect(header().getAttribute('tabindex')).toBe('0');
        expect(menus()).toHaveLength(0); // closed by default
    });

    it('title is live: replacing the state re-renders the header', () => {
        const title = store('One');
        handle = t(Quickmenu as never, { title } as never);
        expect(header().textContent).toBe('One');
        title.value = 'Two';
        expect(header().textContent).toBe('Two');
    });

    it('width sizes the header and stays live (v5 :width)', () => {
        const width = store(200);
        handle = t(Quickmenu as never, { title: 'W', width } as never);
        expect(header().style.width).toBe('200px');
        width.value = 320;
        expect(header().style.width).toBe('320px');
    });

    it('click on the header opens the menu as a headerless Contextmenu Modal', async () => {
        mountMenu();
        fire('click');
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].querySelector('.lm-modal-header')).toBeNull();
        expect(menus()[0].textContent).toContain('Save');
        expect(header().getAttribute('aria-expanded')).toBe('true');
    });

    it('hover opens too (v5 onmouseover trigger)', async () => {
        mountMenu();
        fire('mouseover');
        await flush();
        expect(menus()).toHaveLength(1);
    });

    it('contextmenu opens and the trigger event is cancelled (v5 preventDefault)', async () => {
        mountMenu();
        const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        header().dispatchEvent(e);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(e.defaultPrevented).toBe(true);
    });

    it('mousedown on the header never reaches the outside-mousedown closer', async () => {
        mountMenu();
        fire('mouseover'); // hover already opened it, as with a real mouse
        await flush();
        fire('mousedown'); // pressing the header must not dismiss the menu
        await flush();
        expect(menus()).toHaveLength(1);
    });

    it('clicking a menu item fires its onclick and closes everything', async () => {
        const clicked: string[] = [];
        let api: Api | null = null;
        handle = t(Quickmenu as never, {
            title: 'Actions',
            options: options(clicked),
            ref: (a: Api) => (api = a),
        } as never);
        api!.open();
        await flush();
        rows()[0].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        expect(clicked).toEqual(['Save']);
        expect(menus()).toHaveLength(0);
        expect(header().getAttribute('aria-expanded')).toBe('false');
    });

    it('renders the full v5 item model: separators, disabled, submenu arrow', async () => {
        mountMenu();
        fire('click');
        await flush();
        expect(menus()[0].querySelector('.lm-contextmenu-line')).not.toBeNull();
        expect(rows()[2].className).toContain('lm-contextmenu-disabled');
        expect(rows()[1].getAttribute('aria-haspopup')).toBe('true'); // Export has a submenu
    });

    it('outside mousedown closes the menu', async () => {
        mountMenu();
        fire('click');
        await flush();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(menus()).toHaveLength(0);
    });

    it('keyboard on the header: Enter, Space and ArrowDown open', async () => {
        mountMenu();
        for (const k of ['Enter', ' ', 'ArrowDown']) {
            key(k);
            await flush();
            expect(menus()).toHaveLength(1);
            document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            await flush();
            expect(menus()).toHaveLength(0);
        }
    });

    it('keyboard inside the open menu stays the Contextmenu system (Escape closes)', async () => {
        mountMenu();
        fire('click');
        await flush();
        const wrapper = handle!.query('.lm-contextmenu') as HTMLElement;
        wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(menus()[0].querySelector('.lm-contextmenu-cursor')?.textContent).toContain('Save');
        wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(menus()).toHaveLength(0);
    });

    it('api.open() opens programmatically; api.close() dismisses', async () => {
        const api = mountMenu();
        api.open();
        await flush();
        expect(menus()).toHaveLength(1);
        api.close();
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('fires onopen and onclose', async () => {
        const log: string[] = [];
        const api = mountMenu({
            onopen: () => log.push('open'),
            onclose: () => log.push('close'),
        });
        api.open();
        await flush();
        api.close();
        await flush();
        expect(log).toEqual(['open', 'close']);
    });

    it('disabled blocks every trigger and unfocuses the header', async () => {
        mountMenu({ disabled: true });
        expect(root().getAttribute('data-disabled')).toBe('true');
        expect(header().hasAttribute('tabindex')).toBe(false);
        for (const type of ['click', 'mouseover', 'contextmenu']) {
            fire(type);
            await flush();
        }
        key('Enter');
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('options is live: the next open reads the replaced list', async () => {
        const opts = store<QuickmenuItem[]>([{ title: 'First' }]);
        let api: Api | null = null;
        handle = t(Quickmenu as never, {
            title: 'Live',
            options: opts,
            ref: (a: Api) => (api = a),
        } as never);
        api!.open();
        await flush();
        expect(menus()[0].textContent).toContain('First');

        api!.close();
        opts.value = [{ title: 'Second' }];
        api!.open();
        await flush();
        expect(menus()[0].textContent).toContain('Second');
    });

    it('destroy-clean: unmount removes the open menu with no leftovers', async () => {
        mountMenu();
        fire('click');
        await flush();
        expect(menus()).toHaveLength(1);
        handle!.unmount();
        expect(document.querySelector('.lm-modal')).toBeNull();
        expect(document.querySelector('.lm-quickmenu')).toBeNull();
        handle = null;
    });
});
