# `<Progress />` — @lemonadejs/progress

LemonadeJS progress block — contract-verified, framework-agnostic.

**✓ verified** — 15 contract checks · framework-agnostic · zero dependencies

## Overview

<Progress /> — LemonadeJS v6 block

One block, both progress shapes: linear (track + bar)
and circular (SVG stroke arc), selected by `type`. Determinate
when a percent is bound, indeterminate otherwise (or when forced):

  <${Progress} bind="${pct}" label />                 linear, determinate
  <${Progress} type="circular" bind="${pct}" />       circular, determinate
  <${Progress} />                                     linear, indeterminate
  <${Progress} type="circular" indeterminate />       spinner

bind vs indeterminate (by design):
  bind="${state}"  the live percent 0-100 (clamped); ABSENT → indeterminate
  indeterminate    forces the looping animation even with a value

Geometry is deterministic and testable: the linear bar carries an inline
width:%, the circular arc carries stroke-dasharray/stroke-dashoffset
computed from percent and the radius (size - thickness) / 2. The looping
animations are pure CSS keyframes driven by data-indeterminate.

## Install

```bash
npm install @lemonadejs/progress
```

```js
import Progress from '@lemonadejs/progress';
import '@lemonadejs/progress/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Progress} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Progress} />`                       // by value (no registration)
setComponents({ Progress });               // then <Progress /> by name anywhere
createWebComponent(Progress);              // <lm-progress> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way percent 0-100; absent → indeterminate |
| `type` | string | `''` | '' = linear | 'circular' (data-type variant) |
| `indeterminate` | boolean | `false` | force the looping animation even with a value |
| `size` | number | `0` | circular diameter in px (default 40 via CSS) |
| `thickness` | number | `0` | stroke/bar thickness in px (defaults: 4 linear, 3.6 circular) |
| `color` | string | `''` | green | orange | red | purple (default blue) |
| `label` | boolean | `false` | show the % text: beside linear, centered in circular |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires when the bound percent is set via set()

## Styling

All classes follow the `lm-progress-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/progress/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Progress)`.
