/**
 * <Dialog /> — confirm / alert / prompt on the Modal primitive.
 *
 * Faithful port of @lemonadejs/dialog (the v5 jdialog): a small centered
 * box over a backdrop with a title, a message, an OK button and — per the
 * exact v5 visibility rule — a Cancel button, plus the 'input' type that
 * adds a prompt field whose value reaches onconfirm. Like v5, nothing but
 * the buttons closes it (no Escape, no backdrop click).
 *
 * v5 → v6 mapping: show(options) → api.open(options) (per-open overrides,
 * exactly v5's setProperties merge — and open() returns a Promise of
 * { confirmed, value } as the modern surface); hide() → api.close()
 * (silent, fires no events, v5 parity); input → bind (two-way prompt
 * value); inputPlaceholder → placeholder; confirmLabel → confirmlabel
 * (v5 declared it but hardcoded "OK" in the template — honored here);
 * cancelLabel → cancellabel; type 'default' → ''. onconfirm receives the
 * prompt VALUE (v5 passed self so handlers read self.input). The v5
 * rootClass accumulation bug (' jdialog-alert' appended on every show)
 * is replaced by a data-type attribute.
 */

import { component, html } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

/** Per-open overrides — what v5 passed to show(options) */
export type DialogOptions = {
    title?: string;
    message?: string;
    type?: '' | 'alert' | 'input' | string;
    confirmlabel?: string;
    cancellabel?: string;
    placeholder?: string;
    cancel?: boolean;
    input?: string;
    onconfirm?: (value: string) => void;
    oncancel?: () => void;
};

/** What api.open() resolves with */
export type DialogResult = { confirmed: boolean; value: string };

export const Dialog = component('dialog', {
    bind: String,                 // two-way prompt value (v5: input)
    title: '',                    // bold first line
    message: '',                  // body text under the title
    type: '',                     // '' (confirm) | 'alert' | 'input' (v5: 'default')
    confirmlabel: 'OK',           // OK button label (v5: confirmLabel, never rendered — fixed)
    cancellabel: 'Cancel',        // Cancel button label (v5: cancelLabel)
    placeholder: 'Value',         // prompt placeholder (v5: inputPlaceholder)
    cancel: true,                 // v5 rule: hides Cancel only on alert/input types
    onconfirm: Function,          // (value) — the prompt value ('' for other types)
    oncancel: Function,           // Cancel button pressed
    api: { open: Function, close: Function },
}, (props, { state, bind }) => {
    const typed = bind(props, '');
    const opened = state(false);
    const overrides = state<DialogOptions>({});

    // Effective values: the last open(options) wins over props (v5
    // setProperties merged options straight into self)
    const title = () => overrides.value.title ?? (props.title!.value as string);
    const message = () => overrides.value.message ?? (props.message!.value as string);
    const kind = () => overrides.value.type ?? (props.type!.value as string);
    const confirmLabel = () => overrides.value.confirmlabel ?? (props.confirmlabel!.value as string);
    const cancelLabel = () => overrides.value.cancellabel ?? (props.cancellabel!.value as string);
    const placeholder = () => overrides.value.placeholder ?? (props.placeholder!.value as string);

    // v5: `cancel || !(type == 'alert' || type == 'input')` — Cancel always
    // shows on the default type; cancel=false hides it on alert/input
    const cancelVisible = () => {
        const wanted = overrides.value.cancel ?? (props.cancel!.value as boolean);
        const t = kind();
        return wanted || !(t === 'alert' || t === 'input');
    };

    // ---- open/close + the promise surface
    let resolvePending: ((result: DialogResult) => void) | null = null;
    let pending: Promise<DialogResult> | null = null;

    const doOpen = (options?: DialogOptions): Promise<DialogResult> => {
        overrides.value = options ? { ...options } : {};
        if (options && options.input !== undefined) {
            typed.value = options.input; // preset the prompt (v5: show({ input }))
        }
        opened.value = true;
        if (!pending) {
            pending = new Promise((resolve) => (resolvePending = resolve));
        }
        return pending;
    };

    /** Close and resolve the pending promise; returns the prompt value */
    const settle = (confirmed: boolean): string => {
        opened.value = false;
        const current = (typed.value as string) || '';
        const resolve = resolvePending;
        resolvePending = null;
        pending = null;
        resolve?.({ confirmed, value: current });
        return current;
    };

    // v5 order: hide first, then the callback
    const confirm = () => {
        const handler = (overrides.value.onconfirm ?? props.onconfirm) as
            | ((value: string) => void)
            | undefined;
        const current = settle(true);
        handler?.(current);
    };

    const cancel = () => {
        const handler = (overrides.value.oncancel ?? props.oncancel) as (() => void) | undefined;
        settle(false);
        handler?.();
    };

    props.ref?.({
        open: doOpen,
        close: () => {
            if (opened.value) {
                settle(false); // silent — v5 hide() fired no events
            }
        },
    });

    return html`<div class="lm-dialog" data-type="${() => kind() || false}">
        <${Modal} bind="${opened}" header="${false}" backdrop responsive="${false}">
            <div class="lm-dialog-header">
                <div class="lm-dialog-title">${title}</div>
                <div class="lm-dialog-message">${message}</div>
            </div>
            <div class="lm-dialog-footer">
                ${() =>
                    kind() === 'input' &&
                    html`<div class="lm-dialog-prompt">
                        <input type="text" class="lm-dialog-input"
                            value="${() => (typed.value as string) || ''}"
                            placeholder="${() => placeholder() || false}"
                            oninput="${(e: Event) => (typed.value = (e.target as HTMLInputElement).value)}" />
                    </div>`}
                <div class="lm-dialog-option">
                    <input type="button" class="lm-dialog-confirm"
                        value="${confirmLabel}"
                        onclick="${confirm}" />
                </div>
                ${() =>
                    cancelVisible() &&
                    html`<div class="lm-dialog-option">
                        <input type="button" class="lm-dialog-cancel"
                            value="${cancelLabel}"
                            onclick="${cancel}" />
                    </div>`}
            </div>
        </${Modal}>
    </div>`;
});

export default Dialog;
