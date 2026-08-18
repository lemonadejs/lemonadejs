/**
 * <Login /> — multi-screen authentication block, ported from the v5
 * plugin with behavioral parity. Seven screens on one endpoint:
 *
 *   login     username + sha512(password) + remember
 *   register  profile { company, name, login, username, terms, phone }
 *   forgot    { username, recovery: 1 } → code screen on success
 *   code      { h: sha512(code) } (6 digits) → reset screen on success
 *   reset     { h, password: sha512(password) } (repeat must match)
 *   bind      server action 'bindSocialAccount': previous payload + password
 *   terms     server action 'acceptTermsAndConditions': payload + terms
 *
 * Protocol (v5): POST to url (default: current pathname), credentials
 * included, device token appended as ?token=. Response { success: 1 }
 * proceeds — server may answer action: 'resetPassword' (+hash) to force
 * the reset screen, or data: <base64 png> to demand a captcha (the
 * captcha input appears and every following request carries `captcha`).
 * Without onsuccess, the block redirects to result.url || pathname
 * (after 3s when there is a message to read — v5 timing).
 *
 * v5 → v6 mapping: google + google-client-id merged into google (the
 * client id IS the switch; same for microsoft); require-company/phone/
 * username/terms → company/phone/username/terms; setTerms() → termstext;
 * jSuites.notification → inline lm-login-message/lm-login-alert;
 * onupdate (broken in v5 — referenced an undefined variable) →
 * onchangescreen(screen). Email persists in localStorage('username'),
 * ?create opens register, ?h=<hash> opens reset — all v5 behaviors.
 */

import { batch, component, html, unsafe } from 'lemonadejs';

export type LoginScreen = 'login' | 'register' | 'forgot' | 'code' | 'reset' | 'bind' | 'terms';

export interface LoginResult {
    success?: number;
    message?: string;
    url?: string;
    /** Server-driven flow: 'resetPassword' | 'bindSocialAccount' | 'acceptTermsAndConditions' */
    action?: string;
    /** Hash accompanying action: 'resetPassword' */
    hash?: string;
    /** Base64 PNG: the server demands a captcha from now on */
    data?: string;
    [key: string]: unknown;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_]+$/;

/**
 * v5 hashed credentials client-side with jSuites' sha512 (hex digest).
 * v6 uses WebCrypto; on insecure contexts (plain http, no crypto.subtle)
 * the raw value is sent — terminate TLS, the hash was never a secret.
 */
const sha512 = async (text: string): Promise<string> => {
    const subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (!subtle) {
        return text;
    }
    const digest = await subtle.digest('SHA-512', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Action button label per screen (v5 createAction titles) */
const ACTION: Record<LoginScreen, string> = {
    login: 'Login',
    register: 'Create a new account',
    forgot: 'Request a new password',
    code: 'Confirm code',
    reset: 'Reset my password',
    bind: 'Bind accounts',
    terms: 'Continue',
};

/** Default instructions per screen (v5 strings, verbatim) */
const INSTRUCTIONS: Partial<Record<LoginScreen, string>> = {
    code: 'Please enter the code you have received by email or message',
    reset: 'Please choose a new password',
    bind: 'Please enter your password to bind your account.',
};

export const Login = component('login', {
    url: '',                      // endpoint (v5: url; default = current pathname)
    device: '',                   // device token, appended as ?token= (v5)
    logo: '',                     // logo image url (v5)
    fullscreen: false,            // cover the viewport (v5)
    google: '',                   // Google client id — truthy shows the button (v5: google + google-client-id)
    facebook: false,              // show the Facebook button (FB SDK carries its own app id)
    microsoft: '',                // Microsoft client id — truthy shows the button (v5: microsoft + microsoft-client-id)
    remember: false,              // offer "remember me" (v5: visibility AND initial checked)
    profile: false,               // offer the "create a new profile" link (v5)
    company: false,               // registration collects company (v5: require-company)
    phone: false,                 // registration collects phone (v5: require-phone)
    username: false,              // registration collects username (v5: require-username)
    terms: false,                 // registration requires terms acceptance (v5: require-terms)
    termstext: '',                // custom terms label, trusted HTML (v5: setTerms)
    onload: Function,             // after mount (v5)
    onsuccess: Function,          // (result, data) — replaces the redirect (v5)
    onerror: Function,            // (result) — server refusals and network failures (v5)
    onbeforesend: Function,       // (data) — mutate the payload before POST (v5)
    onbeforecreate: Function,     // (profile) — before register/social create (v5)
    onchangescreen: Function,     // (screen) — replaces v5's broken onupdate
    api: { show: Function },      // show(screen, hash?) — programmatic navigation
}, (props, { state, onMount, onUnmount }) => {
    // Screen + feedback
    const screen = state<LoginScreen>('login');
    const alertText = state('');        // error feedback (v5: self.alert)
    const notice = state('');           // success message (v5: jSuites.notification)
    const instructions = state('');     // per-screen guidance (v5: self.instructions)
    const loading = state(false);       // v5: lm-login-loading class during requests

    // Fields
    const email = state('');
    const password = state('');
    const repeat = state('');           // v5: password2
    const code = state('');
    const fullname = state('');         // v5: name
    const companyName = state('');
    const phoneNumber = state('');
    const user = state('');             // v5: username (the login alias, not the email)
    const rememberMe = state(!!props.remember.value);
    const accepted = state(false);      // terms checkbox (v5: self.terms)
    const captcha = state('');
    const captchaImage = state('');     // base64 png from the server
    const emailError = state(false);    // v5: blur validation adds .error

    // Manual fetch, not resource(): request() is imperative RPC — a per-call
    // payload AND a per-call continuation (callback may take over the success
    // path) have no resource shape; converting would just move the abort
    // bookkeeping into stashed closure vars + split subscriptions.
    let fetching: AbortController | null = null;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let lastData: Record<string, unknown> = {};   // v5: self.data (bind/terms re-post it)
    let resetHash = '';                           // h carried into the reset screen
    let googleEl: HTMLElement | null = null;      // renderButton fallback target

    const on = (...screens: LoginScreen[]) => screens.includes(screen.value);

    const fail = (message: string) => {
        alertText.value = message;
    };

    const show = (next: LoginScreen, hash?: string) => {
        // One update pass for the screen swap; onchangescreen fires after
        // the DOM settled (same observable order as the unbatched writes)
        batch(() => {
            if (next === 'reset') {
                resetHash = hash ?? resetHash;
                password.value = '';   // v5 cleared both before choosing a new password
                repeat.value = '';
            }
            alertText.value = '';
            notice.value = '';
            instructions.value = INSTRUCTIONS[next] || '';
            screen.value = next;
        });
        props.onchangescreen?.(next);
    };

    /** v5 getUrl: url || pathname, device token as ?token= */
    const endpoint = () =>
        (props.url.value || window.location.pathname) +
        (props.device.value ? '?token=' + props.device.value : '');

    /** v5 default success behavior: redirect (3s grace when there is a message) */
    const redirect = (result: LoginResult) => {
        const go = () => {
            window.location.href = result.url || window.location.pathname;
        };
        if (result.message) {
            redirectTimer = setTimeout(go, 3000);
        } else {
            go();
        }
    };

    /**
     * The single server conversation (v5 self.request). callback may
     * return false to take over the success path (screen transitions).
     */
    const request = (data: Record<string, unknown>, callback?: (result: LoginResult) => unknown) => {
        loading.value = true;
        alertText.value = '';
        lastData = data;
        // Email persistence (v5: localStorage 'username')
        if (typeof data.username === 'string' && data.username) {
            try {
                window.localStorage.setItem('username', data.username);
            } catch {
                /* storage unavailable */
            }
        }
        // Once the server demanded a captcha, every request carries it (v5)
        if (captchaImage.value) {
            data.captcha = captcha.value;
        }
        props.onbeforesend?.(data);
        fetching?.abort();
        const controller = new AbortController();
        fetching = controller;
        fetch(endpoint(), {
            method: 'POST',
            credentials: 'include', // v5: withCredentials
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
        })
            .then((r) => r.json() as Promise<LoginResult>)
            .then((result) => {
                if (controller.signal.aborted) {
                    return;
                }
                fetching = null;
                loading.value = false;
                if (result.success == 1) {
                    if (result.message) {
                        notice.value = result.message;
                    }
                    if (!(callback && callback(result) === false)) {
                        if (result.action === 'resetPassword') {
                            // Server-driven password reset (v5)
                            show('reset', result.hash);
                        } else if (props.onsuccess) {
                            props.onsuccess(result, data);
                        } else {
                            redirect(result);
                        }
                    }
                } else {
                    props.onerror?.(result);
                    alertText.value = result.message || '';
                }
                // Captcha challenge arrives on ANY response (v5)
                if (result.data) {
                    captchaImage.value = result.data;
                }
            })
            .catch((e: Error) => {
                if (controller.signal.aborted) {
                    return;
                }
                fetching = null;
                loading.value = false;
                fail((e && e.message) || String(e));
                props.onerror?.(e);
            });
    };

    /** The action button, per screen — payloads and validations are v5's */
    const submit = async () => {
        try {
            const s = screen.value;
            if (s === 'login') {
                request({
                    username: email.value,
                    password: await sha512(password.value),
                    remember: rememberMe.value,
                });
            } else if (s === 'forgot') {
                if (!EMAIL.test(email.value)) {
                    throw 'Invalid e-mail address';
                }
                request({ username: email.value, recovery: 1 }, () => {
                    show('code');
                    return false;
                });
            } else if (s === 'code') {
                if (code.value.length !== 6) {
                    throw 'The code should has 6 digits';
                }
                const h = await sha512(code.value);
                request({ h }, () => {
                    show('reset', h);
                    return false;
                });
            } else if (s === 'reset') {
                if (!password.value) {
                    throw 'You need to choose a new password';
                }
                if (password.value !== repeat.value) {
                    throw 'The passwords must match';
                }
                request({ h: resetHash, password: await sha512(password.value) });
            } else if (s === 'register') {
                if (!EMAIL.test(email.value)) {
                    throw 'Invalid e-mail address';
                }
                if (user.value && !USERNAME.test(user.value)) {
                    throw 'Invalid username, please use only characters and numbers';
                }
                const profile: Record<string, unknown> = {
                    company: companyName.value,
                    name: fullname.value,
                    login: user.value,
                    username: email.value,
                    terms: accepted.value,
                    phone: phoneNumber.value,
                };
                props.onbeforecreate?.(profile);
                request(profile);
            } else if (s === 'bind') {
                if (!password.value) {
                    throw 'Password is mandatory';
                }
                request({ ...lastData, password: await sha512(password.value) });
            } else if (s === 'terms') {
                props.onbeforecreate?.(lastData);
                request({ ...lastData, terms: accepted.value });
            }
        } catch (e) {
            fail(typeof e === 'string' ? e : String(e));
        }
    };

    /** Social responses share one path: post, honor server-driven screens (v5) */
    const socialRequest = (data: Record<string, unknown>) => {
        if (screen.value === 'register') {
            props.onbeforecreate?.(data);
        }
        request(data, (result) => {
            if (result.action === 'bindSocialAccount') {
                show('bind');
                return false;
            }
            if (result.action === 'acceptTermsAndConditions') {
                show('terms');
                if (result.message) {
                    instructions.value = result.message;
                }
                return false;
            }
        });
    };

    const sdk = globalThis as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    const loginWithGoogle = () => {
        const google = sdk.google;
        if (!google) {
            return fail('Google API not found');
        }
        if (!props.google.value) {
            return fail('Google Client ID not defined');
        }
        try {
            google.accounts.id.initialize({
                client_id: props.google.value,
                auto_select: true,
                callback: (response: { credential: string }) =>
                    socialRequest({ social: 'google', token: response.credential, terms: accepted.value }),
            });
            google.accounts.id.prompt((notification: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    google.accounts.id.renderButton(googleEl, {
                        theme: 'outline',
                        size: 'large',
                        width: googleEl ? googleEl.offsetWidth : undefined,
                        text: 'signin_with',
                    });
                }
            });
        } catch (e) {
            fail(String(e));
        }
    };

    const loginWithFacebook = () => {
        const FB = sdk.FB;
        if (!FB) {
            return fail('Facebook API not found');
        }
        const go = (response: { authResponse: unknown }) =>
            socialRequest({ social: 'facebook', token: response.authResponse, terms: accepted.value });
        FB.getLoginStatus((response: { status?: string; authResponse: unknown }) => {
            if (!response.status || response.status !== 'connected') {
                FB.login(
                    (r: { authResponse: unknown }) => {
                        if (r.authResponse) {
                            go(r);
                        } else {
                            fail('Not authorized by facebook');
                        }
                    },
                    { scope: 'public_profile,email' }
                );
            } else {
                go(response);
            }
        }, true);
    };

    const loginWithMicrosoft = () => {
        const msal = sdk.msal;
        if (!msal) {
            return fail('Microsoft API not found');
        }
        if (!props.microsoft.value) {
            return fail('Microsoft Client ID not defined');
        }
        try {
            const instance = new msal.PublicClientApplication({
                auth: {
                    clientId: props.microsoft.value,
                    authority: 'https://login.microsoftonline.com/common',
                    redirectUri: window.location.href.split('?')[0],
                },
            });
            instance
                .loginPopup({ scopes: ['user.read', 'email', 'profile', 'openid'] })
                .then((response: { accessToken: string }) =>
                    socialRequest({ social: 'microsoft', token: response.accessToken, terms: accepted.value })
                );
        } catch (e) {
            fail(String(e));
        }
    };

    const enter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submit();
        }
    };

    const checkEmail = () => {
        emailError.value = !EMAIL.test(email.value);
    };

    /** href-less link-buttons: Enter/Space must activate (WCAG 2.1.1) */
    const linkKey = (go: () => void) => (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); // Space would scroll the page
            go();
        }
    };

    props.ref?.({ show });

    onMount((el) => {
        const root = el as HTMLElement;
        // Email persistence (v5)
        try {
            const saved = window.localStorage.getItem('username');
            if (saved) {
                email.value = saved;
            }
        } catch {
            /* storage unavailable */
        }
        // Initial screen from the URL (v5): ?create → register, ?h= → reset
        const params = new URLSearchParams(window.location.search);
        if (params.get('create') !== null) {
            show('register');
            (root.querySelector('input[name="name"]') as HTMLInputElement | null)?.focus();
        } else {
            const h = params.get('h');
            if (h) {
                show('reset', h);
            } else {
                (root.querySelector('input[name="email"]') as HTMLInputElement | null)?.focus();
            }
        }
        props.onload?.();
    });

    onUnmount(() => {
        fetching?.abort();
        if (redirectTimer) {
            clearTimeout(redirectTimer);
        }
    });

    const anySocial = () => !!(props.google.value || props.facebook.value || props.microsoft.value);

    return html`<div
        class="lm-login ${() => (props.fullscreen.value ? 'lm-login-fullscreen' : '')} ${() =>
            loading.value ? 'lm-login-loading' : ''}"
        data-screen="${screen}">
        <div class="lm-login-alert" role="alert">${alertText}</div>
        <div class="lm-login-message" role="status">${notice}</div>
        <form class="lm-login-form" onsubmit="${(e: Event) => e.preventDefault()}">
            ${() => props.logo.value && html`<div class="lm-login-logo"><img src="${props.logo}" alt="" /></div>`}
            ${() => instructions.value && html`<div class="lm-login-instructions">${instructions}</div>`}
            ${() =>
                on('login', 'register') &&
                props.google.value &&
                html`<div class="lm-login-row" ref="${(el: HTMLElement) => (googleEl = el)}">
                    <button type="button" class="lm-login-social lm-login-google" onclick="${loginWithGoogle}">
                        Login with Google
                    </button>
                </div>`}
            ${() =>
                on('login', 'register') &&
                props.facebook.value &&
                html`<div class="lm-login-row">
                    <button type="button" class="lm-login-social lm-login-facebook" onclick="${loginWithFacebook}">
                        ${() => (screen.value === 'register' ? 'Sign up' : 'Login with Facebook')}
                    </button>
                </div>`}
            ${() =>
                on('login', 'register') &&
                props.microsoft.value &&
                html`<div class="lm-login-row">
                    <button type="button" class="lm-login-social lm-login-microsoft" onclick="${loginWithMicrosoft}">
                        ${() => (screen.value === 'register' ? 'Sign up' : 'Login with Microsoft')}
                    </button>
                </div>`}
            ${() =>
                on('login', 'register') &&
                anySocial() &&
                html`<div class="lm-login-divisor"><div></div><span>or continue with email</span><div></div></div>`}
            ${() =>
                on('login', 'register', 'forgot') &&
                html`<div class="lm-login-row">
                    <label for="lm-login-email">Email</label>
                    <input type="text" id="lm-login-email" name="email" autocomplete="username"
                        aria-required="true" aria-invalid="${() => (emailError.value ? 'true' : false)}"
                        class="${() => (emailError.value ? 'lm-login-error' : '')}"
                        bind="${email}" onkeydown="${enter}" onblur="${checkEmail}" />
                </div>`}
            ${() =>
                on('register') &&
                html`<div class="lm-login-row">
                    <label for="lm-login-name">Full Name</label>
                    <input type="text" id="lm-login-name" name="name" bind="${fullname}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('register') &&
                props.phone.value &&
                html`<div class="lm-login-row">
                    <label for="lm-login-phone">Phone</label>
                    <input type="text" id="lm-login-phone" name="phone" bind="${phoneNumber}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('register') &&
                props.company.value &&
                html`<div class="lm-login-row">
                    <label for="lm-login-company">Company</label>
                    <input type="text" id="lm-login-company" name="company" bind="${companyName}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('register') &&
                props.username.value &&
                html`<div class="lm-login-row">
                    <label for="lm-login-username">Username</label>
                    <input type="text" id="lm-login-username" name="username" autocomplete="off"
                        bind="${user}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('code') &&
                html`<div class="lm-login-row">
                    <label for="lm-login-code">Code</label>
                    <input type="text" id="lm-login-code" name="code" inputmode="numeric" aria-required="true"
                        bind="${code}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('login', 'reset', 'bind') &&
                html`<div class="lm-login-row">
                    <label for="lm-login-password">Password</label>
                    <input type="password" id="lm-login-password" name="password" aria-required="true"
                        autocomplete="${() => (screen.value === 'login' ? 'current-password' : 'new-password')}"
                        bind="${password}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('reset') &&
                html`<div class="lm-login-row">
                    <label for="lm-login-password2">Repeat the password</label>
                    <input type="password" id="lm-login-password2" name="password2" autocomplete="new-password"
                        aria-required="true" bind="${repeat}" onkeydown="${enter}" />
                </div>`}
            ${() =>
                on('login') &&
                props.remember.value &&
                html`<div class="lm-login-row lm-login-remember">
                    <label><input type="checkbox" bind="${rememberMe}" />
                        <span>Remember me on this device</span></label>
                </div>`}
            ${() =>
                on('login') &&
                html`<div class="lm-login-row lm-login-forgot">
                    <a class="lm-login-link" role="button" tabindex="0" onclick="${() => show('forgot')}"
                        onkeydown="${linkKey(() => show('forgot'))}">Forgot Password?</a>
                </div>`}
            ${() =>
                ((on('register') && props.terms.value) || on('terms')) &&
                html`<div class="lm-login-row lm-login-terms">
                    <label><input type="checkbox" bind="${accepted}" />
                        <span>${() =>
                            unsafe(
                                props.termstext.value ||
                                    'Please accept our Terms and Conditions to continue'
                            )}</span></label>
                </div>`}
            ${() =>
                captchaImage.value &&
                html`<div class="lm-login-row lm-login-captcha">
                    <label for="lm-login-captcha-input">Security code</label>
                    <input type="text" id="lm-login-captcha-input" name="captcha"
                        bind="${captcha}" onkeydown="${enter}" />
                    <img src="${() => 'data:image/png;base64,' + captchaImage.value}" alt="captcha" />
                </div>`}
            <div class="lm-login-row">
                <input type="button" class="lm-login-action" value="${() => ACTION[screen.value]}"
                    onclick="${submit}" />
            </div>
            ${() =>
                !on('login') &&
                html`<div class="lm-login-row">
                    <button type="button" class="lm-login-cancel" onclick="${() => show('login')}">Cancel</button>
                </div>`}
            ${() =>
                on('login') &&
                props.profile.value &&
                html`<div class="lm-login-row lm-login-profile">
                    Do not have an account?
                    <a class="lm-login-link" role="button" tabindex="0" onclick="${() => show('register')}"
                        onkeydown="${linkKey(() => show('register'))}">Create a new profile</a>
                </div>`}
        </form>
    </div>`;
});

export default Login;
