/**
 * <Button /> — a pressable action block (LemonadeJS v6, MUI-inspired)
 *
 * Modeled on MUI's Button adapted to the v6 contract model: a real
 * <button> (native semantics, native disabled, native keyboard
 * activation) — or a real <a> when `href` is set. Three variants
 * (contained is the default), five colors, three sizes, an optional
 * material icon, and a loading state whose spinner replaces the content
 * while clicks are blocked. Ripple-free by design: hover/active/
 * focus-visible states live entirely in CSS.
 *
 * Content: `label` for plain text, or children for anything richer —
 * both render inside the same button.
 */

import { component, html } from 'lemonadejs';

export const Button = component('button', {
    label: '',                    // text content (children also supported)
    variant: '',                  // '' = contained | outlined | text
    color: '',                    // '' = primary | secondary | success | error | warning
    size: '',                     // small | large (default in between)
    disabled: false,              // blocks interaction (native on <button>)
    loading: false,               // spinner replaces the content; disabled while on
    fullwidth: false,             // stretch to the container width
    href: '',                     // renders a real <a> instead of <button>
    type: '',                     // button type: submit | reset ('' = button)
    icon: '',                     // material icon name shown before the label
    onclick: Function,            // fires on activation (never while disabled/loading)
}, (props) => {
    const blocked = () => props.disabled.value || props.loading.value;

    const press = (e: MouseEvent) => {
        if (blocked()) {
            e.preventDefault();
            return;
        }
        props.onclick?.(e);
    };

    const classes = () =>
        (props.fullwidth.value ? ' lm-button-fullwidth' : '') +
        (blocked() ? ' lm-button-disabled' : '');

    /** Spinner while loading; icon + label + children otherwise */
    const content = () => html`${() =>
        props.loading.value
            ? html`<span class="lm-button-spinner"></span>`
            : html`${() =>
                  props.icon.value &&
                  html`<i class="lm-button-icon material-icons">${props.icon}</i>`}${() =>
                  props.label.value &&
                  html`<span class="lm-button-label">${props.label}</span>`}${props.children}`}`;

    return html`${() =>
        props.href.value
            ? html`<a class="lm-button ${classes}"
                  href="${props.href}"
                  data-variant="${() => props.variant.value || false}"
                  data-color="${() => props.color.value || false}"
                  data-size="${() => props.size.value || false}"
                  aria-disabled="${() => (blocked() ? 'true' : false)}"
                  onclick="${press}">${content()}</a>`
            : html`<button class="lm-button ${classes}"
                  type="${() => props.type.value || 'button'}"
                  data-variant="${() => props.variant.value || false}"
                  data-color="${() => props.color.value || false}"
                  data-size="${() => props.size.value || false}"
                  disabled="${blocked}"
                  onclick="${press}">${content()}</button>`}`;
});

export default Button;
