/**
 * <Toast /> — transient notifications with a queue, modeled on MUI's
 * Snackbar + notistack on the v6 contract model.
 *
 * The component is a HOST: mount it once, grab the api through props.ref
 * and fire toasts imperatively from anywhere:
 *
 *   let toast;
 *   html`<${Toast} ref="${(api) => (toast = api)}" position="bottom-right" />`
 *   toast.success('Saved');
 *   toast.show('Reconnecting…', { duration: 0, action: { label: 'Retry', onclick: retry } });
 *
 * Queue model: up to `max` toasts are visible at once; overflow waits in
 * an internal FIFO and is promoted when a visible toast finishes leaving.
 * Each toast auto-dismisses after its duration (host default 4000ms,
 * per-toast override, 0 = sticky until closed), then plays a 200ms leave
 * animation (data-leaving) before it is removed and onclose(message)
 * fires. Manual close (×), the action button and unmount all clear the
 * pending timers — destroy-clean. clear() drops everything at once,
 * silently (bulk reset, no onclose storm).
 *
 * Severities (info | success | warning | error) share the alert block's
 * palette but the CSS is self-contained; no severity = the neutral dark
 * MUI Snackbar look.
 */

import { component, html } from 'lemonadejs';

/** How long the leave animation runs before the toast is removed (ms) */
const LEAVE = 200;

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
    /** Button text */
    label: string;
    /** Fires on click, right before the toast dismisses itself */
    onclick?: (e: Event) => void;
}

export interface ToastOptions {
    /** Palette: info | success | warning | error ('' = neutral dark) */
    severity?: ToastSeverity;
    /** Auto-dismiss override in ms; 0 = sticky until closed */
    duration?: number;
    /** Optional action button rendered after the message */
    action?: ToastAction;
}

export interface ToastApi {
    /** Show a toast; returns its id. Queues when `max` are visible. */
    show: (message: string, options?: ToastOptions) => number;
    /** show() with severity preset to success */
    success: (message: string, options?: ToastOptions) => number;
    /** show() with severity preset to error */
    error: (message: string, options?: ToastOptions) => number;
    /** show() with severity preset to warning */
    warning: (message: string, options?: ToastOptions) => number;
    /** show() with severity preset to info */
    info: (message: string, options?: ToastOptions) => number;
    /** Drop every visible and queued toast immediately (no onclose) */
    clear: () => void;
}

/** One queued/visible toast — immutable; leaving flips via replacement */
interface ToastItem {
    id: number;
    message: string;
    severity: string;
    action: ToastAction | null;
    duration: number;
    leaving: boolean;
}

export const Toast = component('toast', {
    position: '',                 // '' = bottom-left | bottom-right | top-left | top-right
    duration: 4000,               // default auto-dismiss ms; 0 = sticky
    max: 5,                       // visible at once; overflow queues
    closable: true,               // × button on each toast
    onclose: Function,            // (message) when one toast is dismissed
    api: {
        show: Function, success: Function, error: Function,
        warning: Function, info: Function, clear: Function,
    },
}, (props, { state, onUnmount }) => {
    const items = state<ToastItem[]>([]);

    let uid = 0;
    const waiting: ToastItem[] = [];                                  // FIFO overflow
    const autoTimers = new Map<number, ReturnType<typeof setTimeout>>();
    const leaveTimers = new Map<number, ReturnType<typeof setTimeout>>();

    const clearTimer = (timers: Map<number, ReturnType<typeof setTimeout>>, id: number) => {
        const timer = timers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timers.delete(id);
        }
    };

    // destroy-clean: an unmount with toasts pending must leave no timer behind
    onUnmount(() => {
        for (const timer of autoTimers.values()) {
            clearTimeout(timer);
        }
        for (const timer of leaveTimers.values()) {
            clearTimeout(timer);
        }
        autoTimers.clear();
        leaveTimers.clear();
    });

    /** A toast becomes visible: enters the stack, arms its auto-dismiss */
    const activate = (toast: ToastItem) => {
        items.value = [...items.value, toast];
        if (toast.duration > 0) {
            autoTimers.set(toast.id, setTimeout(() => dismiss(toast.id), toast.duration));
        }
    };

    /** A slot opened up: promote waiting toasts (their clock starts NOW) */
    const promote = () => {
        while (waiting.length && items.value.length < (props.max!.value as number)) {
            activate(waiting.shift()!);
        }
    };

    /** The leave animation finished: drop the toast, report, promote */
    const removeToast = (id: number) => {
        leaveTimers.delete(id);
        const gone = items.value.find((t) => t.id === id);
        items.value = items.value.filter((t) => t.id !== id);
        if (gone) {
            (props.onclose as ((message: string) => void) | undefined)?.(gone.message);
        }
        promote();
    };

    /** Start dismissing: clear the auto timer, play the leave animation */
    const dismiss = (id: number) => {
        const toast = items.value.find((t) => t.id === id);
        if (!toast || toast.leaving) {
            return;
        }
        clearTimer(autoTimers, id);
        items.value = items.value.map((t) => (t.id === id ? { ...t, leaving: true } : t));
        leaveTimers.set(id, setTimeout(() => removeToast(id), LEAVE));
    };

    const show = (message: string, options: ToastOptions = {}) => {
        const toast: ToastItem = {
            id: ++uid,
            message: String(message),
            severity: options.severity || '',
            action: options.action || null,
            duration: options.duration !== undefined ? options.duration : (props.duration!.value as number),
            leaving: false,
        };
        if (items.value.length < (props.max!.value as number)) {
            activate(toast);
        } else {
            waiting.push(toast);
        }
        return toast.id;
    };

    const preset = (severity: ToastSeverity) => (message: string, options: ToastOptions = {}) =>
        show(message, { ...options, severity });

    const clear = () => {
        for (const timer of autoTimers.values()) {
            clearTimeout(timer);
        }
        for (const timer of leaveTimers.values()) {
            clearTimeout(timer);
        }
        autoTimers.clear();
        leaveTimers.clear();
        waiting.length = 0;
        items.value = [];
    };

    props.ref?.({
        show,
        success: preset('success'),
        error: preset('error'),
        warning: preset('warning'),
        info: preset('info'),
        clear,
    });

    return html`<div class="lm-toast"
        data-position="${() => props.position!.value || false}">${() =>
        items.value.map(
            (t) => html`<div class="lm-toast-item" role="status"
                data-severity="${() => t.severity || false}"
                data-leaving="${() => t.leaving || false}">
                <span class="lm-toast-message">${t.message}</span>
                ${() =>
                    t.action &&
                    html`<button type="button" class="lm-toast-action"
                        onclick="${(e: Event) => {
                            t.action!.onclick?.(e);
                            dismiss(t.id);
                        }}">${t.action.label}</button>`}
                ${() =>
                    props.closable!.value &&
                    html`<button type="button" class="lm-toast-close" aria-label="Close"
                        onclick="${() => dismiss(t.id)}">×</button>`}
            </div>`
        )}</div>`;
});

export default Toast;
