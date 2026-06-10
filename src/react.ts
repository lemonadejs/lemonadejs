/**
 * LemonadeJS v6 — React adapter (lemonadejs/react)
 *
 * One generic adapter replaces every per-plugin shim. Everything is
 * derived from the contract:
 *
 *   import { adaptReact } from 'lemonadejs/react';
 *   export default adaptReact(Switch);
 *
 *   <Switch value={on} onChange={setOn} label="Dark mode" ref={api} />
 *
 *   - declared props become states the adapter owns; React re-renders
 *     diff prop values into them (live updates, no remount)
 *   - bind maps to React's value/onChange convention (lowercase onchange
 *     also accepted — our casing rule applies on our side, theirs on theirs)
 *   - declared events call the latest React callback (no stale closures)
 *   - the declared api is exposed through the React ref:
 *     ref.current.toggle()
 *   - StrictMode-safe: unmount is idempotent, mounting is effect-scoped
 *
 * Components without a contract still adapt: props are passed once as a
 * snapshot (mount-time), like v5.
 */

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';
import type { Component, State } from './types';
import { contract, mount, store } from './index';

type AnyProps = Record<string, unknown>;
type Api = Record<string, (...args: unknown[]) => unknown>;

/** React users may write onChange; we accept their casing on their side */
const reactAlias = function (event: string): string {
    return 'on' + event.charAt(2).toUpperCase() + event.slice(3);
};

export const adaptReact = function (
    component: Component<AnyProps>
): ForwardRefExoticComponent<PropsWithoutRef<AnyProps> & RefAttributes<Api>> {
    const schema = contract(component);

    return forwardRef<Api, AnyProps>(function (props, ref) {
        const rootRef = useRef<HTMLDivElement | null>(null);
        const statesRef = useRef<Record<string, State<unknown>> | null>(null);
        const bindRef = useRef<State<unknown> | null>(null);
        const apiRef = useRef<Api | null>(null);
        const propsRef = useRef<AnyProps>(props);
        propsRef.current = props;

        // The adapter owns one state per declared prop, created once
        if (!statesRef.current) {
            const states: Record<string, State<unknown>> = {};
            if (schema) {
                for (const key of Object.keys(schema.props)) {
                    states[key] = store(props[key] !== undefined ? props[key] : schema.props[key].default);
                }
                if (schema.bind) {
                    bindRef.current = store(props.value !== undefined ? props.value : schema.bind.default);
                }
            }
            statesRef.current = states;
        }

        useEffect(function () {
            const mountProps: AnyProps = { ...statesRef.current };
            if (schema) {
                if (bindRef.current) {
                    mountProps.bind = bindRef.current;
                }
                for (const event of schema.events) {
                    mountProps[event] = function (...args: unknown[]) {
                        const cb = propsRef.current[event] || propsRef.current[reactAlias(event)];
                        if (typeof cb === 'function') {
                            return (cb as (...a: unknown[]) => unknown)(...args);
                        }
                    };
                }
                if (schema.bind && schema.events.indexOf('onchange') < 0) {
                    mountProps.onchange = function (...args: unknown[]) {
                        const cb = propsRef.current.onchange || propsRef.current.onChange;
                        if (typeof cb === 'function') {
                            return (cb as (...a: unknown[]) => unknown)(...args);
                        }
                    };
                }
                if (schema.api.length) {
                    mountProps.ref = function (api: Api) {
                        apiRef.current = api;
                    };
                }
            } else {
                // No contract: v5 behavior — props as a mount-time snapshot
                Object.assign(mountProps, propsRef.current);
            }
            const handle = mount(component, rootRef.current as Element, mountProps);
            return function () {
                apiRef.current = null;
                handle.unmount();
            };
        }, []);

        // Every React render: diff declared props into the owned states
        useEffect(function () {
            const states = statesRef.current;
            if (schema && states) {
                for (const key of Object.keys(schema.props)) {
                    if (props[key] !== undefined) {
                        states[key].value = props[key];
                    }
                }
                if (bindRef.current && props.value !== undefined) {
                    bindRef.current.value = props.value;
                }
            }
        });

        // The declared api through the React ref, lazily delegated
        useImperativeHandle(
            ref,
            function () {
                const facade: Api = {};
                if (schema) {
                    for (const method of schema.api) {
                        facade[method] = function (...args: unknown[]) {
                            const api = apiRef.current;
                            if (api && typeof api[method] === 'function') {
                                return api[method](...args);
                            }
                        };
                    }
                }
                return facade;
            },
            []
        );

        return createElement('div', { ref: rootRef, style: { display: 'contents' } });
    });
};

export default adaptReact;
