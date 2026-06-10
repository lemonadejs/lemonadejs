/**
 * <Switch /> — the canonical LemonadeJS v6 block
 *
 * The reference implementation of the publishing workflow: a contract,
 * an implementation, a verify() proof and a snippet. Two-way bindable,
 * keyboard accessible, deployable everywhere (mount, island,
 * createWebComponent → <lm-switch>, adaptReact → <Switch />).
 */

import { component, html } from '../../src/index';

export const Switch = component('switch', {
    bind: false,                  // the switch value — two-way bindable
    label: '',                    // optional text label
    disabled: false,              // blocks interaction when true
    onchange: Function,           // fires on user-initiated changes
    api: { toggle: Function },    // imperative surface via ref
}, (props, { bind }) => {
    const value = bind(props, false);

    const toggle = () => {
        if (!props.disabled!.value) {
            value.set(!value.value);
        }
    };

    props.ref?.({ toggle });

    return html`<div
        class="lm-switch ${() => (value.value ? 'lm-on' : 'lm-off')} ${() => (props.disabled!.value ? 'lm-disabled' : '')}"
        role="switch"
        aria-checked="${() => String(value.value)}"
        tabindex="0"
        onclick="${toggle}"
        onkeydown="${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                toggle();
            }
        }}">
        <span class="lm-track"><span class="lm-thumb"></span></span>
        ${() => props.label!.value && html`<span class="lm-label">${props.label}</span>`}
    </div>`;
});

export default Switch;
