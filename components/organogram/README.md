# `<Organogram />` — @lemonadejs/organogram

LemonadeJS organogram block — an org chart / hierarchy diagram from a flat adjacency list, with Google-Maps pan & zoom, quick-search fly-to and collapsible branches.

**✓ verified** — 43 contract checks · framework-agnostic · zero dependencies

## Overview

<Organogram /> — LemonadeJS v6 block.

An org chart / hierarchy diagram built from a FLAT adjacency list:

  const people = [
      { id: 1, name: 'Jorge',   role: 'CEO',           parent: 0, status: '#90EE90', img: '/ceo.png' },
      { id: 2, name: 'Antonio', role: 'Vice president', parent: 1, status: '#90EE90', img: '/u.jpg' },
      ...
  ];
  <${Organogram} data="${people}" bind="${selected}" />

`parent` points at another row's `id`; a `parent` of 0 / null / unknown
is a root (a forest of several roots is supported). Everything else —
the tree, the tidy layout, the elbow connectors, the bounds — is one
reactive `model` derived from the props. Mutate the data in place +
data.touch() (or assign a new array) and only the layout recomputes;
pan/zoom live in their OWN state so dragging never rebuilds the tree.

THE INTERACTION, AND WHY IT IS NOT A LIBRARY OF ITS OWN:
  - Pan/zoom is Google-Maps style on ONE transformed `world` layer:
    translate()+scale() on a single element. Dragging the background
    pans; the wheel zooms ANCHORED at the cursor (the point under the
    pointer stays put). There is no per-frame relayout — the browser
    composites the transform; we never recompute node positions while
    panning.
  - Nodes are real HTML cards (avatar, name, role, status) positioned
    by left/top in world coordinates, so a CSS transition animates the
    re-layout when a branch collapses — again, no JS tween loop.
  - Connectors are one <svg> in the same world layer; orthogonal elbow
    paths are plain strings rebuilt only when the layout changes.

Quick-search centers the viewport on any node (expanding its ancestors
first if it was collapsed away) — the "fly to" of a maps UI.

## Install

```bash
npm install @lemonadejs/organogram
```

```js
import Organogram from '@lemonadejs/organogram';
import '@lemonadejs/organogram/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Organogram} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Organogram} />`                       // by value (no registration)
setComponents({ Organogram });               // then <Organogram /> by name anywhere
createWebComponent(Organogram);              // <lm-organogram> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | any | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way selected node id ('any': string | number) |
| `data` | array | — | OrgItem[] — the flat adjacency list |
| `orientation` | string | `''` | '' top-down (default) | 'horizontal' left-right |
| `nodewidth` | number | `180` | card width in px |
| `nodeheight` | number | `70` | card height in px |
| `hspacing` | number | `24` | gap between siblings (px) |
| `vspacing` | number | `50` | gap between levels (px) |
| `compact` | boolean | `false` | stack a node's children vertically when they are all leaves |
| `height` | number | `480` | viewport height (px); width is always fluid |
| `controls` | boolean | `true` | show the zoom / fit control cluster |
| `search` | boolean | `true` | show the quick-search box |
| `collapsible` | boolean | `true` | allow collapsing a branch from its card |
| `avatars` | boolean | `true` | render the avatar images |
| `legend` | boolean | `false` | show a status legend (needs `statuslabels`) |
| `statuslabels` | object | — | { '#90EE90': 'Active', '#D3D3D3': 'Inactive' } |
| `minzoom` | number | `0.2` | lower zoom bound |
| `maxzoom` | number | `2.5` | upper zoom bound |
| `zoom` | number | `0` | initial zoom (0 = auto-fit on mount) |
| `fit` | boolean | `true` | auto-fit the whole chart into view on mount |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (id, item) on selection (bindable)
- `onnodeclick` — (id, item) on any card click
- `oncollapse` — (id, collapsed) on expand/collapse
- `onzoom` — (scale) after any zoom change

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const organogram = ref();
html`<${Organogram} ref="${organogram}" />`;
// organogram.current.select(...)  ·  organogram.current.center(...)  ·  organogram.current.fit(...)  ·  organogram.current.reset(...)  ·  organogram.current.zoomIn(...)  ·  organogram.current.zoomOut(...)  ·  organogram.current.setZoom(...)  ·  organogram.current.getZoom(...)  ·  organogram.current.expand(...)  ·  organogram.current.collapse(...)  ·  organogram.current.toggle(...)  ·  organogram.current.expandAll(...)  ·  organogram.current.collapseAll(...)
```

- `select()`
- `center()`
- `fit()` — auto-fit the whole chart into view on mount
- `reset()`
- `zoomIn()`
- `zoomOut()`
- `setZoom()`
- `getZoom()`
- `expand()`
- `collapse()`
- `toggle()`
- `expandAll()`
- `collapseAll()`

## Styling

All classes follow the `lm-organogram-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/organogram/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Organogram)`.
