/**
 * <Topmenu /> — a horizontal menu bar, composed ON the Contextmenu block
 * exactly like v5 (<Contextmenu :ref="self.menu" /> inside the topmenu
 * template): each top item with a submenu opens one shared Contextmenu
 * right under itself. Ported faithfully from the v5 plugin:
 *
 *   - mousedown on a titled item toggles its dropdown (same item closes,
 *     another item switches)
 *   - while the menu is open, hovering another top item moves the open
 *     dropdown to it (menubar behavior)
 *   - keyboard: ArrowLeft/ArrowRight walk enabled items (wrapping, skipping
 *     disabled); with the menu open they move the OPEN dropdown; Enter
 *     toggles. Up/Down/Enter/Escape inside the dropdown belong to the
 *     composed Contextmenu
 *   - focusin selects the focused item; focusout of the whole bar clears
 *     the selection highlight (the remembered index survives, as in v5)
 *   - full ARIA: menubar / menuitem, aria-haspopup, aria-expanded,
 *     aria-label, tabindex managed per item (disabled items unreachable)
 *
 * v5 → v6 mapping: options keeps the v5 item model ({ title, submenu,
 * disabled }; submenu items are Contextmenu items). self.open(index) →
 * api.open(index). api.close() is new — the inner Contextmenu ref is
 * private in v6, so a programmatic dismiss needs a surface.
 */

import { component, html, isDisposing } from 'lemonadejs';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

export interface TopmenuItem {
    title: string;
    disabled?: boolean;
    submenu?: ContextItem[];
}

type MenuApi = {
    open(list: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

export const Topmenu = component('topmenu', {
    options: Array,
    api: { open: Function, close: Function },
}, (props, { state }) => {
    const current = state<number | null>(null); // remembered item (v5 currentIndex)
    const selected = state(false);              // highlight on the current item
    const menuOpen = state(false);              // the shared dropdown is open

    let root: HTMLElement | null = null;
    let menu: MenuApi | null = null;

    const items = (): TopmenuItem[] => (props.options!.value as TopmenuItem[]) || [];

    const itemEl = (index: number): HTMLElement | null =>
        (root?.querySelectorAll('.lm-topmenu-title')[index] as HTMLElement) || null;

    /** v5 cursor search: next enabled item in a direction, wrapping */
    const findEnabled = (start: number, forward: boolean): number | null => {
        const list = items();
        let index = start;
        for (let attempts = 0; attempts < list.length; attempts++) {
            if (forward && index >= list.length) {
                index = 0;
            }
            if (!forward && index < 0) {
                index = list.length - 1;
            }
            if (list[index] && !list[index].disabled) {
                return index;
            }
            index = forward ? index + 1 : index - 1;
        }
        return null;
    };

    const selectIndex = (index: number, focus = true) => {
        const item = items()[index];
        if (item && !item.disabled) {
            current.value = index;
            selected.value = true;
            // v5 focuses the bar item; while the dropdown is open the
            // Contextmenu wrapper holds focus — stealing it would close it
            if (focus && !menuOpen.value) {
                itemEl(index)?.focus();
            }
        }
    };

    const open = (index: number) => {
        selectIndex(index);
        const at = current.value;
        const item = at === null ? undefined : items()[at];
        if (item && item.submenu) {
            // v5: right under the item (+2px); viewport coords, the same
            // convention the Contextmenu itself uses
            const rect = itemEl(at as number)?.getBoundingClientRect();
            menu?.open(item.submenu, rect ? rect.left : 0, rect ? rect.bottom + 2 : 0);
        }
    };

    const close = () => {
        menu?.close();
        if (current.value !== null) {
            itemEl(current.value)?.focus(); // v5: focus returns to the item
        }
    };

    const cancel = (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
    };

    const toggle = (e: Event, index: number) => {
        const item = items()[index];
        if (item && item.submenu && !item.disabled) {
            if (index === current.value && menuOpen.value) {
                close();
            } else {
                open(index);
            }
            // v5 cancel: no focus steal, and the Contextmenu's own
            // outside-mousedown closer never sees this event
            cancel(e);
        }
    };

    /** v5: while open, hovering another top item moves the dropdown */
    const hoverMove = (index: number) => {
        if (menuOpen.value && index !== current.value) {
            open(index);
        }
    };

    const onKey = (e: KeyboardEvent) => {
        // Up/Down/Enter/Escape inside the open dropdown are consumed by the
        // Contextmenu; only unhandled keys bubble here (v5 architecture)
        const at = current.value ?? 0;
        let target: number | null = null;
        if (e.key === 'Enter') {
            if (current.value !== null) {
                toggle(e, current.value);
            }
        } else if (e.key === 'ArrowLeft') {
            target = findEnabled(at - 1, false);
        } else if (e.key === 'ArrowRight') {
            target = findEnabled(at + 1, true);
        }
        if (target !== null) {
            if (menuOpen.value) {
                open(target);
            } else {
                selectIndex(target);
            }
        }
    };

    const onFocusIn = (e: FocusEvent) => {
        const list = root ? [...root.querySelectorAll('.lm-topmenu-title')] : [];
        const index = list.indexOf(e.target as HTMLElement);
        if (index !== -1) {
            selectIndex(index, false); // already focused — just select
        }
    };

    const onFocusOut = (e: FocusEvent) => {
        if (isDisposing()) {
            return; // renderer-caused blur (menu level disposal)
        }
        if (!(e.relatedTarget && root?.contains(e.relatedTarget as Node))) {
            selected.value = false; // v5: clear the highlight, keep the index
        }
    };

    props.ref?.({
        /** Open a submenu programmatically. Default 0 (v5 signature) */
        open: (index?: number) => {
            let target = typeof index === 'undefined' ? current.value : index;
            if (!target) {
                target = 0;
            }
            if (items()[target]) {
                open(target);
            }
        },
        close: () => menu?.close(),
    });

    const itemView = (item: TopmenuItem, index: number) =>
        html`<div class="lm-topmenu-title" role="menuitem"
            data-disabled="${item.disabled ? 'true' : false}"
            data-selected="${() => (selected.value && current.value === index ? 'true' : false)}"
            tabindex="${item.disabled ? false : '0'}"
            aria-haspopup="${item.submenu ? 'true' : 'false'}"
            aria-expanded="${() => (menuOpen.value && current.value === index ? 'true' : 'false')}"
            aria-label="${item.title}"
            onmousedown="${(e: MouseEvent) => toggle(e, index)}"
            onmouseenter="${() => hoverMove(index)}">${item.title}</div>`;

    return html`<div class="lm-topmenu" role="menubar" aria-orientation="horizontal"
        ref="${(el: Element) => (root = el as HTMLElement)}"
        oncontextmenu="${cancel}"
        onfocusin="${onFocusIn}"
        onfocusout="${onFocusOut}"
        onkeydown="${onKey}">
        <div class="lm-topmenu-options">${() => items().map((item, i) => itemView(item, i))}</div>
        <${Contextmenu} ref="${(a: MenuApi) => (menu = a)}"
            onopen="${() => (menuOpen.value = true)}"
            onclose="${() => (menuOpen.value = false)}" />
    </div>`;
});

export default Topmenu;
