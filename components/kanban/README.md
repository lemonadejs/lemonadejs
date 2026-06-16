# `<Kanban />` — @lemonadejs/kanban

LemonadeJS kanban block — drag-and-drop board whose card DOM identity survives cross-column moves (one flat keyed list, CSS grid placement); contract-verified, framework-agnostic.

**✓ verified** — 7 contract checks · framework-agnostic · zero dependencies

## Overview

<Kanban /> — a drag-and-drop kanban board.

LAYOUT: each column is its own vertical flex stack, so cards flow
naturally and uneven card heights never create gaps. (An earlier design
placed every card on ONE shared CSS grid to preserve a card's DOM node
across a cross-column move; that shared rows between columns, so a tall
card in one column left a gap in another. Cards here are plain, stateless
elements — losing the node on a cross-column move costs nothing — so the
simpler, gapless per-column layout wins.) Cards are keyed by id WITHIN
their column: a reorder inside a column is a keyed move (DOM identity
kept); a cross-column move re-parents the card.

  - data: [{ id, title, cards: [{ id, title, description?, color?,
    tags? }] }] BY REFERENCE — the board mutates IN PLACE and calls
    touch(); your objects stay yours
  - drag a card with the mouse: a drop indicator marks the insertion
    slot, Escape cancels mid-drag, events fire ONLY on commit
  - oncardmove(cardId, fromColumnId, toColumnId, index) on any move
    (drag or api.moveCard); onchange(data) on any data change;
    oncardclick(card) on click (never after a drag)
  - api: addCard(columnId, card), removeCard(cardId),
    moveCard(cardId, columnId, index)

Styling: lm-kanban-* classes, themable via CSS custom properties
(--lm-kanban-column-width, --lm-kanban-header-height, --lm-kanban-*).

## Install

```bash
npm install @lemonadejs/kanban
```

```js
import Kanban from '@lemonadejs/kanban';
import '@lemonadejs/kanban/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Kanban} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Kanban} />`                       // by value (no registration)
setComponents({ Kanban });               // then <Kanban /> by name anywhere
createWebComponent(Kanban);              // <lm-kanban> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | KanbanColumn[] BY REFERENCE (mutate + touch()) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `oncardmove` — (cardId, fromColumnId, toColumnId, index)
- `onchange` — (data) — after any board-initiated change
- `oncardclick` — (card) — clicks, never drag commits

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const kanban = ref();
html`<${Kanban} ref="${kanban}" />`;
// kanban.current.addCard(...)  ·  kanban.current.removeCard(...)  ·  kanban.current.moveCard(...)
```

- `addCard()`
- `removeCard()`
- `moveCard()`

## Styling

All classes follow the `lm-kanban-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/kanban/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Kanban)`.
