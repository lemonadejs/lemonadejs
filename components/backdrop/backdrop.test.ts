/**
 * <Backdrop /> block tests — including the registry gate: verify() must
 * pass. Full-screen dimming overlay: visibility bound
 * two-way (external writes silent), api open/close/toggle, closable
 * click (fires onclose) vs non-closable inert, onclick always fires,
 * opacity/zindex inline overrides, children centered, blur data-attr.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Backdrop from '@lemonadejs/backdrop';

type Api = { open: () => void; close: () => void; toggle: () => void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-backdrop');

describe('components/backdrop', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Backdrop);
        expect(report.pass).toBe(true);
    });

    it('starts hidden by default: nothing in the DOM', () => {
        handle = t(Backdrop);
        expect(root()).toBeNull();
    });

    it('bind is two-way and external writes stay silent', () => {
        const visible = store(false);
        let closed = 0;
        handle = t(Backdrop, { bind: visible, onclose: () => closed++ });
        expect(root()).toBeNull();

        visible.value = true; // external show
        expect(root()).not.toBeNull();

        visible.value = false; // external hide: silent
        expect(root()).toBeNull();
        expect(closed).toBe(0);
    });

    it('exposes open/close/toggle through the api', () => {
        const visible = store(false);
        let api: Api | null = null;
        handle = t(Backdrop, { bind: visible, ref: (a: Api) => (api = a) });

        api!.open();
        expect(root()).not.toBeNull();
        expect(visible.value).toBe(true); // api flows out through bind

        api!.close();
        expect(root()).toBeNull();
        expect(visible.value).toBe(false);

        api!.toggle();
        expect(root()).not.toBeNull();
        api!.toggle();
        expect(root()).toBeNull();
    });

    it('api close fires onclose; open does not', () => {
        let closed = 0;
        let api: Api | null = null;
        handle = t(Backdrop, { onclose: () => closed++, ref: (a: Api) => (api = a) });

        api!.open();
        expect(closed).toBe(0);

        api!.close();
        expect(closed).toBe(1);

        api!.close(); // already hidden: no double fire
        expect(closed).toBe(1);
    });

    it('closable: clicking the backdrop closes it and fires onclose once', () => {
        const visible = store(true);
        let closed = 0;
        handle = t(Backdrop, { bind: visible, closable: true, onclose: () => closed++ });

        (root() as HTMLElement).click();
        expect(root()).toBeNull();
        expect(visible.value).toBe(false); // the click flows out through bind
        expect(closed).toBe(1);
    });

    it('closable: Escape closes it too — dismissal is not pointer-only', () => {
        const visible = store(true);
        let closed = 0;
        handle = t(Backdrop, { bind: visible, closable: true, onclose: () => closed++ });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(root()).toBeNull();
        expect(visible.value).toBe(false);
        expect(closed).toBe(1);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(closed).toBe(1); // already hidden: inert
    });

    it('non-closable: Escape is inert', () => {
        const visible = store(true);
        let closed = 0;
        handle = t(Backdrop, { bind: visible, onclose: () => closed++ });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(root()).not.toBeNull();
        expect(closed).toBe(0);
    });

    it('non-closable: clicks are inert', () => {
        const visible = store(true);
        let closed = 0;
        handle = t(Backdrop, { bind: visible, onclose: () => closed++ });

        (root() as HTMLElement).click();
        expect(root()).not.toBeNull();
        expect(visible.value).toBe(true);
        expect(closed).toBe(0);
    });

    it('onclick always fires, closable or not', () => {
        const visible = store(true);
        let clicks = 0;
        handle = t(Backdrop, { bind: visible, onclick: () => clicks++ });
        (root() as HTMLElement).click();
        expect(clicks).toBe(1);
        handle.unmount();

        const again = store(true);
        handle = t(Backdrop, { bind: again, closable: true, onclick: () => clicks++ });
        (root() as HTMLElement).click();
        expect(clicks).toBe(2); // fired alongside the close
        expect(root()).toBeNull();
    });

    it('opacity 0 keeps the CSS default; 0-100 lands as an inline rgba', () => {
        const visible = store(true);
        handle = t(Backdrop, { bind: visible });
        expect(root()!.getAttribute('style')).toBeNull(); // stylesheet owns the dim
        handle.unmount();

        const again = store(true);
        handle = t(Backdrop, { bind: again, opacity: 80 });
        expect((root() as HTMLElement).style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    });

    it('zindex 0 keeps the CSS default; any other value goes inline', () => {
        const visible = store(true);
        handle = t(Backdrop, { bind: visible, zindex: 2400 });
        expect((root() as HTMLElement).style.zIndex).toBe('2400');
        expect((root() as HTMLElement).style.backgroundColor).toBe(''); // opacity untouched
    });

    it('renders children inside the flex-centered overlay', () => {
        const visible = store(true);
        const App: Component = () =>
            html`<main><${Backdrop} bind="${visible}"><span class="spin">loading</span></${Backdrop}></main>`;
        handle = t(App);

        const overlay = handle.query('.lm-backdrop')!;
        const child = overlay.querySelector('.spin')!;
        expect(child.parentElement).toBe(overlay); // direct child of the centering flex box
        expect(child.textContent).toBe('loading');

        visible.value = false; // children leave with the branch
        expect(handle.query('.spin')).toBeNull();
    });

    it('exposes blur as a data attribute', () => {
        const visible = store(true);
        handle = t(Backdrop, { bind: visible, blur: true });
        expect(root()!.getAttribute('data-blur')).toBe('true');
        handle.unmount();

        const again = store(true);
        handle = t(Backdrop, { bind: again });
        expect(root()!.hasAttribute('data-blur')).toBe(false); // default → no attribute
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const visible = store(true);
        let closed = 0;
        const App: Component = () =>
            html`<main><${Backdrop} bind="${visible}" closable="true" blur="true"
                opacity="40" zindex="9000" onclose="${() => closed++}" /></main>`;
        handle = t(App);

        const overlay = handle.query('.lm-backdrop') as HTMLElement;
        expect(overlay.getAttribute('data-blur')).toBe('true');
        expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
        expect(overlay.style.zIndex).toBe('9000');

        overlay.click();
        expect(handle.query('.lm-backdrop')).toBeNull();
        expect(closed).toBe(1);
    });
});
