# `<Switch />` — @lemonadejs/switch

LemonadeJS switch block — contract-verified, framework-agnostic.

**✓ verified** — 24 contract checks · framework-agnostic · zero dependencies

## Overview

<Switch /> — the canonical LemonadeJS v6 block

Full property parity with the v5 plugin (label as text, checked, color, name,
disabled, position) plus additions the v5 plugin lacked (size,
required, value) on the v6 contract model. Built on a real
<input type="checkbox">: native form participation, native disabled
semantics, native keyboard accessibility.

bind vs checked vs value (closer, but different — by design):
  bind="${state}"  the live two-way state (wins when present)
  checked          the INITIAL state when unbound
  value            the string submitted with the form when on (DOM semantics)

## Install

```bash
npm install @lemonadejs/switch
```

```js
import Switch from '@lemonadejs/switch';
import '@lemonadejs/switch/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Switch} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Switch} />`                       // by value (no registration)
setComponents({ Switch });               // then <Switch /> by name anywhere
createWebComponent(Switch);              // <lm-switch> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way state (v5: value) |
| `checked` | boolean | `false` | initial state when unbound |
| `label` | string | `''` | label displayed beside the switch |
| `color` | string | `''` | green | orange | red | purple |
| `size` | string | `''` | small | large (default in between) |
| `name` | string | `''` | form identification name |
| `value` | string | `''` | form submit value when checked |
| `required` | boolean | `false` | native form validation |
| `disabled` | boolean | `false` | blocks interaction (native) |
| `position` | string | `''` | text position: 'right' moves it before the track |
| `aria-label` | string | `''` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires on user-initiated changes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const switch = ref();
html`<${Switch} ref="${switch}" />`;
// switch.current.toggle(...)
```

- `toggle()`

## Styling

All classes follow the `lm-switch-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/switch/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Switch)`.
