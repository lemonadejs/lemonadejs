/**
 * <Backdrop /> — a full-screen dimming overlay, modeled on MUI's
 * Backdrop on the v6 contract model.
 *
 * A fixed inset-0 layer that dims (and optionally blurs) everything
 * behind it, flex-centering whatever children the call site provides —
 * typically a progress spinner. The whole overlay is a branch on the
 * bound visibility: hidden means not in the DOM. Entry fades in via a
 * pure CSS animation.
 *
 * Visibility is the bound state (default hidden): closable clicks and
 * the api close via .set — which fires onclose — while external writes
 * to the bound state stay silent.
 *
 * opacity/zindex use 0 = "keep the CSS default" (0.5 dim, z-index
 * 1200); any other value lands as an inline style so call sites can
 * layer backdrops without touching the stylesheet.
 */

import { component, html } from 'lemonadejs';

export const Backdrop = component('backdrop', {
    bind: Boolean,                // visibility two-way (default: hidden)
    blur: false,                  // backdrop-filter blur behind the dim
    opacity: 0,                   // 0 = default 0.5; else 0-100 → rgba alpha inline
    zindex: 0,                    // 0 = CSS default 1200; else inline z-index
    closable: false,              // clicking the backdrop closes it
    onclick: Function,            // any click on the backdrop (always fires)
    onclose: Function,            // fires when the backdrop closes itself
    api: { open: Function, close: Function, toggle: Function },
}, (props, { bind }) => {
    const visible = bind(props, false);

    const open = () => {
        visible.value = true; // programmatic show: silent
    };

    const close = () => {
        if (visible.value) {
            visible.set(false);
            props.onclose?.();
        }
    };

    const click = (e: MouseEvent) => {
        props.onclick?.(e);
        if (props.closable.value) {
            close();
        }
    };

    props.ref?.({
        open,
        close,
        toggle: () => (visible.value ? close() : open()),
    });

    // 0 = stylesheet defaults; anything else becomes an inline override
    const style = () => {
        const parts: string[] = [];
        const dim = Number(props.opacity.value);
        if (dim) {
            const alpha = Math.min(100, Math.max(0, dim)) / 100;
            parts.push('background-color: rgba(0, 0, 0, ' + alpha + ')');
        }
        const z = Number(props.zindex.value);
        if (z) {
            parts.push('z-index: ' + z);
        }
        return parts.length ? parts.join('; ') : false;
    };

    return html`${() =>
        visible.value &&
        html`<div class="lm-backdrop"
            data-blur="${() => (props.blur.value === true ? 'true' : false)}"
            style="${style}"
            onclick="${click}">${props.children}</div>`}`;
});

export default Backdrop;
