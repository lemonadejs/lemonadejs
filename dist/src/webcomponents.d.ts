/**
 * LemonadeJS v6 — web components (interop boundary)
 *
 * Wraps a component as a real custom element, usable in plain HTML or any
 * framework. With a contract, everything derives automatically:
 *
 *   createWebComponent(Switch);          // <lm-switch> — zero options
 *
 *   - observed attributes = declared props, LIVE: change an attribute,
 *     the component updates (attributes are coerced to declared types)
 *   - property accessors = declared props: el.label = 'x' works — the
 *     core-of-HTML surface, derived from the contract
 *   - declared events dispatch real CustomEvents on the host (bubbling,
 *     composed) — @change / (change) / addEventListener all work
 *   - bind is exposed as the element's value property + 'change' event
 *
 * Without a contract, the legacy form stays: createWebComponent(name, fn)
 * passes connect-time attributes as string props, plus el.props for rich
 * values.
 */
import type { Component } from './types';
export interface WebComponentOptions {
    /** Tag prefix, default 'lm' → <lm-name> */
    prefix?: string;
}
export declare function createWebComponent(component: Component<never>, options?: WebComponentOptions): string;
export declare function createWebComponent(name: string, component: Component<never>, options?: WebComponentOptions): string;
