/**
 * listen(): addEventListener whose removal the component owns. The point
 * is structural — a forgotten removeEventListener stops being writable.
 * Works at setup, in onMount, and MID-GESTURE inside event handlers.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, type Component, type Tools } from '../src/index';
import { render as t } from '../src/test';

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
});

describe('listen(): disposal-bound listeners', () => {
    it('removes the listener on unmount', () => {
        let fired = 0;
        const C: Component = (p, { listen }: Tools) => {
            listen(document, 'custom-evt', () => fired++);
            return html`<div></div>`;
        };
        handle = t(C);
        document.dispatchEvent(new Event('custom-evt'));
        expect(fired).toBe(1);

        handle.unmount();
        handle = null;
        document.dispatchEvent(new Event('custom-evt'));
        expect(fired).toBe(1); // gone with the component
    });

    it('off() removes earlier and is idempotent across unmount', () => {
        let fired = 0;
        let off!: () => void;
        const C: Component = (p, { listen }: Tools) => {
            off = listen(document, 'custom-off', () => fired++);
            return html`<div></div>`;
        };
        handle = t(C);
        document.dispatchEvent(new Event('custom-off'));
        off();
        off(); // double release is harmless
        document.dispatchEvent(new Event('custom-off'));
        expect(fired).toBe(1);
        handle.unmount(); // unmount after manual off: no double-remove issues
        handle = null;
    });

    it('a gesture armed MID-EVENT survives release/re-arm cycles and a mid-drag unmount', () => {
        let moves = 0;
        const C: Component = (p, { listen }: Tools) => {
            const start = () => {
                const offMove = listen(document, 'mousemove', () => moves++);
                listen(document, 'mouseup', function up() {
                    offMove();
                });
            };
            return html`<button onmousedown="${start}">drag</button>`;
        };
        handle = t(C);
        const btn = handle.query('button')!;

        // Two full gestures: arm, move, release
        for (let i = 0; i < 2; i++) {
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            document.dispatchEvent(new MouseEvent('mousemove'));
            document.dispatchEvent(new MouseEvent('mouseup'));
        }
        expect(moves).toBe(2);

        // Third gesture: unmount MID-DRAG — the document listener must die
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        handle.unmount();
        handle = null;
        document.dispatchEvent(new MouseEvent('mousemove'));
        expect(moves).toBe(2);
    });

    it('MULTIPLE pending listeners all die at unmount (self-prune must not skip)', () => {
        // Regression: off() splices itself out of unmountCbs; iterating that
        // array live during unmount skipped the listener after each pruned
        // one — with 2+ armed listens, every second one leaked
        let a = 0;
        let b = 0;
        let c = 0;
        const C: Component = (p, { listen }: Tools) => {
            listen(document, 'evt-a', () => a++);
            listen(document, 'evt-b', () => b++);
            listen(document, 'evt-c', () => c++);
            return html`<div></div>`;
        };
        handle = t(C);
        handle.unmount();
        handle = null;
        document.dispatchEvent(new Event('evt-a'));
        document.dispatchEvent(new Event('evt-b'));
        document.dispatchEvent(new Event('evt-c'));
        expect([a, b, c]).toEqual([0, 0, 0]);
    });

    it('listens on any EventTarget, with options', () => {
        let fired = 0;
        const C: Component = (p, { listen }: Tools) => {
            const onScroll = () => fired++;
            return html`<div ref="${(el: Element) => listen(el, 'scroll', onScroll, { passive: true })}"></div>`;
        };
        handle = t(C);
        handle.query('div')!.dispatchEvent(new Event('scroll'));
        expect(fired).toBe(1);
    });
});
