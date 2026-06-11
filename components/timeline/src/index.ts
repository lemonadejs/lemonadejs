/**
 * <Timeline /> — full behavioral parity with the v5 plugin.
 *
 * The v5 model, ported faithfully:
 *   - a feed of events ({ title, subtitle, description, date, borderColor,
 *     borderStyle, tags }) sorted by date (order asc | desc), each item
 *     showing a formatted day bullet (v5 jSuites mask, default
 *     'dddd, dd' — or 'dd mmm yyyy' in monthly mode)
 *   - type="monthly": only the viewed month's events show, plus a header
 *     with the year / month name and prev / next month navigation
 *     (December/January roll the year over)
 *   - items can also come from element children (v5 extractFromHtml:
 *     title from textContent or title=, data-date, data-color, data-style)
 *   - per-item borders through borderColor / borderStyle, per-tag colors,
 *     tag onclick(e, tag) handlers
 *   - editable: an edit button per item firing onedition(record)
 *   - url: data fetched remotely ({ result: [...] } or a plain array);
 *     remote + monthly asks the server per month (?year&month&asc) and
 *     suppresses repeated consecutive en-GB day labels (v5 dateSignature)
 *   - align (left | right | top | bottom, invalid values fall back to
 *     left as v5), width/height in px, message when the feed is empty
 *
 * v5 → v6 mapping: value → date (the viewed month anchor — "value" is
 * reserved for form semantics in v6); controls defaults true (the header
 * only ever shows in monthly mode, so the visual default is identical to
 * v5's controls = type === 'monthly'); onupdate(records) unchanged;
 * self.next/self.prev → api { next, prev }. The empty message is a real
 * .lm-timeline-message element (v5 used :empty::before, which cannot see
 * v6's slot markers). Border CSS vars are scoped: --lm-timeline-border-*.
 * Fetched data is kept internally instead of overwriting the data prop
 * (v5 wrote self.data); assigning data later replaces it, exactly v5.
 */

import { component, css, html } from 'lemonadejs';

export interface TimelineTag {
    /** Tag text */
    title?: string;
    /** Tag background color */
    color?: string;
    /** Makes the tag clickable */
    onclick?: (e: Event, tag: TimelineTag) => void;
}

export interface TimelineItem {
    /** Event title */
    title?: string;
    /** Muted line under the title */
    subtitle?: string;
    /** Long text under the subtitle */
    description?: string;
    /** Event date — Date or anything new Date() parses */
    date?: Date | string;
    /** Item border color (CSS color) */
    borderColor?: string;
    /** Item border style (solid | dashed | dotted ...) */
    borderStyle?: string;
    /** Colored tag chips under the description */
    tags?: TimelineTag[];
}

/** What the component renders and reports: the item plus its day label */
export type TimelineRecord = TimelineItem & { day: string };

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ALIGNMENTS = ['top', 'right', 'bottom', 'left'];

const two = (n: number): string => String(n).padStart(2, '0');

const toDate = (d: unknown): Date => (d instanceof Date ? d : new Date(d as string));

/** The jSuites date mask tokens v5 rendered through utils.Mask, inlined */
const formatDate = (d: Date, mask: string): string => {
    if (isNaN(d.getTime())) {
        return '';
    }
    return mask.replace(/yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, (token) => {
        switch (token.toLowerCase()) {
            case 'yyyy':
                return String(d.getFullYear());
            case 'yy':
                return two(d.getFullYear() % 100);
            case 'mmmm':
                return MONTHS[d.getMonth()];
            case 'mmm':
                return MONTHS[d.getMonth()].slice(0, 3);
            case 'mm':
                return two(d.getMonth() + 1);
            case 'm':
                return String(d.getMonth() + 1);
            case 'dddd':
                return WEEKDAYS[d.getDay()];
            case 'ddd':
                return WEEKDAYS[d.getDay()].slice(0, 3);
            case 'dd':
                return two(d.getDate());
            default:
                return String(d.getDate());
        }
    });
};

export const Timeline = component('timeline', {
    data: Array,                  // TimelineItem[]
    type: '',                     // 'monthly' filters by the viewed month + shows controls
    date: '',                     // viewed month anchor (v5: value) — defaults to today
    format: '',                   // day mask (v5 defaults: monthly 'dd mmm yyyy', feed 'dddd, dd')
    message: 'No records found',  // text shown when the feed is empty
    order: 'asc',                 // asc | desc by date
    align: 'left',                // left | right | top | bottom (invalid → left, v5)
    position: '',                 // v5 pass-through → data-mode on the feed
    controls: true,               // month navigation header (visible in monthly mode only, as v5)
    editable: false,              // shows the per-item edit button
    remote: false,                // with url + monthly: server-side month queries
    url: '',                      // fetch the data remotely
    width: 0,                     // px, 0 = natural
    height: 0,                    // px, 0 = natural
    onupdate: Function,           // (records) after every recompute
    onedition: Function,          // (record) when an item's edit button is clicked
    api: { next: Function, prev: Function },
}, (props, { state, onMount, resource }) => {
    // v5 extractFromHtml: element children become items
    const extracted: TimelineItem[] = [];
    for (const node of props.children || []) {
        if (node.nodeType === 1) {
            const el = node as HTMLElement;
            extracted.push({
                title: el.textContent || el.getAttribute('title') || '',
                date: el.getAttribute('data-date') || '',
                borderColor: el.getAttribute('data-color') || '',
                borderStyle: el.getAttribute('data-style') || '',
            });
        }
    }

    // The viewed month: from the date prop, today otherwise (v5 value)
    let anchor = props.date.value ? toDate(props.date.value) : new Date();
    if (isNaN(anchor.getTime())) {
        anchor = new Date();
    }
    const period = state({ year: anchor.getFullYear(), month: 1 + anchor.getMonth() });
    const records = state<TimelineRecord[]>([]);

    // url-fetched data (v5 overwrote self.data; a data assignment replaces it)
    let fetched: TimelineItem[] | null = null;

    const isRemote = () => !!(props.remote.value && props.url.value && props.type.value === 'monthly');

    const maskOf = () =>
        (props.format.value as string) || (props.type.value === 'monthly' ? 'dd mmm yyyy' : 'dddd, dd');

    // Subscriptions die with the instance, so publish needs no alive guard
    const publish = (list: TimelineRecord[]) => {
        records.value = list;
        props.onupdate?.(list);
    };

    /** v5 updateResult: month filter (monthly), date sort, day labels */
    const compute = () => {
        let list = [...(fetched || (props.data.value as TimelineItem[]) || []), ...extracted];
        if (props.type.value === 'monthly') {
            const { year, month } = period.value;
            list = list.filter((item) => {
                const d = toDate(item.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });
        }
        const dir = props.order.value === 'desc' ? -1 : 1;
        list.sort((a, b) => dir * (toDate(a.date).getTime() - toDate(b.date).getTime()));
        publish(list.map((item) => ({ ...item, day: formatDate(toDate(item.date), maskOf()) })));
    };

    /**
     * v5 fetchRemote on the resource() tool: accepts { result: [...] } or
     * a plain array. The fetcher PEEKS everything — refresh() decides WHEN
     * via reload() — and the engine owns the lifecycle: a new request
     * aborts the stale one, only the latest response lands, unmount
     * aborts (v5's alive flag and its out-of-order race are gone).
     */
    const remote = resource<{ body: unknown; grouped: boolean } | null>((signal) => {
        if (typeof fetch !== 'function' || !props.url.peek()) {
            return null;
        }
        let u = props.url.peek() as string;
        const grouped = !!(props.remote.peek() && props.type.peek() === 'monthly');
        if (grouped) {
            const { year, month } = period.peek();
            u += `?year=${year}&month=${month}&asc=${props.order.peek() === 'asc'}`;
        }
        return fetch(u, { headers: { 'Content-Type': 'text/json' }, signal }).then((res) => {
            if (!res.ok) {
                console.error('Failed to fetch data. Status code: ' + res.status);
                return null;
            }
            return res.json().then((body: unknown) => ({ body, grouped }));
        });
    });

    onMount(() =>
        remote.data.subscribe((payload) => {
            if (!payload) {
                return;
            }
            const raw = payload.body as { result?: TimelineItem[] };
            const result = Array.isArray(raw?.result)
                ? raw.result
                : Array.isArray(payload.body)
                  ? (payload.body as TimelineItem[])
                  : [];
            if (payload.grouped) {
                // Server-filtered month: en-GB day labels, consecutive
                // duplicates suppressed (the v5 dateSignature grouping)
                let signature = '';
                publish(result.map((item) => {
                    const d = toDate(item.date);
                    const label = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
                    const day = label === signature ? '' : label;
                    signature = label;
                    return { ...item, date: d, day };
                }));
            } else {
                fetched = result;
                compute();
            }
        })
    );
    onMount(() =>
        remote.error.subscribe((e) => {
            if (e) {
                console.error('Failed to fetch data. ' + (e as Error).message);
            }
        })
    );

    const refresh = () => (isRemote() ? remote.reload() : compute());

    // v5 tracked data / order / month (value changes land as month changes);
    // one period state means a year rollover refetches once, not twice
    onMount(() => props.data.subscribe(() => {
        fetched = null; // v5: assigning data replaces what url loaded
        refresh();
    }));
    onMount(() => props.order.subscribe(refresh));
    onMount(() => period.subscribe(refresh));
    onMount(() => props.date.subscribe(() => {
        const d = toDate(props.date.value);
        if (!isNaN(d.getTime())) {
            period.value = { year: d.getFullYear(), month: 1 + d.getMonth() };
        }
    }));

    // v5 onload: the resource's setup run already fetched when a url
    // exists; local processing otherwise
    if (!props.url.value) {
        compute();
    }

    const next = () => {
        const { year, month } = period.value;
        period.value = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    };

    const prev = () => {
        const { year, month } = period.value;
        period.value = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    };

    props.ref?.({ next, prev });

    const alignOf = () => {
        const align = props.align.value as string;
        return ALIGNMENTS.includes(align) ? align : 'left'; // v5 normalized invalid values
    };

    const sizeOf = (): string | false => {
        const w = parseInt(String(props.width.value), 10);
        const h = parseInt(String(props.height.value), 10);
        // || false: no style ATTRIBUTE at all when both are unset
        return css({ width: w || false, height: h || false }) || false;
    };

    const bordersOf = (item: TimelineRecord): string | false =>
        css({
            '--lm-timeline-border-color': item.borderColor || false,
            '--lm-timeline-border-style': item.borderStyle || false,
        }) || false;

    return html`<div class="lm-timeline" style="${() => sizeOf()}">
        <div class="lm-timeline-header"
            data-visible="${() => (props.controls.value ? 'true' : 'false')}"
            data-type="${() => props.type.value || false}">
            <div class="lm-timeline-label">
                <div class="lm-timeline-year">${() => period.value.year}</div>
                <div class="lm-timeline-month">${() => MONTHS[period.value.month - 1]}</div>
            </div>
            <div class="lm-timeline-navigation">
                <button type="button" class="lm-timeline-icon" onclick="${prev}" tabindex="0">expand_less</button>
                <button type="button" class="lm-timeline-icon" onclick="${next}" tabindex="0">expand_more</button>
            </div>
        </div>
        <div class="lm-timeline-data"
            data-mode="${() => props.position.value || false}"
            data-align="${() => alignOf()}">${() =>
            records.value.length
                ? records.value.map((item) => html`<div class="lm-timeline-item"
                    data-bullet="${item.day}"
                    style="${bordersOf(item)}">
                    ${() => props.editable.value &&
                        html`<div class="lm-timeline-edit"><button type="button" class="lm-timeline-icon"
                            onclick="${() => props.onedition?.(item)}"
                            tabindex="0">edit</button></div>`}
                    <div class="lm-timeline-title">${item.title || ''}</div>
                    <div class="lm-timeline-subtitle">${item.subtitle || ''}</div>
                    <div class="lm-timeline-description">${item.description || ''}</div>
                    ${() => Array.isArray(item.tags) && item.tags.length
                        ? html`<div class="lm-timeline-tags">${item.tags.map((tag) =>
                            html`<span class="lm-timeline-tag"
                                data-clickable="${tag.onclick ? 'true' : false}"
                                style="${tag.color ? 'background-color:' + tag.color : false}"
                                onclick="${(e: Event) => tag.onclick?.(e, tag)}">${tag.title || ''}</span>`)}</div>`
                        : false}
                </div>`)
                : html`<div class="lm-timeline-message">${() => props.message.value}</div>`
        }</div>
    </div>`;
});

export default Timeline;
