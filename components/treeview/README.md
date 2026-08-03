# `<Treeview />` — @lemonadejs/treeview

LemonadeJS treeview block — contract-verified, framework-agnostic.

**✓ verified** — 10 contract checks · framework-agnostic · zero dependencies

## Overview

<TreeView /> — LemonadeJS v6 block.

A hierarchical list rendered by ONE recursive view function: nodeView
calls itself for node.children, every repeated <li> is keyed by the
node id, and the whole tree hangs off a single live expression reading
the data state. Mutate the tree in place + data.touch() (or assign a
new array) and the keyed diff moves/keeps existing DOM instead of
rebuilding it — including NESTED sibling lists, which the engine
compares structurally.

Collapse keeps the child DOM ALIVE: visibility is the aria-expanded
attribute + CSS (display: none on the group), never an unmount. Same
choice as <Tabs/> panels. Rationale: re-expanding is instant, child DOM
identity (and anything the host stuffed into it) survives toggles, the
accessibility attribute IS the rendering switch (one source of truth),
and toggling never re-runs the keyed diff. For huge lazy trees an
unmounting branch would be the alternative; for a block-sized tree
keep-alive is the idiomatic v6 answer.

Contract:
  data        TreeNode[]: { id, label, icon?, open?, children? }
  bind        two-way selected node id (bind="${state}")
  draggable   opt-in drag-and-drop reordering (default false)
  onchange    (id, node) — fires on user/api selection (parent writes
              to the bound state never echo back)
  ontoggle    (id, open) — fires on expand/collapse (user or api)
  onmove      (id, parentId, index) — after a drag drops a node into a
              new position (parentId is null at the root)
  api         { open(id), close(id), select(id), toggle(id) }

Drag-and-drop (draggable only): a pointer gesture (3px threshold,
Escape cancels, a drag never fires the click selection) with ZERO
LAYOUT SHIFT — a dense list must not reflow under the cursor. The
origin row stays in the flow, dimmed; a small chip with the node's
label rides the cursor; the landing slot is an absolutely positioned
insertion line (before/after) or a ring on the container row
(inside). Hovering a CONTAINER row (a node with a children
array — children: [] is an empty folder) splits it in thirds: top →
drop BEFORE (sibling), bottom → drop AFTER (sibling), middle → drop
INSIDE (becomes a child, opening the target). A LEAF row (no children
key) splits in halves, before/after only — a leaf never becomes a
parent via drop. The tree array is mutated in place + data.touch(),
so the keyed diff MOVES existing DOM instead of rebuilding it. A node
can never drop onto itself or into its own subtree.

Keyboard (APG tree pattern, single select):
  ArrowRight  opens a closed parent; on an open parent moves to the
              first child
  ArrowLeft   closes an open parent; otherwise moves to the parent
  ArrowUp/Down move focus across VISIBLE nodes
  Enter       selects the focused node

## Install

```bash
npm install @lemonadejs/treeview
```

```js
import Treeview from '@lemonadejs/treeview';
import '@lemonadejs/treeview/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Treeview} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Treeview} />`                       // by value (no registration)
setComponents({ Treeview });               // then <Treeview /> by name anywhere
createWebComponent(Treeview);              // <lm-treeview> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | any | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way selected node id — 'any': ids are string | number |
| `data` | array | — | TreeNode[] — the tree |
| `draggable` | boolean | `false` | opt-in drag-and-drop reordering |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (id, node) on selection
- `ontoggle` — (id, open) on expand/collapse
- `onmove` — (id, parentId, index) after a drag drop

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const treeview = ref();
html`<${Treeview} ref="${treeview}" />`;
// treeview.current.open(...)  ·  treeview.current.close(...)  ·  treeview.current.select(...)  ·  treeview.current.toggle(...)
```

- `open()`
- `close()`
- `select()`
- `toggle()`

## Styling

All classes follow the `lm-treeview-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/treeview/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Treeview)`.
