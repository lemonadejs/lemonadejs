/**
 * <Accordion /> — MUI-inspired expansion panels on the v6 contract model.
 *
 * Panels come from a data array ({ title, content?, disabled? }):
 *   - content is trusted TEXT (v6 strings are always text, never HTML);
 *     rich panel bodies come from the render prop: (item, index) => html view
 *   - every panel body is created once and KEPT ALIVE across toggles —
 *     the collapse is a max-height transition driven by data-open (CSS),
 *     never an unmount, so content state (inputs, nested components)
 *     survives open/close cycles
 *   - exclusive by default (MUI's controlled accordion group): bind is the
 *     expanded INDEX, -1/null = all closed, opening one closes the other
 *   - multiple: bind becomes an ARRAY of open indices (MUI's default
 *     uncontrolled behavior, made explicit)
 *
 * Headers are real <button>s: native Enter/Space toggling, native disabled
 * semantics; ArrowUp/ArrowDown walk focus between enabled headers. Each
 * body is a labelled ARIA region (header aria-controls ⇄ body
 * aria-labelledby); panels are keyed by item identity so kept-alive
 * bodies move with their item when the options array changes.
 *
 * Bound state semantics (the v6 protocol): expanded.set() on user toggles
 * fires onchange(expanded, previous); external writes through the bound
 * state stay silent.
 */

import {
    component,
    html,
    type Bindable,
    type Component,
    type ContractInput,
    type State,
    type View,
} from 'lemonadejs';

export interface AccordionItem {
    /** Header text */
    title?: string;
    /** Panel body as trusted text (rich bodies: use the render prop) */
    content?: string;
    /** Disables the panel: header inert, body stays closed */
    disabled?: boolean;
}

/** Exclusive mode holds an index (-1/null = none); multiple holds indices */
export type Expanded = number | number[] | null;

const CONTRACT = {
    options: Array,               // AccordionItem[] — the panels
    render: Function,             // (item, index) => html view for panel bodies
    bind: Number,                 // two-way expanded index (multiple: number[])
    multiple: false,              // several panels open at once (bind = array)
    onchange: Function,           // (expanded, previous) on user toggles
};

/**
 * The contract declares bind as a number (the registry schema needs ONE
 * type); the public face widens it: multiple mode binds number[] and
 * -1/null mean "all closed". onchange mirrors the two shapes.
 */
export type AccordionProps = Omit<ContractInput<typeof CONTRACT>, 'bind' | 'onchange'> & {
    /** Two-way expanded state: index (exclusive) or number[] (multiple) */
    bind?: State<number> | State<number[]> | State<Expanded> | Expanded;
    /** Fires with the new expansion (and the previous one) on user toggles */
    onchange?:
        | ((value: number, oldValue: number) => unknown)
        | ((value: number[], oldValue: number[]) => unknown);
};

/** Document-unique id base per instance — pairs headers and region bodies */
let uid = 0;

export const Accordion = component('accordion', CONTRACT, (props, { bind }) => {
    const expanded = bind(props as Bindable<Expanded>, props.multiple.value ? [] : -1);
    const id = 'lm-accordion-' + ++uid;

    const items = (): AccordionItem[] => (props.options.value as AccordionItem[]) || [];

    const isOpen = (index: number): boolean => {
        const current = expanded.value;
        return Array.isArray(current) ? current.includes(index) : current === index;
    };

    const toggle = (index: number) => {
        const item = items()[index];
        if (!item || item.disabled) {
            return;
        }
        if (props.multiple.value) {
            const open = Array.isArray(expanded.value) ? (expanded.value as number[]) : [];
            expanded.set(
                open.includes(index)
                    ? open.filter((i) => i !== index)
                    : [...open, index].sort((a, b) => a - b)
            );
        } else {
            expanded.set(isOpen(index) ? -1 : index);
        }
    };

    // ---- keyboard: Enter/Space are native (headers are buttons);
    // ArrowUp/ArrowDown walk focus across enabled headers
    let root: HTMLElement | null = null;

    const onKeydown = (e: KeyboardEvent) => {
        if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || !root) {
            return;
        }
        // :scope keeps nested accordions (render-prop bodies) out of the walk
        const headers = [
            ...root.querySelectorAll<HTMLElement>(
                ':scope > .lm-accordion-panel > .lm-accordion-header:not(:disabled)'
            ),
        ];
        const current = headers.indexOf(e.target as HTMLElement);
        if (current < 0) {
            return;
        }
        e.preventDefault();
        const next =
            e.key === 'ArrowDown' ? Math.min(headers.length - 1, current + 1) : Math.max(0, current - 1);
        headers[next]?.focus();
    };

    /** Body content: the render prop wins; content falls back as plain text */
    const body = (item: AccordionItem, index: number) => {
        const view = props.render.value as unknown as
            | ((item: AccordionItem, index: number) => View)
            | undefined;
        return view ? view(item, index) : item.content || '';
    };

    return html`<div class="lm-accordion"
        ref="${(el: HTMLElement) => (root = el)}"
        onkeydown="${onKeydown}">${() =>
        items().map(
            // key: panels move with their item on insert/remove/reorder, so
            // a kept-alive body (inputs, nested components) survives intact
            (item, i) => html`<div class="lm-accordion-panel" key="${item}"
                data-open="${() => (isOpen(i) ? 'true' : false)}"
                data-disabled="${item.disabled ? 'true' : false}">
                <button type="button" class="lm-accordion-header"
                    id="${id + '-header-' + i}"
                    aria-expanded="${() => (isOpen(i) ? 'true' : 'false')}"
                    aria-controls="${id + '-body-' + i}"
                    disabled="${item.disabled ? 'true' : false}"
                    onclick="${() => toggle(i)}">
                    <span class="lm-accordion-title">${item.title || ''}</span>
                    <span class="lm-accordion-chevron"
                        data-open="${() => (isOpen(i) ? 'true' : false)}"></span>
                </button>
                <div class="lm-accordion-body" role="region"
                    id="${id + '-body-' + i}"
                    aria-labelledby="${id + '-header-' + i}"
                    data-open="${() => (isOpen(i) ? 'true' : false)}">
                    <div class="lm-accordion-content">${() => body(item, i)}</div>
                </div>
            </div>`
        )}</div>`;
}) as unknown as Component<AccordionProps>;

export default Accordion;
