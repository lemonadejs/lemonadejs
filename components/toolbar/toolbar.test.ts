/**
 * <Toolbar /> block tests — composed on the Contextmenu block (v5
 * architecture: pickers open a contextmenu under their header). The
 * dropdown renders as the Contextmenu's headerless Modal: tests await
 * one flush() after every open because the Modal defers its per-open
 * setup one microtask.
 *
 * jsdom has no layout — getBoundingClientRect is all zeros, so the
 * dropdown POSITION cannot be asserted here; structure and state are.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Toolbar, { type ToolbarItem } from '@lemonadejs/toolbar';

type Api = { open(index: number): void; close(): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const mountBar = (props: Record<string, unknown>) => {
    handle = t(Toolbar, props);
};

const root = () => handle!.query('.lm-toolbar') as HTMLElement;
const items = () => handle!.queryAll('.lm-toolbar-item');
const headers = () => handle!.queryAll('.lm-toolbar-picker-header');
const menus = () => handle!.queryAll('.lm-modal');
const rows = () => [...menus()[0].querySelectorAll('[data-item]')] as HTMLElement[];
const anchor = (i: number) => items()[i].querySelector('a') as HTMLElement;
const down = (el: Element) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
const over = (el: Element) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const pick = (i: number) => rows()[i].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

describe('components/toolbar — an action bar with Contextmenu pickers', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Toolbar).pass).toBe(true);
    });

    it('renders the v5 item anatomy: anchor with icon, title, image — only the provided parts', () => {
        mountBar({
            options: [
                { icon: 'undo', title: 'Undo' },
                { icon: 'redo' },
                { title: 'About' },
                { image: '/logo.png' },
            ] as ToolbarItem[],
        });
        expect(root().getAttribute('role')).toBe('toolbar');
        expect(items()).toHaveLength(4);

        const full = items()[0];
        expect(full.querySelector('i')!.textContent).toBe('undo');
        expect(full.querySelector('i')!.className).toContain('material-icons');
        expect(full.querySelector('span')!.textContent).toBe('Undo');
        expect(full.querySelector('img')).toBeNull();

        expect(items()[1].querySelector('span')).toBeNull(); // icon only
        expect(items()[2].querySelector('i')).toBeNull(); // title only
        expect(items()[3].querySelector('img')!.getAttribute('src')).toBe('/logo.png');
    });

    it('renders dividers for both spellings (v5 divisor, v6 divider)', () => {
        mountBar({
            options: [{ icon: 'a' }, { type: 'divisor' }, { type: 'divider' }, { icon: 'b' }] as ToolbarItem[],
        });
        const lines = handle!.queryAll('.lm-toolbar-divisor');
        expect(lines).toHaveLength(2);
        expect(lines[0].getAttribute('role')).toBe('separator');
    });

    it('route renders as the anchor href; no route, no href (v5 route)', () => {
        mountBar({ options: [{ title: 'Docs', route: '#docs' }, { title: 'Plain' }] as ToolbarItem[] });
        expect(anchor(0).getAttribute('href')).toBe('#docs');
        expect(anchor(1).hasAttribute('href')).toBe(false);
    });

    it('exposes position and visible on the root as v5 data attributes', () => {
        mountBar({ options: [] });
        expect(root().hasAttribute('data-position')).toBe(false); // default: fixed bottom bar
        expect(root().getAttribute('data-visible')).toBe('true');
        handle!.unmount();

        const visible = store(true);
        mountBar({ options: [], position: 'static', visible });
        expect(root().getAttribute('data-position')).toBe('static');
        visible.value = false; // live: the CSS hides the bar
        expect(root().getAttribute('data-visible')).toBe('false');
    });

    it('exposes selected, visible and gap as per-item data attributes', () => {
        mountBar({
            options: [
                { icon: 'a', selected: true },
                { icon: 'b', visible: false },
                { icon: 'c', gap: true },
                { icon: 'd' },
            ] as ToolbarItem[],
        });
        expect(items()[0].getAttribute('data-selected')).toBe('true');
        expect(items()[1].getAttribute('data-visible')).toBe('false');
        expect(items()[2].getAttribute('data-gap')).toBe('true');
        expect(items()[3].hasAttribute('data-selected')).toBe(false); // absent → no attribute
        expect(items()[3].hasAttribute('data-visible')).toBe(false);
        expect(items()[3].hasAttribute('data-gap')).toBe(false);
    });

    it('fires item.onclick and the toolbar onitemclick on activation', () => {
        const log: string[] = [];
        mountBar({
            options: [
                { icon: 'undo', onclick: (e: Event, item: ToolbarItem) => log.push('item:' + item.icon) },
                { icon: 'redo' },
            ] as ToolbarItem[],
            onitemclick: (e: Event, item: ToolbarItem, index: number) =>
                log.push('bar:' + item.icon + ':' + index),
        });
        click(anchor(0));
        expect(log).toEqual(['item:undo', 'bar:undo:0']);
        click(anchor(1)); // no item handler — the bar event still fires
        expect(log).toEqual(['item:undo', 'bar:undo:0', 'bar:redo:1']);
    });

    it('disabled items activate nothing', () => {
        const log: string[] = [];
        mountBar({
            options: [{ icon: 'undo', disabled: true, onclick: () => log.push('item') }] as ToolbarItem[],
            onitemclick: () => log.push('bar'),
        });
        expect(items()[0].getAttribute('data-disabled')).toBe('true');
        click(anchor(0));
        expect(log).toEqual([]);
    });

    it('renders select items as picker headers, closed by default', () => {
        mountBar({ options: [{ type: 'select', title: 'Font', options: ['Verdana'] }] as ToolbarItem[] });
        expect(headers()).toHaveLength(1);
        expect(headers()[0].textContent).toBe('Font');
        expect(headers()[0].getAttribute('aria-haspopup')).toBe('true');
        expect(headers()[0].getAttribute('aria-expanded')).toBe('false');
        expect(headers()[0].getAttribute('tabindex')).toBe('0');
        expect(menus()).toHaveLength(0);
    });

    it('mousedown on the header opens the dropdown; string options become titles (v5)', async () => {
        mountBar({
            options: [{ type: 'select', title: 'Font', options: ['Verdana', 'Arial'] }] as ToolbarItem[],
        });
        down(headers()[0]);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].querySelector('.lm-modal-header')).toBeNull(); // headerless panel
        expect(rows().map((el) => el.textContent!.trim())).toEqual(['Verdana', 'Arial']);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('true');
    });

    it('mouseover opens the picker too (v5 opens on hover)', async () => {
        mountBar({ options: [{ type: 'select', title: 'Font', options: ['Verdana'] }] as ToolbarItem[] });
        over(headers()[0]);
        await flush();
        expect(menus()).toHaveLength(1);
    });

    it('hovering another picker moves the open dropdown to it', async () => {
        mountBar({
            options: [
                { type: 'select', title: 'Font', options: ['Verdana'] },
                { type: 'select', title: 'Size', options: ['10px', '12px'] },
            ] as ToolbarItem[],
        });
        down(headers()[0]);
        await flush();
        over(headers()[1]);
        await flush();
        expect(menus()).toHaveLength(1); // one shared menu, not a stack
        expect(menus()[0].textContent).toContain('12px');
        expect(headers()[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('picking an option fires its onclick and the toolbar onchange, then closes', async () => {
        const log: string[] = [];
        const font: ToolbarItem = {
            type: 'select',
            title: 'Font',
            options: ['Verdana', { title: 'Arial', onclick: () => log.push('option:Arial') }],
        };
        mountBar({
            options: [font],
            onchange: (e: Event, item: ToolbarItem, option: { title?: string }) =>
                log.push('change:' + item.title + ':' + option.title),
        });
        down(headers()[0]);
        await flush();
        pick(1);
        expect(log).toEqual(['option:Arial', 'change:Font:Arial']);
        expect(menus()).toHaveLength(0);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('false');

        down(headers()[0]); // reopens after a pick
        await flush();
        pick(0); // plain string option: only the toolbar onchange
        expect(log).toEqual(['option:Arial', 'change:Font:Arial', 'change:Font:Verdana']);
    });

    it('outside mousedown closes the dropdown', async () => {
        mountBar({ options: [{ type: 'select', title: 'Font', options: ['Verdana'] }] as ToolbarItem[] });
        down(headers()[0]);
        await flush();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(menus()).toHaveLength(0);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('disabled pickers never open', async () => {
        mountBar({
            options: [{ type: 'select', title: 'Font', disabled: true, options: ['Verdana'] }] as ToolbarItem[],
        });
        expect(headers()[0].hasAttribute('tabindex')).toBe(false);
        down(headers()[0]);
        over(headers()[0]);
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('api.open(index) opens a picker by items index; api.close() dismisses', async () => {
        let api: Api | null = null;
        mountBar({
            options: [
                { icon: 'undo' },
                { type: 'divider' },
                { type: 'select', title: 'Size', options: ['10px'] },
            ] as ToolbarItem[],
            ref: (a: Api) => (api = a),
        });
        api!.open(0); // not a select — ignored
        await flush();
        expect(menus()).toHaveLength(0);

        api!.open(2);
        await flush();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].textContent).toContain('10px');

        api!.close();
        await flush();
        expect(menus()).toHaveLength(0);
    });

    it('options is live: replacing it re-renders the bar', () => {
        const opts = store<ToolbarItem[]>([{ icon: 'undo', title: 'Undo' }]);
        mountBar({ options: opts });
        expect(items()).toHaveLength(1);
        opts.value = [
            { icon: 'undo', title: 'Undo' },
            { type: 'divider' },
            { icon: 'redo', title: 'Redo' },
        ];
        expect(items()).toHaveLength(2);
        expect(handle!.queryAll('.lm-toolbar-divisor')).toHaveLength(1);
        expect(items()[1].querySelector('span')!.textContent).toBe('Redo');
    });
});
