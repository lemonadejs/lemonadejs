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
 *     based auto-adjust, responsive fullscreen on small screens
 *   - Escape/focus handling scoped to the ELEMENT (multiple modals never
 *     fight over a document listener), v5 close origins preserved
 *
 * v5 → v6 mapping: closed → bind (inverted: bind is the OPEN state);
 * auto-close → autoclose; auto-adjust → autoadjust; content → children.
 * onclose(origin): 'button' | 'backdrop' | 'escape' | 'focusout' | 'api'.
 * onmove(top, left) and onresize(width, height) fire on release.
 */

import { component, html, unsafe } from '../../src/index';

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
    position: '',                 // center | left | right | bottom | absolute
    backdrop: false,
    closable: false,
    draggable: false,
    resizable: false,
    minimizable: false,
    minimized: false,
    fullscreen: false,            // MUI
    header: true,                 // false: headerless floating panel (menus, chips)
    autoclose: false,             // v5: auto-close
    autoadjust: false,            // v5: auto-adjust
    focus: true,
    overflow: false,
    responsive: true,
    layers: false,
    url: '',
    onopen: Function,
    onclose: Function,
    onmove: Function,
    onresize: Function,
    api: { open: Function, close: Function, toggle: Function, front: Function, back: Function },
}, (props, { bind, state, onMount, onUnmount }) => {
    const open = bind(props, false);
    const minimized = state(false);
    const pos = state({ top: props.top!.value as number, left: props.left!.value as number, fixed: false });
    const size = state({ w: props.width!.value as number, h: props.height!.value as number });
    const layer = state(0);
    const remote = state<Node[] | null>(null);

    let root: HTMLElement | null = null;
    let restoreTo = { top: 0, left: 0 };

    // ---- interactions: one in flight, ONE cleanup registered at setup
    let releaseInteraction: (() => void) | null = null;
    onUnmount(() => {
        releaseInteraction?.();
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
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            releaseInteraction = null;
            root?.classList.remove('lm-modal-action');
            done?.();
        };
        releaseInteraction = up;
        root?.classList.add('lm-modal-action');
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    const onResizeWindow = () => refreshDock();
    onMount(() => {
        window.addEventListener('resize', onResizeWindow);
        return () => window.removeEventListener('resize', onResizeWindow);
    });

    // ---- open/close
    const doOpen = () => {
        if (!open.value) {
            open.set(true);
            (props.onopen as (() => void) | undefined)?.();
        }
    };
    const doClose = (origin: string) => {
        if (open.value) {
            if (minimized.value) {
                restore();
            }
            open.set(false);
            (props.onclose as ((origin: string) => void) | undefined)?.(origin);
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
    });

    // ---- minimize docking (v5 taskbar behavior)
    const minimize = () => {
        if (!root || minimized.value) {
            return;
        }
        // Remember the EFFECTIVE position (margins consolidated — v5
        // removeMargin) and exact dimensions: restore must return the
        // modal precisely as it looked
        const rect = root.getBoundingClientRect();
        restoreTo = { top: rect.top, left: rect.left };
        if (rect.width && !size.value.w) {
            size.value = { w: rect.width, h: rect.height };
        }
        // Consolidate before docking so the bar animates from where the
        // modal visually is, not from a pre-margin position
        pos.value = { top: rect.top, left: rect.left, fixed: true };
        minimized.value = true;
        dock.push({
            el: root,
            place: (top, left) => {
                pos.value = { top, left, fixed: true };
            },
        });
        refreshDock();
    };
    const restore = () => {
        if (!root || !minimized.value) {
            return;
        }
        const i = dock.findIndex((entry) => entry.el === root);
        if (i >= 0) {
            dock.splice(i, 1);
        }
        minimized.value = false;
        pos.value = { top: restoreTo.top, left: restoreTo.left, fixed: true };
        refreshDock();
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
        if (!props.autoadjust!.value) {
            return;
        }
        el.style.marginLeft = '';
        el.style.marginTop = '';
        const { dx, dy } = overflow(el.getBoundingClientRect());
        if (dx) {
            el.style.marginLeft = dx + 'px';
        }
        if (dy) {
            el.style.marginTop = dy + 'px';
        }
    };

    /** On drag release: nudge the position itself back into the viewport */
    const adjustPosition = () => {
        if (!props.autoadjust!.value || !root) {
            return;
        }
        const { dx, dy } = overflow(root.getBoundingClientRect());
        if (dx || dy) {
            pos.value = { top: pos.value.top + dy, left: pos.value.left + dx, fixed: true };
        }
    };

    // ---- per-open setup (v5 onload behavior)
    // Always deferred one microtask: on first open the branch builds
    // detached and attaches right after; measurements need layout.
    let pendingSetup = false;
    const scheduleSetup = () => {
        if (pendingSetup) {
            return;
        }
        pendingSetup = true;
        queueMicrotask(() => {
            pendingSetup = false;
            if (root && root.isConnected && open.value) {
                setup();
            }
        });
    };

    const onOpened = (el: Element) => {
        root = el as HTMLElement;
        scheduleSetup();
    };

    // Reopen reuses the cached branch — refs do NOT re-fire, so setup is
    // re-armed by watching the open state itself (api, bind or backdrop)
    onMount(() => open.subscribe((v) => v && scheduleSetup()));

    // position is live while open (v5 reactive properties): drop the
    // explicit coordinates and re-place under the new positioning model
    onMount(() =>
        props.position!.subscribe(() => {
            if (open.value && root) {
                pos.value = { top: props.top!.value as number, left: props.left!.value as number, fixed: false };
                scheduleSetup();
            }
        })
    );

    const setup = () => {
        const el = root!;
        const p = props.position!.value as string;
        if (props.layers!.value) {
            front();
        }
        if (!props.fullscreen!.value && p !== 'left' && p !== 'right' && p !== 'bottom') {
            // Explicit coordinates: measure, then center unless given (v5)
            let w = (size.value.w as number) || root.offsetWidth;
            let h = (size.value.h as number) || root.offsetHeight;
            if (w && !size.value.w) {
                size.value = { w, h: size.value.h };
            }
            if (h && !size.value.h) {
                size.value = { w: size.value.w, h };
            }
            if (p === 'absolute') {
                pos.value = { ...pos.value, fixed: true };
            } else {
                const top = props.top!.value || Math.max(0, (window.innerHeight - h) / 2);
                const left = props.left!.value || Math.max(0, (window.innerWidth - w) / 2);
                pos.value = { top, left, fixed: true };
            }
            // v5 responsive: small screens promote tall modals to fullscreen
            if (props.responsive!.value && document.documentElement.clientWidth < 800 && h > 300) {
                root.classList.add('lm-modal-fullscreen');
            }
        }
        autoAdjust(root);
        if (props.minimized!.value && !minimized.value) {
            minimize();
        }
        if (props.focus!.value) {
            root.focus();
        }
        if (props.url!.value && remote.value === null && typeof fetch === 'function') {
            fetch(props.url!.value as string)
                .then((r) => r.text())
                .then((text) => (remote.value = unsafe(text)));
        }
    };

    // ---- pointer interactions: v5 hit-testing on the modal itself
    const cursorFor = (e: MouseEvent): string => {
        if (!root || minimized.value || props.fullscreen!.value) {
            return '';
        }
        const rect = root.getBoundingClientRect();
        if (props.resizable!.value) {
            const dir = hitResize(rect, e.clientX, e.clientY);
            if (dir) {
                return dir + '-resize';
            }
        }
        if (props.draggable!.value && e.clientY - rect.top < BAR) {
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
                (props.onmove as ((top: number, left: number) => void) | undefined)?.(
                    pos.value.top,
                    pos.value.left
                );
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
                size.value = { w, h };
                if (dir.includes('w') || dir.includes('n')) {
                    pos.value = { top: t, left: l, fixed: true };
                }
            },
            () => {
                (props.onresize as ((w: number, h: number) => void) | undefined)?.(
                    size.value.w as number,
                    size.value.h as number
                );
            }
        );
    };

    const onPress = (e: MouseEvent) => {
        if (props.layers!.value) {
            front();
        }
        if (!root || minimized.value || props.fullscreen!.value) {
            return;
        }
        const rect = root.getBoundingClientRect();
        if (props.resizable!.value) {
            const dir = hitResize(rect, e.clientX, e.clientY);
            if (dir) {
                e.preventDefault();
                startResize(e, rect, dir);
                return;
            }
        }
        if (props.draggable!.value && e.clientY - rect.top < BAR && !(e.target as Element).closest('button')) {
            e.preventDefault();
            startDrag(e, rect);
        }
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && props.closable!.value && open.value) {
            doClose('escape');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };

    const styles = () => {
        const parts: string[] = [];
        if (props.fullscreen!.value) {
            return '';
        }
        const p = pos.value;
        const s = size.value;
        if (p.fixed) {
            // One source of truth for top/left — open, dragged or docked
            parts.push('position:fixed', 'top:' + p.top + 'px', 'left:' + p.left + 'px', 'margin:0');
        }
        if (s.w && !minimized.value) {
            parts.push('width:' + s.w + 'px');
        }
        if (s.h && !minimized.value) {
            parts.push('height:' + s.h + 'px');
        }
        if (layer.value) {
            parts.push('z-index:' + layer.value);
        }
        return parts.join(';');
    };

    return html`${() =>
        open.value &&
        html`<div class="lm-modal-root" data-position="${() => props.position!.value || false}">
            ${() =>
                props.backdrop!.value && !minimized.value &&
                html`<div class="lm-modal-backdrop" onclick="${() => props.closable!.value && doClose('backdrop')}"></div>`}
            <div class="lm-modal ${() => (minimized.value ? 'lm-modal-minimized' : '')} ${() =>
                props.fullscreen!.value ? 'lm-modal-fullscreen' : ''} ${() =>
                props.overflow!.value ? 'lm-modal-overflow' : ''}"
                style="${styles}"
                tabindex="-1"
                ref="${(el: Element) => onOpened(el)}"
                onmousemove="${onHover}"
                onmousedown="${onPress}"
                onkeydown="${onKey}"
                onfocusin="${() => root?.classList.add('lm-modal-focus')}"
                onfocusout="${(e: FocusEvent) => {
                    if (root && !root.contains(e.relatedTarget as Node)) {
                        root.classList.remove('lm-modal-focus');
                        if (props.autoclose!.value) {
                            doClose('focusout');
                        }
                    }
                }}">
                ${() =>
                    props.header!.value &&
                    html`<header class="lm-modal-header"
                        onclick="${() => minimized.value && restore()}">
                        <span class="lm-modal-title">${props.title}</span>
                        <span class="lm-modal-controls">
                            ${() =>
                                props.minimizable!.value &&
                                html`<button class="lm-modal-minimize" title="${() =>
                                    minimized.value ? 'Restore' : 'Minimize'}"
                                    onclick="${(e: MouseEvent) => {
                                        e.stopPropagation();
                                        if (minimized.value) {
                                            restore();
                                        } else {
                                            minimize();
                                        }
                                    }}">${() => (minimized.value ? '□' : '–')}</button>`}
                            ${() =>
                                props.closable!.value &&
                                html`<button class="lm-modal-close" onclick="${() => doClose('button')}">×</button>`}
                        </span>
                    </header>`}
                <div class="lm-modal-content">${props.children}${() => remote.value}</div>
            </div>
        </div>`}`;
});

export default Modal;
