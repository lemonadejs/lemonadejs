/**
 * LemonadeJS v6 — test harness (lemonadejs/test)
 *
 * Headless verification for components: render, query, snapshot, unmount.
 * Works anywhere a DOM exists (browser or jsdom). Designed so an agent can
 * close the loop on its own output:
 *
 *   const t = render(Counter, { start: 5 });
 *   t.query('button')!.click();
 *   assert(t.query('p')!.textContent === '6');
 *   console.log(t.snapshot());
 *   t.unmount();
 */

// Satellite entry: values come only from ./index so the built artifact
// shares the app's engine instead of bundling a second copy
import type { Component } from './types';
import { mount, inspect, contract as contractOf, store } from './index';

export interface TestHandle {
    /** The container the component is mounted into */
    root: HTMLElement;
    /** querySelector scoped to the component */
    query(selector: string): HTMLElement | null;
    /** querySelectorAll scoped to the component, as a real array */
    queryAll(selector: string): HTMLElement[];
    /** The full visible text of the component */
    text(): string;
    /** Deterministic, diff-friendly text rendering of the DOM tree */
    snapshot(): string;
    /** The live component tree: names, state values, children (plain JSON) */
    inspect(): unknown;
    /** Remove the component and dispose everything */
    unmount(): void;
}

/** Serialize a DOM tree into a stable, indented, diffable text form */
const serialize = function (node: Node, depth: number): string[] {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) {
        const text = (node.nodeValue || '').trim();
        return text ? [pad + '"' + text + '"'] : [];
    }
    if (node.nodeType !== 1) {
        return [];
    }
    const el = node as Element;
    const attrs = [...el.attributes]
        .map(function (a) {
            return a.value === '' ? a.name : a.name + '="' + a.value + '"';
        })
        .sort()
        .join(' ');
    const open = '<' + el.tagName.toLowerCase() + (attrs ? ' ' + attrs : '') + '>';
    const lines = [pad + open];
    for (const child of [...el.childNodes]) {
        lines.push(...serialize(child, depth + 1));
    }
    return lines;
};

/**
 * Mount a component into a fresh detached-from-your-app container and
 * return query/snapshot helpers for assertions.
 */
export const render = function <P>(component: Component<P>, props?: P): TestHandle {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handle = mount(component, root, props);

    return {
        root,
        query: function (selector: string) {
            return root.querySelector<HTMLElement>(selector);
        },
        queryAll: function (selector: string) {
            return [...root.querySelectorAll<HTMLElement>(selector)];
        },
        text: function () {
            return root.textContent || '';
        },
        snapshot: function () {
            const lines: string[] = [];
            for (const child of [...root.childNodes]) {
                lines.push(...serialize(child, 0));
            }
            return lines.join('\n');
        },
        inspect: function () {
            return inspect(root);
        },
        unmount: function () {
            handle.unmount();
            root.remove();
        },
    };
};

export interface VerifyCheck {
    name: string;
    pass: boolean;
    detail?: string;
}

export interface VerifyReport {
    component: string;
    pass: boolean;
    checks: VerifyCheck[];
}

const SAMPLES: Record<string, unknown> = {
    string: 'sample',
    number: 1,
    boolean: true,
    array: [],
    object: {},
    function: function () {},
    any: 'sample',
};

/**
 * Conformance: check that a published component honors its contract.
 * The contract is the promise; the component is an implementation of it.
 * An agent generates a component and its proof in one breath:
 *
 *   const report = verify(Switch);
 *   report.pass === true;
 */
export const verify = function (component: Component<never>): VerifyReport {
    const checks: VerifyCheck[] = [];
    // Conformance includes silence: any LJS-* dev warning during a check fails it
    const run = function (name: string, fn: () => void): void {
        const originalWarn = console.warn;
        const warnings: string[] = [];
        console.warn = function (...args: unknown[]) {
            warnings.push(String(args[0]));
        };
        try {
            fn();
            const offences = warnings.filter(function (w) {
                return w.indexOf('LJS-') >= 0;
            });
            if (offences.length) {
                throw new Error(offences.join('; '));
            }
            checks.push({ name, pass: true });
        } catch (e) {
            checks.push({ name, pass: false, detail: (e as Error).message });
        } finally {
            console.warn = originalWarn;
        }
    };

    const schema = contractOf(component);
    if (!schema) {
        return {
            component: component.name || 'Component',
            pass: false,
            checks: [
                {
                    name: 'has contract',
                    pass: false,
                    detail: 'not published — wrap it: component(name, contract, fn)',
                },
            ],
        };
    }

    run('mounts with defaults', function () {
        render(component as Component<unknown>).unmount();
    });

    for (const key of Object.keys(schema.props)) {
        run('prop ' + key, function () {
            const props: Record<string, unknown> = {};
            props[key] = SAMPLES[schema.props[key].type];
            render(component as Component<unknown>, props).unmount();
        });
        run('prop ' + key + ' (live state)', function () {
            const props: Record<string, unknown> = {};
            const state = store(SAMPLES[schema.props[key].type]);
            props[key] = state;
            const t = render(component as Component<unknown>, props);
            state.touch();
            t.unmount();
        });
    }

    for (const event of schema.events) {
        run('event ' + event, function () {
            const props: Record<string, unknown> = {};
            props[event] = function () {};
            render(component as Component<unknown>, props).unmount();
        });
    }

    if (schema.bind) {
        run('bind', function () {
            const state = store(schema.bind!.default);
            const t = render(component as Component<unknown>, { bind: state });
            state.value = SAMPLES[schema.bind!.type];
            t.unmount();
        });
    }

    if (schema.api.length) {
        run('api via ref', function () {
            let api: Record<string, unknown> | null = null;
            const t = render(component as Component<unknown>, {
                ref: function (a: Record<string, unknown>) {
                    api = a;
                },
            });
            t.unmount();
            for (const method of schema.api) {
                if (!api || typeof (api as Record<string, unknown>)[method] !== 'function') {
                    throw new Error('api.' + method + ' not exposed through props.ref');
                }
            }
        });
    }

    return {
        component: schema.name,
        pass: checks.every(function (c) {
            return c.pass;
        }),
        checks,
    };
};

export default render;
