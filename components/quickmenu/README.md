# `<Quickmenu />` — @lemonadejs/quickmenu

LemonadeJS quickmenu block — contract-verified, framework-agnostic.

**✓ verified** — 12 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/contextmenu`

## Overview

<Quickmenu /> — a compact dropdown button composed ON the Contextmenu
block, exactly like v5 (<Contextmenu :ref="self.menu" /> inside the
quickmenu template): one header that opens the options menu right under
itself. All three v5 triggers kept: hover (onmouseover), click and
right-click — the menu opens 2px below the header, and the items are
the full Contextmenu model (icon/shortcut/tooltip/disabled/line/submenu).

v5 → v6 mapping: title/options/width keep their meaning — width sizes
the HEADER and stays live (v5's :width + onchange handler); self.open(e)
→ api.open(). New: api.close() and onopen/onclose (the inner Contextmenu
ref is private in v6, so dismiss/observe need a surface), plus the
keyboard/ARIA surface v5 never had (focusable header, Enter/Space/
ArrowDown open, role=button + aria-haspopup + aria-expanded).

## Install

```bash
npm install @lemonadejs/quickmenu
```

```js
import Quickmenu from '@lemonadejs/quickmenu';
import '@lemonadejs/quickmenu/style.css';
import '@lemonadejs/contextmenu/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Quickmenu} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Quickmenu} />`                       // by value (no registration)
setComponents({ Quickmenu });               // then <Quickmenu /> by name anywhere
createWebComponent(Quickmenu);              // <lm-quickmenu> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | `''` | text shown in the header |
| `options` | array | — | ContextItem[] — the v5 menu model |
| `width` | number | `200` | header width in px, live (v5 :width) |
| `disabled` | boolean | `false` | blocks every trigger (new) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen` — fires when the menu opens
- `onclose` — fires when the menu closes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const quickmenu = ref();
html`<${Quickmenu} ref="${quickmenu}" />`;
// quickmenu.current.open(...)  ·  quickmenu.current.close(...)
```

- `open()`
- `close()`

## Styling

All classes follow the `lm-quickmenu-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/quickmenu/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Quickmenu)`.
