/**
 * <Contextmenu /> — built ON the Modal primitive, exactly like v5:
 * every menu level is a headerless, auto-adjusting Modal. Submenus flip
 * horizontally when out of space (inheriting the parent's direction),
 * correct vertical overflow, open on a 200ms hover delay — and the full
 * v5 keyboard system: ArrowUp/Down cursor skipping disabled items and
 * separators with wrap-around, ArrowRight into a submenu (cursor on its
 * first enabled item), ArrowLeft back out, Enter activates, Escape
 * closes everything.
 *
 * v5 → v6 mapping: open(options, x, y) and openAt(x, y | event) keep
 * their signatures; the per-item render() DOM hook was dropped.
 */
export interface ContextItem {
    title?: string;
    icon?: string;
    shortcut?: string;
    tooltip?: string;
    disabled?: boolean;
    type?: 'line' | 'default';
    submenu?: ContextItem[];
    onclick?: (e: Event, item: ContextItem) => void;
}
export declare const Contextmenu: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    options: ArrayConstructor;
    onopen: FunctionConstructor;
    onclose: FunctionConstructor;
    api: {
        open: FunctionConstructor;
        openAt: FunctionConstructor;
        close: FunctionConstructor;
    };
}>>;
export default Contextmenu;
