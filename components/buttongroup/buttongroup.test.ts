/**
 * <ButtonGroup /> block tests — including the registry gate: verify()
 * must pass. One block covering MUI's ButtonGroup (plain onclick mode)
 * and ToggleButtonGroup (single/multiple selection on the dropdown
 * value model, divisor-free): options normalization, single select +
 * deselect, multiple toggle arrays, store() two-way bind with silent
 * external writes, disabled item/group, data-* variants, live options.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import ButtonGroup from '@lemonadejs/buttongroup';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-buttongroup')!;
const buttons = () => handle!.queryAll('.lm-buttongroup-button') as HTMLButtonElement[];
const button = (label: string) => buttons().find((el) => el.textContent!.trim() === label)!;
const selectedLabels = () =>
    buttons()
        .filter((el) => el.getAttribute('data-selected') === 'true')
        .map((el) => el.textContent!.trim());

describe('components/buttongroup', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(ButtonGroup);
        expect(report.pass).toBe(true);
    });

    it('normalizes strings into { value, label } and renders one button each', () => {
        handle = t(ButtonGroup, { options: ['One', 'Two', 'Three'] });
        expect(buttons().map((el) => el.textContent!.trim())).toEqual(['One', 'Two', 'Three']);
        expect(buttons().every((el) => el.type === 'button')).toBe(true);
    });

    it('plain mode: clicks fire onclick(value, event) and never select', () => {
        const clicks: unknown[] = [];
        let event: Event | null = null;
        handle = t(ButtonGroup, {
            options: ['One', { value: 2, label: 'Two' }],
            onclick: (v: unknown, e: Event) => {
                clicks.push(v);
                event = e;
            },
        });

        button('One').click();
        button('Two').click();
        button('Two').click();
        expect(clicks).toEqual(['One', 2, 2]);
        expect(event).toBeInstanceOf(MouseEvent);
        expect(selectedLabels()).toEqual([]); // plain buttons never mark selection
    });

    it('plain mode: onchange never fires', () => {
        const changes: unknown[] = [];
        handle = t(ButtonGroup, { options: ['One', 'Two'], onchange: (v: unknown) => changes.push(v) });
        button('One').click();
        expect(changes).toEqual([]);
    });

    it('single: click selects, click again deselects — onchange gets value then null', () => {
        const changes: unknown[] = [];
        handle = t(ButtonGroup, {
            selectable: 'single',
            options: ['Left', 'Center', 'Right'],
            onchange: (v: unknown) => changes.push(v),
        });

        button('Center').click();
        expect(selectedLabels()).toEqual(['Center']);

        button('Right').click(); // exclusive: the selection moves
        expect(selectedLabels()).toEqual(['Right']);

        button('Right').click(); // toggle off
        expect(selectedLabels()).toEqual([]);
        expect(changes).toEqual(['Center', 'Right', null]);
    });

    it('multiple: toggles a set, the value is always an array', () => {
        const changes: unknown[] = [];
        handle = t(ButtonGroup, {
            selectable: 'multiple',
            options: ['Bold', 'Italic', 'Underline'],
            onchange: (v: unknown) => changes.push(v),
        });

        button('Bold').click();
        button('Italic').click();
        expect(selectedLabels()).toEqual(['Bold', 'Italic']);

        button('Bold').click(); // toggle off, Italic stays
        expect(selectedLabels()).toEqual(['Italic']);

        button('Italic').click();
        expect(selectedLabels()).toEqual([]);
        expect(changes).toEqual([['Bold'], ['Bold', 'Italic'], ['Italic'], []]);
    });

    it('bind via store() is two-way and divisor-free (single)', () => {
        const picked = store<unknown>('b');
        handle = t(ButtonGroup, {
            selectable: 'single',
            bind: picked,
            options: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
            ],
        });
        expect(selectedLabels()).toEqual(['B']); // initial bind value renders

        button('A').click();
        expect(picked.value).toBe('a'); // user toggle writes out

        picked.value = 'b'; // external write flows in
        expect(selectedLabels()).toEqual(['B']);
    });

    it('bind with an array store in multiple mode — external writes are silent', () => {
        const picked = store<unknown[]>(['italic']);
        const changes: unknown[] = [];
        handle = t(ButtonGroup, {
            selectable: 'multiple',
            bind: picked,
            options: [
                { value: 'bold', label: 'Bold' },
                { value: 'italic', label: 'Italic' },
                { value: 'underline', label: 'Underline' },
            ],
            onchange: (v: unknown) => changes.push(v),
        });
        expect(selectedLabels()).toEqual(['Italic']);

        button('Bold').click(); // user toggle: fires onchange
        expect(picked.value).toEqual(['italic', 'bold']);
        expect(changes).toEqual([['italic', 'bold']]);

        picked.value = ['underline']; // programmatic write: silent
        expect(selectedLabels()).toEqual(['Underline']);
        expect(changes).toEqual([['italic', 'bold']]); // no echo
    });

    it('a disabled item ignores clicks and carries the native attribute', () => {
        const changes: unknown[] = [];
        handle = t(ButtonGroup, {
            selectable: 'single',
            options: ['On', { value: 'off', label: 'Off', disabled: true }],
            onchange: (v: unknown) => changes.push(v),
        });
        expect(button('Off').disabled).toBe(true);
        expect(button('On').disabled).toBe(false);

        button('Off').click();
        expect(selectedLabels()).toEqual([]);
        expect(changes).toEqual([]);
    });

    it('disabled group blocks every button and click handler', () => {
        const clicks: unknown[] = [];
        handle = t(ButtonGroup, {
            disabled: true,
            options: ['One', 'Two'],
            onclick: (v: unknown) => clicks.push(v),
        });
        expect(root().getAttribute('data-disabled')).toBe('true');
        expect(buttons().every((el) => el.disabled)).toBe(true);

        button('One').click();
        expect(clicks).toEqual([]);
    });

    it('exposes orientation, variant, color, size and selectable as data attributes', () => {
        handle = t(ButtonGroup, {
            options: ['One'],
            selectable: 'multiple',
            variant: 'outlined',
            color: 'purple',
            size: 'small',
            orientation: 'vertical',
        });
        expect(root().getAttribute('data-selectable')).toBe('multiple');
        expect(root().getAttribute('data-variant')).toBe('outlined');
        expect(root().getAttribute('data-color')).toBe('purple');
        expect(root().getAttribute('data-size')).toBe('small');
        expect(root().getAttribute('data-orientation')).toBe('vertical');
        handle.unmount();

        handle = t(ButtonGroup, { options: ['One'] });
        expect(root().hasAttribute('data-selectable')).toBe(false); // empty → no attribute
        expect(root().hasAttribute('data-variant')).toBe(false);
        expect(root().hasAttribute('data-color')).toBe(false);
        expect(root().hasAttribute('data-size')).toBe(false);
        expect(root().hasAttribute('data-orientation')).toBe(false);
        expect(root().hasAttribute('data-disabled')).toBe(false);
    });

    it('renders icons when provided', () => {
        handle = t(ButtonGroup, {
            options: [{ value: 'bold', icon: 'format_bold' }, { value: 'plain', label: 'Plain' }],
        });
        const icons = handle.queryAll('.lm-buttongroup-icon');
        expect(icons.length).toBe(1);
        expect(icons[0].textContent).toBe('format_bold');
        expect(handle.queryAll('.lm-buttongroup-label').length).toBe(1); // icon-only has no label span
    });

    it('options stay live: a state write re-renders, the selection survives by value', () => {
        const options = store<unknown[]>(['One', 'Two']);
        const picked = store<unknown>('Two');
        handle = t(ButtonGroup, { selectable: 'single', bind: picked, options });
        expect(buttons().length).toBe(2);
        expect(selectedLabels()).toEqual(['Two']);

        options.value = ['One', 'Two', 'Three'];
        expect(buttons().map((el) => el.textContent!.trim())).toEqual(['One', 'Two', 'Three']);
        expect(selectedLabels()).toEqual(['Two']); // selection survives by value

        button('Three').click();
        expect(picked.value).toBe('Three');
    });
});
