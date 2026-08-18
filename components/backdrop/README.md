# `<Backdrop />` — @lemonadejs/backdrop

LemonadeJS backdrop block — contract-verified, framework-agnostic.

**✓ verified** — 13 contract checks · framework-agnostic · zero dependencies

## Overview

<Backdrop /> — a full-screen dimming overlay on the v6 contract
model.

A fixed inset-0 layer that dims (and optionally blurs) everything
behind it, flex-centering whatever children the call site provides —
typically a progress spinner. The whole overlay is a branch on the
bound visibility: hidden means not in the DOM. Entry fades in via a
pure CSS animation.

Visibility is the bound state (default hidden): closable clicks (and
Escape) and the api close via .set — which fires onclose — while
external writes to the bound state stay silent.

opacity/zindex use 0 = "keep the CSS default" (0.5 dim, z-index
1200); any other value lands as an inline style so call sites can
layer backdrops without touching the stylesheet.

## Install

```bash
npm install @lemonadejs/backdrop
```

```js
import Backdrop from '@lemonadejs/backdrop';
import '@lemonadejs/backdrop/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Backdrop} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Backdrop} />`                       // by value (no registration)
setComponents({ Backdrop });               // then <Backdrop /> by name anywhere
createWebComponent(Backdrop);              // <lm-backdrop> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. visibility two-way (default: hidden) |
| `blur` | boolean | `false` | backdrop-filter blur behind the dim |
| `opacity` | number | `0` | 0 = default 0.5; else 0-100 → rgba alpha inline |
| `zindex` | number | `0` | 0 = CSS default 1200; else inline z-index |
| `closable` | boolean | `false` | click or Escape closes it |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onclick` — any click on the backdrop (always fires)
- `onclose` — fires when the backdrop closes itself

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const backdrop = ref();
html`<${Backdrop} ref="${backdrop}" />`;
// backdrop.current.open(...)  ·  backdrop.current.close(...)  ·  backdrop.current.toggle(...)
```

- `open()`
- `close()`
- `toggle()`

## Styling

All classes follow the `lm-backdrop-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/backdrop/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Backdrop)`.
