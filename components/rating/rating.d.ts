/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface RatingApi {
    getValue: (...args: unknown[]) => unknown;
    setValue: (...args: unknown[]) => unknown;
}

export interface RatingProps extends Bindable<number> {
    value?: State<number> | number;
    number?: State<number> | number;
    tooltip?: State<string> | string;
    name?: State<string> | string;
    size?: State<string> | string;
    color?: State<string> | string;
    disabled?: State<boolean> | boolean;
    readonly?: State<boolean> | boolean;
    ref?: (api: RatingApi) => void;
}

export declare const Rating: Component<RatingProps>;
export default Rating;
