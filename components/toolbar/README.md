# `<Toolbar />` — @lemonadejs/toolbar

LemonadeJS toolbar block — contract-verified, framework-agnostic.

**✓ verified** — 10 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/contextmenu`

## Overview

<Toolbar /> — a flat action bar, ported faithfully from the v5 plugin.

Three positions (v5 data-position): the default is a fixed bottom app
bar (mobile pattern), 'static' is an inline editor bar, 'left' is a
vertical rail. Three item kinds:

  - regular items: <a> with optional image / material icon / title,
    route (href), selected and visible flags
  - dividers (v5 type 'divisor' — both spellings accepted)
  - 'select' pickers: a header that opens a dropdown right under
    itself, composed ON the Contextmenu block exactly like v5
    (<lm-contextmenu :ref="self.menu">); options are Contextmenu
    items, plain strings normalize to { title }

v5 → v6 mapping: data/HTML-children extraction → options array;
item.onclick (declared in the v5 data model but never wired in the
dist template) now fires; the dead v5 onchange/onload params became
real events — onchange fires when a picker option is chosen,
onitemclick (not "onclick": the name would collide with the native
click event on web-component hosts) fires on any item activation.
v5's data-gap CSS hook (left rail spacer) gets its missing template
plumbing via item.gap. One Contextmenu is shared by all pickers
(v5 mounted one per picker), so hovering another picker moves the
open dropdown instead of stacking menus.

## Install

```bash
npm install @lemonadejs/toolbar
```

```js
import Toolbar from '@lemonadejs/toolbar';
import '@lemonadejs/toolbar/style.css';
import '@lemonadejs/contextmenu/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Toolbar} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Toolbar} />`                       // by value (no registration)
setComponents({ Toolbar });               // then <Toolbar /> by name anywhere
createWebComponent(Toolbar);              // <lm-toolbar> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | array | — | ToolbarItem[] |
| `position` | string | `''` | '' = fixed bottom bar (v5 default) | 'static' | 'left' |
| `visible` | boolean | `true` | false hides the whole bar |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onitemclick` — (e, item, index) on any item activation
- `onchange` — (e, item, option) when a picker option is chosen

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const toolbar = ref();
html`<${Toolbar} ref="${toolbar}" />`;
// toolbar.current.open(...)  ·  toolbar.current.close(...)
```

- `open()`
- `close()`

## Styling

All classes follow the `lm-toolbar-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/toolbar/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Toolbar)`.
