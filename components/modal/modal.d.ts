/**
 * GENERATED from contract.json by `npm run registry` — do not edit.
 */
import type { Bindable, Component, State } from 'lemonadejs';

export interface ModalApi {
    open: (...args: unknown[]) => unknown;
    close: (...args: unknown[]) => unknown;
    toggle: (...args: unknown[]) => unknown;
    front: (...args: unknown[]) => unknown;
    back: (...args: unknown[]) => unknown;
}

export interface ModalProps extends Bindable<boolean> {
    title?: State<string> | string;
    width?: State<number> | number;
    height?: State<number> | number;
    top?: State<number> | number;
    left?: State<number> | number;
    position?: State<string> | string;
    backdrop?: State<boolean> | boolean;
    closable?: State<boolean> | boolean;
    draggable?: State<boolean> | boolean;
    resizable?: State<boolean> | boolean;
    minimizable?: State<boolean> | boolean;
    minimized?: State<boolean> | boolean;
    fullscreen?: State<boolean> | boolean;
    autoclose?: State<boolean> | boolean;
    autoadjust?: State<boolean> | boolean;
    focus?: State<boolean> | boolean;
    overflow?: State<boolean> | boolean;
    responsive?: State<boolean> | boolean;
    layers?: State<boolean> | boolean;
    url?: State<string> | string;
    onopen?: (...args: unknown[]) => void;
    onclose?: (...args: unknown[]) => void;
    onmove?: (...args: unknown[]) => void;
    onresize?: (...args: unknown[]) => void;
    ref?: (api: ModalApi) => void;
}

export declare const Modal: Component<ModalProps>;
export default Modal;
