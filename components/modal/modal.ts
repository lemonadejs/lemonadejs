/**
 * <Modal /> — full v5 property parity on the v6 contract model, plus
 * MUI Dialog's fullscreen.
 *
 * v5 → v6 mapping: closed → bind (inverted: bind is the OPEN state, the
 * controlled prop); auto-close → autoclose; auto-adjust → autoadjust;
 * content: HTMLElement → children.
 *
 * onclose receives the origin: 'button' | 'backdrop' | 'escape' |
 * 'focusout' | 'api' — exactly the v5 reasons.
 */

import { component, html, unsafe } from '../../src/index';

/** Shared z-index counter for layers mode */
let layerIndex = 100;

export const Modal = component('modal', {
    bind: Boolean,                // open state (v5: closed, inverted)
    title: '',                    // header title
    width: 0,                     // px; 0 = auto
    height: 0,                    // px; 0 = auto
    top: 0,                       // px, for position=absolute
    left: 0,                      // px, for position=absolute
    position: '',                 // center | left | right | bottom | absolute
    backdrop: false,              // dim the page behind
    closable: false,              // × button + Escape
    draggable: false,             // move by the header
    resizable: false,             // resize by the corner handle
    minimizable: false,           // – button collapses to the header
    minimized: false,             // initial minimized state
    fullscreen: false,            // MUI: cover the viewport
    autoclose: false,             // close when focus leaves (v5: auto-close)
    autoadjust: false,            // clamp into the viewport on open (v5: auto-adjust)
    focus: true,                  // focus the modal when opened
    overflow: false,              // scroll content larger than the modal
    responsive: true,             // small screens: full width (CSS)
    layers: false,                // bring to front on mousedown
    url: '',                      // load remote content on first open
    onopen: Function,
    onclose: Function,            // (origin) => void
    onmove: Function,             // (x, y) => void
    onresize: Function,           // (w, h) => void
    api: { open: Function, close: Function, toggle: Function, front: Function, back: Function },
}, (props, { bind, state, onMount, onUnmount }) => {
    const open = bind(props, false);
    const minimized = state(props.minimized!.value as boolean);
    const moved = state({ top: props.top!.value as number, left: props.left!.value as number, dragged: false });
    const sized = state({ w: props.width!.value as number, h: props.height!.value as number });
    const layer = state(0);
    const remote = state<Node[] | null>(null);

    let root: HTMLElement | null = null;

    // One in-flight interaction at a time; ONE cleanup registered at setup
    // (never per-drag — that would accumulate closures on every interaction)
    let releaseInteraction: (() => void) | null = null;

    onUnmount(() => releaseInteraction?.());

    const track = (move: (e: MouseEvent) => void) => {
        releaseInteraction?.();
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            releaseInteraction = null;
        };
        releaseInteraction = up;
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    const doOpen = () => {
        if (!open.value) {
            open.set(true);
            (props.onopen as (() => void) | undefined)?.();
        }
    };

    const doClose = (origin: string) => {
        if (open.value) {
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

    // Escape closes when closable
    const onkey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open.value && props.closable!.value) {
            doClose('escape');
        }
    };

    onMount(() => {
        document.addEventListener('keydown', onkey);
        return () => document.removeEventListener('keydown', onkey);
    });

    // Per-open behaviors: focus, autoadjust, remote content
    const onOpened = (el: Element) => {
        root = el as HTMLElement;
        if (props.layers!.value) {
            front();
        }
        if (props.autoadjust!.value && moved.value.dragged === false && props.position!.value === 'absolute') {
            const w = (sized.value.w as number) || el.clientWidth;
            const h = (sized.value.h as number) || el.clientHeight;
            moved.value = {
                top: Math.max(0, Math.min(moved.value.top, window.innerHeight - h)),
                left: Math.max(0, Math.min(moved.value.left, window.innerWidth - w)),
                dragged: moved.value.dragged,
            };
        }
        if (props.focus!.value) {
            (el as HTMLElement).focus();
        }
        if (props.url!.value && remote.value === null && typeof fetch === 'function') {
            fetch(props.url!.value as string)
                .then((r) => r.text())
                .then((text) => (remote.value = unsafe(text)));
        }
    };

    // Drag by the header
    const dragStart = (e: MouseEvent) => {
        if (!props.draggable!.value || props.fullscreen!.value || !root) {
            return;
        }
        e.preventDefault();
        const rect = root.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        track((ev: MouseEvent) => {
            moved.value = { top: ev.clientY - offsetY, left: ev.clientX - offsetX, dragged: true };
            (props.onmove as ((x: number, y: number) => void) | undefined)?.(moved.value.left, moved.value.top);
        });
    };

    // Resize by the corner handle
    const resizeStart = (e: MouseEvent) => {
        if (!props.resizable!.value || !root) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const rect = root.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        track((ev: MouseEvent) => {
            sized.value = {
                w: Math.max(120, rect.width + (ev.clientX - startX)),
                h: Math.max(80, rect.height + (ev.clientY - startY)),
            };
            (props.onresize as ((w: number, h: number) => void) | undefined)?.(sized.value.w, sized.value.h);
        });
    };

    const styles = () => {
        const parts: string[] = [];
        if (props.fullscreen!.value) {
            return '';
        }
        const m = moved.value;
        const s = sized.value;
        if (m.dragged || props.position!.value === 'absolute') {
            parts.push('position:fixed', 'top:' + m.top + 'px', 'left:' + m.left + 'px', 'margin:0');
        }
        if (s.w) {
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
                props.backdrop!.value &&
                html`<div class="lm-modal-backdrop" onclick="${() => props.closable!.value && doClose('backdrop')}"></div>`}
            <div class="lm-modal ${() => (minimized.value ? 'lm-modal-minimized' : '')} ${() =>
                props.fullscreen!.value ? 'lm-modal-fullscreen' : ''} ${() =>
                props.responsive!.value ? 'lm-modal-responsive' : ''} ${() =>
                props.overflow!.value ? 'lm-modal-overflow' : ''}"
                style="${styles}"
                tabindex="-1"
                ref="${(el: Element) => onOpened(el)}"
                onmousedown="${() => props.layers!.value && front()}"
                onfocusout="${(e: FocusEvent) => {
                    if (props.autoclose!.value && root && !root.contains(e.relatedTarget as Node)) {
                        doClose('focusout');
                    }
                }}">
                <header class="lm-modal-header" onmousedown="${dragStart}">
                    <span class="lm-modal-title">${props.title}</span>
                    <span class="lm-modal-controls">
                        ${() =>
                            props.minimizable!.value &&
                            html`<button class="lm-modal-minimize"
                                onclick="${() => (minimized.value = !minimized.value)}">–</button>`}
                        ${() =>
                            props.closable!.value &&
                            html`<button class="lm-modal-close" onclick="${() => doClose('button')}">×</button>`}
                    </span>
                </header>
                <div class="lm-modal-content">${props.children}${() => remote.value}</div>
                ${() => props.resizable!.value && html`<span class="lm-modal-resizer" onmousedown="${resizeStart}"></span>`}
            </div>
        </div>`}`;
});

export default Modal;
