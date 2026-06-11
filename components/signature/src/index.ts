/**
 * <Signature /> — canvas signature pad, ported from the v5 plugin
 *
 * Full behavioral parity with v5: pointer drawing (mouse + touch), the v5
 * value format (a flat list of [x, y] points with '1' separators between
 * strokes), line thickness, instructions text, disabled, and the full
 * replay algorithm (commit): clear + redraw the whole value as one path —
 * including the v5 quirk where a click stroke becomes a round dot.
 *
 * v5 → v6 mapping: value (two-way) → bind; value (initial) stays value;
 * line/width/height/instructions/disabled unchanged; onchange/onload
 * unchanged (onchange now receives the value, not the instance);
 * getValue/setValue/getImage move to the api surface (props.ref), plus
 * clear() = setValue([]). New: color (v5 hardcoded #000) and name (renders
 * a hidden input so the pad participates in forms — v5 only patched .val()
 * onto the canvas).
 *
 * jsdom has no canvas: a null 2d context downgrades the pad to a no-op.
 */

import { component, html } from 'lemonadejs';

/** A point [x, y]; the string '1' separates strokes (v5 wire format) */
type Entry = number[] | string;

export const Signature = component('signature', {
    bind: Array,                  // two-way stroke data (v5: value)
    value: Array,                 // initial strokes when unbound
    width: 0,                     // canvas width (0: browser default)
    height: 0,                    // canvas height (0: browser default)
    line: 0,                      // stroke thickness, 3 when unset (v5)
    color: '',                    // stroke color, #000 when unset (v5 fixed)
    name: '',                     // form field name (hidden input, JSON value)
    instructions: '',             // helper text under the canvas
    disabled: false,              // blocks drawing
    onchange: Function,           // fires on stroke end, setValue and clear
    onload: Function,             // fires once the canvas is ready (v5)
    api: { getValue: Function, setValue: Function, getImage: Function, clear: Function },
}, (props, { bind, listen, onMount, onUnmount }) => {
    const initial = props.value.value;
    const strokes = bind(props, (Array.isArray(initial) ? initial.slice() : []) as unknown[]);

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let last: number[] | null = null; // pen position while a stroke is in flight
    let pending: Entry[] = [];        // working copy of the value during a stroke

    const data = (): Entry[] => (Array.isArray(strokes.value) ? (strokes.value as Entry[]) : []);

    /** v5 move(): start a path — thickness, round cap, color */
    const pen = (x: number, y: number) => {
        ctx!.beginPath();
        ctx!.lineWidth = (props.line.value as number) || 3;
        ctx!.lineCap = 'round';
        ctx!.strokeStyle = (props.color.value as string) || '#000';
        ctx!.moveTo(x, y);
    };

    /** Pointer position relative to the canvas — mouse or touch (v5 point()) */
    const locate = (e: MouseEvent | TouchEvent): number[] => {
        const touch = (e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches[0];
        if (touch) {
            const rect = (e.target as Element).getBoundingClientRect();
            return [touch.clientX - rect.x, touch.clientY - rect.y];
        }
        return [(e as MouseEvent).offsetX, (e as MouseEvent).offsetY];
    };

    /** v5 commit(): clear, then replay the whole value as a single path */
    const redraw = () => {
        if (!ctx || !canvas) {
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const c = data().slice();
        let t = c.shift();
        if (Array.isArray(t)) {
            pen(t[0], t[1]);
            while ((t = c.shift()) !== undefined) {
                if (!Array.isArray(t)) {
                    // Stroke separator: jump to the start of the next stroke
                    t = c.shift();
                    if (Array.isArray(t)) {
                        ctx.moveTo(t[0], t[1]);
                    }
                }
                if (Array.isArray(t)) {
                    // The zero-length segment right after a jump stays
                    // stroked: a click is a round dot (v5 behavior)
                    ctx.lineTo(t[0], t[1]);
                    ctx.stroke();
                }
            }
        }
    };

    // ---- document listeners: one stroke in flight, armed on listen; the
    // release also COMMITS the stroke, so a mid-stroke unmount still commits
    // (one cleanup releasing every off keeps the engine's unmount iteration intact)
    let release: (() => void) | null = null;
    onUnmount(() => release?.());

    /** v5 end(): close the stroke and commit — redraw + onchange */
    const finish = () => {
        if (last) {
            last = null;
            pending.push('1'); // v5 stroke separator
            strokes.set(pending.slice()); // commits: subscribers redraw, onchange fires
            pending = [];
        }
    };

    const arm = () => {
        release?.();
        const up = () => release?.();
        const offs = [
            listen(document, 'mouseup', up),
            listen(document, 'touchend', up),
        ];
        release = () => {
            offs.forEach((off) => off());
            release = null;
            finish();
        };
    };

    const start = (e: MouseEvent | TouchEvent) => {
        if (props.disabled.value || !ctx) {
            return;
        }
        pending = data().slice();
        last = locate(e);
        pending.push(last);
        arm();
    };

    const draw = (e: MouseEvent | TouchEvent) => {
        if (last && ctx) {
            pen(last[0], last[1]);
            last = locate(e);
            pending.push(last);
            ctx.lineTo(last[0], last[1]);
            ctx.stroke();
        }
        e.preventDefault(); // v5: unconditional on canvas move events
    };

    // ---- api (v5 instance methods + clear)
    const getValue = () => data();
    const setValue = (v: unknown) => strokes.set(Array.isArray(v) ? v : []);
    const clear = () => setValue([]);
    const getImage = () => (canvas ? canvas.toDataURL() : '');

    const api = { getValue, setValue, getImage, clear };
    props.ref?.(api);

    /** v5 init(): grab the context, draw a preloaded value, announce ready */
    const init = (el: HTMLCanvasElement) => {
        canvas = el;
        ctx = canvas.getContext('2d');
        redraw();
        props.onload?.(api);
    };

    // Any committed or external write (bound store, setValue) replays the pad
    onMount(() => strokes.subscribe(() => redraw()));

    return html`<div class="lm-signature ${() => (props.disabled.value ? 'lm-signature-disabled' : '')}">
        <canvas class="lm-signature-canvas"
            width="${() => props.width.value || false}"
            height="${() => props.height.value || false}"
            ref="${init}"
            onmousedown="${start}"
            ontouchstart="${start}"
            onmousemove="${draw}"
            ontouchmove="${draw}"></canvas>
        ${() =>
            props.instructions.value &&
            html`<div class="lm-signature-instructions">${props.instructions}</div>`}
        ${() =>
            props.name.value &&
            html`<input type="hidden" class="lm-signature-input" name="${props.name}"
                value="${() => JSON.stringify(data())}" />`}
    </div>`;
});

export default Signature;
