/**
 * <ImageList /> block tests — including the registry gate: verify() must
 * pass. The deterministic surface: grid inline styles from columns/gap/
 * rowheight, lazy item rendering, overlay bars, quilted spans, the masonry
 * variant, onitemclick payloads, and live data — assignment AND mutate +
 * touch() (data is held by reference), plus live columns changes.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import ImageList, { type ImageListItem } from '@lemonadejs/imagelist';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-imagelist')!;
const items = () => handle!.queryAll('.lm-imagelist-item');
const imgs = () => handle!.queryAll('.lm-imagelist-img') as HTMLImageElement[];
// styles apply via the CSSOM (CSP-safe), so getAttribute('style') is the
// browser-normalized form ("a: b; "); collapse it to the compact "a:b"
const styleOf = (el: Element) => (el.getAttribute('style') || '').replace(/:\s+/g, ':').replace(/;\s+/g, ';');
const rootStyle = () => styleOf(root());

const make = (n: number): ImageListItem[] =>
    Array.from({ length: n }, (_, i) => ({
        src: 'https://images.test/photo-' + i + '.jpg',
        title: 'Photo ' + i,
    }));

describe('components/imagelist', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(ImageList);
        expect(report.pass).toBe(true);
    });

    it('lays out a CSS grid from the defaults: 3 columns, 8px gap, 164px rows', () => {
        handle = t(ImageList, { data: make(6) });
        expect(rootStyle()).toContain('display:grid');
        expect(rootStyle()).toContain('grid-template-columns:repeat(3, 1fr)');
        expect(rootStyle()).toContain('gap:8px');
        expect(rootStyle()).toContain('grid-auto-rows:164px');
    });

    it('columns / gap / rowheight drive the inline grid styles', () => {
        handle = t(ImageList, { data: make(4), columns: 4, gap: 12, rowheight: 100 });
        expect(rootStyle()).toContain('grid-template-columns:repeat(4, 1fr)');
        expect(rootStyle()).toContain('gap:12px');
        expect(rootStyle()).toContain('grid-auto-rows:100px');
    });

    it('rowheight 0 = natural heights: no grid-auto-rows', () => {
        handle = t(ImageList, { data: make(2), rowheight: 0 });
        expect(rootStyle()).toContain('display:grid');
        expect(rootStyle()).not.toContain('grid-auto-rows');
    });

    it('renders one tile per item with a lazy image, src and alt', () => {
        handle = t(ImageList, { data: make(5) });
        expect(items()).toHaveLength(5);
        expect(imgs()).toHaveLength(5);
        expect(imgs()[2].getAttribute('src')).toBe('https://images.test/photo-2.jpg');
        expect(imgs()[2].getAttribute('alt')).toBe('Photo 2');
        for (const img of imgs()) {
            expect(img.getAttribute('loading')).toBe('lazy');
        }
    });

    it('bar overlays title + subtitle on each image — subtitle only when present', () => {
        const data: ImageListItem[] = [
            { src: 'a.jpg', title: 'Breakfast', subtitle: '@bkristastucchio' },
            { src: 'b.jpg', title: 'Burger' },
        ];
        handle = t(ImageList, { data, bar: true });
        const bars = handle.queryAll('.lm-imagelist-bar');
        expect(bars).toHaveLength(2);
        expect(bars[0].querySelector('.lm-imagelist-title')!.textContent).toBe('Breakfast');
        expect(bars[0].querySelector('.lm-imagelist-subtitle')!.textContent).toBe('@bkristastucchio');
        expect(bars[1].querySelector('.lm-imagelist-title')!.textContent).toBe('Burger');
        expect(bars[1].querySelector('.lm-imagelist-subtitle')).toBeNull();
        handle.unmount();

        handle = t(ImageList, { data });
        expect(handle.query('.lm-imagelist-bar')).toBeNull(); // off by default
    });

    it('quilted: items span cells through grid-column / grid-row inline styles', () => {
        const data: ImageListItem[] = [
            { src: 'a.jpg', cols: 2, rows: 2 },
            { src: 'b.jpg' },
            { src: 'c.jpg', rows: 3 },
        ];
        handle = t(ImageList, { data, variant: 'quilted', columns: 4 });
        expect(root().getAttribute('data-variant')).toBe('quilted');
        expect(rootStyle()).toContain('grid-template-columns:repeat(4, 1fr)'); // still a grid

        const style0 = styleOf(items()[0]);
        expect(style0).toContain('grid-column:span 2');
        expect(style0).toContain('grid-row:span 2');
        expect(items()[1].getAttribute('style')).toBeNull(); // 1x1 = no spans
        const style2 = styleOf(items()[2]);
        expect(style2).toContain('grid-row:span 3');
        expect(style2).not.toContain('grid-column');
    });

    it('masonry: CSS columns on the root, break-inside + the gap on each item', () => {
        handle = t(ImageList, { data: make(6), variant: 'masonry', columns: 4, gap: 10 });
        expect(root().getAttribute('data-variant')).toBe('masonry');
        expect(rootStyle()).toContain('columns:4');
        expect(rootStyle()).toContain('column-gap:10px');
        expect(rootStyle()).not.toContain('display:grid');

        const style = styleOf(items()[0]);
        expect(style).toContain('break-inside:avoid');
        expect(style).toContain('margin-bottom:10px');
    });

    it('onitemclick delivers (item, index, event) and marks tiles clickable', () => {
        const data = make(3);
        const clicks: [ImageListItem, number, string][] = [];
        handle = t(ImageList, {
            data,
            onitemclick: (item: ImageListItem, index: number, e: MouseEvent) =>
                clicks.push([item, index, e.type]),
        });
        expect(items()[1].getAttribute('data-clickable')).toBe('true');

        items()[1].click();
        expect(clicks).toEqual([[data[1], 1, 'click']]);
        expect(clicks[0][0]).toBe(data[1]); // the SAME record, by reference
        handle.unmount();

        handle = t(ImageList, { data });
        expect(items()[0].hasAttribute('data-clickable')).toBe(false);
    });

    it('live data: assigning a new array through store() re-renders', () => {
        const data = store(make(2));
        handle = t(ImageList, { data });
        expect(items()).toHaveLength(2);

        data.value = make(5);
        expect(items()).toHaveLength(5);
        expect(imgs()[4].getAttribute('src')).toBe('https://images.test/photo-4.jpg');
    });

    it('BY REFERENCE: mutate records + touch() re-renders', () => {
        const data = store(make(3));
        handle = t(ImageList, { data, bar: true });

        data.value[0].title = 'MUTATED IN PLACE';
        data.touch();
        expect(handle.queryAll('.lm-imagelist-title')[0].textContent).toBe('MUTATED IN PLACE');

        data.value.push({ src: 'https://images.test/new.jpg', title: 'New' });
        data.touch();
        expect(items()).toHaveLength(4);
        expect(imgs()[3].getAttribute('src')).toBe('https://images.test/new.jpg');
    });

    it('live columns: a store-backed columns prop reshapes the grid', () => {
        const columns = store(2);
        handle = t(ImageList, { data: make(8), columns });
        expect(rootStyle()).toContain('grid-template-columns:repeat(2, 1fr)');

        columns.value = 5;
        expect(rootStyle()).toContain('grid-template-columns:repeat(5, 1fr)');
    });
});

describe('a11y', () => {
    it('alt priority: item.alt, then item.title, then empty', () => {
        const data: ImageListItem[] = [
            { src: 'a.jpg', alt: 'A plated breakfast', title: 'Breakfast' },
            { src: 'b.jpg', title: 'Burger' },
            { src: 'c.jpg' },
        ];
        handle = t(ImageList, { data });
        expect(imgs()[0].getAttribute('alt')).toBe('A plated breakfast');
        expect(imgs()[1].getAttribute('alt')).toBe('Burger');
        expect(imgs()[2].getAttribute('alt')).toBe('');
    });

    it('interactive tiles: role=button + tabindex, Enter and Space activate like a click', () => {
        const data = make(3);
        const clicks: [ImageListItem, number, string][] = [];
        handle = t(ImageList, {
            data,
            onitemclick: (item: ImageListItem, index: number, e: Event) =>
                clicks.push([item, index, e.type]),
        });
        expect(items()[1].getAttribute('role')).toBe('button');
        expect(items()[1].getAttribute('tabindex')).toBe('0');

        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(clicks).toEqual([[data[1], 1, 'keydown'], [data[1], 1, 'keydown']]);
    });

    it('without onitemclick tiles stay non-interactive: no role, no tabindex, keys silent', () => {
        handle = t(ImageList, { data: make(2) });
        expect(items()[0].hasAttribute('role')).toBe(false);
        expect(items()[0].hasAttribute('tabindex')).toBe(false);
        // no handler: never throws
        items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
});
