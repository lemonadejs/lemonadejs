/**
 * LemonadeJS v6 — runtime
 *
 * Materializes parsed templates into real DOM and keeps them alive.
 *
 * Ownership model: every ${...} slot in text position owns a marker TextNode
 * (permanent position anchor) and a list of entries — the content it produced.
 * Static siblings are created once and never visited again; updates touch
 * exactly the slot that changed (see applySlot).
 *
 * Branch rules (the contract):
 *   falsy/true            → nothing (previous content detaches, kept for reuse)
 *   string/number         → escaped text (never parsed as HTML)
 *   html`...` View      → live DOM branch
 *   Node                  → inserted as-is
 *   array                 → flattened, each item by the same rules
 */
import type { Component, Handle, Template } from './types';
import { Binding, StateImpl } from './reactivity';
/** Mutable container for a view's slot values — replaced on branch updates */
interface Holder {
    values: unknown[];
}
/** A live component instance */
export interface Instance {
    name: string;
    component: Function;
    props: Record<string, unknown>;
    states: StateImpl<unknown>[];
    bindings: Binding[];
    children: Instance[];
    slots: SlotState[];
    elements: Node[];
    pending: Instance[];
    mountCbs: ((el: Node) => void | (() => void))[];
    unmountCbs: (() => void)[];
    mounted: boolean;
}
/** One unit of content produced by a slot */
interface ViewEntry {
    kind: 'view';
    template: Template;
    holder: Holder;
    bindings: Binding[];
    instances: Instance[];
    nodes: Node[];
}
type Entry = {
    kind: 'text';
    text: string;
    nodes: Node[];
} | {
    kind: 'node';
    node: Node;
    nodes: Node[];
} | ViewEntry;
/** The retained record of one text-position slot */
interface SlotState {
    marker: Text;
    entries: Entry[];
    detached: boolean;
}
/**
 * Register components for use by name: setComponents({ Card, Modal })
 * enables <Card /> in templates. Names must start with a capital letter
 * and match exactly. Embedding by value (<${Card} />) needs no registration.
 */
export declare const setComponents: (map: Record<string, Component<never>>) => void;
/**
 * Create a component instance: run setup once, materialize its template.
 * Mount callbacks run later, when the elements are attached (runMount).
 */
export declare const mountComponent: (component: Component<Record<string, unknown>>, props: Record<string, unknown>, parent: Instance | null) => Instance;
/** Run mount callbacks, children first */
export declare const runMount: (inst: Instance) => void;
/** Unmount: children first, dispose every binding, remove the DOM */
export declare const unmountInstance: (inst: Instance) => void;
/** Mount a component into a root element */
export declare const mount: <P>(component: Component<P>, root: Element, props?: P) => Handle;
export interface InspectReport {
    component: string;
    contract: string | null;
    states: unknown[];
    children: InspectReport[];
}
/**
 * The explicit escape hatch for TRUSTED markup. Plain strings in slots are
 * always escaped; unsafe() parses a trusted HTML string into nodes:
 *   html`<div>${unsafe(articleHtml)}</div>`
 * Never call it on user input — the name is the warning.
 */
export declare const unsafe: (html: string) => Node[];
/**
 * Programmatic DevTools: returns the live component tree (names, state
 * values, children) for the instance owning the given element. Plain JSON.
 */
export declare const inspect: (target: Node) => InspectReport | null;
export {};
