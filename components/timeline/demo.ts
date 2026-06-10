/**
 * Local playground for <Timeline /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Timeline, { type TimelineItem, type TimelineRecord } from '@lemonadejs/timeline';

// One call, zero options: the contract derives <lm-timeline>
createWebComponent(Timeline);

const project: TimelineItem[] = [
    {
        title: 'Kickoff',
        subtitle: 'Project started',
        description: 'Scope agreed, repository created.',
        date: '2026-06-02T09:00:00',
        tags: [{ title: 'milestone', color: '#bfdbfe' }],
    },
    {
        title: 'First prototype',
        subtitle: 'Engine running',
        description: 'The reactive core renders its first view.',
        date: '2026-06-05T15:00:00',
        borderColor: '#1f64e1',
        tags: [
            { title: 'build', color: '#bbf7d0' },
            { title: 'clickable', color: '#fde68a', onclick: (e, tag) => alert('Tag: ' + tag.title) },
        ],
    },
    {
        title: 'Beta release',
        subtitle: 'Out the door',
        date: '2026-06-09T11:00:00',
        borderColor: '#16a34a',
        borderStyle: 'dashed',
    },
    {
        title: 'July retrospective',
        subtitle: 'Next month',
        description: 'Only visible in the monthly view after next().',
        date: '2026-07-03T10:00:00',
    },
];

const App: Component = (props, { state }) => {
    const events = state<TimelineItem[]>([...project]);
    const order = state('asc');
    const log = state<string[]>([]);
    let monthly: { next: () => void; prev: () => void } | null = null;

    const say = (line: string) => {
        log.value = [...log.value, line];
    };

    return html`<div class="demo">
        <h1>&lt;Timeline /&gt;</h1>

        <h3>Feed (default) — live data, order ${() => order.value}</h3>
        <${Timeline} data="${events}" order="${order}" editable="${true}"
            onedition="${(record: TimelineRecord) => say('onedition → ' + record.title)}"
            onupdate="${(records: TimelineRecord[]) => say('onupdate → ' + records.length + ' records')}" />
        <button onclick="${() => (order.value = order.value === 'asc' ? 'desc' : 'asc')}">toggle order</button>
        <button onclick="${() =>
            (events.value = [
                ...events.value,
                { title: 'New event', subtitle: 'pushed live', date: new Date().toISOString() },
            ])}">add event</button>

        <h3>Monthly with controls (api next/prev too)</h3>
        <${Timeline} data="${project}" type="monthly" date="2026-06-15T12:00:00"
            ref="${(api: { next: () => void; prev: () => void }) => (monthly = api)}" />
        <button onclick="${() => monthly?.prev()}">api.prev()</button>
        <button onclick="${() => monthly?.next()}">api.next()</button>

        <h3>Align top</h3>
        <${Timeline} data="${project}" align="top" height="${220}" />

        <h3>Align right</h3>
        <${Timeline} data="${project}" align="right" />

        <h3>Empty + custom message</h3>
        <${Timeline} data="${[] as TimelineItem[]}" message="No events scheduled" />

        <h3>Web component — the same block as &lt;lm-timeline&gt;</h3>
        <lm-timeline align="left">
            <div data-date="2026-06-08T10:00:00" data-color="purple">Declared in HTML</div>
            <div data-date="2026-06-11T10:00:00" data-style="dotted">Second HTML event</div>
        </lm-timeline>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
