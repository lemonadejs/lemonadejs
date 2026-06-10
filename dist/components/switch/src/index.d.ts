/**
 * <Switch /> — the canonical LemonadeJS v6 block
 *
 * Full property parity with the v5 plugin (label as text, checked, color, name,
 * disabled, position) plus the best of MUI's Switch (size, required,
 * value) on the v6 contract model. Built on a real
 * <input type="checkbox">: native form participation, native disabled
 * semantics, native keyboard accessibility.
 *
 * bind vs checked vs value (closer, but different — by design):
 *   bind="${state}"  the live two-way state (wins when present)
 *   checked          the INITIAL state when unbound
 *   value            the string submitted with the form when on (DOM semantics)
 */
export declare const Switch: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: BooleanConstructor;
    checked: boolean;
    label: string;
    color: string;
    size: string;
    name: string;
    value: string;
    required: boolean;
    disabled: boolean;
    position: string;
    onchange: FunctionConstructor;
    api: {
        toggle: FunctionConstructor;
    };
}>>;
export default Switch;
