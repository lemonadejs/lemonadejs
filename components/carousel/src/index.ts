/**
 * <Carousel /> — LemonadeJS v6 block (new in v6)
 *
 * SINGLE-FILE component: the CSS ships INSIDE the template via the v6
 * component-owned <style> hoisting — no style.css anywhere. The engine
 * lifts the <style> at parse time and injects it into document.head ONCE
 * per template, however many instances mount. Hoisted styles are global,
 * so every selector is prefixed lm-carousel-*.
 *
 * Model: slides sit side by side in a flex strip (each 100% wide); the
 * position is a translateX on the strip — `-index·100% + dragPx` — fully
 * deterministic (jsdom has no layout). The snap animation is one CSS
 * transition, suspended while dragging via the lm-carousel-dragging
 * class. Slides and dots are keyed by slide identity.
 *
 * Gestures (the llms.txt listen() pattern): pointer-down arms document
 * mousemove/touchmove/mouseup/touchend (+ keydown for Escape) per
 * gesture with ONE persistent release; pointer-up COMMITS — a drag past
 * 25% of the viewport width goes to the next/prev slide, anything less
 * snaps back. Escape cancels the drag in flight. A mid-drag unmount
 * releases everything (onUnmount → release).
 *
 * Autoplay: setInterval armed when autoplay > 0, re-armed live on prop
 * change (subscribe), PAUSED while hovering, focused (focusin/focusout)
 * or dragging, cleared on unmount. When autoplay is active a labelled
 * pause/play toggle renders BEFORE the slides (WAI-ARIA APG carousel
 * pattern); the toggle itself never pauses rotation on focus, so "play"
 * resumes immediately. Autoplay always wraps (rewinds to 0 after the
 * last slide), even when loop=false — loop only governs user navigation
 * at the edges.
 *
 * Contract: bind (current index, two-way; set → onchange), data (slides:
 * { image?, title?, description?, link? } — only provided fields
 * render), autoplay (ms, 0 = off), loop, arrows, dots, onchange(index);
 * api { next, prev, goto }. Keyboard: ArrowLeft/ArrowRight on the
 * focused region. ARIA: aria-roledescription carousel/slide, off-screen
 * slides aria-hidden AND inert (their links leave the tab order), slide
 * labels carry the title, and the track is aria-live=polite only while
 * not auto-rotating.
 */

import { batch, component, html } from 'lemonadejs';

export type CarouselSlide = {
    image?: string;
    title?: string;
    description?: string;
    link?: string;
};

export const Carousel = component('carousel', {
    bind: Number,                 // two-way current slide index
    data: Array,                  // slides: { image?, title?, description?, link? }
    autoplay: 0,                  // ms between automatic advances (0 = off)
    loop: false,                  // wrap next/prev past the edges
    arrows: true,                 // prev/next overlay buttons
    dots: true,                   // one dot per slide, clickable
    onchange: Function,           // (index) on user/component-initiated changes
    api: { next: Function, prev: Function, goto: Function },
}, (props, { bind, state, computed, listen, onMount, onUnmount }) => {
    const index = bind(props, 0);

    const slides = () => ((props.data.value as CarouselSlide[]) || []);
    const count = () => slides().length;

    /** The displayed index — derived, so computed(): the bound value
     *  clamped into the slide range, live wherever it is read */
    const cur = computed(() => {
        const n = count();
        if (!n) {
            return 0;
        }
        const i = Math.round(Number(index.value) || 0);
        return Math.min(Math.max(0, i), n - 1);
    });

    // Gesture state: px offset while dragging (live in the strip transform)
    const drag = state(0);
    const dragging = state(false);

    let viewportEl: HTMLElement | null = null;
    let hovering = false;
    let focused = false;

    // user-facing pause/play toggle (2.2.2): reactive so the button relabels
    const paused = state(false);

    /** loop=true wraps; loop=false clamps (edge no-ops stay silent — set
     *  only fires onchange when the index actually changes) */
    const goto = (i: number) => {
        const n = count();
        if (!n) {
            return;
        }
        let t = Math.round(Number(i) || 0);
        t = props.loop.value ? ((t % n) + n) % n : Math.min(Math.max(0, t), n - 1);
        index.set(t);
    };
    const next = () => goto(cur.value + 1);
    const prev = () => goto(cur.value - 1);

    // ---- autoplay: one interval, re-armed on prop change, paused on
    // hover/drag, cleared on unmount (onMount cleanup)
    let timer: ReturnType<typeof setInterval> | null = null;
    const stopAuto = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    };
    const startAuto = () => {
        stopAuto();
        const ms = Number(props.autoplay.value) || 0;
        if (ms > 0 && !hovering && !focused && !paused.value && !dragging.value && count() > 1) {
            // autoplay always wraps — a stuck end frame helps nobody
            timer = setInterval(() => index.set((cur.value + 1) % count()), ms);
        }
    };
    onMount(() => {
        startAuto();
        return stopAuto;
    });
    onMount(() => props.autoplay.subscribe(startAuto)); // live: prop change re-arms
    // shrinking the data clamps the selection (component-initiated: onchange
    // fires), and a new slide count re-arms autoplay
    onMount(() =>
        props.data.subscribe(() => {
            const n = count();
            if (n && Math.round(Number(index.value) || 0) > n - 1) {
                index.set(n - 1);
            }
            startAuto();
        })
    );

    const onEnter = () => {
        hovering = true;
        stopAuto();
    };
    const onLeave = () => {
        hovering = false;
        startAuto();
    };
    // keyboard parity with hover (2.2.2): focus anywhere inside pauses,
    // leaving resumes — EXCEPT the rotation control itself, so activating
    // "play" restarts rotation while the button keeps focus (APG)
    const onFocusIn = (e: FocusEvent) => {
        if ((e.target as HTMLElement | null)?.closest?.('.lm-carousel-playpause')) {
            return;
        }
        focused = true;
        stopAuto();
    };
    const onFocusOut = () => {
        focused = false;
        startAuto();
    };
    const togglePlay = () => {
        paused.value = !paused.value;
        startAuto(); // stops first; re-arms only when nothing else pauses
    };

    // ---- swipe/drag: document listeners armed per gesture, ONE release
    // that also decides the outcome — pointer-up commits past 25% of the
    // width, Escape cancels, unmount mid-drag releases (snap-back)
    let release: (() => void) | null = null;
    onUnmount(() => release?.());

    const pointerX = (e: Event): number => {
        const t = (e as TouchEvent).touches?.[0] || (e as TouchEvent).changedTouches?.[0];
        return t ? t.clientX : (e as MouseEvent).clientX;
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
        if (count() < 2) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault(); // no text selection / native image drag
        }
        release?.();
        stopAuto();
        const from = pointerX(e);
        const width = viewportEl ? viewportEl.getBoundingClientRect().width : 0;
        let cancelled = false;
        dragging.value = true;

        const move = (ev: Event) => {
            drag.value = pointerX(ev) - from;
            if (ev.cancelable) {
                ev.preventDefault();
            }
        };
        const up = () => release?.();
        const onDocKey = (ev: Event) => {
            if ((ev as KeyboardEvent).key === 'Escape') {
                cancelled = true; // snap back, commit nothing
                release?.();
            }
        };
        const offs = [
            listen(document, 'mousemove', move),
            listen(document, 'touchmove', move, { passive: false }),
            listen(document, 'mouseup', up),
            listen(document, 'touchend', up),
            listen(document, 'keydown', onDocKey),
        ];
        release = () => {
            offs.forEach((off) => off());
            release = null;
            // the commit writes drag, dragging and possibly the index —
            // batch() folds them into ONE update pass
            batch(() => {
                const dx = drag.value;
                drag.value = 0;
                dragging.value = false;
                if (!cancelled && width > 0 && Math.abs(dx) > width / 4) {
                    // a blocked edge (loop=false) is a silent no-op → snap back
                    if (dx < 0) {
                        next();
                    } else {
                        prev();
                    }
                }
            });
            startAuto();
        };
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            next();
        } else if (e.key === 'ArrowLeft') {
            prev();
        } else {
            return;
        }
        e.preventDefault();
    };

    props.ref?.({ next, prev, goto });

    return html`<div class="lm-carousel ${() => (dragging.value ? 'lm-carousel-dragging' : '')}"
        role="region"
        aria-roledescription="carousel"
        tabindex="0"
        onkeydown="${onKey}"
        onmouseenter="${onEnter}"
        onmouseleave="${onLeave}"
        onfocusin="${onFocusIn}"
        onfocusout="${onFocusOut}">
        <style>
            .lm-carousel { position: relative; user-select: none; -webkit-user-select: none; }
            .lm-carousel:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
            .lm-carousel-viewport { overflow: hidden; border-radius: 8px; cursor: grab; }
            .lm-carousel-dragging .lm-carousel-viewport { cursor: grabbing; }
            .lm-carousel-track { display: flex; transition: transform 0.3s ease; will-change: transform; }
            .lm-carousel-dragging .lm-carousel-track { transition: none; }
            .lm-carousel-slide { flex: 0 0 100%; min-width: 100%; position: relative; box-sizing: border-box; }
            .lm-carousel-image { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
            .lm-carousel-caption { padding: 14px 16px; }
            .lm-carousel-overlay { position: absolute; left: 0; right: 0; bottom: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.65)); color: #fff; }
            .lm-carousel-title { margin: 0 0 4px; font-size: 18px; }
            .lm-carousel-description { margin: 0; font-size: 14px; opacity: 0.9; }
            .lm-carousel-link { display: inline-block; margin-top: 6px; font-size: 14px;
                color: inherit; text-decoration: underline; }
            .lm-carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%);
                width: 36px; height: 36px; border: none; border-radius: 50%; cursor: pointer;
                background: rgba(255, 255, 255, 0.85); color: #111; font-size: 20px; line-height: 1;
                display: flex; align-items: center; justify-content: center; }
            .lm-carousel-arrow:hover { background: #fff; }
            .lm-carousel-arrow[disabled] { opacity: 0.35; cursor: default; }
            .lm-carousel-arrow svg { width: 18px; height: 18px; display: block;
                fill: none; stroke: currentColor; stroke-width: 2.5;
                stroke-linecap: round; stroke-linejoin: round; }
            .lm-carousel-prev { left: 10px; }
            .lm-carousel-next { right: 10px; }
            .lm-carousel-dots { position: absolute; left: 0; right: 0; bottom: 8px;
                display: flex; justify-content: center; gap: 6px; }
            .lm-carousel-dot { width: 10px; height: 10px; padding: 0; border: none;
                border-radius: 50%; cursor: pointer; background: rgba(255, 255, 255, 0.55); }
            .lm-carousel-dot[data-active='true'] { background: #fff; }
            .lm-carousel-playpause { position: absolute; top: 10px; right: 10px; z-index: 1;
                width: 32px; height: 32px; border: none; border-radius: 50%; cursor: pointer;
                background: rgba(255, 255, 255, 0.85); color: #111;
                display: flex; align-items: center; justify-content: center; }
            .lm-carousel-playpause:hover { background: #fff; }
            .lm-carousel-playpause svg { width: 16px; height: 16px; display: block;
                fill: none; stroke: currentColor; stroke-width: 2.5;
                stroke-linecap: round; stroke-linejoin: round; }
        </style>
        ${() =>
            Number(props.autoplay.value) > 0 && count() > 1 &&
            html`<button type="button" class="lm-carousel-playpause"
                aria-label="${() => (paused.value ? 'Start automatic slide show' : 'Stop automatic slide show')}"
                data-paused="${() => (paused.value ? 'true' : false)}"
                onclick="${togglePlay}"><svg viewBox="0 0 24 24" aria-hidden="true"><path
                    d="${() => (paused.value ? 'M8 6l10 6-10 6z' : 'M9 5v14M15 5v14')}" /></svg></button>`}
        <div class="lm-carousel-viewport"
            ref="${(el: HTMLElement) => (viewportEl = el)}"
            onmousedown="${onDown}"
            ontouchstart="${onDown}">
            <div class="lm-carousel-track"
                aria-live="${() => (Number(props.autoplay.value) > 0 && !paused.value ? 'off' : 'polite')}"
                style="${() => 'transform: translateX(calc(' + cur.value * -100 + '% + ' + drag.value + 'px))'}">
                ${() =>
                    slides().map((raw, i, arr) => {
                        const s = (raw || {}) as CarouselSlide;
                        // key: the slide object — reordered data moves DOM
                        return html`<div class="lm-carousel-slide" key="${raw}"
                            role="group"
                            aria-roledescription="slide"
                            aria-label="${i + 1 + ' of ' + arr.length + (s.title ? ': ' + s.title : '')}"
                            aria-hidden="${() => (cur.value === i ? 'false' : 'true')}"
                            inert="${() => (cur.value === i ? false : 'true')}">
                            ${s.image
                                ? html`<img class="lm-carousel-image" src="${s.image}"
                                      alt="${s.title || ''}" draggable="false" />`
                                : null}
                            ${s.title || s.description || s.link
                                ? html`<div class="lm-carousel-caption ${s.image ? 'lm-carousel-overlay' : ''}">
                                      ${s.title ? html`<h3 class="lm-carousel-title">${s.title}</h3>` : null}
                                      ${s.description
                                          ? html`<p class="lm-carousel-description">${s.description}</p>`
                                          : null}
                                      ${s.link
                                          ? html`<a class="lm-carousel-link" href="${s.link}">Learn more</a>`
                                          : null}
                                  </div>`
                                : null}
                        </div>`;
                    })}
            </div>
        </div>
        ${() =>
            props.arrows.value && count() > 1 &&
            html`<button type="button" class="lm-carousel-arrow lm-carousel-prev"
                aria-label="Previous slide"
                disabled="${() => !props.loop.value && cur.value === 0}"
                onclick="${prev}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>`}
        ${() =>
            props.arrows.value && count() > 1 &&
            html`<button type="button" class="lm-carousel-arrow lm-carousel-next"
                aria-label="Next slide"
                disabled="${() => !props.loop.value && cur.value === count() - 1}"
                onclick="${next}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>`}
        ${() =>
            props.dots.value && count() > 1 &&
            html`<div class="lm-carousel-dots">
                ${slides().map(
                    // keyed like the slides: a dot follows its slide
                    (s, i) => html`<button type="button" class="lm-carousel-dot" key="${s}"
                        aria-label="${'Go to slide ' + (i + 1)}"
                        data-active="${() => (cur.value === i ? 'true' : false)}"
                        onclick="${() => goto(i)}"></button>`
                )}
            </div>`}
    </div>`;
});

export default Carousel;
