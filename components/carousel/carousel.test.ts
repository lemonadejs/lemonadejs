/**
 * <Carousel /> block tests — including the registry gate (verify) and the
 * SINGLE-FILE STYLE PROBE: this block ships its CSS inside the template
 * (<style> hoisting), so the suite asserts the engine injects exactly ONE
 * style tag into document.head across multiple instances and that no
 * <style> element ever lands inside the component DOM.
 *
 * Geometry: the strip position is `translateX(-index·100% + dragPx)` —
 * deterministic without layout. The only layout-dependent value is the
 * viewport width at gesture start (the 25% commit threshold), stubbed
 * with setRect from lemonadejs/test.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify, setRect } from 'lemonadejs/test';
import Carousel, { type CarouselSlide } from '@lemonadejs/carousel';

type Api = { next(): void; prev(): void; goto(i: number): void };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const SLIDES: CarouselSlide[] = [
    { image: 'a.jpg', title: 'Alpha', description: 'First slide', link: 'https://example.com/a' },
    { image: 'b.jpg', title: 'Beta' },
    { title: 'Gamma', description: 'Text-only slide' },
];

const root = () => handle!.query('.lm-carousel')!;
const viewport = () => handle!.query('.lm-carousel-viewport')!;
const track = () => handle!.query('.lm-carousel-track')!;
const slideEls = () => handle!.queryAll('.lm-carousel-slide');
const dots = () => handle!.queryAll('.lm-carousel-dot');
const arrowPrev = () => handle!.query('.lm-carousel-prev') as HTMLButtonElement | null;
const arrowNext = () => handle!.query('.lm-carousel-next') as HTMLButtonElement | null;
const transform = () => track().style.transform;

/** -index·100% with no drag offset */
const at = (i: number) => 'translateX(calc(' + i * -100 + '% + 0px))';

const mouse = (type: string, x: number) =>
    new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x });

const key = (k: string, target: EventTarget = root()) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

/** Mount with a 400px-wide viewport: the 25% commit threshold is 100px */
const mount = (props: Record<string, unknown> = {}) => {
    handle = t(Carousel, { data: SLIDES, ...props });
    setRect(viewport() as HTMLElement, { left: 0, width: 400, height: 200 });
};

describe('components/carousel', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Carousel).pass).toBe(true);
    });

    it('renders the provided slide fields and omits the missing ones', () => {
        mount();
        const [a, b, c] = slideEls();
        expect(a.querySelector('img')!.getAttribute('src')).toBe('a.jpg');
        expect(a.querySelector('.lm-carousel-title')!.textContent).toBe('Alpha');
        expect(a.querySelector('.lm-carousel-description')!.textContent).toBe('First slide');
        expect(a.querySelector('.lm-carousel-link')!.getAttribute('href')).toBe('https://example.com/a');

        expect(b.querySelector('img')!.getAttribute('src')).toBe('b.jpg');
        expect(b.querySelector('.lm-carousel-description')).toBeNull();
        expect(b.querySelector('.lm-carousel-link')).toBeNull();

        expect(c.querySelector('img')).toBeNull(); // text-only slide
        expect(c.querySelector('.lm-carousel-title')!.textContent).toBe('Gamma');
        expect(c.querySelector('.lm-carousel-caption')!.className).not.toContain('lm-carousel-overlay');
    });

    it('exposes the carousel ARIA contract and hides off-screen slides', () => {
        mount({ bind: store(1) });
        expect(root().getAttribute('aria-roledescription')).toBe('carousel');
        expect(root().getAttribute('role')).toBe('region');
        expect(root().getAttribute('tabindex')).toBe('0');
        expect(slideEls().map((s) => s.getAttribute('aria-roledescription'))).toEqual(['slide', 'slide', 'slide']);
        // position + title (when available) so slide changes are meaningful
        expect(slideEls().map((s) => s.getAttribute('aria-label'))).toEqual(['1 of 3: Alpha', '2 of 3: Beta', '3 of 3: Gamma']);
        expect(slideEls().map((s) => s.getAttribute('aria-hidden'))).toEqual(['true', 'false', 'true']);
        // hidden slides are inert too — their links leave the tab order (2.4.3)
        expect(slideEls().map((s) => s.hasAttribute('inert'))).toEqual([true, false, true]);
        // no autoplay → the track announces slide changes politely
        expect(track().getAttribute('aria-live')).toBe('polite');
    });

    it('api next/prev/goto move the strip; loop=false clamps silently at the edges', () => {
        const changes: number[] = [];
        let api: Api | null = null;
        mount({ ref: (a: Api) => (api = a), onchange: (i: number) => changes.push(i) });

        expect(transform()).toBe(at(0));
        api!.next();
        expect(transform()).toBe(at(1));
        api!.goto(2);
        expect(transform()).toBe(at(2));
        api!.next(); // clamped: no move, NO onchange
        expect(transform()).toBe(at(2));
        api!.goto(99); // clamps to the last slide (already there)
        expect(transform()).toBe(at(2));
        api!.prev();
        api!.prev();
        api!.prev(); // clamped at 0
        expect(transform()).toBe(at(0));
        expect(changes).toEqual([1, 2, 1, 0]);
    });

    it('loop=true wraps next/prev/goto around both edges', () => {
        const value = store(0);
        let api: Api | null = null;
        mount({ bind: value, loop: true, ref: (a: Api) => (api = a) });

        api!.prev(); // 0 → last
        expect(value.value).toBe(2);
        api!.next(); // last → 0
        expect(value.value).toBe(0);
        api!.goto(-1); // negative wraps
        expect(value.value).toBe(2);
        api!.goto(4); // past the end wraps: 4 % 3
        expect(value.value).toBe(1);
    });

    it('bind is two-way: external writes drive the strip silently, user actions write back + onchange', () => {
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, onchange: (i: number) => changes.push(i) });

        value.value = 2; // external store drives the index
        expect(transform()).toBe(at(2));
        expect(slideEls().map((s) => s.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'false']);
        expect(changes).toEqual([]); // silent

        arrowPrev()!.click(); // user action writes back through the bind
        expect(value.value).toBe(1);
        expect(transform()).toBe(at(1));
        expect(changes).toEqual([1]);
    });

    it('arrows navigate, disable at the edges when loop=false, and disappear with arrows=false', () => {
        mount();
        expect(arrowPrev()!.disabled).toBe(true); // at 0
        expect(arrowNext()!.disabled).toBe(false);
        arrowNext()!.click();
        arrowNext()!.click();
        expect(transform()).toBe(at(2));
        expect(arrowNext()!.disabled).toBe(true); // at the end
        expect(arrowPrev()!.disabled).toBe(false);
        handle!.unmount();

        mount({ loop: true }); // looping edges are never disabled
        expect(arrowPrev()!.disabled).toBe(false);
        expect(arrowNext()!.disabled).toBe(false);
        handle!.unmount();

        mount({ arrows: false });
        expect(arrowPrev()).toBeNull();
        expect(arrowNext()).toBeNull();
    });

    it('dots: one per slide, the active one marked, clicking goes to the slide; dots=false renders none', () => {
        const value = store(0);
        mount({ bind: value });
        expect(dots().length).toBe(3);
        expect(dots().map((d) => d.getAttribute('data-active'))).toEqual(['true', null, null]);

        dots()[2].click();
        expect(value.value).toBe(2);
        expect(dots().map((d) => d.getAttribute('data-active'))).toEqual([null, null, 'true']);
        handle!.unmount();

        mount({ dots: false });
        expect(dots().length).toBe(0);
    });

    it('keyboard: ArrowRight/ArrowLeft step the focused carousel', () => {
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, onchange: (i: number) => changes.push(i) });

        key('ArrowRight');
        key('ArrowRight');
        expect(value.value).toBe(2);
        key('ArrowRight'); // clamped (loop=false)
        expect(value.value).toBe(2);
        key('ArrowLeft');
        expect(value.value).toBe(1);
        expect(changes).toEqual([1, 2, 1]);
    });

    it('autoplay advances on the interval, wraps past the end, and fires onchange', () => {
        vi.useFakeTimers();
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, autoplay: 1000, onchange: (i: number) => changes.push(i) });

        vi.advanceTimersByTime(999);
        expect(value.value).toBe(0); // not yet
        vi.advanceTimersByTime(1);
        expect(value.value).toBe(1);
        vi.advanceTimersByTime(2000);
        expect(value.value).toBe(0); // 1 → 2 → wraps to 0
        expect(changes).toEqual([1, 2, 0]);
        expect(transform()).toBe(at(0));
    });

    it('autoplay=0 never arms, and unmount clears a running interval', () => {
        vi.useFakeTimers();
        const value = store(0);
        mount({ bind: value });
        vi.advanceTimersByTime(60000);
        expect(value.value).toBe(0); // off by default
        handle!.unmount();

        mount({ bind: value, autoplay: 500 });
        vi.advanceTimersByTime(500);
        expect(value.value).toBe(1);
        handle!.unmount();
        handle = null;
        vi.advanceTimersByTime(5000); // a leaked interval would keep advancing
        expect(value.value).toBe(1);
    });

    it('autoplay pauses while hovering and resumes on leave', () => {
        vi.useFakeTimers();
        const value = store(0);
        mount({ bind: value, autoplay: 1000 });

        root().dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(5000);
        expect(value.value).toBe(0); // paused

        root().dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(1000);
        expect(value.value).toBe(1); // resumed (fresh interval)
    });

    it('autoplay pauses while focus is inside the carousel and resumes on focusout', () => {
        vi.useFakeTimers();
        const value = store(0);
        mount({ bind: value, autoplay: 1000 });

        root().dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        vi.advanceTimersByTime(5000);
        expect(value.value).toBe(0); // paused for keyboard users too

        root().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        vi.advanceTimersByTime(1000);
        expect(value.value).toBe(1); // resumed (fresh interval)
    });

    it('autoplay renders a pause/play toggle BEFORE the slides; clicking stops and restarts rotation', () => {
        vi.useFakeTimers();
        const value = store(0);
        mount({ bind: value, autoplay: 1000 });

        const toggle = handle!.query('.lm-carousel-playpause') as HTMLButtonElement;
        expect(toggle).not.toBeNull();
        // APG: the rotation control precedes the slide container in the DOM
        expect(toggle.compareDocumentPosition(viewport()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(toggle.getAttribute('aria-label')).toBe('Stop automatic slide show');
        // rotating → the live region stays off
        expect(track().getAttribute('aria-live')).toBe('off');

        toggle.click();
        expect(toggle.getAttribute('aria-label')).toBe('Start automatic slide show');
        expect(track().getAttribute('aria-live')).toBe('polite'); // paused → announce
        vi.advanceTimersByTime(5000);
        expect(value.value).toBe(0); // stopped

        toggle.click(); // resumes even though the button keeps focus
        expect(toggle.getAttribute('aria-label')).toBe('Stop automatic slide show');
        vi.advanceTimersByTime(1000);
        expect(value.value).toBe(1);
    });

    it('no toggle without autoplay', () => {
        mount();
        expect(handle!.query('.lm-carousel-playpause')).toBeNull();
    });

    it('autoplay is live: changing the prop re-arms and 0 disarms', () => {
        vi.useFakeTimers();
        const value = store(0);
        const speed = store(0);
        mount({ bind: value, autoplay: speed });

        vi.advanceTimersByTime(5000);
        expect(value.value).toBe(0); // 0 = off

        speed.value = 500; // live prop change re-arms
        vi.advanceTimersByTime(1000);
        expect(value.value).toBe(2);

        speed.value = 0; // and disarms
        vi.advanceTimersByTime(5000);
        expect(value.value).toBe(2);
    });

    it('drag past 25% of the width commits the next slide (one onchange), tracking the pointer live', () => {
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, onchange: (i: number) => changes.push(i) });

        viewport().dispatchEvent(mouse('mousedown', 300));
        document.dispatchEvent(mouse('mousemove', 240));
        expect(root().className).toContain('lm-carousel-dragging');
        expect(transform()).toBe('translateX(calc(0% + -60px))'); // live px offset, off-grid

        document.dispatchEvent(mouse('mousemove', 180)); // dx = -120 < -100 (25% of 400)
        document.dispatchEvent(mouse('mouseup', 180));
        expect(root().className).not.toContain('lm-carousel-dragging');
        expect(value.value).toBe(1);
        expect(transform()).toBe(at(1));
        expect(changes).toEqual([1]); // ONE commit

        // dragging right (positive dx) commits prev
        viewport().dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mousemove', 250));
        document.dispatchEvent(mouse('mouseup', 250));
        expect(value.value).toBe(0);
        expect(changes).toEqual([1, 0]);
    });

    it('drag under 25% snaps back; a blocked edge (loop=false) snaps back too', () => {
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, onchange: (i: number) => changes.push(i) });

        viewport().dispatchEvent(mouse('mousedown', 300));
        document.dispatchEvent(mouse('mousemove', 220)); // dx = -80: under the 100px threshold
        document.dispatchEvent(mouse('mouseup', 220));
        expect(value.value).toBe(0); // snapped back
        expect(transform()).toBe(at(0));

        viewport().dispatchEvent(mouse('mousedown', 100));
        document.dispatchEvent(mouse('mousemove', 350)); // dx = +250: past the threshold…
        document.dispatchEvent(mouse('mouseup', 350));
        expect(value.value).toBe(0); // …but prev is blocked at 0: silent snap-back
        expect(changes).toEqual([]);
    });

    it('touch swipes commit exactly like mouse drags', () => {
        const value = store(0);
        mount({ bind: value });

        const touch = (type: string, x: number) => {
            const e = new Event(type, { bubbles: true, cancelable: true });
            Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x }] });
            return e;
        };
        viewport().dispatchEvent(touch('touchstart', 300));
        document.dispatchEvent(touch('touchmove', 150)); // dx = -150
        document.dispatchEvent(touch('touchend', 150));
        expect(value.value).toBe(1);
        expect(transform()).toBe(at(1));
    });

    it('Escape cancels the drag in flight: snap back, no commit, listeners released', () => {
        const value = store(0);
        const changes: number[] = [];
        mount({ bind: value, onchange: (i: number) => changes.push(i) });

        viewport().dispatchEvent(mouse('mousedown', 300));
        document.dispatchEvent(mouse('mousemove', 150)); // dx = -150: WOULD commit
        expect(transform()).toBe('translateX(calc(0% + -150px))');

        key('Escape', document);
        expect(transform()).toBe(at(0)); // snapped back
        expect(root().className).not.toContain('lm-carousel-dragging');
        expect(value.value).toBe(0);
        expect(changes).toEqual([]);

        document.dispatchEvent(mouse('mousemove', 50)); // gesture is dead
        expect(transform()).toBe(at(0));
        document.dispatchEvent(mouse('mouseup', 50));
        expect(value.value).toBe(0);
    });

    it('balances document listeners: full gestures, Escape, and unmount MID-DRAG', () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const count = (spy: typeof added, type: string) => spy.mock.calls.filter((c) => c[0] === type).length;

        mount();
        viewport().dispatchEvent(mouse('mousedown', 300)); // completed gesture
        document.dispatchEvent(mouse('mousemove', 100));
        document.dispatchEvent(mouse('mouseup', 100));
        viewport().dispatchEvent(mouse('mousedown', 300)); // cancelled gesture
        key('Escape', document);

        viewport().dispatchEvent(mouse('mousedown', 300)); // abandoned mid-drag…
        document.dispatchEvent(mouse('mousemove', 250));
        expect(count(added, 'mousemove')).toBeGreaterThan(count(removed, 'mousemove'));
        handle!.unmount(); // …released by unmount
        handle = null;

        for (const type of ['mousemove', 'touchmove', 'mouseup', 'touchend', 'keydown']) {
            expect(count(added, type)).toBe(count(removed, type));
        }
    });

    it('STYLE PROBE: exactly one hoisted style tag in document.head across two instances, none in the DOM', () => {
        const headStyles = () =>
            Array.from(document.head.querySelectorAll('style')).filter((s) =>
                (s.textContent || '').includes('.lm-carousel')
            );

        mount();
        const second = t(Carousel, { data: SLIDES });
        try {
            // hoisted ONCE per template, however many instances mount
            expect(headStyles().length).toBe(1);
            expect(headStyles()[0].textContent).toContain('.lm-carousel-track');
            // and the <style> never enters the component DOM
            expect(handle!.query('style')).toBeNull();
            expect(second.query('style')).toBeNull();
            expect(root().querySelector('style')).toBeNull();
        } finally {
            second.unmount();
        }

        // unmount + remount: still exactly one (no duplicates, no removal churn)
        handle!.unmount();
        mount();
        expect(headStyles().length).toBe(1);
    });
});
