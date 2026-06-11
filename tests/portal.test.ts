/**
 * portal directive: an element with `portal` renders in document.body —
 * escaping transformed/clipping/stacking ancestors — while an invisible
 * anchor text node holds its place in the flow. Ownership is unchanged:
 * bindings, refs, disposal, detach/reattach all behave as if the element
 * were in place. owns(container, target) is the dismiss check that sees
 * through the portal boundary.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, owns, type Component, type State } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('portal: render into document.body, owned from the flow', () => {
    it('the element lands in document.body, not in the component tree', () => {
        const C: Component = () => html`<div class="host">
            <span class="panel" portal>floating</span>
        </div>`;
        handle = t(C);
        expect(handle.query('.panel')).toBeNull(); // not under the host
        const panel = document.body.querySelector(':scope > .panel')!;
        expect(panel).toBeTruthy();
        expect(panel.textContent).toBe('floating');
        expect(panel.hasAttribute('portal')).toBe(false); // directive, not attribute
    });

    it('bindings inside the portal stay live', () => {
        let n!: State<number>;
        const C: Component = (p, { state }) => {
            n = state(0);
            return html`<div><b class="count" portal>${n}</b></div>`;
        };
        handle = t(C);
        const el = document.body.querySelector(':scope > .count')!;
        expect(el.textContent).toBe('0');
        n.value = 7;
        expect(el.textContent).toBe('7');
    });

    it('events inside the portal work (handlers attach to the element directly)', () => {
        let clicks = 0;
        const C: Component = () => html`<div>
            <button class="pbtn" portal onclick="${() => clicks++}">go</button>
        </div>`;
        handle = t(C);
        (document.body.querySelector(':scope > .pbtn') as HTMLElement).click();
        expect(clicks).toBe(1);
    });

    it('refs inside a portal fire ATTACHED', () => {
        const seen: boolean[] = [];
        const C: Component = () => html`<div>
            <i class="pref" portal ref="${(el: Element) => seen.push(el.isConnected)}">x</i>
        </div>`;
        handle = t(C);
        expect(seen).toEqual([true]);
    });

    it('a branch close removes the portal from body; reopen re-attaches the SAME element', () => {
        let open!: State<boolean>;
        const C: Component = (p, { state }) => {
            open = state(false);
            return html`<div>${() => open.value && html`<aside class="pop" portal>panel</aside>`}</div>`;
        };
        handle = t(C);
        const find = () => document.body.querySelector(':scope > .pop');
        expect(find()).toBeNull();

        open.value = true;
        const first = find()!;
        expect(first).toBeTruthy();

        open.value = false; // detach: the cached entry leaves body too
        expect(find()).toBeNull();

        open.value = true; // reattach: cached entry, same element
        expect(find()).toBe(first);
    });

    it('unmount removes the portal from body', () => {
        const C: Component = () => html`<div><u class="pgone" portal>bye</u></div>`;
        handle = t(C);
        expect(document.body.querySelector(':scope > .pgone')).toBeTruthy();
        handle.unmount();
        handle = null;
        expect(document.body.querySelector(':scope > .pgone')).toBeNull();
    });

    it('owns() sees through the portal boundary; contains() does not', () => {
        let root!: HTMLElement;
        const C: Component = () => html`<div class="owner" ref="${(el: HTMLElement) => (root = el)}">
            <em class="inpanel" portal><input /></em>
        </div>`;
        handle = t(C);
        const input = document.body.querySelector(':scope > .inpanel input')!;

        expect(root.contains(input)).toBe(false); // the DOM truth
        expect(owns(root, input)).toBe(true); // the OWNERSHIP truth
        expect(owns(root, document.body)).toBe(false);
        expect(owns(root, null)).toBe(false);
        // In-flow children still work through the same call
        expect(owns(root, root)).toBe(true);
    });

    it('two portals stack in attach order', () => {
        const C: Component = () => html`<div>
            <p class="p1" portal>first</p>
            <p class="p2" portal>second</p>
        </div>`;
        handle = t(C);
        const ps = [...document.body.querySelectorAll(':scope > p')];
        const i1 = ps.findIndex((p) => p.className === 'p1');
        const i2 = ps.findIndex((p) => p.className === 'p2');
        expect(i1).toBeGreaterThanOrEqual(0);
        expect(i2).toBeGreaterThan(i1);
    });

    it('portals inside keyed list items leave with their entry', () => {
        let rows!: State<{ id: number }[]>;
        const C: Component = (p, { state }) => {
            rows = state([{ id: 1 }, { id: 2 }]);
            return html`<ul>${() =>
                rows.value.map((r) => html`<li key="${r.id}"><s class="tip-${r.id}" portal>t${r.id}</s></li>`)}</ul>`;
        };
        handle = t(C);
        expect(document.body.querySelector(':scope > .tip-1')).toBeTruthy();
        expect(document.body.querySelector(':scope > .tip-2')).toBeTruthy();

        rows.value = [{ id: 2 }]; // remove item 1 → its portal must go
        expect(document.body.querySelector(':scope > .tip-1')).toBeNull();
        expect(document.body.querySelector(':scope > .tip-2')).toBeTruthy();
    });
});
