/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface TabsApi {
    open: (...args: unknown[]) => unknown;
    create: (...args: unknown[]) => unknown;
}

export interface TabsProps extends Bindable<number> {
    data?: State<unknown[]> | unknown[];
    selected?: State<number> | number;
    position?: State<string> | string;
    round?: State<boolean> | boolean;
    allowcreate?: State<boolean> | boolean;
    onopen?: (...args: unknown[]) => void;
    onbeforecreate?: (...args: unknown[]) => void;
    oncreate?: (...args: unknown[]) => void;
    onchangeposition?: (...args: unknown[]) => void;
    ref?: (api: TabsApi) => void;
}

export declare const Tabs: Component<TabsProps>;
export default Tabs;
