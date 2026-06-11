/**
 * <Speeddial /> block tests — including the registry gate: verify() must
 * pass. FAB toggle, api open/close/toggle, bind two-way (silent on
 * external writes), hover open + 150ms grace-timer close (fake timers,
 * cancelled on re-enter), Escape, action picks (onaction + item onclick +
 * auto-close), directions, stagger delays, disabled and destroy-clean
 * timers.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Speeddial, { type SpeeddialAction } from '@lemonadejs/speeddial';

let handle: ReturnType<typeof t> | null = null;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
});

const root = () => handle!.query('.lm-speeddial') as HTMLElement;
const fab = () => handle!.query('.lm-speeddial-fab') as HTMLButtonElement;
const actions = () => handle!.queryAll('.lm-speeddial-action') as HTMLButtonElement[];
const isOpen = () => root().className.indexOf('lm-speeddial-open') >= 0;

const enter = () => root().dispatchEvent(new MouseEvent('mouseenter'));
const leave = () => root().dispatchEvent(new MouseEvent('mouseleave'));

const THREE: SpeeddialAction[] = [
    { name: 'Copy', icon: 'content_copy' },
    { name: 'Save', icon: 'save' },
    { name: 'Print', icon: 'print' },
];

type Api = { open(): void; close(): void; toggle(): void };

describe('components/speeddial', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Speeddial as never).pass).toBe(true);
    });

    it('renders closed: FAB with the default + glyph, collapsed fan', () => {
        handle = t(Speeddial, { options: THREE });
        expect(isOpen()).toBe(false);
        expect(fab().querySelector('.lm-speeddial-icon')!.textContent).toBe('+');
        expect(fab().getAttribute('aria-expanded')).toBe('false');
        expect(handle.query('.lm-speeddial-actions')!.getAttribute('aria-hidden')).toBe('true');
        expect(actions().length).toBe(3);
    });

    it('FAB click toggles the fan open and closed', () => {
        handle = t(Speeddial, { options: THREE });
        fab().click();
        expect(isOpen()).toBe(true);
        expect(fab().getAttribute('aria-expanded')).toBe('true');
        expect(handle.query('.lm-speeddial-actions')!.getAttribute('aria-hidden')).toBe('false');

        fab().click();
        expect(isOpen()).toBe(false);
    });

    it('fires onopen/onclose on user toggles', () => {
        const events: string[] = [];
        handle = t(Speeddial, {
            options: THREE,
            onopen: () => events.push('open'),
            onclose: () => events.push('close'),
        });
        fab().click();
        fab().click();
        expect(events).toEqual(['open', 'close']);
    });

    it('exposes open/close/toggle through the api', () => {
        let api: Api | null = null;
        handle = t(Speeddial, { options: THREE, ref: (a: Api) => (api = a) });

        api!.open();
        expect(isOpen()).toBe(true);
        api!.open(); // idempotent
        expect(isOpen()).toBe(true);

        api!.close();
        expect(isOpen()).toBe(false);

        api!.toggle();
        expect(isOpen()).toBe(true);
        api!.toggle();
        expect(isOpen()).toBe(false);
    });

    it('bind is two-way — and external writes are SILENT', () => {
        const fanned = store(false);
        const events: string[] = [];
        handle = t(Speeddial, {
            options: THREE,
            bind: fanned,
            onopen: () => events.push('open'),
            onclose: () => events.push('close'),
        });

        fab().click(); // user open flows out + fires onopen
        expect(fanned.value).toBe(true);
        expect(events).toEqual(['open']);

        fanned.value = false; // external write flows in, silently
        expect(isOpen()).toBe(false);
        expect(events).toEqual(['open']);

        fanned.value = true; // silent again
        expect(isOpen()).toBe(true);
        expect(events).toEqual(['open']);
    });

    it('hover opens immediately and mouseleave closes after the 150ms grace', async () => {
        const events: string[] = [];
        handle = t(Speeddial, { options: THREE, onclose: () => events.push('close') });

        enter();
        expect(isOpen()).toBe(true);

        leave();
        expect(isOpen()).toBe(true); // grace window still running
        await vi.advanceTimersByTimeAsync(149);
        expect(isOpen()).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(isOpen()).toBe(false);
        expect(events).toEqual(['close']);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('re-entering during the grace window cancels the close', async () => {
        handle = t(Speeddial, { options: THREE });
        enter();
        leave();
        await vi.advanceTimersByTimeAsync(100);

        enter(); // cancels the pending close
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(1000);
        expect(isOpen()).toBe(true);
    });

    it('mouseleave while closed starts no timer', () => {
        handle = t(Speeddial, { options: THREE });
        leave();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('Escape closes the fan', () => {
        handle = t(Speeddial, { options: THREE });
        fab().click();
        expect(isOpen()).toBe(true);

        root().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(isOpen()).toBe(false);
    });

    it('clicking an action fires its onclick AND onaction(name, event), then closes', () => {
        const log: string[] = [];
        const options: SpeeddialAction[] = [
            { name: 'Copy', icon: 'content_copy', onclick: () => log.push('onclick:Copy') },
            { name: 'Save', icon: 'save' },
        ];
        handle = t(Speeddial, {
            options,
            onaction: (name: string, e: Event) => log.push('onaction:' + name + ':' + e.type),
        });
        fab().click();
        expect(isOpen()).toBe(true);

        actions()[0].click();
        expect(log).toEqual(['onclick:Copy', 'onaction:Copy:click']);
        expect(isOpen()).toBe(false);

        // an action without its own onclick still reports through onaction
        fab().click();
        actions()[1].click();
        expect(log).toEqual(['onclick:Copy', 'onaction:Copy:click', 'onaction:Save:click']);
    });

    it('renders each action with its icon and its name as the side label', () => {
        handle = t(Speeddial, { options: THREE });
        const items = actions();
        expect(items[0].querySelector('.lm-speeddial-action-icon')!.textContent).toBe('content_copy');
        expect(items[0].querySelector('.lm-speeddial-action-label')!.textContent).toBe('Copy');
        expect(items[2].querySelector('.lm-speeddial-action-label')!.textContent).toBe('Print');
    });

    it('exposes direction as a data attribute — empty means up (no attribute)', () => {
        handle = t(Speeddial, { options: THREE });
        expect(root().hasAttribute('data-direction')).toBe(false);
        handle.unmount();

        for (const direction of ['down', 'left', 'right']) {
            handle = t(Speeddial, { options: THREE, direction });
            expect(root().getAttribute('data-direction')).toBe(direction);
            handle.unmount();
        }
        handle = null;
    });

    it('staggers the fan with per-item transition delays (index * 30ms)', () => {
        handle = t(Speeddial, { options: THREE });
        const delays = actions().map((el) => el.getAttribute('style'));
        expect(delays[0]).toContain('transition-delay: 0ms');
        expect(delays[1]).toContain('transition-delay: 30ms');
        expect(delays[2]).toContain('transition-delay: 60ms');
    });

    it('position="fixed" pins via the CSS class; default stays in flow', () => {
        handle = t(Speeddial, { options: THREE, position: 'fixed' });
        expect(root().className).toContain('lm-speeddial-fixed');
        handle.unmount();

        handle = t(Speeddial, { options: THREE });
        expect(root().className).not.toContain('lm-speeddial-fixed');
    });

    it('custom icon and aria-label reach the FAB', () => {
        handle = t(Speeddial, { options: THREE, icon: 'edit', label: 'Quick actions' });
        expect(fab().querySelector('.lm-speeddial-icon')!.textContent).toBe('edit');
        expect(fab().getAttribute('aria-label')).toBe('Quick actions');
    });

    it('disabled blocks the FAB, hover and api.open — close still works', () => {
        let api: Api | null = null;
        handle = t(Speeddial, { options: THREE, disabled: true, ref: (a: Api) => (api = a) });
        expect(root().className).toContain('lm-speeddial-disabled');
        expect(fab().disabled).toBe(true);

        fab().click();
        expect(isOpen()).toBe(false);
        enter();
        expect(isOpen()).toBe(false);
        api!.open();
        expect(isOpen()).toBe(false);
    });

    it('unmount mid-grace leaves no timer behind (destroy-clean)', () => {
        handle = t(Speeddial, { options: THREE });
        enter();
        leave();
        expect(vi.getTimerCount()).toBe(1);

        handle.unmount();
        handle = null;
        expect(vi.getTimerCount()).toBe(0); // cleared on unmount

        vi.runAllTimers(); // nothing pending — no stray errors
    });

    it('options are live — swapping the array re-renders the fan', () => {
        const options = store<SpeeddialAction[]>([{ name: 'One' }]);
        handle = t(Speeddial, { options });
        expect(actions().length).toBe(1);

        options.value = [{ name: 'One' }, { name: 'Two' }];
        expect(actions().length).toBe(2);
        expect(actions()[1].querySelector('.lm-speeddial-action-label')!.textContent).toBe('Two');
    });
});
