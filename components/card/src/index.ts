/**
 * <Card /> — a content surface block (LemonadeJS v6)
 *
 * The classic card sections (header / media / content / actions)
 * collapsed into one contract-driven block. Every section is a branch:
 * it only exists in the DOM when its props are set — the media image
 * when `image` is set, the header when any of avatar/title/subtitle is
 * set, the action row when `actions` has entries. Children always
 * render in the content area, after the `content` text.
 *
 * Two variants through data-variant: '' (elevated — subtle shadow, the
 * default) and 'outlined' (1px border, no shadow). `clickable` makes
 * the whole card an interactive surface (hover lift + onclick); action
 * buttons stop propagation so their clicks never double-fire the card.
 */

import { component, html } from 'lemonadejs';

export interface CardAction {
    /** Button text */
    label?: string;
    /** Fires when the button is clicked (never bubbles to the card onclick) */
    onclick?: (e: MouseEvent, action: CardAction) => void;
    /** Button palette: '' = primary | secondary | success | error | warning */
    color?: string;
}

export const Card = component('card', {
    title: '',                    // header title line
    subtitle: '',                 // muted line under the title
    image: '',                    // media url, top image (object-fit: cover)
    imageheight: 180,             // media height in px
    avatar: '',                   // small round img beside the header titles
    content: '',                  // body text (children render after it)
    actions: Array,               // CardAction[] — footer buttons, right-aligned
    variant: '',                  // '' = elevated | outlined
    clickable: false,             // whole card hover lift + onclick
    onclick: Function,            // fires when a clickable card is clicked
}, (props) => {
    // Children are captured once at creation: a static fact, not a state
    const hasChildren = !!(props.children && props.children.length);

    const press = (e: MouseEvent) => {
        if (props.clickable.value) {
            props.onclick?.(e);
        }
    };

    const heightOf = () =>
        'height:' + (parseInt(String(props.imageheight.value), 10) || 180) + 'px';

    return html`<div class="lm-card ${() => (props.clickable.value ? 'lm-card-clickable' : '')}"
        data-variant="${() => props.variant.value || false}"
        role="${() => (props.clickable.value ? 'button' : false)}"
        tabindex="${() => (props.clickable.value ? '0' : false)}"
        onclick="${press}">
        ${() =>
            props.image.value &&
            html`<img class="lm-card-media" src="${props.image}" alt="" style="${heightOf}" />`}
        ${() =>
            (props.avatar.value || props.title.value || props.subtitle.value) &&
            html`<div class="lm-card-header">
                ${() =>
                    props.avatar.value &&
                    html`<img class="lm-card-avatar" src="${props.avatar}" alt="" />`}
                <div class="lm-card-headings">
                    ${() => props.title.value && html`<div class="lm-card-title">${props.title}</div>`}
                    ${() =>
                        props.subtitle.value &&
                        html`<div class="lm-card-subtitle">${props.subtitle}</div>`}
                </div>
            </div>`}
        ${() =>
            (hasChildren || props.content.value) &&
            html`<div class="lm-card-content">
                ${() => props.content.value && html`<p class="lm-card-text">${props.content}</p>`}
                ${props.children}
            </div>`}
        ${() => {
            const actions = (props.actions.value as CardAction[]) || [];
            return (
                Array.isArray(actions) &&
                actions.length > 0 &&
                // positional: a footer button row never reorders mid-list
                html`<div class="lm-card-actions">${actions.map(
                    (action) => html`<button type="button" class="lm-card-action"
                        data-color="${action.color || false}"
                        onclick="${(e: MouseEvent) => {
                            e.stopPropagation(); // never double-fire the card onclick
                            action.onclick?.(e, action);
                        }}">${action.label || ''}</button>`
                )}</div>`
            );
        }}
    </div>`;
});

export default Card;
