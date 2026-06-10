/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface ToggleApi {
    toggle: (...args: unknown[]) => unknown;
}

export interface ToggleProps extends Bindable<boolean> {
    checked?: State<boolean> | boolean;
    text?: State<string> | string;
    icon?: State<string> | string;
    name?: State<string> | string;
    disabled?: State<boolean> | boolean;
    ref?: (api: ToggleApi) => void;
}

export declare const Toggle: Component<ToggleProps>;
export default Toggle;
