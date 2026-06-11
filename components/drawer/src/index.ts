/**
 * <Drawer /> — a side panel sliding from an edge, MUI-inspired, built ON
 * the Modal primitive: position left/right are already full-viewport-height
 * side panels and bottom is the sheet mode, so the drawer is a thin
 * composition — anchor mapping, its own header chrome and the slide-in
 * animation (CSS keyframes scoped by data-anchor on the wrapper).
 *
 * Contract:
 *   bind      two-way open state (named `visible` internally — assignment
 *             through the bound chain is SILENT, no onopen/onclose echo)
 *   anchor    '' = left | 'right' | 'bottom' — live while open (Modal's
 *             position prop is reactive)
 *   width     panel width in px (left/right; bottom is full width via CSS)
 *   backdrop  dimmed overlay behind the panel
 *   closable  backdrop click + Escape close the drawer
 *   title     optional header row with a close ×
 *
 * onclose(origin): 'button' | 'backdrop' | 'escape' | 'api'.
 */

import { component, html } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

/** anchor → Modal position ('' means left, the MUI default) */
const toPosition = (anchor: unknown): string =>
    anchor === 'right' || anchor === 'bottom' ? (anchor as string) : 'left';

export const Drawer = component('drawer', {
    bind: Boolean,                // two-way open state
    anchor: '',                   // '' = left | right | bottom
    width: 280,                   // panel width px (left/right)
    backdrop: true,               // dimmed overlay
    closable: true,               // backdrop click + Escape close
    title: '',                    // optional header row with a close ×
    onopen: Function,
    onclose: Function,            // (origin)
    api: { open: Function, close: Function, toggle: Function },
}, (props, { bind, state, onMount }) => {
    const visible = bind(props, false);

    // The anchor-mapped Modal position — a STATE so anchor changes are
    // live while open (Modal re-places under the new positioning model).
    // peek: setup-time reads must not subscribe (and must stay out of the
    // LJS-202 snapshot heuristic — header="${false}" is a primitive slot)
    const position = state(toPosition(props.anchor.peek()));
    onMount(() => props.anchor.subscribe(() => (position.value = toPosition(props.anchor.value))));

    // Drawer-initiated transitions go through the bound chain (assignment
    // is silent to the Modal underneath) and fire the drawer's own events;
    // Modal-initiated closes (backdrop, Escape) arrive via Modal's onclose
    const doOpen = () => {
        if (!visible.value) {
            visible.value = true;
            props.onopen?.();
        }
    };
    const doClose = (origin: string) => {
        if (visible.value) {
            visible.value = false;
            props.onclose?.(origin);
        }
    };

    props.ref?.({
        open: doOpen,
        close: () => doClose('api'),
        toggle: () => (visible.value ? doClose('api') : doOpen()),
    });

    return html`<div class="lm-drawer" data-anchor="${position}">
        <${Modal} bind="${visible}" header="${false}"
            position="${position}"
            width="${props.width}"
            backdrop="${props.backdrop}"
            closable="${props.closable}"
            onclose="${(origin: string) => props.onclose?.(origin)}">
            ${() =>
                props.title.value &&
                html`<header class="lm-drawer-header">
                    <span class="lm-drawer-title">${props.title}</span>
                    <button class="lm-drawer-close" onclick="${() => doClose('button')}">×</button>
                </header>`}
            <div class="lm-drawer-body">${props.children}</div>
        </${Modal}>
    </div>`;
});

export default Drawer;
