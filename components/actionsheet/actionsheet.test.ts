/**
 * <Actionsheet /> — built on Modal (v5 architecture). Behavior tests:
 * the v5 group/option model (groups of full-width buttons, cancel red,
 * custom classes, per-option onclick receiving the option, NO auto-close
 * on pick), open/close through the api and the bound state, the live
 * actions list, the closable affordances (backdrop/Escape) and the
 * resurrected title/message header card.
 *
 * jsdom has no layout: no geometry assertions, structure only.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Actionsheet, { type ActionsheetGroup, type ActionsheetOption } from '@lemonadejs/actionsheet';

type Api = {
    open(): void;
    close(): void;
    toggle(): void;
    isOpened(): boolean;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** Modal defers per-open setup one microtask */
const flush = () => new Promise((r) => setTimeout(r, 0));

const modal = () => handle!.query('.lm-modal');
const groups = () => handle!.queryAll('.lm-actionsheet-group');
const options = () => handle!.queryAll('.lm-actionsheet-option') as HTMLButtonElement[];
const option = (title: string) => options().find((b) => b.textContent === title)!;

const sample = (): ActionsheetGroup[] => [
    {
        options: [
            { title: 'Save', onclick: () => {} },
            { title: 'Delete', className: 'danger' },
        ],
    },
    {
        options: [{ title: 'Cancel', action: 'cancel' }],
    },
];

const open = async (props: Record<string, unknown> = {}) => {
    let api: Api | null = null;
    handle = t(Actionsheet as never, { actions: sample(), ...props, ref: (a: Api) => (api = a) } as never);
    api!.open();
    await flush();
    return api!;
};

describe('components/actionsheet — on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Actionsheet as never).pass).toBe(true);
    });

    it('starts closed and opens a headerless bottom-sheet Modal, firing onopen', async () => {
        const opens: number[] = [];
        let api: Api | null = null;
        handle = t(Actionsheet as never, {
            actions: sample(),
            onopen: () => opens.push(1),
            ref: (a: Api) => (api = a),
        } as never);
        expect(modal()).toBeNull();
        expect(api!.isOpened()).toBe(false);

        api!.open();
        await flush();
        expect(modal()).not.toBeNull();
        expect(modal()!.querySelector('.lm-modal-header')).toBeNull(); // headerless sheet
        expect(handle.query('.lm-modal-root')!.getAttribute('data-position')).toBe('bottom');
        expect(handle.query('.lm-modal-backdrop')).not.toBeNull(); // v5 dimmed overlay
        expect(opens).toEqual([1]);
        expect(api!.isOpened()).toBe(true);

        api!.open(); // idempotent: no second onopen
        expect(opens).toEqual([1]);
    });

    it('renders the v5 group/option model: group cards of full-width buttons, in order', async () => {
        await open();
        expect(groups()).toHaveLength(2);
        expect(options()).toHaveLength(3);
        expect(options().map((b) => b.textContent)).toEqual(['Save', 'Delete', 'Cancel']);
        expect(groups()[0].querySelectorAll('.lm-actionsheet-option')).toHaveLength(2);
        expect(groups()[1].querySelectorAll('.lm-actionsheet-option')).toHaveLength(1);
    });

    it('marks cancel actions and custom classes (v5: action/className)', async () => {
        await open();
        expect(option('Cancel').getAttribute('data-action')).toBe('cancel');
        expect(option('Save').hasAttribute('data-action')).toBe(false); // empty → no attribute
        expect(option('Delete').className).toContain('danger');
    });

    it('clicking an option fires its onclick with the option object and does NOT auto-close (v5)', async () => {
        const picked: ActionsheetOption[] = [];
        const closes: string[] = [];
        const actions: ActionsheetGroup[] = [
            { options: [{ title: 'Share', action: 'share', onclick: (o) => picked.push(o) }, { title: 'Mute' }] },
        ];
        await open({ actions, onclose: (o: string) => closes.push(o) });

        option('Share').click();
        expect(picked).toHaveLength(1);
        expect(picked[0].title).toBe('Share');
        expect(picked[0].action).toBe('share');
        expect(modal()).not.toBeNull(); // still open — closing is the consumer's call
        expect(closes).toEqual([]);

        option('Mute').click(); // no onclick: a no-op, never throws
        expect(modal()).not.toBeNull();
    });

    it('api: close fires onclose(api), toggle round-trips, reopen renders the sheet again', async () => {
        const closes: string[] = [];
        const api = await open({ onclose: (o: string) => closes.push(o) });

        api.close();
        expect(modal()).toBeNull();
        expect(api.isOpened()).toBe(false);
        expect(closes).toEqual(['api']);

        api.close(); // idempotent
        expect(closes).toEqual(['api']);

        api.toggle();
        await flush();
        expect(modal()).not.toBeNull();
        expect(options()).toHaveLength(3); // content intact on reopen

        api.toggle();
        expect(modal()).toBeNull();
        expect(closes).toEqual(['api', 'api']);
    });

    it('bind is the open state, two-way (v5: visible)', async () => {
        const openState = store(false);
        let api: Api | null = null;
        handle = t(Actionsheet as never, {
            bind: openState,
            actions: sample(),
            ref: (a: Api) => (api = a),
        } as never);
        expect(modal()).toBeNull();

        openState.value = true; // external write opens, silent
        await flush();
        expect(modal()).not.toBeNull();
        expect(api!.isOpened()).toBe(true);

        api!.close(); // api write flows back out
        expect(openState.value).toBe(false);
        expect(modal()).toBeNull();
    });

    it('actions are live: swapping the array re-renders the sheet (v5: show(options) merge)', async () => {
        const actions = store<ActionsheetGroup[]>([{ options: [{ title: 'One' }] }]);
        await open({ actions });
        expect(options().map((b) => b.textContent)).toEqual(['One']);

        actions.value = [{ options: [{ title: 'Two' }, { title: 'Three' }] }, { options: [{ title: 'Four' }] }];
        expect(groups()).toHaveLength(2);
        expect(options().map((b) => b.textContent)).toEqual(['Two', 'Three', 'Four']);
    });

    it('normalizes bad shapes like v5: no actions / a group without options render empty', async () => {
        await open({ actions: undefined });
        expect(modal()).not.toBeNull();
        expect(groups()).toHaveLength(0);
        handle!.unmount();

        await open({ actions: [{} as ActionsheetGroup, { options: [{ title: 'Ok' }] }] });
        expect(groups()).toHaveLength(2);
        expect(options().map((b) => b.textContent)).toEqual(['Ok']);
    });

    it('default is NOT closable: backdrop clicks keep the sheet open (v5 had no close affordance)', async () => {
        const closes: string[] = [];
        await open({ onclose: (o: string) => closes.push(o) });

        (handle!.query('.lm-modal-backdrop') as HTMLElement).click();
        expect(modal()).not.toBeNull();
        expect(closes).toEqual([]);
    });

    it('closable: backdrop click closes (origin backdrop)', async () => {
        const closes: string[] = [];
        const api = await open({ closable: true, onclose: (o: string) => closes.push(o) });

        (handle!.query('.lm-modal-backdrop') as HTMLElement).click();
        expect(modal()).toBeNull();
        expect(api.isOpened()).toBe(false);
        expect(closes).toEqual(['backdrop']);
    });

    it('closable: Escape closes (origin escape)', async () => {
        const closes: string[] = [];
        const api = await open({ closable: true, onclose: (o: string) => closes.push(o) });

        modal()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(modal()).toBeNull();
        expect(api.isOpened()).toBe(false);
        expect(closes).toEqual(['escape']);
    });

    it('title/message render a header card only when provided (resurrected v5 CSS)', async () => {
        await open({ title: 'Photo', message: 'Choose what to do with it' });
        expect(handle!.query('.lm-actionsheet-header')).not.toBeNull();
        expect(handle!.query('.lm-actionsheet-title')!.textContent).toBe('Photo');
        expect(handle!.query('.lm-actionsheet-message')!.textContent).toBe('Choose what to do with it');
        expect(groups()).toHaveLength(3); // header card + 2 action groups
        handle!.unmount();

        await open();
        expect(handle!.query('.lm-actionsheet-header')).toBeNull();
        expect(handle!.query('.lm-actionsheet-title')).toBeNull();
        handle!.unmount();

        await open({ title: 'Only a title' });
        expect(handle!.query('.lm-actionsheet-header')).not.toBeNull();
        expect(handle!.query('.lm-actionsheet-message')).toBeNull();
    });
});
