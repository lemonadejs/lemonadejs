/**
 * <Tooltip /> block tests — including the registry gate: verify() must
 * pass. Hover/focus showing with a delay (fake timers), Escape, fixed
 * positioning from a stubbed wrapper rect, viewport flipping, disabled,
 * onopen/onclose, and destroy-clean timers.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Tooltip from '@lemonadejs/tooltip';

let handle: ReturnType<typeof t> | null = null;

beforeEach(() => {
    // Only the timer functions: queueMicrotask (placement) stays real
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
});

const wrapper = () => handle!.query('.lm-tooltip') as HTMLElement;
const popper = () => handle!.query('.lm-tooltip-popper');

/** jsdom rects are zero — stub the wrapper's rect like the modal tests */
const setRect = (el: HTMLElement, r: { top: number; left: number; width: number; height: number }) => {
    el.getBoundingClientRect = () =>
        ({ ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => '' }) as DOMRect;
};

const mountTip = (props: Record<string, unknown> = {}, rect = { top: 100, left: 100, width: 80, height: 30 }) => {
    handle = t(Tooltip, { title: 'Tip', ...props });
    const el = wrapper();
    setRect(el, rect);
    return el;
};

const enter = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseenter'));
const leave = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseleave'));
/** Hover and run out the delay (placement flushes with the microtasks) */
const show = async (el: HTMLElement, ms = 100) => {
    enter(el);
    await vi.advanceTimersByTimeAsync(ms);
};

describe('components/tooltip', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Tooltip).pass).toBe(true);
    });

    it('renders its children inside the wrapper, popper hidden until hover', () => {
        const App: Component = () =>
            html`<main><${Tooltip} title="Save your work"><button>Save</button></${Tooltip}></main>`;
        handle = t(App);
        expect(handle.query('.lm-tooltip button')!.textContent).toBe('Save');
        expect(popper()).toBeNull();
    });

    it('shows on mouseenter only after the delay (default 100ms)', async () => {
        const el = mountTip();
        enter(el);
        expect(popper()).toBeNull(); // not yet — delay pending

        await vi.advanceTimersByTimeAsync(99);
        expect(popper()).toBeNull();

        await vi.advanceTimersByTimeAsync(1);
        expect(popper()).not.toBeNull();
        expect(popper()!.textContent).toBe('Tip');
        expect(popper()!.getAttribute('role')).toBe('tooltip');
    });

    it('honors a custom delay', async () => {
        const el = mountTip({ delay: 400 });
        enter(el);
        await vi.advanceTimersByTimeAsync(399);
        expect(popper()).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(popper()).not.toBeNull();
    });

    it('mouseleave mid-delay clears the pending timer — never shows', async () => {
        const el = mountTip();
        enter(el);
        await vi.advanceTimersByTimeAsync(50);
        leave(el);
        expect(vi.getTimerCount()).toBe(0); // cleared, not just orphaned

        await vi.advanceTimersByTimeAsync(1000);
        expect(popper()).toBeNull();
    });

    it('mouseleave hides a visible tooltip after the hover grace window', async () => {
        const el = mountTip();
        await show(el);
        expect(popper()).not.toBeNull();

        leave(el);
        expect(popper()).not.toBeNull(); // grace: the pointer may be crossing to the popper
        await vi.advanceTimersByTimeAsync(150);
        expect(popper()).toBeNull();
    });

    it('is HOVERABLE: re-entering during the grace window keeps it open', async () => {
        const events: string[] = [];
        const el = mountTip({ onclose: () => events.push('close') });
        await show(el);

        leave(el); // pointer crosses the gap toward the popper
        await vi.advanceTimersByTimeAsync(50);
        enter(el); // the popper is a wrapper child: reaching it re-enters the subtree
        await vi.advanceTimersByTimeAsync(5000);
        expect(popper()).not.toBeNull();
        expect(events).toEqual([]);
    });

    it('shows on focus and hides on blur', async () => {
        const el = mountTip();
        el.dispatchEvent(new FocusEvent('focusin'));
        await vi.advanceTimersByTimeAsync(100);
        expect(popper()).not.toBeNull();

        el.dispatchEvent(new FocusEvent('focusout'));
        expect(popper()).toBeNull();
    });

    it('Escape hides the tooltip', async () => {
        const el = mountTip();
        await show(el);
        expect(popper()).not.toBeNull();

        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(popper()).toBeNull();
    });

    it('Escape that dismissed a visible tooltip does not propagate further', async () => {
        const el = mountTip();
        const seen: boolean[] = [];
        const listener = () => seen.push(true);
        document.addEventListener('keydown', listener);

        await show(el);
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(popper()).toBeNull();
        expect(seen).toEqual([]); // consumed by the dismissal

        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(seen).toEqual([true]); // nothing to dismiss: passes through
        document.removeEventListener('keydown', listener);
    });

    it('wires the trigger to the popper via aria-describedby while visible', async () => {
        const App: Component = () =>
            html`<main><${Tooltip} title="Save your work"><button>Save</button></${Tooltip}></main>`;
        handle = t(App);
        const el = wrapper();
        setRect(el, { top: 100, left: 100, width: 80, height: 30 });
        const button = handle.query('.lm-tooltip button')!;
        expect(button.hasAttribute('aria-describedby')).toBe(false);

        await show(el);
        const ref = button.getAttribute('aria-describedby')!;
        expect(ref).toBeTruthy();
        expect(popper()!.getAttribute('id')).toBe(ref);

        leave(el);
        await vi.advanceTimersByTimeAsync(150); // grace runs out, wiring is removed
        expect(button.hasAttribute('aria-describedby')).toBe(false);
    });

    it('positions with fixed coordinates from the wrapper rect (default top)', async () => {
        const el = mountTip(); // rect: top 100, left 100, 80x30; popper 0x0 in jsdom
        await show(el);
        const p = popper()!;
        expect(p.getAttribute('data-position')).toBe('top');
        expect(p.style.position).toBe('fixed');
        expect(p.style.top).toBe('92px'); // 100 - 8 gap
        expect(p.style.left).toBe('140px'); // 100 + 80/2
    });

    it('supports the four sides', async () => {
        const cases: [string, string, string][] = [
            ['bottom', '138px', '140px'], // 100+30+8, centered
            ['left', '115px', '92px'], // centered, 100-8
            ['right', '115px', '188px'], // centered, 100+80+8
        ];
        for (const [position, top, left] of cases) {
            const el = mountTip({ position });
            await show(el);
            const p = popper()!;
            expect(p.getAttribute('data-position')).toBe(position);
            expect(p.style.top).toBe(top);
            expect(p.style.left).toBe(left);
            handle!.unmount();
            handle = null;
        }
    });

    it('FLIPS to the opposite side at the viewport edge', async () => {
        // top requested, but the wrapper sits at the very top of the screen
        let el = mountTip({}, { top: 4, left: 100, width: 80, height: 30 });
        await show(el);
        expect(popper()!.getAttribute('data-position')).toBe('bottom');
        expect(popper()!.style.top).toBe('42px'); // 4 + 30 + 8
        handle!.unmount();
        handle = null;

        // right requested, but the wrapper hugs the right edge (jsdom: 1024)
        el = mountTip({ position: 'right' }, { top: 100, left: 1000, width: 80, height: 30 });
        await show(el);
        expect(popper()!.getAttribute('data-position')).toBe('left');
        expect(popper()!.style.left).toBe('992px'); // 1000 - 8
    });

    it('disabled never shows — and never even starts a timer', async () => {
        const el = mountTip({ disabled: true });
        enter(el);
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(1000);
        expect(popper()).toBeNull();
    });

    it('fires onopen when shown and onclose when hidden', async () => {
        const events: string[] = [];
        const el = mountTip({ onopen: () => events.push('open'), onclose: () => events.push('close') });

        await show(el);
        expect(events).toEqual(['open']);

        leave(el);
        await vi.advanceTimersByTimeAsync(150); // the grace window runs out
        expect(events).toEqual(['open', 'close']);

        // a cancelled pending show fires NEITHER
        enter(el);
        leave(el);
        await vi.advanceTimersByTimeAsync(1000);
        expect(events).toEqual(['open', 'close']);
    });

    it('arrow renders by default and can be turned off', async () => {
        let el = mountTip();
        await show(el);
        expect(popper()!.className).toContain('lm-tooltip-arrow');
        handle!.unmount();
        handle = null;

        el = mountTip({ arrow: false });
        await show(el);
        expect(popper()!.className).not.toContain('lm-tooltip-arrow');
    });

    it('title is live while open', async () => {
        const title = store('First');
        const el = mountTip({ title });
        await show(el);
        expect(popper()!.textContent).toBe('First');

        title.value = 'Second';
        expect(popper()!.textContent).toBe('Second');
    });

    it('unmount mid-delay leaves no timer behind (destroy-clean)', () => {
        const el = mountTip();
        enter(el);
        expect(vi.getTimerCount()).toBe(1);

        handle!.unmount();
        handle = null;
        expect(vi.getTimerCount()).toBe(0); // cleared on unmount

        vi.runAllTimers(); // nothing pending — no stray errors
        expect(document.querySelector('.lm-tooltip-popper')).toBeNull();
    });
});
