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

import type { Component, Handle } from './types';
import { fail } from './errors';
import { mount } from './runtime';
import { StateImpl } from './reactivity';
import { coerce, contract, Schema } from './contract';

export interface WebComponentOptions {
    /** Tag prefix, default 'lm' → <lm-name> */
    prefix?: string;
}

type AnyComponent = Component<Record<string, unknown>>;

// Component<never> accepts any component type (props are contravariant)
export function createWebComponent(component: Component<never>, options?: WebComponentOptions): string;
export function createWebComponent(name: string, component: Component<never>, options?: WebComponentOptions): string;
export function createWebComponent(
    a: string | Component<never>,
    b?: Component<never> | WebComponentOptions,
    c?: WebComponentOptions
): string {
    let name: string | undefined;
    let component: AnyComponent;
    let options: WebComponentOptions | undefined;

    if (typeof a === 'function') {
        component = a as AnyComponent;
        options = b as WebComponentOptions | undefined;
    } else {
        name = a;
        component = b as AnyComponent;
        options = c;
    }
    if (typeof component !== 'function') {
        fail('LJS-001', 'createWebComponent');
    }

    const schema: Schema | null = contract(component);
    if (!name) {
        if (schema) {
            name = schema.name;
        } else {
            fail('LJS-001', 'createWebComponent(Component) needs a contract — or pass a name');
        }
    }

    const tag = (options && options.prefix ? options.prefix : 'lm') + '-' + name;
    if (typeof customElements === 'undefined' || customElements.get(tag)) {
        return tag;
    }

    const propNames = schema ? Object.keys(schema.props) : [];

    class LemonadeElement extends HTMLElement {
        handle: Handle | null = null;
        _states: Record<string, StateImpl<unknown>> | null = null;
        _bind: StateImpl<unknown> | null = null;

        _ensure(): Record<string, StateImpl<unknown>> {
            if (!this._states) {
                this._states = {};
                if (schema) {
                    for (const key of propNames) {
                        this._states[key] = new StateImpl(schema.props[key].default);
                    }
                    if (schema.bind) {
                        this._bind = new StateImpl(schema.bind.default);
                    }
                }
            }
            return this._states;
        }

        static get observedAttributes(): string[] {
            const attrs = propNames.map(function (k) {
                return k.toLowerCase();
            });
            if (schema && schema.bind) {
                attrs.push('value');
            }
            return attrs;
        }

        attributeChangedCallback(attr: string, _old: string | null, value: string | null): void {
            if (!schema) {
                return;
            }
            const states = this._ensure();
            const key = propNames.find(function (k) {
                return k.toLowerCase() === attr;
            });
            if (key) {
                states[key].value = coerce(value, schema.props[key]);
            } else if (attr === 'value' && this._bind) {
                this._bind.value = coerce(value, schema.bind!);
            }
        }

        connectedCallback(): void {
            if (this.handle) {
                return;
            }
            const props: Record<string, unknown> = {};
            if (schema) {
                const states = this._ensure();
                // Attributes set before upgrade/definition
                for (const attr of this.getAttributeNames()) {
                    this.attributeChangedCallback(attr, null, this.getAttribute(attr));
                }
                Object.assign(props, states);
                if (this._bind) {
                    props.bind = this._bind;
                }
                const host = this;
                for (const event of schema.events) {
                    const type = event.slice(2);
                    props[event] = function (detail: unknown) {
                        host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
                    };
                }
                if (schema.bind && schema.events.indexOf('onchange') < 0) {
                    props.onchange = function (detail: unknown) {
                        host.dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }));
                    };
                }
            } else {
                for (const attr of this.getAttributeNames()) {
                    props[attr] = this.getAttribute(attr);
                }
            }
            // Rich values: el.props = {...} before connecting
            const rich = (this as unknown as { props?: Record<string, unknown> }).props;
            if (rich && typeof rich === 'object') {
                Object.assign(props, rich);
            }
            this.handle = mount(component, this, props);
        }

        disconnectedCallback(): void {
            // Destroy-by-default: hosts (React, Vue, plain DOM) remove
            // elements without calling unmount(), and a kept-alive instance
            // subscribed to a store would pin its whole tree forever — the
            // v5 leak, reborn. The microtask grace keeps same-tick MOVES
            // (reparenting) alive; a real removal unmounts. Reconnecting
            // remounts fresh from the element's preserved attribute states.
            const host = this;
            queueMicrotask(function () {
                if (!host.isConnected) {
                    host.unmount();
                }
            });
        }

        unmount(): void {
            if (this.handle) {
                this.handle.unmount();
                this.handle = null;
            }
        }
    }

    // The core-of-HTML surface: declared props become element properties
    if (schema) {
        for (const key of propNames) {
            if (key === 'value' && schema.bind) {
                // bind OWNS el.value (form semantics, defined below) — a
                // contract declaring BOTH bind and a value prop must not
                // define the property twice (it threw, killing the whole
                // registration). The value PROP stays reachable as a live
                // attribute: el.setAttribute('value', ...)
                continue;
            }
            Object.defineProperty(LemonadeElement.prototype, key, {
                get(this: LemonadeElement) {
                    return this._ensure()[key].peek();
                },
                set(this: LemonadeElement, v: unknown) {
                    // Coerce like the attribute path: a framework binding the
                    // declared property with a string ("150") must land as the
                    // contract type (number), or downstream css()/math sees a
                    // raw string. coerce() passes rich (non-string) values
                    // through untouched.
                    this._ensure()[key].value = coerce(v, schema!.props[key]);
                },
            });
        }
        if (schema.bind) {
            Object.defineProperty(LemonadeElement.prototype, 'value', {
                get(this: LemonadeElement) {
                    this._ensure();
                    return this._bind!.peek();
                },
                set(this: LemonadeElement, v: unknown) {
                    this._ensure();
                    this._bind!.value = coerce(v, schema!.bind!);
                },
            });
        }
    }

    customElements.define(tag, LemonadeElement);
    return tag;
}
