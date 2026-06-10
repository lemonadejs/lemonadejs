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
import { type Component } from 'lemonadejs';
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
export declare const Router: Component<import("lemonadejs").ContractInput<{
    routes: ArrayConstructor;
    single: boolean;
    animation: boolean;
    onchangepage: FunctionConstructor;
    onbeforechangepage: FunctionConstructor;
    onbeforecreatepage: FunctionConstructor;
    api: {
        setPath: FunctionConstructor;
        current: FunctionConstructor;
    };
}>>;
export default Router;
