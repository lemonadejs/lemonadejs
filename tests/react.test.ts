/**
 * Integration against REAL React 18 (not a jsdom imitation): the
 * adaptReact() adapter, StrictMode double-mounting, prop-diff updates,
 * value/onChange, and the contract api through React refs.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, createElement as h, createRef, StrictMode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { html, component, type Bindable, type State } from '../src/index';
import { adaptReact } from '../src/react';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

type SwitchProps = Bindable<boolean> & { label?: State<string>; ref?: (api: object) => void };
const Switch = component<SwitchProps>(
    'switch',
    {
        bind: false,
        label: '',
        onchange: Function,
        api: { toggle: Function },
    },
    (props, { bind }) => {
        const value = bind(props, false);
        const toggle = () => value.set(!value.value);
        props.ref?.({ toggle });
        return html`<div class="switch ${() => (value.value ? 'on' : 'off')}"
            onclick="${toggle}">${props.label}</div>`;
    }
);

const ReactSwitch = adaptReact(Switch as never);

let container: HTMLDivElement;
let root: Root;

const setup = () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
};

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('adaptReact() against real React 18', () => {
    it('renders the lemonade component inside React and stays interactive', async () => {
        setup();
        await act(async () => {
            root.render(h(ReactSwitch, { label: 'dark mode' }));
        });
        const sw = container.querySelector('.switch') as HTMLElement;
        expect(sw.textContent).toBe('dark mode');
        expect(sw.className).toBe('switch off');

        await act(async () => {
            sw.click();
        });
        expect(sw.className).toBe('switch on');
    });

    it('React prop updates flow into the component without remounting', async () => {
        setup();
        let setLabel!: (v: string) => void;
        const Host = () => {
            const [label, set] = useState('first');
            setLabel = set;
            return h(ReactSwitch, { label });
        };

        await act(async () => {
            root.render(h(Host));
        });
        const sw = container.querySelector('.switch') as HTMLElement;
        expect(sw.textContent).toBe('first');

        await act(async () => {
            setLabel('second');
        });
        // Same element instance — the adapter diffed into the state, no remount
        expect(container.querySelector('.switch')).toBe(sw);
        expect(sw.textContent).toBe('second');
    });

    it('supports the React value/onChange convention for bind', async () => {
        setup();
        const changes: unknown[] = [];
        let setOn!: (v: boolean) => void;
        const Host = () => {
            const [on, set] = useState(false);
            setOn = set;
            return h(ReactSwitch, { value: on, onChange: (v: boolean) => changes.push(v) });
        };

        await act(async () => {
            root.render(h(Host));
        });
        const sw = container.querySelector('.switch') as HTMLElement;

        await act(async () => {
            sw.click(); // component-initiated: fires onChange
        });
        expect(changes).toEqual([true]);

        await act(async () => {
            setOn(true); // controlled write from React: no echo
        });
        expect(sw.className).toBe('switch on');
        expect(changes).toEqual([true]);
    });

    it('exposes the declared api through the React ref', async () => {
        setup();
        const apiRef = createRef<{ toggle: () => void }>();
        await act(async () => {
            root.render(h(ReactSwitch, { ref: apiRef }));
        });
        const sw = container.querySelector('.switch') as HTMLElement;
        expect(sw.className).toBe('switch off');

        await act(async () => {
            apiRef.current!.toggle(); // imperative, v5-style ref.current.method()
        });
        expect(sw.className).toBe('switch on');
    });

    it('survives StrictMode double-mounting', async () => {
        setup();
        await act(async () => {
            root.render(h(StrictMode, null, h(ReactSwitch, { label: 'strict' })));
        });
        // Exactly one instance despite mount→unmount→mount
        expect(container.querySelectorAll('.switch')).toHaveLength(1);
        const sw = container.querySelector('.switch') as HTMLElement;

        await act(async () => {
            sw.click();
        });
        expect(sw.className).toBe('switch on'); // still reactive after remount
    });

    it('adapts components without a contract (v5 snapshot behavior)', async () => {
        setup();
        const Plain = (props: { greeting?: string }) => html`<p class="plain">${props.greeting}</p>`;
        const ReactPlain = adaptReact(Plain as never);
        await act(async () => {
            root.render(h(ReactPlain, { greeting: 'hello from react' }));
        });
        expect(container.querySelector('.plain')!.textContent).toBe('hello from react');
    });
});
