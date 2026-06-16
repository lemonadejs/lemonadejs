# `<Alert />` — @lemonadejs/alert

LemonadeJS alert block — contract-verified, framework-agnostic.

**✓ verified** — 15 contract checks · framework-agnostic · zero dependencies

## Overview

<Alert /> — a severity banner on the v6 contract model.

Four severities (info — the default — success, warning, error) drive
the icon and the palette through data-severity; three flavors
(standard — the default — outlined, filled) through data-variant.
Icons are inline SVG: no external icon font dependency.

Visibility is the bound state (default visible): the × button hides
the alert via .set — which fires onclose — while external writes to
the bound state stay silent. The whole alert is a branch on that
state: hidden means not in the DOM.

Body content: title (bold AlertTitle line), message (plain text) and
props.children, rendered in that order.

## Install

```bash
npm install @lemonadejs/alert
```

```js
import Alert from '@lemonadejs/alert';
import '@lemonadejs/alert/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Alert} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Alert} />`                       // by value (no registration)
setComponents({ Alert });               // then <Alert /> by name anywhere
createWebComponent(Alert);              // <lm-alert> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. visibility two-way (default: visible) |
| `severity` | string | `''` | '' = info | success | warning | error |
| `variant` | string | `''` | '' = standard | outlined | filled |
| `title` | string | `''` | optional bold title line |
| `message` | string | `''` | body text (children render after it) |
| `closable` | boolean | `false` | shows the × button |
| `icon` | boolean | `true` | false hides the severity icon |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onclose` — fires when the × hides the alert

## Styling

All classes follow the `lm-alert-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/alert/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Alert)`.
