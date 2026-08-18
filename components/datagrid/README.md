# `<Datagrid />` — @lemonadejs/datagrid

LemonadeJS datagrid block — virtualized big-data grid, contract-verified, framework-agnostic.

**✓ verified** — 33 contract checks · framework-agnostic · zero dependencies

## Overview

<Datagrid /> — the lightweight, virtualized data grid. Built FOR the
v6 engine's mutable-state model: pass `data` by reference, mutate it
and touch() — the grid re-renders only its visible window. 100k rows
keep ~a viewport of DOM alive.

  - virtual scrolling (fixed rowheight), sticky header, one scroller
  - sorting (header click: asc → desc → off), numeric-aware
  - search across all columns (built-in box or api.setSearch)
  - selection: 'single' (row click) or 'multiple' (checkbox column
    with select-all)
  - inline editing (double-click or Enter; Escape cancels; commits
    mutate YOUR row objects and fire onchange)
  - keyboard: arrows move the active cell, Enter edits, Space toggles
    selection; ArrowUp past the first row reaches the header row, where
    Enter/Space toggles sort and Shift+ArrowLeft/Right resizes the column
  - pagination mode (pagination > 0) instead of virtual scroll
  - column customization: drag the header edge to resize (widths turn
    px, oncolumnresize on release), column.hidden + api.setColumn for
    runtime changes, headerrender for custom header content,
    column.class on body cells
  - remote data (v5 parity): `url` fetches the rows on mount when
    data is empty; with `remote` the SERVER owns search/sort/paging —
    every page change, search and sort re-fetches with
    ?pagination=&page=&orderBy=&asc=&term= and the response's
    { result, total } feeds the window and the pager (caller-owned
    totals), a bare array works too
  - zebra striping (`zebra`), themable via --lm-* tokens
  - `resizable` gates the header drag handles. v5 defaulted to OFF;
    v6 keeps its always-on behavior as the default (true) so existing
    v6 users are unaffected — pass resizable="false" for v5's default
  - api.setValue(x, y, value): x is the column index OR name, y the
    row index (v5 argument order). v5 fired onupdate; v6 funnels it
    into onchange with the (row, columnName, value, oldValue) shape
  - onchangepage(page) + onsearch(query, total): v5 passed the
    instance — v6 events are data-only

Not a spreadsheet: no formulas, no merged cells — that is jspreadsheet.

## Install

```bash
npm install @lemonadejs/datagrid
```

```js
import Datagrid from '@lemonadejs/datagrid';
import '@lemonadejs/datagrid/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Datagrid} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Datagrid} />`                       // by value (no registration)
setComponents({ Datagrid });               // then <Datagrid /> by name anywhere
createWebComponent(Datagrid);              // <lm-datagrid> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | row objects BY REFERENCE (mutate + touch()) |
| `columns` | array | — | Column[] |
| `height` | number | `360` | viewport height (virtual mode) |
| `rowheight` | number | `36` |  |
| `selectable` | string | `''` | '' | 'single' | 'multiple' |
| `editable` | boolean | `false` | grid default; column.editable overrides |
| `search` | boolean | `false` | built-in search box |
| `pagination` | number | `0` | rows per page; 0 = virtual scroll |
| `url` | string | `''` | fetch rows on mount when data is empty (v5: url) |
| `remote` | boolean | `false` | with url: server-side search/sort/pagination (v5: remote) |
| `zebra` | boolean | `false` | stripe every second row |
| `resizable` | boolean | `true` | header drag-resize handles (v5 default: false) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (row, columnName, value, oldValue)
- `onselect` — (selectedRows)
- `onsort` — (columnName, direction | null)
- `onrowclick` — (row, event)
- `oncolumnresize` — (columnName, widthPx) on handle release
- `onchangepage` — (page) — zero-based, after the page actually moves
- `onsearch` — (query, total) — total after the filter/fetch settles

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const datagrid = ref();
html`<${Datagrid} ref="${datagrid}" />`;
// datagrid.current.getSelected(...)  ·  datagrid.current.setSearch(...)  ·  datagrid.current.sort(...)  ·  datagrid.current.page(...)  ·  datagrid.current.refresh(...)  ·  datagrid.current.setColumn(...)  ·  datagrid.current.setValue(...)
```

- `getSelected()`
- `setSearch()`
- `sort()`
- `page()`
- `refresh()`
- `setColumn()`
- `setValue()`

## Styling

All classes follow the `lm-datagrid-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/datagrid/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Datagrid)`.
