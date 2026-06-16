# `<Card />` — @lemonadejs/card

LemonadeJS card block — contract-verified, framework-agnostic.

**✓ verified** — 20 contract checks · framework-agnostic · zero dependencies

## Overview

<Card /> — a content surface block (LemonadeJS v6)

The classic card sections (header / media / content / actions)
collapsed into one contract-driven block. Every section is a branch:
it only exists in the DOM when its props are set — the media image
when `image` is set, the header when any of avatar/title/subtitle is
set, the action row when `actions` has entries. Children always
render in the content area, after the `content` text.

Two variants through data-variant: '' (elevated — subtle shadow, the
default) and 'outlined' (1px border, no shadow). `clickable` makes
the whole card an interactive surface (hover lift + onclick); action
buttons stop propagation so their clicks never double-fire the card.

## Install

```bash
npm install @lemonadejs/card
```

```js
import Card from '@lemonadejs/card';
import '@lemonadejs/card/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Card} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Card} />`                       // by value (no registration)
setComponents({ Card });               // then <Card /> by name anywhere
createWebComponent(Card);              // <lm-card> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | `''` | header title line |
| `subtitle` | string | `''` | muted line under the title |
| `image` | string | `''` | media url, top image (object-fit: cover) |
| `imageheight` | number | `180` | media height in px |
| `avatar` | string | `''` | small round img beside the header titles |
| `content` | string | `''` | body text (children render after it) |
| `actions` | array | — | CardAction[] — footer buttons, right-aligned |
| `variant` | string | `''` | '' = elevated | outlined |
| `clickable` | boolean | `false` | whole card hover lift + onclick |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onclick` — fires when a clickable card is clicked

## Styling

All classes follow the `lm-card-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/card/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Card)`.
