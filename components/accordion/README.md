# `<Accordion />` — @lemonadejs/accordion

LemonadeJS accordion block — contract-verified, framework-agnostic.

**✓ verified** — 9 contract checks · framework-agnostic · zero dependencies

## Overview

<Accordion /> — expansion panels on the v6 contract model.

Panels come from a data array ({ title, content?, disabled? }):
  - content is trusted TEXT (v6 strings are always text, never HTML);
    rich panel bodies come from the render prop: (item, index) => html view
  - every panel body is created once and KEPT ALIVE across toggles —
    the collapse is a grid-template-rows (0fr->1fr) transition driven by
    data-open (CSS), never an unmount, so content state (inputs, nested
    components) survives open/close cycles
  - exclusive by default (a controlled accordion group): bind is the
    expanded INDEX, -1/null = all closed, opening one closes the other
  - multiple: bind becomes an ARRAY of open indices — each panel
    toggles independently

Headers are real <button>s: native Enter/Space toggling, native disabled
semantics; ArrowUp/ArrowDown walk focus between enabled headers. Each
body is a labelled ARIA region (header aria-controls ⇄ body
aria-labelledby); panels are keyed by item identity so kept-alive
bodies move with their item when the options array changes.

Bound state semantics (the v6 protocol): expanded.set() on user toggles
fires onchange(expanded, previous); external writes through the bound
state stay silent.

## Install

```bash
npm install @lemonadejs/accordion
```

```js
import Accordion from '@lemonadejs/accordion';
import '@lemonadejs/accordion/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Accordion} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Accordion} />`                       // by value (no registration)
setComponents({ Accordion });               // then <Accordion /> by name anywhere
createWebComponent(Accordion);              // <lm-accordion> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent.  |
| `options` | array | — |  |
| `render` | function | — |  |
| `multiple` | boolean | `false` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange`

## Styling

All classes follow the `lm-accordion-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/accordion/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Accordion)`.
