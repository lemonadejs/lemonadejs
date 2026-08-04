/**
 * <Drawer /> — a side panel sliding from an edge, built ON
 * the Modal primitive: position left/right are already full-viewport-height
 * side panels and bottom is the sheet mode, so the drawer is a thin
 * composition — anchor mapping and the slide-in animation (CSS keyframes
 * scoped by data-anchor on the wrapper). The header IS Modal's own
 * (title + close button): one header implementation across the catalog.
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

/** anchor → Modal position ('' means left, the default) */
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
}, (props, { bind, computed }) => {
    const visible = bind(props, false);

    // The anchor-mapped Modal position — a pure derived value
    const position = computed(() => toPosition(props.anchor.value as string));

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

    // Modal's OWN header carries the title and the close button — one
    // header implementation for the whole catalog (same chrome, same
    // close control, same onclose('button') origin). No title, no header.
    const hasHeader = computed(() => !!(props.title.value as string));

    return html`<div class="lm-drawer" data-anchor="${position}">
        <${Modal} bind="${visible}"
            header="${hasHeader}"
            title="${props.title}"
            position="${position}"
            width="${props.width}"
            backdrop="${props.backdrop}"
            closable="${props.closable}"
            onclose="${(origin: string) => props.onclose?.(origin)}">
            <div class="lm-drawer-body">${props.children}</div>
        </${Modal}>
    </div>`;
});

export default Drawer;
