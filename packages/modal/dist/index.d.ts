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
    /** Close the modal when it loses the focus */
    autoclose?: boolean;
    /** Modal is closed */
    closed?: boolean;
    /** Modal can be closed */
    closable?: boolean;
    /** Modal is minimized */
    minimized?: boolean;
    /** Modal can be minimized */
    minimizable?: boolean;
    /** Modal can be resized */
    resizable?: boolean;
    /** Modal can be moved from its original position */
    draggable?: boolean;
    /** Modal is automatic align center */
    center?: boolean;
    /** Title of the modal */
    title?: string;
    /** Width of the modal */
    width?: number;
    /** Height of the modal */
    height?: number;
    /** Position top */
    top?: number;
    /** Position Left */
    left?: number;
    /** Load the content from a remote URL */
    url?: string;
}

interface instance {
    autoclose: boolean;
    closed: boolean;
    closable: boolean;
    minimized: boolean;
    minimizable: boolean;
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
