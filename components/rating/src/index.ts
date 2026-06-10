/**
 * <Rating /> — LemonadeJS v6 block
 *
 * Full behavioral parity with the v5 rating plugin: a row of stars where
 * clicking star N sets the value to N, clicking the current value again
 * resets it to 0, hovering previews the would-be selection, `number`
 * controls the star count (shrinking it clamps the value, v5 behavior),
 * `tooltip` provides per-star titles (comma-separated), `name` and `size`
 * pass through as in v5. Plus MUI-inspired additions the v5 plugin lacked:
 * disabled, readonly and color variants.
 *
 * bind vs value (the Switch convention):
 *   bind="${state}"  the live two-way rating (wins when present)
 *   value            the INITIAL rating when unbound
 */

import { component, html } from 'lemonadejs';

export const Rating = component('rating', {
    bind: Number,                  // two-way rating (v5: value)
    value: 0,                      // initial rating when unbound
    number: 5,                     // how many stars (v5: number)
    tooltip: '',                   // per-star titles, comma-separated (v5: tooltip)
    name: '',                      // form identification name (v5: name)
    size: '',                      // small (v5: data-size variant)
    color: '',                     // yellow | orange | green | purple (default red, as v5)
    disabled: false,               // blocks interaction (new)
    readonly: false,               // display-only, full color (new)
    onchange: Function,            // fires on component-initiated changes
    api: { getValue: Function, setValue: Function }, // v5 instance methods
}, (props, { state, bind, onUnmount }) => {
    const rating = bind(props, props.value!.value as number);
    const hover = state(0); // 1-based index being previewed, 0 = none

    const interactive = () => !props.disabled!.value && !props.readonly!.value;

    // v5: clicking the current value toggles back to 0
    const select = (index: number) => {
        if (interactive()) {
            rating.set(index === rating.value ? 0 : index);
        }
    };

    // v5 parity: shrinking the star count clamps the value (and, as in v5,
    // the clamp is a component-initiated change — onchange fires)
    onUnmount(
        props.number!.subscribe((n) => {
            if (rating.value > n) {
                rating.set(n);
            }
        })
    );

    // v5 accepted a comma-separated string (or a ready array via state)
    const titleFor = (i: number): string | false => {
        const t = props.tooltip!.value as unknown;
        if (Array.isArray(t)) {
            return (t[i] as string) || false;
        }
        if (typeof t === 'string' && t) {
            return t.split(',')[i] || false;
        }
        return false;
    };

    props.ref?.({
        getValue: () => Number(rating.value),
        setValue: (index: number) => rating.set(Number(index)),
    });

    return html`<div class="lm-rating"
        name="${() => props.name!.value || false}"
        data-value="${() => rating.value}"
        data-size="${() => props.size!.value || false}"
        data-color="${() => props.color!.value || false}"
        data-disabled="${() => props.disabled!.value || false}"
        data-readonly="${() => props.readonly!.value || false}"
        onmouseleave="${() => (hover.value = 0)}">${() => {
        const count = Math.max(0, Number(props.number!.value) || 0);
        return Array.from(
            { length: count },
            (_, i) => html`<i class="lm-rating-star"
                title="${() => titleFor(i)}"
                data-selected="${() => (i < rating.value ? '1' : false)}"
                data-hover="${() => (hover.value > 0 && i < hover.value ? '1' : false)}"
                onclick="${() => select(i + 1)}"
                onmouseover="${() => {
                    if (interactive()) {
                        hover.value = i + 1;
                    }
                }}">★</i>`
        );
    }}</div>`;
});

export default Rating;
