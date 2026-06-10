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
import { type ContextItem } from '@lemonadejs/contextmenu';
export interface TopmenuItem {
    title: string;
    disabled?: boolean;
    submenu?: ContextItem[];
}
export declare const Topmenu: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    options: ArrayConstructor;
    api: {
        open: FunctionConstructor;
        close: FunctionConstructor;
    };
}>>;
export default Topmenu;
