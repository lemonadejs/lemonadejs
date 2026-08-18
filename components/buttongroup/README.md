# `<Buttongroup />` — @lemonadejs/buttongroup

LemonadeJS buttongroup block — contract-verified, framework-agnostic.

**✓ verified** — 20 contract checks · framework-agnostic · zero dependencies

## Overview

<ButtonGroup /> — a fused row (or column) of buttons (LemonadeJS v6 block)

One block covering both plain action groups and toggle selection:
  selectable=''          plain action buttons — onclick(value, event)
  selectable='single'    exclusive selection — click selects, click
                         again deselects (value | null)
  selectable='multiple'  toggle set — the value is always an array

The selection follows the dropdown model, divisor-free:
  bind="${state}"  the live two-way selection (single value or array)
  external writes land silently; user toggles fire onchange (.set)

## Install

```bash
npm install @lemonadejs/buttongroup
```

```js
import Buttongroup from '@lemonadejs/buttongroup';
import '@lemonadejs/buttongroup/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Buttongroup} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Buttongroup} />`                       // by value (no registration)
setComponents({ Buttongroup });               // then <Buttongroup /> by name anywhere
createWebComponent(Buttongroup);              // <lm-buttongroup> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | any | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. selection: single value, array when multiple (any) |
| `options` | array | — | { value, label, icon, disabled } or strings |
| `selectable` | string | `''` | '' action buttons | single | multiple |
| `variant` | string | `''` | '' contained | outlined | text |
| `color` | string | `''` | green | orange | red | purple |
| `size` | string | `''` | small | large (default in between) |
| `orientation` | string | `''` | '' horizontal | vertical |
| `disabled` | boolean | `false` | blocks the whole group (native) |
| `aria-label` | string | `''` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (selection) on user toggles
- `onclick` — (value, event) in plain mode

## Styling

All classes follow the `lm-buttongroup-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/buttongroup/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Buttongroup)`.
