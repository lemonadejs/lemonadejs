/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface SwitchApi {
    toggle: (...args: unknown[]) => unknown;
}

export interface SwitchProps extends Bindable<boolean> {
    checked?: State<boolean> | boolean;
    label?: State<string> | string;
    color?: State<string> | string;
    size?: State<string> | string;
    name?: State<string> | string;
    value?: State<string> | string;
    required?: State<boolean> | boolean;
    disabled?: State<boolean> | boolean;
    position?: State<string> | string;
    ref?: (api: SwitchApi) => void;
}

export declare const Switch: Component<SwitchProps>;
export default Switch;
