/**
 * <TreeView /> block tests — including the registry gate: verify() must
 * pass. The recursion probe: one recursive view function, keyed <li>s at
 * every depth. Covered: nested render + keep-alive collapse, select via
 * click + two-way bind, onchange/ontoggle, keyboard (Arrows + Enter),
 * api open/close/select/toggle, keyed reorder of ROOT and NESTED siblings
 * preserving DOM identity, in-place child insertion, 5-level nesting,
 * listener balance on unmount.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import TreeView, { type TreeNode, type TreeNodeId } from '@lemonadejs/treeview';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
});

const data = (): TreeNode[] => [
    {
        id: 'src',
        label: 'src',
        icon: 'folder',
        open: true,
        children: [
            { id: 'index', label: 'index.ts' },
            { id: 'style', label: 'style.css' },
            {
                id: 'utils',
                label: 'utils',
                children: [{ id: 'walk', label: 'walk.ts' }],
            },
        ],
    },
    {
        id: 'docs',
        label: 'docs',
        children: [{ id: 'readme', label: 'README.md' }],
    },
    { id: 'pkg', label: 'package.json' },
];

const li = (id: string) =>
    handle!.queryAll('.lm-treeview-node').find((el) => el.getAttribute('data-id') === id)!;
const row = (id: string) => li(id).querySelector('.lm-treeview-row') as HTMLElement;
const label = (id: string) => li(id).querySelector('.lm-treeview-label') as HTMLElement;
const selectedRows = () => handle!.queryAll('.lm-treeview-row.lm-treeview-selected');
// direct child items of a parent node (its first descendant group is its own)
const childItems = (id: string) =>
    [...(li(id).querySelector('.lm-treeview-group')?.children ?? [])] as HTMLElement[];
const key = (k: string) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });

describe('components/treeview', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(TreeView);
        expect(report.pass).toBe(true);
    });

    it('renders nested data: roles, labels, groups at every level', () => {
        handle = t(TreeView, { data: data() });
        expect(handle.query('[role="tree"]')).not.toBeNull();
        expect(handle.queryAll('[role="treeitem"]')).toHaveLength(8);
        expect(handle.queryAll('[role="group"]')).toHaveLength(3);
        expect(label('walk').textContent).toBe('walk.ts');
        // parents carry aria-expanded, leaves do not
        expect(li('src').getAttribute('aria-expanded')).toBe('true'); // open: true
        expect(li('docs').getAttribute('aria-expanded')).toBe('false');
        expect(li('pkg').hasAttribute('aria-expanded')).toBe(false);
        // icon keyword lands on the label
        expect(label('src').getAttribute('data-icon')).toBe('folder');
        expect(label('docs').hasAttribute('data-icon')).toBe(false);
    });

    it('collapse keeps the child DOM ALIVE (visibility is CSS, not unmount)', () => {
        handle = t(TreeView, { data: data() });
        // docs is collapsed — its child is still real, attached DOM
        const child = li('readme');
        expect(child.isConnected).toBe(true);
        // open + close again: the exact same element survives
        row('docs').querySelector<HTMLElement>('.lm-treeview-toggle')!.click();
        expect(li('docs').getAttribute('aria-expanded')).toBe('true');
        row('docs').querySelector<HTMLElement>('.lm-treeview-toggle')!.click();
        expect(li('docs').getAttribute('aria-expanded')).toBe('false');
        expect(li('readme')).toBe(child);
    });

    it('clicking a label selects: class, aria-selected, onchange(id, node)', () => {
        const tree = data();
        const changes: [TreeNodeId, TreeNode][] = [];
        // Bindable types onchange as (value, oldValue) — params stay untyped
        // here and the runtime contract (id, node) is asserted below
        handle = t(TreeView, { data: tree, onchange: (id, node) => changes.push([id as TreeNodeId, node as TreeNode]) });
        expect(selectedRows()).toHaveLength(0);

        label('index').click(); // bubbles to the row
        expect(selectedRows()).toHaveLength(1);
        expect(li('index').getAttribute('aria-selected')).toBe('true');
        expect(changes).toEqual([['index', tree[0].children![0]]]); // the NODE object itself

        label('pkg').click();
        expect(li('index').getAttribute('aria-selected')).toBe('false');
        expect(li('pkg').getAttribute('aria-selected')).toBe('true');
        expect(changes).toHaveLength(2);

        label('pkg').click(); // reselecting the current node is a no-op
        expect(changes).toHaveLength(2);
    });

    it('bind is two-way: clicks write out, external writes flow in (no echo)', () => {
        const sel = store('');
        const changes: TreeNodeId[] = [];
        handle = t(TreeView, { data: data(), bind: sel, onchange: (id) => changes.push(id as TreeNodeId) });

        row('style').click();
        expect(sel.value).toBe('style');
        expect(changes).toEqual(['style']);

        sel.value = 'docs'; // parent write: selection moves, NO onchange echo
        expect(li('docs').getAttribute('aria-selected')).toBe('true');
        expect(li('style').getAttribute('aria-selected')).toBe('false');
        expect(changes).toEqual(['style']);
    });

    it('chevron click toggles without selecting; ontoggle fires (id, open)', () => {
        const toggles: [TreeNodeId, boolean][] = [];
        handle = t(TreeView, { data: data(), ontoggle: (id: TreeNodeId, open: boolean) => toggles.push([id, open]) });
        const chevron = row('docs').querySelector<HTMLElement>('.lm-treeview-toggle')!;

        chevron.click();
        expect(li('docs').getAttribute('aria-expanded')).toBe('true');
        expect(toggles).toEqual([['docs', true]]);
        expect(selectedRows()).toHaveLength(0); // toggling is not selecting

        chevron.click();
        expect(li('docs').getAttribute('aria-expanded')).toBe('false');
        expect(toggles).toEqual([['docs', true], ['docs', false]]);
    });

    it('keyboard: ArrowRight opens, then dives; ArrowLeft closes, then climbs', () => {
        handle = t(TreeView, { data: data() });
        const docs = row('docs');
        docs.focus();

        docs.dispatchEvent(key('ArrowRight')); // closed parent → opens
        expect(li('docs').getAttribute('aria-expanded')).toBe('true');

        docs.dispatchEvent(key('ArrowRight')); // open parent → first child
        expect(document.activeElement).toBe(row('readme'));

        row('readme').dispatchEvent(key('ArrowLeft')); // leaf → parent
        expect(document.activeElement).toBe(docs);

        docs.dispatchEvent(key('ArrowLeft')); // open parent → closes
        expect(li('docs').getAttribute('aria-expanded')).toBe('false');
    });

    it('keyboard: ArrowDown/ArrowUp move across VISIBLE nodes only', () => {
        handle = t(TreeView, { data: data() });
        row('src').focus();

        row('src').dispatchEvent(key('ArrowDown')); // into the open src group
        expect(document.activeElement).toBe(row('index'));

        row('index').dispatchEvent(key('ArrowDown'));
        expect(document.activeElement).toBe(row('style'));

        row('style').dispatchEvent(key('ArrowDown'));
        expect(document.activeElement).toBe(row('utils'));

        row('utils').dispatchEvent(key('ArrowDown')); // utils is CLOSED → walk.ts skipped
        expect(document.activeElement).toBe(row('docs'));

        row('docs').dispatchEvent(key('ArrowDown')); // docs closed → readme skipped
        expect(document.activeElement).toBe(row('pkg'));

        row('pkg').dispatchEvent(key('ArrowDown')); // last visible: stays
        expect(document.activeElement).toBe(row('pkg'));

        row('pkg').dispatchEvent(key('ArrowUp'));
        expect(document.activeElement).toBe(row('docs'));
    });

    it('keyboard: Enter selects the focused node', () => {
        const sel = store('');
        handle = t(TreeView, { data: data(), bind: sel });
        row('utils').focus();
        row('utils').dispatchEvent(key('Enter'));
        expect(sel.value).toBe('utils');
        expect(li('utils').getAttribute('aria-selected')).toBe('true');
    });

    it('api: open/close/toggle drive expansion and fire ontoggle', () => {
        const toggles: [TreeNodeId, boolean][] = [];
        let api!: { open: (id: TreeNodeId) => void; close: (id: TreeNodeId) => void; toggle: (id: TreeNodeId) => void; select: (id: TreeNodeId) => void };
        handle = t(TreeView, {
            data: data(),
            ontoggle: (id: TreeNodeId, open: boolean) => toggles.push([id, open]),
            ref: (a: typeof api) => (api = a),
        });

        api.open('utils');
        expect(li('utils').getAttribute('aria-expanded')).toBe('true');
        api.open('utils'); // already open: no-op, no event
        expect(toggles).toEqual([['utils', true]]);

        api.close('utils');
        expect(li('utils').getAttribute('aria-expanded')).toBe('false');

        api.toggle('docs');
        expect(li('docs').getAttribute('aria-expanded')).toBe('true');

        api.open('pkg'); // a leaf cannot open
        expect(li('pkg').hasAttribute('aria-expanded')).toBe(false);
        expect(toggles).toEqual([['utils', true], ['utils', false], ['docs', true]]);
    });

    it('api: select selects and fires onchange; unknown ids are ignored', () => {
        const changes: TreeNodeId[] = [];
        let api!: { select: (id: TreeNodeId) => void };
        handle = t(TreeView, {
            data: data(),
            onchange: (id) => changes.push(id as TreeNodeId),
            ref: (a: typeof api) => (api = a),
        });

        api.select('readme');
        expect(li('readme').getAttribute('aria-selected')).toBe('true');
        expect(changes).toEqual(['readme']);

        api.select('nope');
        expect(changes).toEqual(['readme']); // nothing happened
        expect(selectedRows()).toHaveLength(1);
    });

    it('keyed reorder of ROOT siblings MOVES the same DOM nodes', () => {
        const tree = data();
        const s = store(tree);
        handle = t(TreeView, { data: s });
        const [src, docs, pkg] = [li('src'), li('docs'), li('pkg')];

        s.value = [tree[2], tree[0], tree[1]]; // pkg, src, docs
        const roots = handle.queryAll('.lm-treeview-tree > .lm-treeview-node');
        expect(roots.map((el) => el.getAttribute('data-id'))).toEqual(['pkg', 'src', 'docs']);
        expect(roots[0]).toBe(pkg); // identity preserved — moved, not rebuilt
        expect(roots[1]).toBe(src);
        expect(roots[2]).toBe(docs);
    });

    it('keyed reorder of NESTED siblings preserves DOM identity (recursion probe)', () => {
        const tree = data();
        const s = store(tree);
        handle = t(TreeView, { data: s });
        const [a, b, c] = [li('index'), li('style'), li('utils')];

        tree[0].children = [tree[0].children![2], tree[0].children![0], tree[0].children![1]];
        s.touch(); // in-place mutation + touch, the v6 way

        const kids = childItems('src');
        expect(kids.map((el) => el.getAttribute('data-id'))).toEqual(['utils', 'index', 'style']);
        expect(kids[0]).toBe(c);
        expect(kids[1]).toBe(a);
        expect(kids[2]).toBe(b);
    });

    it('reorder keeps selection and open state (they key off node ids)', () => {
        const tree = data();
        const s = store(tree);
        const sel = store('style');
        handle = t(TreeView, { data: s, bind: sel });
        expect(li('style').getAttribute('aria-selected')).toBe('true');

        s.value = [tree[1], tree[2], tree[0]];
        expect(li('style').getAttribute('aria-selected')).toBe('true');
        expect(li('src').getAttribute('aria-expanded')).toBe('true'); // still open
    });

    it('inserting a child in place (mutate + touch) keeps sibling identity', () => {
        const tree = data();
        const s = store(tree);
        handle = t(TreeView, { data: s });
        const existing = li('index');

        tree[0].children!.splice(1, 0, { id: 'new', label: 'new.ts' });
        s.touch();

        const kids = childItems('src');
        expect(kids.map((el) => el.getAttribute('data-id'))).toEqual(['index', 'new', 'style', 'utils']);
        expect(kids[0]).toBe(existing);
    });

    it('handles deep nesting: 5 levels render, open, navigate and select', () => {
        const deep: TreeNode[] = [{
            id: 'l1', label: 'one', open: true, children: [{
                id: 'l2', label: 'two', open: true, children: [{
                    id: 'l3', label: 'three', open: true, children: [{
                        id: 'l4', label: 'four', open: true, children: [{
                            id: 'l5', label: 'five',
                        }],
                    }],
                }],
            }],
        }];
        const sel = store('');
        handle = t(TreeView, { data: deep, bind: sel });
        expect(handle.queryAll('[role="treeitem"]')).toHaveLength(5);
        // structural depth: l5 sits inside 4 nested groups
        expect(li('l5').closest('.lm-treeview-group')!.closest('li')!.getAttribute('data-id')).toBe('l4');
        expect(handle.queryAll('.lm-treeview-group')).toHaveLength(4);

        // keyboard walks all the way down (every level is open)
        row('l1').focus();
        for (const id of ['l2', 'l3', 'l4', 'l5']) {
            (document.activeElement as HTMLElement).dispatchEvent(key('ArrowDown'));
            expect(document.activeElement).toBe(row(id));
        }
        (document.activeElement as HTMLElement).dispatchEvent(key('Enter'));
        expect(sel.value).toBe('l5');

        // collapsing the ROOT hides the whole chain but keeps the DOM
        const l5 = li('l5');
        row('l1').dispatchEvent(key('ArrowLeft'));
        expect(li('l1').getAttribute('aria-expanded')).toBe('false');
        expect(li('l5')).toBe(l5); // alive, identical
    });

    it('numeric ids work end to end (id type is string | number)', () => {
        const tree: TreeNode[] = [
            { id: 1, label: 'one', open: true, children: [{ id: 2, label: 'two' }] },
            { id: 3, label: 'three' },
        ];
        const changes: [TreeNodeId, TreeNode][] = [];
        handle = t(TreeView, { data: tree, onchange: (id, n) => changes.push([id as TreeNodeId, n as TreeNode]) });

        row('2').click();
        expect(changes).toEqual([[2, tree[0].children![0]]]); // raw id, not '2'
        expect(li('2').getAttribute('aria-selected')).toBe('true');
    });

    it('listener balance: unmount removes everything it added', () => {
        const targets: EventTarget[] = [document, window, document.body];
        const adds = targets.map((tg) => vi.spyOn(tg, 'addEventListener'));
        const removes = targets.map((tg) => vi.spyOn(tg, 'removeEventListener'));

        const h = t(TreeView, { data: data() });
        h.queryAll('.lm-treeview-row')[0].click();
        h.queryAll('.lm-treeview-row')[0].dispatchEvent(key('ArrowDown'));
        h.unmount();

        for (let i = 0; i < targets.length; i++) {
            expect(adds[i].mock.calls.length).toBe(removes[i].mock.calls.length);
        }
    });
});
