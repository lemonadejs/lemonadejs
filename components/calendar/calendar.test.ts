/**
 * <Calendar /> — the nuance matrix, verified: value parsing (ISO,
 * datetime, serial, Date, format-masked), three views with boundary
 * navigation, day selection commit semantics, range building + preview,
 * time picker hold-open, min/max/validate disabling, the keyboard
 * system, input mode open/escape-cancel/focusout, typing mask + live
 * view steering, inline mode, api surface, live prop updates.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Calendar from '@lemonadejs/calendar';

type Api = {
    open(): void;
    close(origin?: string): void;
    isClosed(): boolean;
    getValue(): unknown;
    setValue(v: unknown): void;
    update(): void;
    reset(): void;
    next(): void;
    prev(): void;
    setView(name: string): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const make = (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Calendar as never, { ...props, ref: (a: Api) => (api = a) } as never);
    return api!;
};

const root = () => handle!.query('.lm-calendar') as HTMLElement;
const input = () => handle!.query('.lm-calendar-input') as HTMLInputElement;
const grid = () => handle!.query('.lm-calendar-content') as HTMLElement;
const cells = () => handle!.queryAll('.lm-calendar-content > div');
const cell = (title: string) => cells().find((el) => el.textContent === title && el.getAttribute('data-grey') !== 'true')!;
const monthLabel = () => handle!.queryAll('.lm-calendar-labels button')[0];
const yearLabel = () => handle!.queryAll('.lm-calendar-labels button')[1];
const navButtons = () => handle!.queryAll('.lm-calendar-navigation button');
const key = (el: HTMLElement, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input', { bubbles: true }));
};

describe('components/calendar — the date picker on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Calendar as never).pass).toBe(true);
    });

    it('inline: renders the 42-cell day grid with out-of-month days greyed', () => {
        make({ type: 'inline', bind: '2026-06-15' });
        expect(cells().length).toBe(42);
        // June 2026 starts on a Monday; Sunday-start grid shows May 31 first
        const all = cells();
        expect(all[0].textContent).toBe('31');
        expect(all[0].getAttribute('data-grey')).toBe('true');
        expect(all[1].textContent).toBe('1');
        expect(all[1].getAttribute('data-grey')).toBeNull();
        expect(cell('15').getAttribute('data-selected')).toBe('true');
        expect(monthLabel().textContent).toBe('June');
        expect(yearLabel().textContent).toBe('2026');
    });

    it('startingday reorders the grid and the weekday initials — live', () => {
        const start = store(0);
        make({ type: 'inline', bind: '2026-06-15', startingday: start });
        const initials = () => handle!.queryAll('.lm-calendar-weekdays > div').map((el) => el.textContent);
        expect(initials()).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
        expect(cells()[0].textContent).toBe('31'); // May 31, Sunday

        start.value = 1; // Monday first — June 1 lands on cell 0
        expect(initials()).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
        expect(cells()[0].textContent).toBe('1');
        expect(cells()[0].getAttribute('data-grey')).toBeNull();
    });

    it('day click commits the ISO value, fires onchange once', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        cell('20').click();
        expect(api.getValue()).toBe('2026-06-20');
        expect(changes).toEqual(['2026-06-20']);
        expect(cell('20').getAttribute('data-selected')).toBe('true');
    });

    it('prev/next navigate months, including the year boundary', () => {
        make({ type: 'inline', bind: '2026-01-15' });
        navButtons()[0].click(); // prev
        expect(monthLabel().textContent).toBe('December');
        expect(yearLabel().textContent).toBe('2025');
        navButtons()[1].click();
        navButtons()[1].click();
        expect(monthLabel().textContent).toBe('February');
        expect(yearLabel().textContent).toBe('2026');
    });

    it('month picker: header drills, selection moves the page only', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        monthLabel().click();
        expect(handle!.query('.lm-calendar-container')!.getAttribute('data-view')).toBe('months');
        const months = cells();
        expect(months.length).toBe(12);
        expect(months[5].getAttribute('data-selected')).toBe('true'); // June
        months[8].click(); // September
        expect(handle!.query('.lm-calendar-container')!.getAttribute('data-view')).toBe('days');
        expect(monthLabel().textContent).toBe('September');
        expect(api.getValue()).toBe('2026-06-15'); // the value never moved
        expect(changes).toEqual([]);
    });

    it('year picker: 16-year pages, paging by 16', () => {
        make({ type: 'inline', bind: '2026-06-15' });
        yearLabel().click();
        const years = cells();
        expect(years.length).toBe(16);
        expect(years[0].textContent).toBe('2016'); // 2026 - 2026 % 16
        expect(cell('2026').getAttribute('data-selected')).toBe('true');
        navButtons()[1].click(); // next 16-year page
        expect(cells()[0].textContent).toBe('2032');
        navButtons()[0].click();
        cell('2020').click();
        expect(handle!.query('.lm-calendar-container')!.getAttribute('data-view')).toBe('days');
        expect(yearLabel().textContent).toBe('2020');
    });

    it('min/max disable days outside the bounds; clicks are inert', () => {
        const changes: unknown[] = [];
        const api = make({
            type: 'inline', bind: '2026-06-15', min: '2026-06-10', max: '2026-06-20',
            onchange: (v: unknown) => changes.push(v),
        });
        expect(cell('5').getAttribute('data-disabled')).toBe('true');
        expect(cell('25').getAttribute('data-disabled')).toBe('true');
        expect(cell('15').getAttribute('data-disabled')).toBeNull();
        cell('5').click();
        expect(api.getValue()).toBe('2026-06-15');
        expect(changes).toEqual([]);
    });

    it('validate() disables custom days (v5 validRange function)', () => {
        make({
            type: 'inline', bind: '2026-06-15',
            // weekends off — 2026-06-13 is a Saturday
            validate: (d: number, m: number, y: number) => [0, 6].includes(new Date(y, m, d).getDay()),
        });
        expect(cell('13').getAttribute('data-disabled')).toBe('true');
        expect(cell('14').getAttribute('data-disabled')).toBe('true');
        expect(cell('15').getAttribute('data-disabled')).toBeNull();
    });

    it('range: two clicks build start/end, Update commits the array once', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', range: true, bind: '', onchange: (v: unknown) => changes.push(v) });
        // navigate deterministically
        api.setView('years');
        cell('2026').click();
        api.setView('months');
        cells()[5].click(); // June
        cell('10').click();
        expect(cell('10').getAttribute('data-start')).toBe('true');
        expect(changes).toEqual([]); // nothing committed yet
        cell('15').click();
        expect(cell('15').getAttribute('data-end')).toBe('true');
        expect(cell('12').getAttribute('data-range')).toBe('true');
        (handle!.query('.lm-calendar-update button') as HTMLElement).click();
        expect(changes).toEqual([['2026-06-10', '2026-06-15']]);
        expect(api.getValue()).toEqual(['2026-06-10', '2026-06-15']);
    });

    it('range: clicking at/before the start restarts the range (v5)', () => {
        make({ type: 'inline', range: true, bind: ['2026-06-10', '2026-06-15'] });
        // committed range renders
        expect(cell('10').getAttribute('data-start')).toBe('true');
        expect(cell('15').getAttribute('data-end')).toBe('true');
        cell('5').click(); // before the start — restart
        expect(cell('5').getAttribute('data-start')).toBe('true');
        expect(cell('10').getAttribute('data-start')).toBeNull();
        expect(cell('15').getAttribute('data-end')).toBeNull();
    });

    it('range: mouseover previews the span before the second click', () => {
        // a committed range: the next click restarts and leaves an open start
        make({ type: 'inline', range: true, bind: ['2026-06-01', '2026-06-05'] });
        cell('10').click();
        cell('14').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(cell('12').getAttribute('data-range')).toBe('true');
        expect(cell('14').getAttribute('data-last')).toBe('true');
        expect(cell('15').getAttribute('data-range')).toBeNull();
    });

    it('time: day click commits with time and KEEPS the panel state; Update applies the selects', () => {
        const changes: unknown[] = [];
        const api = make({
            type: 'inline', time: true, bind: '2026-06-15 08:30:00',
            onchange: (v: unknown) => changes.push(v),
        });
        const selects = handle!.queryAll('.lm-calendar-time select') as HTMLSelectElement[];
        expect(selects[0].value).toBe('8');
        expect(selects[1].value).toBe('30');
        cell('18').click();
        expect(changes).toEqual(['2026-06-18 08:30:00']);
        selects[0].value = '9';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        expect(changes.length).toBe(1); // time alone does not commit (v5)
        (handle!.query('.lm-calendar-update button') as HTMLElement).click();
        expect(api.getValue()).toBe('2026-06-18 09:30:00');
        expect(changes).toEqual(['2026-06-18 08:30:00', '2026-06-18 09:30:00']);
    });

    it('numeric: values are Excel serial numbers both ways', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', numeric: true, bind: 46188, onchange: (v: unknown) => changes.push(v) });
        expect(cell('15').getAttribute('data-selected')).toBe('true'); // 46188 = 2026-06-15
        expect(monthLabel().textContent).toBe('June');
        cell('18').click();
        expect(changes).toEqual([46191]);
        api.setValue(46188);
        expect(api.getValue()).toBe(46188);
        expect(cell('15').getAttribute('data-selected')).toBe('true');
    });

    it('value parsing: Date instances and comma strings normalize via setValue', () => {
        const api = make({ type: 'inline', bind: '' });
        api.setValue(new Date(2026, 5, 18)); // local components, never string-parsed
        expect(api.getValue()).toBe('2026-06-18');
        api.setValue('46188'); // serial as string
        expect(api.getValue()).toBe('2026-06-15');
    });

    it('format renders the input display through the mask', () => {
        make({ bind: '2026-06-15', format: 'DD/MM/YYYY' });
        expect(input().value).toBe('15/06/2026');
    });

    it('typing with a format is progressively masked and steers the view', async () => {
        const api = make({ bind: '2026-06-15', format: 'DD/MM/YYYY' });
        api.open();
        await flush();
        type('2007'); // digits only — the mask inserts the separators
        expect(input().value).toBe('20/07');
        type('20/07/2026');
        expect(monthLabel().textContent).toBe('July'); // view follows, no commit
        expect(api.getValue()).toBe('2026-06-15');
        key(input(), 'Enter'); // commit the typed date
        expect(api.getValue()).toBe('2026-07-20');
        expect(api.isClosed()).toBe(true);
    });

    it('input mode: open anchors a Modal panel; a day click commits and closes', async () => {
        const changes: unknown[] = [];
        const api = make({ bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        expect(api.isClosed()).toBe(true);
        expect(handle!.query('.lm-modal')).toBeNull();
        api.open();
        await flush();
        expect(api.isClosed()).toBe(false);
        expect(handle!.query('.lm-modal')).not.toBeNull();
        cell('20').click();
        expect(api.isClosed()).toBe(true);
        expect(changes).toEqual(['2026-06-20']);
        expect(input().value).toBe('2026-06-20');
    });

    it('ESCAPE cancels: uncommitted cursor and typed text revert (v5 close origin)', async () => {
        const changes: unknown[] = [];
        const origins: string[] = [];
        const api = make({
            bind: '2026-06-15',
            onchange: (v: unknown) => changes.push(v),
            onclose: (o: string) => origins.push(o),
        });
        api.open();
        await flush();
        key(grid(), 'ArrowRight'); // cursor moves to the 16th — uncommitted
        type('2026-06-25'); // typed text — uncommitted
        key(input(), 'Escape');
        expect(api.isClosed()).toBe(true);
        expect(api.getValue()).toBe('2026-06-15');
        expect(changes).toEqual([]);
        expect(origins).toEqual(['escape']);
        expect(input().value).toBe('2026-06-15'); // typed text reverted
    });

    it('focusout closes the panel without committing', async () => {
        const origins: string[] = [];
        const api = make({ bind: '2026-06-15', onclose: (o: string) => origins.push(o) });
        api.open();
        await flush(); // also clears the open mute window
        root().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        expect(api.isClosed()).toBe(true);
        expect(origins).toEqual(['focusout']);
    });

    it('keyboard: Enter/arrows on the closed input open the panel', async () => {
        const api = make({ bind: '2026-06-15' });
        key(input(), 'Enter');
        expect(api.isClosed()).toBe(false);
        await flush();
        key(input(), 'Escape');
        expect(api.isClosed()).toBe(true);
        key(input(), 'ArrowDown');
        expect(api.isClosed()).toBe(false);
    });

    it('keyboard: arrows move the cursor — 1 across, 7 vertical, month wraps', () => {
        const updates: string[] = [];
        make({ type: 'inline', bind: '2026-06-15', onupdate: (v: string) => updates.push(v) });
        key(grid(), 'ArrowRight');
        expect(cell('16').getAttribute('data-selected')).toBe('true');
        key(grid(), 'ArrowDown');
        expect(cell('23').getAttribute('data-selected')).toBe('true');
        key(grid(), 'ArrowUp');
        key(grid(), 'ArrowLeft');
        expect(cell('15').getAttribute('data-selected')).toBe('true');
        expect(updates).toEqual(['2026-06-16', '2026-06-23', '2026-06-16', '2026-06-15']);
        // crossing the month boundary moves the page
        for (let i = 0; i < 16; i++) {
            key(grid(), 'ArrowRight');
        }
        expect(monthLabel().textContent).toBe('July');
        expect(cell('1').getAttribute('data-selected')).toBe('true');
    });

    it('keyboard: Enter on the grid selects the cursor day', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        key(grid(), 'ArrowRight');
        key(grid(), 'Enter');
        expect(api.getValue()).toBe('2026-06-16');
        expect(changes).toEqual(['2026-06-16']);
    });

    it('wheel navigates months; wheel=false opts out', () => {
        make({ type: 'inline', bind: '2026-06-15' });
        grid().dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        expect(monthLabel().textContent).toBe('July');
        grid().dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
        expect(monthLabel().textContent).toBe('June');
        handle!.unmount();

        make({ type: 'inline', bind: '2026-06-15', wheel: false });
        grid().dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        expect(monthLabel().textContent).toBe('June');
    });

    it('disabled blocks selection and marks the block', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', bind: '2026-06-15', disabled: true, onchange: (v: unknown) => changes.push(v) });
        expect(root().getAttribute('data-disabled')).toBe('true');
        cell('20').click();
        expect(api.getValue()).toBe('2026-06-15');
        expect(changes).toEqual([]);
    });

    it('data entries mark their days (event dot)', () => {
        make({ type: 'inline', bind: '2026-06-01', data: [{ date: '2026-06-15', title: 'Meeting' }] });
        expect(cell('15').getAttribute('data-event')).toBe('true');
        expect(cell('14').getAttribute('data-event')).toBeNull();
    });

    it('today is bold', () => {
        make({ type: 'inline' }); // no value — the page is the current month
        const today = new Date();
        const el = cell(String(today.getDate()));
        expect(el.getAttribute('data-bold')).toBe('true');
        expect(cells().filter((c) => c.getAttribute('data-bold') === 'true').length).toBe(1);
    });

    it('external bind writes are silent and re-sync the whole view', () => {
        const value = store('2026-06-15');
        const changes: unknown[] = [];
        make({ type: 'inline', bind: value, onchange: (v: unknown) => changes.push(v) });
        value.value = '2026-07-20';
        expect(changes).toEqual([]); // assignment is silent (v6)
        expect(monthLabel().textContent).toBe('July');
        expect(cell('20').getAttribute('data-selected')).toBe('true');
    });

    it('api: setValue commits (with onchange), reset clears, next/prev/setView/update work', () => {
        const changes: unknown[] = [];
        const api = make({ type: 'inline', bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        api.setValue('2026-06-18');
        expect(changes).toEqual(['2026-06-18']);
        api.next();
        expect(monthLabel().textContent).toBe('July');
        api.prev();
        expect(monthLabel().textContent).toBe('June');
        api.setView('months');
        expect(handle!.query('.lm-calendar-container')!.getAttribute('data-view')).toBe('months');
        api.setView('nonsense');
        expect(handle!.query('.lm-calendar-container')!.getAttribute('data-view')).toBe('months');
        api.setView('days');
        api.reset();
        expect(api.getValue()).toBe('');
        expect(changes).toEqual(['2026-06-18', '']);
        api.update(); // commits the cursor (today after reset)
        expect(changes.length).toBe(3);
    });

    it('Reset/Done options bar drives the popup (v5 sheet controls)', async () => {
        const changes: unknown[] = [];
        const api = make({ bind: '2026-06-15', onchange: (v: unknown) => changes.push(v) });
        api.open();
        await flush();
        const buttons = handle!.queryAll('.lm-calendar-options button');
        expect(buttons.map((b) => b.textContent)).toEqual(['Reset', 'Done']);
        buttons[1].click(); // Done commits the cursor and closes
        expect(api.isClosed()).toBe(true);
        expect(changes).toEqual([]); // cursor never moved — same value, no event
        api.open();
        await flush();
        handle!.queryAll('.lm-calendar-options button')[0].click(); // Reset
        expect(api.getValue()).toBe('');
        expect(changes).toEqual(['']);
        expect(input().value).toBe('');
    });

    it('footer=false hides the footer; time row hidden without time', () => {
        make({ type: 'inline', bind: '2026-06-15', footer: false });
        expect(handle!.query('.lm-calendar-footer')!.getAttribute('data-visible')).toBe('false');
        expect(handle!.query('.lm-calendar-time')!.getAttribute('data-visible')).toBe('false');
        handle!.unmount();

        make({ type: 'inline', bind: '2026-06-15', time: true });
        expect(handle!.query('.lm-calendar-footer')!.getAttribute('data-visible')).toBe('true');
        expect(handle!.query('.lm-calendar-time')!.getAttribute('data-visible')).toBe('true');
    });

    it('placeholder and grid styling attributes apply', () => {
        make({ bind: '', placeholder: 'Pick a date', grid: true });
        expect(input().getAttribute('placeholder')).toBe('Pick a date');
        expect(root().getAttribute('data-grid')).toBe('true');
        expect(root().getAttribute('data-type')).toBe('default');
    });

    it('localization: document.dictionary translates labels and names (v5 T)', () => {
        (document as Document & { dictionary?: Record<string, string> }).dictionary = {
            June: 'Junho', Done: 'Concluir', Reset: 'Limpar',
        };
        try {
            make({ type: 'inline', bind: '2026-06-15' });
            expect(monthLabel().textContent).toBe('Junho');
        } finally {
            delete (document as Document & { dictionary?: Record<string, string> }).dictionary;
        }
    });

    it('live data updates re-mark the grid', () => {
        const data = store<unknown[]>([]);
        make({ type: 'inline', bind: '2026-06-15', data });
        expect(cell('10').getAttribute('data-event')).toBeNull();
        data.value = [{ date: '2026-06-10' }];
        expect(cell('10').getAttribute('data-event')).toBe('true');
    });
});
