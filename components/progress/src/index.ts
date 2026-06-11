/**
 * <Progress /> — LemonadeJS v6 block
 *
 * One block, both MUI progress indicators: LinearProgress (track + bar)
 * and CircularProgress (SVG stroke arc), selected by `type`. Determinate
 * when a percent is bound, indeterminate otherwise (or when forced):
 *
 *   <${Progress} bind="${pct}" label />                 linear, determinate
 *   <${Progress} type="circular" bind="${pct}" />       circular, determinate
 *   <${Progress} />                                     linear, indeterminate
 *   <${Progress} type="circular" indeterminate />       spinner
 *
 * bind vs indeterminate (by design):
 *   bind="${state}"  the live percent 0-100 (clamped); ABSENT → indeterminate
 *   indeterminate    forces the looping animation even with a value
 *
 * Geometry is deterministic and testable: the linear bar carries an inline
 * width:%, the circular arc carries stroke-dasharray/stroke-dashoffset
 * computed from percent and the radius (size - thickness) / 2. The looping
 * animations are pure CSS keyframes driven by data-indeterminate.
 */

import { component, css, html } from 'lemonadejs';

/** Stable 3-decimal rounding so the rendered strings are assertable */
const round = (n: number): number => Math.round(n * 1000) / 1000;

export const Progress = component('progress', {
    bind: Number,             // two-way percent 0-100; absent → indeterminate
    type: '',                 // '' = linear | 'circular' (data-type variant)
    indeterminate: false,     // force the looping animation even with a value
    size: 0,                  // circular diameter in px (default 40 via CSS)
    thickness: 0,             // stroke/bar thickness in px (defaults: 4 linear, 3.6 circular)
    color: '',                // green | orange | red | purple (default blue)
    label: false,             // show the % text: beside linear, centered in circular
    onchange: Function,       // fires when the bound percent is set via set()
}, (props, { bind, computed }) => {
    // No bound percent → nothing to show → indeterminate by default
    const determinate = props.bind !== undefined;
    const percent = bind(props, 0);

    // Derived values are computed(): they stay live wherever they are
    // read — ${pct} in a slot, .value in an expression — and each one
    // re-evaluates once per change however many bindings read it.
    /** The bound percent clamped into 0-100 (non-numbers → 0) */
    const pct = computed(() => {
        const n = Number(percent.value);
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
    });

    const indeterminate = computed(() => !determinate || props.indeterminate.value === true);

    // Circular geometry: radius from size/thickness, arc length from percent
    const diameter = computed(() => Number(props.size.value) || 40);
    const stroke = computed(() => Number(props.thickness.value) || 3.6);
    const radius = computed(() => Math.max(0, (diameter.value - stroke.value) / 2));
    const circumference = computed(() => 2 * Math.PI * radius.value);
    // Indeterminate spins a fixed 25% arc; determinate draws the percent
    const arc = computed(() => (indeterminate.value ? 25 : pct.value));
    const dashoffset = computed(() => round(circumference.value * (1 - arc.value / 100)));

    const label = () =>
        props.label.value === true &&
        !indeterminate.value &&
        html`<span class="lm-progress-label">${() => Math.round(pct.value)}%</span>`;

    const linear = () => html`<span class="lm-progress-track"
        style="${() => {
            const t = Number(props.thickness.value);
            return t > 0 ? 'height: ' + t + 'px' : false;
        }}"><span class="lm-progress-bar"
            style="${() => (indeterminate.value ? false : 'width: ' + pct.value + '%')}"></span></span>${label}`;

    const circular = () => html`<span class="lm-progress-circular"
        style="${() => {
            const s = Number(props.size.value);
            return s > 0 ? css({ width: s, height: s }) : false;
        }}"><svg class="lm-progress-svg" viewBox="0 0 ${diameter} ${diameter}">
            <circle class="lm-progress-circle-track"
                cx="${() => diameter.value / 2}" cy="${() => diameter.value / 2}" r="${radius}"
                fill="none" stroke-width="${stroke}" />
            <circle class="lm-progress-circle-bar"
                cx="${() => diameter.value / 2}" cy="${() => diameter.value / 2}" r="${radius}"
                fill="none" stroke-width="${stroke}"
                stroke-dasharray="${() => round(circumference.value)}"
                stroke-dashoffset="${dashoffset}" />
        </svg>${label}</span>`;

    return html`<div class="lm-progress"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${() => (indeterminate.value ? false : pct.value)}"
        data-type="${() => props.type.value || false}"
        data-indeterminate="${() => (indeterminate.value ? 'true' : false)}"
        data-color="${() => props.color.value || false}">${() =>
        props.type.value === 'circular' ? circular() : linear()}</div>`;
});

export default Progress;
