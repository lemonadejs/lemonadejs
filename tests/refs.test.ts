/**
 * Object refs (useRef-style): ref="${r}" puts the element — or the
 * component api — into r.current, and the runtime NULLS .current on
 * unmount so a surviving ref never pins a dead subtree. Callback refs
 * remain the canonical low-level form.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, ref, component, type Component, type Ref } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('ref(): object refs on elements and components', () => {
    it('element ref object: .current is the element', () => {
        const box = ref<HTMLElement>();
        const C: Component = () => html`<div class="target" ref="${box}">hi</div>`;
        handle = t(C);
        expect(box.current).not.toBeNull();
        expect(box.current!.className).toBe('target');
    });

    it('element ref is NULLED on unmount (no dead-subtree pinning)', () => {
        const box = ref<HTMLElement>();
        const C: Component = () => html`<div ref="${box}"></div>`;
        handle = t(C);
        expect(box.current).not.toBeNull();
        handle.unmount();
        handle = null;
        expect(box.current).toBeNull();
    });

    it('callback refs still work exactly as before', () => {
        let el: Element | null = null;
        const C: Component = () => html`<p ref="${(e: Element) => (el = e)}">x</p>`;
        handle = t(C);
        expect(el!.tagName).toBe('P');
    });

    it('component ref object: .current is the api, nulled on unmount', () => {
        const Counter = component('refcounter', {
            api: { add: Function, total: Function },
        }, (props, { state }) => {
            const n = state(0);
            props.ref?.({ add: () => n.value++, total: () => n.value });
            return html`<b>${n}</b>`;
        });

        const counter = ref<{ add(): void; total(): number }>();
        const App: Component = () => html`<div><${Counter} ref="${counter}" /></div>`;
        handle = t(App);

        expect(counter.current).not.toBeNull();
        counter.current!.add();
        counter.current!.add();
        expect(counter.current!.total()).toBe(2);
        expect(handle.text()).toBe('2');

        handle.unmount();
        handle = null;
        expect(counter.current).toBeNull();
    });

    it('component callback refs are untouched by the sugar', () => {
        const Box = component('refbox', { api: { ping: Function } }, (props) => {
            props.ref?.({ ping: () => 'pong' });
            return html`<i>box</i>`;
        });
        let api: { ping(): string } | null = null;
        const App: Component = () => html`<div><${Box} ref="${(a: { ping(): string }) => (api = a)}" /></div>`;
        handle = t(App);
        expect(api!.ping()).toBe('pong');
    });

    it('a branch rebuild re-points the ref at the fresh element', () => {
        const box = ref<HTMLElement>();
        let flip!: () => void;
        const C: Component = (p, { state }) => {
            const on = state(true);
            flip = () => (on.value = !on.value);
            return html`<div>${() => (on.value ? html`<span class="a" ref="${box}">a</span>` : html`<em>off</em>`)}</div>`;
        };
        handle = t(C);
        const firstEl = box.current;
        expect(firstEl!.className).toBe('a');

        flip(); // branch away: the span unmounts, the ref must not dangle
        expect(box.current).toBeNull();

        flip(); // back: fresh element, fresh pointer
        expect(box.current).not.toBeNull();
        expect(box.current).not.toBe(firstEl);
    });

    it('ref() accepts an initial value and Ref<T> types it', () => {
        const r: Ref<number> = ref(5);
        expect(r.current).toBe(5);
        r.current = null;
        expect(r.current).toBeNull();
    });
});
