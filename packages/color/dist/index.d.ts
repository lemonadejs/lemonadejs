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
    palette?: string[];
    closed?: boolean;
    name?: string;
    type?: 'inline' | 'input' | undefined;
    value?: string;
    onopen?: () => void;
    onclose?: () => void;
    onupdate?: (value: string) => void;
}

interface instance {
    palette?: string[];
    closed?: boolean;
    name?: string;
    type?: string;
    value?: string;
}

export declare function Color(el: HTMLElement, options?: options): instance;
