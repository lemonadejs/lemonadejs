# `<Transferlist />` — @lemonadejs/transferlist

LemonadeJS transfer list block — contract-verified, framework-agnostic.

**✓ verified** — 12 contract checks · framework-agnostic · zero dependencies

## Overview

<Transferlist /> — two side-by-side lists with a middle column of
controls that move checked items between them (MUI Transfer List
inspired, on the v6 contract model).

Left list: the items NOT chosen, in data order. Right list: the chosen
items, in chosen order. Each row carries a checkbox; the controls move
all/checked items right/left and disable when nothing applies. Checked
state is internal — one Set per side — and clears after every move.

bind="${state}" holds the CHOSEN side's values as an array. User moves
commit through set() (fires onchange with the new chosen array);
external writes stay silent. data is read BY REFERENCE: live data
changes keep the chosen values that still exist.

## Install

```bash
npm install @lemonadejs/transferlist
```

```js
import Transferlist from '@lemonadejs/transferlist';
import '@lemonadejs/transferlist/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Transferlist} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Transferlist} />`                       // by value (no registration)
setComponents({ Transferlist });               // then <Transferlist /> by name anywhere
createWebComponent(Transferlist);              // <lm-transferlist> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | array | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. the chosen values, as an array (two-way) |
| `data` | array | — | TransferItem[] — strings/numbers normalize |
| `titles` | array | `["Available","Chosen"]` |  |
| `search` | boolean | `false` | a filter box above each list |
| `height` | number | `280` | list viewport height (px, scrollable) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (chosen) on user moves; external writes silent

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const transferlist = ref();
html`<${Transferlist} ref="${transferlist}" />`;
// transferlist.current.getChosen(...)  ·  transferlist.current.moveAll(...)  ·  transferlist.current.reset(...)
```

- `getChosen()`
- `moveAll()`
- `reset()`

## Styling

All classes follow the `lm-transferlist-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/transferlist/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Transferlist)`.
