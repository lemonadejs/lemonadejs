/**
 * Keyed lists: key="${...}" on an item's root element makes list matching
 * identity-based instead of positional. Reorder MOVES DOM (and the
 * component instances inside it, with their state); insert/remove touches
 * only the affected entries. Lists without keys keep the positional diff.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, component, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

interface Row {
    id: number;
    label: string;
}

const setup = (initial: Row[]) => {
    let rows!: State<Row[]>;
    const C: Component = (p, { state }) => {
        rows = state(initial);
        return html`<ul>
            ${() => rows.value.map((r) => html`<li key="${r.id}" data-id="${r.id}">${r.label}</li>`)}
        </ul>`;
    };
    handle = t(C);
    return { rows: () => rows };
};

describe('keyed lists: identity-based reconciliation', () => {
    it('reorder MOVES the same DOM nodes (no rebuild)', () => {
        const a = { id: 1, label: 'a' };
        const b = { id: 2, label: 'b' };
        const c = { id: 3, label: 'c' };
        const { rows } = setup([a, b, c]);
        const [el1, el2, el3] = handle!.queryAll('li');

        rows().value = [c, a, b];
        const after = handle!.queryAll('li');
        expect(after.map((el) => el.textContent)).toEqual(['c', 'a', 'b']);
        // Same node objects, new order — identity preserved
        expect(after[0]).toBe(el3);
        expect(after[1]).toBe(el1);
        expect(after[2]).toBe(el2);
    });

    it('insert at the head keeps existing nodes; remove from the middle disposes one', () => {
        const a = { id: 1, label: 'a' };
        const b = { id: 2, label: 'b' };
        const { rows } = setup([a, b]);
        const [el1, el2] = handle!.queryAll('li');

        rows().value = [{ id: 0, label: 'new' }, a, b];
        let lis = handle!.queryAll('li');
        expect(lis.map((el) => el.textContent)).toEqual(['new', 'a', 'b']);
        expect(lis[1]).toBe(el1); // positional diff would have rebuilt these
        expect(lis[2]).toBe(el2);

        rows().value = [{ id: 0, label: 'new' }, b];
        lis = handle!.queryAll('li');
        expect(lis.map((el) => el.textContent)).toEqual(['new', 'b']);
        expect(lis[1]).toBe(el2);
        expect(el1.isConnected).toBe(false);
    });

    it('reorder preserves COMPONENT instances and their internal state', () => {
        const Counter = component('keycounter', { label: '' }, (props, { state }) => {
            const n = state(0);
            return html`<button onclick="${() => n.value++}">${props.label}:${n}</button>`;
        });
        const a = { id: 'a' };
        const b = { id: 'b' };
        let rows!: State<{ id: string }[]>;
        const App: Component = (p, { state }) => {
            rows = state([a, b]);
            return html`<div>
                ${() => rows.value.map((r) => html`<span key="${r.id}"><${Counter} label="${r.id}" /></span>`)}
            </div>`;
        };
        handle = t(App);

        const first = handle.queryAll('button')[0];
        first.click();
        first.click();
        expect(handle.queryAll('button').map((b) => b.textContent)).toEqual(['a:2', 'b:0']);

        rows.value = [b, a]; // values per item are UNCHANGED → instances move
        expect(handle.queryAll('button').map((b) => b.textContent)).toEqual(['b:0', 'a:2']);
        expect(handle.queryAll('button')[1]).toBe(first); // same DOM, same instance
    });

    it('the item OBJECT works as a key (identity by Object.is)', () => {
        const a = { label: 'a' };
        const b = { label: 'b' };
        let rows!: State<{ label: string }[]>;
        const C: Component = (p, { state }) => {
            rows = state([a, b]);
            return html`<ul>${() => rows.value.map((r) => html`<li key="${r}">${r.label}</li>`)}</ul>`;
        };
        handle = t(C);
        const [el1] = handle.queryAll('li');
        rows.value = [b, a];
        expect(handle.queryAll('li')[1]).toBe(el1);
    });

    it('keyed entry with CHANGED values updates in place (bindings re-run, node kept)', () => {
        const { rows } = setup([
            { id: 1, label: 'a' },
            { id: 2, label: 'b' },
        ]);
        const [el1] = handle!.queryAll('li');
        rows().value = [
            { id: 1, label: 'renamed' },
            { id: 2, label: 'b' },
        ];
        const lis = handle!.queryAll('li');
        expect(lis[0].textContent).toBe('renamed');
        expect(lis[0]).toBe(el1); // fresh item object, same key → same node
    });

    it('duplicate keys warn LJS-204 in dev and still render correctly', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { rows } = setup([
            { id: 7, label: 'x' },
            { id: 7, label: 'y' },
        ]);
        expect(handle!.queryAll('li').map((el) => el.textContent)).toEqual(['x', 'y']);
        rows().value = [
            { id: 7, label: 'y' },
            { id: 7, label: 'x' },
        ];
        expect(handle!.queryAll('li').map((el) => el.textContent)).toEqual(['y', 'x']);
        expect(spy.mock.calls.some((c) => String(c[0]).includes('LJS-204'))).toBe(true);
        spy.mockRestore();
    });

    it('unkeyed lists keep the positional diff (regression)', () => {
        let rows!: State<string[]>;
        const C: Component = (p, { state }) => {
            rows = state(['a', 'b']);
            return html`<ul>${() => rows.value.map((r) => html`<li>${r}</li>`)}</ul>`;
        };
        handle = t(C);
        const [el1] = handle.queryAll('li');
        rows.value = ['b', 'a'];
        const lis = handle.queryAll('li');
        expect(lis.map((el) => el.textContent)).toEqual(['b', 'a']);
        expect(lis[0]).toBe(el1); // positional: same node, new text
    });

    it('keys survive a branch detach/reattach (show/hide keeps identity)', () => {
        const a = { id: 1, label: 'a' };
        const b = { id: 2, label: 'b' };
        let rows!: State<Row[]>;
        let show!: State<boolean>;
        const C: Component = (p, { state }) => {
            rows = state([a, b]);
            show = state(true);
            return html`<div>${() =>
                show.value && html`<ul>${() => rows.value.map((r) => html`<li key="${r.id}">${r.label}</li>`)}</ul>`}</div>`;
        };
        handle = t(C);
        const [el1] = handle.queryAll('li');
        show.value = false;
        expect(handle.queryAll('li').length).toBe(0);
        show.value = true;
        expect(handle.queryAll('li')[0]).toBe(el1); // cached branch, same nodes
        rows.value = [b, a];
        expect(handle.queryAll('li')[1]).toBe(el1); // keys still live after reattach
    });

    it('key is never rendered as an attribute and never reaches component props', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Probe = component('keyprobe', { label: '' }, (props) => html`<i>${props.label}</i>`);
        const C: Component = () => html`<div>
            ${[{ id: 1 }].map((r) => html`<p key="${r.id}">x</p>`)}
            <${Probe} key="static" label="ok" />
        </div>`;
        handle = t(C);
        expect(handle.query('p')!.hasAttribute('key')).toBe(false);
        // No LJS-402 unknown-prop warning for key on a contract component
        expect(spy.mock.calls.some((c) => String(c[0]).includes('LJS-402'))).toBe(false);
        spy.mockRestore();
        expect(handle.query('i')!.textContent).toBe('ok');
    });

    it('nested views are compared STRUCTURALLY: a fresh identical html`` does not rebuild', () => {
        const Box = component('keybox', { label: '' }, (props, { state }) => {
            const n = state(0);
            return html`<button onclick="${() => n.value++}">${props.label}:${n}</button>`;
        });
        const a = { id: 1, label: 'a' };
        const b = { id: 2, label: 'b' };
        let rows!: State<Row[]>;
        const App: Component = (p, { state }) => {
            rows = state([a, b]);
            // The inner html`` is created FRESH on every map run — structural
            // equality must see through it (same template, same values)
            return html`<div>${() =>
                rows.value.map(
                    (r) => html`<section key="${r.id}"><${Box} label="${r.label}" />${html`<i>${r.label}</i>`}</section>`
                )}</div>`;
        };
        handle = t(App);
        const btn = handle.queryAll('button')[0];
        btn.click();
        expect(btn.textContent).toBe('a:1');

        rows.value = [b, a]; // reorder: fresh nested views, same content
        expect(handle.queryAll('button')[1]).toBe(btn); // instance moved, not rebuilt
        expect(handle.queryAll('button')[1].textContent).toBe('a:1');
    });

    it('big keyed shuffle: 200 rows reordered keep every node', () => {
        const data: Row[] = Array.from({ length: 200 }, (_, i) => ({ id: i, label: 'r' + i }));
        const { rows } = setup(data);
        const before = new Map(handle!.queryAll('li').map((el) => [el.getAttribute('data-id'), el]));

        const shuffled = [...data].reverse();
        rows().value = shuffled;
        const after = handle!.queryAll('li');
        expect(after.length).toBe(200);
        expect(after[0].textContent).toBe('r199');
        for (const el of after) {
            expect(el).toBe(before.get(el.getAttribute('data-id'))); // all moved, none rebuilt
        }
    });
});
