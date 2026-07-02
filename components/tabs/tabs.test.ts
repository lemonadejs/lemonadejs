/**
 * <Tabs /> block tests — including the registry gate: verify() must pass.
 * v5 parity: data/children tabs, selected index (bound two-way), panels
 * kept alive across switches, position/round, allowcreate, drag sorting,
 * keyboard, api open/create + the v5 event set.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Tabs, { type TabItem } from '@lemonadejs/tabs';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
});

const data = (): TabItem[] => [
    { title: 'One', content: '<b>first</b>', icon: 'home' },
    { title: 'Two', content: 'second' },
    { title: 'Three', content: 'third' },
];

const headers = () => handle!.queryAll('.lm-tabs-tab');
const panels = () => handle!.queryAll('.lm-tabs-content > *');
const selectedIndexes = () => ({
    header: headers().findIndex((el) => el.classList.contains('lm-tabs-selected')),
    panel: panels().findIndex((el) => el.classList.contains('lm-tabs-selected')),
});

describe('components/tabs', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Tabs);
        expect(report.pass).toBe(true);
    });

    it('renders headers and live panels from data, first tab selected', () => {
        handle = t(Tabs, { data: data() });
        expect(headers().map((el) => el.textContent)).toEqual(['One', 'Two', 'Three']);
        expect(headers()[0].getAttribute('data-icon')).toBe('home');
        expect(headers()[1].hasAttribute('data-icon')).toBe(false);
        // content is trusted HTML (v5: innerHTML), all panels stay in the DOM
        expect(panels().length).toBe(3);
        expect(panels()[0].querySelector('b')!.textContent).toBe('first');
        expect(selectedIndexes()).toEqual({ header: 0, panel: 0 });
    });

    it('clicking a header switches the selection', () => {
        handle = t(Tabs, { data: data() });
        headers()[2].click();
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });
        // panels were never unmounted
        expect(panels().length).toBe(3);
    });

    it('keeps panel DOM alive across switches (element identity)', () => {
        handle = t(Tabs, { data: data() });
        const first = panels()[0];
        const marker = document.createElement('i');
        first.appendChild(marker); // runtime state inside the panel
        headers()[1].click();
        headers()[0].click();
        expect(panels()[0]).toBe(first);
        expect(first.contains(marker)).toBe(true);
    });

    it('element children become tabs: title/selected/data-icon extracted, node kept', () => {
        const one = document.createElement('div');
        one.setAttribute('title', 'A');
        one.textContent = 'panel a';
        const two = document.createElement('div');
        two.setAttribute('title', 'B');
        two.setAttribute('selected', 'true');
        two.setAttribute('data-icon', 'star');
        handle = t(Tabs, { children: [one, two] });
        expect(headers().map((el) => el.textContent)).toEqual(['A', 'B']);
        expect(headers()[1].getAttribute('data-icon')).toBe('star');
        expect(panels()[0]).toBe(one); // the child IS the panel, v5 extract()
        expect(selectedIndexes()).toEqual({ header: 1, panel: 1 }); // selected attribute wins
    });

    it('supports template children through a parent component', () => {
        const App: Component = () =>
            html`<main><${Tabs}><div title="X">x body</div><div title="Y">y body</div></${Tabs}></main>`;
        handle = t(App);
        expect(headers().map((el) => el.textContent)).toEqual(['X', 'Y']);
        expect(panels()[0].textContent).toBe('x body');
        expect(selectedIndexes()).toEqual({ header: 0, panel: 0 });
    });

    it('selected sets the initial index; a data item selected flag wins', () => {
        handle = t(Tabs, { data: data(), selected: 1 });
        expect(selectedIndexes()).toEqual({ header: 1, panel: 1 });
        handle.unmount();

        const flagged = data();
        flagged[2].selected = true;
        handle = t(Tabs, { data: flagged, selected: 1 });
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });
    });

    it('bind is the live two-way selected index', () => {
        const index = store(2);
        handle = t(Tabs, { data: data(), bind: index, selected: 0 });
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 }); // bind wins

        headers()[0].click(); // user interaction writes out
        expect(index.value).toBe(0);

        index.value = 1; // external write flows in
        expect(selectedIndexes()).toEqual({ header: 1, panel: 1 });
    });

    it('fires onopen then onchange on user selection only, never on reselect', () => {
        const index = store(0);
        const calls: string[] = [];
        handle = t(Tabs, {
            data: data(),
            bind: index,
            onopen: (i: number) => calls.push('open:' + i),
            onchange: (i: number, old: number) => calls.push('change:' + i + '<-' + old),
        });

        headers()[0].click(); // already selected: silent (v5 guard)
        expect(calls).toEqual([]);

        headers()[2].click();
        expect(calls).toEqual(['open:2', 'change:2<-0']); // v5 order: open, change

        index.value = 1; // programmatic write: silent
        expect(calls).toEqual(['open:2', 'change:2<-0']);
    });

    it('api open(index) selects; out-of-range indexes are ignored', () => {
        let api: { open: (i: number) => void } | null = null;
        const changes: number[] = [];
        handle = t(Tabs, {
            data: data(),
            ref: (a: { open: (i: number) => void }) => (api = a),
            onchange: (i: number) => changes.push(i),
        });
        api!.open(2);
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });
        expect(changes).toEqual([2]);

        api!.open(99); // v5 select(): do not select tabs that do not exist
        api!.open(-1);
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });
        expect(changes).toEqual([2]);
    });

    it('api create() appends, inserts at a position, and can select', () => {
        let api: { create: (item: TabItem, position?: number | null, select?: boolean) => void } | null = null;
        const created: [TabItem, number][] = [];
        handle = t(Tabs, {
            data: data(),
            ref: (a: { create: (item: TabItem, position?: number | null, select?: boolean) => void }) => (api = a),
            oncreate: (item: TabItem, position: number) => created.push([item, position]),
        });

        api!.create({ title: 'New', content: 'fresh' }, null, true);
        expect(headers().map((el) => el.textContent)).toEqual(['One', 'Two', 'Three', 'New']);
        expect(selectedIndexes()).toEqual({ header: 3, panel: 3 }); // select = true
        expect(created.length).toBe(1);
        expect(created[0][0].title).toBe('New');
        expect(created[0][1]).toBe(3);

        api!.create({ title: 'Mid' }, 1);
        expect(headers().map((el) => el.textContent)).toEqual(['One', 'Mid', 'Two', 'Three', 'New']);
        expect(created[1][1]).toBe(1);
    });

    it('onbeforecreate returning false cancels; non-object items are rejected', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        let api: { create: (item: TabItem) => void } | null = null;
        const created: TabItem[] = [];
        handle = t(Tabs, {
            data: data(),
            ref: (a: { create: (item: TabItem) => void }) => (api = a),
            onbeforecreate: () => false,
            oncreate: (item: TabItem) => created.push(item),
        });
        api!.create({ title: 'Blocked' });
        expect(headers().length).toBe(3);
        expect(created).toEqual([]);

        api!.create('nope' as never); // deliberately invalid — v5: console.error, no tab
        expect(error).toHaveBeenCalledWith('Item must be an object');
        expect(headers().length).toBe(3);
    });

    it('allowcreate shows the add button which creates a selected Untitled tab', () => {
        handle = t(Tabs, { data: data() });
        expect(handle.query('.lm-tabs-insert-button')).toBeNull();
        handle.unmount();

        handle = t(Tabs, { data: data(), allowcreate: true });
        const button = handle.query('.lm-tabs-insert-button')!;
        expect(button.textContent).toBe('add');
        button.click();
        expect(headers().map((el) => el.textContent)).toEqual(['One', 'Two', 'Three', 'Untitled']);
        expect(selectedIndexes()).toEqual({ header: 3, panel: 3 });
    });

    it('exposes position and round as data attributes', () => {
        handle = t(Tabs, { data: data(), position: 'bottom', round: true });
        const root = handle.query('.lm-tabs')!;
        expect(root.getAttribute('data-position')).toBe('bottom');
        expect(root.getAttribute('data-round')).toBe('true');
        handle.unmount();

        handle = t(Tabs, { data: data() });
        expect(handle.query('.lm-tabs')!.hasAttribute('data-position')).toBe(false);
        expect(handle.query('.lm-tabs')!.hasAttribute('data-round')).toBe(false);
    });

    it('drag sorting reorders tabs, selects the moved tab and fires onchangeposition', () => {
        const moves: [number, number][] = [];
        handle = t(Tabs, {
            data: data(),
            onchangeposition: (from: number, to: number) => moves.push([from, to]),
        });
        const firstPanel = panels()[0];

        headers()[0].dispatchEvent(new Event('dragstart', { bubbles: true }));
        headers()[2].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));

        expect(headers().map((el) => el.textContent)).toEqual(['Two', 'Three', 'One']);
        expect(moves).toEqual([[0, 2]]);
        // v5: the moved tab is selected at its new position
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });
        // the panel element MOVED with its tab — same node, new position
        expect(panels()[2]).toBe(firstPanel);
    });

    it('keyboard: Enter selects, arrows move focus and focus opens (v5)', () => {
        handle = t(Tabs, { data: data() });

        // Enter on a header selects it
        headers()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(selectedIndexes()).toEqual({ header: 2, panel: 2 });

        // ArrowLeft moves focus to the previous header; focusin opens it
        headers()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(document.activeElement).toBe(headers()[1]);
        expect(selectedIndexes()).toEqual({ header: 1, panel: 1 });

        // ArrowRight from the last tab clamps (v5)
        headers()[1].click();
        headers()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(document.activeElement).toBe(headers()[2]);
        headers()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(document.activeElement).toBe(headers()[2]);
    });

    it('combines data and element children, data first (v5 extract order)', () => {
        const child = document.createElement('div');
        child.setAttribute('title', 'Child');
        handle = t(Tabs, { data: [{ title: 'Data' }], children: [child] });
        expect(headers().map((el) => el.textContent)).toEqual(['Data', 'Child']);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Tabs} selected="1" round="true" data="${data()}" /></main>`;
        handle = t(App);
        expect(selectedIndexes()).toEqual({ header: 1, panel: 1 });
        expect(handle.query('.lm-tabs')!.getAttribute('data-round')).toBe('true');
    });
});

describe('a11y', () => {
    it('roving tabindex: only the selected tab is in the tab order', () => {
        handle = t(Tabs, { data: [{ title: 'A' }, { title: 'B' }, { title: 'C' }], selected: 1 });
        const tabs = handle.queryAll('.lm-tabs-tab');
        expect(tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
        expect(handle.query('.lm-tabs-headers')!.getAttribute('aria-orientation')).toBe('horizontal');
        // selecting another tab moves the tab stop
        (tabs[2] as HTMLElement).click();
        expect(tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    });
});
