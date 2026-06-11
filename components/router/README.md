# `<Router />` — @lemonadejs/router

LemonadeJS router block — contract-verified, framework-agnostic.

**✓ verified** — 11 contract checks · framework-agnostic · zero dependencies

## Overview

<Router /> — SPA router ported from v5 with full behavioral parity:

  - routes as data: { path, component | url, preload, title,
    onenter, onleave } — path is exact, a regex string (v5) or a
    ":param" pattern (new: params arrive as props on the component)
  - pages are created lazily and CACHED — revisits reshow the same
    DOM; "single" keeps only the active page attached (v5)
  - remote views: url fetched with the v5 headers + cache buster,
    in-flight requests aborted on navigation, lm-router-loading
    progress bar while fetching
  - global link interception (internal <a> click = SPA navigation),
    history.pushState + popstate — both REMOVED on unmount (v5
    leaked these listeners forever; v6 routers destroy clean)
  - slide animation between sibling pages by route order (v5)
  - document.title from route.title or the page's first <h1> (v5)

v5 → v6 mapping: controller → component (by value, the v6 way);
declaring routes as HTML children was dropped — routes are a typed
prop. onbeforechangepage(path, route) may cancel (false), redirect
(string) or replace (Route). onchangepage(route, previous, isNew).

## Install

```bash
npm install @lemonadejs/router
```

```js
import Router from '@lemonadejs/router';
import '@lemonadejs/router/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Router} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Router} />`                       // by value (no registration)
setComponents({ Router });               // then <Router /> by name anywhere
createWebComponent(Router);              // <lm-router> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `routes` | array | — |  |
| `single` | boolean | `false` | v5: one page attached at a time |
| `animation` | boolean | `false` | v5: slide between pages by order |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchangepage` — (route, previous, isNew)
- `onbeforechangepage` — (path, route) -> false | path | Route
- `onbeforecreatepage` — (route, html) -> false cancels

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const router = ref();
html`<${Router} ref="${router}" />`;
// router.current.setPath(...)  ·  router.current.current(...)
```

- `setPath()`
- `current()`

## Styling

All classes follow the `lm-router-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/router/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Router)`.
