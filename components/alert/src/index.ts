/**
 * <Alert /> — a severity banner on the v6 contract model.
 *
 * Four severities (info — the default — success, warning, error) drive
 * the icon and the palette through data-severity; three flavors
 * (standard — the default — outlined, filled) through data-variant.
 * Icons are inline SVG: no external icon font dependency.
 *
 * Visibility is the bound state (default visible): the × button hides
 * the alert via .set — which fires onclose — while external writes to
 * the bound state stay silent. The whole alert is a branch on that
 * state: hidden means not in the DOM.
 *
 * Body content: title (bold AlertTitle line), message (plain text) and
 * props.children, rendered in that order.
 */

import { component, html } from 'lemonadejs';

/** Material symbol outlines: info, check_circle, warning, cancel */
const PATHS: Record<string, string> = {
    info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    success:
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    error:
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
};

export const Alert = component('alert', {
    severity: '',                 // '' = info | success | warning | error
    variant: '',                  // '' = standard | outlined | filled
    title: '',                    // optional bold title line
    message: '',                  // body text (children render after it)
    closable: false,              // shows the × button
    bind: Boolean,                // visibility two-way (default: visible)
    icon: true,                   // false hides the severity icon
    onclose: Function,            // fires when the × hides the alert
}, (props, { bind }) => {
    const visible = bind(props, true);

    const close = () => {
        visible.set(false);
        props.onclose?.();
    };

    // Severity drives the live-region urgency: warning/error interrupt
    // (role=alert), info/success wait their turn (role=status)
    return html`${() =>
        visible.value &&
        html`<div class="lm-alert"
            role="${() =>
                props.severity.value === 'warning' || props.severity.value === 'error' ? 'alert' : 'status'}"
            data-severity="${() => props.severity.value || false}"
            data-variant="${() => props.variant.value || false}">
            ${() =>
                props.icon.value &&
                html`<span class="lm-alert-icon"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path
                    fill="currentColor"
                    d="${() => PATHS[props.severity.value] || PATHS.info}"></path></svg></span>`}
            <div class="lm-alert-body">
                ${() => props.title.value && html`<div class="lm-alert-title">${props.title}</div>`}
                ${() => props.message.value && html`<div class="lm-alert-message">${props.message}</div>`}
                ${props.children}
            </div>
            ${() =>
                props.closable.value &&
                html`<button type="button" class="lm-alert-close" aria-label="Close"
                    onclick="${close}">×</button>`}
        </div>`}`;
});

export default Alert;
