/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface TopmenuApi {
    open: (...args: unknown[]) => unknown;
    close: (...args: unknown[]) => unknown;
}

export interface TopmenuProps {
    options?: State<unknown[]> | unknown[];
    ref?: (api: TopmenuApi) => void;
}

export declare const Topmenu: Component<TopmenuProps>;
export default Topmenu;
