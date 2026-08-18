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
        expect(headers()[0].querySelector('.lm-toolbar-picker-label')!.textContent).toBe('Font');
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
        // onchange sees the PREVIOUS title; then the header mirrors the pick
        expect(log).toEqual(['option:Arial', 'change:Font:Arial']);
        expect(menus()).toHaveLength(0);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('false');
        expect(headers()[0].querySelector('.lm-toolbar-picker-label')!.textContent).toBe('Arial');

        down(headers()[0]); // reopens after a pick
        await flush();
        pick(0); // plain string option: only the toolbar onchange
        expect(log).toEqual(['option:Arial', 'change:Font:Arial', 'change:Arial:Verdana']);
        expect(headers()[0].querySelector('.lm-toolbar-picker-label')!.textContent).toBe('Verdana');
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
        expect(headers()[0].getAttribute('tabindex')).toBe('-1'); // disabled: never a tab stop
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

    it('api.refresh() re-evaluates flags and titles mutated in place (editor host)', () => {
        let api: { refresh(): void } | null = null;
        const bold: ToolbarItem = { icon: 'format_bold' };
        const heading: ToolbarItem = { type: 'select', title: 'Paragraph', options: ['Paragraph', 'Heading 1'] };
        mountBar({ options: [bold, heading], ref: (a: { refresh(): void }) => (api = a) });
        expect(items()[0].hasAttribute('data-selected')).toBe(false);

        bold.selected = true; // a caret move flips the toggle states...
        heading.title = 'Heading 1';
        api!.refresh(); // ...and one refresh patches the bar in place
        expect(items()[0].getAttribute('data-selected')).toBe('true');
        expect(headers()[0].querySelector('.lm-toolbar-picker-label')!.textContent).toBe('Heading 1');

        bold.selected = false;
        api!.refresh();
        expect(items()[0].hasAttribute('data-selected')).toBe(false);
    });

    it('item.tooltip renders as the anchor title without a visible label', () => {
        mountBar({ options: [{ icon: 'format_bold', tooltip: 'Bold (Ctrl+B)' }] as ToolbarItem[] });
        expect(anchor(0).getAttribute('title')).toBe('Bold (Ctrl+B)');
        expect(items()[0].querySelector('span')).toBeNull();
    });

    it('color items open the Color block popover; a pick reports on both channels and closes', async () => {
        const log: string[] = [];
        const color: ToolbarItem = {
            type: 'color',
            icon: 'format_color_text',
            tooltip: 'Text color',
            onchange: (value: string) => log.push('item:' + value),
        };
        mountBar({
            options: [color],
            onchange: (e: Event | null, item: ToolbarItem, option: { value?: string }) =>
                log.push('bar:' + option.value),
        });
        expect(handle!.query('.lm-toolbar-color-pop')).toBeNull();
        click(anchor(0));
        await flush();
        const pop = handle!.query('.lm-toolbar-color-pop');
        expect(pop).not.toBeNull();
        expect(pop!.querySelector('.lm-color-grid')).not.toBeNull(); // the Color block panel

        const swatchCell = pop!.querySelector('.lm-color-cell[data-value="#f44336"]') as HTMLElement;
        swatchCell.click();
        expect(log).toEqual(['item:#f44336', 'bar:#f44336']);
        expect(color.value).toBe('#f44336');
        expect(handle!.query('.lm-toolbar-color-pop')).toBeNull(); // a pick closes it
        const swatch = items()[0].querySelector('.lm-toolbar-swatch') as HTMLElement;
        expect(swatch.style.backgroundColor).toBe('rgb(244, 67, 54)');
    });

    it('outside mousedown closes the color popover without a pick', async () => {
        const color: ToolbarItem = { type: 'color', icon: 'format_color_fill' };
        mountBar({ options: [color] });
        click(anchor(0));
        await flush();
        expect(handle!.query('.lm-toolbar-color-pop')).not.toBeNull();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(handle!.query('.lm-toolbar-color-pop')).toBeNull();
        expect(color.value).toBeUndefined();
    });

    it('Escape in the picker dropdown lands focus back on the header (WCAG 2.4.3)', async () => {
        mountBar({
            options: [{ type: 'select', title: 'Font', options: ['Arial', 'Verdana'] }] as ToolbarItem[],
        });
        headers()[0].focus();
        headers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await flush();
        expect(menus()).toHaveLength(1);
        const wrapper = handle!.query('.lm-contextmenu') as HTMLElement;
        expect(document.activeElement).toBe(wrapper);
        wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(menus()).toHaveLength(0);
        expect(document.activeElement).toBe(headers()[0]);
    });

    it('Escape in the color popover lands focus back on the swatch item (WCAG 2.4.3)', async () => {
        const color: ToolbarItem = { type: 'color', icon: 'format_color_fill', tooltip: 'Fill' };
        mountBar({ options: [color] });
        anchor(0).focus();
        click(anchor(0));
        await flush();
        expect(handle!.query('.lm-toolbar-color-pop')).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(handle!.query('.lm-toolbar-color-pop')).toBeNull();
        expect(document.activeElement).toBe(anchor(0));
    });

    it('keyboard: roving tabindex — one tab stop, arrows walk enabled items, Home/End jump', () => {
        mountBar({
            options: [
                { icon: 'undo', title: 'Undo' },
                { type: 'divider' },
                { icon: 'redo', title: 'Redo', disabled: true }, // skipped
                { type: 'select', title: 'Font', options: ['Arial'] },
                { icon: 'save', title: 'Save' },
            ] as ToolbarItem[],
        });
        const stops = () => [...anchor(0).closest('.lm-toolbar')!.querySelectorAll('.lm-toolbar-item > a, .lm-toolbar-picker-header')];
        // exactly ONE tab stop, on the first enabled item
        expect(stops().map((el) => el.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);

        const key = (k: string) => root().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
        key('ArrowRight'); // skips the disabled redo, lands on the picker
        expect(document.activeElement).toBe(headers()[0]);
        expect(stops().map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0', '-1']);

        key('ArrowRight');
        expect(document.activeElement).toBe(stops()[3]); // Save
        key('ArrowRight'); // wraps back to Undo
        expect(document.activeElement).toBe(stops()[0]);
        key('End');
        expect(document.activeElement).toBe(stops()[3]);
        key('Home');
        expect(document.activeElement).toBe(stops()[0]);
    });

    it('keyboard: Enter/Space activate an item; Space/ArrowDown open a picker', async () => {
        const log: string[] = [];
        mountBar({
            options: [
                { icon: 'undo', onclick: () => log.push('undo') },
                { type: 'select', title: 'Font', options: ['Arial'] },
            ] as ToolbarItem[],
            onitemclick: () => log.push('bar'),
        });
        const a = anchor(0);
        a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        a.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(log).toEqual(['undo', 'bar', 'undo', 'bar']);

        headers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await flush();
        expect(menus()).toHaveLength(1);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('true');
    });

    it('exposes button semantics: role, aria-pressed for toggles, aria-disabled', () => {
        mountBar({
            options: [
                { icon: 'bold', selected: true },
                { icon: 'italic', selected: false },
                { icon: 'undo' },                     // no selected flag: not a toggle
                { icon: 'redo', disabled: true },
                { title: 'Docs', route: '#docs' },    // a real link keeps link semantics
            ] as ToolbarItem[],
        });
        expect(anchor(0).getAttribute('role')).toBe('button');
        expect(anchor(0).getAttribute('aria-pressed')).toBe('true');
        expect(anchor(1).getAttribute('aria-pressed')).toBe('false');
        expect(anchor(2).hasAttribute('aria-pressed')).toBe(false);
        expect(anchor(3).getAttribute('aria-disabled')).toBe('true');
        expect(anchor(4).hasAttribute('role')).toBe(false);
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
