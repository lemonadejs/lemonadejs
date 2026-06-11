/**
 * Live component-prop patching: a reused entry (keyed or positional) whose
 * values changed PATCHES its living component instances — new prop values
 * flow into the contract wrapper's states, fresh closures swap into the
 * event trampolines — instead of rebuilding. Structural changes (different
 * component, shared-state rewiring, bind/ref changes, undeclared props)
 * still rebuild. Born from the kanban + contextmenu probe receipts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, component, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** A contract component that counts its own constructions and holds state */
const makeCard = (() => {
    let n = 0;
    return () => {
        const builds: string[] = [];
        const Card = component('patchcard' + n++, { title: '', count: 0, onping: Function }, (props, { state }) => {
            builds.push(props.title.peek() as string);
            const clicks = state(0);
            return html`<button onclick="${() => {
                clicks.value++;
                props.onping?.(clicks.value);
            }}">${props.title}:${props.count}:${clicks}</button>`;
        });
        return { Card, builds };
    };
})();

interface Item {
    id: number;
    title: string;
    count: number;
}

describe('live component-prop patching', () => {
    it('changed values flow into the instance — DOM and internal state survive', () => {
        const { Card, builds } = makeCard();
        let rows!: State<Item[]>;
        const App: Component = (p, { state }) => {
            rows = state<Item[]>([{ id: 1, title: 'a', count: 0 }]);
            return html`<div>${() =>
                rows.value.map((r) => html`<section key="${r.id}"><${Card} title="${r.title}" count="${r.count}" /></section>`)}</div>`;
        };
        handle = t(App);
        const btn = handle.query('button')!;
        btn.click(); // internal state: clicks = 1
        expect(btn.textContent).toBe('a:0:1');
        expect(builds).toEqual(['a']);

        rows.value = [{ id: 1, title: 'renamed', count: 7 }];
        const after = handle.query('button')!;
        expect(after).toBe(btn); // SAME DOM — patched, not rebuilt
        expect(after.textContent).toBe('renamed:7:1'); // props updated, clicks kept
        expect(builds).toEqual(['a']); // setup ran ONCE
    });

    it('fresh event closures swap into the trampoline — the NEW closure fires', () => {
        const { Card } = makeCard();
        const got: string[] = [];
        let rows!: State<Item[]>;
        const App: Component = (p, { state }) => {
            rows = state<Item[]>([{ id: 1, title: 'a', count: 0 }]);
            return html`<div>${() =>
                rows.value.map(
                    (r) =>
                        html`<section key="${r.id}"><${Card} title="${r.title}"
                            onping="${(n: number) => got.push(r.title + n)}" /></section>`
                )}</div>`;
        };
        handle = t(App);
        const btn = handle.query('button')!;
        btn.click();
        expect(got).toEqual(['a1']);

        rows.value = [{ id: 1, title: 'b', count: 0 }];
        expect(handle.query('button')).toBe(btn);
        btn.click(); // the closure captured the NEW item
        expect(got).toEqual(['a1', 'b2']); // clicks continued from 1 → state survived
    });

    it('kanban-style: components as cards keep state across cross-position value changes', () => {
        const { Card } = makeCard();
        let rows!: State<Item[]>;
        const App: Component = (p, { state }) => {
            rows = state<Item[]>([
                { id: 1, title: 'one', count: 0 },
                { id: 2, title: 'two', count: 0 },
            ]);
            return html`<div>${() =>
                rows.value.map(
                    (r, i) => html`<section key="${r.id}"><${Card} title="${r.title}" count="${i}" /></section>`
                )}</div>`;
        };
        handle = t(App);
        const [b1, b2] = handle.queryAll('button');
        b1.click();
        b1.click();
        expect(b1.textContent).toBe('one:0:2');

        // Reorder — count (the position) CHANGES for both: patch, not rebuild
        rows.value = [rows.value[1], rows.value[0]];
        const after = handle.queryAll('button');
        expect(after[1]).toBe(b1); // moved with its state
        expect(after[0]).toBe(b2);
        expect(after[1].textContent).toBe('one:1:2'); // new position, old clicks
    });

    it('positional (unkeyed) component lists patch too', () => {
        const { Card, builds } = makeCard();
        let title!: State<string>;
        const App: Component = (p, { state }) => {
            title = state('first');
            return html`<div>${() => [html`<i><${Card} title="${title.value}" /></i>`]}</div>`;
        };
        handle = t(App);
        const btn = handle.query('button')!;
        btn.click();
        title.value = 'second';
        expect(handle.query('button')).toBe(btn);
        expect(btn.textContent).toBe('second:0:1');
        expect(builds).toEqual(['first']);
    });

    it('children stay LIVE through a patch (their bindings belong to the entry)', () => {
        const Shell = component('patchshell', { tone: '' }, (props) => {
            return html`<div class="shell ${props.tone}">${props.children}</div>`;
        });
        let rows!: State<Item[]>;
        const App: Component = (p, { state }) => {
            rows = state<Item[]>([{ id: 1, title: 'inner', count: 0 }]);
            return html`<main>${() =>
                rows.value.map(
                    (r) => html`<article key="${r.id}"><${Shell} tone="${r.title}"><em>${r.count}</em></${Shell}></article>`
                )}</main>`;
        };
        handle = t(App);
        const em = handle.query('em')!;
        expect(em.textContent).toBe('0');

        rows.value = [{ id: 1, title: 'loud', count: 42 }];
        expect(handle.query('em')).toBe(em); // child DOM survived
        expect(em.textContent).toBe('42'); // and updated through entry bindings
        expect(handle.query('.shell')!.className).toBe('shell loud');
    });

    it('STRUCTURAL changes still rebuild: a different component in the tag', () => {
        const { Card: A, builds: buildsA } = makeCard();
        const { Card: B, builds: buildsB } = makeCard();
        let use!: State<boolean>;
        const App: Component = (p, { state }) => {
            use = state(true);
            return html`<div>${() => [html`<i><${use.value ? A : B} title="x" /></i>`]}</div>`;
        };
        handle = t(App);
        expect(buildsA).toEqual(['x']);
        use.value = false;
        expect(buildsB).toEqual(['x']); // rebuilt with the other component
    });

    it('STRUCTURAL: swapping a shared state prop rebuilds (rewiring is not patchable)', () => {
        const { Card, builds } = makeCard();
        const s1 = { id: 1 };
        const s2 = { id: 2 };
        let rows!: State<{ id: number }[]>;
        let external!: State<string>;
        const App: Component = (p, { state }) => {
            external = state('live');
            rows = state([s1]);
            return html`<div>${() =>
                rows.value.map(
                    (r) => html`<i key="${r.id}"><${Card} title="${r.id === 1 ? external : 'plain'}" /></i>`
                )}</div>`;
        };
        handle = t(App);
        expect(builds.length).toBe(1);
        rows.value = [s2]; // key changes too — fresh entry, rebuild expected
        expect(builds.length).toBe(2);
    });

    it('two successive patches work (the raw-props record advances)', () => {
        const { Card, builds } = makeCard();
        let rows!: State<Item[]>;
        const App: Component = (p, { state }) => {
            rows = state<Item[]>([{ id: 1, title: 'v1', count: 1 }]);
            return html`<div>${() =>
                rows.value.map((r) => html`<i key="${r.id}"><${Card} title="${r.title}" count="${r.count}" /></i>`)}</div>`;
        };
        handle = t(App);
        rows.value = [{ id: 1, title: 'v2', count: 2 }];
        expect(handle.query('button')!.textContent).toBe('v2:2:0');
        rows.value = [{ id: 1, title: 'v3', count: 3 }];
        expect(handle.query('button')!.textContent).toBe('v3:3:0');
        expect(builds).toEqual(['v1']);
    });

    it('mixed-part string props patch (label="${x} items")', () => {
        const Tag = component('patchtag', { label: '' }, (props) => html`<b>${props.label}</b>`);
        let n!: State<number>;
        const App: Component = (p, { state }) => {
            n = state(1);
            return html`<div>${() => [html`<i><${Tag} label="${n.value} items" /></i>`]}</div>`;
        };
        handle = t(App);
        const b = handle.query('b')!;
        expect(b.textContent).toBe('1 items');
        n.value = 5;
        expect(handle.query('b')).toBe(b);
        expect(b.textContent).toBe('5 items');
    });
});
