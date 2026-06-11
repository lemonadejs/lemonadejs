/**
 * <Router /> behavior tests — the v5 capabilities, verified: lazy page
 * cache, single mode, :param remounting, link interception, popstate,
 * before-change cancel/redirect, remote views, title, destroy-clean.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, type Component } from 'lemonadejs';
import { render as t, verify } from 'lemonadejs/test';
import Router, { type Route } from '@lemonadejs/router';

type Api = { setPath(p: string, ignore?: boolean): Route | null; current(): Route | null };

let handle: ReturnType<typeof t> | null = null;
afterEach(() => {
    handle?.unmount();
    handle = null;
    history.replaceState({}, '', '/');
    vi.restoreAllMocks();
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const Home: Component = () => html`<div><h1>Home</h1><a href="/about">go</a></div>`;
const About: Component = () => html`<div><h1>About</h1></div>`;
const User: Component<{ id?: string }> = (props) => html`<div><h1>User</h1><span class="uid">${props.id}</span></div>`;

const open = (extra: Partial<Record<string, unknown>> = {}, routes?: Route[]) => {
    let api: Api | null = null;
    history.replaceState({}, '', '/');
    handle = t(Router, {
        routes: routes || [
            { path: '/', component: Home },
            { path: '/about', component: About, title: 'About us' },
            { path: '/user/:id', component: User },
        ],
        ...extra,
        ref: (a: Api) => (api = a),
    });
    return api!;
};

const visible = () =>
    [...handle!.root.querySelectorAll('.lm-router-page')].filter((el) => (el as HTMLElement).style.display !== 'none');

describe('components/router — behaviors', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Router).pass).toBe(true);
    });

    it('shows the route matching the current location at mount', () => {
        open();
        expect(visible()).toHaveLength(1);
        expect(visible()[0].querySelector('h1')!.textContent).toBe('Home');
    });

    it('setPath switches pages and pushes history', () => {
        const api = open();
        api.setPath('/about');
        expect(visible()[0].querySelector('h1')!.textContent).toBe('About');
        expect(window.location.pathname).toBe('/about');
        expect(api.current()!.path).toBe('/about');
    });

    it('pages are CACHED — revisiting reuses the same DOM (v5)', () => {
        const api = open();
        const home = visible()[0];
        api.setPath('/about');
        api.setPath('/');
        expect(visible()[0]).toBe(home); // same element, not rebuilt
        expect(handle!.queryAll('.lm-router-page')).toHaveLength(2); // both kept
    });

    it(':param routes pass params as props and REMOUNT when they change', () => {
        const api = open();
        api.setPath('/user/7');
        expect(handle!.query('.uid')!.textContent).toBe('7');
        const el = visible()[0];

        api.setPath('/about');
        api.setPath('/user/9'); // same route, new params
        expect(handle!.query('.uid')!.textContent).toBe('9');
        expect(visible()[0]).not.toBe(el); // fresh mount, fresh props
    });

    it('intercepts internal <a> clicks (v5 SPA navigation)', () => {
        open();
        const link = handle!.query('a')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(visible()[0].querySelector('h1')!.textContent).toBe('About');
        expect(window.location.pathname).toBe('/about');
    });

    it('leaves external, target and hash links alone', () => {
        const changes: string[] = [];
        open({ onchangepage: (r: Route) => changes.push(r.path) });
        const page = visible()[0];
        for (const a of ['<a href="http://x.com/about">x</a>', '<a href="/about" target="_blank">x</a>', '<a href="#sec">x</a>']) {
            page.insertAdjacentHTML('beforeend', a);
        }
        for (const link of [...page.querySelectorAll('a')].slice(1)) {
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
        expect(changes.filter((p) => p === '/about')).toHaveLength(0);
    });

    it('popstate navigates without pushing history (v5 back button)', () => {
        const api = open();
        api.setPath('/about');
        history.replaceState({}, '', '/'); // simulate back
        window.dispatchEvent(new PopStateEvent('popstate'));
        expect(visible()[0].querySelector('h1')!.textContent).toBe('Home');
    });

    it('onbeforechangepage: false cancels, a string redirects', () => {
        const api = open({
            onbeforechangepage: (p: string) => (p === '/about' ? false : p === '/user/1' ? '/about' : undefined),
        });
        api.setPath('/about'); // cancelled
        expect(visible()[0].querySelector('h1')!.textContent).toBe('Home');
        api.setPath('/user/1'); // redirected
        expect(window.location.pathname).toBe('/about');
    });

    it('onchangepage reports (route, previous, isNew); cache makes isNew false', () => {
        const log: [string, string | null, boolean][] = [];
        const api = open({
            onchangepage: (r: Route, o: Route | null, isNew: boolean) => log.push([r.path, o ? o.path : null, isNew]),
        });
        api.setPath('/about');
        api.setPath('/');
        api.setPath('/about'); // cached now
        expect(log).toEqual([
            ['/', null, true],
            ['/about', '/', true],
            ['/', '/about', false],
            ['/about', '/', false],
        ]);
    });

    it('route onenter/onleave fire with (route, other) (v5)', () => {
        const calls: string[] = [];
        open({}, [
            { path: '/', component: Home, onenter: () => calls.push('enter:/'), onleave: () => calls.push('leave:/') },
            { path: '/about', component: About, onenter: () => calls.push('enter:/about') },
        ]).setPath('/about');
        expect(calls).toEqual(['enter:/', 'leave:/', 'enter:/about']);
    });

    it('single mode keeps ONE page attached (v5)', () => {
        const api = open({ single: true });
        expect(handle!.queryAll('.lm-router-page')).toHaveLength(1);
        api.setPath('/about');
        expect(handle!.queryAll('.lm-router-page')).toHaveLength(1);
        expect(handle!.query('h1')!.textContent).toBe('About');
    });

    it('document.title: route.title wins, else the first h1 (v5)', () => {
        const api = open();
        expect(document.title).toBe('Home'); // from h1
        api.setPath('/about');
        expect(document.title).toBe('About us'); // explicit title
    });

    it('remote url views fetch with the v5 headers and render the HTML', async () => {
        const fetchMock = vi.fn(async (u: string, init: RequestInit) => {
            expect(u).toContain('/view.html?dt=');
            expect((init.headers as Record<string, string>)['X-Requested-With']).toBe('http');
            return { ok: true, text: async () => '<h2>Remote content</h2>' } as Response;
        });
        vi.stubGlobal('fetch', fetchMock);

        const api = open({}, [
            { path: '/', component: Home },
            { path: '/remote', url: '/view.html' },
        ]);
        api.setPath('/remote');
        expect(handle!.root.querySelector('.lm-router')!.className).toContain('lm-router-loading');
        await flush();
        expect(visible()[0].innerHTML).toContain('Remote content');
        expect(handle!.root.querySelector('.lm-router')!.className).not.toContain('lm-router-loading');
    });

    it('preload creates the page before any navigation (v5)', () => {
        open({}, [
            { path: '/', component: Home },
            { path: '/about', component: About, preload: true },
        ]);
        expect(handle!.queryAll('.lm-router-page')).toHaveLength(2); // both exist
        expect(visible()).toHaveLength(1); // only home shown
    });

    it('animation: both pages stay visible until the slide ends, then the old one hides', () => {
        vi.useFakeTimers();
        const api = open({ animation: true });
        api.setPath('/about');

        const router = handle!.query('.lm-router')!;
        expect(router.className).toContain('lm-router-slide-out'); // forward
        expect(visible()).toHaveLength(2); // old NOT hidden mid-slide

        vi.advanceTimersByTime(450);
        expect(router.className).not.toContain('lm-router-slide-out');
        expect(visible()).toHaveLength(1);
        expect(visible()[0].querySelector('h1')!.textContent).toBe('About');

        api.setPath('/'); // backward: opposite direction class
        expect(router.className).toContain('lm-router-slide-in');
        vi.advanceTimersByTime(450);
        expect(visible()[0].querySelector('h1')!.textContent).toBe('Home');
        vi.useRealTimers();
    });

    it('unmount removes the global listeners and destroys page components', () => {
        const lifecycle: string[] = [];
        const Tracked: Component = (p, { onUnmount }) => {
            onUnmount(() => lifecycle.push('unmounted'));
            return html`<div><h1>T</h1><a href="/about">go</a></div>`;
        };
        const api = open({}, [
            { path: '/', component: Tracked },
            { path: '/about', component: About },
        ]);
        api.setPath('/about'); // both pages alive now
        handle!.unmount();
        handle = null;
        expect(lifecycle).toEqual(['unmounted']);

        // the click interceptor is gone: a stray internal link does nothing
        document.body.insertAdjacentHTML('beforeend', '<a id="stray" href="/user/1">x</a>');
        const stray = document.getElementById('stray')!;
        const e = new MouseEvent('click', { bubbles: true, cancelable: true });
        stray.dispatchEvent(e);
        expect(e.defaultPrevented).toBe(false);
        stray.remove();
    });
});
