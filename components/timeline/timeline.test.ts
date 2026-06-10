/**
 * <Timeline /> block tests — including the registry gate: verify() must pass.
 * v5 parity: data/children events, date sorting (order asc|desc), day masks,
 * monthly filtering + prev/next navigation (api), controls header, align /
 * position attributes, border colors/styles, tags (colors + onclick),
 * editable + onedition, empty message, width/height, onupdate, url fetching
 * (plain and remote monthly with day-label dedup).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, store, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Timeline, { type TimelineItem, type TimelineRecord, type TimelineTag } from '@lemonadejs/timeline';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// June 10 2026 = Wednesday, June 12 = Friday, July 2 = Thursday.
// T12:00:00 keeps the local-time month stable in any timezone.
const data = (): TimelineItem[] => [
    { title: 'Beta', subtitle: 'second', description: 'beta desc', date: '2026-06-12T12:00:00' },
    { title: 'Alpha', subtitle: 'first', description: 'alpha desc', date: '2026-06-10T12:00:00' },
    { title: 'Gamma', date: '2026-07-02T12:00:00' },
];

const items = () => handle!.queryAll('.lm-timeline-item');
const titles = () => items().map((el) => el.querySelector('.lm-timeline-title')!.textContent);
const bullets = () => items().map((el) => el.getAttribute('data-bullet'));
const feed = () => handle!.query('.lm-timeline-data')!;
const header = () => handle!.query('.lm-timeline-header')!;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('components/timeline', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Timeline as never);
        expect(report.pass).toBe(true);
    });

    it('renders the feed sorted by date asc with title/subtitle/description', () => {
        handle = t(Timeline, { data: data() });
        expect(titles()).toEqual(['Alpha', 'Beta', 'Gamma']);
        const first = items()[0];
        expect(first.querySelector('.lm-timeline-subtitle')!.textContent).toBe('first');
        expect(first.querySelector('.lm-timeline-description')!.textContent).toBe('alpha desc');
    });

    it('feed mode uses the v5 default mask dddd, dd as the day bullet', () => {
        handle = t(Timeline, { data: data() });
        expect(bullets()).toEqual(['Wednesday, 10', 'Friday, 12', 'Thursday, 02']);
    });

    it('order desc reverses, and order is live', () => {
        const order = store('desc');
        handle = t(Timeline, { data: data(), order });
        expect(titles()).toEqual(['Gamma', 'Beta', 'Alpha']);

        order.value = 'asc';
        expect(titles()).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('format customizes the day mask (jSuites tokens)', () => {
        handle = t(Timeline, { data: data(), format: 'dd/mm/yyyy' });
        expect(bullets()[0]).toBe('10/06/2026');
        handle.unmount();

        handle = t(Timeline, { data: data(), format: 'ddd dd mmmm yy' });
        expect(bullets()[0]).toBe('Wed 10 June 26');
    });

    it('monthly: filters to the viewed month, shows the header, mask dd mmm yyyy', () => {
        handle = t(Timeline, { data: data(), type: 'monthly', date: '2026-06-15T12:00:00' });
        expect(titles()).toEqual(['Alpha', 'Beta']); // Gamma is July
        expect(bullets()).toEqual(['10 Jun 2026', '12 Jun 2026']);
        expect(header().getAttribute('data-type')).toBe('monthly');
        expect(header().getAttribute('data-visible')).toBe('true');
        expect(handle.query('.lm-timeline-year')!.textContent).toBe('2026');
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('June');
    });

    it('api next/prev navigates months and refilters (year rollover included)', () => {
        let api: { next: () => void; prev: () => void } | null = null;
        handle = t(Timeline, {
            data: data(),
            type: 'monthly',
            date: '2026-06-15T12:00:00',
            ref: (a: { next: () => void; prev: () => void }) => (api = a),
        });

        api!.next();
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('July');
        expect(titles()).toEqual(['Gamma']);

        api!.prev();
        api!.prev(); // May: nothing
        expect(titles()).toEqual([]);
        expect(handle.query('.lm-timeline-message')!.textContent).toBe('No records found');
        handle.unmount();

        api = null;
        handle = t(Timeline, {
            type: 'monthly',
            date: '2026-12-10T12:00:00',
            ref: (a: { next: () => void; prev: () => void }) => (api = a),
        });
        api!.next(); // December → January rolls the year
        expect(handle.query('.lm-timeline-year')!.textContent).toBe('2027');
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('January');
        api!.prev();
        expect(handle.query('.lm-timeline-year')!.textContent).toBe('2026');
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('December');
    });

    it('header buttons drive the same navigation', () => {
        handle = t(Timeline, { data: data(), type: 'monthly', date: '2026-06-15T12:00:00' });
        const buttons = handle.queryAll('.lm-timeline-navigation .lm-timeline-icon');
        buttons[1].click(); // next
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('July');
        buttons[0].click(); // prev
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('June');
    });

    it('the date prop is live: changing it moves the viewed month', () => {
        const date = store('2026-06-15T12:00:00');
        handle = t(Timeline, { data: data(), type: 'monthly', date });
        expect(titles()).toEqual(['Alpha', 'Beta']);

        date.value = '2026-07-01T12:00:00';
        expect(handle.query('.lm-timeline-month')!.textContent).toBe('July');
        expect(titles()).toEqual(['Gamma']);
    });

    it('controls=false hides the header; non-monthly never shows it (v5 CSS contract)', () => {
        handle = t(Timeline, { type: 'monthly', controls: false });
        expect(header().getAttribute('data-visible')).toBe('false');
        handle.unmount();

        handle = t(Timeline, { data: data() });
        // feed mode: no data-type → the CSS keeps it display none, as v5
        expect(header().hasAttribute('data-type')).toBe(false);
    });

    it('align and position land as data attributes; invalid align falls back to left (v5)', () => {
        handle = t(Timeline, { align: 'right', position: 'compact' });
        expect(feed().getAttribute('data-align')).toBe('right');
        expect(feed().getAttribute('data-mode')).toBe('compact');
        handle.unmount();

        handle = t(Timeline, { align: 'diagonal' });
        expect(feed().getAttribute('data-align')).toBe('left');
        expect(feed().hasAttribute('data-mode')).toBe(false);
    });

    it('borderColor and borderStyle become scoped CSS variables on the item', () => {
        handle = t(Timeline, {
            data: [
                { title: 'A', date: '2026-06-10T12:00:00', borderColor: 'red', borderStyle: 'dashed' },
                { title: 'B', date: '2026-06-11T12:00:00' },
            ],
        });
        const style = items()[0].getAttribute('style')!;
        expect(style).toContain('--lm-timeline-border-color:red');
        expect(style).toContain('--lm-timeline-border-style:dashed');
        expect(items()[1].hasAttribute('style')).toBe(false);
    });

    it('tags render with text, color and onclick(e, tag); clickable is a data attribute', () => {
        const clicks: TimelineTag[] = [];
        const tag: TimelineTag = { title: 'urgent', color: 'tomato', onclick: (e, s) => clicks.push(s) };
        handle = t(Timeline, {
            data: [{ title: 'A', date: '2026-06-10T12:00:00', tags: [tag, { title: 'plain' }] }],
        });
        const tags = handle.queryAll('.lm-timeline-tag');
        expect(tags.map((el) => el.textContent)).toEqual(['urgent', 'plain']);
        expect(tags[0].style.backgroundColor).toBe('tomato');
        expect(tags[0].hasAttribute('data-clickable')).toBe(true);
        expect(tags[1].hasAttribute('data-clickable')).toBe(false);

        tags[0].click();
        expect(clicks).toEqual([tag]);

        tags[1].click(); // no handler: never throws
        // items without tags render no tags container at all
        expect(items()[0].querySelectorAll('.lm-timeline-tags').length).toBe(1);
    });

    it('editable shows the edit button and onedition receives the record (with day)', () => {
        const edited: TimelineRecord[] = [];
        handle = t(Timeline, {
            data: data(),
            editable: true,
            onedition: (record: TimelineRecord) => edited.push(record),
        });
        const buttons = handle.queryAll('.lm-timeline-edit .lm-timeline-icon');
        expect(buttons.length).toBe(3);

        buttons[0].click();
        expect(edited.length).toBe(1);
        expect(edited[0].title).toBe('Alpha');
        expect(edited[0].day).toBe('Wednesday, 10');
        handle.unmount();

        handle = t(Timeline, { data: data() });
        expect(handle.query('.lm-timeline-edit')).toBeNull();
    });

    it('shows the message when empty — default and custom', () => {
        handle = t(Timeline);
        expect(handle.query('.lm-timeline-message')!.textContent).toBe('No records found');
        handle.unmount();

        handle = t(Timeline, { data: [], message: 'Nothing here' });
        expect(handle.query('.lm-timeline-message')!.textContent).toBe('Nothing here');
        handle.unmount();

        handle = t(Timeline, { data: data() });
        expect(handle.query('.lm-timeline-message')).toBeNull();
    });

    it('onupdate fires with the computed records on every recompute', () => {
        const updates: TimelineRecord[][] = [];
        const events = store(data());
        handle = t(Timeline, { data: events, onupdate: (records: TimelineRecord[]) => updates.push(records) });
        expect(updates.length).toBe(1);
        expect(updates[0].map((record) => record.title)).toEqual(['Alpha', 'Beta', 'Gamma']);

        events.value = [{ title: 'Solo', date: '2026-06-01T12:00:00' }];
        expect(updates.length).toBe(2);
        expect(updates[1].map((record) => record.title)).toEqual(['Solo']);
    });

    it('data is live: assignment and mutate + touch() both re-render', () => {
        const events = store(data());
        handle = t(Timeline, { data: events });
        expect(titles()).toEqual(['Alpha', 'Beta', 'Gamma']);

        events.value = [...events.value, { title: 'Delta', date: '2026-06-11T12:00:00' }];
        expect(titles()).toEqual(['Alpha', 'Delta', 'Beta', 'Gamma']);

        events.value.push({ title: 'Epsilon', date: '2026-06-09T12:00:00' });
        events.touch();
        expect(titles()).toEqual(['Epsilon', 'Alpha', 'Delta', 'Beta', 'Gamma']);
    });

    it('width and height apply in px on the root (v5 onload)', () => {
        handle = t(Timeline, { width: 400, height: 300 });
        const root = handle.query('.lm-timeline')!;
        expect(root.style.width).toBe('400px');
        expect(root.style.height).toBe('300px');
        handle.unmount();

        handle = t(Timeline);
        expect(handle.query('.lm-timeline')!.hasAttribute('style')).toBe(false);
    });

    it('element children become items: textContent/title, data-date/color/style (v5 extract)', () => {
        const App: Component = () => html`<main><${Timeline}><div
            data-date="2026-06-10T12:00:00" data-color="red" data-style="dotted">From HTML</div><div
            title="Attr title" data-date="2026-06-09T12:00:00"></div></${Timeline}></main>`;
        handle = t(App);
        expect(titles()).toEqual(['Attr title', 'From HTML']); // sorted by date
        expect(bullets()).toEqual(['Tuesday, 09', 'Wednesday, 10']);
        expect(items()[1].getAttribute('style')).toContain('--lm-timeline-border-color:red');
        expect(items()[1].getAttribute('style')).toContain('--lm-timeline-border-style:dotted');
    });

    it('url: fetches the data (plain array or { result }) and renders it', async () => {
        const fetchMock = vi.fn(async (u: string, init: RequestInit) => {
            expect(u).toBe('/events');
            expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/json');
            return {
                ok: true,
                json: async () => ({ result: [{ title: 'Remote', date: '2026-06-10T12:00:00' }] }),
            } as unknown as Response;
        });
        vi.stubGlobal('fetch', fetchMock);

        handle = t(Timeline, { url: '/events' });
        await flush();
        expect(titles()).toEqual(['Remote']);
        expect(bullets()).toEqual(['Wednesday, 10']);
    });

    it('remote monthly: per-month queries, en-GB labels, consecutive day dedup (v5 signature)', async () => {
        const label = (d: string) =>
            new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
        const urls: string[] = [];
        const fetchMock = vi.fn(async (u: string) => {
            urls.push(u);
            return {
                ok: true,
                json: async () => [
                    { title: 'One', date: '2026-06-10T12:00:00' },
                    { title: 'Two', date: '2026-06-10T12:00:00' }, // same day: label suppressed
                    { title: 'Three', date: '2026-06-11T12:00:00' },
                ],
            } as unknown as Response;
        });
        vi.stubGlobal('fetch', fetchMock);

        let api: { next: () => void } | null = null;
        handle = t(Timeline, {
            url: '/events',
            remote: true,
            type: 'monthly',
            date: '2026-06-15T12:00:00',
            ref: (a: { next: () => void }) => (api = a),
        });
        await flush();
        expect(urls[0]).toBe('/events?year=2026&month=6&asc=true');
        expect(titles()).toEqual(['One', 'Two', 'Three']); // server order kept
        expect(bullets()).toEqual([label('2026-06-10T12:00:00'), '', label('2026-06-11T12:00:00')]);

        api!.next(); // month navigation refetches
        await flush();
        expect(urls[1]).toBe('/events?year=2026&month=7&asc=true');
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () =>
            html`<main><${Timeline} data="${data()}" type="monthly" date="2026-06-15T12:00:00"
                order="desc" align="top" editable="true" /></main>`;
        handle = t(App);
        expect(titles()).toEqual(['Beta', 'Alpha']);
        expect(feed().getAttribute('data-align')).toBe('top');
        expect(handle.queryAll('.lm-timeline-edit').length).toBe(2);
    });
});
