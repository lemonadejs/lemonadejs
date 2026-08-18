/**
 * <Organogram /> block tests — including the registry gate: verify() must
 * pass. Covered: the flat-list → tree build (roots, edges, parent 0 /
 * unknown as roots), click + bind + onchange(id, item), external bind
 * write without echo, collapse/expand (descendants drop + oncollapse,
 * keyed by id so selection survives), the imperative api (select, toggle,
 * expand/collapseAll, getZoom/setZoom, center with geometry), quick-search
 * filtering + fly-to that expands ancestors, cursor-anchored zoom, and
 * listener balance on unmount.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify, setRect } from 'lemonadejs/test';
import Organogram, { type OrgItem, type OrgId } from '@lemonadejs/organogram';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
});

const data = (): OrgItem[] => [
    { id: 1, name: 'Jorge', role: 'CEO', parent: 0, status: '#90EE90' },
    { id: 2, name: 'Antonio', role: 'Vice president', parent: 1, status: '#90EE90' },
    { id: 3, name: 'Manoel', role: 'Production manager', parent: 1, status: '#D3D3D3' },
    { id: 4, name: 'Pedro', role: 'Intern', parent: 3, status: '#90EE90' },
    { id: 5, name: 'Carlos', role: 'Intern', parent: 3, status: '#90EE90' },
];

const node = (id: OrgId) =>
    handle!.queryAll('.lm-organogram-node').find((el) => el.getAttribute('data-id') === String(id))!;
const nodes = () => handle!.queryAll('.lm-organogram-node');
const edges = () => handle!.queryAll('.lm-organogram-edges path');
const toggle = (id: OrgId) => node(id).querySelector('.lm-organogram-toggle') as HTMLElement;
const viewport = () => handle!.query('.lm-organogram-viewport') as HTMLElement;
const world = () => handle!.query('.lm-organogram-world') as HTMLElement;
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

describe('components/organogram', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Organogram);
        expect(report.pass).toBe(true);
    });

    it('builds a tree from the flat adjacency list: nodes, roots, edges', () => {
        handle = t(Organogram, { data: data() });
        expect(nodes()).toHaveLength(5);
        // one edge per parent→child link (1→2, 1→3, 3→4, 3→5)
        expect(edges()).toHaveLength(4);
        // names + roles land on the card
        expect(node(1).querySelector('.lm-organogram-name')!.textContent).toBe('Jorge');
        expect(node(3).querySelector('.lm-organogram-role')!.textContent).toBe('Production manager');
        // status drives the dot + the left accent
        expect(node(1).querySelector('.lm-organogram-status')).not.toBeNull();
        expect((node(1) as HTMLElement).style.borderLeftColor).toBeTruthy();
    });

    it('parent 0 and unknown parents are roots (a forest is supported)', () => {
        handle = t(Organogram, {
            data: [
                { id: 1, name: 'Root A', parent: 0 },
                { id: 2, name: 'Child', parent: 1 },
                { id: 3, name: 'Root B', parent: 99 }, // dangling parent → root
            ],
        });
        expect(nodes()).toHaveLength(3);
        expect(edges()).toHaveLength(1); // only 1→2
    });

    it('clicking a card selects: class, onchange(id, item)', () => {
        const changes: [OrgId, OrgItem][] = [];
        const d = data();
        handle = t(Organogram, { data: d, onchange: (id, it) => changes.push([id as OrgId, it as OrgItem]) });

        click(node(2));
        expect(node(2).classList.contains('lm-organogram-selected')).toBe(true);
        expect(changes).toEqual([[2, d[1]]]); // the source item object itself

        click(node(2)); // reselecting is a no-op
        expect(changes).toHaveLength(1);
    });

    it('bind is two-way: clicks write out, external writes flow in (no echo)', () => {
        const sel = store<OrgId>('');
        const changes: OrgId[] = [];
        handle = t(Organogram, { data: data(), bind: sel, onchange: (id) => changes.push(id as OrgId) });

        click(node(3));
        expect(sel.value).toBe(3);
        expect(changes).toEqual([3]);

        sel.value = 1; // parent write: selection moves, NO onchange echo
        expect(node(1).classList.contains('lm-organogram-selected')).toBe(true);
        expect(node(3).classList.contains('lm-organogram-selected')).toBe(false);
        expect(changes).toEqual([3]);
    });

    it('collapsing a branch drops its descendants and fires oncollapse', () => {
        const collapses: [OrgId, boolean][] = [];
        handle = t(Organogram, { data: data(), oncollapse: (id: OrgId, c: boolean) => collapses.push([id, c]) });
        expect(nodes()).toHaveLength(5);

        click(toggle(3)); // hide Pedro + Carlos
        expect(nodes()).toHaveLength(3);
        expect(node(4)).toBeUndefined();
        expect(edges()).toHaveLength(2); // 3→4, 3→5 gone
        expect(collapses).toEqual([[3, true]]);

        click(toggle(3)); // expand again
        expect(nodes()).toHaveLength(5);
        expect(collapses).toEqual([[3, true], [3, false]]);
    });

    it('leaf cards carry no collapse toggle', () => {
        handle = t(Organogram, { data: data() });
        expect(node(4).querySelector('.lm-organogram-toggle')).toBeNull();
        expect(node(1).querySelector('.lm-organogram-toggle')).not.toBeNull();
    });

    it('api: select fires onchange; toggle / expandAll / collapseAll drive visibility', () => {
        const changes: OrgId[] = [];
        let api!: {
            select: (id: OrgId) => void; toggle: (id: OrgId) => void;
            expandAll: () => void; collapseAll: () => void;
        };
        handle = t(Organogram, {
            data: data(),
            onchange: (id) => changes.push(id as OrgId),
            ref: (a: typeof api) => (api = a),
        });

        api.select(5);
        expect(node(5).classList.contains('lm-organogram-selected')).toBe(true);
        expect(changes).toEqual([5]);

        api.toggle(3);
        expect(node(4)).toBeUndefined();
        api.toggle(3);
        expect(node(4)).not.toBeUndefined();

        api.collapseAll();
        // only roots remain visible (every parent collapsed)
        expect(nodes()).toHaveLength(1);
        expect(node(1)).not.toBeUndefined();

        api.expandAll();
        expect(nodes()).toHaveLength(5);
    });

    it('api: getZoom / setZoom are clamped to [minzoom, maxzoom] and fire onzoom', () => {
        const zooms: number[] = [];
        let api!: { getZoom: () => number; setZoom: (s: number) => void };
        handle = t(Organogram, {
            data: data(), minzoom: 0.5, maxzoom: 2, fit: false,
            onzoom: (s: number) => zooms.push(s),
            ref: (a: typeof api) => (api = a),
        });
        setRect(viewport(), { width: 800, height: 600 });

        expect(api.getZoom()).toBe(1);
        api.setZoom(5);            // over the cap
        expect(api.getZoom()).toBe(2);
        api.setZoom(0.1);          // under the floor
        expect(api.getZoom()).toBe(0.5);
        expect(zooms).toEqual([2, 0.5]);
    });

    it('api: center moves the world so the node sits near the middle', () => {
        let api!: { center: (id: OrgId) => void };
        handle = t(Organogram, { data: data(), fit: false, ref: (a: typeof api) => (api = a) });
        setRect(viewport(), { width: 800, height: 600 });
        const before = world().style.transform;

        api.center(5);
        expect(world().style.transform).not.toBe(before);
        expect(world().style.transform).toContain('translate');
    });

    it('quick-search filters by name/role and flies to a pick, expanding ancestors', () => {
        handle = t(Organogram, { data: data() });
        setRect(viewport(), { width: 800, height: 600 });

        // collapse Manoel's branch so Pedro is hidden, then search to him
        click(toggle(3));
        expect(node(4)).toBeUndefined();

        const input = handle.query('.lm-organogram-search input') as HTMLInputElement;
        input.value = 'pedro';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const results = handle.queryAll('.lm-organogram-results li');
        expect(results).toHaveLength(1);
        expect(results[0].textContent).toContain('Pedro');

        // picking expands the ancestor branch and selects the node
        results[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        expect(node(4)).not.toBeUndefined();
        expect(node(4).classList.contains('lm-organogram-selected')).toBe(true);
    });

    it('cards are buttons for AT: role, aria-pressed tracks selection, label carries status + reports-to', () => {
        handle = t(Organogram, {
            data: data(),
            statuslabels: { '#90EE90': 'Active', '#D3D3D3': 'Inactive' },
        });

        expect(node(2).getAttribute('role')).toBe('button');
        expect(node(2).getAttribute('aria-pressed')).toBe('false');
        click(node(2));
        expect(node(2).getAttribute('aria-pressed')).toBe('true');
        expect(node(1).getAttribute('aria-pressed')).toBe('false');

        // the accessible name replaces the CSS-only cues: status label + hierarchy
        const label = node(2).getAttribute('aria-label')!;
        expect(label).toContain('Antonio');
        expect(label).toContain('Vice president');
        expect(label).toContain('status Active');
        expect(label).toContain('reports to Jorge');
        // a root reports to nobody
        expect(node(1).getAttribute('aria-label')).not.toContain('reports to');
    });

    it('search results are a keyboard-navigable listbox: arrows move the highlight, Enter picks it', () => {
        handle = t(Organogram, { data: data() });
        setRect(viewport(), { width: 800, height: 600 });

        const input = handle.query('.lm-organogram-search input') as HTMLInputElement;
        const press = (k: string) =>
            input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

        input.value = 'intern'; // Pedro (4) + Carlos (5)
        input.dispatchEvent(new Event('input', { bubbles: true }));

        const list = handle.query('.lm-organogram-results')!;
        expect(list.getAttribute('role')).toBe('listbox');
        const options = handle.queryAll('.lm-organogram-results li');
        expect(options).toHaveLength(2);
        expect(options.every((o) => o.getAttribute('role') === 'option' && !!o.id)).toBe(true);
        expect(input.getAttribute('aria-activedescendant')).toBeNull(); // nothing highlighted yet

        press('ArrowDown'); // → Pedro
        expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
        expect(options[0].getAttribute('aria-selected')).toBe('true');
        press('ArrowDown'); // → Carlos
        expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
        press('ArrowDown'); // clamped at the last option
        expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
        press('ArrowUp'); // back to Pedro
        expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
        press('ArrowDown'); // → Carlos again

        press('Enter'); // Enter picks the HIGHLIGHTED option, not matches[0]
        expect(node(5).classList.contains('lm-organogram-selected')).toBe(true);
    });

    it('search Enter with no highlight still picks the first match', () => {
        handle = t(Organogram, { data: data() });
        setRect(viewport(), { width: 800, height: 600 });

        const input = handle.query('.lm-organogram-search input') as HTMLInputElement;
        input.value = 'intern';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(node(4).classList.contains('lm-organogram-selected')).toBe(true); // Pedro is matches[0]
    });

    const left = (id: OrgId) => parseFloat((node(id) as HTMLElement).style.left);
    const top = (id: OrgId) => parseFloat((node(id) as HTMLElement).style.top);

    it('default (compact off) spreads leaf children in a horizontal row', () => {
        handle = t(Organogram, { data: data(), fit: false });
        // Pedro (4) and Carlos (5) are Manoel's leaf children → same row, different columns
        expect(top(4)).toBe(top(5));
        expect(left(4)).not.toBe(left(5));
    });

    it('compact stacks leaf children into an indented vertical list', () => {
        handle = t(Organogram, { data: data(), compact: true, fit: false });
        // stacked → same column (x), different rows (y), indented right of the parent
        expect(left(4)).toBe(left(5));
        expect(top(4)).not.toBe(top(5));
        expect(left(4)).toBeGreaterThan(left(3));
    });

    it('per-item compact overrides the global default both ways', () => {
        // force Manoel (3) to stack even though the chart is not compact
        const forced = data().map((it) => (it.id === 3 ? { ...it, compact: true } : it));
        handle = t(Organogram, { data: forced, compact: false, fit: false });
        expect(left(4)).toBe(left(5)); // stacked despite compact:false globally

        handle.unmount();
        // force Manoel (3) to stay a row even though the chart IS compact
        const unforced = data().map((it) => (it.id === 3 ? { ...it, compact: false } : it));
        handle = t(Organogram, { data: unforced, compact: true, fit: false });
        expect(top(4)).toBe(top(5)); // a row despite compact:true globally
    });

    it('horizontal orientation lays depth along x instead of y', () => {
        handle = t(Organogram, { data: data(), orientation: 'horizontal', fit: false });
        const root = node(1) as HTMLElement;
        const child = node(2) as HTMLElement;
        // child is one level deeper → further right, same-ish row band
        expect(parseFloat(child.style.left)).toBeGreaterThan(parseFloat(root.style.left));
    });

    it('numeric ids round-trip through selection (id type is string | number)', () => {
        const changes: [OrgId, OrgItem][] = [];
        const d = data();
        handle = t(Organogram, { data: d, onchange: (id, it) => changes.push([id as OrgId, it as OrgItem]) });
        click(node(4));
        expect(changes).toEqual([[4, d[3]]]); // raw 4, not '4'
        expect(node(4).getAttribute('data-id')).toBe('4');
    });

    it('listener balance: unmount removes everything it added', () => {
        const targets: EventTarget[] = [window, document, document.body];
        const adds = targets.map((tg) => vi.spyOn(tg, 'addEventListener'));
        const removes = targets.map((tg) => vi.spyOn(tg, 'removeEventListener'));

        const h = t(Organogram, { data: data() });
        setRect(h.query('.lm-organogram-viewport')!, { width: 400, height: 300 });
        h.unmount();

        for (let i = 0; i < targets.length; i++) {
            expect(adds[i].mock.calls.length).toBe(removes[i].mock.calls.length);
        }
    });
});
