# `<Tooltip />` — @lemonadejs/tooltip

LemonadeJS tooltip block — contract-verified, framework-agnostic.

**✓ verified** — 13 contract checks · framework-agnostic · zero dependencies

## Overview

<Tooltip /> — a MUI-inspired floating label for any element.

Wraps its children and shows a small dark pill on hover/focus of the
wrapper; hides on leave/blur/Escape. Self-contained on purpose: a
tooltip is too small to compose <Modal /> — no chrome, no drag, no
focus management, just one branch and four coordinates.

  <${Tooltip} title="Save your work" position="top">
      <button>Save</button>
  </${Tooltip}>

Placement: the popper is position:fixed, its coordinates computed from
the wrapper's getBoundingClientRect at show time. When the requested
side would leave the viewport the popper FLIPS to the opposite side
(the modal's autoadjust idea, specialized to four sides) — the
effective side is published as data-position so the arrow follows.

## Install

```bash
npm install @lemonadejs/tooltip
```

```js
import Tooltip from '@lemonadejs/tooltip';
import '@lemonadejs/tooltip/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Tooltip} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Tooltip} />`                       // by value (no registration)
setComponents({ Tooltip });               // then <Tooltip /> by name anywhere
createWebComponent(Tooltip);              // <lm-tooltip> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | `''` | the tooltip text (live) |
| `position` | string | `''` | '' = top | bottom | left | right |
| `delay` | number | `100` | ms before showing |
| `arrow` | boolean | `true` | small arrow pointing at the wrapper |
| `disabled` | boolean | `false` | never shows |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen` — fires when the popper appears
- `onclose` — fires when a visible popper hides

## Styling

All classes follow the `lm-tooltip-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/tooltip/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Tooltip)`.
