# `<Login />` — @lemonadejs/login

LemonadeJS login block — multi-screen authentication (login, register, forgot password, code confirmation, password reset), contract-verified.

**✓ verified** — 36 contract checks · framework-agnostic · zero dependencies

## Overview

<Login /> — multi-screen authentication block, ported from the v5
plugin with behavioral parity. Seven screens on one endpoint:

  login     username + sha512(password) + remember
  register  profile { company, name, login, username, terms, phone }
  forgot    { username, recovery: 1 } → code screen on success
  code      { h: sha512(code) } (6 digits) → reset screen on success
  reset     { h, password: sha512(password) } (repeat must match)
  bind      server action 'bindSocialAccount': previous payload + password
  terms     server action 'acceptTermsAndConditions': payload + terms

Protocol (v5): POST to url (default: current pathname), credentials
included, device token appended as ?token=. Response { success: 1 }
proceeds — server may answer action: 'resetPassword' (+hash) to force
the reset screen, or data: <base64 png> to demand a captcha (the
captcha input appears and every following request carries `captcha`).
Without onsuccess, the block redirects to result.url || pathname
(after 3s when there is a message to read — v5 timing).

v5 → v6 mapping: google + google-client-id merged into google (the
client id IS the switch; same for microsoft); require-company/phone/
username/terms → company/phone/username/terms; setTerms() → termstext;
jSuites.notification → inline lm-login-message/lm-login-alert;
onupdate (broken in v5 — referenced an undefined variable) →
onchangescreen(screen). Email persists in localStorage('username'),
?create opens register, ?h=<hash> opens reset — all v5 behaviors.

## Install

```bash
npm install @lemonadejs/login
```

```js
import Login from '@lemonadejs/login';
import '@lemonadejs/login/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Login} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Login} />`                       // by value (no registration)
setComponents({ Login });               // then <Login /> by name anywhere
createWebComponent(Login);              // <lm-login> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `url` | string | `''` | endpoint (v5: url; default = current pathname) |
| `device` | string | `''` | device token, appended as ?token= (v5) |
| `logo` | string | `''` | logo image url (v5) |
| `fullscreen` | boolean | `false` | cover the viewport (v5) |
| `google` | string | `''` | Google client id — truthy shows the button (v5: google + google-client-id) |
| `facebook` | boolean | `false` | show the Facebook button (FB SDK carries its own app id) |
| `microsoft` | string | `''` | Microsoft client id — truthy shows the button (v5: microsoft + microsoft-client-id) |
| `remember` | boolean | `false` | offer "remember me" (v5: visibility AND initial checked) |
| `profile` | boolean | `false` | offer the "create a new profile" link (v5) |
| `company` | boolean | `false` | registration collects company (v5: require-company) |
| `phone` | boolean | `false` | registration collects phone (v5: require-phone) |
| `username` | boolean | `false` | registration collects username (v5: require-username) |
| `terms` | boolean | `false` | registration requires terms acceptance (v5: require-terms) |
| `termstext` | string | `''` | custom terms label, trusted HTML (v5: setTerms) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onload` — after mount (v5)
- `onsuccess` — (result, data) — replaces the redirect (v5)
- `onerror` — (result) — server refusals and network failures (v5)
- `onbeforesend` — (data) — mutate the payload before POST (v5)
- `onbeforecreate` — (profile) — before register/social create (v5)
- `onchangescreen` — (screen) — replaces v5's broken onupdate

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const login = ref();
html`<${Login} ref="${login}" />`;
// login.current.show(...)
```

- `show()`

## Styling

All classes follow the `lm-login-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/login/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Login)`.
