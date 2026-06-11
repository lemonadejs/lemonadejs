/**
 * <Wheel /> — iOS-style scroll wheel picker, ported from the v5 plugin
 *
 * The v5 model, kept: a column of options behind two frosted masks; the
 * row in the middle band is the selection. A mouse-wheel NOTCH steps one
 * row; trackpad deltas glide freely and settle on the nearest row; press
 * and drag scrolls with the pointer (snap suspended while dragging, as
 * v5 toggled lm-wheel-grid) and snaps to the closest row on release.
 *
 * v6 rebuild: the position is a transform driven from props (rowheight ×
 * visible), not native scrollTop — deterministic everywhere (jsdom has
 * no layout) and the snap animation is one CSS transition. v5 leaked a
 * document mousemove/mouseup pair per instance forever and shared one
 * module-global drag flag; v6 arms document listeners per gesture with
 * ONE persistent cleanup (the Modal track pattern), released on pointer
 * up and on unmount.
 *
 * v5 → v6 mapping: value (the selected OPTION object, two-way) → bind
 * (the selected INDEX — survives attribute coercion and primitive
 * options; api.getValue() still returns the entry itself); onupdate →
 * onchange; options stays options, now also accepting plain strings and
 * numbers (v5 required { title } objects); the fixed 40px/200px
 * geometry becomes rowheight and visible. New: touch dragging, tap to
 * select a row, keyboard arrows/Home/End, disabled.
 */

import { component, html } from 'lemonadejs';

export const Wheel = component('wheel', {
    bind: Number,                 // two-way selected index (v5: value held the option)
    selected: 0,                  // initial index when unbound
    options: Array,               // entries: strings/numbers or { title } objects (v5)
    rowheight: 40,                // px per row (v5: fixed 40)
    visible: 5,                   // rows in the viewport (v5: fixed 200px / 40)
    disabled: false,              // blocks interaction (new)
    onchange: Function,           // (index) on user/component-initiated changes
    api: { getIndex: Function, setIndex: Function, getValue: Function },
}, (props, { bind, state, listen, onMount, onUnmount }) => {
    const index = bind(props, Number(props.selected.value) || 0);

    const items = () => props.options.value || [];
    const rh = () => Number(props.rowheight.value) || 40;
    const visible = () => Math.max(1, Math.floor(Number(props.visible.value)) || 5);
    /** The blank run above/below the column that centers a row (v5: 80px) */
    const pad = () => ((visible() - 1) / 2) * rh();
    const max = () => Math.max(0, items().length - 1);
    const clampIndex = (i: number) => Math.min(Math.max(0, Math.round(i)), max());
    const clampPx = (px: number) => Math.min(Math.max(0, px), max() * rh());

    // The wheel position in px: nearest row = the selection preview
    const offset = state(clampIndex(Number(index.value) || 0) * rh());
    const dragging = state(false);
    const nearest = () => clampIndex(offset.value / rh());

    /**
     * Row style stays STRING CONCAT, not css(): line-height is a unitless
     * property there (per the CSS spec), but the wheel centers each label
     * by setting line-height to the row height in PX — css({ lineHeight:
     * rh() }) would emit "line-height:40". Documented decision.
     */
    const rowStyle = () => 'height:' + rh() + 'px;line-height:' + rh() + 'px';

    /** v5 li reads {{self.title}}; primitives render as their own label */
    const titleOf = (opt: unknown): string =>
        opt !== null && typeof opt === 'object'
            ? String((opt as { title?: unknown }).title ?? '')
            : String(opt ?? '');

    // ---- glide settle + document listeners: armed per gesture on listen;
    // the release also COMMITS the gesture (done), so a mid-drag unmount
    // still settles — ONE setup-time cleanup releasing every off
    let settle: ReturnType<typeof setTimeout> | null = null;
    let release: (() => void) | null = null;
    onUnmount(() => {
        release?.();
        if (settle) {
            clearTimeout(settle);
            settle = null;
        }
    });

    const align = () => {
        offset.value = clampIndex(Number(index.value) || 0) * rh();
    };

    /** Commit a row: snap the wheel and write the bound index (set fires
     *  onchange only when the index actually changes) */
    const commit = (i: number) => {
        if (settle) {
            clearTimeout(settle);
            settle = null;
        }
        const next = clampIndex(i);
        offset.value = next * rh();
        index.set(next);
    };

    // External writes re-place the wheel silently; geometry follows props
    onMount(() => index.subscribe(align));
    onMount(() => props.rowheight.subscribe(align));
    // v5/rating behavior: shrinking the option list clamps the selection
    // (a component-initiated change — onchange fires)
    onMount(() =>
        props.options.subscribe(() => {
            const i = clampIndex(Number(index.value) || 0);
            if (i !== Number(index.value)) {
                index.set(i);
            }
            align();
        })
    );

    // ---- mouse wheel vs trackpad (v5 told them apart by wheelDelta % 120)
    const discrete = (e: WheelEvent): boolean => {
        const legacy = (e as unknown as { wheelDelta?: number }).wheelDelta;
        if (typeof legacy === 'number') {
            return legacy % 120 === 0; // v5 detection, kept where it exists
        }
        if (e.deltaMode !== 0) {
            return true; // line/page deltas: a real wheel notch
        }
        return Math.abs(e.deltaY) >= 100; // pixel mode: big jumps are notches
    };

    const onWheel = (e: WheelEvent) => {
        e.preventDefault(); // the wheel owns its scroll (v5 for notches; here always — no native scroller)
        if (props.disabled.value || !items().length) {
            return;
        }
        if (discrete(e)) {
            // v5: one row per notch
            commit(nearest() + Math.sign(e.deltaY));
        } else {
            // Trackpad: glide with the gesture, settle on the nearest row
            if (settle) {
                clearTimeout(settle);
            }
            offset.value = clampPx(offset.value + e.deltaY);
            settle = setTimeout(() => commit(nearest()), 120);
        }
    };

    // ---- press + drag (v5: mousedown → document mousemove/mouseup; + touch)
    const pointerY = (e: Event): number => {
        const t = (e as TouchEvent).touches?.[0] || (e as TouchEvent).changedTouches?.[0];
        return t ? t.clientY : (e as MouseEvent).clientY;
    };

    const track = (move: (e: Event) => void, done: () => void) => {
        release?.();
        const up = () => release?.();
        const offs = [
            listen(document, 'mousemove', move),
            listen(document, 'touchmove', move, { passive: false }),
            listen(document, 'mouseup', up),
            listen(document, 'touchend', up),
        ];
        release = () => {
            offs.forEach((off) => off());
            release = null;
            done();
        };
    };

    const start = (e: MouseEvent | TouchEvent) => {
        if (props.disabled.value || !items().length) {
            return;
        }
        if (settle) {
            clearTimeout(settle);
            settle = null;
        }
        const from = pointerY(e);
        const startOffset = offset.value;
        const tapped = (e.target as Element).closest('.lm-wheel-option') as HTMLElement | null;
        let moved = false;
        dragging.value = true; // suspends the snap transition (v5: lm-wheel-grid off)
        track(
            (ev: Event) => {
                const dy = from - pointerY(ev); // v5: scrollTop = startScroll - yDiff
                if (Math.abs(dy) > 3) {
                    moved = true;
                }
                offset.value = clampPx(startOffset + dy);
                ev.preventDefault();
            },
            () => {
                dragging.value = false;
                if (!moved && tapped) {
                    commit(Number(tapped.dataset.index)); // tap selects the row
                } else {
                    commit(nearest()); // v5: round(scrollTop / 40)
                }
            }
        );
    };

    const onKey = (e: KeyboardEvent) => {
        if (props.disabled.value || !items().length) {
            return;
        }
        const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (step) {
            commit(nearest() + step);
        } else if (e.key === 'Home') {
            commit(0);
        } else if (e.key === 'End') {
            commit(max());
        } else {
            return;
        }
        e.preventDefault();
    };

    props.ref?.({
        getIndex: () => clampIndex(Number(index.value) || 0),
        setIndex: (i: number) => commit(Number(i) || 0),
        getValue: () => items()[clampIndex(Number(index.value) || 0)], // v5: self.value
    });

    return html`<div class="lm-wheel ${() => (dragging.value ? 'lm-wheel-dragging' : '')}"
        role="listbox"
        tabindex="${() => (props.disabled.value ? false : '0')}"
        data-disabled="${() => (props.disabled.value ? 'true' : false)}"
        style="${() => 'height:' + visible() * rh() + 'px'}"
        onwheel="${onWheel}"
        onmousedown="${start}"
        ontouchstart="${start}"
        onkeydown="${onKey}">
        <ul class="lm-wheel-options"
            style="${() => 'transform:translateY(' + (pad() - offset.value) + 'px)'}">
            ${() =>
                items().map(
                    (opt, i) => html`<li class="lm-wheel-option" role="option"
                        data-index="${String(i)}"
                        data-selected="${() => (nearest() === i ? 'true' : false)}"
                        aria-selected="${() => (nearest() === i ? 'true' : 'false')}"
                        style="${rowStyle}">${titleOf(opt)}</li>`
                )}
        </ul>
        <div class="lm-wheel-mask lm-wheel-mask-top" style="${() => 'height:' + pad() + 'px'}"></div>
        <div class="lm-wheel-mask lm-wheel-mask-bottom" style="${() => 'height:' + pad() + 'px'}"></div>
    </div>`;
});

export default Wheel;
