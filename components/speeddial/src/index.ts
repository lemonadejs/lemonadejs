/**
 * <Speeddial /> — a floating action button that fans out a
 * column/row of small action buttons. New v6 block (no v5 ancestor).
 *
 * One FAB toggles the fan on click; hovering opens it and leaving closes
 * it after a 150ms grace timer (cancelled on re-enter and on unmount —
 * destroy-clean). Escape closes. Picking an action fires its own onclick,
 * then onaction(name, event), then closes the fan.
 *
 * bind is the open state (named `fanned`), two-way: external writes flip
 * the fan silently — onopen/onclose fire on user/api transitions only.
 *
 * Fan-out stagger: each action carries an inline transition-delay of
 * index * 30ms — deterministic, testable as a style attribute. The FAB
 * icon rotates 45° while open (pure CSS on lm-speeddial-open). Action
 * tooltips are plain CSS side labels — no Tooltip dependency.
 */

import { component, html } from 'lemonadejs';

const GRACE = 150;   // ms between mouseleave and the hover-close
const STAGGER = 30;  // ms of transition-delay per action index

export type SpeeddialAction = {
    name: string;                  // action label — shown as the side tooltip
    icon?: string;                 // material icon name or a unicode glyph
    onclick?: (e: Event) => void;  // per-action handler (onaction also fires)
};

export const Speeddial = component('speeddial', {
    bind: Boolean,                // two-way open state (`fanned`)
    options: Array,               // SpeeddialAction[] — live
    icon: '',                     // FAB icon (default '+' glyph; rotates 45° open)
    direction: '',                // '' = up | down | left | right
    position: '',                 // '' = static in flow | 'fixed' (bottom-right)
    label: '',                    // aria-label for the FAB
    disabled: false,              // blocks every trigger
    onopen: Function,             // fan opened (user/api — bind writes are silent)
    onclose: Function,            // fan closed (user/api — bind writes are silent)
    onaction: Function,           // (name, event) when an action is picked
    api: { open: Function, close: Function, toggle: Function },
}, (props, { bind, onUnmount }) => {
    const fanned = bind(props, false);

    // ---- hover grace timer: ONE in flight, cleared on re-enter AND unmount
    let grace: ReturnType<typeof setTimeout> | null = null;
    const clearGrace = () => {
        if (grace !== null) {
            clearTimeout(grace);
            grace = null;
        }
    };
    onUnmount(clearGrace);

    const doOpen = () => {
        clearGrace();
        if (!props.disabled.value && !fanned.value) {
            fanned.set(true);
            props.onopen?.();
        }
    };

    const doClose = () => {
        clearGrace();
        if (fanned.value) {
            fanned.set(false);
            props.onclose?.();
        }
    };

    const toggle = () => (fanned.value ? doClose() : doOpen());

    props.ref?.({ open: doOpen, close: doClose, toggle });

    // mouseleave closes after the grace window; re-entering cancels it
    const onLeave = () => {
        clearGrace();
        if (fanned.value) {
            grace = setTimeout(() => {
                grace = null;
                doClose();
            }, GRACE);
        }
    };

    const actions = (): SpeeddialAction[] => {
        const a = props.options.value as SpeeddialAction[] | undefined;
        return Array.isArray(a) ? a : [];
    };

    const pick = (action: SpeeddialAction, e: Event) => {
        action.onclick?.(e);
        props.onaction?.(action.name, e);
        doClose();
    };

    return html`<div
        class="lm-speeddial ${() => (fanned.value ? 'lm-speeddial-open' : '')} ${() =>
            props.disabled.value ? 'lm-speeddial-disabled' : ''} ${() =>
            props.position.value === 'fixed' ? 'lm-speeddial-fixed' : ''}"
        data-direction="${() => props.direction.value || false}"
        onmouseenter="${doOpen}"
        onmouseleave="${onLeave}"
        onkeydown="${(e: KeyboardEvent) => e.key === 'Escape' && doClose()}">
        <button type="button" class="lm-speeddial-fab"
            aria-label="${() => props.label.value || false}"
            aria-haspopup="true"
            aria-expanded="${() => (fanned.value ? 'true' : 'false')}"
            disabled="${props.disabled}"
            onclick="${toggle}">
            <span class="lm-speeddial-icon material-icons">${() => props.icon.value || '+'}</span>
        </button>
        <div class="lm-speeddial-actions" role="menu" aria-hidden="${() => (fanned.value ? 'false' : 'true')}">
            <!-- deliberately UNKEYED: the buttons are stateless and the
                 fan-out stagger is BY POSITION (index * STAGGER), so a
                 moved action must take its new slot's delay, not carry
                 its old one along -->
            ${() =>
                actions().map(
                    (action, index) => html`<button type="button" class="lm-speeddial-action"
                        role="menuitem"
                        tabindex="${() => (fanned.value ? '0' : '-1')}"
                        style="transition-delay: ${index * STAGGER}ms"
                        onclick="${(e: Event) => pick(action, e)}">
                        <span class="lm-speeddial-action-icon material-icons">${action.icon || ''}</span>
                        <span class="lm-speeddial-action-label">${action.name || ''}</span>
                    </button>`
                )}
        </div>
    </div>`;
});

export default Speeddial;
