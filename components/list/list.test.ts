/**
 * <List /> block tests — including the registry gate: verify() must pass.
 * Full v5 parity (search across every field, onbeforesearch/onsearch,
 * pagination + onchangepage, remote mode via total, empty message,
 * setPage) plus the v6/MUI surface: default item renderer (avatar/icon,
 * secondary text), dense/divider, onitemclick, custom render views,
 * mutate + touch() by reference, and virtual scrolling.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import List, { type ListItem } from '@lemonadejs/list';

type Api = {
    setPage(p: number): void;
    getPage(): number;
    setSearch(q: string): void;
    refresh(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const make = (n: number): ListItem[] =>
    Array.from({ length: n }, (_, i) => ({ title: 'Item ' + (i + 1), secondary: 'Detail ' + (i + 1) }));

const open = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(List, { ...props, ref: (a: Api) => (api = a) });
    return api!;
};

const renderedItems = () => handle!.queryAll('.lm-list-item');
const primary = (i: number) => renderedItems()[i].querySelector('.lm-list-primary')!.textContent;
const pageButtons = () => handle!.queryAll('.lm-list-pages button, .lm-list-gap').map((el) => el.textContent);
const scroller = () => handle!.query('.lm-list-content') as HTMLElement;
const scrollTo = (top: number) => {
    Object.defineProperty(scroller(), 'scrollTop', { value: top, writable: true });
    scroller().dispatchEvent(new Event('scroll'));
};

describe('components/list — the v5 list as the MUI-style List', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(List).pass).toBe(true);
    });

    it('default renderer: title + secondary text per record, list semantics', () => {
        open({ data: [{ title: 'Inbox', secondary: 'Two new messages' }, { title: 'Drafts' }] });
        expect(scroller().getAttribute('role')).toBe('list');
        const items = renderedItems();
        expect(items).toHaveLength(2);
        expect(items[0].getAttribute('role')).toBe('listitem');
        expect(primary(0)).toBe('Inbox');
        expect(items[0].querySelector('.lm-list-secondary')!.textContent).toBe('Two new messages');
        expect(items[1].querySelector('.lm-list-secondary')).toBeNull(); // only when provided
    });

    it('default renderer: avatar wins over icon, icon renders alone', () => {
        open({
            data: [
                { title: 'Ana', avatar: 'https://example.com/a.png', icon: 'person' },
                { title: 'Mail', icon: 'mail' },
                { title: 'Bare' },
            ],
        });
        const items = renderedItems();
        const img = items[0].querySelector('.lm-list-avatar') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('https://example.com/a.png');
        expect(items[0].querySelector('.lm-list-icon')).toBeNull(); // avatar wins
        expect(items[1].querySelector('.lm-list-icon')!.textContent).toBe('mail');
        expect(items[2].querySelector('.lm-list-avatar')).toBeNull();
        expect(items[2].querySelector('.lm-list-icon')).toBeNull();
    });

    it('primitive items render as plain text rows', () => {
        open({ data: ['Alpha', 42] });
        expect(primary(0)).toBe('Alpha');
        expect(primary(1)).toBe('42');
    });

    it('custom render receives (item, index) and can return a VIEW', () => {
        const data = [{ title: 'One' }, { title: 'Two' }];
        open({
            data,
            render: (item: ListItem, i: number) => html`<em class="row">${i + ':' + item.title}</em>`,
        });
        const rows = handle!.queryAll('.row');
        expect(rows.map((r) => r.textContent)).toEqual(['0:One', '1:Two']);
        expect(handle!.query('.lm-list-primary')).toBeNull(); // custom replaces the default
    });

    it('search filters across EVERY field, firing onbeforesearch then onsearch (v5)', () => {
        const calls: string[] = [];
        open({
            data: [
                { title: 'Apple', kind: 'fruit' },
                { title: 'Carrot', kind: 'vegetable' },
                { title: 'Banana', kind: 'fruit' },
            ],
            search: true,
            onbeforesearch: (q: string) => calls.push('before:' + q),
            onsearch: (q: string) => calls.push('after:' + q),
        });
        const input = handle!.query('.lm-list-search') as HTMLInputElement;

        input.value = 'fruit'; // matches a NON-title field
        input.dispatchEvent(new Event('input'));
        expect(calls).toEqual(['before:fruit', 'after:fruit']);
        expect(renderedItems()).toHaveLength(2);
        expect(primary(0)).toBe('Apple');

        input.value = '';
        input.dispatchEvent(new Event('input'));
        expect(renderedItems()).toHaveLength(3);
    });

    it('shows the message when empty — default and custom', () => {
        const api = open({ data: make(3), search: true });
        api.setSearch('zzz-nothing');
        expect(renderedItems()).toHaveLength(0);
        expect(handle!.query('.lm-list-message')!.textContent).toBe('No records found');
        handle!.unmount();

        open({ data: [], message: 'Nothing here' });
        expect(handle!.query('.lm-list-message')!.textContent).toBe('Nothing here');
    });

    it('pagination: numbered pages, range info, prev/next, onchangepage', () => {
        const pages: number[] = [];
        const api = open({ data: make(45), pagination: 20, onchangepage: (p: number) => pages.push(p) });
        expect(renderedItems()).toHaveLength(20);
        expect(handle!.query('.lm-list-pageinfo')!.textContent).toBe('1–20 of 45 items');
        expect(pageButtons()).toEqual(['‹', '1', '2', '3', '›']);

        (handle!.queryAll('.lm-list-pages button')[2] as HTMLElement).click(); // page "2"
        expect(primary(0)).toBe('Item 21');
        expect(handle!.query('.lm-list-pageinfo')!.textContent).toBe('21–40 of 45 items');
        expect(pages).toEqual([1]);

        api.setPage(99); // clamps to the last page
        expect(api.getPage()).toBe(2);
        expect(renderedItems()).toHaveLength(5); // remainder
        expect(pages).toEqual([1, 2]);

        api.setPage(2); // same page: silent (no echo)
        expect(pages).toEqual([1, 2]);
    });

    it('pagination: many pages collapse into ellipsis windows', () => {
        const api = open({ data: make(1000), pagination: 10 }); // 100 pages
        expect(pageButtons()).toEqual(['‹', '1', '2', '…', '100', '›']);
        api.setPage(49);
        expect(pageButtons()).toEqual(['‹', '1', '…', '49', '50', '51', '…', '100', '›']);
    });

    it('REMOTE mode (total): data IS the page — no slicing, total drives the pager', () => {
        const pages: number[] = [];
        const slice = Array.from({ length: 20 }, (_, i) => ({ title: 'R' + (i + 1) }));
        const data = store(slice);
        const api = open({ data, total: 87, pagination: 20, onchangepage: (p: number) => pages.push(p) });

        expect(renderedItems()).toHaveLength(20); // all of data, unsliced
        expect(handle!.query('.lm-list-pageinfo')!.textContent).toBe('1–20 of 87 items');
        expect(pageButtons()).toEqual(['‹', '1', '2', '…', '5', '›']); // ceil(87/20) = 5 pages

        api.setPage(1); // the caller's cue to fetch
        expect(pages).toEqual([1]);
        expect(primary(0)).toBe('R1'); // the component did NOT slice locally

        // The fetched page arrives: a remote data assignment keeps the page
        data.value = Array.from({ length: 20 }, (_, i) => ({ title: 'R' + (i + 21) }));
        expect(api.getPage()).toBe(1);
        expect(primary(0)).toBe('R21');
        expect(handle!.query('.lm-list-pageinfo')!.textContent).toBe('21–40 of 87 items');
    });

    it('REMOTE mode: search never filters locally — events + page reset only (v5)', () => {
        const calls: string[] = [];
        const api = open({
            data: Array.from({ length: 20 }, (_, i) => ({ title: 'R' + (i + 1) })),
            total: 87,
            pagination: 20,
            onbeforesearch: (q: string) => calls.push('before:' + q),
            onsearch: (q: string) => calls.push('after:' + q),
        });
        api.setPage(2);
        api.setSearch('anything');
        expect(renderedItems()).toHaveLength(20); // untouched — the caller filters
        expect(calls).toEqual(['before:anything', 'after:anything']);
        expect(api.getPage()).toBe(0); // back to page zero, as v5
    });

    it('BY REFERENCE: mutate records + touch() re-renders (store)', () => {
        const data = store(make(3));
        open({ data });
        data.value[0].title = 'MUTATED IN PLACE';
        data.touch();
        expect(primary(0)).toBe('MUTATED IN PLACE');

        data.value.push({ title: 'Item 4' });
        data.touch();
        expect(renderedItems()).toHaveLength(4);
    });

    it('assigning a NEW array re-renders and goes back to page zero (v5 local mode)', () => {
        const data = store(make(45));
        const api = open({ data, pagination: 20 });
        api.setPage(2);
        data.value = make(10);
        expect(api.getPage()).toBe(0);
        expect(renderedItems()).toHaveLength(10);
        expect(primary(0)).toBe('Item 1');
    });

    it('VIRTUALIZES: height + rowheight produce only a window of DOM', () => {
        open({ data: make(1000), height: 400, rowheight: 40 });
        // ceil(400/40) + 2*4 overscan = 18 rows alive, not 1000
        expect(renderedItems()).toHaveLength(18);
        expect(primary(0)).toBe('Item 1');
        expect((renderedItems()[0] as HTMLElement).style.height).toBe('40px'); // fixed rows
        // The canvas reserves the full scroll height
        expect((handle!.query('.lm-list-canvas') as HTMLElement).style.height).toBe(40000 + 'px');
    });

    it('scrolling shifts the window and the transform, clamped at the end', () => {
        open({ data: make(1000), height: 400, rowheight: 40 });
        scrollTo(4000); // row 100
        expect(primary(0)).toBe('Item 97'); // 100 - overscan + 1
        const w = handle!.query('.lm-list-window') as HTMLElement;
        expect(w.style.transform).toBe('translateY(' + 96 * 40 + 'px)');
        expect(renderedItems()).toHaveLength(18); // window size is constant

        scrollTo(40000); // past the end: clamped
        const last = renderedItems();
        expect(last.length).toBeLessThanOrEqual(18);
        expect(last[last.length - 1].querySelector('.lm-list-primary')!.textContent).toBe('Item 1000');
    });

    it('onitemclick makes rows interactive: (item, index, event) + data-clickable', () => {
        const clicks: [unknown, number][] = [];
        const data = make(3);
        open({ data, onitemclick: (item: unknown, i: number) => clicks.push([item, i]) });
        expect(renderedItems()[1].getAttribute('data-clickable')).toBe('true');
        (renderedItems()[1] as HTMLElement).click();
        expect(clicks).toEqual([[data[1], 1]]);
        handle!.unmount();

        open({ data });
        expect(renderedItems()[0].hasAttribute('data-clickable')).toBe(false); // false → no attribute
    });

    it('dense and divider variants land as lm-list-* classes', () => {
        open({ data: make(2), dense: true, divider: true });
        const root = handle!.query('.lm-list')!;
        expect(root.className).toContain('lm-list-dense');
        expect(root.className).toContain('lm-list-divider');
        handle!.unmount();

        open({ data: make(2) });
        expect(handle!.query('.lm-list')!.className).not.toContain('lm-list-dense');
        expect(handle!.query('.lm-list')!.className).not.toContain('lm-list-divider');
    });

    it('renders empty-safe with no props at all', () => {
        open();
        expect(renderedItems()).toHaveLength(0);
        expect(handle!.query('.lm-list-message')).not.toBeNull();
        expect(handle!.query('.lm-list-footer')).toBeNull(); // no pagination, no footer
        expect(handle!.query('.lm-list-search')).toBeNull(); // search is opt-in
    });
});
