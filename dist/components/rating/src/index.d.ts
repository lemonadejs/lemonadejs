/**
 * <Rating /> — LemonadeJS v6 block
 *
 * Full behavioral parity with the v5 rating plugin: a row of stars where
 * clicking star N sets the value to N, clicking the current value again
 * resets it to 0, hovering previews the would-be selection, `number`
 * controls the star count (shrinking it clamps the value, v5 behavior),
 * `tooltip` provides per-star titles (comma-separated), `name` and `size`
 * pass through as in v5. Plus MUI-inspired additions the v5 plugin lacked:
 * disabled, readonly and color variants.
 *
 * bind vs value (the Switch convention):
 *   bind="${state}"  the live two-way rating (wins when present)
 *   value            the INITIAL rating when unbound
 */
export declare const Rating: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: NumberConstructor;
    value: number;
    number: number;
    tooltip: string;
    name: string;
    size: string;
    color: string;
    disabled: boolean;
    readonly: boolean;
    onchange: FunctionConstructor;
    api: {
        getValue: FunctionConstructor;
        setValue: FunctionConstructor;
    };
}>>;
export default Rating;
