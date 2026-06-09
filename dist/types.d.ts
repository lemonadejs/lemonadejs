/**
 * LemonadeJS v6 — public and internal types
 */
/** A static chunk or a slot reference inside an attribute value */
export type Part = string | {
    slot: number;
};
/** A parsed attribute */
export interface VProp {
    name: string;
    parts: Part[];
}
/**
 * A node in a parsed template. Parsed once per tagged-template call site
 * and shared (read-only) by every component instance using it.
 * - type: tag name, '#text', '#slot', or { slot } for embedded components
 */
export interface VNode {
    type: string | {
        slot: number;
    };
    text?: string;
    slot?: number;
    props?: VProp[];
    children?: VNode[];
}
/** A parsed template (cached by TemplateStringsArray identity) */
export interface Template {
    nodes: VNode[];
}
/** The result of render`...` — a parsed template plus this call's values */
export interface View {
    template: Template;
    values: unknown[];
}
/** A reactive state container */
export interface State<T> {
    value: T;
}
/** Values accepted by ${...} slots */
export type SlotValue = string | number | boolean | null | undefined | State<unknown> | View | Node | ((...args: never[]) => unknown) | readonly SlotValue[];
/** Tools injected into every component */
export interface Tools {
    /** Create a reactive state. Assignment to .value triggers updates. */
    state<T>(initial: T, onchange?: (value: T, oldValue: T) => void): State<T>;
    /** Called after the component DOM is attached. Return a cleanup function if needed. */
    onMount(callback: (el: Node) => void | (() => void)): void;
    /** Called when the component is unmounted. */
    onUnmount(callback: () => void): void;
}
/** Props as a component receives them: read-only, plus children nodes */
export type Props<P> = Readonly<P> & {
    readonly children?: readonly Node[];
};
/** A LemonadeJS component */
export type Component<P = {}> = (props: Props<P>, tools: Tools) => View;
/** Handle returned by mount() */
export interface Handle {
    /** The root element the component was mounted into */
    el: Element;
    /** Remove the component from the DOM and dispose all bindings */
    unmount(): void;
}
/** Check that a value is a View produced by render`...` */
export declare function isView(v: unknown): v is View;
