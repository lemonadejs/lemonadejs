/**
 * <Switch /> — the canonical LemonadeJS v6 block
 *
 * Full property parity with the v5 plugin (label as text, checked, color, name,
 * disabled, position) plus the best of MUI's Switch (size, required,
 * value) on the v6 contract model. Built on a real
 * <input type="checkbox">: native form participation, native disabled
 * semantics, native keyboard accessibility.
 *
 * bind vs checked vs value (closer, but different — by design):
 *   bind="${state}"  the live two-way state (wins when present)
 *   checked          the INITIAL state when unbound
 *   value            the string submitted with the form when on (DOM semantics)
 */

import { component, html } from 'lemonadejs';

export const Switch = component('switch', {
    bind: Boolean,                // two-way state (v5: value)
    checked: false,               // initial state when unbound
    label: '',                    // label displayed beside the switch
    color: '',                    // green | orange | red | purple
    size: '',                     // small | large (default in between)
    name: '',                     // form identification name
    value: '',                    // form submit value when checked
    required: false,              // native form validation
    disabled: false,              // blocks interaction (native)
    position: '',                 // text position: 'right' moves it before the track
    onchange: Function,           // fires on user-initiated changes
    api: { toggle: Function },    // imperative surface via ref
}, (props, { bind }) => {
    const current = bind(props, props.checked.value as boolean);

    const toggle = () => {
        if (!props.disabled.value) {
            current.set(!current.value);
        }
    };

    props.ref?.({ toggle });

    return html`<label
        class="lm-switch ${() => (current.value ? 'lm-switch-on' : 'lm-switch-off')} ${() =>
            props.disabled.value ? 'lm-switch-disabled' : ''} ${() =>
            props.size.value ? 'lm-switch-' + props.size.value : ''}"
        data-position="${() => props.position.value || false}"
        data-color="${() => props.color.value || false}">
        <input type="checkbox" class="lm-switch-input"
            name="${props.name}"
            value="${() => props.value.value || false}"
            required="${props.required}"
            checked="${current}"
            disabled="${props.disabled}"
            onchange="${(e: Event) => current.set((e.target as HTMLInputElement).checked)}" />
        <span class="lm-switch-track"><span class="lm-switch-thumb"></span></span>
        ${() => props.label.value && html`<span class="lm-switch-label">${props.label}</span>`}
    </label>`;
});

export default Switch;
