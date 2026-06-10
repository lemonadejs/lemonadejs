/**
 * <Color /> — color picker on the Modal primitive (v5 architecture).
 *
 * Faithful port of @lemonadejs/color: a Grid tab (the material palette
 * matrix, custom palettes supported, the picked cell marked with a
 * checkmark) and a Spectrum tab (canvas gradient, drag to sample pixels),
 * Reset/Done bar, popup built ON Modal exactly as v5 built on
 * @lemonadejs/modal (headerless, absolute, auto-adjust, no focus steal),
 * optional text input toggle with the full v5 keyboard system
 * (ArrowUp/Down opens, Enter commits, Escape closes) and focusout close.
 *
 * v5 → v6 mapping: value → bind; closeOnChange → closeonchange;
 * input: 'auto' → type="input" (the block renders its own input — adopting
 * an external element was dropped, incompatible with by-value blocks);
 * type: 'inline' keeps its meaning (panel without a popup, selection
 * commits immediately since the Done bar is a popup affordance);
 * @lemonadejs/tabs → internal lm-color-tabs strip (no Tabs block in v6).
 * onclose(origin): 'select' | 'button' | 'escape' | 'focusout' | 'api'.
 */
export declare const Color: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: StringConstructor;
    palette: ArrayConstructor;
    type: string;
    placeholder: string;
    closeonchange: boolean;
    onopen: FunctionConstructor;
    onclose: FunctionConstructor;
    onchange: FunctionConstructor;
    api: {
        open: FunctionConstructor;
        close: FunctionConstructor;
        isClosed: FunctionConstructor;
        reset: FunctionConstructor;
        setValue: FunctionConstructor;
        getValue: FunctionConstructor;
    };
}>>;
export default Color;
