/**
 * <Transferlist /> block tests — including the registry gate: verify()
 * must pass. Covers the initial split from bind, checked moves in every
 * direction (incl. move-all), onchange payloads, checked hygiene after
 * moves, disabled items, button disable states, per-side search, silent
 * external writes, live data revalidation, counts and the api surface.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Transferlist from '@lemonadejs/transferlist';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const DATA = ['a', 'b', 'c', 'd'];

const list = (side: number) => handle!.queryAll('.lm-transferlist-list')[side];
const labels = (side: number) =>
    [...list(side).querySelectorAll('.lm-transferlist-label')].map((el) => el.textContent);
const count = (side: number) => list(side).querySelector('.lm-transferlist-count')!.textContent;
const button = (action: string) => handle!.query(`[data-action="${action}"]`) as HTMLButtonElement;
const check = (side: number, label: string) => {
    const rows = [...list(side).querySelectorAll('.lm-transferlist-item')];
    const row = rows.find((r) => r.querySelector('.lm-transferlist-label')!.textContent === label)!;
    (row.querySelector('input') as HTMLInputElement).click();
};

describe('components/transferlist', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Transferlist);
        expect(report.pass).toBe(true);
    });

    it('splits data from bind: left = not chosen (data order), right = chosen (chosen order)', () => {
        const chosen = store<unknown[]>(['d', 'b']);
        handle = t(Transferlist, { data: DATA, bind: chosen });
        expect(labels(0)).toEqual(['a', 'c']);
        expect(labels(1)).toEqual(['d', 'b']);
    });

    it('moves checked items right, appended to the chosen order', () => {
        const chosen = store<unknown[]>([]);
        handle = t(Transferlist, { data: DATA, bind: chosen });
        check(0, 'a');
        check(0, 'c');
        button('right').click();
        expect(chosen.value).toEqual(['a', 'c']);
        expect(labels(0)).toEqual(['b', 'd']);
        expect(labels(1)).toEqual(['a', 'c']);
    });

    it('moves checked items left', () => {
        const chosen = store<unknown[]>(['a', 'b', 'c']);
        handle = t(Transferlist, { data: DATA, bind: chosen });
        check(1, 'b');
        button('left').click();
        expect(chosen.value).toEqual(['a', 'c']);
        expect(labels(0)).toEqual(['b', 'd']);
        expect(labels(1)).toEqual(['a', 'c']);
    });

    it('moves all items with » and «', () => {
        const chosen = store<unknown[]>([]);
        handle = t(Transferlist, { data: DATA, bind: chosen });
        button('all-right').click();
        expect(chosen.value).toEqual(['a', 'b', 'c', 'd']);
        expect(labels(0)).toEqual([]);
        expect(labels(1)).toEqual(['a', 'b', 'c', 'd']);

        button('all-left').click();
        expect(chosen.value).toEqual([]);
        expect(labels(0)).toEqual(['a', 'b', 'c', 'd']);
        expect(labels(1)).toEqual([]);
    });

    it('fires onchange with the new chosen ARRAY on user moves only', () => {
        const chosen = store<unknown[]>([]);
        const changes: unknown[] = [];
        handle = t(Transferlist, { data: DATA, bind: chosen, onchange: (v: unknown[]) => changes.push(v) });

        check(0, 'a');
        button('right').click();
        expect(changes).toEqual([['a']]);

        button('all-left').click();
        expect(changes).toEqual([['a'], []]);

        chosen.value = ['b']; // external write: silent
        expect(changes.length).toBe(2);
        expect(labels(1)).toEqual(['b']);
    });

    it('clears the internal checked sets after a move', () => {
        const chosen = store<unknown[]>([]);
        handle = t(Transferlist, { data: DATA, bind: chosen });
        check(0, 'a');
        expect(count(0)).toBe('1/4 selected');

        button('right').click();
        expect(count(0)).toBe('0/3 selected');
        expect(count(1)).toBe('0/1 selected');
        const boxes = [...handle.root.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];
        expect(boxes.every((b) => !b.checked)).toBe(true);
    });

    it('keeps disabled items unmovable: unchecked, skipped by move-all on both sides', () => {
        const data = ['a', { value: 'b', label: 'B', disabled: true }, 'c'];
        const chosen = store<unknown[]>([]);
        handle = t(Transferlist, { data, bind: chosen });

        const row = [...list(0).querySelectorAll('.lm-transferlist-item')].find(
            (r) => r.querySelector('.lm-transferlist-label')!.textContent === 'B'
        )!;
        expect(row.getAttribute('data-disabled')).toBe('true');
        expect((row.querySelector('input') as HTMLInputElement).disabled).toBe(true);

        check(0, 'B'); // a disabled checkbox does not toggle
        expect(count(0)).toBe('0/3 selected');

        button('all-right').click();
        expect(chosen.value).toEqual(['a', 'c']);
        expect(labels(0)).toEqual(['B']);
        handle.unmount();

        // A disabled item already chosen stays chosen on «
        const locked = store<unknown[]>(['b', 'a']);
        handle = t(Transferlist, { data, bind: locked });
        button('all-left').click();
        expect(locked.value).toEqual(['b']);
        expect(labels(1)).toEqual(['B']);
    });

    it('disables each button when nothing applies', () => {
        handle = t(Transferlist, { data: DATA });
        expect(button('all-right').disabled).toBe(false);
        expect(button('right').disabled).toBe(true);
        expect(button('left').disabled).toBe(true);
        expect(button('all-left').disabled).toBe(true);

        check(0, 'a');
        expect(button('right').disabled).toBe(false);

        button('right').click();
        expect(button('right').disabled).toBe(true); // checks cleared
        expect(button('all-left').disabled).toBe(false);

        check(1, 'a');
        expect(button('left').disabled).toBe(false);

        button('all-right').click();
        expect(button('all-right').disabled).toBe(true); // left side empty
    });

    it('filters each side independently when search is on', () => {
        const chosen = store<unknown[]>(['cherry']);
        handle = t(Transferlist, {
            data: ['apple', 'banana', 'cherry', 'blueberry'],
            bind: chosen,
            search: true,
        });
        const inputs = handle.queryAll('.lm-transferlist-search') as HTMLInputElement[];
        expect(inputs.length).toBe(2);

        inputs[0].value = 'b';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        expect(labels(0)).toEqual(['banana', 'blueberry']);
        expect(labels(1)).toEqual(['cherry']); // the right side is untouched

        inputs[1].value = 'x';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        expect(labels(1)).toEqual([]);
        expect(list(1).querySelector('.lm-transferlist-empty')!.textContent).toBe('No items');
        expect(labels(0)).toEqual(['banana', 'blueberry']);
        handle.unmount();

        // search defaults to off: no filter boxes
        handle = t(Transferlist, { data: DATA });
        expect(handle.query('.lm-transferlist-search')).toBeNull();
    });

    it('stays two-way through store(): external writes re-split silently', () => {
        const chosen = store<unknown[]>([]);
        const changes: unknown[] = [];
        handle = t(Transferlist, { data: DATA, bind: chosen, onchange: (v: unknown[]) => changes.push(v) });

        chosen.value = ['c', 'a'];
        expect(labels(0)).toEqual(['b', 'd']);
        expect(labels(1)).toEqual(['c', 'a']);
        expect(changes).toEqual([]);
    });

    it('revalidates on live data changes: chosen keeps only values that still exist', () => {
        const data = store<unknown[]>(['a', 'b', 'c']);
        const chosen = store<unknown[]>(['b', 'c']);
        const changes: unknown[] = [];
        handle = t(Transferlist, { data, bind: chosen, onchange: (v: unknown[]) => changes.push(v) });

        data.value = ['a', 'c', 'e'];
        expect(chosen.value).toEqual(['c']); // 'b' is gone, 'c' survives
        expect(changes).toEqual([]); // revalidation is silent
        expect(labels(0)).toEqual(['a', 'e']);
        expect(labels(1)).toEqual(['c']);

        data.value.push('f'); // by-reference mutation + touch
        data.touch();
        expect(labels(0)).toEqual(['a', 'e', 'f']);
    });

    it('shows MUI-style counts and titles per list header', () => {
        const chosen = store<unknown[]>(['c']);
        handle = t(Transferlist, { data: DATA, bind: chosen, titles: ['Source', 'Target'] });
        expect(list(0).querySelector('.lm-transferlist-title')!.textContent).toBe('Source');
        expect(list(1).querySelector('.lm-transferlist-title')!.textContent).toBe('Target');
        expect(count(0)).toBe('0/3 selected');
        expect(count(1)).toBe('0/1 selected');

        check(0, 'a');
        check(0, 'b');
        check(1, 'c');
        expect(count(0)).toBe('2/3 selected');
        expect(count(1)).toBe('1/1 selected');
        handle.unmount();

        handle = t(Transferlist, { data: DATA }); // default titles
        expect(list(0).querySelector('.lm-transferlist-title')!.textContent).toBe('Available');
        expect(list(1).querySelector('.lm-transferlist-title')!.textContent).toBe('Chosen');
    });

    it('exposes getChosen/moveAll/reset through the api', () => {
        type Api = { getChosen(): string[]; moveAll(direction?: 'right' | 'left'): void; reset(): void };
        let api: Api | null = null;
        const chosen = store<unknown[]>([]);
        const changes: unknown[] = [];
        handle = t(Transferlist, {
            data: DATA,
            bind: chosen,
            onchange: (v: unknown[]) => changes.push(v),
            ref: (a: Api) => (api = a),
        });

        api!.moveAll();
        expect(chosen.value).toEqual(['a', 'b', 'c', 'd']);
        expect(api!.getChosen()).toEqual(['a', 'b', 'c', 'd']);
        expect(changes.length).toBe(1); // moveAll behaves like the » button

        api!.moveAll('left');
        expect(chosen.value).toEqual([]);
        expect(changes.length).toBe(2);

        api!.moveAll();
        api!.reset(); // programmatic restore: silent
        expect(chosen.value).toEqual([]);
        expect(api!.getChosen()).toEqual([]);
        expect(changes.length).toBe(3);
        expect(labels(0)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Transferlist} data="${DATA}" search="true" height="150" /></main>`;
        handle = t(App);
        expect(handle.query('.lm-transferlist-search')).not.toBeNull();
        expect(handle.query('.lm-transferlist-items')!.getAttribute('style')).toContain('150px');
    });
});
