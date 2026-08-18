/**
 * <Contextmenu /> — built ON the Modal primitive, exactly like v5:
 * every menu level is a headerless, auto-adjusting Modal. Submenus flip
 * horizontally when out of space (inheriting the parent's direction),
 * correct vertical overflow, open on a 200ms hover delay — and the full
 * v5 keyboard system: ArrowUp/Down cursor skipping disabled items and
 * separators with wrap-around, Home/End jump to the first/last enabled
 * item, ArrowRight into a submenu (cursor on its first enabled item),
 * ArrowLeft back out, Enter/Space activates, Escape closes everything —
 * keyboard closes hand focus back to the invoker (WCAG 2.4.3), and
 * aria-activedescendant on the focused wrapper tracks the cursor.
 *
 * v5 → v6 mapping: open(options, x, y) and openAt(x, y | event) keep
 * their signatures; the per-item render() DOM hook was dropped.
 */

import { batch, component, html, isDisposing } from 'lemonadejs';
import Modal from '@lemonadejs/modal';

export interface ContextItem {
    title?: string;
    icon?: string;
    shortcut?: string;
    tooltip?: string;
    disabled?: boolean;
    type?: 'line' | 'default';
    submenu?: ContextItem[];
    onclick?: (e: Event, item: ContextItem) => void;
}

interface Level {
    options: ContextItem[];
    top: number;
    left: number;
    openedLeft: boolean;
}

const MENU_WIDTH = 220;
const HOVER_DELAY = 200;

/** Document-unique id base per instance — gives every menuitem a stable
 *  id so aria-activedescendant can point at the keyboard cursor */
let uid = 0;

const isSelectable = (item: ContextItem | undefined): boolean =>
    !!item && !item.disabled && item.type !== 'line';

/** v5 cursor search: next enabled item in a direction, wrapping */
const findEnabled = (options: ContextItem[], start: number, down: boolean): number | null => {
    let cursor = start;
    for (let attempts = 0; attempts < options.length; attempts++) {
        if (down && cursor >= options.length) {
            cursor = 0;
        }
        if (!down && cursor < 0) {
            cursor = options.length - 1;
        }
        if (isSelectable(options[cursor])) {
            return cursor;
        }
        cursor = down ? cursor + 1 : cursor - 1;
    }
    return null;
};

export const Contextmenu = component('contextmenu', {
    options: Array,
    onopen: Function,
    onclose: Function,
    api: { open: Function, openAt: Function, close: Function },
}, (props, { state, listen, onUnmount }) => {
    const levels = state<Level[]>([]);
    const cursors = state<Record<number, number>>({});
    const id = 'lm-contextmenu-' + ++uid;

    let wrapper: HTMLElement | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    // the element that had focus when the menu opened — keyboard closes
    // (Escape, Enter, api.close) hand focus back to it (WCAG 2.4.3)
    let opener: HTMLElement | null = null;

    // destroy-clean: an unmount mid-hover must leave no submenu timer behind
    onUnmount(() => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
        }
    });

    const modalEl = (level: number): HTMLElement | null =>
        (wrapper?.querySelectorAll('.lm-modal')[level] as HTMLElement) || null;

    const closeFrom = (level: number, restore = true) => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        if (levels.value.length > level) {
            batch(() => {
                levels.value = levels.value.slice(0, level);
                const next: Record<number, number> = {};
                for (const k of Object.keys(cursors.value)) {
                    if (Number(k) < level) {
                        next[Number(k)] = cursors.value[Number(k)];
                    }
                }
                cursors.value = next;
            });
            if (level === 0) {
                wrapper?.classList.remove('lm-menu-focus');
                // Focus goes back to the invoker (WCAG 2.4.3) — but only
                // when the menu still holds it: a Tab-away or an outside
                // click already moved focus where the user wants it
                const invoker = opener;
                opener = null;
                if (
                    restore &&
                    invoker &&
                    invoker.isConnected &&
                    (document.activeElement === wrapper || wrapper?.contains(document.activeElement))
                ) {
                    invoker.focus({ preventScroll: true });
                }
                props.onclose?.();
            }
        }
    };

    const doOpen = (options: ContextItem[] | null, x: number, y: number, adjustToCursor = false) => {
        // remember the invoker BEFORE the wrapper steals focus. A re-open
        // while focus is already INSIDE the menu is a composer moving it to
        // a new invoker (topmenu/toolbar hover-move) — the recorded opener
        // is stale then, and restoring to it would select the wrong item;
        // the composer's own onclose refocus takes over instead
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) {
            opener = active === wrapper || wrapper?.contains(active) ? null : active;
        }
        batch(() => {
            levels.value = [
                {
                    options: options || (props.options.value as ContextItem[]) || [],
                    top: y,
                    left: x,
                    openedLeft: false,
                },
            ];
            cursors.value = {};
        });
        wrapper?.classList.add('lm-menu-focus');
        // preventScroll: the wrapper is an in-flow element — default focus
        // would scroll it into view, jumping the page under the menu
        wrapper?.focus({ preventScroll: true });
        props.onopen?.();
        if (adjustToCursor) {
            // v5: when Modal's auto-adjust flipped the menu, anchor the
            // right/bottom edge at the cursor instead. Synchronous: the
            // level write above mounted the Modal and its per-open setup
            // (auto-adjust margins included) ran inside it — measurable now.
            const el = modalEl(0);
            if (el) {
                // offsetWidth/Height, NOT getBoundingClientRect: the modal's
                // entrance animation is scaling the rect right now, and an
                // under-measured width anchors the flipped edge past the cursor
                const w = el.offsetWidth;
                const h = el.offsetHeight;
                if (parseFloat(el.style.marginLeft) || 0) {
                    let margin = -w - 1;
                    if (x + margin < 10) {
                        margin = 10 - x;
                    }
                    el.style.marginLeft = margin + 'px';
                }
                if (parseFloat(el.style.marginTop) || 0) {
                    let margin = -h - 1;
                    if (y + margin < 10) {
                        margin = 10 - y;
                    }
                    el.style.marginTop = margin + 'px';
                }
            }
        }
    };

    const openAt = (xOrEvent: number | MouseEvent, y?: number) => {
        if (typeof xOrEvent === 'object') {
            xOrEvent.preventDefault?.();
            doOpen(null, xOrEvent.clientX, xOrEvent.clientY, true);
        } else {
            doOpen(null, xOrEvent, y as number, true);
        }
    };

    /** Run `fn` with the element's RUNNING entrance animation jumped to its
     *  end state (then put back, so it still plays): the modal animates
     *  scale+translate for 220ms and rects measured mid-flight misplace
     *  submenus by a few px. */
    const withSettled = <T>(el: HTMLElement, fn: () => T): T => {
        const anims = el.getAnimations ? el.getAnimations().filter((a) => a.playState === 'running') : [];
        const saved = anims.map((a) => a.currentTime);
        for (const a of anims) {
            try { a.currentTime = a.effect?.getComputedTiming().endTime ?? 0; } catch { /* detached */ }
        }
        const out = fn();
        anims.forEach((a, i) => { try { a.currentTime = saved[i]; } catch { /* detached */ } });
        return out;
    };

    /** v5 submenu placement: right of the parent, flipping when cramped */
    const openSub = (level: number, index: number, withCursor = false) => {
        const current = levels.value[level];
        const item = current?.options[index];
        if (!item || !item.submenu || item.disabled) {
            closeFrom(level + 1);
            return;
        }
        const parentEl = modalEl(level);
        // `index` counts ALL options; separators render without [data-item],
        // so the DOM list is shorter — count the non-line entries before it
        const domIndex = current.options.slice(0, index).filter((o) => o.type !== 'line').length;
        const itemEl = parentEl?.querySelectorAll('[data-item]')[domIndex] as HTMLElement | undefined;
        // measure parent + item with the parent's entrance animation settled
        const measured = parentEl
            ? withSettled(parentEl, () => ({
                rect: parentEl.getBoundingClientRect(),
                top: itemEl ? itemEl.getBoundingClientRect().y : current.top,
            }))
            : { rect: { x: current.left, width: MENU_WIDTH } as DOMRect, top: current.top };
        const rect = measured.rect;
        const top = measured.top;

        const spaceRight = window.innerWidth - (rect.x + rect.width);
        const spaceLeft = rect.x;
        let openLeft = current.openedLeft;
        if (!openLeft && spaceRight < MENU_WIDTH + 10) {
            openLeft = true;
        }
        if (openLeft && spaceLeft < MENU_WIDTH + 10 && spaceRight >= MENU_WIDTH + 10) {
            openLeft = false;
        }
        const left = openLeft ? Math.max(10, rect.x - MENU_WIDTH + 2) : rect.x + rect.width - 2;

        batch(() => {
            levels.value = [
                ...levels.value.slice(0, level + 1),
                { options: item.submenu!, top, left, openedLeft: openLeft },
            ];
            if (withCursor) {
                const first = findEnabled(item.submenu!, 0, true);
                if (first !== null) {
                    cursors.value = { ...cursors.value, [level + 1]: first };
                }
            }
        });
        // Vertical overflow correction — synchronous: the submenu's Modal
        // mounted (and ran its setup) inside the batch above. Settled: its
        // own entrance animation is running right now.
        const el = modalEl(level + 1);
        if (el) {
            const r = withSettled(el, () => el.getBoundingClientRect());
            if (r.bottom > window.innerHeight - 10) {
                el.style.top = Math.max(10, top - (r.bottom - (window.innerHeight - 10))) + 'px';
            }
        }
    };

    const activate = (level: number, index: number, e: Event) => {
        const item = levels.value[level]?.options[index];
        if (!isSelectable(item)) {
            return;
        }
        item!.onclick?.(e, item!);
        if (item!.submenu) {
            openSub(level, index, true);
        } else {
            closeFrom(0);
        }
    };

    const moveCursor = (down: boolean) => {
        const level = levels.value.length - 1;
        if (level < 0) {
            return;
        }
        const options = levels.value[level].options;
        const at = cursors.value[level];
        const from = typeof at === 'number' ? (down ? at + 1 : at - 1) : down ? 0 : options.length - 1;
        const next = findEnabled(options, from, down);
        if (next !== null) {
            cursors.value = { ...cursors.value, [level]: next };
        }
    };

    const onKey = (e: KeyboardEvent) => {
        const level = levels.value.length - 1;
        if (level < 0) {
            return;
        }
        let handled = true;
        if (e.key === 'ArrowDown') {
            moveCursor(true);
        } else if (e.key === 'ArrowUp') {
            moveCursor(false);
        } else if (e.key === 'ArrowRight') {
            const at = cursors.value[level];
            const item = levels.value[level].options[at];
            if (item && item.submenu && !item.disabled) {
                openSub(level, at, true);
            } else {
                handled = false;
            }
        } else if (e.key === 'ArrowLeft') {
            if (level > 0) {
                closeFrom(level);
            } else {
                handled = false;
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            const at = cursors.value[level];
            if (typeof at === 'number') {
                activate(level, at, e);
            }
        } else if (e.key === 'Home' || e.key === 'End') {
            const options = levels.value[level].options;
            const target =
                e.key === 'Home' ? findEnabled(options, 0, true) : findEnabled(options, options.length - 1, false);
            if (target !== null) {
                cursors.value = { ...cursors.value, [level]: target };
            }
        } else if (e.key === 'Escape') {
            closeFrom(0);
        } else {
            handled = false;
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    props.ref?.({
        open: (list: ContextItem[], x: number, y: number) => doOpen(list, x, y),
        openAt,
        close: () => closeFrom(0),
    });

    // Outside interaction closes — document fallback for hosts where
    // focus management is unreliable; the engine removes it on unmount
    listen<MouseEvent>(document, 'mousedown', (e) => {
        if (levels.value.length && !wrapper?.contains(e.target as Node)) {
            closeFrom(0, false); // pointer moved on — no focus restore
        }
    });

    // Any scroll outside the menu closes it (matches the OS context menu:
    // the menu refers to the spot that was right-clicked, and scrolling
    // moves that content away). Capture phase: scroll does not bubble.
    // Scrolling INSIDE a long menu list keeps it open
    listen(
        window,
        'scroll',
        (e: Event) => {
            if (levels.value.length && !(e.target instanceof Node && wrapper?.contains(e.target))) {
                closeFrom(0, false); // restoring focus would yank the scroll
            }
        },
        true
    );

    const itemView = (level: number, index: number, item: ContextItem) =>
        item.type === 'line'
            ? html`<li class="lm-contextmenu-line" role="separator"></li>`
            : html`<li class="lm-contextmenu-item ${item.disabled ? 'lm-contextmenu-disabled' : ''} ${() =>
                  cursors.value[level] === index ? 'lm-contextmenu-cursor' : ''}"
                  data-item role="menuitem" id="${id + '-' + level + '-' + index}"
                  title="${item.tooltip || false}"
                  aria-disabled="${item.disabled ? 'true' : false}"
                  aria-haspopup="${item.submenu ? 'true' : false}"
                  onmouseup="${(e: MouseEvent) => activate(level, index, e)}"
                  onmouseenter="${() => {
                      if (hoverTimer) {
                          clearTimeout(hoverTimer);
                      }
                      if (isSelectable(item)) {
                          cursors.value = { ...cursors.value, [level]: index };
                      }
                      hoverTimer = setTimeout(() => openSub(level, index), HOVER_DELAY);
                  }}"
                  onmouseleave="${() => {
                      if (hoverTimer) {
                          clearTimeout(hoverTimer);
                          hoverTimer = null;
                      }
                  }}">
                  <span class="lm-contextmenu-icon material-icons">${item.icon || ''}</span>
                  <span class="lm-contextmenu-title">${item.title || ''}</span>
                  <span class="lm-contextmenu-shortcut">${item.shortcut || ''}</span>
                  ${item.submenu ? html`<span class="lm-contextmenu-arrow material-icons">arrow_right</span>` : ''}
              </li>`;

    // Pushing/popping levels must never rebuild the surviving menus — a
    // rebuilt Modal re-runs auto-adjust and loses the cursor anchor,
    // visibly moving the parent when a submenu opens. The Level object is
    // the key; the engine PATCHES the surviving Modal entries in place
    // (props are unchanged states/literals; the fresh item views flow
    // through the live children bindings). This replaced a WeakMap view
    // cache that existed before live component-prop patching.
    const levelView = (lvl: Level, li: number) =>
        html`<${Modal} key="${lvl}" header="${false}" position="fixed" bind="${true}"
            top="${lvl.top}" left="${lvl.left}"
            focus="${false}" responsive="${false}" autoadjust overflow>
            <ul class="lm-contextmenu-list" role="group">${lvl.options.map(
                (item, ii) => itemView(li, ii, item)
            )}</ul>
        </${Modal}>`;

    // ONE menu owns every menuitem: the focused wrapper is the menu, each
    // level's list is a role=group inside it (menu > group > menuitem per
    // ARIA), and aria-activedescendant tracks the deepest keyboard cursor
    return html`<div class="lm-contextmenu" tabindex="-1" role="menu" aria-orientation="vertical"
        ref="${(el: HTMLElement) => (wrapper = el)}"
        aria-activedescendant="${() => {
            for (let l = levels.value.length - 1; l >= 0; l--) {
                if (typeof cursors.value[l] === 'number') {
                    return id + '-' + l + '-' + cursors.value[l];
                }
            }
            return false;
        }}"
        onkeydown="${onKey}"
        onfocusout="${(e: FocusEvent) => {
            if (isDisposing()) {
                return; // renderer disposing a level is not the user leaving
            }
            if (!wrapper?.contains(e.relatedTarget as Node)) {
                closeFrom(0, false); // focus already left — don't pull it back
            }
        }}">${() => levels.value.map((lvl, li) => levelView(lvl, li))}</div>`;
});

export default Contextmenu;
