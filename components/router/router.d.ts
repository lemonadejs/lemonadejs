/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface RouterApi {
    setPath: (...args: unknown[]) => unknown;
    current: (...args: unknown[]) => unknown;
}

export interface RouterProps {
    routes?: State<unknown[]> | unknown[];
    single?: State<boolean> | boolean;
    animation?: State<boolean> | boolean;
    onchangepage?: (...args: unknown[]) => void;
    onbeforechangepage?: (...args: unknown[]) => void;
    onbeforecreatepage?: (...args: unknown[]) => void;
    ref?: (api: RouterApi) => void;
}

export declare const Router: Component<RouterProps>;
export default Router;
