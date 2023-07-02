/**
 * Official Type definitions for LemonadeJS plugins
 * https://lemonadejs.net
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

interface Modal {
    (): any
    [key: string]: any
}

interface options {
    closed?: boolean;
    closable?: boolean;
    resizable?: boolean;
    draggable?: boolean;
    center?: boolean;
    title?: string;
    width?: number;
    height?: number;
    top?: number;
    left?: number;
}

interface instance {
    closed: boolean;
    closable: boolean;
    resizable: boolean;
    draggable: boolean;
    center: boolean;
    title: string;
    width: number;
    height: number;
    top: number;
    left: number;
}

export declare function Modal(el: HTMLElement, options?: options): instance;
