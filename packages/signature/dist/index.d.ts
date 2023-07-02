/**
 * Official Type definitions for JSS edition bar
 * https://lemonadejs.net
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

interface Signature {
    (): any
    [key: string]: any
}

interface options {
    name?: string;
    line?: number;
    value?: number[][];
    width?: number;
    height?: number;
    instructions?: string
    onchange?: (instance: object) => void;
    onload?: (instance: object) => void;
}

interface instance {
    getValue: () => number[][];
    setValue: (value: number[]) => void;
    getImage: () => string;
}

export declare function Signature(el: HTMLElement, options?: options): instance;
