/**
 * Registered components: setComponents({ Card }) enables <Card /> by name.
 * Embedding by value (<${Card} />) remains the registration-free path.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, setComponents, type Bindable, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('Registered components (<Card /> syntax)', () => {
    it('renders a registered component with props', () => {
        const Badge: Component<{ label?: string }> = (props) => html`<b class="badge">${props.label}</b>`;
        setComponents({ Badge });
        const App: Component = () => html`<div><Badge label="hello" /></div>`;
        handle = t(App);
        expect(handle.query('.badge')!.textContent).toBe('hello');
    });

    it('supports paired closing tags, children and live state props', () => {
        let ref!: State<number>;
        const Panel: Component<{ total?: State<number> }> = (props) =>
            html`<section class="panel"><h2>${props.total}</h2>${props.children}</section>`;
        setComponents({ Panel });
        const App: Component = (p, { state }) => {
            const count = state(1);
            ref = count;
            return html`<main><Panel total="${count}"><p>child ${count}</p></Panel></main>`;
        };
        handle = t(App);
        expect(handle.query('h2')!.textContent).toBe('1');
        expect(handle.query('p')!.textContent).toBe('child 1');
        ref.value = 9;
        expect(handle.query('h2')!.textContent).toBe('9');
        expect(handle.query('p')!.textContent).toBe('child 9');
    });

    it('resolves registered components nested inside registered components', () => {
        const Leaf: Component = () => html`<i class="leaf">leaf</i>`;
        const Branch: Component = () => html`<div class="branch"><Leaf /></div>`;
        setComponents({ Leaf, Branch });
        const App: Component = () => html`<main><Branch /></main>`;
        handle = t(App);
        expect(handle.query('.branch .leaf')!.textContent).toBe('leaf');
    });

    it('throws LJS-104 at mount for unregistered names', () => {
        const App: Component = () => html`<div><NeverRegistered /></div>`;
        expect(() => t(App)).toThrow(/LJS-104/);
    });

    it('names are case-sensitive', () => {
        const Chip: Component = () => html`<span>chip</span>`;
        setComponents({ Chip });
        const App: Component = () => html`<div><CHIP /></div>`;
        expect(() => t(App)).toThrow(/LJS-104/);
    });

    it('mixes registered and by-value components in one template', () => {
        const Named: Component = () => html`<i class="named">n</i>`;
        const ByValue: Component = () => html`<b class="value">v</b>`;
        setComponents({ Named });
        const App: Component = () => html`<div><Named /><${ByValue} /></div>`;
        handle = t(App);
        expect(handle.query('.named')).not.toBeNull();
        expect(handle.query('.value')).not.toBeNull();
    });

    it('works inside branches with a single mount', () => {
        let mounts = 0;
        let show!: State<boolean>;
        const Late: Component = (p, { onMount }) => {
            onMount(() => mounts++);
            return html`<p class="late">late</p>`;
        };
        setComponents({ Late });
        const App: Component = (p, { state }) => {
            const on = state(false);
            show = on;
            return html`<div>${() => on.value && html`<Late />`}</div>`;
        };
        handle = t(App);
        show.value = true;
        expect(handle.query('.late')).not.toBeNull();
        show.value = false;
        show.value = true;
        expect(mounts).toBe(1);
    });

    it('implements the bind protocol identically to by-value components', () => {
        const Toggle: Component<Bindable<boolean>> = (props, { bind }) => {
            const checked = bind(props, false);
            return html`<button class="${() => (checked.value ? 'on' : 'off')}"
                onclick="${() => checked.set(!checked.value)}">t</button>`;
        };
        setComponents({ Toggle });
        let ref!: State<boolean>;
        const App: Component = (p, { state }) => {
            const on = state(false);
            ref = on;
            return html`<main><Toggle bind="${on}" /></main>`;
        };
        handle = t(App);
        handle.query('button')!.click();
        expect(ref.value).toBe(true);
        expect(handle.query('button')!.className).toBe('on');
    });

    it('re-registration replaces the previous component', () => {
        const V1: Component = () => html`<span class="v">1</span>`;
        const V2: Component = () => html`<span class="v">2</span>`;
        setComponents({ Versioned: V1 });
        setComponents({ Versioned: V2 });
        const App: Component = () => html`<div><Versioned /></div>`;
        handle = t(App);
        expect(handle.query('.v')!.textContent).toBe('2');
    });
});
