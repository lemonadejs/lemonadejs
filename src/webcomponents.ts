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

import type { Component, Handle } from './types';
import { fail } from './errors';
import { mount } from './runtime';

export interface WebComponentOptions {
    /** Tag prefix, default 'lm' → <lm-name> */
    prefix?: string;
}

export const createWebComponent = function (
    name: string,
    component: Component<Record<string, unknown>>,
    options?: WebComponentOptions
): string {
    if (typeof component !== 'function') {
        fail('LJS-001', 'createWebComponent(' + name + ')');
    }
    const tag = (options && options.prefix ? options.prefix : 'lm') + '-' + name;

    if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
        class LemonadeElement extends HTMLElement {
            handle: Handle | null = null;

            connectedCallback(): void {
                if (!this.handle) {
                    const props: Record<string, unknown> = {};
                    for (const attr of this.getAttributeNames()) {
                        props[attr] = this.getAttribute(attr);
                    }
                    // Rich values: el.props = {...} before connecting
                    const rich = (this as unknown as { props?: Record<string, unknown> }).props;
                    if (rich && typeof rich === 'object') {
                        Object.assign(props, rich);
                    }
                    this.handle = mount(component, this, props);
                }
            }

            unmount(): void {
                if (this.handle) {
                    this.handle.unmount();
                    this.handle = null;
                }
            }
        }
        customElements.define(tag, LemonadeElement);
    }

    return tag;
};
