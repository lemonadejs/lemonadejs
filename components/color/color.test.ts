/**
 * <Color /> — built on Modal (v5 architecture). Behavior tests: the
 * palette grid model (matrix, custom palettes, selected mark), the v5
 * pending/Done commit flow, closeonchange, reset, the input toggle with
 * the v5 keyboard system, focusout close, inline mode and the api.
 *
 * jsdom has no layout and no canvas: no geometry assertions; getContext
 * is stubbed to null (the block guards it, like v5 guarded the context).
 */
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Color from '@lemonadejs/color';

type Api = {
    open(): void;
    close(): void;
    isClosed(): boolean;
    reset(): void;
    setValue(v: string): void;
    getValue(): string;
};

beforeAll(() => {
    // jsdom has no 2d context — return null instead of "Not implemented"
    (HTMLCanvasElement.prototype as unknown as Record<string, unknown>).getContext = () => null;
});

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** Modal defers per-open setup one microtask */
const flush = () => new Promise((r) => setTimeout(r, 0));

const modal = () => handle!.query('.lm-modal');
const cells = () => handle!.queryAll('.lm-color-cell');
const cell = (color: string) => handle!.query('.lm-color-cell[data-value="' + color + '"]')!;
const input = () => handle!.query('.lm-color-input') as HTMLInputElement;
const key = (code: string) =>
    input().dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));

const open = async (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Color, { ...props, ref: (a: Api) => (api = a) });
    api!.open();
    await flush();
    return api!;
};

describe('components/color — on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Color).pass).toBe(true);
    });

    it('starts closed and opens a headerless Modal panel, firing onopen', async () => {
        const opens: number[] = [];
        let api: Api | null = null;
        handle = t(Color, { onopen: () => opens.push(1), ref: (a: Api) => (api = a) });
        expect(modal()).toBeNull();
        expect(api!.isClosed()).toBe(true);

        api!.open();
        await flush();
        expect(modal()).not.toBeNull();
        expect(modal()!.querySelector('.lm-modal-header')).toBeNull(); // headerless panel
        expect(modal()!.querySelector('.lm-color-panel')).not.toBeNull();
        expect(opens).toEqual([1]);
        expect(api!.isClosed()).toBe(false);
    });

    it('renders the default v5 palette: 10 rows x 17 swatches with inline backgrounds', async () => {
        await open();
        expect(handle!.queryAll('.lm-color-row')).toHaveLength(10);
        expect(cells()).toHaveLength(170);
        const swatch = cell('#f44336');
        expect(swatch).not.toBeNull();
        expect(swatch.style.backgroundColor).not.toBe('');
    });

    it('opening marks the bound color as selected in the grid (v5 open)', async () => {
        const current = store('#f44336');
        await open({ bind: current });
        expect(cell('#f44336').className).toContain('lm-color-selected');
        expect(handle!.queryAll('.lm-color-selected')).toHaveLength(1);
    });

    it('default flow: a swatch click only marks pending; Done commits, fires onchange and closes', async () => {
        const current = store('');
        const changes: string[] = [];
        const closes: string[] = [];
        await open({ bind: current, onchange: (v: string) => changes.push(v), onclose: (o: string) => closes.push(o) });

        cell('#2196f3').click();
        expect(cell('#2196f3').className).toContain('lm-color-selected'); // marked
        expect(current.value).toBe(''); // not committed (v5 closeOnChange default)
        expect(changes).toEqual([]);
        expect(modal()).not.toBeNull(); // still open

        (handle!.query('.lm-color-done') as HTMLElement).click();
        expect(current.value).toBe('#2196f3');
        expect(changes).toEqual(['#2196f3']);
        expect(modal()).toBeNull();
        expect(closes).toEqual(['button']);
    });

    it('closeonchange: a swatch click commits, fires onchange and closes (origin select)', async () => {
        const current = store('');
        const changes: string[] = [];
        const closes: string[] = [];
        await open({
            bind: current,
            closeonchange: true,
            onchange: (v: string) => changes.push(v),
            onclose: (o: string) => closes.push(o),
        });

        cell('#4caf50').click();
        expect(current.value).toBe('#4caf50');
        expect(changes).toEqual(['#4caf50']);
        expect(modal()).toBeNull();
        expect(closes).toEqual(['select']);
    });

    it('Reset clears the color, fires onchange and closes (v5 reset)', async () => {
        const current = store('#ff5722');
        const changes: string[] = [];
        await open({ bind: current, onchange: (v: string) => changes.push(v) });

        (handle!.query('.lm-color-reset') as HTMLElement).click();
        expect(current.value).toBe('');
        expect(changes).toEqual(['']);
        expect(modal()).toBeNull();
    });

    it('accepts a custom palette matrix — and normalizes a flat array to one row', async () => {
        await open({ palette: [['#111111', '#222222'], ['#333333']] });
        expect(handle!.queryAll('.lm-color-row')).toHaveLength(2);
        expect(cells()).toHaveLength(3);
        expect(cell('#333333')).not.toBeNull();
        handle!.unmount();

        handle = t(Color, { type: 'inline', palette: ['#aaaaaa', '#bbbbbb'] });
        expect(handle.queryAll('.lm-color-row')).toHaveLength(1);
        expect(cells()).toHaveLength(2);
    });

    it('the palette is live: a new matrix re-renders the grid (v5 constructRows)', () => {
        const palette = store([['#111111']]);
        handle = t(Color, { type: 'inline', palette });
        expect(cells()).toHaveLength(1);

        palette.value = [['#222222', '#333333'], ['#444444', '#555555']];
        expect(cells()).toHaveLength(4);
        expect(cell('#555555')).not.toBeNull();
    });

    it('api: open/close/isClosed/setValue/getValue — setValue fires onchange (v5)', async () => {
        const changes: string[] = [];
        const closes: string[] = [];
        const api = await open({ onchange: (v: string) => changes.push(v), onclose: (o: string) => closes.push(o) });

        api.setValue('#9c27b0');
        expect(api.getValue()).toBe('#9c27b0');
        expect(changes).toEqual(['#9c27b0']);
        expect(cell('#9c27b0').className).toContain('lm-color-selected'); // pending follows

        api.close();
        expect(modal()).toBeNull();
        expect(api.isClosed()).toBe(true);
        expect(closes).toEqual(['api']);

        api.open();
        await flush();
        expect(modal()).not.toBeNull();
    });

    it('type="input": renders the toggle input, click opens, the bound color paints it', async () => {
        const current = store('#e91e63');
        handle = t(Color, { type: 'input', bind: current, placeholder: 'Pick' });
        expect(input()).not.toBeNull();
        expect(input().value).toBe('#e91e63');
        expect(input().getAttribute('placeholder')).toBe('Pick');
        expect(input().style.color).not.toBe('');

        input().click();
        await flush();
        expect(modal()).not.toBeNull();

        current.value = ''; // external write flows in, silent
        expect(input().value).toBe('');
        expect(input().style.color).toBe('');
    });

    it('keyboard on the input: ArrowDown opens, Enter commits the pending color, Escape closes', async () => {
        const current = store('');
        const changes: string[] = [];
        const closes: string[] = [];
        handle = t(Color, {
            type: 'input',
            bind: current,
            onchange: (v: string) => changes.push(v),
            onclose: (o: string) => closes.push(o),
        });

        key('ArrowDown');
        await flush();
        expect(modal()).not.toBeNull();

        cell('#ffeb3b').click(); // pending
        key('Enter'); // commit (v5 update)
        expect(current.value).toBe('#ffeb3b');
        expect(changes).toEqual(['#ffeb3b']);
        expect(modal()).toBeNull();
        expect(closes).toEqual(['button']);

        key('ArrowUp');
        await flush();
        expect(modal()).not.toBeNull();
        key('Escape');
        expect(modal()).toBeNull();
        expect(closes).toEqual(['button', 'escape']);
    });

    it('focus leaving the control closes the popup (origin focusout)', async () => {
        const closes: string[] = [];
        await open({ onclose: (o: string) => closes.push(o) });

        // focus moving INSIDE the control does not close
        handle!.query('.lm-color')!.dispatchEvent(
            new FocusEvent('focusout', { relatedTarget: handle!.query('.lm-color-done') })
        );
        expect(modal()).not.toBeNull();

        handle!.query('.lm-color')!.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
        expect(modal()).toBeNull();
        expect(closes).toEqual(['focusout']);
    });

    it('type="inline": the panel renders without a Modal and selections commit immediately', () => {
        const current = store('');
        const changes: string[] = [];
        handle = t(Color, { type: 'inline', bind: current, onchange: (v: string) => changes.push(v) });
        expect(modal()).toBeNull();
        expect(handle.query('.lm-color-panel')).not.toBeNull();
        expect(handle.query('.lm-color')!.getAttribute('data-type')).toBe('inline');

        cell('#00bcd4').click();
        expect(current.value).toBe('#00bcd4');
        expect(changes).toEqual(['#00bcd4']);
        expect(cell('#00bcd4').className).toContain('lm-color-selected');
        expect(handle.query('.lm-color-panel')).not.toBeNull(); // nothing to close
    });

    it('tabs: Spectrum shows the canvas + point, Grid returns to the palette', async () => {
        await open();
        const tabs = handle!.queryAll('.lm-color-tab');
        expect(tabs.map((b) => b.textContent)).toEqual(['Grid', 'Spectrum']);
        expect(tabs[0].hasAttribute('data-active')).toBe(true);

        tabs[1].click();
        expect(handle!.query('.lm-color-canvas')).not.toBeNull();
        expect(handle!.query('.lm-color-point')).not.toBeNull();
        expect(handle!.query('.lm-color-grid')).toBeNull();
        expect(tabs[1].hasAttribute('data-active')).toBe(true);
        expect(tabs[0].hasAttribute('data-active')).toBe(false);

        // no 2d context in jsdom: sampling is guarded, exactly like v5
        handle!.query('.lm-color-canvas')!.dispatchEvent(new MouseEvent('mousedown', { buttons: 1, bubbles: true }));

        tabs[0].click();
        expect(handle!.query('.lm-color-grid')).not.toBeNull();
        expect(handle!.query('.lm-color-canvas')).toBeNull();
    });

    it('reopen restores the v5 pending model: the mark returns to the committed color', async () => {
        const current = store('#f44336');
        const api = await open({ bind: current });

        cell('#2196f3').click(); // pending only
        api.close();
        api.open();
        await flush();
        expect(cell('#f44336').className).toContain('lm-color-selected'); // pending reset to value
        expect(cell('#2196f3').className).not.toContain('lm-color-selected');
        expect(current.value).toBe('#f44336');
    });
});
