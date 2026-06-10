/**
 * <Rating /> block tests — including the registry gate: verify() must pass.
 * Full behavioral parity with the v5 plugin: value/number/tooltip/name/size
 * + click-to-rate, click-again-to-clear, hover preview, value clamping when
 * the star count shrinks, getValue/setValue api. New: disabled, readonly,
 * color.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, store, type Component } from '../../src/index';
import { render as t, verify } from '../../src/test';
import Rating from './rating';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

const root = () => handle!.query('.lm-rating')!;
const stars = () => handle!.queryAll('.lm-rating-star');
const selected = () => handle!.queryAll('.lm-rating-star[data-selected="1"]');
const hovered = () => handle!.queryAll('.lm-rating-star[data-hover="1"]');

const over = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const leave = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseleave'));

describe('components/rating', () => {
    it('passes verify() — the registry gate', () => {
        const report = verify(Rating as never);
        expect(report.pass).toBe(true);
    });

    it('renders 5 unselected stars by default', () => {
        handle = t(Rating);
        expect(stars()).toHaveLength(5);
        expect(selected()).toHaveLength(0);
        expect(root().getAttribute('data-value')).toBe('0');
    });

    it('value sets the initial rating when unbound', () => {
        handle = t(Rating, { value: 3 });
        expect(selected()).toHaveLength(3);
        expect(root().getAttribute('data-value')).toBe('3');
    });

    it('clicking star N sets the value to N', () => {
        handle = t(Rating);
        stars()[3].click();
        expect(selected()).toHaveLength(4);
        expect(root().getAttribute('data-value')).toBe('4');

        stars()[1].click();
        expect(selected()).toHaveLength(2);
        expect(root().getAttribute('data-value')).toBe('2');
    });

    it('clicking the current value resets to 0 (v5 toggle)', () => {
        handle = t(Rating, { value: 2 });
        stars()[1].click();
        expect(selected()).toHaveLength(0);
        expect(root().getAttribute('data-value')).toBe('0');
    });

    it('bind wins over value and stays two-way', () => {
        const score = store(1);
        handle = t(Rating, { bind: score, value: 4 });
        expect(selected()).toHaveLength(1); // bind wins

        stars()[4].click();
        expect(score.value).toBe(5);

        score.value = 2; // external write flows in
        expect(selected()).toHaveLength(2);
    });

    it('fires onchange on user clicks only', () => {
        const score = store(0);
        const changes: number[] = [];
        handle = t(Rating, { bind: score, onchange: (v: number) => changes.push(v) });

        stars()[2].click();
        expect(changes).toEqual([3]);

        stars()[2].click(); // toggle off
        expect(changes).toEqual([3, 0]);

        score.value = 4; // programmatic write: silent
        expect(changes).toEqual([3, 0]);
    });

    it('hover previews the would-be selection and clears on mouseleave', () => {
        handle = t(Rating);
        over(stars()[2]);
        expect(hovered()).toHaveLength(3);

        over(stars()[0]);
        expect(hovered()).toHaveLength(1);

        leave(root());
        expect(hovered()).toHaveLength(0);
    });

    it('number controls the star count, live', () => {
        const count = store(3);
        handle = t(Rating, { number: count });
        expect(stars()).toHaveLength(3);

        count.value = 7;
        expect(stars()).toHaveLength(7);
    });

    it('shrinking the star count clamps the value and fires onchange (v5)', () => {
        const count = store(5);
        const score = store(5);
        const changes: number[] = [];
        handle = t(Rating, { number: count, bind: score, onchange: (v: number) => changes.push(v) });
        expect(selected()).toHaveLength(5);

        count.value = 3;
        expect(stars()).toHaveLength(3);
        expect(score.value).toBe(3);
        expect(selected()).toHaveLength(3);
        expect(changes).toEqual([3]);
    });

    it('tooltip maps comma-separated titles onto the stars', () => {
        handle = t(Rating, { number: 3, tooltip: 'Bad,Ok,Great' });
        expect(stars().map((s) => s.getAttribute('title'))).toEqual(['Bad', 'Ok', 'Great']);
        handle.unmount();

        handle = t(Rating, { number: 3, tooltip: 'Bad' });
        const titles = stars().map((s) => s.getAttribute('title'));
        expect(titles[0]).toBe('Bad');
        expect(titles[1]).toBeNull(); // missing entries get no title at all
    });

    it('respects disabled: no clicks, no hover preview', () => {
        handle = t(Rating, { disabled: true, value: 2 });
        expect(root().hasAttribute('data-disabled')).toBe(true);

        stars()[4].click();
        expect(selected()).toHaveLength(2); // unchanged

        over(stars()[4]);
        expect(hovered()).toHaveLength(0);
    });

    it('respects readonly: keeps the value visible but inert', () => {
        const changes: number[] = [];
        handle = t(Rating, { readonly: true, value: 4, onchange: (v: number) => changes.push(v) });
        expect(root().hasAttribute('data-readonly')).toBe(true);
        expect(selected()).toHaveLength(4);

        stars()[0].click();
        over(stars()[0]);
        expect(selected()).toHaveLength(4);
        expect(hovered()).toHaveLength(0);
        expect(changes).toEqual([]);
    });

    it('exposes getValue/setValue through the api (setValue fires onchange, as v5)', () => {
        const changes: number[] = [];
        let api: { getValue: () => number; setValue: (v: number) => void } | null = null;
        handle = t(Rating, {
            value: 2,
            onchange: (v: number) => changes.push(v),
            ref: (a: { getValue: () => number; setValue: (v: number) => void }) => (api = a),
        });

        expect(api!.getValue()).toBe(2);
        api!.setValue(5);
        expect(api!.getValue()).toBe(5);
        expect(selected()).toHaveLength(5);
        expect(changes).toEqual([5]);
    });

    it('passes name, size and color through as in v5', () => {
        handle = t(Rating, { name: 'score', size: 'small', color: 'yellow' });
        expect(root().getAttribute('name')).toBe('score');
        expect(root().getAttribute('data-size')).toBe('small');
        expect(root().getAttribute('data-color')).toBe('yellow');
        handle.unmount();

        handle = t(Rating);
        expect(root().hasAttribute('name')).toBe(false); // empty → no attribute
        expect(root().hasAttribute('data-size')).toBe(false);
        expect(root().hasAttribute('data-color')).toBe(false);
    });

    it('uses contract coercion: attribute-style strings work', () => {
        const App: Component = () => html`<main><${Rating} number="3" value="2" disabled="true" /></main>`;
        handle = t(App);
        expect(stars()).toHaveLength(3);
        expect(selected()).toHaveLength(2);
        expect(root().hasAttribute('data-disabled')).toBe(true);
    });
});
