/**
 * Official Type definitions for LemonadeJS plugins
 * https://lemonadejs.net
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

interface Tabs {
    (): any
    [key: string]: any
}

interface options {
    data?: object[];
    selected?: number;
    position?: number;
    onopen?: () => void;
}

interface instance {
    data: object[];
    selected: number;
    position: number;
}

export declare function Tabs(el: HTMLElement, options?: options): instance;
