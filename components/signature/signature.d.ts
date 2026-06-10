/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface SignatureApi {
    getValue: (...args: unknown[]) => unknown;
    setValue: (...args: unknown[]) => unknown;
    getImage: (...args: unknown[]) => unknown;
    clear: (...args: unknown[]) => unknown;
}

export interface SignatureProps extends Bindable<unknown[]> {
    value?: State<unknown[]> | unknown[];
    width?: State<number> | number;
    height?: State<number> | number;
    line?: State<number> | number;
    color?: State<string> | string;
    name?: State<string> | string;
    instructions?: State<string> | string;
    disabled?: State<boolean> | boolean;
    onload?: (...args: unknown[]) => void;
    ref?: (api: SignatureApi) => void;
}

export declare const Signature: Component<SignatureProps>;
export default Signature;
