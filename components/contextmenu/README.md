# `<Contextmenu />` — @lemonadejs/contextmenu

LemonadeJS contextmenu block — contract-verified, framework-agnostic.

**✓ verified** — 6 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Contextmenu /> — built ON the Modal primitive, exactly like v5:
every menu level is a headerless, auto-adjusting Modal. Submenus flip
horizontally when out of space (inheriting the parent's direction),
correct vertical overflow, open on a 200ms hover delay — and the full
v5 keyboard system: ArrowUp/Down cursor skipping disabled items and
separators with wrap-around, Home/End jump to the first/last enabled
item, ArrowRight into a submenu (cursor on its first enabled item),
ArrowLeft back out, Enter/Space activates, Escape closes everything —
keyboard closes hand focus back to the invoker (WCAG 2.4.3), and
aria-activedescendant on the focused wrapper tracks the cursor.

v5 → v6 mapping: open(options, x, y) and openAt(x, y | event) keep
their signatures; the per-item render() DOM hook was dropped.

## Install

```bash
npm install @lemonadejs/contextmenu
```

```js
import Contextmenu from '@lemonadejs/contextmenu';
import '@lemonadejs/contextmenu/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Contextmenu} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Contextmenu} />`                       // by value (no registration)
setComponents({ Contextmenu });               // then <Contextmenu /> by name anywhere
createWebComponent(Contextmenu);              // <lm-contextmenu> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | array | — |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen`
- `onclose`

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const contextmenu = ref();
html`<${Contextmenu} ref="${contextmenu}" />`;
// contextmenu.current.open(...)  ·  contextmenu.current.openAt(...)  ·  contextmenu.current.close(...)
```

- `open()`
- `openAt()`
- `close()`

## Styling

All classes follow the `lm-contextmenu-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/contextmenu/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Contextmenu)`.
