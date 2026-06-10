/**
 * LemonadeJS v6 — web components (interop boundary)
 *
 * Wraps a component as a real custom element, usable in plain HTML or any
 * framework: createWebComponent('switch', Switch) defines <lm-switch>.
 *
 * Attributes present at connect time are passed as string props (plus an
 * optional `props` object property set before connecting). For rich props
 * and live states, compose inside LemonadeJS instead — this boundary is
 * for crossing into other stacks.
 */
import type { Component } from './types';
export interface WebComponentOptions {
    /** Tag prefix, default 'lm' → <lm-name> */
    prefix?: string;
}
export declare const createWebComponent: (name: string, component: Component<Record<string, unknown>>, options?: WebComponentOptions) => string;
