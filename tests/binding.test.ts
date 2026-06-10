/**
 * Two-way binding: the native bind directive on form elements and the
 * bind() tool implementing the component protocol (Bindable<T>).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, type Bindable, type Component, type State } from '../src/index';
import { test as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** The canonical protocol component, built with the bind() tool */
const Switch: Component<Bindable<boolean>> = (props, { bind }) => {
    const value = bind(props, false);
    return render`<div class="switch ${() => (value.value ? 'on' : 'off')}"
        onclick="${() => value.set(!value.value)}"></div>`;
};

describe('Native bind directive', () => {
    it('binds a text input in both directions', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const name = state('lemon');
            ref = name;
            return render`<div><input bind="${name}" /><p>${name}</p></div>`;
        };
        handle = t(C);
        const input = handle.query('input') as HTMLInputElement;
        expect(input.value).toBe('lemon');

        // element → state
        input.value = 'typed';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(ref.value).toBe('typed');
        expect(handle.query('p')!.textContent).toBe('typed');

        // state → element
        ref.value = 'programmatic';
        expect(input.value).toBe('programmatic');
    });

    it('binds a checkbox to a boolean state', () => {
        let ref!: State<boolean>;
        const C: Component = (p, { state }) => {
            const on = state(false);
            ref = on;
            return render`<div><input type="checkbox" bind="${on}" /></div>`;
        };
        handle = t(C);
        const box = handle.query('input') as HTMLInputElement;
        expect(box.checked).toBe(false);

        box.checked = true;
        box.dispatchEvent(new Event('change', { bubbles: true }));
        expect(ref.value).toBe(true);

        ref.value = false;
        expect(box.checked).toBe(false);
    });

    it('binds a radio group through one state', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const pick = state('b');
            ref = pick;
            return render`<div>
                <input type="radio" name="g" value="a" bind="${pick}" />
                <input type="radio" name="g" value="b" bind="${pick}" />
            </div>`;
        };
        handle = t(C);
        const [ra, rb] = handle.queryAll('input') as HTMLInputElement[];
        expect(ra.checked).toBe(false);
        expect(rb.checked).toBe(true);

        ra.checked = true;
        ra.dispatchEvent(new Event('change', { bubbles: true }));
        expect(ref.value).toBe('a');
        expect(rb.checked).toBe(false);
    });

    it('binds a select element', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const pick = state('two');
            ref = pick;
            return render`<div><select bind="${pick}">
                <option value="one">1</option>
                <option value="two">2</option>
            </select></div>`;
        };
        handle = t(C);
        const select = handle.query('select') as HTMLSelectElement;
        expect(select.value).toBe('two');

        select.value = 'one';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(ref.value).toBe('one');
    });

    it('binds a textarea', () => {
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const text = state('start');
            ref = text;
            return render`<div><textarea bind="${text}"></textarea></div>`;
        };
        handle = t(C);
        const area = handle.query('textarea') as HTMLTextAreaElement;
        expect(area.value).toBe('start');
        ref.value = 'changed';
        expect(area.value).toBe('changed');
    });

    it('never renders bind as a DOM attribute', () => {
        const C: Component = (p, { state }) => {
            const v = state('x');
            return render`<div><input bind="${v}" /></div>`;
        };
        handle = t(C);
        expect(handle.query('input')!.hasAttribute('bind')).toBe(false);
        expect(handle.snapshot()).not.toContain('bind');
    });

    it('throws LJS-302 for a plain string (forgot the expression)', () => {
        const C: Component = () => render`<div><input bind="name" /></div>`;
        expect(() => t(C)).toThrow(/LJS-302/);
    });

    it('throws LJS-302 for an unwrapped snapshot (state.value)', () => {
        const C: Component = (p, { state }) => {
            const name = state('x');
            return render`<div><input bind="${name.value}" /></div>`;
        };
        expect(() => t(C)).toThrow(/LJS-302/);
    });

    it('throws LJS-303 on a non-form element', () => {
        const C: Component = (p, { state }) => {
            const v = state('x');
            return render`<div bind="${v}">x</div>`;
        };
        expect(() => t(C)).toThrow(/LJS-303/);
    });

    it('warns LJS-304 when bind and value are both present', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const C: Component = (p, { state }) => {
            const v = state('x');
            return render`<div><input bind="${v}" value="conflict" /></div>`;
        };
        handle = t(C);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-304'))).toBe(true);
        spy.mockRestore();
    });

    it('does not loop on echo: input event writing the same value is a no-op', () => {
        let runs = 0;
        let ref!: State<string>;
        const C: Component = (p, { state }) => {
            const v = state('a');
            ref = v;
            return render`<div><input bind="${v}" /><p>${() => (runs++, v.value)}</p></div>`;
        };
        handle = t(C);
        const input = handle.query('input') as HTMLInputElement;
        const before = runs;
        input.dispatchEvent(new Event('input', { bubbles: true })); // value unchanged
        expect(runs).toBe(before);
        expect(ref.value).toBe('a');
    });
});

describe('Component bind protocol (the bind() tool)', () => {
    it('two-way binds a Switch to an external state', () => {
        let ref!: State<boolean>;
        const App: Component = (p, { state }) => {
            const on = state(false);
            ref = on;
            return render`<main><${Switch} bind="${on}" /><p>${() => (on.value ? 'yes' : 'no')}</p></main>`;
        };
        handle = t(App);
        expect(handle.query('.switch')!.className).toBe('switch off');

        // component → parent state
        handle.query('.switch')!.click();
        expect(ref.value).toBe(true);
        expect(handle.query('p')!.textContent).toBe('yes');

        // parent state → component
        ref.value = false;
        expect(handle.query('.switch')!.className).toBe('switch off');
    });

    it('fires onchange only for component-initiated changes (set), not parent writes', () => {
        const changes: boolean[] = [];
        let ref!: State<boolean>;
        const App: Component = (p, { state }) => {
            const on = state(false);
            ref = on;
            return render`<main><${Switch} bind="${on}" onchange="${(v: boolean) => changes.push(v)}" /></main>`;
        };
        handle = t(App);

        ref.value = true; // parent write: silent
        expect(changes).toEqual([]);

        handle.query('.switch')!.click(); // user interaction: notifies
        expect(changes).toEqual([false]);
        expect(ref.value).toBe(false);
    });

    it('works standalone with a local state and the fallback', () => {
        const App: Component = () => render`<main><${Switch} /></main>`;
        handle = t(App);
        expect(handle.query('.switch')!.className).toBe('switch off');
        handle.query('.switch')!.click();
        expect(handle.query('.switch')!.className).toBe('switch on');
    });

    it('accepts a plain value as the initial state (one-way snapshot)', () => {
        const App: Component = () => render`<main><${Switch} bind="${true}" /></main>`;
        handle = t(App);
        expect(handle.query('.switch')!.className).toBe('switch on');
        handle.query('.switch')!.click();
        expect(handle.query('.switch')!.className).toBe('switch off');
    });

    it('onchange fires standalone too, with new and old values', () => {
        const calls: [boolean, boolean][] = [];
        const App: Component = () =>
            render`<main><${Switch} onchange="${(v: boolean, o: boolean) => calls.push([v, o])}" /></main>`;
        handle = t(App);
        handle.query('.switch')!.click();
        handle.query('.switch')!.click();
        expect(calls).toEqual([
            [true, false],
            [false, true],
        ]);
    });

    it('keeps two components bound to the same state in sync', () => {
        const App: Component = (p, { state }) => {
            const on = state(false);
            return render`<main><${Switch} bind="${on}" /><${Switch} bind="${on}" /></main>`;
        };
        handle = t(App);
        const [a, b] = handle.queryAll('.switch');
        a.click();
        expect(a.className).toBe('switch on');
        expect(b.className).toBe('switch on');
        b.click();
        expect(a.className).toBe('switch off');
        expect(b.className).toBe('switch off');
    });

    it('event casing is normalized on native elements (onClick works)', () => {
        let clicks = 0;
        const C: Component = () => render`<div><button onClick="${() => clicks++}">x</button></div>`;
        handle = t(C);
        handle.query('button')!.click();
        expect(clicks).toBe(1);
    });

    it('warns LJS-305 when a component receives onChange instead of onchange', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const App: Component = (p, { state }) => {
            const on = state(false);
            return render`<main><${Switch} bind="${on}" onChange="${() => {}}" /></main>`;
        };
        handle = t(App);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-305'))).toBe(true);
        spy.mockRestore();
    });

    it('does not warn when onchange is correctly lowercase', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const App: Component = (p, { state }) => {
            const on = state(false);
            return render`<main><${Switch} bind="${on}" onchange="${() => {}}" /></main>`;
        };
        handle = t(App);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-305'))).toBe(false);
        spy.mockRestore();
    });

    it('bound state works with the native bind directive inside the component', () => {
        // A custom input that decorates a native one — bind flows through
        const Field: Component<Bindable<string>> = (props, { bind }) => {
            const value = bind(props, '');
            return render`<label class="field"><input bind="${value}" /></label>`;
        };
        let ref!: State<string>;
        const App: Component = (p, { state }) => {
            const name = state('init');
            ref = name;
            return render`<main><${Field} bind="${name}" /></main>`;
        };
        handle = t(App);
        const input = handle.query('input') as HTMLInputElement;
        expect(input.value).toBe('init');

        input.value = 'edited';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(ref.value).toBe('edited');

        ref.value = 'outside';
        expect(input.value).toBe('outside');
    });
});
