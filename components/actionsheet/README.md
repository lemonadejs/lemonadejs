# `<Actionsheet />` — @lemonadejs/actionsheet

LemonadeJS actionsheet block — contract-verified, framework-agnostic.

**✓ verified** — 13 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Actionsheet /> — iOS-style action sheet on the Modal primitive.

Faithful port of @lemonadejs/actionsheet (v5): a bottom sheet over a
dimmed backdrop, listing GROUPS of actions — each group a white rounded
card, each action a full-width button; action: 'cancel' renders red.
Built ON Modal (headerless, position bottom, backdrop) the way every
v5 floating surface was built on @lemonadejs/modal.

v5 → v6 mapping: visible → bind (the open state, two-way); show()/hide()
→ api.open()/close()/toggle() + isOpened(); actions keeps its name and
its shape ([{ options: [{ title, action, className, onclick }] }]) and
is LIVE — swap the array, the sheet re-renders (v5 show(options) merged
properties; in v6 you write the state instead). Per-option onclick still
receives the option object. The sheet does NOT auto-close on a pick —
exactly like v5, closing is the consumer's call.

Added: closable (backdrop click / Escape close — v5 shipped no close
affordance at all); title/message header card (v5 shipped the CSS for
.jactionsheet-title/-message but never rendered them — resurrected).
Dropped: the v5 slide-bottom-out exit animation (it gated closing on
animationend; v6 closes immediately, the slide-IN stays, pure CSS).
onclose(origin): 'backdrop' | 'escape' | 'api'.

## Install

```bash
npm install @lemonadejs/actionsheet
```

```js
import Actionsheet from '@lemonadejs/actionsheet';
import '@lemonadejs/actionsheet/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Actionsheet} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Actionsheet} />`                       // by value (no registration)
setComponents({ Actionsheet });               // then <Actionsheet /> by name anywhere
createWebComponent(Actionsheet);              // <lm-actionsheet> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. open state (v5: visible) |
| `actions` | array | — | ActionsheetGroup[] — live (v5: actions) |
| `title` | string | `''` | optional header card title (v5 CSS, resurrected) |
| `message` | string | `''` | optional header card message (v5 CSS, resurrected) |
| `closable` | boolean | `false` | backdrop click / Escape close the sheet |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen` — sheet opened
- `onclose` — sheet closed (origin)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const actionsheet = ref();
html`<${Actionsheet} ref="${actionsheet}" />`;
// actionsheet.current.open(...)  ·  actionsheet.current.close(...)  ·  actionsheet.current.toggle(...)  ·  actionsheet.current.isOpened(...)
```

- `open()`
- `close()`
- `toggle()`
- `isOpened()`

## Styling

All classes follow the `lm-actionsheet-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/actionsheet/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Actionsheet)`.
