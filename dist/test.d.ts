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
import type { Component } from './types';
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
/**
 * Mount a component into a fresh detached-from-your-app container and
 * return query/snapshot helpers for assertions.
 */
export declare const render: <P>(component: Component<P>, props?: P) => TestHandle;
/**
 * Drain pending microtasks AND zero-delay timers — the two queues
 * components defer into (Modal's per-open setup, debounced handlers).
 * await flush() between an action and its assertion.
 */
export declare const flush: () => Promise<void>;
/**
 * Give an element a fixed geometry in DOM-only environments (jsdom has
 * no layout — every rect is 0). Components that measure (modal
 * autoadjust, tooltip flip, gantt drag) become testable headlessly:
 *
 *   setRect(t.query('.lm-bar')!, { left: 100, top: 0, width: 200, height: 24 });
 */
export declare const setRect: (el: Element, rect: Partial<DOMRect>) => void;
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
/**
 * Conformance: check that a published component honors its contract.
 * The contract is the promise; the component is an implementation of it.
 * An agent generates a component and its proof in one breath:
 *
 *   const report = verify(Switch);
 *   report.pass === true;
 */
export declare const verify: (component: Component<never>) => VerifyReport;
export default render;
