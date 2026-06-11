/**
 * <Tooltip /> — a MUI-inspired floating label for any element.
 *
 * Wraps its children and shows a small dark pill on hover/focus of the
 * wrapper; hides on leave/blur/Escape. Self-contained on purpose: a
 * tooltip is too small to compose <Modal /> — no chrome, no drag, no
 * focus management, just one branch and four coordinates.
 *
 *   <${Tooltip} title="Save your work" position="top">
 *       <button>Save</button>
 *   </${Tooltip}>
 *
 * Placement: the popper is position:fixed, its coordinates computed from
 * the wrapper's getBoundingClientRect at show time. When the requested
 * side would leave the viewport the popper FLIPS to the opposite side
 * (the modal's autoadjust idea, specialized to four sides) — the
 * effective side is published as data-position so the arrow follows.
 */

import { component, html } from 'lemonadejs';

const GAP = 8; // distance between the wrapper and the popper

const SIDES = ['top', 'bottom', 'left', 'right'];

export const Tooltip = component('tooltip', {
    title: '',                    // the tooltip text (live)
    position: '',                 // '' = top | bottom | left | right
    delay: 100,                   // ms before showing
    arrow: true,                  // small arrow pointing at the wrapper
    disabled: false,              // never shows
    onopen: Function,             // fires when the popper appears
    onclose: Function,            // fires when a visible popper hides
}, (props, { state, onMount, onUnmount }) => {
    const open = state(false);
    const side = state('top');    // EFFECTIVE side, after flipping
    const pos = state({ top: 0, left: 0 });

    let wrapper: HTMLElement | null = null;
    let popper: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearPending = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };
    // destroy-clean: an unmount mid-delay must leave no timer behind
    onUnmount(clearPending);

    // ---- placement: wrapper rect → fixed coordinates, flip on overflow
    const place = () => {
        if (!wrapper || !popper || !open.value) {
            return;
        }
        const r = wrapper.getBoundingClientRect();
        const w = popper.offsetWidth;
        const h = popper.offsetHeight;
        let s = props.position!.value as string;
        if (SIDES.indexOf(s) < 0) {
            s = 'top';
        }
        // Overflow check (the modal's autoadjust, reduced to one axis):
        // a side that would leave the viewport flips to its opposite
        if (s === 'top' && r.top - GAP - h < 0) {
            s = 'bottom';
        } else if (s === 'bottom' && r.bottom + GAP + h > window.innerHeight) {
            s = 'top';
        } else if (s === 'left' && r.left - GAP - w < 0) {
            s = 'right';
        } else if (s === 'right' && r.right + GAP + w > window.innerWidth) {
            s = 'left';
        }
        let top: number;
        let left: number;
        if (s === 'top' || s === 'bottom') {
            top = s === 'top' ? r.top - GAP - h : r.bottom + GAP;
            left = r.left + r.width / 2 - w / 2;
        } else {
            top = r.top + r.height / 2 - h / 2;
            left = s === 'left' ? r.left - GAP - w : r.right + GAP;
        }
        side.value = s;
        pos.value = { top, left };
    };

    // Deferred one microtask: on first open the branch builds detached and
    // attaches right after — measuring the popper needs layout. Reopen
    // reuses the cached branch (refs do NOT re-fire), so placement is also
    // re-armed by the open state itself.
    let pending = false;
    const schedulePlace = () => {
        if (pending) {
            return;
        }
        pending = true;
        queueMicrotask(() => {
            pending = false;
            place();
        });
    };

    onMount(() => open.subscribe((v) => v && schedulePlace()));
    // position is live while open
    onMount(() => props.position!.subscribe(() => open.value && schedulePlace()));

    // ---- show/hide
    const show = () => {
        if (props.disabled!.value || open.value || timer !== null) {
            return;
        }
        timer = setTimeout(() => {
            timer = null;
            open.value = true;
            (props.onopen as (() => void) | undefined)?.();
        }, props.delay!.value as number);
    };

    const hide = () => {
        clearPending(); // leaving mid-delay cancels the pending show
        if (open.value) {
            open.value = false;
            (props.onclose as (() => void) | undefined)?.();
        }
    };

    return html`<span class="lm-tooltip"
        ref="${(el: Element) => (wrapper = el as HTMLElement)}"
        onmouseenter="${show}"
        onmouseleave="${hide}"
        onfocusin="${show}"
        onfocusout="${(e: FocusEvent) => {
            // Focus moving WITHIN the children keeps the tooltip up
            if (!wrapper || !wrapper.contains(e.relatedTarget as Node)) {
                hide();
            }
        }}"
        onkeydown="${(e: KeyboardEvent) => e.key === 'Escape' && hide()}">${props.children}${() =>
        open.value &&
        html`<span class="lm-tooltip-popper ${() => (props.arrow!.value ? 'lm-tooltip-arrow' : '')}"
            role="tooltip"
            data-position="${() => side.value}"
            style="${() => 'position:fixed;top:' + pos.value.top + 'px;left:' + pos.value.left + 'px'}"
            ref="${(el: Element) => {
                popper = el as HTMLElement;
                schedulePlace();
            }}">${props.title}</span>`}</span>`;
});

export default Tooltip;
