/**
 * <Quickmenu /> — a compact dropdown button composed ON the Contextmenu
 * block, exactly like v5 (<Contextmenu :ref="self.menu" /> inside the
 * quickmenu template): one header that opens the options menu right under
 * itself. All three v5 triggers kept: hover (onmouseover), click and
 * right-click — the menu opens 2px below the header, and the items are
 * the full Contextmenu model (icon/shortcut/tooltip/disabled/line/submenu).
 *
 * v5 → v6 mapping: title/options/width keep their meaning — width sizes
 * the HEADER and stays live (v5's :width + onchange handler); self.open(e)
 * → api.open(). New: api.close() and onopen/onclose (the inner Contextmenu
 * ref is private in v6, so dismiss/observe need a surface), plus the
 * keyboard/ARIA surface v5 never had (focusable header, Enter/Space/
 * ArrowDown open, role=button + aria-haspopup + aria-expanded).
 */

import { component, html } from 'lemonadejs';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

export type QuickmenuItem = ContextItem;

type MenuApi = {
    open(list: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

export const Quickmenu = component('quickmenu', {
    title: '',                              // text shown in the header
    options: Array,                         // ContextItem[] — the v5 menu model
    width: 200,                             // header width in px, live (v5 :width)
    disabled: false,                        // blocks every trigger (new)
    onopen: Function,                       // fires when the menu opens
    onclose: Function,                      // fires when the menu closes
    api: { open: Function, close: Function },
}, (props, { state }) => {
    const menuOpen = state(false);

    let header: HTMLElement | null = null;
    let menu: MenuApi | null = null;

    /** v5 self.open(e): the menu 2px under the header (viewport coords —
     *  the convention the composed Contextmenu's Modals position by) */
    const open = (e?: Event) => {
        if (props.disabled.value) {
            return;
        }
        const rect = header?.getBoundingClientRect();
        menu?.open(
            (props.options.value as ContextItem[]) || [],
            rect ? rect.left : 0,
            rect ? rect.bottom + 2 : 0
        );
        // v5: cancel the trigger so nothing else reacts to it
        if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };

    // The hover trigger means the menu is usually already open when the
    // mouse presses the header; cancelling mousedown keeps the Contextmenu's
    // outside-mousedown closer from dismissing it mid-click (the v6 shape
    // of v5's stopImmediatePropagation cancel)
    const onMousedown = (e: MouseEvent) => {
        if (!props.disabled.value) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            open(e);
        }
    };

    props.ref?.({
        open: () => open(),
        close: () => menu?.close(),
    });

    return html`<div class="lm-quickmenu" data-disabled="${() => (props.disabled.value ? 'true' : false)}">
        <div class="lm-quickmenu-header" role="button"
            ref="${(el: HTMLElement) => (header = el)}"
            style="width: ${() => props.width.value}px"
            tabindex="${() => (props.disabled.value ? false : '0')}"
            aria-haspopup="true"
            aria-expanded="${() => (menuOpen.value ? 'true' : 'false')}"
            onmousedown="${onMousedown}"
            oncontextmenu="${(e: Event) => open(e)}"
            onmouseover="${(e: Event) => open(e)}"
            onclick="${(e: Event) => open(e)}"
            onkeydown="${onKey}">${props.title}</div>
        <${Contextmenu} ref="${(a: MenuApi) => (menu = a)}"
            onopen="${() => {
                menuOpen.value = true;
                props.onopen?.();
            }}"
            onclose="${() => {
                menuOpen.value = false;
                props.onclose?.();
            }}" />
    </div>`;
});

export default Quickmenu;
