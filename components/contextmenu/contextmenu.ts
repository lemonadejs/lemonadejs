/**
 * <Contextmenu /> — full v5 property parity on the v6 contract model.
 * Items: title, icon, shortcut, tooltip, disabled, type: 'line',
 * nested submenu, per-item onclick. MUI Menu review: nothing worth
 * importing — the v5 item model is already richer.
 *
 * v5 → v6 mapping: open(options, x, y) and openAt(x, y | event) keep
 * their signatures through the api; the per-item render() DOM hook was
 * dropped (v5-ism — compose components instead).
 */

import { component, html } from '../../src/index';

export interface ContextItem {
    title?: string;
    icon?: string;
    shortcut?: string;
    tooltip?: string;
    disabled?: boolean;
    type?: 'line' | 'default';
    submenu?: ContextItem[];
    onclick?: (e: MouseEvent, item: ContextItem) => void;
}

const MENU_WIDTH = 220;

export const Contextmenu = component('contextmenu', {
    options: Array,               // ContextItem[]
    onopen: Function,
    onclose: Function,
    api: { open: Function, openAt: Function, close: Function },
}, (props, { state, onMount }) => {
    const visible = state(false);
    const at = state({ x: 0, y: 0 });
    const items = state<ContextItem[]>((props.options!.value as ContextItem[]) || []);

    const doClose = () => {
        if (visible.value) {
            visible.value = false;
            (props.onclose as (() => void) | undefined)?.();
        }
    };

    const doOpen = (list: ContextItem[] | null, x: number, y: number) => {
        if (list) {
            items.value = list;
        } else {
            items.value = (props.options!.value as ContextItem[]) || [];
        }
        // Clamp into the viewport
        at.value = {
            x: Math.max(0, Math.min(x, window.innerWidth - MENU_WIDTH)),
            y: Math.max(0, Math.min(y, window.innerHeight - 40)),
        };
        visible.value = true;
        (props.onopen as (() => void) | undefined)?.();
    };

    const openAt = (xOrEvent: number | MouseEvent, y?: number) => {
        if (typeof xOrEvent === 'object') {
            xOrEvent.preventDefault?.();
            doOpen(null, xOrEvent.clientX, xOrEvent.clientY);
        } else {
            doOpen(null, xOrEvent, y as number);
        }
    };

    props.ref?.({
        open: (list: ContextItem[], x: number, y: number) => doOpen(list, x, y),
        openAt,
        close: doClose,
    });

    // Outside interaction closes — listeners cleaned on unmount
    const onDocDown = (e: MouseEvent) => {
        if (visible.value && !(e.target as Element)?.closest?.('.lm-contextmenu')) {
            doClose();
        }
    };
    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            doClose();
        }
    };

    onMount(() => {
        document.addEventListener('mousedown', onDocDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocDown);
            document.removeEventListener('keydown', onKey);
        };
    });

    const pick = (e: MouseEvent, item: ContextItem) => {
        if (item.disabled || item.type === 'line' || item.submenu) {
            return;
        }
        item.onclick?.(e, item);
        doClose();
    };

    const renderItems = (list: ContextItem[]): unknown =>
        html`<ul class="lm-contextmenu-list">${() =>
            list.map((item) =>
                item.type === 'line'
                    ? html`<li class="lm-contextmenu-line"></li>`
                    : html`<li class="lm-contextmenu-item ${item.disabled ? 'lm-contextmenu-disabled' : ''} ${item.submenu ? 'lm-contextmenu-parent' : ''}"
                          title="${item.tooltip || false}"
                          onclick="${(e: MouseEvent) => pick(e, item)}">
                          <span class="lm-contextmenu-icon material-icons">${item.icon || ''}</span>
                          <span class="lm-contextmenu-title">${item.title || ''}</span>
                          <span class="lm-contextmenu-shortcut">${item.shortcut || ''}</span>
                          ${item.submenu ? html`<span class="lm-contextmenu-arrow">›</span>
                              <div class="lm-contextmenu-submenu">${renderItems(item.submenu)}</div>` : ''}
                      </li>`
            )}</ul>`;

    return html`${() =>
        visible.value &&
        html`<div class="lm-contextmenu"
            style="${() => 'left:' + at.value.x + 'px;top:' + at.value.y + 'px'}">${() =>
            renderItems(items.value)}</div>`}`;
});

export default Contextmenu;
