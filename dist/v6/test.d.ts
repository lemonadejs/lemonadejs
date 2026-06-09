/**
 * LemonadeJS v6 — test harness (lemonadejs/test)
 *
 * Headless verification for components: render, query, snapshot, unmount.
 * Works anywhere a DOM exists (browser or jsdom). Designed so an agent can
 * close the loop on its own output:
 *
 *   const t = test(Counter, { start: 5 });
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
export declare const test: <P>(component: Component<P>, props?: P) => TestHandle;
export default test;
