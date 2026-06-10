/**
 * <Signature /> — canvas signature pad, ported from the v5 plugin
 *
 * Full behavioral parity with v5: pointer drawing (mouse + touch), the v5
 * value format (a flat list of [x, y] points with '1' separators between
 * strokes), line thickness, instructions text, disabled, and the full
 * replay algorithm (commit): clear + redraw the whole value as one path —
 * including the v5 quirk where a click stroke becomes a round dot.
 *
 * v5 → v6 mapping: value (two-way) → bind; value (initial) stays value;
 * line/width/height/instructions/disabled unchanged; onchange/onload
 * unchanged (onchange now receives the value, not the instance);
 * getValue/setValue/getImage move to the api surface (props.ref), plus
 * clear() = setValue([]). New: color (v5 hardcoded #000) and name (renders
 * a hidden input so the pad participates in forms — v5 only patched .val()
 * onto the canvas).
 *
 * jsdom has no canvas: a null 2d context downgrades the pad to a no-op.
 */
export declare const Signature: import("lemonadejs").Component<import("lemonadejs").ContractInput<{
    bind: ArrayConstructor;
    value: ArrayConstructor;
    width: number;
    height: number;
    line: number;
    color: string;
    name: string;
    instructions: string;
    disabled: boolean;
    onchange: FunctionConstructor;
    onload: FunctionConstructor;
    api: {
        getValue: FunctionConstructor;
        setValue: FunctionConstructor;
        getImage: FunctionConstructor;
        clear: FunctionConstructor;
    };
}>>;
export default Signature;
