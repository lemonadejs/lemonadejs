/**
 * <Router /> — SPA router ported from v5 with full behavioral parity:
 *
 *   - routes as data: { path, component | url, preload, title,
 *     onenter, onleave } — path is exact, a regex string (v5) or a
 *     ":param" pattern (new: params arrive as props on the component)
 *   - pages are created lazily and CACHED — revisits reshow the same
 *     DOM; "single" keeps only the active page attached (v5)
 *   - remote views: url fetched with the v5 headers + cache buster,
 *     in-flight requests aborted on navigation, lm-router-loading
 *     progress bar while fetching
 *   - global link interception (internal <a> click = SPA navigation),
 *     history.pushState + popstate — both REMOVED on unmount (v5
 *     leaked these listeners forever; v6 routers destroy clean)
 *   - slide animation between sibling pages by route order (v5)
 *   - document.title from route.title or the page's first <h1> (v5)
 *
 * v5 → v6 mapping: controller → component (by value, the v6 way);
 * declaring routes as HTML children was dropped — routes are a typed
 * prop. onbeforechangepage(path, route) may cancel (false), redirect
 * (string) or replace (Route). onchangepage(route, previous, isNew).
 */

import { component, html, mount, type Component, type Handle } from 'lemonadejs';

export interface Route {
    /** Exact path, v5 regex string, or ':param' pattern (/user/:id) */
    path: string;
    /** Page component, mounted with the matched params as props */
    component?: Component;
    /** Remote HTML view to fetch into the page instead */
    url?: string;
    /** Create this page at mount instead of on first visit */
    preload?: boolean;
    /** document.title for this page (otherwise: the page's first h1) */
    title?: string;
    onenter?: (route: Route, previous: Route | null) => void;
    onleave?: (route: Route, next: Route) => void;
}

interface Page {
    route: Route;
    el: HTMLElement | null;
    handle: Handle | null;
    key: string; // serialized params — a change remounts the component
}

const ANIMATION = 400;

/** ':param' pattern → regex + ordered param names */
const compile = (path: string): { re: RegExp; names: string[] } | null => {
    const names: string[] = [];
    const source = path.replace(/:([\w]+)/g, (_, name: string) => {
        names.push(name);
        return '([^/]+)';
    });
    try {
        return { re: new RegExp('^' + source + '$', 'i'), names };
    } catch {
        return null;
    }
};

export const Router = component('router', {
    routes: Array,
    single: false,                // v5: one page attached at a time
    animation: false,             // v5: slide between pages by order
    onchangepage: Function,       // (route, previous, isNew)
    onbeforechangepage: Function, // (path, route) -> false | path | Route
    onbeforecreatepage: Function, // (route, html) -> false cancels
    api: { setPath: Function, current: Function },
}, (props, { onMount, onUnmount }) => {
    const pages: Page[] = ((props.routes.value as Route[]) || []).map((route) => ({
        route,
        el: null,
        handle: null,
        key: '',
    }));

    let root: HTMLElement | null = null;
    let current: Page | null = null;
    let path = '';
    let fetching: AbortController | null = null;
    let animationTimer: ReturnType<typeof setTimeout> | null = null;
    let animationDone: (() => void) | null = null;

    const loading = (on: boolean) => root?.classList[on ? 'add' : 'remove']('lm-router-loading');

    /** v5 getConfig + param extraction; matches on pathname only */
    const match = (p: string): { page: Page; params: Record<string, string>; key: string } | null => {
        const pathname = p.split('?')[0];
        for (const page of pages) {
            const params: Record<string, string> = {};
            if (pathname === page.route.path) {
                return { page, params, key: '{}' };
            }
            const c = compile(page.route.path);
            const m = c && pathname.match(c.re);
            if (m) {
                c!.names.forEach((name, i) => (params[name] = m[i + 1]));
                return { page, params, key: JSON.stringify(params) };
            }
        }
        return null;
    };

    /** Keep .lm-router-page order matching route order (v5: direction) */
    const reorder = () => {
        for (const page of pages) {
            if (page.el && !props.single.value) {
                root!.appendChild(page.el);
            }
        }
    };

    const createPage = (page: Page, params: Record<string, string>, key: string, remote?: string): boolean => {
        const before = props.onbeforecreatepage as ((route: Route, html?: string) => unknown) | undefined;
        if (before && before(page.route, remote) === false) {
            return false;
        }
        const el = document.createElement('div');
        el.className = 'lm-router-page';
        el.style.display = 'none';
        page.el = el;
        page.key = key;
        reorder();
        if (page.route.component) {
            page.handle = mount(page.route.component, el, params);
        } else if (remote != null) {
            el.innerHTML = remote;
        }
        return true;
    };

    /** Create on demand — fetching the remote view first when needed */
    const ensure = (
        page: Page,
        params: Record<string, string>,
        key: string,
        done: (ok: boolean) => void,
        signal?: AbortSignal
    ) => {
        if (page.el) {
            return done(true);
        }
        if (page.route.url) {
            const u = page.route.url + (page.route.url.includes('?') ? '&dt=' : '?dt=') + Date.now();
            fetch(u, { headers: { Accept: 'text/html', 'X-Requested-With': 'http' }, signal })
                .then((r) => {
                    if (!r.ok) {
                        throw new Error('' + r.status);
                    }
                    return r.text();
                })
                .then((text) => done(createPage(page, params, key, text)))
                .catch(() => done(false));
        } else {
            done(createPage(page, params, key));
        }
    };

    const show = (page: Page, isNew: boolean) => {
        const old = current;
        if (props.single.value) {
            old?.el?.remove();
            root!.appendChild(page.el!);
        } else if (old?.el) {
            old.el.style.display = 'none';
        }
        page.el!.style.display = '';
        old?.route.onleave?.(old.route, page.route);
        current = page;
        page.route.onenter?.(page.route, old ? old.route : null);
        const title = page.route.title || page.el!.querySelector('h1')?.textContent;
        if (title) {
            document.title = title;
        }
        loading(false);
        props.onchangepage?.(
            page.route,
            old ? old.route : null,
            isNew
        );
    };

    /** v5 slide: direction by route order; interrupted animations flush */
    const swap = (page: Page, isNew: boolean) => {
        if (props.animation.value && current && current !== page && !props.single.value) {
            const dir = 'lm-router-slide-' + (pages.indexOf(page) < pages.indexOf(current) ? 'in' : 'out');
            page.el!.style.display = '';
            root!.classList.add(dir);
            if (animationTimer) {
                clearTimeout(animationTimer);
                animationDone!();
            }
            animationDone = () => {
                root!.classList.remove(dir);
                animationTimer = null;
                animationDone = null;
                show(page, isNew);
            };
            animationTimer = setTimeout(animationDone, ANIMATION);
        } else {
            show(page, isNew);
        }
    };

    const setPath = (p: string, ignore = false): Route | null => {
        let target = match(p);
        const before = props.onbeforechangepage as ((path: string, route: Route | null) => unknown) | undefined;
        if (before) {
            const r = before(p, target ? target.page.route : null);
            if (r === false) {
                return null;
            }
            if (typeof r === 'string') {
                p = r;
                target = match(p);
            } else if (r && typeof r === 'object') {
                const page = pages.find((entry) => entry.route === r);
                target = page ? { page, params: {}, key: '{}' } : target;
            }
        }
        // A navigation cancels any in-flight remote view (v5 abort)
        if (fetching) {
            fetching.abort();
            fetching = null;
            loading(false);
        }
        if (!target || p === path) {
            return target ? target.page.route : null;
        }
        const { page, params, key } = target;
        loading(true);
        // Same parameterized route, new params: remount with fresh props
        if (page.el && page.route.component && page.key !== key) {
            page.handle?.unmount();
            page.el.remove();
            page.el = null;
            page.handle = null;
        }
        const existed = !!page.el;
        const controller = page.route.url && !existed ? new AbortController() : null;
        fetching = controller;
        ensure(
            page,
            params,
            key,
            (ok) => {
                fetching = null;
                if (!ok) {
                    loading(false);
                    return;
                }
                const isNew = !existed; // created during this navigation
                if (!ignore) {
                    history.pushState({ route: p }, '', p);
                }
                path = p;
                swap(page, isNew);
            },
            controller?.signal
        );
        return page.route;
    };

    props.ref?.({
        setPath,
        current: () => (current ? current.route : null),
    });

    // v5 intercepted every internal <a> — v6 does too, but cleans up
    const onClick = (e: MouseEvent) => {
        const a = (e.target as Element).closest?.('a');
        if (a && a.href && !a.getAttribute('target')) {
            const href = a.getAttribute('href') || '';
            if (href.indexOf('http') !== 0 && href.indexOf('#') === -1) {
                setPath(a.pathname + a.search);
                e.preventDefault();
            }
        }
    };
    const onPop = () => {
        setPath(window.location.pathname + window.location.search, true);
    };

    onMount(() => {
        document.body.addEventListener('click', onClick);
        window.addEventListener('popstate', onPop);
        for (const page of pages) {
            if (page.route.preload) {
                ensure(page, {}, '{}', () => {});
            }
        }
        setPath(window.location.pathname + window.location.search, true);
        return () => {
            document.body.removeEventListener('click', onClick);
            window.removeEventListener('popstate', onPop);
        };
    });

    onUnmount(() => {
        fetching?.abort();
        if (animationTimer) {
            clearTimeout(animationTimer);
        }
        for (const page of pages) {
            page.handle?.unmount();
        }
    });

    return html`<div class="lm-router" ref="${(el: Element) => (root = el as HTMLElement)}"></div>`;
});

export default Router;
