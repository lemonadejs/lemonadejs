/**
 * <Toggle /> — a pressable toggle button (LemonadeJS v6 block)
 *
 * Full behavioral parity with the v5 plugin: a single on/off button built on
 * a hidden <input type="checkbox"> with an optional material icon and text
 * label (v5 props: text, icon, value, name, disabled, onchange). Distinct
 * from <Switch />: this looks like a button that stays pressed.
 *
 * bind vs checked (the v6 split of v5's `value`):
 *   bind="${state}"  the live two-way pressed state (wins when present)
 *   checked          the INITIAL state when unbound
 */

import { component, html } from 'lemonadejs';

export const Toggle = component('toggle', {
    bind: Boolean,                // two-way pressed state (v5: value)
    checked: false,               // initial state when unbound
    text: '',                     // label text displayed next to the toggle
    icon: '',                     // material icon name (e.g. 'mic', 'videocam')
    name: '',                     // form identification name
    disabled: false,              // blocks interaction (native)
    onchange: Function,           // fires on user-initiated changes
    api: { toggle: Function },    // imperative surface via ref
}, (props, { bind }) => {
    const pressed = bind(props, props.checked!.value as boolean);

    const toggle = () => {
        if (!props.disabled!.value) {
            pressed.set(!pressed.value);
        }
    };

    props.ref?.({ toggle });

    return html`<label
        class="lm-toggle ${() => (pressed.value ? 'lm-toggle-on' : 'lm-toggle-off')} ${() =>
            props.disabled!.value ? 'lm-toggle-disabled' : ''}">
        <input type="checkbox" class="lm-toggle-input"
            name="${props.name}"
            checked="${pressed}"
            disabled="${props.disabled}"
            onchange="${(e: Event) => pressed.set((e.target as HTMLInputElement).checked)}" />
        ${() => props.icon!.value && html`<i class="lm-toggle-icon material-icons">${props.icon}</i>`}
        ${() => props.text!.value && html`<span class="lm-toggle-text">${props.text}</span>`}
    </label>`;
});

export default Toggle;
