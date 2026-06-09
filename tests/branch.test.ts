import { describe, it, expect, afterEach } from 'vitest';
import { render, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('Dynamic branches (the ${...} contract)', () => {
    it('toggles a conditional without recreating the DOM (detach cache)', () => {
        let validRef!: State<boolean>;
        const C: Component = (props, { state }) => {
            const valid = state(true);
            validRef = valid;
            return render`<div>${() => valid.value && render`<span class="x">123</span>`}</div>`;
        };

        handle = t(C);
        const first = handle.query('span');
        expect(first).not.toBeNull();

        validRef.value = false;
        expect(handle.query('span')).toBeNull();

        validRef.value = true;
        // The exact same element instance returns — parsed and created once
        expect(handle.query('span')).toBe(first);
    });

    it('renders lists from map and reuses untouched DOM on append', () => {
        let itemsRef!: State<string[]>;
        const C: Component = (props, { state }) => {
            const items = state(['a', 'b']);
            itemsRef = items;
            return render`<ul>${() => items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };

        handle = t(C);
        let lis = handle.queryAll('li');
        expect(lis.map((li) => li.textContent)).toEqual(['a', 'b']);

        const [first, second] = lis;
        itemsRef.value = [...itemsRef.value, 'c'];

        lis = handle.queryAll('li');
        expect(lis.map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
        // Existing nodes are the same instances — only one <li> was created
        expect(lis[0]).toBe(first);
        expect(lis[1]).toBe(second);
    });

    it('updates a single item surgically, keeping the element', () => {
        let itemsRef!: State<string[]>;
        const C: Component = (props, { state }) => {
            const items = state(['a', 'b', 'c']);
            itemsRef = items;
            return render`<ul>${() => items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };

        handle = t(C);
        const before = handle.queryAll('li');

        itemsRef.value = ['a', 'B', 'c'];
        const after = handle.queryAll('li');

        expect(after.map((li) => li.textContent)).toEqual(['a', 'B', 'c']);
        expect(after[0]).toBe(before[0]);
        expect(after[1]).toBe(before[1]); // same element, new text
        expect(after[2]).toBe(before[2]);
    });

    it('removes tail entries when the list shrinks', () => {
        let itemsRef!: State<string[]>;
        const C: Component = (props, { state }) => {
            const items = state(['a', 'b', 'c']);
            itemsRef = items;
            return render`<ul>${() => items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };

        handle = t(C);
        itemsRef.value = ['a'];
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['a']);
    });

    it('event handlers stay current after a branch update', () => {
        let itemsRef!: State<string[]>;
        let clicked = '';
        const C: Component = (props, { state }) => {
            const items = state(['a', 'b']);
            itemsRef = items;
            return render`<div>${() =>
                items.value.map((x) => render`<button onclick="${() => (clicked = x)}">${x}</button>`)}</div>`;
        };

        handle = t(C);
        itemsRef.value = ['a', 'B'];
        handle.queryAll('button')[1].click();
        // The handler reads through the holder: it sees the updated item
        expect(clicked).toBe('B');
    });

    it('handles conditional + loop in one expression', () => {
        let validRef!: State<boolean>;
        let itemsRef!: State<string[]>;
        const C: Component = (props, { state }) => {
            const valid = state(false);
            const items = state(['x', 'y']);
            validRef = valid;
            itemsRef = items;
            return render`<ul>${() => valid.value && items.value.map((x) => render`<li>${x}</li>`)}</ul>`;
        };

        handle = t(C);
        expect(handle.queryAll('li')).toHaveLength(0);

        validRef.value = true;
        expect(handle.queryAll('li')).toHaveLength(2);

        itemsRef.value = ['x', 'y', 'z'];
        expect(handle.queryAll('li')).toHaveLength(3);

        validRef.value = false;
        expect(handle.queryAll('li')).toHaveLength(0);
    });

    it('alternates between text and views in the same slot', () => {
        let modeRef!: State<boolean>;
        const C: Component = (props, { state }) => {
            const mode = state(false);
            modeRef = mode;
            return render`<div>${() => (mode.value ? render`<b>bold</b>` : 'plain')}</div>`;
        };

        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('plain');
        expect(handle.query('b')).toBeNull();

        modeRef.value = true;
        expect(handle.query('b')!.textContent).toBe('bold');

        modeRef.value = false;
        expect(handle.query('b')).toBeNull();
        expect(handle.query('div')!.textContent).toBe('plain');
    });

    it('keeps static siblings untouched across branch updates', () => {
        let itemsRef!: State<string[]>;
        const C: Component = (props, { state }) => {
            const items = state(['a']);
            itemsRef = items;
            return render`<div>
                <h1>static</h1>
                ${() => items.value.map((x) => render`<p>${x}</p>`)}
                <footer>also static</footer>
            </div>`;
        };

        handle = t(C);
        const h1 = handle.query('h1');
        const footer = handle.query('footer');

        itemsRef.value = ['a', 'b', 'c'];
        expect(handle.query('h1')).toBe(h1);
        expect(handle.query('footer')).toBe(footer);
        // And order is preserved: h1, p*, footer
        const children = [...handle.query('div')!.children].map((c) => c.tagName.toLowerCase());
        expect(children).toEqual(['h1', 'p', 'p', 'p', 'footer']);
    });

    it('accepts DOM nodes as slot values', () => {
        const external = document.createElement('em');
        external.textContent = 'node';
        const C: Component = () => render`<div>${external}</div>`;
        handle = t(C);
        expect(handle.query('em')).toBe(external);
    });

    it('renders a static nested view once', () => {
        const C: Component = () => render`<div>${render`<i>static</i>`}</div>`;
        handle = t(C);
        expect(handle.query('i')!.textContent).toBe('static');
    });
});
