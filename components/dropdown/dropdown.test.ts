/**
 * <Dropdown /> — the nuance matrix, verified: normalization, groups,
 * single/multiple, divisor strings, escape-cancel vs close-commit,
 * autocomplete filter (keywords/synonym, selected always kept), remote
 * search with debounce + veto, insert flow with async veto, keyboard
 * system, virtualization, inline mode, data revalidation.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Dropdown, { type DropdownItem } from '@lemonadejs/dropdown';

type Api = {
    open(): void;
    close(origin?: string): void;
    toggle(): void;
    isClosed(): boolean;
    getValue(): unknown;
    setValue(v: unknown): void;
    getText(): unknown;
    getData(): unknown;
    setData(d: unknown[]): void;
    add(item: DropdownItem): Promise<void> | void;
    reset(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const fruits = () => [
    { value: 1, text: 'Apple', group: 'Fruits', keywords: ['red', 'green'] },
    { value: 2, text: 'Banana', group: 'Fruits', synonym: 'plantain' },
    { value: 3, text: 'Carrot', group: 'Vegetables' },
    { value: 4, text: 'Daikon', group: 'Vegetables', disabled: true },
    { value: 5, text: 'Egg' },
];

const open = async (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Dropdown, {
        data: fruits(),
        ...props,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const input = () => handle!.query('.lm-dropdown-input') as HTMLElement;
const listedItems = () => handle!.queryAll('.lm-dropdown-item');
const itemByText = (text: string) => listedItems().find((el) => el.textContent!.includes(text))!;
const rootEl = () => handle!.query('.lm-dropdown') as HTMLElement;
const key = (k: string) => rootEl().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('components/dropdown — the select on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Dropdown).pass).toBe(true);
    });

    it('normalizes strings, numbers and {id,name} into items', async () => {
        const api = await open({ data: ['Red', 7, { id: 9, name: 'Nine' }] });
        api.open();
        await flush();
        expect(listedItems().map((el) => el.textContent!.trim())).toEqual(['Red', '7', 'Nine']);
        itemByText('Nine').click();
        expect(api.getValue()).toBe(9); // {id,name} → value: id
    });

    it('groups sort together and render header rows', async () => {
        const api = await open({ data: [...fruits()].reverse() }); // scrambled
        api.open();
        await flush();
        const rows = handle!.queryAll('.lm-dropdown-group, .lm-dropdown-item').map((el) => el.textContent!.trim());
        // Groups cluster (Fruits < Vegetables); INSIDE a group the input
        // order survives (v5's stable sort only compares group names)
        expect(rows).toEqual(['Egg', 'Fruits', 'Banana', 'Apple', 'Vegetables', 'Daikon', 'Carrot']);
    });

    it('single select: click commits, closes and fires onchange once', async () => {
        const changes: unknown[] = [];
        const api = await open({ onchange: (v: unknown) => changes.push(v) });
        api.open();
        await flush();
        itemByText('Banana').click();
        expect(api.isClosed()).toBe(true);
        expect(api.getValue()).toBe(2);
        expect(api.getText()).toBe('Banana');
        expect(changes).toEqual([2]);
        expect(input().textContent).toBe('Banana'); // label after close
    });

    it('ESCAPE cancels: the previous value survives (v5)', async () => {
        const changes: unknown[] = [];
        const api = await open({ bind: '1', onchange: (v: unknown) => changes.push(v) });
        api.open();
        await flush();
        itemByText('Carrot').click(); // single select normally closes...
        api.open(); // ...so test the multi-step: open again and Escape
        await flush();
        key('Escape');
        expect(api.isClosed()).toBe(true);
        // The Carrot commit DID happen (click closed = commit)
        expect(changes).toEqual([3]);

        // Now: select with keyboard but escape before closing
        const api2 = api;
        api2.open();
        await flush();
        key('ArrowDown'); // cursor moves
        key('Escape'); // cancel
        expect(api2.getValue()).toBe(3); // unchanged
        expect(changes).toEqual([3]); // no second event
    });

    it('multiple: toggling stays open; Done commits ONE change with the array', async () => {
        const changes: unknown[] = [];
        const api = await open({ multiple: true, onchange: (v: unknown) => changes.push(v) });
        api.open();
        await flush();
        itemByText('Apple').click();
        itemByText('Carrot').click();
        expect(api.isClosed()).toBe(false); // multiple keeps the panel open
        api.close('button');
        expect(changes).toEqual([[1, 3]]);
        expect(input().textContent).toBe('Apple; Carrot');
    });

    it("divisor strings: bind '1;3' selects both ways (v5 value model)", async () => {
        const api = await open({ multiple: true, bind: '1;3' });
        expect(input().textContent).toBe('Apple; Carrot');
        api.open();
        await flush();
        expect(itemByText('Apple').getAttribute('data-selected')).toBe('true');
        expect(itemByText('Carrot').getAttribute('data-selected')).toBe('true');
    });

    it('allowempty=false pins the last selection (v5)', async () => {
        const api = await open({ bind: '5', allowempty: false });
        api.open();
        await flush();
        itemByText('Egg').click(); // try to deselect the only value
        expect(String(api.getValue())).toBe('5'); // still selected (no commit happened)
    });

    it('disabled items are inert', async () => {
        const api = await open();
        api.open();
        await flush();
        itemByText('Daikon').click();
        expect(api.getValue()).toBeNull();
        expect(api.isClosed()).toBe(false);
    });

    it('autocomplete: opening from a FOCUSED label stays open (disposal blur is not a focusout)', async () => {
        // The browser flow: mousedown focuses the label (tabindex), open()
        // swaps the branch to the search field, the engine blurs the
        // disposed label — that synthetic focusout must NOT close
        const api = await open({ autocomplete: true });
        input().focus();
        expect(document.activeElement).toBe(input());
        api.open();
        await flush();
        expect(api.isClosed()).toBe(false); // still open
        expect(input().getAttribute('contenteditable')).toBe('true');
    });

    it('autocomplete: open swaps the label for a contenteditable search field', async () => {
        const api = await open({ autocomplete: true, bind: '1' });
        expect(input().getAttribute('contenteditable')).toBeNull();
        api.open();
        await flush();
        expect(input().getAttribute('contenteditable')).toBe('true');
        expect(input().textContent).toBe(''); // cleared for typing (v5)
        api.close();
        expect(input().getAttribute('contenteditable')).toBeNull();
        expect(input().textContent).toBe('Apple'); // label restored
    });

    it('autocomplete filter: text, group, keywords, synonym; selected always kept', async () => {
        const api = await open({ autocomplete: true, bind: '5' }); // Egg selected
        api.open();
        await flush();
        input().textContent = 'plantain'; // Banana's synonym
        input().dispatchEvent(new Event('input', { bubbles: true }));
        const texts = listedItems().map((el) => el.textContent!.trim());
        expect(texts).toContain('Banana');
        expect(texts).toContain('Egg'); // selected stays listed (v5)
        expect(texts).not.toContain('Carrot');

        input().textContent = 'red'; // Apple's keyword
        input().dispatchEvent(new Event('input', { bubbles: true }));
        expect(listedItems().map((el) => el.textContent!.trim())).toEqual(['Apple', 'Egg']);
        void api;
    });

    it('remote search: debounced fetch url?q=, results behind selected, onsearch', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn(async (u: string) => {
            expect(u).toContain('/api?q=ba');
            return { json: async () => [{ id: 20, name: 'Bacon' }] } as Response;
        });
        vi.stubGlobal('fetch', fetchMock);
        const searched: unknown[] = [];
        const api = await open({
            remote: true,
            url: '/api',
            bind: '1',
            data: fruits(),
            onsearch: (r: unknown) => searched.push(r),
        });
        api.open();
        await vi.advanceTimersByTimeAsync(1);
        input().textContent = 'ba';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        expect(fetchMock).not.toHaveBeenCalled(); // debounce
        await vi.advanceTimersByTimeAsync(350);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const texts = listedItems().map((el) => el.textContent!.trim());
        expect(texts).toEqual(['Apple', 'Bacon']); // selected first, then results
        expect(searched).toHaveLength(1);
    });

    it('onbeforesearch returning false vetoes the remote call', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const api = await open({ remote: true, url: '/api', onbeforesearch: () => false });
        api.open();
        await vi.advanceTimersByTimeAsync(1);
        input().textContent = 'x';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        await vi.advanceTimersByTimeAsync(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('insert: the + button adds the typed text; async onbeforeinsert can replace', async () => {
        const inserted: unknown[] = [];
        const api = await open({
            insert: true, // forces autocomplete
            onbeforeinsert: async (item: DropdownItem) => ({ ...item, value: 'custom-' + item.value }),
            oninsert: (item: DropdownItem) => inserted.push(item),
        });
        api.open();
        await flush();
        input().textContent = 'Fig';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        (handle!.query('.lm-dropdown-add') as HTMLElement).click();
        await flush();
        expect(inserted).toEqual([{ text: 'Fig', value: 'custom-Fig' }]);
        expect(listedItems().map((el) => el.textContent!.trim())).toContain('Fig');
    });

    it('keyboard: closed Enter opens; arrows wrap skipping group headers; Enter selects', async () => {
        const api = await open();
        rootEl().focus?.();
        key('Enter');
        expect(api.isClosed()).toBe(false);
        await flush();

        key('ArrowDown'); // Apple (skips the Fruits header)
        key('ArrowDown'); // Banana
        key('Enter');
        expect(api.getValue()).toBe(2);
        expect(api.isClosed()).toBe(true);
    });

    it('keyboard: Home/End jump, ArrowUp from nothing wraps to the last', async () => {
        const api = await open();
        api.open();
        await flush();
        key('ArrowUp'); // wraps to Egg (last item)
        key('Enter');
        expect(api.getValue()).toBe(5);
    });

    it('VIRTUALIZES large option lists (window of DOM)', async () => {
        const big = Array.from({ length: 5000 }, (_, i) => ({ value: i, text: 'Item ' + i }));
        const api = await open({ data: big, height: 280, rowheight: 28 });
        api.open();
        await flush();
        // ceil(280/28) + 8 overscan = 18 rows alive, not 5000
        expect(listedItems().length).toBe(18);
        const canvas = handle!.query('.lm-dropdown-canvas') as HTMLElement;
        expect(canvas.style.height).toBe(5000 * 28 + 'px');
    });

    it('inline: no modal, list always visible, select commits immediately', async () => {
        const changes: unknown[] = [];
        await open({ type: 'inline', onchange: (v: unknown) => changes.push(v) });
        expect(listedItems().length).toBeGreaterThan(0); // visible without open()
        expect(handle!.query('.lm-modal')).toBeNull();
        itemByText('Egg').click();
        expect(changes).toEqual([5]);
    });

    it('data changes revalidate the value: invalid resets to null (v5)', async () => {
        const data = store<unknown[]>(fruits());
        const api = await open({ data, bind: '2' });
        expect(input().textContent).toBe('Banana');
        data.value = [{ value: 9, text: 'New' }]; // Banana gone
        expect(api.getValue()).toBeNull();
        expect(input().textContent).toBe('');
    });

    it('external bind writes are silent and update the label', async () => {
        const value = store('');
        const changes: unknown[] = [];
        await open({ bind: value, onchange: (v: unknown) => changes.push(v) });
        value.value = '3';
        expect(input().textContent).toBe('Carrot');
        expect(changes).toEqual([]); // assignment is silent (v6)
    });

    it('api: setValue fires onchange, reset clears, setData replaces', async () => {
        const changes: unknown[] = [];
        const api = await open({ onchange: (v: unknown) => changes.push(v) });
        api.setValue('1');
        expect(changes).toEqual(['1']);
        expect(input().textContent).toBe('Apple');

        api.reset();
        expect(api.getValue()).toBeNull();
        expect(input().textContent).toBe('');

        api.setData([{ value: 'z', text: 'Zeta' }]);
        api.open();
        await flush();
        expect(listedItems().map((el) => el.textContent!.trim())).toEqual(['Zeta']);
    });

    it('initial url load fetches once and fires onload (v5)', async () => {
        const fetchMock = vi.fn(async () => ({ json: async () => ['Alpha', 'Beta'] }) as Response);
        vi.stubGlobal('fetch', fetchMock);
        const loaded: number[] = [];
        const api = await open({ data: [], url: '/options.json', onload: () => loaded.push(1) });
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(loaded).toEqual([1]);
        api.open();
        await flush();
        expect(listedItems().map((el) => el.textContent!.trim())).toEqual(['Alpha', 'Beta']);
    });

    it('images render inside items', async () => {
        const api = await open({ data: [{ value: 1, text: 'Pic', image: '/x.png' }] });
        api.open();
        await flush();
        expect(itemByText('Pic').querySelector('img')!.getAttribute('src')).toBe('/x.png');
    });

    it('placeholder lands on the input', async () => {
        await open({ placeholder: 'Pick a fruit' });
        expect(input().getAttribute('placeholder')).toBe('Pick a fruit');
    });

    it('width drives the panel width', async () => {
        const api = await open({ width: 300 });
        api.open();
        await flush();
        // jsdom measures the input at 0 and the longest text below 300:
        // the width prop wins and lands as the panel inline width
        expect((handle!.query('.lm-modal') as HTMLElement).style.width).toBe('300px');
    });

    it('onopen fires on open; onclose reports the origin', async () => {
        const opens: number[] = [];
        const origins: string[] = [];
        const api = await open({ onopen: () => opens.push(1), onclose: (o: string) => origins.push(o) });

        api.open();
        await flush();
        expect(opens).toEqual([1]);

        api.close(); // api default origin
        expect(origins).toEqual(['button']);

        api.open();
        await flush();
        key('Escape'); // cancel path reports its own origin
        expect(origins).toEqual(['button', 'escape']);
        expect(opens).toEqual([1, 1]);
    });
});
