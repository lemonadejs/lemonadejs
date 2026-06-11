/**
 * The agentic layer: contracts (component/describe), live published props,
 * contract-driven web components, subscribe(), and verify() conformance.
 */
import { describe as suite, it, expect, afterEach, vi } from 'vitest';
import {
    html,
    component,
    contract,
    use,
    createWebComponent,
    store,
    type ApiOf,
    type Bindable,
    type Component,
    type State,
} from '../src/index';
import { render as t, verify, flush, setRect } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** The canonical published component — props typed by contract inference */
const Switch = component(
    'switch',
    {
        bind: false,
        label: '',
        onchange: Function,
        api: { toggle: Function },
    },
    (props, { bind }) => {
        const checked = bind(props, false);
        const toggle = () => checked.set(!checked.value);
        props.ref?.({ toggle });
        return html`<div class="switch ${() => (checked.value ? 'on' : 'off')}"
            onclick="${toggle}">${props.label}</div>`;
    }
);

suite('Contracts: component() and describe()', () => {
    it('describe() returns the machine-readable schema', () => {
        const schema = contract(Switch)!;
        expect(schema.name).toBe('switch');
        expect(schema.bind).toEqual({ type: 'boolean', default: false });
        expect(schema.props.label).toEqual({ type: 'string', default: '' });
        expect(schema.events).toEqual(['onchange']);
        expect(schema.api).toEqual(['toggle']);
    });

    it('describe() returns null for unpublished components', () => {
        const Plain: Component = () => html`<div></div>`;
        expect(contract(Plain)).toBeNull();
    });

    it('infers types from constructors and defaults', () => {
        const C = component('probe', {
            title: String,
            count: 0,
            items: Array,
            config: { a: 1 },
            enabled: Boolean,
        }, () => html`<i></i>`);
        const s = contract(C)!;
        expect(s.props.title).toEqual({ type: 'string' });
        expect(s.props.count).toEqual({ type: 'number', default: 0 });
        expect(s.props.items).toEqual({ type: 'array' });
        expect(s.props.config).toEqual({ type: 'object', default: { a: 1 } });
        expect(s.props.enabled).toEqual({ type: 'boolean' });
    });

    it('applies defaults when props are missing', () => {
        const Badge = component('badge', { label: 'default!' }, (props: { label?: State<string> }) =>
            html`<b>${props.label}</b>`);
        handle = t(Badge);
        expect(handle.query('b')!.textContent).toBe('default!');
    });

    it('published props arrive as live states — shared states stay shared', () => {
        const Badge = component('badge2', { label: '' }, (props: { label?: State<string> }) =>
            html`<b>${props.label}</b>`);
        const external = store('first');
        const App: Component = () => html`<main><${Badge} label="${external}" /></main>`;
        handle = t(App);
        expect(handle.query('b')!.textContent).toBe('first');
        external.value = 'second';
        expect(handle.query('b')!.textContent).toBe('second');
    });

    it('coerces attribute strings to declared types', () => {
        const Doubler = component('doubler', { count: 0 }, (props) =>
            html`<i>${() => props.count.value * 2}</i>`);
        const App: Component = () => html`<main><${Doubler} count="21" /></main>`;
        handle = t(App);
        expect(handle.query('i')!.textContent).toBe('42'); // number math, not "2121"
    });

    it('warns LJS-401 on a type violation in dev', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Probe = component('probe401', { size: 0 }, () => html`<i></i>`);
        const App: Component = () => html`<main><${Probe} size="${{ not: 'a number' }}" /></main>`;
        handle = t(App);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-401'))).toBe(true);
        spy.mockRestore();
    });

    it('contract bind default applies when unbound', () => {
        const On = component('defon', { bind: true }, (props: Bindable<boolean>, { bind }) => {
            const checked = bind(props, false); // contract default (true) wins over code fallback
            return html`<i>${() => (checked.value ? 'on' : 'off')}</i>`;
        });
        handle = t(On);
        expect(handle.query('i')!.textContent).toBe('on');
    });
});

suite('Contract-driven web components', () => {
    it('derives the tag from the contract — zero options', () => {
        expect(createWebComponent(Switch as Component<Record<string, unknown>>)).toBe('lm-switch');
    });

    it('attributes are LIVE after mount and coerced (core of HTML)', () => {
        const Label = component('liveattr', { label: 'x', count: 0 }, (props) =>
            html`<p>${props.label}:${() => props.count.value + 1}</p>`);
        createWebComponent(Label as Component<Record<string, unknown>>);

        const el = document.createElement('lm-liveattr');
        el.setAttribute('label', 'first');
        document.body.appendChild(el);
        expect(el.querySelector('p')!.textContent).toBe('first:1');

        el.setAttribute('label', 'second'); // change AFTER mount
        el.setAttribute('count', '41');
        expect(el.querySelector('p')!.textContent).toBe('second:42');
        el.remove();
    });

    it('declared props are element properties', () => {
        const Prop = component('liveprop', { title: '' }, (props: { title?: State<string> }) =>
            html`<h2>${props.title}</h2>`);
        createWebComponent(Prop as Component<Record<string, unknown>>);

        const el = document.createElement('lm-liveprop') as HTMLElement & { title: string };
        document.body.appendChild(el);
        el.title = 'via property'; // el.prop = v — the HTML surface
        expect(el.querySelector('h2')!.textContent).toBe('via property');
        expect(el.title).toBe('via property');
        el.remove();
    });

    it('bind maps to the value property and dispatches change events', () => {
        createWebComponent(Switch as Component<Record<string, unknown>>);
        const el = document.createElement('lm-switch') as HTMLElement & { value: boolean };
        document.body.appendChild(el);

        const events: unknown[] = [];
        el.addEventListener('change', (e) => events.push((e as CustomEvent).detail));

        (el.querySelector('.switch') as HTMLElement).click();
        expect(events).toEqual([true]); // CustomEvent out — @change/(change) territory
        expect(el.value).toBe(true);

        el.value = false; // property in
        expect(el.querySelector('.switch')!.className).toBe('switch off');
        el.remove();
    });
});

suite('subscribe() — the universal adapter', () => {
    it('fires on assignment and on touch, and unsubscribes cleanly', () => {
        const rows = store<number[]>([1]);
        const seen: number[][] = [];
        const off = rows.subscribe((v) => seen.push([...v]));

        rows.value = [1, 2];
        rows.value.push(3);
        rows.touch();
        expect(seen).toEqual([
            [1, 2],
            [1, 2, 3],
        ]);

        off();
        rows.value = [9];
        expect(seen).toHaveLength(2);
    });

    it('has the useSyncExternalStore shape: subscribe + peek', () => {
        const count = store(5);
        expect(count.peek()).toBe(5);
        let renders = 0;
        const off = count.subscribe(() => renders++); // React would re-render here
        count.value = 6;
        expect(renders).toBe(1);
        expect(count.peek()).toBe(6);
        off();
    });
});

suite('Sugar: expose/use singleton services', () => {
    /** A service component: private internals, declared api */
    const makeNotifications = () =>
        component('notifications', {
            api: { notify: Function, count: Function },
        }, (props: { ref?: (api: object) => void }, { state }) => {
            const queue = state<string[]>([]); // private — closed over
            props.ref?.({
                notify: (msg: string) => (queue.value = [...queue.value, msg]),
                count: () => queue.value.length,
                secret: () => 'should never cross the boundary',
            });
            return html`<ul>${() => queue.value.map((m) => html`<li>${m}</li>`)}</ul>`;
        });

    it('exposes only the declared api and keeps internals unreachable', () => {
        const Notifications = makeNotifications();
        const App: Component = () => html`<main><${Notifications} expose /></main>`;
        handle = t(App);

        const api = use<{ notify: (m: string) => void; count: () => number }>(Notifications)!;
        expect(typeof api.notify).toBe('function');
        expect(typeof api.count).toBe('function');
        expect((api as Record<string, unknown>).secret).toBeUndefined(); // contract is the boundary
    });

    it('calling the api drives the exposing instance reactively from anywhere', () => {
        const Notifications = makeNotifications();
        const App: Component = () => html`<main><${Notifications} expose /></main>`;
        handle = t(App);

        const api = use<{ notify: (m: string) => void; count: () => number }>(Notifications)!;
        api.notify('saved!');
        api.notify('again');
        expect(handle.queryAll('li').map((li) => li.textContent)).toEqual(['saved!', 'again']);
        expect(api.count()).toBe(2);
    });

    it('unmount withdraws the singleton', () => {
        const Notifications = makeNotifications();
        const App: Component = () => html`<main><${Notifications} expose /></main>`;
        const local = t(App);
        expect(use(Notifications)).not.toBeNull();
        local.unmount();
        expect(use(Notifications)).toBeNull();
    });

    it('use() returns null for never-exposed components', () => {
        const Lonely = component('lonely', { api: { x: Function } }, () => html`<i></i>`);
        expect(use(Lonely)).toBeNull();
    });

    it('warns LJS-501 when a second instance overwrites the singleton (last wins)', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Notifications = makeNotifications();
        const App: Component = () => html`<main><${Notifications} expose /><${Notifications} expose /></main>`;
        handle = t(App);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-501'))).toBe(true);
        expect(use(Notifications)).not.toBeNull();
        spy.mockRestore();
    });

    it('warns LJS-501 when expose is used without a declared api', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const NoApi = component('noapi', { label: '' }, (props: { ref?: (a: object) => void }) => {
            props.ref?.({ anything: 1 });
            return html`<i></i>`;
        });
        const App: Component = () => html`<main><${NoApi} expose /></main>`;
        handle = t(App);
        expect(spy.mock.calls.some((args) => String(args[0]).includes('LJS-501'))).toBe(true);
        spy.mockRestore();
    });

    it("the caller's own ref still runs alongside expose", () => {
        const Notifications = makeNotifications();
        let captured: object | null = null;
        const App: Component = () =>
            html`<main><${Notifications} expose ref="${(api: object) => (captured = api)}" /></main>`;
        handle = t(App);
        expect(captured).not.toBeNull();
    });
});

suite('verify() — conformance against the contract', () => {
    it('a conforming component passes with a full check list', () => {
        const report = verify(Switch as Component<never>);
        expect(report.pass).toBe(true);
        expect(report.component).toBe('switch');
        const names = report.checks.map((c) => c.name);
        expect(names).toContain('mounts with defaults');
        expect(names).toContain('prop label');
        expect(names).toContain('event onchange');
        expect(names).toContain('bind');
        expect(names).toContain('api via ref');
    });

    it('an unpublished component fails with the publishing hint', () => {
        const Plain: Component = () => html`<div></div>`;
        const report = verify(Plain as Component<never>);
        expect(report.pass).toBe(false);
        expect(report.checks[0].detail).toContain('component(name, contract, fn)');
    });

    it('a component that promises an api but never exposes it fails', () => {
        const Liar = component('liar', { api: { open: Function } }, () => html`<div></div>`);
        const report = verify(Liar as Component<never>);
        expect(report.pass).toBe(false);
        const apiCheck = report.checks.find((c) => c.name === 'api via ref')!;
        expect(apiCheck.pass).toBe(false);
        expect(apiCheck.detail).toContain('api.open');
    });
});

suite('LJS-402: unknown props warn with a suggestion', () => {
    const warned = (fn: () => void): string[] => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            fn();
            return spy.mock.calls.map((c) => String(c[0])).filter((m) => m.indexOf('LJS-402') >= 0);
        } finally {
            spy.mockRestore();
        }
    };

    it('a typo in a prop name warns and suggests the declared name', () => {
        const messages = warned(() => {
            handle = t(Switch as Component<unknown>, { lable: 'oops' });
        });
        expect(messages.length).toBe(1);
        expect(messages[0]).toContain('lable in <switch>');
        expect(messages[0]).toContain("did you mean 'label'?");
    });

    it('declared props, events, ref, children and expose never warn', () => {
        const messages = warned(() => {
            handle = t(Switch as Component<unknown>, {
                label: 'fine',
                onchange: () => {},
                ref: () => {},
            });
        });
        expect(messages).toEqual([]);
    });

    it('bind on a contract WITHOUT bind warns', () => {
        const NoBind = component('nobind402', { label: '' }, (props) => html`<i>${props.label}</i>`);
        const messages = warned(() => {
            handle = t(NoBind as Component<unknown>, { bind: store('x') });
        });
        expect(messages.length).toBe(1);
        expect(messages[0]).toContain('bind in <nobind402>');
    });

    it('a prop far from every declared name warns without a suggestion', () => {
        const messages = warned(() => {
            handle = t(Switch as Component<unknown>, { totallydifferent: 1 });
        });
        expect(messages.length).toBe(1);
        expect(messages[0]).not.toContain('did you mean');
    });
});

suite('Type flow: contract knowledge reaches the editor', () => {
    it('declared props are non-optional states — no ! needed', () => {
        // The body below compiles WITHOUT non-null assertions: that is the test
        const Meter = component('meter402', { min: 0, max: 100, onlevel: Function }, (props) => {
            const span = props.max.value - props.min.value; // number, no casts
            props.onlevel?.(span); // events invocable as-is
            return html`<i>${span}</i>`;
        });
        handle = t(Meter as Component<unknown>, { min: 10, max: 30 });
        expect(handle.text()).toBe('20');
    });
});

suite('Test helpers: flush() and setRect()', () => {
    it('flush() drains zero-delay timers', async () => {
        let done = false;
        setTimeout(() => (done = true), 0);
        expect(done).toBe(false);
        await flush();
        expect(done).toBe(true);
    });

    it('setRect() gives jsdom elements real geometry', () => {
        const Probe: Component = () => html`<div class="box"></div>`;
        handle = t(Probe);
        const box = handle.query('.box')!;
        setRect(box, { left: 10, top: 20, width: 100, height: 50 });
        const r = box.getBoundingClientRect();
        expect(r.right).toBe(110);
        expect(r.bottom).toBe(70);
        expect(r.width).toBe(100);
    });

    it('ApiOf<typeof C> names the api a ref receives — no hand-rolled shapes', () => {
        let api: ApiOf<typeof Switch> | null = null;
        handle = t(Switch, { ref: (a) => (api = a) });
        api!.toggle(); // typed straight from the contract
        expect(handle.query('.switch')!.className).toContain('on');
    });
});
