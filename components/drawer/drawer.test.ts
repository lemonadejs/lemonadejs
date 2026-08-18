/**
 * <Drawer /> — built on Modal (left/right are full-height side panels,
 * bottom is the sheet mode). Behavior tests: api + the silent two-way
 * bind, anchor → Modal position mapping (live while open), the close
 * origins (backdrop/escape/button/api), the optional title header with
 * Modal's close button, children rendering and the width passthrough.
 *
 * Modal defers per-open setup one microtask — every open awaits flush().
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Drawer from '@lemonadejs/drawer';

type Api = { open(): void; close(): void; toggle(): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** Modal defers per-open setup one microtask */
const flush = () => new Promise((r) => setTimeout(r, 0));

const wrapper = () => handle!.query('.lm-drawer')!;
const modal = () => handle!.query('.lm-modal') as HTMLElement | null;
const modalRoot = () => handle!.query('.lm-modal-root');
const backdrop = () => handle!.query('.lm-modal-backdrop') as HTMLElement | null;
const header = () => handle!.query('.lm-modal-header');
const closeButton = () => handle!.query('.lm-modal-close') as HTMLElement | null;

const openDrawer = async (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Drawer, { ...props, ref: (a: Api) => (api = a) });
    api!.open();
    await flush();
    return api!;
};

const escape = (el: HTMLElement) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

describe('components/drawer — on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Drawer).pass).toBe(true);
    });

    it('starts closed; api open/close/toggle drive the panel with onopen/onclose', async () => {
        const events: string[] = [];
        let api: Api | null = null;
        handle = t(Drawer, {
            onopen: () => events.push('open'),
            onclose: (origin: string) => events.push('close:' + origin),
            ref: (a: Api) => (api = a),
        });
        expect(modal()).toBeNull();

        api!.open();
        await flush();
        expect(modal()).not.toBeNull();
        api!.open(); // already open: no echo
        expect(events).toEqual(['open']);

        api!.close();
        expect(modal()).toBeNull();
        api!.close(); // already closed: no echo
        expect(events).toEqual(['open', 'close:api']);

        api!.toggle();
        await flush();
        expect(modal()).not.toBeNull();
        api!.toggle();
        expect(modal()).toBeNull();
        expect(events).toEqual(['open', 'close:api', 'open', 'close:api']);
    });

    it('bind is two-way and external writes stay SILENT', async () => {
        const visible = store(false);
        const events: string[] = [];
        handle = t(Drawer, {
            bind: visible,
            onopen: () => events.push('open'),
            onclose: (origin: string) => events.push('close:' + origin),
        });
        expect(modal()).toBeNull();

        visible.value = true; // external write opens, silently
        await flush();
        expect(modal()).not.toBeNull();
        expect(events).toEqual([]);

        visible.value = false; // external write closes, silently
        expect(modal()).toBeNull();
        expect(events).toEqual([]);

        visible.value = true;
        await flush();
        backdrop()!.click(); // user interaction writes BACK to the store
        expect(visible.value).toBe(false);
        expect(events).toEqual(['close:backdrop']);
    });

    it('maps anchors onto Modal positions: "" = left, right, bottom', async () => {
        // '' (default) → the left full-height side panel
        await openDrawer();
        expect(wrapper().getAttribute('data-anchor')).toBe('left');
        expect(modalRoot()!.getAttribute('data-position')).toBe('left');
        handle!.unmount();

        // right → the right full-height side panel
        await openDrawer({ anchor: 'right' });
        expect(wrapper().getAttribute('data-anchor')).toBe('right');
        expect(modalRoot()!.getAttribute('data-position')).toBe('right');
        handle!.unmount();

        // bottom → the sheet mode
        await openDrawer({ anchor: 'bottom' });
        expect(wrapper().getAttribute('data-anchor')).toBe('bottom');
        expect(modalRoot()!.getAttribute('data-position')).toBe('bottom');
    });

    it('anchor is LIVE while open (Modal position is reactive)', async () => {
        const anchor = store('');
        await openDrawer({ anchor });
        expect(modalRoot()!.getAttribute('data-position')).toBe('left');

        anchor.value = 'right';
        await flush();
        expect(wrapper().getAttribute('data-anchor')).toBe('right');
        expect(modalRoot()!.getAttribute('data-position')).toBe('right');
    });

    it('backdrop click closes with origin backdrop', async () => {
        const origins: string[] = [];
        await openDrawer({ onclose: (o: string) => origins.push(o) });
        expect(backdrop()).not.toBeNull(); // backdrop defaults on

        backdrop()!.click();
        expect(modal()).toBeNull();
        expect(origins).toEqual(['backdrop']);
    });

    it('Escape closes with origin escape (element-scoped)', async () => {
        const origins: string[] = [];
        await openDrawer({ onclose: (o: string) => origins.push(o) });

        escape(modal()!);
        expect(modal()).toBeNull();
        expect(origins).toEqual(['escape']);
    });

    it('closable=false blocks both backdrop click and Escape', async () => {
        const origins: string[] = [];
        await openDrawer({ closable: false, onclose: (o: string) => origins.push(o) });

        backdrop()!.click();
        expect(modal()).not.toBeNull();
        escape(modal()!);
        expect(modal()).not.toBeNull();
        expect(origins).toEqual([]);
    });

    it('backdrop=false renders no overlay', async () => {
        await openDrawer({ backdrop: false });
        expect(modal()).not.toBeNull();
        expect(backdrop()).toBeNull();
    });

    it("title renders MODAL's header (one chrome for the catalog); its x closes with origin button", async () => {
        const origins: string[] = [];
        await openDrawer({ title: 'Navigation', onclose: (o: string) => origins.push(o) });
        expect(header()).not.toBeNull(); // Modal's own header, not drawer chrome
        expect(handle!.query('.lm-drawer-header')).toBeNull(); // no drawer-owned duplicate
        expect(handle!.query('.lm-modal-title')!.textContent).toBe('Navigation');

        closeButton()!.click();
        expect(modal()).toBeNull();
        expect(origins).toEqual(['button']);
    });

    it('renders no header without a title', async () => {
        await openDrawer();
        expect(header()).toBeNull();
        expect(closeButton()).toBeNull();
    });

    it('renders children inside the drawer body', async () => {
        const visible = store(true);
        const App: Component = () =>
            html`<main><${Drawer} bind="${visible}">
                <ul class="menu"><li>Inbox</li><li>Sent</li></ul>
            </${Drawer}></main>`;
        handle = t(App);
        await flush();

        const body = handle.query('.lm-drawer-body')!;
        expect(body.querySelector('.menu')).not.toBeNull();
        expect(body.textContent).toContain('Inbox');
        expect(body.textContent).toContain('Sent');
    });

    it('the dialog is always named: title when visible, the label fallback otherwise', async () => {
        await openDrawer(); // no title: the header is hidden but the panel keeps a name
        expect(modal()!.getAttribute('aria-label')).toBe('Drawer');
        handle!.unmount();

        await openDrawer({ label: 'Filters' });
        expect(modal()!.getAttribute('aria-label')).toBe('Filters');
        handle!.unmount();

        await openDrawer({ title: 'Navigation' }); // the visible title wins
        expect(modal()!.getAttribute('aria-label')).toBe('Navigation');
    });

    it('width passes through to the panel (left/right)', async () => {
        await openDrawer({ width: 320 });
        expect(modal()!.style.width).toBe('320px');
        handle!.unmount();

        await openDrawer(); // default
        expect(modal()!.style.width).toBe('280px');
    });
});
