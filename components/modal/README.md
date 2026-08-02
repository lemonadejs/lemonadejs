# `<Modal />` — @lemonadejs/modal

LemonadeJS modal block — contract-verified, framework-agnostic.

**✓ verified** — 53 contract checks · framework-agnostic · zero dependencies

## Overview

<Modal /> — the platform primitive. Floating panels, dropdown lists,
autocomplete, corner chats and the context menu are all built on these
behaviors, ported faithfully from v5:

  - resize from all 8 edges/corners (10px hit zone) with live cursor
    feedback; Shift preserves the aspect ratio
  - drag by the top 40px zone with a move cursor — improved over v5:
    the grab zone is CLAMPED to the viewport, a modal can never be
    dragged irrecoverably off-screen
  - minimize DOCKS to a taskbar row at the bottom of the screen
    (205px slots, wrapping), restore returns to the remembered spot
  - explicit coordinates on open (centered unless positioned), margin
    based auto-adjust, responsive fullscreen on small screens; flip
    mode for anchored panels (dropdowns) inverts above the anchor at
    the bottom edge instead of covering it, api.adjust() re-anchors
    after content changes the panel size while open
  - Escape/focus handling scoped to the ELEMENT (multiple modals never
    fight over a document listener), v5 close origins preserved

v5 → v6 mapping: closed → bind (inverted: bind is the OPEN state);
auto-close → autoclose; auto-adjust → autoadjust; content → children.
position: 'absolute' is CSS-anchored exactly like v5 (the host's
positioned ancestor places it — dropdown panels); 'fixed' takes
explicit viewport coordinates (context menus at the cursor).
onclose(origin): 'button' | 'backdrop' | 'escape' | 'focusout' | 'api'.
onmove(top, left) and onresize(width, height) fire on release.

## Install

```bash
npm install @lemonadejs/modal
```

```js
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Modal} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Modal} />`                       // by value (no registration)
setComponents({ Modal });               // then <Modal /> by name anywhere
createWebComponent(Modal);              // <lm-modal> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. open state (v5: closed, inverted) |
| `title` | string | `''` |  |
| `width` | number | `0` |  |
| `height` | number | `0` |  |
| `top` | number | `0` |  |
| `left` | number | `0` |  |
| `position` | string | `''` | center | left | right | bottom | fixed (explicit viewport |
| `backdrop` | boolean | `false` |  |
| `closable` | boolean | `false` |  |
| `draggable` | boolean | `false` |  |
| `resizable` | boolean | `false` |  |
| `minimizable` | boolean | `false` |  |
| `minimized` | boolean | `false` |  |
| `fullscreen` | boolean | `false` | cover the whole viewport |
| `header` | boolean | `true` | false: headerless floating panel (menus, chips) |
| `role` | string | `''` | ARIA role: '' = auto (backdrop → dialog, else none) |
| `autoclose` | boolean | `false` | v5: auto-close |
| `autoadjust` | boolean | `false` | v5: auto-adjust |
| `flip` | number | `0` | anchored panels: at the bottom edge, flip ABOVE the natural top, |
| `focus` | boolean | `true` |  |
| `overflow` | boolean | `false` |  |
| `responsive` | boolean | `true` |  |
| `layers` | boolean | `false` |  |
| `url` | string | `''` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen`
- `onclose`
- `onmove`
- `onresize`

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const modal = ref();
html`<${Modal} ref="${modal}" />`;
// modal.current.open(...)  ·  modal.current.close(...)  ·  modal.current.toggle(...)  ·  modal.current.front(...)  ·  modal.current.back(...)  ·  modal.current.adjust(...)
```

- `open()`
- `close()`
- `toggle()`
- `front()`
- `back()`
- `adjust()`

## Styling

All classes follow the `lm-modal-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/modal/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Modal)`.
