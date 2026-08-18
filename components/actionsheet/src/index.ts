/**
 * <Actionsheet /> — iOS-style action sheet on the Modal primitive.
 *
 * Faithful port of @lemonadejs/actionsheet (v5): a bottom sheet over a
 * dimmed backdrop, listing GROUPS of actions — each group a white rounded
 * card, each action a full-width button; action: 'cancel' renders red.
 * Built ON Modal (headerless, position bottom, backdrop) the way every
 * v5 floating surface was built on @lemonadejs/modal.
 *
 * v5 → v6 mapping: visible → bind (the open state, two-way); show()/hide()
 * → api.open()/close()/toggle() + isOpened(); actions keeps its name and
 * its shape ([{ options: [{ title, action, className, onclick }] }]) and
 * is LIVE — swap the array, the sheet re-renders (v5 show(options) merged
 * properties; in v6 you write the state instead). Per-option onclick still
 * receives the option object. The sheet does NOT auto-close on a pick —
 * exactly like v5, closing is the consumer's call.
 *
 * Added: closable (backdrop click closes — v5 shipped no close affordance
 * at all; Escape ALWAYS closes regardless: the backdrop Modal traps Tab
 * inside the sheet, so the keyboard must keep an exit); title/message
 * header card (v5 shipped the CSS for
 * .jactionsheet-title/-message but never rendered them — resurrected).
 * Dropped: the v5 slide-bottom-out exit animation (it gated closing on
 * animationend; v6 closes immediately, the slide-IN stays, pure CSS).
 * onclose(origin): 'backdrop' | 'escape' | 'api'.
 */

import { component, html } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

export type ActionsheetOption = {
    title: string;
    action?: string; // 'cancel' renders red (v5)
    className?: string; // extra class on the button (v5)
    onclick?: (option: ActionsheetOption) => void;
};

export type ActionsheetGroup = {
    options: ActionsheetOption[];
};

export const Actionsheet = component('actionsheet', {
    bind: Boolean,                // open state (v5: visible)
    actions: Array,               // ActionsheetGroup[] — live (v5: actions)
    title: '',                    // optional header card title (v5 CSS, resurrected)
    message: '',                  // optional header card message (v5 CSS, resurrected)
    label: 'Actions',             // accessible name when there is no title (aria-label)
    closable: false,              // backdrop click closes the sheet (Escape always closes)
    onopen: Function,             // sheet opened
    onclose: Function,            // sheet closed (origin)
    api: {
        open: Function,
        close: Function,
        toggle: Function,
        isOpened: Function,
    },
}, (props, { bind }) => {
    const opened = bind(props, false);

    const doOpen = () => {
        if (!opened.value) {
            opened.set(true);
            props.onopen?.();
        }
    };

    const doClose = (origin: string) => {
        if (opened.value) {
            opened.set(false);
            props.onclose?.(origin);
        }
    };

    props.ref?.({
        open: doOpen,
        close: () => doClose('api'),
        toggle: () => (opened.value ? doClose('api') : doOpen()),
        isOpened: () => !!opened.value,
    });

    // v5 Actiongroup normalized a missing options array to []
    const groups = (): ActionsheetGroup[] => {
        const a = props.actions.value as ActionsheetGroup[] | undefined;
        return Array.isArray(a) ? a : [];
    };

    const pick = (option: ActionsheetOption) => {
        option.onclick?.(option); // v5: self.onclick(self) — the option itself
    };

    return html`<div class="lm-actionsheet"
        onkeydown="${(e: KeyboardEvent) => {
            // The backdrop Modal traps Tab inside the sheet — Escape must
            // stay a keyboard exit even with closable off (WCAG 2.1.2).
            // With closable on, Modal's own Escape handling runs first and
            // stops propagation, so this only catches the trapped case.
            if (e.key === 'Escape' && opened.value) {
                e.preventDefault();
                e.stopImmediatePropagation();
                doClose('escape');
            }
        }}">
        <${Modal} bind="${opened}" header="${false}" position="bottom" backdrop
            closable="${props.closable}"
            title="${props.title}"
            label="${props.label}"
            onclose="${(origin: string) => props.onclose?.(origin)}">
            ${() =>
                Boolean(props.title.value || props.message.value) &&
                html`<div class="lm-actionsheet-group lm-actionsheet-header">
                    ${() => props.title.value && html`<div class="lm-actionsheet-title">${props.title}</div>`}
                    ${() => props.message.value && html`<div class="lm-actionsheet-message">${props.message}</div>`}
                </div>`}
            ${() =>
                groups().map(
                    (group) => html`<div class="lm-actionsheet-group">
                        ${(Array.isArray(group.options) ? group.options : []).map(
                            (option) => html`<button type="button"
                                class="lm-actionsheet-option ${option.className || ''}"
                                data-action="${option.action || false}"
                                onclick="${() => pick(option)}">${option.title}</button>`
                        )}
                    </div>`
                )}
        </${Modal}>
    </div>`;
});

export default Actionsheet;
