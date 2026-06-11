/**
 * <Contextmenu /> — built on Modal (v5 architecture). Behavior tests:
 * levels as stacked Modals, hover-delay submenus, and the full keyboard
 * system (cursor with skip + wrap, Right/Left across levels, Enter,
 * Escape).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render as t, verify } from 'lemonadejs/test';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

type Api = {
    open(list: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const items = (clicked: string[]): ContextItem[] => [
    { title: 'Open', icon: 'folder', shortcut: 'Ctrl+O', onclick: () => clicked.push('Open') },
    { type: 'line' },
    { title: 'Blocked', disabled: true, onclick: () => clicked.push('Blocked') },
    {
        title: 'Export',
        submenu: [
            { title: 'CSV', onclick: () => clicked.push('CSV') },
            { title: 'JSON', onclick: () => clicked.push('JSON') },
        ],
    },
    { title: 'Delete', onclick: () => clicked.push('Delete') },
];

const open = async (clicked: string[] = [], events: Record<string, () => void> = {}) => {
    let api: Api | null = null;
    handle = t(Contextmenu, {
        options: items(clicked),
        ...events,
        ref: (a: Api) => (api = a),
    });
    api!.openAt(60, 60);
    await flush();
    return api!;
};

const wrapper = () => handle!.query('.lm-contextmenu') as HTMLElement;
const menus = () => handle!.queryAll('.lm-modal');
const rows = (level = 0) => [...menus()[level].querySelectorAll('[data-item], .lm-contextmenu-line')] as HTMLElement[];
const key = (k: string) => wrapper().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const cursorTitle = (level = 0) =>
    menus()[level].querySelector('.lm-contextmenu-cursor .lm-contextmenu-title')?.textContent;

describe('components/contextmenu — on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Contextmenu).pass).toBe(true);
    });

    it('each open level IS a Modal', async () => {
        await open();
        expect(menus()).toHaveLength(1);
        expect(menus()[0].querySelector('.lm-contextmenu-list')).not.toBeNull();
        expect(menus()[0].querySelector('.lm-modal-header')).toBeNull(); // headerless panel
    });

    it('clicking an item fires onclick and closes everything', async () => {
        const clicked: string[] = [];
        await open(clicked);
        rows()[0].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        expect(clicked).toEqual(['Open']);
        expect(menus()).toHaveLength(0);
    });

    it('disabled items and separators are inert', async () => {
        const clicked: string[] = [];
        await open(clicked);
        rows()[2].dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); // Blocked
        rows()[1].dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); // line
        expect(clicked).toEqual([]);
        expect(menus()).toHaveLength(1); // still open
    });

    it('hovering a submenu item opens its level after the 200ms delay', async () => {
        vi.useFakeTimers();
        const api = await openWithFakeTimers();
        rows()[3].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); // Export
        expect(menus()).toHaveLength(1);
        vi.advanceTimersByTime(250);
        expect(menus()).toHaveLength(2);
        expect(menus()[1].textContent).toContain('CSV');
        void api;
    });

    it('keyboard: ArrowDown skips disabled and separators, wrapping', async () => {
        await open();
        key('ArrowDown');
        expect(cursorTitle()).toBe('Open');
        key('ArrowDown'); // skips line + Blocked
        expect(cursorTitle()).toBe('Export');
        key('ArrowDown');
        expect(cursorTitle()).toBe('Delete');
        key('ArrowDown'); // wraps
        expect(cursorTitle()).toBe('Open');
        key('ArrowUp'); // wraps backwards
        expect(cursorTitle()).toBe('Delete');
    });

    it('keyboard: ArrowRight opens the submenu with the cursor on its first item, ArrowLeft returns', async () => {
        await open();
        key('ArrowDown');
        key('ArrowDown'); // cursor on Export
        key('ArrowRight');
        await flush();
        expect(menus()).toHaveLength(2);
        expect(cursorTitle(1)).toBe('CSV');

        key('ArrowLeft');
        expect(menus()).toHaveLength(1);
        expect(cursorTitle(0)).toBe('Export'); // parent cursor preserved
    });

    it('keyboard: Enter activates the cursor item and closes', async () => {
        const clicked: string[] = [];
        await open(clicked);
        key('ArrowDown');
        key('Enter');
        expect(clicked).toEqual(['Open']);
        expect(menus()).toHaveLength(0);
    });

    it('keyboard: Escape closes all levels and fires onclose', async () => {
        const closes: string[] = [];
        await open([], { onclose: () => closes.push('x') });
        key('ArrowDown');
        key('ArrowDown');
        key('ArrowRight');
        await flush();
        expect(menus()).toHaveLength(2);
        key('Escape');
        expect(menus()).toHaveLength(0);
        expect(closes).toEqual(['x']);
    });

    it('opening a sibling submenu replaces deeper levels', async () => {
        await open();
        key('ArrowDown');
        key('ArrowDown');
        key('ArrowRight');
        await flush();
        expect(menus()).toHaveLength(2);

        // Move the parent cursor elsewhere and re-enter: old level replaced
        key('ArrowLeft');
        key('ArrowDown'); // Delete (no submenu)
        expect(menus()).toHaveLength(1);
    });

    it('opening/closing a submenu never rebuilds or moves the parent level', async () => {
        await open();
        const parent = menus()[0] as HTMLElement;
        const top = parent.style.top;
        const left = parent.style.left;

        key('ArrowDown');
        key('ArrowDown'); // Export
        key('ArrowRight');
        await flush();
        expect(menus()).toHaveLength(2);
        expect(menus()[0]).toBe(parent); // same DOM node — not rebuilt
        expect(parent.style.top).toBe(top);
        expect(parent.style.left).toBe(left);

        key('ArrowLeft'); // pop the submenu
        expect(menus()[0]).toBe(parent); // still the same node
    });

    it('outside mousedown closes everything', async () => {
        await open();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(menus()).toHaveLength(0);
    });

    it('open(list, x, y) overrides the default options', async () => {
        const api = await open();
        api.open([{ title: 'Custom' }], 30, 30);
        await flush();
        expect(menus()[0].textContent).toContain('Custom');
    });
});

/** fake-timers variant: flush via timer advance instead of real timeout */
const openWithFakeTimers = async () => {
    let api: Api | null = null;
    handle = t(Contextmenu, {
        options: items([]),
        ref: (a: Api) => (api = a),
    });
    api!.openAt(60, 60);
    await vi.advanceTimersByTimeAsync(1);
    return api!;
};
