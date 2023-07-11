/**
 * Official Type definitions for LemonadeJS plugins
 * https://lemonadejs.net
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

interface Color {
    (): any
    [key: string]: any
}

interface options {
    palette?: array[];
    closed?: boolean;
    name?: string;
    type?: string;
    value?: string;
    onopen?: () => void;
    onclose?: () => void;
    onupdate?: (value: string) => void;
}

interface instance {
    palette?: array[];
    closed?: boolean;
    name?: string;
    type?: string;
    value?: string;
}

export declare function Color(el: HTMLElement, options?: options): instance;
