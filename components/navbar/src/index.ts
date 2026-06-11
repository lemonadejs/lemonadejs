/**
 * <Navbar /> — the v5 navbar plugin on the v6 contract model
 *
 * The v5 plugin is a mobile-style bar pinned to the bottom of its
 * positioned ancestor: three flex cells — a left <a href="prev">left</a>,
 * a centered title, and a right <a href="next">right</a>.
 *
 * Full property parity: title / left / right / prev / next, all live
 * States. New in v6: onprev / onnext click events, so the bar can drive
 * in-app state (a router, a pager, a calendar) instead of forcing the
 * full page load that v5's href-only navigation required. When prev or
 * next is empty the href attribute is omitted entirely (v5 rendered a
 * self-referencing href="").
 *
 * Labels and title are TEXT (v6 escapes by default) — exactly what the
 * v5 template produced with its ${this.left} text slots.
 */

import { component, html } from 'lemonadejs';

export const Navbar = component('navbar', {
    title: '',          // centered text (v5: title)
    left: '',           // left link label (v5: left)
    right: '',          // right link label (v5: right)
    prev: '',           // left link destination href (v5: prev)
    next: '',           // right link destination href (v5: next)
    onprev: Function,   // left link clicked (new in v6)
    onnext: Function,   // right link clicked (new in v6)
}, (props) => {
    return html`<nav class="lm-navbar">
        <div class="lm-navbar-container">
            <div class="lm-navbar-icon"><a
                href="${() => props.prev.value || false}"
                onclick="${(e: MouseEvent) =>
                    props.onprev?.(e)}">${props.left}</a></div>
            <div class="lm-navbar-title">${props.title}</div>
            <div class="lm-navbar-icon"><a
                href="${() => props.next.value || false}"
                onclick="${(e: MouseEvent) =>
                    props.onnext?.(e)}">${props.right}</a></div>
        </div>
    </nav>`;
});

export default Navbar;
