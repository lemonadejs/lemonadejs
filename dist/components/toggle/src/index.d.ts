/**
 * <Toggle /> — a pressable toggle button (LemonadeJS v6 block)
 *
 * Full behavioral parity with the v5 plugin: a single on/off button built on
 * a hidden <input type="checkbox"> with an optional material icon and text
 * label (v5 props: text, icon, value, name, disabled, onchange). Distinct
 * from <Switch />: this looks like a button that stays pressed.
 *
 * bind vs checked (the v6 split of v5's `value`):
 *   bind="${state}"  the live two-way pressed state (wins when present)
 *   checked          the INITIAL state when unbound
 */
export declare const Toggle: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: BooleanConstructor;
    checked: boolean;
    text: string;
    icon: string;
    name: string;
    disabled: boolean;
    onchange: FunctionConstructor;
    api: {
        toggle: FunctionConstructor;
    };
}>>;
export default Toggle;
