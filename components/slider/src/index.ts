/**
 * <Slider /> — LemonadeJS v6 block (MUI-inspired, new in v6: no v5 source)
 *
 * A horizontal slider on the Studio contract model. The bound state is the
 * CURRENT number (`bind`); the geometry is fully deterministic from
 * value/min/max — the filled track is a width% inline style and the thumb
 * a left% inline style, so position is testable without layout. The
 * pointer-position → value mapping is the only layout-dependent piece
 * (getBoundingClientRect of the track, captured once per gesture).
 *
 * Commit model (v5-style):
 *   oninput   fires on every value CHANGE while interacting — drag move,
 *             track-click jump, keyboard step (no echo on repeats)
 *   onchange  fires ONCE on release with the final value (and once per
 *             keyboard commit) — only when it differs from gesture start
 *
 * External writes through the bound state are SILENT (no onchange, no
 * oninput) and reposition the thumb — the Switch convention.
 *
 * Keyboard (on the thumb, role="slider"): Arrow ±step, Home → min,
 * End → max, PageUp/PageDown ±10·step.
 *
 * marks: Boolean — auto tick marks at every step when feasible (at most
 * 100 marks; denser ranges render none). Labeled mark ARRAYS (MUI) are
 * not adopted: contract prop types are scalar by convention.
 *
 * Other MUI props deliberately not adopted: orientation (horizontal
 * only), range value arrays (bind is a single Number by contract),
 * valueLabelDisplay/valueLabelFormat (showvalue Boolean instead), scale,
 * track="inverted", size, slot/component customization,
 * onChangeCommitted (folded into onchange).
 */

import { component, html } from 'lemonadejs';

/** marks=true renders a tick per step only while the count stays sane */
const MAX_MARKS = 100;

export const Slider = component('slider', {
    bind: Number,                 // two-way CURRENT value (unbound: starts at min)
    min: 0,                       // lower bound
    max: 100,                     // upper bound
    step: 1,                      // snapping increment (0/invalid → 1)
    marks: false,                 // tick marks at every step (when feasible)
    label: '',                    // text label above the track
    disabled: false,              // blocks interaction
    showvalue: false,             // value bubble above the thumb while dragging/focused
    color: '',                    // green | orange | red | purple
    onchange: Function,           // fires on RELEASE with the final value (v5-style commit)
    oninput: Function,            // fires on every value change while interacting
}, (props, { state, bind, listen, onUnmount }) => {
    const current = bind(props, props.min.value as number);
    const dragging = state(false);
    const focused = state(false);

    let trackEl: HTMLElement | null = null;
    let thumbEl: HTMLElement | null = null;

    const minV = () => Number(props.min.value);
    const maxV = () => Number(props.max.value);
    const stepV = () => Number(props.step.value) || 1;

    /** The bound value as a number — an unbound/undefined state reads as min */
    const val = () => {
        const n = Number(current.value);
        return Number.isNaN(n) ? minV() : n;
    };

    /** Trim float noise: 0.1 + 0.2 steps must land ON the step */
    const exact = (n: number) => parseFloat(n.toFixed(10));

    /** Snap to the step grid (anchored at min) and clamp into [min, max] */
    const snap = (raw: number) => {
        const lo = minV();
        const v = exact(lo + Math.round((raw - lo) / stepV()) * stepV());
        return Math.min(maxV(), Math.max(lo, v));
    };

    /** Deterministic geometry: value → percent, clamped for display */
    const pct = (v: number) => {
        const lo = minV();
        const hi = maxV();
        if (hi <= lo) {
            return 0;
        }
        const c = Math.min(hi, Math.max(lo, v));
        return exact(((c - lo) / (hi - lo)) * 100);
    };

    /** Pointer x → value, via the track rect captured at gesture start */
    const valueAt = (x: number, rect: DOMRect) =>
        snap(minV() + (rect.width ? (x - rect.left) / rect.width : 0) * (maxV() - minV()));

    // ---- interactions: one in flight, armed on listen (the engine removes
    // the listeners on unmount); release also COMMITS the gesture (done), so
    // a mid-drag unmount still commits — hence the explicit onUnmount
    let releaseInteraction: (() => void) | null = null;
    onUnmount(() => releaseInteraction?.());

    const track = (move: (e: MouseEvent) => void, done?: () => void) => {
        releaseInteraction?.();
        const offs = [
            listen<MouseEvent>(document, 'mousemove', move),
            listen(document, 'mouseup', () => releaseInteraction?.()),
        ];
        releaseInteraction = () => {
            offs.forEach((off) => off());
            releaseInteraction = null;
            done?.();
        };
    };

    /** Silent write + oninput — only when the value actually changes */
    const moveTo = (next: number) => {
        if (next !== val()) {
            current.value = next;
            props.oninput?.(next);
        }
    };

    /** v5-style commit: onchange once, only if the gesture changed the value */
    const commitFrom = (start: number) => {
        const v = val();
        if (v !== start) {
            props.onchange?.(v, start);
        }
    };

    const onPress = (e: MouseEvent) => {
        if (props.disabled.value || !trackEl) {
            return;
        }
        e.preventDefault();
        thumbEl?.focus();
        const rect = trackEl.getBoundingClientRect();
        const start = val();
        dragging.value = true;
        moveTo(valueAt(e.clientX, rect)); // track click jumps
        track(
            (ev: MouseEvent) => moveTo(valueAt(ev.clientX, rect)),
            () => {
                dragging.value = false;
                commitFrom(start);
            }
        );
    };

    const onKey = (e: KeyboardEvent) => {
        if (props.disabled.value) {
            return;
        }
        const v = val();
        const st = stepV();
        let next: number;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                next = snap(v + st);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                next = snap(v - st);
                break;
            case 'Home':
                next = minV();
                break;
            case 'End':
                next = maxV();
                break;
            case 'PageUp':
                next = snap(v + 10 * st);
                break;
            case 'PageDown':
                next = snap(v - 10 * st);
                break;
            default:
                return;
        }
        e.preventDefault();
        moveTo(next); // oninput…
        commitFrom(v); // …then the commit — every key press is a release
    };

    /** Boolean marks: a tick per step, only while feasible (≤ MAX_MARKS) */
    const markList = () => {
        if (!props.marks.value) {
            return null;
        }
        const lo = minV();
        const hi = maxV();
        const st = stepV();
        if (hi <= lo) {
            return null;
        }
        const count = Math.floor(exact((hi - lo) / st));
        if (count < 1 || count > MAX_MARKS) {
            return null;
        }
        return Array.from({ length: count + 1 }, (_, i) => {
            const v = exact(lo + i * st);
            return html`<span class="lm-slider-mark"
                style="${'left:' + pct(v) + '%'}"
                data-active="${() => (v <= val() ? '1' : false)}"></span>`;
        });
    };

    return html`<div
        class="lm-slider ${() => (props.disabled.value ? 'lm-slider-disabled' : '')} ${() =>
            dragging.value ? 'lm-slider-active' : ''}"
        data-color="${() => props.color.value || false}">
        ${() => props.label.value && html`<span class="lm-slider-label">${props.label}</span>`}
        <div class="lm-slider-track"
            ref="${(el: HTMLElement) => (trackEl = el)}"
            onmousedown="${onPress}">
            <span class="lm-slider-rail"></span>
            <span class="lm-slider-fill" style="${() => 'width:' + pct(val()) + '%'}"></span>
            ${markList}
            <span class="lm-slider-thumb"
                role="slider"
                tabindex="${() => (props.disabled.value ? '-1' : '0')}"
                style="${() => 'left:' + pct(val()) + '%'}"
                aria-valuemin="${() => minV()}"
                aria-valuemax="${() => maxV()}"
                aria-valuenow="${() => val()}"
                aria-label="${() => props.label.value || false}"
                aria-disabled="${() => (props.disabled.value ? 'true' : false)}"
                ref="${(el: HTMLElement) => (thumbEl = el)}"
                onkeydown="${onKey}"
                onfocus="${() => (focused.value = true)}"
                onblur="${() => (focused.value = false)}">
                ${() =>
                    props.showvalue.value && (dragging.value || focused.value)
                        ? html`<span class="lm-slider-bubble">${() => String(val())}</span>`
                        : null}
            </span>
        </div>
    </div>`;
});

export default Slider;
