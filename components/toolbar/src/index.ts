/**
 * <Toolbar /> — a flat action bar, ported faithfully from the v5 plugin.
 *
 * Three positions (v5 data-position): the default is a fixed bottom app
 * bar (mobile pattern), 'static' is an inline editor bar, 'left' is a
 * vertical rail. Three item kinds:
 *
 *   - regular items: <a> with optional image / material icon / title,
 *     route (href), selected and visible flags
 *   - dividers (v5 type 'divisor' — both spellings accepted)
 *   - 'select' pickers: a header that opens a dropdown right under
 *     itself, composed ON the Contextmenu block exactly like v5
 *     (<lm-contextmenu :ref="self.menu">); options are Contextmenu
 *     items, plain strings normalize to { title }
 *
 * v5 → v6 mapping: data/HTML-children extraction → options array;
 * item.onclick (declared in the v5 data model but never wired in the
 * dist template) now fires; the dead v5 onchange/onload params became
 * real events — onchange fires when a picker option is chosen,
 * onitemclick (not "onclick": the name would collide with the native
 * click event on web-component hosts) fires on any item activation.
 * v5's data-gap CSS hook (left rail spacer) gets its missing template
 * plumbing via item.gap. One Contextmenu is shared by all pickers
 * (v5 mounted one per picker), so hovering another picker moves the
 * open dropdown instead of stacking menus.
 */

import { component, html } from 'lemonadejs';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';

export interface ToolbarItem {
    type?: 'item' | 'divider' | 'divisor' | 'select';
    title?: string;
    icon?: string; // material icon name
    image?: string; // <img> source
    route?: string; // anchor href (pairs with the Router block)
    selected?: boolean; // data-selected styling flag
    visible?: boolean; // false hides the item
    disabled?: boolean; // blocks activation
    gap?: boolean; // flexible spacer in the left rail (v5 data-gap)
    options?: (string | ContextItem)[]; // 'select' dropdown entries
    onclick?: (e: Event, item: ToolbarItem) => void;
}

type MenuApi = {
    open(list: ContextItem[], x: number, y: number): void;
    openAt(x: number | MouseEvent, y?: number): void;
    close(): void;
};

export const Toolbar = component('toolbar', {
    options: Array, // ToolbarItem[]
    position: '', // '' = fixed bottom bar (v5 default) | 'static' | 'left'
    visible: true, // false hides the whole bar
    onitemclick: Function, // (e, item, index) on any item activation
    onchange: Function, // (e, item, option) when a picker option is chosen
    api: { open: Function, close: Function },
}, (props, { state }) => {
    const expanded = state<number | null>(null); // items index of the open picker

    let root: HTMLElement | null = null;
    let menu: MenuApi | null = null;

    const items = (): ToolbarItem[] => (props.options.value as ToolbarItem[]) || [];

    /** The Nth picker header in DOM order belongs to the Nth select item */
    const headerEl = (index: number): HTMLElement | null => {
        const list = items();
        let at = 0;
        for (let i = 0; i < index; i++) {
            if (list[i] && list[i].type === 'select') {
                at++;
            }
        }
        return (root?.querySelectorAll('.lm-toolbar-picker-header')[at] as HTMLElement) || null;
    };

    /** v5 cancel: the shared menu's outside-mousedown closer never sees this */
    const cancel = (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
    };

    /** v5 string options become { title }; a pick also fires the toolbar onchange */
    const normalize = (item: ToolbarItem): ContextItem[] =>
        (item.options || []).map((o) => {
            const option: ContextItem = typeof o === 'string' ? { title: o } : { ...o };
            const inner = option.onclick;
            option.onclick = (e: Event, picked: ContextItem) => {
                inner?.(e, picked);
                (props.onchange as
                    | ((e: Event, item: ToolbarItem, option: ContextItem) => void)
                    | undefined)?.(e, item, picked);
            };
            return option;
        });

    const open = (index: number, e?: Event) => {
        const item = items()[index];
        if (!item || item.type !== 'select' || item.disabled) {
            return;
        }
        if (expanded.value === index) {
            return; // this picker is already showing
        }
        const el = (e?.currentTarget as HTMLElement) || headerEl(index);
        const rect = el?.getBoundingClientRect();
        // v5: right under the header (+2px); viewport coords, the same
        // convention the Contextmenu itself uses
        menu?.open(normalize(item), rect ? rect.left : 0, rect ? rect.bottom + 2 : 0);
        expanded.value = index;
    };

    /** v5 opens the picker on click, mouseover AND contextmenu */
    const press = (e: Event, index: number) => {
        cancel(e);
        open(index, e);
    };

    const activate = (e: Event, index: number) => {
        const item = items()[index];
        if (!item || item.disabled) {
            e.preventDefault();
            return;
        }
        item.onclick?.(e, item);
        (props.onitemclick as
            | ((e: Event, item: ToolbarItem, index: number) => void)
            | undefined)?.(e, item, index);
    };

    props.ref?.({
        /** Open the picker dropdown of the select item at items index */
        open: (index: number) => open(index),
        close: () => menu?.close(),
    });

    const itemView = (item: ToolbarItem, index: number) => {
        if (item.type === 'divisor' || item.type === 'divider') {
            return html`<div class="lm-toolbar-divisor" role="separator"></div>`;
        }
        if (item.type === 'select') {
            return html`<div class="lm-toolbar-picker"
                data-selected="${item.selected ? 'true' : false}"
                data-visible="${item.visible === undefined ? false : String(item.visible)}"
                data-disabled="${item.disabled ? 'true' : false}">
                <div class="lm-toolbar-picker-header" role="button"
                    tabindex="${item.disabled ? false : '0'}"
                    aria-haspopup="true"
                    aria-expanded="${() => (expanded.value === index ? 'true' : 'false')}"
                    onmousedown="${(e: MouseEvent) => press(e, index)}"
                    onmouseover="${(e: MouseEvent) => press(e, index)}"
                    oncontextmenu="${(e: MouseEvent) => press(e, index)}"
                    onkeydown="${(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            press(e, index);
                        }
                    }}">${item.title || ''}</div>
            </div>`;
        }
        return html`<div class="lm-toolbar-item"
            data-selected="${item.selected ? 'true' : false}"
            data-visible="${item.visible === undefined ? false : String(item.visible)}"
            data-disabled="${item.disabled ? 'true' : false}"
            data-gap="${item.gap ? 'true' : false}">
            <a href="${item.route || false}" title="${item.title || false}"
                onclick="${(e: MouseEvent) => activate(e, index)}">
                ${item.image ? html`<img src="${item.image}" alt="" />` : ''}
                ${item.icon
                    ? html`<i class="material-icons material-symbols-outlined">${item.icon}</i>`
                    : ''}
                ${item.title ? html`<span>${item.title}</span>` : ''}
            </a>
        </div>`;
    };

    return html`<div class="lm-toolbar" role="toolbar"
        ref="${(el: Element) => (root = el as HTMLElement)}"
        data-position="${() => (props.position.value as string) || false}"
        data-visible="${() => ((props.visible.value as boolean) === false ? 'false' : 'true')}">
        ${() => items().map((item, i) => itemView(item, i))}
        <${Contextmenu} ref="${(a: MenuApi) => (menu = a)}"
            onclose="${() => (expanded.value = null)}" />
    </div>`;
});

export default Toolbar;
