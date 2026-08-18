/**
 * <Login /> block tests — the registry gate plus every v5 flow:
 * login / register / forgot password / code confirmation / password
 * reset / bind social account / accept terms, the captcha challenge,
 * server-driven resetPassword, remember-me, localStorage persistence,
 * URL parameters, device token, social SDK guards and destroy-clean
 * (in-flight fetches aborted on unmount).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render as t, verify } from 'lemonadejs/test';
import Login, { type LoginResult } from '@lemonadejs/login';

// vitest's jsdom env keeps Node's WebCrypto on globalThis — same digest
// implementation the component uses, computed independently here
const sha = async (text: string): Promise<string> => {
    const digest = await globalThis.crypto.subtle.digest('SHA-512', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const respond = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

let handle: ReturnType<typeof t> | null = null;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    fetchMock = vi.fn(async () => respond({ success: 1 }));
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    handle?.unmount();
    handle = null;
    vi.unstubAllGlobals();
    window.localStorage.clear();
    history.replaceState({}, '', '/');
});

// onsuccess by default: the v5 fallback is a real redirect — not for jsdom
const open = (props: Record<string, unknown> = {}) => {
    handle = t(Login, { onsuccess: () => {}, ...props });
};

const q = (selector: string) => handle!.query(selector) as HTMLInputElement;
const type = (selector: string, text: string) => {
    const el = q(selector);
    el.value = text;
    el.dispatchEvent(new Event('input'));
};
const check = (selector: string, on = true) => {
    const el = q(selector);
    el.checked = on;
    el.dispatchEvent(new Event('change'));
};
const action = () => q('.lm-login-action');
const flush = async () => {
    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};
const sent = (i = 0) => JSON.parse((fetchMock.mock.calls[i][1] as RequestInit).body as string);

describe('components/login', () => {
    it('passes verify() — the registry gate', () => {
        expect(verify(Login).pass).toBe(true);
    });

    it('login posts username + sha512(password) + remember with credentials', async () => {
        open();
        type('input[name="email"]', 'paul@example.com');
        type('input[name="password"]', 'secret');
        action().click();
        await flush();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(window.location.pathname);
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('include');
        const body = sent();
        expect(body.username).toBe('paul@example.com');
        expect(body.password).toBe(await sha('secret')); // hashed, never plaintext
        expect(body.remember).toBe(false);
    });

    it('url prop and device token shape the endpoint (v5 ?token=)', async () => {
        open({ url: '/auth', device: 'd-123' });
        type('input[name="email"]', 'a@b.co');
        action().click();
        await flush();
        expect(fetchMock.mock.calls[0][0]).toBe('/auth?token=d-123');
    });

    it('success shows the message and fires onsuccess(result, data)', async () => {
        fetchMock.mockResolvedValue(respond({ success: 1, message: 'Welcome back' }));
        const onsuccess = vi.fn();
        open({ onsuccess });
        type('input[name="email"]', 'a@b.co');
        action().click();
        await flush();

        expect(handle!.query('.lm-login-message')!.textContent).toBe('Welcome back');
        expect(onsuccess).toHaveBeenCalledTimes(1);
        const [result, data] = onsuccess.mock.calls[0] as [LoginResult, Record<string, unknown>];
        expect(result.success).toBe(1);
        expect(data.username).toBe('a@b.co');
    });

    it('server refusal shows the alert and fires onerror — not onsuccess', async () => {
        fetchMock.mockResolvedValue(respond({ success: 0, message: 'Invalid credentials' }));
        const onsuccess = vi.fn();
        const onerror = vi.fn();
        open({ onsuccess, onerror });
        action().click();
        await flush();

        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Invalid credentials');
        expect(onerror).toHaveBeenCalledTimes(1);
        expect(onsuccess).not.toHaveBeenCalled();
    });

    it('network failure surfaces in the alert and fires onerror', async () => {
        fetchMock.mockRejectedValue(new Error('offline'));
        const onerror = vi.fn();
        open({ onerror });
        action().click();
        await flush();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('offline');
        expect(onerror).toHaveBeenCalledTimes(1);
    });

    it('onbeforesend can mutate the payload before it leaves', async () => {
        open({ onbeforesend: (data: Record<string, unknown>) => (data.extra = 'x') });
        action().click();
        await flush();
        expect(sent().extra).toBe('x');
    });

    it('forgot: validates the email, posts recovery and moves to the code screen', async () => {
        open();
        q('.lm-login-forgot a').click();
        expect(action().value).toBe('Request a new password');
        expect(handle!.query('input[name="password"]')).toBeNull();

        type('input[name="email"]', 'not-an-email');
        action().click();
        await flush();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Invalid e-mail address');

        type('input[name="email"]', 'paul@example.com');
        action().click();
        await flush();
        expect(sent()).toEqual({ username: 'paul@example.com', recovery: 1 });
        expect(action().value).toBe('Confirm code'); // code screen
        expect(handle!.text()).toContain('Please enter the code you have received');
    });

    it('code: requires 6 digits, posts h = sha512(code), then reset posts the same h', async () => {
        let api: { show: (s: string) => void } | null = null;
        open({ ref: (a: { show: (s: string) => void }) => (api = a) });
        api!.show('code');

        type('input[name="code"]', '123');
        action().click();
        await flush();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('The code should has 6 digits');

        type('input[name="code"]', '123456');
        action().click();
        await flush();
        const h = await sha('123456');
        expect(sent()).toEqual({ h });

        // success → reset screen carrying the same hash
        expect(action().value).toBe('Reset my password');
        type('input[name="password"]', 'newpass');
        type('input[name="password2"]', 'newpass');
        action().click();
        await flush();
        expect(sent(1)).toEqual({ h, password: await sha('newpass') });
    });

    it('reset: requires a password and a matching repeat', async () => {
        let api: { show: (s: string, h?: string) => void } | null = null;
        open({ ref: (a: { show: (s: string, h?: string) => void }) => (api = a) });
        api!.show('reset', 'server-hash');

        action().click();
        await flush();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('You need to choose a new password');

        type('input[name="password"]', 'one');
        type('input[name="password2"]', 'two');
        action().click();
        await flush();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('The passwords must match');

        type('input[name="password2"]', 'one');
        action().click();
        await flush();
        expect(sent()).toEqual({ h: 'server-hash', password: await sha('one') });
    });

    it('server action resetPassword forces the reset screen with the server hash', async () => {
        fetchMock.mockResolvedValueOnce(respond({ success: 1, action: 'resetPassword', hash: 'abc' }));
        const onsuccess = vi.fn();
        open({ onsuccess });
        action().click();
        await flush();

        expect(onsuccess).not.toHaveBeenCalled();
        expect(action().value).toBe('Reset my password');
        type('input[name="password"]', 'fresh');
        type('input[name="password2"]', 'fresh');
        action().click();
        await flush();
        expect(sent(1)).toEqual({ h: 'abc', password: await sha('fresh') });
    });

    it('register: full profile shape, onbeforecreate hook, v5 payload keys', async () => {
        const onbeforecreate = vi.fn();
        open({ profile: true, company: true, phone: true, username: true, terms: true, onbeforecreate });
        q('.lm-login-profile a').click();
        expect(action().value).toBe('Create a new account');
        expect(handle!.query('input[name="password"]')).toBeNull(); // v5: no password at signup

        type('input[name="email"]', 'bad');
        action().click();
        await flush();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Invalid e-mail address');

        type('input[name="email"]', 'paul@example.com');
        type('input[name="username"]', 'not valid!');
        action().click();
        await flush();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(handle!.query('.lm-login-alert')!.textContent).toContain('Invalid username');

        type('input[name="username"]', 'paulh');
        type('input[name="name"]', 'Paul H');
        type('input[name="phone"]', '+44 1234');
        type('input[name="company"]', 'Lemonade');
        check('.lm-login-terms input');
        action().click();
        await flush();

        expect(onbeforecreate).toHaveBeenCalledTimes(1);
        expect(sent()).toEqual({
            company: 'Lemonade',
            name: 'Paul H',
            login: 'paulh',
            username: 'paul@example.com',
            terms: true,
            phone: '+44 1234',
        });
    });

    it('register fields stay hidden without their flags (v5 require-*)', () => {
        open({ profile: true });
        q('.lm-login-profile a').click();
        expect(handle!.query('input[name="email"]')).not.toBeNull();
        expect(handle!.query('input[name="name"]')).not.toBeNull();
        expect(handle!.query('input[name="company"]')).toBeNull();
        expect(handle!.query('input[name="phone"]')).toBeNull();
        expect(handle!.query('input[name="username"]')).toBeNull();
        expect(handle!.query('.lm-login-terms')).toBeNull();
    });

    it('remember: prop shows the row, starts checked (v5) and rides the payload', async () => {
        open();
        expect(handle!.query('.lm-login-remember')).toBeNull();
        handle!.unmount();

        open({ remember: true });
        const box = q('.lm-login-remember input');
        expect(box.checked).toBe(true); // v5 double-duty: remember=true preset the checkbox
        action().click();
        await flush();
        expect(sent().remember).toBe(true);

        check('.lm-login-remember input', false);
        expect(handle!.query('.lm-login-remember')).not.toBeNull(); // v5 bug fixed: row stays
        action().click();
        await flush();
        expect(sent(1).remember).toBe(false);
    });

    it('persists the email in localStorage and restores it on the next mount', async () => {
        open();
        type('input[name="email"]', 'paul@example.com');
        action().click();
        await flush();
        expect(window.localStorage.getItem('username')).toBe('paul@example.com');
        handle!.unmount();

        open();
        expect(q('input[name="email"]').value).toBe('paul@example.com');
    });

    it('captcha challenge: server data shows the image, next request carries captcha', async () => {
        fetchMock.mockResolvedValueOnce(respond({ success: 0, message: 'Try again', data: 'PNGB64' }));
        open();
        expect(handle!.query('.lm-login-captcha')).toBeNull();
        action().click();
        await flush();

        const img = handle!.query('.lm-login-captcha img') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('data:image/png;base64,PNGB64');

        type('.lm-login-captcha input', 'XYZ12');
        action().click();
        await flush();
        expect(sent(1).captcha).toBe('XYZ12');
    });

    it('social buttons appear with their props; google guards a missing SDK', async () => {
        open();
        expect(handle!.query('.lm-login-google')).toBeNull();
        expect(handle!.query('.lm-login-facebook')).toBeNull();
        expect(handle!.query('.lm-login-microsoft')).toBeNull();
        expect(handle!.query('.lm-login-divisor')).toBeNull();
        handle!.unmount();

        open({ google: 'gid', facebook: true, microsoft: 'mid' });
        expect(handle!.query('.lm-login-google')).not.toBeNull();
        expect(handle!.query('.lm-login-facebook')).not.toBeNull();
        expect(handle!.query('.lm-login-microsoft')).not.toBeNull();
        expect(handle!.query('.lm-login-divisor')).not.toBeNull();

        q('.lm-login-google').click();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Google API not found');
        q('.lm-login-facebook').click();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Facebook API not found');
        q('.lm-login-microsoft').click();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Microsoft API not found');
    });

    it('google flow posts the credential; bindSocialAccount re-posts with the password', async () => {
        let credentialCb: ((r: { credential: string }) => void) | null = null;
        vi.stubGlobal('google', {
            accounts: {
                id: {
                    initialize: (config: { callback: (r: { credential: string }) => void }) =>
                        (credentialCb = config.callback),
                    prompt: () => {},
                    renderButton: () => {},
                },
            },
        });
        fetchMock.mockResolvedValueOnce(respond({ success: 1, action: 'bindSocialAccount' }));
        const onsuccess = vi.fn();
        open({ google: 'client-1', onsuccess });

        q('.lm-login-google').click();
        credentialCb!({ credential: 'tok-1' });
        await flush();
        expect(sent()).toEqual({ social: 'google', token: 'tok-1', terms: false });
        expect(onsuccess).not.toHaveBeenCalled();

        // bind screen: password is mandatory, then the payload is merged
        expect(action().value).toBe('Bind accounts');
        action().click();
        await flush();
        expect(handle!.query('.lm-login-alert')!.textContent).toBe('Password is mandatory');

        type('input[name="password"]', 'secret');
        action().click();
        await flush();
        expect(sent(1)).toEqual({
            social: 'google',
            token: 'tok-1',
            terms: false,
            password: await sha('secret'),
        });
    });

    it('acceptTermsAndConditions: terms screen with the server message, continue re-posts', async () => {
        let credentialCb: ((r: { credential: string }) => void) | null = null;
        vi.stubGlobal('google', {
            accounts: {
                id: {
                    initialize: (config: { callback: (r: { credential: string }) => void }) =>
                        (credentialCb = config.callback),
                    prompt: () => {},
                    renderButton: () => {},
                },
            },
        });
        fetchMock.mockResolvedValueOnce(
            respond({ success: 1, action: 'acceptTermsAndConditions', message: 'Please accept the terms' })
        );
        open({ google: 'client-1' });

        q('.lm-login-google').click();
        credentialCb!({ credential: 'tok-2' });
        await flush();

        expect(action().value).toBe('Continue');
        expect(handle!.query('.lm-login-instructions')!.textContent).toBe('Please accept the terms');
        check('.lm-login-terms input');
        action().click();
        await flush();
        expect(sent(1)).toEqual({ social: 'google', token: 'tok-2', terms: true });
    });

    it('unmount aborts the in-flight request — destroy-clean', async () => {
        let resolveLate: ((r: Response) => void) | null = null;
        fetchMock.mockImplementation(
            (_url: string, init: RequestInit) =>
                new Promise<Response>((resolve) => {
                    resolveLate = resolve;
                    void init;
                })
        );
        const onsuccess = vi.fn();
        open({ onsuccess });
        action().click();
        await flush();

        const init = fetchMock.mock.calls[0][1] as RequestInit;
        handle!.unmount();
        handle = null;
        expect((init.signal as AbortSignal).aborted).toBe(true);

        resolveLate!(respond({ success: 1 }));
        await flush();
        expect(onsuccess).not.toHaveBeenCalled();
    });

    it('?h= opens the reset screen with the hash, ?create opens register (v5 URL flows)', async () => {
        history.replaceState({}, '', '/?h=url-hash');
        open();
        expect(action().value).toBe('Reset my password');
        type('input[name="password"]', 'pw');
        type('input[name="password2"]', 'pw');
        action().click();
        await flush();
        expect(sent().h).toBe('url-hash');
        handle!.unmount();

        history.replaceState({}, '', '/?create');
        open();
        expect(action().value).toBe('Create a new account');
    });

    it('Enter submits from any text input (v5)', async () => {
        open();
        type('input[name="email"]', 'a@b.co');
        q('input[name="password"]').dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
        );
        await flush();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('link-buttons are focusable and Enter/Space activate them (WCAG 2.1.1)', () => {
        open({ profile: true });
        const forgot = q('.lm-login-forgot a');
        expect(forgot.getAttribute('role')).toBe('button');
        expect(forgot.getAttribute('tabindex')).toBe('0');
        forgot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(action().value).toBe('Request a new password');
        q('.lm-login-cancel').click();

        const profile = q('.lm-login-profile a');
        expect(profile.getAttribute('role')).toBe('button');
        expect(profile.getAttribute('tabindex')).toBe('0');
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        profile.dispatchEvent(space);
        expect(space.defaultPrevented).toBe(true); // Space must not scroll the page
        expect(action().value).toBe('Create a new account');
    });

    it('feedback containers are live regions (WCAG 4.1.3)', () => {
        open();
        expect(handle!.query('.lm-login-alert')!.getAttribute('role')).toBe('alert');
        expect(handle!.query('.lm-login-message')!.getAttribute('role')).toBe('status');
    });

    it('email blur validation toggles aria-invalid (WCAG 3.3.1)', () => {
        open();
        type('input[name="email"]', 'nope');
        q('input[name="email"]').dispatchEvent(new Event('blur'));
        expect(q('input[name="email"]').getAttribute('aria-invalid')).toBe('true');

        type('input[name="email"]', 'a@b.co');
        q('input[name="email"]').dispatchEvent(new Event('blur'));
        expect(q('input[name="email"]').getAttribute('aria-invalid')).toBeNull();
    });

    it('login asks for current-password; reset keeps new-password (WCAG 1.3.5)', () => {
        let api: { show: (s: string) => void } | null = null;
        open({ ref: (a: { show: (s: string) => void }) => (api = a) });
        expect(q('input[name="password"]').getAttribute('autocomplete')).toBe('current-password');
        expect(q('input[name="password"]').getAttribute('aria-required')).toBe('true');

        api!.show('reset');
        expect(q('input[name="password"]').getAttribute('autocomplete')).toBe('new-password');
        expect(q('input[name="password2"]').getAttribute('autocomplete')).toBe('new-password');

        api!.show('bind');
        expect(q('input[name="password"]').getAttribute('autocomplete')).toBe('new-password');
    });

    it('email blur validation flags the field (v5 data-validation)', () => {
        open();
        type('input[name="email"]', 'nope');
        q('input[name="email"]').dispatchEvent(new Event('blur'));
        expect(q('input[name="email"]').className).toContain('lm-login-error');

        type('input[name="email"]', 'a@b.co');
        q('input[name="email"]').dispatchEvent(new Event('blur'));
        expect(q('input[name="email"]').className).not.toContain('lm-login-error');
    });

    it('api.show navigates, cancel returns to login, onchangescreen fires, onload at mount', () => {
        const screens: string[] = [];
        const onload = vi.fn();
        let api: { show: (s: string) => void } | null = null;
        open({
            onload,
            onchangescreen: (s: string) => screens.push(s),
            ref: (a: { show: (s: string) => void }) => (api = a),
        });
        expect(onload).toHaveBeenCalledTimes(1);

        api!.show('forgot');
        expect(action().value).toBe('Request a new password');
        q('.lm-login-cancel').click();
        expect(action().value).toBe('Login');
        expect(screens).toContain('forgot');
        expect(screens[screens.length - 1]).toBe('login');
    });

    it('fullscreen class, logo image and custom terms HTML (v5 setTerms)', () => {
        open({
            fullscreen: true,
            logo: '/logo.png',
            profile: true,
            terms: true,
            termstext: 'I accept the <a href="/terms">terms</a>',
        });
        expect(handle!.query('.lm-login')!.className).toContain('lm-login-fullscreen');
        expect((handle!.query('.lm-login-logo img') as HTMLImageElement).getAttribute('src')).toBe('/logo.png');

        q('.lm-login-profile a').click();
        expect(handle!.query('.lm-login-terms a')!.getAttribute('href')).toBe('/terms');
    });
});
