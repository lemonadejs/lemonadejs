/**
 * <Tabs /> — full behavioral parity with the v5 plugin.
 *
 * The v5 model, ported faithfully:
 *   - tabs come from a data array ({ title, content?, icon?, el?, selected? })
 *     AND/OR element children: each child element becomes a tab, with
 *     title / selected / data-icon extracted from its attributes
 *   - every tab owns ONE panel element created once and KEPT ALIVE across
 *     switches (visibility is a class + CSS, never an unmount) — exactly
 *     v5, where panels were real elements toggling a selected class
 *   - selected index, position (center | bottom), round borders,
 *     allowcreate ("add" button creating an Untitled tab)
 *   - drag-and-drop header sorting (reorders the data, selects the moved
 *     tab, fires onchangeposition) — simplified to reorder-on-drop, v5
 *     live-previewed during dragover by mutating DOM the engine now owns
 *   - keyboard: Enter selects, Arrow keys move focus (focus opens, v5's
 *     onfocusin behavior)
 *
 * v5 → v6 mapping: selected → bind (live two-way) with selected as the
 * initial index when unbound; allowCreate → allowcreate (contract props
 * are lowercase: they become HTML attributes); events drop the v5
 * `instance` argument: onchange(index, oldIndex), onopen(index),
 * onbeforecreate(item, position) (return false cancels),
 * oncreate(item, position), onchangeposition(fromIndex, toIndex).
 * api: open(index), create(item, position?, select?).
 */
export interface TabItem {
    /** Tab header text */
    title?: string;
    /** Material icon keyword shown above the title */
    icon?: string;
    /** Trusted HTML for the panel (v5: set as innerHTML, once) */
    content?: string;
    /** An existing element used as the panel */
    el?: HTMLElement;
    /** Marks this tab as the initially selected one */
    selected?: boolean;
}
export declare const Tabs: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    data: ArrayConstructor;
    bind: NumberConstructor;
    selected: number;
    position: string;
    round: boolean;
    allowcreate: boolean;
    onchange: FunctionConstructor;
    onopen: FunctionConstructor;
    onbeforecreate: FunctionConstructor;
    oncreate: FunctionConstructor;
    onchangeposition: FunctionConstructor;
    api: {
        open: FunctionConstructor;
        create: FunctionConstructor;
    };
}>>;
export default Tabs;
