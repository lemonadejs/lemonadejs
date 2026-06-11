/**
 * <Toast /> block tests — including the registry gate: verify() must pass.
 * Host stack + queue: auto-dismiss with the 200ms leave animation (fake
 * timers), per-toast duration override, sticky duration 0, max overflow
 * queueing with promotion, action button, severity helpers, clear(),
 * destroy-clean timers.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render as t, verify } from 'lemonadejs/test';
import Toast, { type ToastApi } from '@lemonadejs/toast';

let handle: ReturnType<typeof t> | null = null;
let api!: ToastApi;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
});

const mountToast = (props: Record<string, unknown> = {}) => {
    handle = t(Toast, { ref: (a: ToastApi) => (api = a), ...props });
};

const toasts = () => handle!.queryAll('.lm-toast-item');
const leaving = () => handle!.queryAll('.lm-toast-item[data-leaving]');
const closeOf = (el: HTMLElement) => el.querySelector('.lm-toast-close') as HTMLElement;

describe('components/toast', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Toast);
        expect(report.pass).toBe(true);
    });

    it('renders an empty fixed stack; position becomes data-position', () => {
        mountToast();
        const host = handle!.query('.lm-toast')!;
        expect(toasts()).toHaveLength(0);
        expect(host.hasAttribute('data-position')).toBe(false); // '' = bottom-left default
        handle!.unmount();

        mountToast({ position: 'top-right' });
        expect(handle!.query('.lm-toast')!.getAttribute('data-position')).toBe('top-right');
    });

    it('show() renders the message, auto-dismisses after the default 4000ms + 200ms leave', () => {
        const closed: string[] = [];
        mountToast({ onclose: (m: string) => closed.push(m) });
        api.show('Saved');
        expect(toasts()).toHaveLength(1);
        expect(toasts()[0].textContent).toContain('Saved');

        vi.advanceTimersByTime(3999);
        expect(leaving()).toHaveLength(0); // still fully visible

        vi.advanceTimersByTime(1); // 4000: the leave animation starts
        expect(toasts()).toHaveLength(1);
        expect(leaving()).toHaveLength(1);
        expect(closed).toEqual([]); // not dismissed until the animation ends

        vi.advanceTimersByTime(200); // leave done: removed + reported
        expect(toasts()).toHaveLength(0);
        expect(closed).toEqual(['Saved']);
    });

    it('honors a per-toast duration override', () => {
        mountToast();
        api.show('Quick', { duration: 1000 });
        api.show('Slow'); // host default 4000

        vi.advanceTimersByTime(1000 + 200);
        expect(toasts()).toHaveLength(1);
        expect(toasts()[0].textContent).toContain('Slow');

        vi.advanceTimersByTime(4000 + 200); // Slow's clock started at its own show()
        expect(toasts()).toHaveLength(0);
    });

    it('duration 0 is sticky: no timer, stays until closed', () => {
        mountToast();
        api.show('Sticky', { duration: 0 });
        expect(vi.getTimerCount()).toBe(0); // nothing armed at all

        vi.advanceTimersByTime(60000);
        expect(toasts()).toHaveLength(1);

        closeOf(toasts()[0]).click();
        vi.advanceTimersByTime(200);
        expect(toasts()).toHaveLength(0);
    });

    it('manual close clears the auto-dismiss timer and fires onclose once', () => {
        const closed: string[] = [];
        mountToast({ onclose: (m: string) => closed.push(m) });
        api.show('Bye');
        expect(vi.getTimerCount()).toBe(1); // the auto-dismiss

        closeOf(toasts()[0]).click();
        expect(leaving()).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(1); // auto cleared, only the leave timer remains

        vi.advanceTimersByTime(200);
        expect(toasts()).toHaveLength(0);
        expect(closed).toEqual(['Bye']);

        vi.advanceTimersByTime(10000); // the cleared auto timer never resurfaces
        expect(vi.getTimerCount()).toBe(0);
        expect(closed).toEqual(['Bye']);
    });

    it('closable=false renders no × button', () => {
        mountToast({ closable: false });
        api.show('No close', { duration: 0 });
        expect(toasts()).toHaveLength(1);
        expect(closeOf(toasts()[0])).toBeNull();
    });

    it('queues overflow: the 6th toast waits until one leaves, its clock starting then', () => {
        mountToast({ duration: 0 }); // sticky host: only the queue moves things
        for (let i = 1; i <= 5; i++) {
            api.show('m' + i);
        }
        api.show('m6', { duration: 1000 });
        expect(toasts()).toHaveLength(5);
        expect(handle!.text()).not.toContain('m6'); // queued, not rendered

        closeOf(toasts()[0]).click(); // m1 starts leaving — still on screen
        expect(toasts()).toHaveLength(5);
        expect(handle!.text()).not.toContain('m6'); // the slot is not free yet

        vi.advanceTimersByTime(200); // m1 gone: m6 promoted
        expect(toasts()).toHaveLength(5);
        expect(handle!.text()).not.toContain('m1');
        expect(toasts()[4].textContent).toContain('m6'); // FIFO, appended last

        vi.advanceTimersByTime(1000 + 200); // m6's duration ran from promotion, not show()
        expect(toasts()).toHaveLength(4);
        expect(handle!.text()).not.toContain('m6');
    });

    it('respects a custom max', () => {
        mountToast({ max: 2, duration: 0 });
        api.show('a');
        api.show('b');
        api.show('c');
        expect(toasts()).toHaveLength(2);
        expect(handle!.text()).not.toContain('c');
    });

    it('severity helpers preset data-severity; plain show() stays neutral', () => {
        mountToast({ duration: 0 });
        api.show('plain');
        api.success('ok');
        api.error('bad');
        api.warning('careful');
        api.info('fyi');

        const severities = toasts().map((el) => el.getAttribute('data-severity'));
        expect(severities).toEqual([null, 'success', 'error', 'warning', 'info']);

        api.clear();
        api.show('explicit', { severity: 'warning' }); // options work on show() too
        expect(toasts()[0].getAttribute('data-severity')).toBe('warning');
    });

    it('the action button fires its handler and dismisses the toast', () => {
        let undone = 0;
        mountToast();
        api.show('Deleted', { action: { label: 'Undo', onclick: () => undone++ } });

        const button = toasts()[0].querySelector('.lm-toast-action') as HTMLElement;
        expect(button.textContent).toBe('Undo');

        button.click();
        expect(undone).toBe(1);
        expect(leaving()).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(1); // auto timer cleared; only the leave remains

        vi.advanceTimersByTime(200);
        expect(toasts()).toHaveLength(0);
    });

    it('clear() empties visible toasts AND the waiting queue, silently', () => {
        const closed: string[] = [];
        mountToast({ onclose: (m: string) => closed.push(m) });
        for (let i = 1; i <= 7; i++) {
            api.show('m' + i); // 5 visible + 2 queued
        }
        expect(toasts()).toHaveLength(5);

        api.clear();
        expect(toasts()).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);

        vi.advanceTimersByTime(60000); // nothing queued ever surfaces
        expect(toasts()).toHaveLength(0);
        expect(closed).toEqual([]); // bulk reset: no onclose storm
    });

    it('unmount clears every pending timer — destroy-clean', () => {
        mountToast();
        api.show('a');
        api.show('b', { duration: 1000 });
        closeOf(toasts()[0]).click(); // one toast mid-leave
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        handle!.unmount();
        handle = null;
        expect(vi.getTimerCount()).toBe(0);
    });
});
