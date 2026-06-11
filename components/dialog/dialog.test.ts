/**
 * <Dialog /> — built on Modal (v5 architecture). Behavior tests: the
 * confirm/alert/input types, the v5 footer model (OK + the exact Cancel
 * visibility rule), per-open overrides (v5 show(options)), the promise
 * surface, the two-way prompt bind and the silent api.close().
 *
 * Modal defers per-open setup one microtask — every open awaits flush().
 */
import { describe, it, expect, afterEach } from 'vitest';
import { store } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Dialog, { type DialogOptions, type DialogResult } from '@lemonadejs/dialog';

type Api = {
    open(options?: DialogOptions): Promise<DialogResult>;
    close(): void;
};

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

/** Modal defers per-open setup one microtask */
const flush = () => new Promise((r) => setTimeout(r, 0));

const modal = () => handle!.query('.lm-modal');
const title = () => handle!.query('.lm-dialog-title');
const message = () => handle!.query('.lm-dialog-message');
const confirmButton = () => handle!.query('.lm-dialog-confirm') as HTMLInputElement;
const cancelButton = () => handle!.query('.lm-dialog-cancel') as HTMLInputElement | null;
const prompt = () => handle!.query('.lm-dialog-input') as HTMLInputElement | null;
const root = () => handle!.query('.lm-dialog')!;

const open = async (props: Record<string, unknown> = {}, options?: DialogOptions) => {
    let api: Api | null = null;
    handle = t(Dialog, { ...props, ref: (a: Api) => (api = a) });
    const result = api!.open(options);
    await flush();
    return { api: api!, result };
};

const type = (text: string) => {
    prompt()!.value = text;
    prompt()!.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('components/dialog — on the Modal primitive', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Dialog).pass).toBe(true);
    });

    it('starts closed; api.open() shows a centered backdrop box with title and message', async () => {
        let api: Api | null = null;
        handle = t(Dialog, {
            title: 'Are you sure?',
            message: 'This cannot be undone.',
            ref: (a: Api) => (api = a),
        });
        expect(modal()).toBeNull();

        api!.open();
        await flush();
        expect(modal()).not.toBeNull();
        expect(handle!.query('.lm-modal-backdrop')).not.toBeNull(); // v5 overlay
        expect(modal()!.querySelector('.lm-modal-header')).toBeNull(); // headerless: the dialog owns its header
        expect(title()!.textContent).toBe('Are you sure?');
        expect(message()!.textContent).toBe('This cannot be undone.');
    });

    it('confirm closes first, then fires onconfirm (v5 order)', async () => {
        const calls: string[] = [];
        await open({
            onconfirm: () => calls.push('confirm:' + (modal() === null)),
        });

        confirmButton().click();
        expect(modal()).toBeNull();
        expect(calls).toEqual(['confirm:true']); // already hidden when the callback ran
    });

    it('cancel closes and fires oncancel only', async () => {
        const calls: string[] = [];
        await open({
            onconfirm: () => calls.push('confirm'),
            oncancel: () => calls.push('cancel'),
        });

        cancelButton()!.click();
        expect(modal()).toBeNull();
        expect(calls).toEqual(['cancel']);
    });

    it('open() resolves { confirmed: true, value } on confirm', async () => {
        const { result } = await open();
        confirmButton().click();
        expect(await result).toEqual({ confirmed: true, value: '' });
    });

    it('open() resolves { confirmed: false } on cancel', async () => {
        const { result } = await open();
        cancelButton()!.click();
        expect(await result).toEqual({ confirmed: false, value: '' });
    });

    it('renders the default and custom button labels (v5 hardcoded "OK" — honored here)', async () => {
        await open();
        expect(confirmButton().value).toBe('OK');
        expect(cancelButton()!.value).toBe('Cancel');
        handle!.unmount();

        await open({ confirmlabel: 'Delete', cancellabel: 'Keep' });
        expect(confirmButton().value).toBe('Delete');
        expect(cancelButton()!.value).toBe('Keep');
    });

    it('keeps the exact v5 Cancel rule: always on the default type, cancel=false hides it on alert/input', async () => {
        await open({ cancel: false }); // default type: !(alert||input) wins
        expect(cancelButton()).not.toBeNull();
        handle!.unmount();

        await open({ type: 'alert' }); // cancel defaults true
        expect(cancelButton()).not.toBeNull();
        handle!.unmount();

        await open({ type: 'alert', cancel: false });
        expect(cancelButton()).toBeNull();
        handle!.unmount();

        await open({ type: 'input', cancel: false });
        expect(cancelButton()).toBeNull();
    });

    it('exposes the type as a data attribute (v5 rootClass, without the accumulation bug)', async () => {
        await open({ type: 'alert' });
        expect(root().getAttribute('data-type')).toBe('alert');
        handle!.unmount();

        await open();
        expect(root().hasAttribute('data-type')).toBe(false);
    });

    it('type=input renders the prompt with the placeholder and passes the value to onconfirm', async () => {
        const values: string[] = [];
        await open({ type: 'input', placeholder: 'Your name', onconfirm: (v: string) => values.push(v) });
        expect(prompt()).not.toBeNull();
        expect(prompt()!.getAttribute('placeholder')).toBe('Your name');

        type('Paul');
        confirmButton().click();
        expect(values).toEqual(['Paul']);
    });

    it('default placeholder is "Value" (v5 inputPlaceholder)', async () => {
        await open({ type: 'input' });
        expect(prompt()!.getAttribute('placeholder')).toBe('Value');
    });

    it('bind is the two-way prompt value: typing flows out, external writes flow in', async () => {
        const name = store('initial');
        await open({ type: 'input', bind: name });
        expect(prompt()!.value).toBe('initial');

        type('typed');
        expect(name.value).toBe('typed');

        name.value = 'outside';
        expect(prompt()!.value).toBe('outside');
    });

    it('the promise resolves with the typed value', async () => {
        const { result } = await open({ type: 'input' });
        type('blue');
        confirmButton().click();
        expect(await result).toEqual({ confirmed: true, value: 'blue' });
    });

    it('open(options) overrides props per open — the v5 show(options) merge', async () => {
        const propConfirms: string[] = [];
        const openConfirms: string[] = [];
        const { api } = await open(
            { title: 'From props', onconfirm: (v: string) => propConfirms.push(v) },
            {
                title: 'From open()',
                type: 'input',
                input: 'preset',
                onconfirm: (v: string) => openConfirms.push(v),
            }
        );
        expect(title()!.textContent).toBe('From open()');
        expect(prompt()!.value).toBe('preset'); // options.input presets the prompt

        confirmButton().click();
        expect(openConfirms).toEqual(['preset']); // the override replaced the prop (v5 setProperties)
        expect(propConfirms).toEqual([]);

        // The next plain open falls back to the declared props
        api.open();
        await flush();
        expect(title()!.textContent).toBe('From props');
        expect(prompt()).toBeNull();
    });

    it('api.close() hides silently (v5 hide: no events) and resolves the promise as not confirmed', async () => {
        const calls: string[] = [];
        const { api, result } = await open({
            onconfirm: () => calls.push('confirm'),
            oncancel: () => calls.push('cancel'),
        });

        api.close();
        expect(modal()).toBeNull();
        expect(calls).toEqual([]);
        expect(await result).toEqual({ confirmed: false, value: '' });
    });

    it('props are live states: title and message update while open', async () => {
        const heading = store('Before');
        await open({ title: heading });
        expect(title()!.textContent).toBe('Before');

        heading.value = 'After';
        expect(title()!.textContent).toBe('After');
    });

    it('neither Escape nor the backdrop closes it — only the buttons (v5 parity)', async () => {
        await open();
        modal()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(modal()).not.toBeNull();

        (handle!.query('.lm-modal-backdrop') as HTMLElement).click();
        expect(modal()).not.toBeNull();
    });
});
