# `<Drawer />` — @lemonadejs/drawer

LemonadeJS drawer block — anchored side panels and the bottom sheet on the Modal primitive; contract-verified, framework-agnostic.

**✓ verified** — 15 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Drawer /> — a side panel sliding from an edge, built ON
the Modal primitive: position left/right are already full-viewport-height
side panels and bottom is the sheet mode, so the drawer is a thin
composition — anchor mapping, its own header chrome and the slide-in
animation (CSS keyframes scoped by data-anchor on the wrapper).

Contract:
  bind      two-way open state (named `visible` internally — assignment
            through the bound chain is SILENT, no onopen/onclose echo)
  anchor    '' = left | 'right' | 'bottom' — live while open (Modal's
            position prop is reactive)
  width     panel width in px (left/right; bottom is full width via CSS)
  backdrop  dimmed overlay behind the panel
  closable  backdrop click + Escape close the drawer
  title     optional header row with a close ×

onclose(origin): 'button' | 'backdrop' | 'escape' | 'api'.

## Install

```bash
npm install @lemonadejs/drawer
```

```js
import Drawer from '@lemonadejs/drawer';
import '@lemonadejs/drawer/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Drawer} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Drawer} />`                       // by value (no registration)
setComponents({ Drawer });               // then <Drawer /> by name anywhere
createWebComponent(Drawer);              // <lm-drawer> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way open state |
| `anchor` | string | `''` | '' = left | right | bottom |
| `width` | number | `280` | panel width px (left/right) |
| `backdrop` | boolean | `true` | dimmed overlay |
| `closable` | boolean | `true` | backdrop click + Escape close |
| `title` | string | `''` | optional header row with a close × |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen`
- `onclose` — (origin)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const drawer = ref();
html`<${Drawer} ref="${drawer}" />`;
// drawer.current.open(...)  ·  drawer.current.close(...)  ·  drawer.current.toggle(...)
```

- `open()`
- `close()`
- `toggle()`

## Styling

All classes follow the `lm-drawer-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/drawer/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Drawer)`.
