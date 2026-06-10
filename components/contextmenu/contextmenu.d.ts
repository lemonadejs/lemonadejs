/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface ContextmenuApi {
    open: (...args: unknown[]) => unknown;
    openAt: (...args: unknown[]) => unknown;
    close: (...args: unknown[]) => unknown;
}

export interface ContextmenuProps {
    options?: State<unknown[]> | unknown[];
    onopen?: (...args: unknown[]) => void;
    onclose?: (...args: unknown[]) => void;
    ref?: (api: ContextmenuApi) => void;
}

export declare const Contextmenu: Component<ContextmenuProps>;
export default Contextmenu;
