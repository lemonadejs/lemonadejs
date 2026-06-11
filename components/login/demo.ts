/**
 * Local playground for <Login /> — served by `npm run dev`
 *
 * The endpoints are MOCKED: window.fetch is patched for '/auth' below so
 * every flow can be exercised without a backend. The fake server:
 *   - login: password "demo" succeeds; anything else fails, and after
 *     two failures it demands a captcha (v5 challenge flow)
 *   - forgot/code/reset/register: always succeed with a message
 * The social buttons render but their SDKs (google/FB/msal) are not
 * loaded here — clicking shows the v5 "API not found" guard.
 */
import { html, mount, type Component } from 'lemonadejs';
import Login from '@lemonadejs/login';

// 1x1 grey PNG standing in for the server-generated captcha image
const CAPTCHA =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sha512 = async (text: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

// ---- The fake backend -------------------------------------------------
const realFetch = window.fetch.bind(window);
let failures = 0;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (!url.startsWith('/auth')) {
        return realFetch(input, init);
    }
    await new Promise((resolve) => setTimeout(resolve, 600)); // see the loading bar
    const data = JSON.parse(String(init?.body || '{}'));
    const reply = (body: unknown) =>
        new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

    if (data.social) {
        return reply({ success: 1, action: 'acceptTermsAndConditions', message: 'One more step…' });
    }
    if (data.recovery) {
        return reply({ success: 1, message: 'Recovery code sent — any 6 digits work here' });
    }
    if (data.h && !data.password) {
        return reply({ success: 1 });
    }
    if (data.h && data.password) {
        return reply({ success: 1, message: 'Password updated. You can sign in now.' });
    }
    if (data.name !== undefined) {
        return reply({ success: 1, message: 'Account created — check your inbox' });
    }
    // Login
    if (data.password === (await sha512('demo'))) {
        failures = 0;
        return reply({ success: 1, message: 'Welcome back!' });
    }
    failures++;
    return reply({
        success: 0,
        message: 'Invalid password (hint: it is "demo")',
        ...(failures >= 2 ? { data: CAPTCHA } : {}),
    });
};
// -----------------------------------------------------------------------

const App: Component = (props, { state }) => {
    const log = state<string[]>([]);
    const push = (line: string) => (log.value = [...log.value, line]);

    return html`<div class="demo">
        <h1>&lt;Login /&gt;</h1>
        <p>Email: anything valid — Password: <b>demo</b>. Two wrong tries summon the captcha.</p>

        <${Login}
            url="/auth"
            device="demo-device"
            logo="https://lemonadejs.com/templates/default/img/home-icon3.svg"
            remember
            profile
            company
            phone
            username
            terms
            termstext='I accept the <a href="https://lemonadejs.com" target="_blank">Terms and Conditions</a>'
            google="demo-google-client-id"
            facebook
            microsoft="demo-microsoft-client-id"
            onsuccess="${(result: { message?: string }) => push('onsuccess → ' + (result.message || 'ok'))}"
            onerror="${(result: { message?: string }) => push('onerror → ' + (result.message || 'failed'))}"
            onchangescreen="${(screen: string) => push('onchangescreen → ' + screen)}"
            onbeforesend="${(data: Record<string, unknown>) => push('POST ' + JSON.stringify(data).slice(0, 90))}"
        />

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
