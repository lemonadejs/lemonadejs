# `<Topmenu />` — @lemonadejs/topmenu

LemonadeJS topmenu block — contract-verified, framework-agnostic.

**✓ verified** — 4 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/contextmenu`

## Overview

<Topmenu /> — a horizontal menu bar, composed ON the Contextmenu block
exactly like v5 (<Contextmenu :ref="self.menu" /> inside the topmenu
template): each top item with a submenu opens one shared Contextmenu
right under itself. Ported faithfully from the v5 plugin:

  - mousedown on a titled item toggles its dropdown (same item closes,
    another item switches)
  - while the menu is open, hovering another top item moves the open
    dropdown to it (menubar behavior)
  - keyboard: ArrowLeft/ArrowRight walk enabled items (wrapping, skipping
    disabled); with the menu open they move the OPEN dropdown; Enter
    toggles. Up/Down/Enter/Escape inside the dropdown belong to the
    composed Contextmenu
  - focusin selects the focused item; focusout of the whole bar clears
    the selection highlight (the remembered index survives, as in v5)
  - full ARIA: menubar / menuitem, aria-haspopup, aria-expanded,
    aria-label, tabindex managed per item (disabled items unreachable)

v5 → v6 mapping: options keeps the v5 item model ({ title, submenu,
disabled }; submenu items are Contextmenu items). self.open(index) →
api.open(index). api.close() is new — the inner Contextmenu ref is
private in v6, so a programmatic dismiss needs a surface.

## Install

```bash
npm install @lemonadejs/topmenu
```

```js
import Topmenu from '@lemonadejs/topmenu';
import '@lemonadejs/topmenu/style.css';
import '@lemonadejs/contextmenu/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Topmenu} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Topmenu} />`                       // by value (no registration)
setComponents({ Topmenu });               // then <Topmenu /> by name anywhere
createWebComponent(Topmenu);              // <lm-topmenu> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | array | — |  |

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const topmenu = ref();
html`<${Topmenu} ref="${topmenu}" />`;
// topmenu.current.open(...)  ·  topmenu.current.close(...)
```

- `open()`
- `close()`

## Styling

All classes follow the `lm-topmenu-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/topmenu/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Topmenu)`.
