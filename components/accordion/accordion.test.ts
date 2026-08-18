/**
 * <Accordion /> block tests — including the registry gate: verify() must pass.
 * Expansion panels: options/render/bind/multiple/onchange,
 * keep-alive bodies, keyboard focus walk.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Accordion, { type AccordionItem, type Expanded } from '@lemonadejs/accordion';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const OPTIONS: AccordionItem[] = [
    { title: 'General', content: 'General settings' },
    { title: 'Advanced', content: 'Advanced settings' },
    { title: 'Danger zone', content: 'Careful here' },
];

const headers = () => handle!.queryAll('.lm-accordion-header') as HTMLButtonElement[];
const panels = () => handle!.queryAll('.lm-accordion-panel');
const bodies = () => handle!.queryAll('.lm-accordion-body');
const chevrons = () => handle!.queryAll('.lm-accordion-chevron');
const openStates = () => panels().map((p) => p.getAttribute('data-open') === 'true');

const key = (el: HTMLElement, key: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

describe('components/accordion', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Accordion);
        expect(report.pass).toBe(true);
    });

    it('renders all panels closed by default, content as text', () => {
        handle = t(Accordion, { options: OPTIONS });
        expect(headers().map((h) => h.textContent)).toEqual(['General', 'Advanced', 'Danger zone']);
        expect(openStates()).toEqual([false, false, false]);
        expect(handle.text()).toContain('General settings'); // body in the DOM even closed
    });

    it('expands exclusively and collapses on re-click, with onchange payloads', () => {
        const changes: Array<[Expanded, Expanded]> = [];
        handle = t(Accordion, {
            options: OPTIONS,
            onchange: (next: Expanded, old: Expanded) => changes.push([next, old]),
        });

        headers()[0].click();
        expect(openStates()).toEqual([true, false, false]);
        expect(headers()[0].getAttribute('aria-expanded')).toBe('true');
        expect(chevrons()[0].getAttribute('data-open')).toBe('true');

        headers()[2].click(); // exclusive: opening one closes the other
        expect(openStates()).toEqual([false, false, true]);
        expect(chevrons()[0].hasAttribute('data-open')).toBe(false);

        headers()[2].click(); // re-click collapses → none open
        expect(openStates()).toEqual([false, false, false]);

        expect(changes).toEqual([
            [0, -1],
            [2, 0],
            [-1, 2],
        ]);
    });

    it('multiple mode accumulates an array of open indices', () => {
        const changes: number[][] = [];
        handle = t(Accordion, {
            options: OPTIONS,
            multiple: true,
            onchange: (next: number[]) => changes.push(next),
        });

        headers()[0].click();
        headers()[2].click();
        expect(openStates()).toEqual([true, false, true]);

        headers()[0].click(); // closing one leaves the other open
        expect(openStates()).toEqual([false, false, true]);

        expect(changes).toEqual([[0], [0, 2], [2]]);
    });

    it('bind stays two-way through store(): user toggles fire onchange, external writes are silent', () => {
        const expanded = store<Expanded>(-1);
        const changes: Expanded[] = [];
        handle = t(Accordion, {
            options: OPTIONS,
            bind: expanded,
            onchange: (next: Expanded) => changes.push(next),
        });

        headers()[1].click();
        expect(expanded.value).toBe(1);
        expect(changes).toEqual([1]);

        expanded.value = 2; // external write flows in, no onchange echo
        expect(openStates()).toEqual([false, false, true]);
        expanded.value = -1; // -1 = all closed
        expect(openStates()).toEqual([false, false, false]);
        expect(changes).toEqual([1]);
    });

    it('binds an array of indices in multiple mode', () => {
        const expanded = store<number[]>([0, 2]);
        handle = t(Accordion, { options: OPTIONS, multiple: true, bind: expanded });
        expect(openStates()).toEqual([true, false, true]);

        headers()[1].click();
        expect(expanded.value).toEqual([0, 1, 2]);

        expanded.value = []; // silent external collapse
        expect(openStates()).toEqual([false, false, false]);
    });

    it('keeps a disabled panel inert', () => {
        const changes: Expanded[] = [];
        handle = t(Accordion, {
            options: [{ title: 'Open me' }, { title: 'Locked', content: 'no entry', disabled: true }],
            onchange: (next: Expanded) => changes.push(next),
        });

        expect(headers()[1].disabled).toBe(true);
        expect(panels()[1].getAttribute('data-disabled')).toBe('true');

        headers()[1].click();
        expect(openStates()).toEqual([false, false]);
        expect(changes).toEqual([]);

        headers()[0].click(); // the enabled sibling still works
        expect(openStates()).toEqual([true, false]);
    });

    it('renders panel bodies through the render prop', () => {
        handle = t(Accordion, {
            options: OPTIONS,
            render: (item: AccordionItem, index: number) =>
                html`<strong class="rich">${index + ': ' + item.title}</strong>`,
        });

        const rich = handle.queryAll('.rich');
        expect(rich.length).toBe(3);
        expect(rich[1].textContent).toBe('1: Advanced');
        expect(handle.text()).not.toContain('General settings'); // render wins over content
    });

    it('keeps body DOM alive across toggles — element identity and input state survive', () => {
        handle = t(Accordion, {
            options: OPTIONS,
            render: () => html`<input class="inside" />`,
        });

        headers()[0].click();
        const body = bodies()[0];
        const input = handle.query('.inside') as HTMLInputElement;
        input.value = 'typed while open';

        headers()[0].click(); // collapse — display/class-driven, never an unmount
        expect(bodies()[0]).toBe(body);
        expect(handle.query('.inside')).toBe(input);

        headers()[0].click(); // reopen
        expect(bodies()[0]).toBe(body);
        expect((handle.query('.inside') as HTMLInputElement).value).toBe('typed while open');
    });

    it('closed bodies are inert so their focusables leave the Tab order', () => {
        handle = t(Accordion, {
            options: OPTIONS,
            render: () => html`<input class="inside" />`,
        });
        // all closed: every body inert
        expect(bodies().map((b) => b.hasAttribute('inert'))).toEqual([true, true, true]);

        headers()[0].click(); // open the first — only it leaves inert
        expect(bodies().map((b) => b.hasAttribute('inert'))).toEqual([false, true, true]);

        headers()[0].click(); // collapse again — back to inert, DOM kept alive
        expect(bodies().map((b) => b.hasAttribute('inert'))).toEqual([true, true, true]);
        expect(handle.queryAll('.inside').length).toBe(3); // never unmounted
    });

    it('walks header focus with ArrowDown/ArrowUp, skipping disabled headers', () => {
        handle = t(Accordion, {
            options: [
                { title: 'One' },
                { title: 'Two', disabled: true },
                { title: 'Three' },
                { title: 'Four' },
            ],
        });

        headers()[0].focus();
        key(headers()[0], 'ArrowDown'); // skips the disabled header
        expect(document.activeElement).toBe(headers()[2]);

        key(headers()[2], 'ArrowDown');
        expect(document.activeElement).toBe(headers()[3]);

        key(headers()[3], 'ArrowDown'); // clamped at the end
        expect(document.activeElement).toBe(headers()[3]);

        key(headers()[3], 'ArrowUp');
        expect(document.activeElement).toBe(headers()[2]);

        key(headers()[2], 'ArrowUp');
        expect(document.activeElement).toBe(headers()[0]);

        key(headers()[0], 'ArrowUp'); // clamped at the start
        expect(document.activeElement).toBe(headers()[0]);
    });

    it('follows live options: panels appear and disappear with the data', () => {
        const options = store<AccordionItem[]>([{ title: 'A', content: 'a' }]);
        handle = t(Accordion, { options });
        expect(headers().length).toBe(1);

        options.value = [...options.value, { title: 'B', content: 'b' }];
        expect(headers().map((h) => h.textContent)).toEqual(['A', 'B']);

        headers()[1].click();
        expect(openStates()).toEqual([false, true]);

        options.value = options.value.slice(0, 1);
        expect(headers().length).toBe(1);
    });
});
