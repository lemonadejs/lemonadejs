# `<Datagrid />` — @lemonadejs/datagrid

LemonadeJS datagrid block — virtualized big-data grid, contract-verified, framework-agnostic.

**✓ verified** — 23 contract checks · framework-agnostic · zero dependencies

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
    selection
  - pagination mode (pagination > 0) instead of virtual scroll
  - column customization: drag the header edge to resize (widths turn
    px, oncolumnresize on release), column.hidden + api.setColumn for
    runtime changes, headerrender for custom header content,
    column.class on body cells

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

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (row, columnName, value, oldValue)
- `onselect` — (selectedRows)
- `onsort` — (columnName, direction | null)
- `onrowclick` — (row, event)
- `oncolumnresize` — (columnName, widthPx) on handle release

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const datagrid = ref();
html`<${Datagrid} ref="${datagrid}" />`;
// datagrid.current.getSelected(...)  ·  datagrid.current.setSearch(...)  ·  datagrid.current.sort(...)  ·  datagrid.current.page(...)  ·  datagrid.current.refresh(...)  ·  datagrid.current.setColumn(...)
```

- `getSelected()`
- `setSearch()`
- `sort()`
- `page()`
- `refresh()`
- `setColumn()`

## Styling

All classes follow the `lm-datagrid-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/datagrid/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Datagrid)`.
