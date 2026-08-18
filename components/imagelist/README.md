# `<Imagelist />` — @lemonadejs/imagelist

LemonadeJS imagelist block — contract-verified, framework-agnostic.

**✓ verified** — 14 contract checks · framework-agnostic · zero dependencies

## Overview

<ImageList /> — a responsive image grid (new in v6, no v5 source).

Three layouts, all driven by deterministic inline styles (jsdom-testable):
  - standard (default): CSS grid — grid-template-columns repeat(columns,
    1fr), gap, and grid-auto-rows when rowheight > 0 (rowheight 0 = the
    rows size themselves to their content)
  - masonry: CSS multi-column layout (columns: N + column-gap; items
    carry break-inside: avoid and the vertical gap) — ragged bottoms,
    natural image heights
  - quilted: the standard grid, but items may span cells through
    item.cols / item.rows (grid-column / grid-row: span X)

Item bars (bar): a translucent overlay at the bottom of each image with
the item title + optional subtitle.

Images load lazily (loading="lazy"); the alt text is item.alt, falling
back to item.title, then ''. data is held BY REFERENCE: mutate the
array or its records and call data.touch() to re-render — or assign
a new array. onitemclick(item, index, event) makes tiles interactive
(cursor through data-clickable, plus role="button", tabindex and
Enter/Space activation).

## Install

```bash
npm install @lemonadejs/imagelist
```

```js
import Imagelist from '@lemonadejs/imagelist';
import '@lemonadejs/imagelist/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Imagelist} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Imagelist} />`                       // by value (no registration)
setComponents({ Imagelist });               // then <Imagelist /> by name anywhere
createWebComponent(Imagelist);              // <lm-imagelist> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | ImageListItem[] BY REFERENCE (mutate + touch()) |
| `columns` | number | `3` | grid columns (masonry: CSS column count) |
| `gap` | number | `8` | px between tiles |
| `rowheight` | number | `164` | px per grid row; 0 = natural heights |
| `variant` | string | `''` | '' standard | 'masonry' | 'quilted' |
| `bar` | boolean | `false` | overlay title bar on each image |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onitemclick` — (item, index, event)

## Styling

All classes follow the `lm-imagelist-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/imagelist/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Imagelist)`.
