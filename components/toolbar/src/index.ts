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
 *
 * Editor-host additions (the Editor block drives its bar through these):
 *   - item flags are LIVE: mutate selected / disabled / visible / title
 *     on the item objects, then api.refresh() — the bar patches the
 *     affected attributes in place (no rebuild, keyed by item identity).
 *     A caret move updating twelve toggle states costs twelve attribute
 *     writes, not a bar teardown.
 *   - item.tooltip: hover text for icon-only items (title renders as a
 *     visible label, so icon bars need a separate hover string)
 *   - type 'color': a swatch item that opens the Color block (grid +
 *     spectrum panel) in a small popover under the item. A pick lands on
 *     item.value (swatch underline), fires item.onchange(value, item)
 *     and the bar-level onchange(e, item, { value }), then closes.
 *     Outside mousedown and Escape dismiss.
 */

import { component, html } from 'lemonadejs';
import Contextmenu, { type ContextItem } from '@lemonadejs/contextmenu';
import Color from '@lemonadejs/color';

export interface ToolbarItem {
    type?: 'item' | 'divider' | 'divisor' | 'select' | 'color';
    title?: string;
    tooltip?: string; // hover text (title is a visible label; icon bars need both)
    icon?: string; // material icon name
    image?: string; // <img> source
    route?: string; // anchor href (pairs with the Router block)
    selected?: boolean; // data-selected styling flag
    visible?: boolean; // false hides the item
    disabled?: boolean; // blocks activation
    gap?: boolean; // flexible spacer in the left rail (v5 data-gap)
    width?: number; // 'select' pickers: FIXED header width in px — a changing label (Paragraph → Heading 1) must not reflow the toolbar
    options?: (string | ContextItem)[]; // 'select' dropdown entries
    value?: string; // 'color' items: the current color (swatch underline)
    onclick?: (e: Event, item: ToolbarItem) => void;
    onchange?: (value: string, item: ToolbarItem) => void; // 'color' items
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
    onchange: Function, // (e, item, option) when a picker option is chosen, (e, item, { value }) on a color pick
    api: { open: Function, close: Function, refresh: Function },
}, (props, { state, listen }) => {
    const expanded = state<number | null>(null); // items index of the open picker
    const version = state(0); // bumped by api.refresh() — re-evaluates the live item bindings
    const colorAt = state<{ index: number; left: number; top: number } | null>(null); // the open color popover

    let root: HTMLElement | null = null;
    let menu: MenuApi | null = null;

    const items = (): ToolbarItem[] => (props.options.value as ToolbarItem[]) || [];

    /** A live item binding: reads version so api.refresh() re-evaluates it
     *  after in-place item mutations (selected / disabled / title / value) */
    const live = <T>(fn: () => T) => () => {
        void version.value;
        return fn();
    };

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
                props.onchange?.(e, item, picked);
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
        props.onitemclick?.(e, item, index);
    };

    props.ref?.({
        /** Open the picker dropdown of the select item at items index */
        open: (index: number) => open(index),
        close: () => menu?.close(),
        /** Re-evaluate the live item bindings after in-place mutations */
        refresh: () => {
            version.value = version.value + 1;
        },
    });

    /** A 'color' item toggles the Color block popover under itself */
    const pickColor = (e: Event, index: number) => {
        const item = items()[index];
        if (!item || item.disabled) {
            e.preventDefault();
            return;
        }
        item.onclick?.(e, item);
        props.onitemclick?.(e, item, index);
        if (colorAt.value && colorAt.value.index === index) {
            colorAt.value = null;
            return;
        }
        const host = (e.currentTarget as HTMLElement).closest('.lm-toolbar-item') as HTMLElement | null;
        const rect = host?.getBoundingClientRect();
        // fixed positioning (viewport coords) — the popover never clips
        // inside scrolled or absolutely-positioned toolbar hosts
        colorAt.value = { index, left: rect ? rect.left : 0, top: rect ? rect.bottom + 4 : 0 };
    };

    const colorPicked = (value: string, index: number) => {
        const item = items()[index];
        if (!item) {
            return;
        }
        item.value = value;
        version.value = version.value + 1; // repaint the swatch
        item.onchange?.(value, item);
        props.onchange?.(null, item, { value });
        colorAt.value = null; // a pick closes the popover
    };

    // Outside mousedown and Escape dismiss the color popover
    listen<MouseEvent>(document, 'mousedown', (e) => {
        if (colorAt.value && !(e.target as Element)?.closest?.('.lm-toolbar-color-pop, .lm-toolbar-color')) {
            colorAt.value = null;
        }
    });
    listen<KeyboardEvent>(document, 'keydown', (e) => {
        if (e.key === 'Escape' && colorAt.value) {
            colorAt.value = null;
        }
    });

    // Items are keyed by identity: inserting/removing/reordering options
    // moves the existing DOM instead of rewriting every item after it
    const itemView = (item: ToolbarItem, index: number) => {
        if (item.type === 'divisor' || item.type === 'divider') {
            return html`<div class="lm-toolbar-divisor" key="${item}" role="separator"></div>`;
        }
        if (item.type === 'select') {
            return html`<div class="lm-toolbar-picker" key="${item}"
                data-selected="${live(() => (item.selected ? 'true' : false))}"
                data-visible="${live(() => (item.visible === undefined ? false : String(item.visible)))}"
                data-disabled="${live(() => (item.disabled ? 'true' : false))}">
                <div class="lm-toolbar-picker-header" role="button"
                    style="${item.width ? 'width:' + item.width + 'px' : false}"
                    tabindex="${item.disabled ? false : '0'}"
                    title="${item.tooltip || false}"
                    aria-haspopup="true"
                    aria-expanded="${() => (expanded.value === index ? 'true' : 'false')}"
                    onmousedown="${(e: MouseEvent) => press(e, index)}"
                    onmouseover="${(e: MouseEvent) => press(e, index)}"
                    oncontextmenu="${(e: MouseEvent) => press(e, index)}"
                    onkeydown="${(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            press(e, index);
                        }
                    }}">${live(() => item.title || '')}</div>
            </div>`;
        }
        if (item.type === 'color') {
            // Swatch item — activation opens the Color block popover
            return html`<div class="lm-toolbar-item lm-toolbar-color" key="${item}"
                data-visible="${live(() => (item.visible === undefined ? false : String(item.visible)))}"
                data-disabled="${live(() => (item.disabled ? 'true' : false))}">
                <a title="${item.tooltip || item.title || false}" role="button"
                    aria-label="${item.tooltip || item.title || false}"
                    aria-haspopup="true"
                    aria-expanded="${() => (colorAt.value?.index === index ? 'true' : 'false')}"
                    onclick="${(e: MouseEvent) => pickColor(e, index)}">
                    ${item.icon
                        ? html`<i class="material-icons material-symbols-outlined">${item.icon}</i>`
                        : ''}
                    <span class="lm-toolbar-swatch"
                        style="${live(() => 'background-color:' + (item.value || 'transparent'))}"></span>
                </a>
            </div>`;
        }
        return html`<div class="lm-toolbar-item" key="${item}"
            data-selected="${live(() => (item.selected ? 'true' : false))}"
            data-visible="${live(() => (item.visible === undefined ? false : String(item.visible)))}"
            data-disabled="${live(() => (item.disabled ? 'true' : false))}"
            data-gap="${item.gap ? 'true' : false}">
            <a href="${item.route || false}" title="${live(() => item.tooltip || item.title || false)}"
                onclick="${(e: MouseEvent) => activate(e, index)}">
                ${item.image ? html`<img src="${item.image}" alt="" />` : ''}
                ${item.icon
                    ? html`<i class="material-icons material-symbols-outlined">${live(() => item.icon)}</i>`
                    : ''}
                ${item.title ? html`<span>${live(() => item.title)}</span>` : ''}
            </a>
        </div>`;
    };

    return html`<div class="lm-toolbar" role="toolbar"
        ref="${(el: HTMLElement) => (root = el)}"
        aria-orientation="${() => (props.position.value === 'left' ? 'vertical' : false)}"
        data-position="${() => props.position.value || false}"
        data-visible="${() => (props.visible.value === false ? 'false' : 'true')}">
        ${() => items().map((item, i) => itemView(item, i))}
        <${Contextmenu} ref="${(a: MenuApi) => (menu = a)}"
            onclose="${() => (expanded.value = null)}" />
        ${() => {
            const at = colorAt.value;
            if (!at) {
                return '';
            }
            const item = items()[at.index];
            // remounted per open: the panel starts on the item's current value
            return html`<div class="lm-toolbar-color-pop"
                style="${'left:' + at.left + 'px;top:' + at.top + 'px'}">
                <${Color} type="inline" bind="${(item && item.value) || ''}"
                    onchange="${(value: string) => colorPicked(value, at.index)}" />
            </div>`;
        }}
    </div>`;
});

export default Toolbar;
