# `<List />` — @lemonadejs/list

LemonadeJS list block — search, pagination, remote mode and MUI-style items, contract-verified, framework-agnostic.

**✓ verified** — 26 contract checks · framework-agnostic · zero dependencies

## Overview

<List /> — full behavioral parity with the v5 plugin (@lemonadejs/list).

The v5 model, ported faithfully:
  - data: an array of records rendered one element per item; the item
    template comes from the caller (v5: children/template string →
    v6: the render prop, which can return an html`` view — any block
    can live inside an item)
  - built-in search across EVERY property of every record (v5: the
    bound input over Pagination.find); onbeforesearch fires before
    the filter, onsearch after it; searching resets to page zero
  - pagination: N items per page, numbered pager, onchangepage(page)
  - remote mode (total > 0): the component never filters or slices —
    data IS the current page, total drives the pager, and the events
    (onsearch / onchangepage) are the caller's cue to fetch; data
    assignments keep the page (local assignments reset it, as v5)
  - message: the empty state (a real .lm-list-message element — v5
    used :empty::before, which cannot see v6's slot markers)
  - data BY REFERENCE: mutate records + touch() re-renders

v5 → v6 mapping: children template → render(item, index); self.input
→ api.setSearch(query); self.setPage → api.setPage(page); the «/»
ten-page strip → the house prev/next + ellipsis pager (shared with
<Datagrid />); page resets stay silent (v5 dispatched onchangepage
even on load); the search box is opt-in (search), as in <Datagrid />.

Plus the richer list affordances, where they cost nothing:
  - a default item renderer over { title, secondary, icon, avatar }:
    avatar/icon slot + primary/secondary text (primitive items render
    as plain text rows)
  - dense and divider variants
  - onitemclick(item, index, event) makes rows interactive (hover +
    cursor through data-clickable; keyboard via an inner role=button
    wrapper — tabindex=0, Enter/Space activate)
  - virtual scrolling (height + rowheight, no pagination): the
    datagrid window pattern — 100k-item feeds keep ~a viewport of
    DOM alive

## Install

```bash
npm install @lemonadejs/list
```

```js
import List from '@lemonadejs/list';
import '@lemonadejs/list/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${List} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${List} />`                       // by value (no registration)
setComponents({ List });               // then <List /> by name anywhere
createWebComponent(List);              // <lm-list> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | records BY REFERENCE (mutate + touch()) |
| `render` | function | — | (item, index) => string | html`` view; default = built-in item |
| `search` | boolean | `false` | built-in search box |
| `pagination` | number | `0` | items per page; 0 = no pager |
| `total` | number | `0` | > 0 = remote mode: data is the current page, total drives the pager |
| `message` | string | `"No records found"` | empty state text |
| `dense` | boolean | `false` | tighter rows (dense variant) |
| `divider` | boolean | `false` | hairline between rows |
| `height` | number | `0` | px viewport; with no pagination enables virtual scroll |
| `rowheight` | number | `40` | fixed row height (virtual mode) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onbeforesearch` — (query) before the local filter — the remote hook
- `onsearch` — (query) after the filter
- `onchangepage` — (page) on user/api page changes
- `onitemclick` — (item, index, event)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const list = ref();
html`<${List} ref="${list}" />`;
// list.current.setPage(...)  ·  list.current.getPage(...)  ·  list.current.setSearch(...)  ·  list.current.refresh(...)
```

- `setPage()`
- `getPage()`
- `setSearch()`
- `refresh()`

## Styling

All classes follow the `lm-list-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/list/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(List)`.
