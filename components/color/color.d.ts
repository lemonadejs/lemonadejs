/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface ColorApi {
    open: (...args: unknown[]) => unknown;
    close: (...args: unknown[]) => unknown;
    isClosed: (...args: unknown[]) => unknown;
    reset: (...args: unknown[]) => unknown;
    setValue: (...args: unknown[]) => unknown;
    getValue: (...args: unknown[]) => unknown;
}

export interface ColorProps extends Bindable<string> {
    palette?: State<unknown[]> | unknown[];
    type?: State<string> | string;
    placeholder?: State<string> | string;
    closeonchange?: State<boolean> | boolean;
    onopen?: (...args: unknown[]) => void;
    onclose?: (...args: unknown[]) => void;
    ref?: (api: ColorApi) => void;
}

export declare const Color: Component<ColorProps>;
export default Color;
