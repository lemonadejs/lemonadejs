/**
 * <ButtonGroup /> — a fused row (or column) of buttons (LemonadeJS v6 block)
 *
 * One block covering both of MUI's ButtonGroup and ToggleButtonGroup:
 *   selectable=''          plain action buttons — onclick(value, event)
 *   selectable='single'    exclusive selection — click selects, click
 *                          again deselects (value | null)
 *   selectable='multiple'  toggle set — the value is always an array
 *
 * The selection follows the dropdown model, divisor-free:
 *   bind="${state}"  the live two-way selection (single value or array)
 *   external writes land silently; user toggles fire onchange (.set)
 */

import { component, html } from 'lemonadejs';

export interface ButtonGroupOption {
    value?: string | number;
    label?: string;
    icon?: string;
    disabled?: boolean;
}

/** Strings/numbers normalize to { value, label } */
const normalize = (list: unknown[]): ButtonGroupOption[] =>
    (list || []).map((v) =>
        typeof v === 'string' || typeof v === 'number'
            ? { value: v, label: String(v) }
            : (v as ButtonGroupOption)
    );

/** v5 compareValues: loose equality, empty-string strict */
const sameValue = (a: unknown, b: unknown): boolean => {
    if (a === '' || b === '') {
        return a === b;
    }
    // eslint-disable-next-line eqeqeq
    return a == b;
};

/** The selection as a list: array as-is, empty as [], single wrapped */
const asList = (v: unknown): unknown[] => {
    if (Array.isArray(v)) {
        return v;
    }
    return v === '' || v === null || v === undefined ? [] : [v];
};

export const ButtonGroup = component('buttongroup', {
    bind: null,                   // selection: single value, array when multiple (any)
    options: Array,               // { value, label, icon, disabled } or strings
    selectable: '',               // '' action buttons | single | multiple
    variant: '',                  // '' contained | outlined | text
    color: '',                    // green | orange | red | purple
    size: '',                     // small | large (default in between)
    orientation: '',              // '' horizontal | vertical
    disabled: false,              // blocks the whole group (native)
    onchange: Function,           // (selection) on user toggles
    onclick: Function,            // (value, event) in plain mode
}, (props, { bind }) => {
    const selected = bind(props, '');

    const isSelected = (value: unknown) =>
        !!props.selectable.value && asList(selected.value).some((w) => sameValue(w, value));

    const press = (item: ButtonGroupOption, e: MouseEvent) => {
        if (props.disabled.value || item.disabled === true) {
            return;
        }
        const mode = props.selectable.value as string;
        if (!mode) {
            props.onclick?.(item.value, e);
        } else if (mode === 'multiple') {
            const current = asList(selected.peek());
            const next = current.some((w) => sameValue(w, item.value))
                ? current.filter((w) => !sameValue(w, item.value))
                : [...current, item.value];
            selected.set(next as never); // fires onchange (.set semantics)
        } else {
            const current = asList(selected.peek());
            const next = current.some((w) => sameValue(w, item.value)) ? null : item.value;
            selected.set(next as never);
        }
    };

    const view = (item: ButtonGroupOption) => html`<button type="button"
        class="lm-buttongroup-button"
        data-selected="${() => (isSelected(item.value) ? 'true' : false)}"
        disabled="${() => props.disabled.value || item.disabled === true || false}"
        onclick="${(e: MouseEvent) => press(item, e)}">
        ${item.icon ? html`<i class="lm-buttongroup-icon material-icons">${item.icon}</i>` : ''}
        ${item.label !== undefined && item.label !== '' ? html`<span class="lm-buttongroup-label">${item.label}</span>` : ''}
    </button>`;

    return html`<div class="lm-buttongroup" role="group"
        data-selectable="${() => props.selectable.value || false}"
        data-variant="${() => props.variant.value || false}"
        data-color="${() => props.color.value || false}"
        data-size="${() => props.size.value || false}"
        data-orientation="${() => props.orientation.value || false}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}">
        ${() => normalize((props.options.value as unknown[]) || []).map(view)}
    </div>`;
});

export default ButtonGroup;
