/**
 * <Color /> — color picker on the Modal primitive (v5 architecture).
 *
 * Faithful port of @lemonadejs/color: a Grid tab (the material palette
 * matrix, custom palettes supported, the picked cell marked with a
 * checkmark) and a Spectrum tab (canvas gradient, drag to sample pixels),
 * Reset/Done bar, popup built ON Modal exactly as v5 built on
 * @lemonadejs/modal (headerless, absolute, auto-adjust, no focus steal),
 * optional text input toggle with the full v5 keyboard system
 * (ArrowUp/Down opens, Enter commits, Escape closes) and focusout close.
 *
 * v5 → v6 mapping: value → bind; closeOnChange → closeonchange;
 * input: 'auto' → type="input" (the block renders its own input — adopting
 * an external element was dropped, incompatible with by-value blocks);
 * type: 'inline' keeps its meaning (panel without a popup, selection
 * commits immediately since the Done bar is a popup affordance);
 * @lemonadejs/tabs → internal lm-color-tabs strip (no Tabs block in v6).
 * onclose(origin): 'select' | 'button' | 'escape' | 'focusout' | 'api'.
 */

import { component, html } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

const defaultPalette: string[][] = [
    ["#ffebee", "#fce4ec", "#f3e5f5", "#e8eaf6", "#e3f2fd", "#e0f7fa", "#e0f2f1", "#e8f5e9", "#f1f8e9", "#f9fbe7", "#fffde7", "#fff8e1", "#fff3e0", "#fbe9e7", "#efebe9", "#fafafa", "#eceff1"],
    ["#ffcdd2", "#f8bbd0", "#e1bee7", "#c5cae9", "#bbdefb", "#b2ebf2", "#b2dfdb", "#c8e6c9", "#dcedc8", "#f0f4c3", "#fff9c4", "#ffecb3", "#ffe0b2", "#ffccbc", "#d7ccc8", "#f5f5f5", "#cfd8dc"],
    ["#ef9a9a", "#f48fb1", "#ce93d8", "#9fa8da", "#90caf9", "#80deea", "#80cbc4", "#a5d6a7", "#c5e1a5", "#e6ee9c", "#fff59d", "#ffe082", "#ffcc80", "#ffab91", "#bcaaa4", "#eeeeee", "#b0bec5"],
    ["#e57373", "#f06292", "#ba68c8", "#7986cb", "#64b5f6", "#4dd0e1", "#4db6ac", "#81c784", "#aed581", "#dce775", "#fff176", "#ffd54f", "#ffb74d", "#ff8a65", "#a1887f", "#e0e0e0", "#90a4ae"],
    ["#ef5350", "#ec407a", "#ab47bc", "#5c6bc0", "#42a5f5", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"],
    ["#f44336", "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e", "#607d8b"],
    ["#e53935", "#d81b60", "#8e24aa", "#3949ab", "#1e88e5", "#00acc1", "#00897b", "#43a047", "#7cb342", "#c0ca33", "#fdd835", "#ffb300", "#fb8c00", "#f4511e", "#6d4c41", "#757575", "#546e7a"],
    ["#d32f2f", "#c2185b", "#7b1fa2", "#303f9f", "#1976d2", "#0097a7", "#00796b", "#388e3c", "#689f38", "#afb42b", "#fbc02d", "#ffa000", "#f57c00", "#e64a19", "#5d4037", "#616161", "#455a64"],
    ["#c62828", "#ad1457", "#6a1b9a", "#283593", "#1565c0", "#00838f", "#00695c", "#2e7d32", "#558b2f", "#9e9d24", "#f9a825", "#ff8f00", "#ef6c00", "#d84315", "#4e342e", "#424242", "#37474f"],
    ["#b71c1c", "#880e4f", "#4a148c", "#1a237e", "#0d47a1", "#006064", "#004d40", "#1b5e20", "#33691e", "#827717", "#f57f17", "#ff6f00", "#e65100", "#bf360c", "#3e2723", "#212121", "#263238"],
];

const decToHex = (num: number): string => {
    const hex = num.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
};
const rgbToHex = (r: number, g: number, b: number): string => '#' + decToHex(r) + decToHex(g) + decToHex(b);

export const Color = component('color', {
    bind: String,                 // the picked color (v5: value)
    palette: Array,               // string[][] matrix — a flat string[] becomes one row
    type: '',                     // '' (popup via api) | 'input' | 'inline'
    placeholder: '',              // input placeholder (v5)
    closeonchange: false,         // v5: closeOnChange — picking commits + closes immediately
    onopen: Function,             // popup opened
    onclose: Function,            // popup closed (origin)
    onchange: Function,           // the picked color changed (user-initiated)
    api: {
        open: Function,
        close: Function,
        isClosed: Function,
        reset: Function,
        setValue: Function,
        getValue: Function,
    },
}, (props, { state, bind }) => {
    const picked = bind(props, '');
    // v5 pending-selection model: the grid marks this; Done commits it
    const pending = state((picked.value as string) || '');
    const tab = state<'grid' | 'spectrum'>('grid');
    const opened = state(false);
    const anchorTop = state(0);
    const anchorLeft = state(0);

    let wrapper: HTMLElement | null = null;
    let input: HTMLInputElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    let point: HTMLElement | null = null;

    const inline = () => props.type!.value === 'inline';

    const palette = (): string[][] => {
        const p = props.palette!.value as (string | string[])[] | undefined;
        if (p && p.length) {
            return (Array.isArray(p[0]) ? p : [p]) as string[][];
        }
        return defaultPalette;
    };

    const doOpen = () => {
        if (inline() || opened.value) {
            return;
        }
        // v5 open(): the current value is the pending selection, marked in the grid
        pending.value = (picked.value as string) || '';
        // Anchor the popup under the toggle (v5: position absolute inside .lm-color)
        const rect = (input || wrapper)?.getBoundingClientRect();
        if (rect) {
            anchorTop.value = rect.top + rect.height + 2;
            anchorLeft.value = rect.left;
        }
        opened.value = true;
        (props.onopen as (() => void) | undefined)?.();
    };

    const doClose = (origin: string) => {
        if (opened.value) {
            opened.value = false;
            (props.onclose as ((origin: string) => void) | undefined)?.(origin);
        }
    };

    const commit = (v: string, origin: string) => {
        if (picked.value !== v) {
            picked.set(v); // fires onchange
        }
        doClose(origin);
    };

    /** Grid/Spectrum selection (v5 set) */
    const select = (color: string) => {
        pending.value = color;
        if (inline()) {
            // The Done bar is a popup affordance (v5 CSS hides it inline):
            // inline selections commit immediately
            if (picked.value !== color) {
                picked.set(color);
            }
        } else if (props.closeonchange!.value) {
            commit(color, 'select');
        }
    };

    const update = () => commit(pending.value, 'button'); // Done (v5 update)

    const reset = () => {
        pending.value = '';
        commit('', 'button'); // v5 reset: clear + close
    };

    props.ref?.({
        open: doOpen,
        close: () => doClose('api'),
        isClosed: () => !opened.value,
        reset,
        setValue: (v: string) => {
            pending.value = v || '';
            if (picked.value !== (v || '')) {
                picked.set(v || ''); // v5 setValue fired onchange
            }
        },
        getValue: () => picked.value as string,
    });

    // ---- the v5 input keyboard system
    const onKey = (e: KeyboardEvent) => {
        if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
            if (!opened.value) {
                doOpen();
            }
            e.preventDefault();
        } else if (e.code === 'Enter') {
            if (opened.value) {
                update();
            } else {
                doOpen();
            }
        } else if (e.code === 'Escape') {
            if (opened.value) {
                doClose('escape');
            }
        }
    };

    // v5: focus leaving the control (input AND panel) closes the popup
    const onFocusOut = (e: FocusEvent) => {
        if (opened.value && !(e.relatedTarget && wrapper?.contains(e.relatedTarget as Node))) {
            doClose('focusout');
        }
    };

    // ---- Spectrum (v5 canvas gradient, ported verbatim; guarded — jsdom has no 2d context)
    const draw = () => {
        if (!canvas || !context) {
            return;
        }
        let g = context.createLinearGradient(0, 0, canvas.width, 0);
        g.addColorStop(0, 'rgb(255,0,0)');
        g.addColorStop(0.15, 'rgb(255,0,255)');
        g.addColorStop(0.33, 'rgb(0,0,255)');
        g.addColorStop(0.49, 'rgb(0,255,255)');
        g.addColorStop(0.67, 'rgb(0,255,0)');
        g.addColorStop(0.84, 'rgb(255,255,0)');
        g.addColorStop(1, 'rgb(255,0,0)');
        context.fillStyle = g;
        context.fillRect(0, 0, canvas.width, canvas.height);
        g = context.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        context.fillStyle = g;
        context.fillRect(0, 0, canvas.width, canvas.height);
    };

    const initCanvas = (el: Element) => {
        canvas = el as HTMLCanvasElement;
        try {
            context = canvas.getContext('2d', { willReadFrequently: true });
        } catch {
            context = null;
        }
        draw();
    };

    const pick = (e: Event) => {
        if (!canvas || !context) {
            return;
        }
        let x: number;
        let y: number;
        let buttons = 1;
        if (e.type === 'touchmove') {
            const touch = (e as TouchEvent).changedTouches[0];
            x = touch.clientX;
            y = touch.clientY;
        } else {
            buttons = (e as MouseEvent).buttons;
            x = (e as MouseEvent).clientX;
            y = (e as MouseEvent).clientY;
        }
        if (buttons === 1) {
            const rect = canvas.getBoundingClientRect();
            const left = x - rect.left;
            const top = y - rect.top;
            const pixel = context.getImageData(left, top, 1, 1).data;
            if (point) {
                point.style.left = left + 'px';
                point.style.top = top + 'px';
            }
            select(rgbToHex(pixel[0], pixel[1], pixel[2]));
        }
    };

    // ---- views
    const gridView = () =>
        html`<div class="lm-color-grid">
            ${() =>
                palette().map(
                    (row) => html`<div class="lm-color-row">
                        ${row.map(
                            (c) => html`<div class="lm-color-cell ${() =>
                                pending.value === c ? 'lm-color-selected' : ''}"
                                data-value="${c}"
                                style="background-color: ${c}"
                                onclick="${() => select(c)}"></div>`
                        )}
                    </div>`
                )}
        </div>`;

    const spectrumView = () =>
        html`<div class="lm-color-spectrum">
            <canvas class="lm-color-canvas" width="240" height="140"
                ref="${initCanvas}"
                onmousedown="${pick}"
                onmousemove="${pick}"
                ontouchmove="${pick}"></canvas>
            <div class="lm-color-point" ref="${(el: Element) => (point = el as HTMLElement)}"></div>
        </div>`;

    const panelView = () =>
        html`<div class="lm-color-panel">
            <div class="lm-color-options">
                <button type="button" class="lm-color-reset" onclick="${reset}">Reset</button>
                <button type="button" class="lm-color-done" onclick="${update}">Done</button>
            </div>
            <div class="lm-color-tabs">
                <button type="button" class="lm-color-tab"
                    data-active="${() => tab.value === 'grid' || false}"
                    onclick="${() => (tab.value = 'grid')}">Grid</button>
                <button type="button" class="lm-color-tab"
                    data-active="${() => tab.value === 'spectrum' || false}"
                    onclick="${() => (tab.value = 'spectrum')}">Spectrum</button>
            </div>
            <div class="lm-color-content">${() => (tab.value === 'grid' ? gridView() : spectrumView())}</div>
        </div>`;

    return html`<div class="lm-color"
        data-type="${() => props.type!.value || false}"
        ref="${(el: Element) => (wrapper = el as HTMLElement)}"
        onfocusout="${onFocusOut}">
        ${() =>
            props.type!.value === 'input' &&
            html`<input type="text" class="lm-color-input"
                placeholder="${() => props.placeholder!.value || false}"
                value="${() => (picked.value as string) || ''}"
                style="${() => (picked.value ? 'color:' + picked.value : '')}"
                ref="${(el: Element) => (input = el as HTMLInputElement)}"
                onclick="${doOpen}"
                onfocusin="${doOpen}"
                onkeydown="${onKey}" />`}
        ${() =>
            inline()
                ? panelView()
                : html`<${Modal} bind="${opened}" header="${false}" position="absolute"
                      top="${anchorTop}" left="${anchorLeft}"
                      focus="${false}" responsive="${false}" autoadjust>
                      ${panelView()}
                  </${Modal}>`}
    </div>`;
});

export default Color;
