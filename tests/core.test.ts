import { describe, it, expect, afterEach } from 'vitest';
import { render, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('Core rendering and reactivity', () => {
    it('renders a counter and updates on state assignment', () => {
        const Counter: Component<{ start?: number }> = (props, { state }) => {
            const count = state(props.start ?? 0);
            return render`<div>
                <p>${count}</p>
                <button onclick="${() => count.value++}">+1</button>
            </div>`;
        };

        handle = t(Counter, { start: 5 });
        expect(handle.query('p')!.textContent).toBe('5');
        handle.query('button')!.click();
        handle.query('button')!.click();
        expect(handle.query('p')!.textContent).toBe('7');
    });

    it('re-runs arrow-function slots when the states they read change', () => {
        let countRef!: State<number>;
        const C: Component = (props, { state }) => {
            const count = state(2);
            countRef = count;
            return render`<div><span>${() => count.value * 10}</span></div>`;
        };

        handle = t(C);
        expect(handle.query('span')!.textContent).toBe('20');
        countRef.value = 3;
        expect(handle.query('span')!.textContent).toBe('30');
    });

    it('treats plain values as one-time snapshots', () => {
        let countRef!: State<number>;
        const C: Component = (props, { state }) => {
            const count = state(1);
            countRef = count;
            // count.value is read once: a snapshot by contract (warns LJS-202 in dev)
            return render`<div><span>${count.value}</span><b>${count}</b></div>`;
        };

        handle = t(C);
        countRef.value = 9;
        expect(handle.query('span')!.textContent).toBe('1'); // snapshot
        expect(handle.query('b')!.textContent).toBe('9'); // live state
    });

    it('escapes plain strings — never parsed as HTML', () => {
        const C: Component = () => render`<div>${'<b>injected</b>'}</div>`;
        handle = t(C);
        expect(handle.query('b')).toBeNull();
        expect(handle.query('div')!.textContent).toBe('<b>injected</b>');
    });

    it('renders nothing for null, undefined, false and true', () => {
        const C: Component = () => render`<div>${null}${undefined}${false}${true}</div>`;
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('');
    });

    it('updates attribute bindings with mixed static and state parts', () => {
        let activeRef!: State<string>;
        const C: Component = (props, { state }) => {
            const active = state('off');
            activeRef = active;
            return render`<div class="btn ${active}"></div>`;
        };

        handle = t(C);
        expect(handle.query('div')!.className).toBe('btn off');
        activeRef.value = 'on';
        expect(handle.query('div')!.className).toBe('btn on');
    });

    it('drives form element values through properties', () => {
        let nameRef!: State<string>;
        const C: Component = (props, { state }) => {
            const name = state('lemon');
            nameRef = name;
            return render`<div><input value="${name}" /></div>`;
        };

        handle = t(C);
        const input = handle.query('input') as HTMLInputElement;
        expect(input.value).toBe('lemon');
        nameRef.value = 'lemonade';
        expect(input.value).toBe('lemonade');
    });

    it('supports boolean attributes', () => {
        const C: Component = () => render`<div><input disabled /></div>`;
        handle = t(C);
        expect((handle.query('input') as HTMLInputElement).disabled).toBe(true);
    });

    it('supports checked with a boolean state', () => {
        let onRef!: State<boolean>;
        const C: Component = (props, { state }) => {
            const on = state(false);
            onRef = on;
            return render`<div><input type="checkbox" checked="${on}" /></div>`;
        };

        handle = t(C);
        const box = handle.query('input') as HTMLInputElement;
        expect(box.checked).toBe(false);
        onRef.value = true;
        expect(box.checked).toBe(true);
    });

    it('calls ref with the created element', () => {
        let captured: Element | null = null;
        const C: Component = () => render`<div><p ref="${(el: Element) => (captured = el)}">x</p></div>`;
        handle = t(C);
        expect(captured).toBe(handle.query('p'));
    });

    it('keeps literal < in text', () => {
        const C: Component = () => render`<div>a < b</div>`;
        handle = t(C);
        expect(handle.query('div')!.textContent).toBe('a < b');
    });
});
