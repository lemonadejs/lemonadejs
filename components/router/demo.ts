/**
 * Local playground for <Router /> — served by `npm run dev`
 */
import { html, mount, type Component } from '../../src/index';
import Router, { type Route } from './router';

type Api = { setPath(p: string, ignore?: boolean): Route | null; current(): Route | null };

const Home: Component = () => html`<div>
    <h1>Home</h1>
    <p>This page matched the demo URL with a v5 regex path. Pages are cached:
    navigate away and back — this DOM is reused, not rebuilt.</p>
</div>`;

const About: Component = () => html`<div>
    <h1>About</h1>
    <p>Internal links are intercepted automatically — the anchors in the nav
    are plain <code>&lt;a href&gt;</code> tags. Back/forward buttons work
    (popstate).</p>
</div>`;

const User: Component<{ id?: string }> = (props) => html`<div>
    <h1>User ${props.id}</h1>
    <p>This page is a ":param" route (<code>/user/:id</code>) — the id arrives
    as a prop and a NEW id remounts the page with fresh props.</p>
</div>`;

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const note = (m: string) => (log.value = [...log.value, m]);
    let router!: Api;

    return html`<div style="height:360px;display:flex;flex-direction:column">
        <nav style="display:flex;gap:12px;padding:8px 20px;border-bottom:1px solid #e4e4e7">
            <a href="${window.location.pathname}">Home</a>
            <a href="/about">About</a>
            <a href="/user/7">User 7</a>
            <a href="/user/42">User 42</a>
            <button onclick="${() => router.setPath('/about')}">setPath('/about')</button>
            <button onclick="${() => history.back()}">history.back()</button>
        </nav>
        <${Router} ref="${(a: Api) => (router = a)}" animation
            routes="${[
                { path: '(.*)demo.html', component: Home },
                { path: '/about', component: About, title: 'About — LemonadeJS' },
                { path: '/user/:id', component: User },
            ] as Route[]}"
            onchangepage="${(r: Route, o: Route | null, isNew: boolean) =>
                note('→ ' + r.path + (isNew ? ' (created)' : ' (cached)'))}">
        </${Router}>
        <pre style="margin:0;padding:8px 20px;border-top:1px solid #e4e4e7;font-size:12px">${() =>
            log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
