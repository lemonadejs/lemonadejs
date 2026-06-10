import { describe, it, expect, afterEach } from 'vitest';
import { html, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('Components and props', () => {
    it('passes literal attributes as strings and expressions by reference', () => {
        let received: unknown;
        const Card: Component<{ title?: string; data?: number[] }> = (props) => {
            received = props.data;
            return html`<div class="card"><h3>${props.title}</h3></div>`;
        };

        const data = [1, 2, 3];
        const App: Component = () => html`<main><${Card} title="Hello" data="${data}" /></main>`;

        handle = t(App);
        expect(handle.query('h3')!.textContent).toBe('Hello');
        expect(received).toBe(data); // same reference, no stringification
    });

    it('keeps a state prop live across the component boundary', () => {
        let countRef!: State<number>;
        const Display: Component<{ total?: State<number> }> = (props) =>
            html`<b>${props.total}</b>`;

        const App: Component = (props, { state }) => {
            const count = state(1);
            countRef = count;
            return html`<div><${Display} total="${count}" /></div>`;
        };

        handle = t(App);
        expect(handle.query('b')!.textContent).toBe('1');
        countRef.value = 42;
        expect(handle.query('b')!.textContent).toBe('42');
    });

    it('supports callback props (data flows up through functions)', () => {
        let saved = '';
        const Editor: Component<{ onsave?: (v: string) => void }> = (props) =>
            html`<button onclick="${() => props.onsave && props.onsave('done')}">save</button>`;

        const App: Component = () => html`<div><${Editor} onsave="${(v: string) => (saved = v)}" /></div>`;

        handle = t(App);
        handle.query('button')!.click();
        expect(saved).toBe('done');
    });

    it('renders children passed between component tags', () => {
        const Card: Component = (props) => html`<div class="card">${props.children}</div>`;
        const App: Component = () => html`<main><${Card}><p>inside</p><span>more</span></${Card}></main>`;

        handle = t(App);
        expect(handle.query('.card p')!.textContent).toBe('inside');
        expect(handle.query('.card span')!.textContent).toBe('more');
    });

    it('children carry the parent scope (slots bind to parent states)', () => {
        let countRef!: State<number>;
        const Card: Component = (props) => html`<div class="card">${props.children}</div>`;
        const App: Component = (props, { state }) => {
            const count = state(7);
            countRef = count;
            return html`<main><${Card}><p>${count}</p></${Card}></main>`;
        };

        handle = t(App);
        expect(handle.query('.card p')!.textContent).toBe('7');
        countRef.value = 8;
        expect(handle.query('.card p')!.textContent).toBe('8');
    });

    it('supports boolean props on components', () => {
        let received: unknown;
        const Box: Component<{ wide?: boolean }> = (props) => {
            received = props.wide;
            return html`<div></div>`;
        };
        const App: Component = () => html`<main><${Box} wide /></main>`;
        handle = t(App);
        expect(received).toBe(true);
    });

    it('mounts components inside branches and unmounts them on removal', () => {
        const log: string[] = [];
        let itemsRef!: State<string[]>;

        const Item: Component<{ label?: string }> = (props, { onMount, onUnmount }) => {
            onMount(() => log.push('mount:' + props.label));
            onUnmount(() => log.push('unmount:' + props.label));
            return html`<li>${props.label}</li>`;
        };

        const App: Component = (props, { state }) => {
            const items = state(['a', 'b']);
            itemsRef = items;
            return html`<ul>${() => items.value.map((x) => html`<${Item} label="${x}" />`)}</ul>`;
        };

        handle = t(App);
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['a', 'b']);
        expect(log).toContain('mount:a');
        expect(log).toContain('mount:b');

        itemsRef.value = ['a'];
        expect(handle.queryAll('li')).toHaveLength(1);
        expect(log).toContain('unmount:b');
        expect(log).not.toContain('unmount:a');
    });

    it('props are frozen in dev mode', () => {
        let captured: Record<string, unknown> | null = null;
        const Box: Component<{ a?: string }> = (props) => {
            captured = props as Record<string, unknown>;
            return html`<div></div>`;
        };
        const App: Component = () => html`<main><${Box} a="1" /></main>`;
        handle = t(App);
        expect(() => {
            (captured as Record<string, unknown>).a = 'changed';
        }).toThrow(TypeError);
    });
});
