# `<Navbar />` — @lemonadejs/navbar

LemonadeJS navbar block — contract-verified, framework-agnostic.

**✓ verified** — 13 contract checks · framework-agnostic · zero dependencies

## Overview

<Navbar /> — the v5 navbar plugin on the v6 contract model

The v5 plugin is a mobile-style bar pinned to the bottom of its
positioned ancestor: three flex cells — a left <a href="prev">left</a>,
a centered title, and a right <a href="next">right</a>.

Full property parity: title / left / right / prev / next, all live
States. New in v6: onprev / onnext click events, so the bar can drive
in-app state (a router, a pager, a calendar) instead of forcing the
full page load that v5's href-only navigation required. When prev or
next is empty the href attribute is omitted entirely (v5 rendered a
self-referencing href="").

Labels and title are TEXT (v6 escapes by default) — exactly what the
v5 template produced with its ${this.left} text slots.

## Install

```bash
npm install @lemonadejs/navbar
```

```js
import Navbar from '@lemonadejs/navbar';
import '@lemonadejs/navbar/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Navbar} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Navbar} />`                       // by value (no registration)
setComponents({ Navbar });               // then <Navbar /> by name anywhere
createWebComponent(Navbar);              // <lm-navbar> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | `''` | centered text (v5: title) |
| `left` | string | `''` | left link label (v5: left) |
| `right` | string | `''` | right link label (v5: right) |
| `prev` | string | `''` | left link destination href (v5: prev) |
| `next` | string | `''` | right link destination href (v5: next) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onprev` — left link clicked (new in v6)
- `onnext` — right link clicked (new in v6)

## Styling

All classes follow the `lm-navbar-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/navbar/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Navbar)`.
