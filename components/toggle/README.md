# `<Toggle />` — @lemonadejs/toggle

LemonadeJS toggle block — contract-verified, framework-agnostic.

**✓ verified** — 16 contract checks · framework-agnostic · zero dependencies

## Overview

<Toggle /> — a pressable toggle button (LemonadeJS v6 block)

Full behavioral parity with the v5 plugin: a single on/off button built on
a hidden <input type="checkbox"> with an optional material icon and text
label (v5 props: text, icon, value, name, disabled, onchange). Distinct
from <Switch />: this looks like a button that stays pressed.

bind vs checked (the v6 split of v5's `value`):
  bind="${state}"  the live two-way pressed state (wins when present)
  checked          the INITIAL state when unbound

## Install

```bash
npm install @lemonadejs/toggle
```

```js
import Toggle from '@lemonadejs/toggle';
import '@lemonadejs/toggle/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Toggle} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Toggle} />`                       // by value (no registration)
setComponents({ Toggle });               // then <Toggle /> by name anywhere
createWebComponent(Toggle);              // <lm-toggle> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way pressed state (v5: value) |
| `checked` | boolean | `false` | initial state when unbound |
| `text` | string | `''` | label text displayed next to the toggle |
| `icon` | string | `''` | material icon name (e.g. 'mic', 'videocam') |
| `name` | string | `''` | form identification name |
| `disabled` | boolean | `false` | blocks interaction (native) |
| `aria-label` | string | `''` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires on user-initiated changes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const toggle = ref();
html`<${Toggle} ref="${toggle}" />`;
// toggle.current.toggle(...)
```

- `toggle()`

## Styling

All classes follow the `lm-toggle-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/toggle/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Toggle)`.
