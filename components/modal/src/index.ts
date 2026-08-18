/**
 * <Modal /> — the platform primitive. Floating panels, dropdown lists,
 * autocomplete, corner chats and the context menu are all built on these
 * behaviors, ported faithfully from v5:
 *
 *   - resize from all 8 edges/corners (10px hit zone) with live cursor
 *     feedback; Shift preserves the aspect ratio
 *   - drag by the top 40px zone with a move cursor — improved over v5:
 *     the grab zone is CLAMPED to the viewport, a modal can never be
 *     dragged irrecoverably off-screen
 *   - minimize DOCKS to a taskbar row at the bottom of the screen
 *     (205px slots, wrapping), restore returns to the remembered spot
 *   - explicit coordinates on open (centered unless positioned), margin
 *     based auto-adjust, responsive fullscreen on small screens; flip
 *     mode for anchored panels (dropdowns) inverts above the anchor at
 *     the bottom edge instead of covering it, api.adjust() re-anchors
 *     after content changes the panel size while open
 *   - Escape/focus handling scoped to the ELEMENT (multiple modals never
 *     fight over a document listener), v5 close origins preserved
 *
 * v5 → v6 mapping: closed → bind (inverted: bind is the OPEN state);
 * auto-close → autoclose; auto-adjust → autoadjust; content → children.
 * position: 'absolute' is CSS-anchored exactly like v5 (the host's
 * positioned ancestor places it — dropdown panels); 'fixed' takes
 * explicit viewport coordinates (context menus at the cursor).
 * onclose(origin): 'button' | 'backdrop' | 'escape' | 'focusout' | 'api'.
 * onmove(top, left) and onresize(width, height) fire on release.
 */

import { batch, component, css, html, isDisposing, unsafe } from 'lemonadejs';

const EDGE = 10; // resize hit zone
const BAR = 40; // drag zone height
const MIN_W = 140;
const MIN_H = 80;

/** Shared z-index across all modals (layers mode) */
let layerIndex = 20;

/**
 * The minimize dock: a module-level taskbar shared by all modals.
 * Placement goes through each modal's own pos state (place) — never
 * imperative styles, which any reactive style re-run would wipe.
 */
const dock: { el: HTMLElement; place: (top: number, left: number) => void }[] = [];

// ---- scroll lock: refcounted across instances so stacked backdrop
// modals restore the page's overflow only when the LAST one closes
let scrollLocks = 0;
let savedBodyOverflow = '';

const refreshDock = () => {
    let left = 10;
    let bottom = 55;
    for (const entry of dock) {
        entry.place(window.innerHeight - bottom, left);
        left += 205;
        if (window.innerWidth - left < 205) {
            left = 10;
            bottom += 50;
        }
    }
};

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | '';

/** v5 hit-test: which resize direction does this point touch? */
const hitResize = (rect: DOMRect, x: number, y: number): ResizeDir => {
    const top = y - rect.top < EDGE;
    const bottom = rect.height - (y - rect.top) < EDGE;
    const right = rect.width - (x - rect.left) < EDGE;
    const left = x - rect.left < EDGE;
    if (top) return right ? 'ne' : left ? 'nw' : 'n';
    if (bottom) return right ? 'se' : left ? 'sw' : 's';
    if (right) return 'e';
    if (left) return 'w';
    return '';
};

export const Modal = component('modal', {
    bind: Boolean,                // open state (v5: closed, inverted)
    title: '',
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    position: '',                 // center | left | right | bottom | fixed (explicit viewport
                                  // coordinates) | absolute (CSS-anchored: the host's positioned
                                  // ancestor places it, scrolling follows natively)
    backdrop: false,
    closable: false,
    draggable: false,
    resizable: false,
    minimizable: false,
    minimized: false,
    fullscreen: false,            // cover the whole viewport
    header: true,                 // false: headerless floating panel (menus, chips)
    role: '',                     // ARIA role: '' = auto (backdrop → dialog, else none)
    label: '',                    // accessible name fallback when there is no title (aria-label)
    describedby: '',              // aria-describedby id passthrough (dialog message wiring)
    autoclose: false,             // v5: auto-close
    autoadjust: false,            // v5: auto-adjust
    flip: 0,                      // anchored panels: at the bottom edge, flip ABOVE the natural top,
                                  // clearing this many px (the anchor height). 0 disables
    icon: '',                     // material icon name, shown before the title
    radius: true,                 // rounded corners (false: square — anchored panels)
    focus: true,
    outline: false,               // paint the catalog focus ring on the panel itself
    overflow: false,
    responsive: true,
    layers: false,
    url: '',
    onopen: Function,
    onclose: Function,
    onmove: Function,
    onresize: Function,
    api: { open: Function, close: Function, toggle: Function, front: Function, back: Function, adjust: Function },
}, (props, { bind, state, onMount, onUnmount, listen, resource }) => {
    const open = bind(props, false);
    const minimized = state(false);
    const pos = state({ top: props.top.value, left: props.left.value, fixed: false });
    const size = state({ w: props.width.value, h: props.height.value });
    const layer = state(0);

    // Remote content is a url-loading feature with v5 semantics: load ONCE,
    // lazily at the FIRST open that has a url, never refetch (url changes
    // between opens are ignored, v5 parity — hence the peek). The wanted
    // gate keeps mount network-free; resource() owns abort/race/zombie.
    const wantRemote = state(false);
    const remote = resource<string | null>((signal) =>
        wantRemote.value && typeof fetch === 'function'
            ? fetch(props.url.peek(), { signal }).then((r) => r.text())
            : null
    );

    let root: HTMLElement | null = null;
    let restoreTo = { top: 0, left: 0 };
    let lastFocused: HTMLElement | null = null; // pre-open focus, restored on close (2.4.3)

    // ---- scroll lock (backdrop modals only): the backdrop already blocks
    // interaction with the page — letting it scroll underneath reads broken
    let scrollLocked = false;
    const lockScroll = () => {
        if (!scrollLocked && props.backdrop.value) {
            scrollLocked = true;
            if (++scrollLocks === 1) {
                savedBodyOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
            }
        }
    };
    const unlockScroll = () => {
        if (scrollLocked) {
            scrollLocked = false;
            if (--scrollLocks === 0) {
                document.body.style.overflow = savedBodyOverflow;
            }
        }
    };

    // ---- interactions: one in flight, ONE cleanup registered at setup
    let releaseInteraction: (() => void) | null = null;
    onUnmount(() => {
        releaseInteraction?.();
        unlockScroll();
        if (root) {
            const i = dock.findIndex((entry) => entry.el === root);
            if (i >= 0) {
                dock.splice(i, 1);
                refreshDock();
            }
        }
    });

    const track = (move: (e: MouseEvent) => void, done?: () => void) => {
        releaseInteraction?.();
        const offs = [
            listen<MouseEvent>(document, 'mousemove', move),
            listen(document, 'mouseup', () => releaseInteraction?.()),
        ];
        releaseInteraction = () => {
            offs.forEach((off) => off());
            releaseInteraction = null;
            root?.classList.remove('lm-modal-action');
            done?.();
        };
        root?.classList.add('lm-modal-action');
    };

    listen(window, 'resize', () => refreshDock());

    // ---- open/close
    const doOpen = () => {
        if (!open.value) {
            open.set(true);
            props.onopen?.();
        }
    };
    const doClose = (origin: string) => {
        if (open.value) {
            if (minimized.value) {
                restore();
            }
            // Hand focus back to the pre-open element — only when it still
            // exists and focus currently sits INSIDE the modal (never steal
            // it from a control the user has since moved on to)
            const opener =
                lastFocused && lastFocused.isConnected && root && root.contains(document.activeElement)
                    ? lastFocused
                    : null;
            lastFocused = null;
            open.set(false);
            opener?.focus();
            props.onclose?.(origin);
        }
    };
    const front = () => {
        layer.value = ++layerIndex;
    };
    const back = () => {
        layer.value = 0;
    };

    props.ref?.({
        open: doOpen,
        close: () => doClose('api'),
        toggle: () => (open.value ? doClose('api') : doOpen()),
        front,
        back,
        // Recalculate the auto-adjust margins: the compensation depends on
        // the modal dimensions, so content that changes size while open
        // (a filtered list) must re-anchor. Deferred one microtask so the
        // caller's content change has rendered before measuring.
        adjust: () =>
            queueMicrotask(() => {
                if (root && open.value) {
                    autoAdjust(root);
                }
            }),
    });

    // ---- minimize docking (v5 taskbar behavior)
    const minimize = () => {
        if (!root || minimized.value) {
            return;
        }
        // The entrance animation transforms the rect (scale + translate);
        // jump it to its end state first, or minimizing within its 220ms
        // (a quick click, or the `minimized` prop at open) consolidates a
        // mid-animation position and restore lands the modal displaced
        root.getAnimations?.().forEach((a) => { try { a.finish(); } catch { /* infinite animation */ } });
        // Remember the EFFECTIVE position (margins consolidated — v5
        // removeMargin) and exact dimensions: restore must return the
        // modal precisely as it looked
        const rect = root.getBoundingClientRect();
        restoreTo = { top: rect.top, left: rect.left };
        batch(() => {
            if (rect.width && !size.value.w) {
                size.value = { w: rect.width, h: rect.height };
            }
            // Consolidate before docking so the bar animates from where the
            // modal visually is, not from a pre-margin position
            pos.value = { top: rect.top, left: rect.left, fixed: true };
            minimized.value = true;
            // docked to the taskbar: the backdrop is gone, free the page
            unlockScroll();
            dock.push({
                el: root!,
                place: (top, left) => {
                    pos.value = { top, left, fixed: true };
                },
            });
            refreshDock();
        });
    };
    const restore = () => {
        if (!root || !minimized.value) {
            return;
        }
        const i = dock.findIndex((entry) => entry.el === root);
        if (i >= 0) {
            dock.splice(i, 1);
        }
        batch(() => {
            minimized.value = false;
            pos.value = { top: restoreTo.top, left: restoreTo.left, fixed: true };
            refreshDock();
        });
        lockScroll();
    };

    // The rect with any RUNNING entrance animation jumped to its end state
    // for the measurement (and put back, so the animation still plays):
    // margins computed from the mid-animation scale under-adjust by a few
    // px and STICK after the animation finishes (corner-opened menus).
    const settledRect = (el: HTMLElement): DOMRect => {
        const anims = el.getAnimations ? el.getAnimations().filter((a) => a.playState === 'running') : [];
        if (!anims.length) {
            return el.getBoundingClientRect();
        }
        const saved = anims.map((a) => a.currentTime);
        for (const a of anims) {
            try { a.currentTime = a.effect?.getComputedTiming().endTime ?? 0; } catch { /* detached */ }
        }
        const r = el.getBoundingClientRect();
        anims.forEach((a, i) => { try { a.currentTime = saved[i]; } catch { /* detached */ } });
        return r;
    };

    // ---- v5 auto-adjust: how far back inside the viewport (10px margin)?
    const overflow = (r: DOMRect) => {
        const margin = 10;
        let dx = 0;
        let dy = 0;
        const overRight = window.innerWidth - (r.left + r.width);
        if (overRight < 0) {
            dx = overRight - margin;
        }
        if (r.left < 0) {
            dx = margin - r.left;
        }
        const overBottom = window.innerHeight - (r.top + r.height);
        if (overBottom < 0) {
            dy = overBottom - margin;
        }
        if (r.top < 0) {
            dy = margin - r.top;
        }
        return { dx, dy };
    };

    /** On open: margin-based (v5) — declared top/left stay authoritative */
    const autoAdjust = (el: HTMLElement) => {
        if (!props.autoadjust.value) {
            return;
        }
        // removeProperty, not `= ''`: jsdom does not clear on empty-string
        // assignment, and the registry verify() gate runs in jsdom
        el.style.removeProperty('margin-left');
        el.style.removeProperty('margin-top');
        const r = settledRect(el);
        let { dx, dy } = overflow(r);
        // Anchored panels (flip): sliding the panel up would COVER the
        // anchor (the dropdown input the user is typing into) — flip it
        // above the anchor instead (v5 absolute-position behavior). The
        // flip value is the anchor's height: how far above the natural
        // top the panel's bottom edge must land
        if (props.flip.value && window.innerHeight - (r.top + r.height) < 5) {
            dy = -r.height - props.flip.value;
            if (r.top + dy < 10) {
                dy = 10 - r.top;
            }
        }
        if (dx) {
            el.style.marginLeft = dx + 'px';
        }
        if (dy) {
            el.style.marginTop = dy + 'px';
        }
    };

    /** On drag release: nudge the position itself back into the viewport */
    const adjustPosition = () => {
        if (!props.autoadjust.value || !root) {
            return;
        }
        const { dx, dy } = overflow(root.getBoundingClientRect());
        if (dx || dy) {
            pos.value = { top: pos.value.top + dy, left: pos.value.left + dx, fixed: true };
        }
    };

    // ---- per-open setup (v5 onload behavior): SYNCHRONOUS — refs fire on
    // already-attached nodes and the open subscription runs after the branch
    // binding re-attached the cached DOM, so measurement works directly in
    // both paths (the old one-microtask deferral predates attached refs).
    // The flag dedups the FIRST open, where the ref and the subscription
    // fire in the same pass; closing re-arms it for the next open.
    let setupDone = false;
    const runSetup = () => {
        if (!setupDone && root && root.isConnected && open.value) {
            setupDone = true;
            // Remember who had focus before the modal takes it (position
            // changes re-run setup while open: never capture our own panel)
            if (!root.contains(document.activeElement)) {
                lastFocused = document.activeElement as HTMLElement | null;
            }
            lockScroll();
            setup();
        }
    };

    const onOpened = (el: HTMLElement) => {
        root = el;
        runSetup();
    };

    // Reopen reuses the cached branch — refs do NOT re-fire, so setup is
    // re-armed by watching the open state itself (api, bind or backdrop)
    onMount(() => open.subscribe((v) => {
        if (v) {
            runSetup();
        } else {
            setupDone = false;
            unlockScroll();
        }
    }));

    // position is live while open (v5 reactive properties): drop the
    // explicit coordinates and re-place under the new positioning model
    onMount(() =>
        props.position.subscribe(() => {
            if (open.value && root) {
                pos.value = { top: props.top.value, left: props.left.value, fixed: false };
                setupDone = false;
                runSetup();
            }
        })
    );

    // width/height are live while open too (position already is): a resize
    // keeps the current placement, it only re-checks the viewport fit
    const liveResize = () => {
        if (open.value && root && !minimized.value) {
            const w = props.width.value || size.value.w;
            const h = props.height.value || size.value.h;
            if (w !== size.value.w || h !== size.value.h) {
                size.value = { w, h };
                autoAdjust(root);
            }
        }
    };
    onMount(() => props.width.subscribe(liveResize));
    onMount(() => props.height.subscribe(liveResize));


    const setup = () => {
        const el = root!;
        const p = props.position.value;
        if (props.layers.value) {
            front();
        }
        if (p === 'absolute') {
            // CSS-anchored: the host's positioned ancestor places the panel
            // and the browser keeps it attached through any scrolling — the
            // component never takes over top/left. Width/height come from
            // the props only, NEVER measured: locking the first-open height
            // would freeze a content-sized panel whose list shrinks and
            // grows with a search (v5 skipped anchored panels too)
            const w = props.width.value || size.value.w;
            const h = props.height.value || size.value.h;
            if (w !== size.value.w || h !== size.value.h) {
                size.value = { w, h };
            }
        } else if (!props.fullscreen.value && p !== 'left' && p !== 'right' && p !== 'bottom') {
            // Explicit coordinates: measure, then center unless given (v5).
            // Declared width/height/top/left are re-read EVERY open — they
            // may be live states updated between opens (anchored panels)
            const w = props.width.value || size.value.w || el.offsetWidth;
            const h = props.height.value || size.value.h || el.offsetHeight;
            if (w !== size.value.w || h !== size.value.h) {
                size.value = { w, h };
            }
            if (p === 'fixed') {
                pos.value = {
                    top: props.top.value || pos.value.top,
                    left: props.left.value || pos.value.left,
                    fixed: true,
                };
            } else {
                const top = props.top.value || Math.max(0, (window.innerHeight - h) / 2);
                const left = props.left.value || Math.max(0, (window.innerWidth - w) / 2);
                pos.value = { top, left, fixed: true };
            }
            // v5 responsive: small screens promote tall modals to fullscreen
            if (props.responsive.value && document.documentElement.clientWidth < 800 && h > 300) {
                el.classList.add('lm-modal-fullscreen');
            }
        }
        autoAdjust(el);
        if (props.minimized.value && !minimized.value) {
            minimize();
        }
        if (props.focus.value) {
            el.focus();
        }
        if (props.url.value && !wantRemote.peek()) {
            wantRemote.value = true; // first open with a url: the resource fetches once
        }
    };

    // ---- pointer interactions: v5 hit-testing on the modal itself
    const cursorFor = (e: MouseEvent): string => {
        if (!root || minimized.value || props.fullscreen.value) {
            return '';
        }
        const rect = root.getBoundingClientRect();
        if (props.resizable.value) {
            const dir = hitResize(rect, e.clientX, e.clientY);
            if (dir) {
                return dir + '-resize';
            }
        }
        if (props.draggable.value && e.clientY - rect.top < BAR) {
            return 'move';
        }
        return '';
    };

    const onHover = (e: MouseEvent) => {
        if (root && !releaseInteraction) {
            root.style.cursor = cursorFor(e);
        }
    };

    const startDrag = (e: MouseEvent, rect: DOMRect) => {
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        track(
            (ev: MouseEvent) => {
                // Improved over v5: the grab bar can never leave the screen
                const top = Math.min(Math.max(0, ev.clientY - offsetY), Math.max(0, window.innerHeight - BAR));
                const left = Math.min(
                    Math.max(-(rect.width - 80), ev.clientX - offsetX),
                    Math.max(0, window.innerWidth - 80)
                );
                if (root) {
                    root.style.marginLeft = '';
                    root.style.marginTop = '';
                }
                pos.value = { top, left, fixed: true };
            },
            () => {
                // v5: releasing a drag re-adjusts — a modal dragged beyond
                // the viewport nudges back in; onmove reports the final spot
                adjustPosition();
                props.onmove?.(pos.value.top, pos.value.left);
            }
        );
    };

    const startResize = (e: MouseEvent, rect: DOMRect, dir: ResizeDir) => {
        const sx = e.clientX;
        const sy = e.clientY;
        const start = { w: rect.width, h: rect.height, t: rect.top, l: rect.left };
        const ratio = start.h / (start.w || 1);
        track(
            (ev: MouseEvent) => {
                const dx = ev.clientX - sx;
                const dy = ev.clientY - sy;
                let { w, h, t, l } = start;
                if (dir.includes('e')) {
                    w = start.w + dx;
                    if (ev.shiftKey) {
                        h = start.h + dx * ratio;
                    }
                } else if (dir.includes('w')) {
                    l = Math.min(start.l + dx, start.l + start.w - MIN_W);
                    w = start.l + start.w - l;
                    if (ev.shiftKey) {
                        h = start.h - dx * ratio;
                    }
                }
                if (dir.includes('s') && !ev.shiftKey) {
                    h = start.h + dy;
                } else if (dir.includes('n')) {
                    t = Math.min(start.t + dy, start.t + start.h - MIN_H);
                    h = start.t + start.h - t;
                }
                w = Math.max(MIN_W, w);
                h = Math.max(MIN_H, h);
                // hot path (every mousemove): size + pos land as ONE pass
                batch(() => {
                    size.value = { w, h };
                    if (dir.includes('w') || dir.includes('n')) {
                        pos.value = { top: t, left: l, fixed: true };
                    }
                });
            },
            () => {
                props.onresize?.(size.value.w, size.value.h);
            }
        );
    };

    const onPress = (e: MouseEvent) => {
        if (props.layers.value) {
            front();
        }
        if (!root || minimized.value || props.fullscreen.value) {
            return;
        }
        const rect = root.getBoundingClientRect();
        if (props.resizable.value) {
            const dir = hitResize(rect, e.clientX, e.clientY);
            if (dir) {
                e.preventDefault();
                startResize(e, rect, dir);
                return;
            }
        }
        if (props.draggable.value && e.clientY - rect.top < BAR && !(e.target as Element).closest('button')) {
            e.preventDefault();
            startDrag(e, rect);
        }
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && props.closable.value && open.value) {
            doClose('escape');
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        // Keyboard parity for the mouse-only drag/resize: with the PANEL
        // itself focused, arrows move a draggable modal and Shift+arrows
        // resize a resizable one — 10px steps, the pointer paths' clamps
        // and callbacks. Target-scoped to the panel so arrows inside inner
        // content (inputs, lists) are never hijacked.
        if (e.key.indexOf('Arrow') === 0 && root && e.target === root && !minimized.value && !props.fullscreen.value) {
            const dx = e.key === 'ArrowRight' ? 10 : e.key === 'ArrowLeft' ? -10 : 0;
            const dy = e.key === 'ArrowDown' ? 10 : e.key === 'ArrowUp' ? -10 : 0;
            if (e.shiftKey && props.resizable.value) {
                const rect = root.getBoundingClientRect();
                const w = Math.max(MIN_W, (size.value.w || rect.width) + dx);
                const h = Math.max(MIN_H, (size.value.h || rect.height) + dy);
                size.value = { w, h };
                props.onresize?.(w, h);
                e.preventDefault();
            } else if (!e.shiftKey && props.draggable.value && pos.value.fixed) {
                const rect = root.getBoundingClientRect();
                const top = Math.min(Math.max(0, pos.value.top + dy), Math.max(0, window.innerHeight - BAR));
                const left = Math.min(
                    Math.max(-(rect.width - 80), pos.value.left + dx),
                    Math.max(0, window.innerWidth - 80)
                );
                pos.value = { top, left, fixed: true };
                props.onmove?.(top, left);
                e.preventDefault();
            }
            return;
        }
        // Focus trap — DIALOG MODE ONLY (backdrop): Tab cycles inside the
        // modal instead of escaping to the page the backdrop is masking.
        // Headless/anchored panels keep native tab order.
        if (e.key === 'Tab' && props.backdrop.value && !minimized.value && root) {
            const focusables = [...root.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), ' +
                'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )];
            if (!focusables.length) {
                e.preventDefault(); // nothing tabbable: focus stays on the modal
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || active === root)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    const styles = () => {
        if (props.fullscreen.value) {
            return '';
        }
        const p = pos.value;
        const s = size.value;
        return css({
            // One source of truth for top/left — open, dragged or docked
            position: p.fixed && 'fixed',
            top: p.fixed ? p.top : null,
            left: p.fixed ? p.left : null,
            margin: p.fixed ? 0 : null,
            width: (!minimized.value && s.w) || null,
            height: (!minimized.value && s.h) || null,
            'z-index': layer.value || null,
        });
    };

    return html`${() =>
        open.value &&
        html`<div class="lm-modal-root" data-position="${() => props.position.value || false}">
            ${() =>
                props.backdrop.value && !minimized.value &&
                html`<div class="lm-modal-backdrop" onclick="${() => props.closable.value && doClose('backdrop')}"></div>`}
            <div class="lm-modal ${() => (minimized.value ? 'lm-modal-minimized' : '')} ${() =>
                props.fullscreen.value ? 'lm-modal-fullscreen' : ''} ${() =>
                props.overflow.value ? 'lm-modal-overflow' : ''}"
                style="${styles}"
                role="${() => props.role.value || (props.backdrop.value ? 'dialog' : false)}"
                aria-modal="${() => ((props.role.value || (props.backdrop.value ? 'dialog' : '')) === 'dialog' ? 'true' : false)}"
                aria-label="${() => props.title.value || props.label.value || false}"
                aria-describedby="${() => props.describedby.value || false}"
                data-outline="${() => (props.outline.value ? 'true' : false)}"
                data-radius="${() => (props.radius.value === false ? 'false' : false)}"
                tabindex="-1"
                ref="${(el: HTMLElement) => onOpened(el)}"
                onmousemove="${onHover}"
                onmousedown="${onPress}"
                onkeydown="${onKey}"
                onfocusin="${() => root?.classList.add('lm-modal-focus')}"
                onfocusout="${(e: FocusEvent) => {
                    if (isDisposing()) {
                        return; // renderer-caused blur, not the user leaving
                    }
                    if (root && !root.contains(e.relatedTarget as Node)) {
                        root.classList.remove('lm-modal-focus');
                        if (props.autoclose.value) {
                            doClose('focusout');
                        }
                    }
                }}">
                ${() =>
                    props.header.value &&
                    html`<header class="lm-modal-header"
                        onclick="${() => minimized.value && restore()}">
                        <span class="lm-modal-title">${() =>
                            props.icon.value
                                ? html`<i class="material-icons material-symbols-outlined lm-modal-icon">${props.icon}</i>`
                                : ''}${props.title}</span>
                        <span class="lm-modal-controls">
                            ${() =>
                                props.minimizable.value &&
                                html`<button class="lm-modal-minimize" title="${() =>
                                    minimized.value ? 'Restore' : 'Minimize'}"
                                    onclick="${(e: MouseEvent) => {
                                        e.stopPropagation();
                                        if (minimized.value) {
                                            restore();
                                        } else {
                                            minimize();
                                        }
                                    }}">${() => (minimized.value
                                        ? html`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" /></svg>`
                                        : html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>`)}</button>`}
                            ${() =>
                                props.closable.value &&
                                html`<button class="lm-modal-close" title="Close" aria-label="Close"
                                    onclick="${() => doClose('button')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg></button>`}
                        </span>
                    </header>`}
                <div class="lm-modal-content">${props.children}${() =>
                    remote.data.value ? unsafe(remote.data.value) : null}</div>
            </div>
        </div>`}`;
});

export default Modal;
