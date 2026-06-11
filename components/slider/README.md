# `<Slider />` — @lemonadejs/slider

LemonadeJS slider block — contract-verified, framework-agnostic.

**✓ verified** — 20 contract checks · framework-agnostic · zero dependencies

## Overview

<Slider /> — LemonadeJS v6 block (MUI-inspired, new in v6: no v5 source)

A horizontal slider on the Studio contract model. The bound state is the
CURRENT number (`bind`); the geometry is fully deterministic from
value/min/max — the filled track is a width% inline style and the thumb
a left% inline style, so position is testable without layout. The
pointer-position → value mapping is the only layout-dependent piece
(getBoundingClientRect of the track, captured once per gesture).

Commit model (v5-style):
  oninput   fires on every value CHANGE while interacting — drag move,
            track-click jump, keyboard step (no echo on repeats)
  onchange  fires ONCE on release with the final value (and once per
            keyboard commit) — only when it differs from gesture start

External writes through the bound state are SILENT (no onchange, no
oninput) and reposition the thumb — the Switch convention.

Keyboard (on the thumb, role="slider"): Arrow ±step, Home → min,
End → max, PageUp/PageDown ±10·step.

marks: Boolean — auto tick marks at every step when feasible (at most
100 marks; denser ranges render none). Labeled mark ARRAYS (MUI) are
not adopted: contract prop types are scalar by convention.

Other MUI props deliberately not adopted: orientation (horizontal
only), range value arrays (bind is a single Number by contract),
valueLabelDisplay/valueLabelFormat (showvalue Boolean instead), scale,
track="inverted", size, slot/component customization,
onChangeCommitted (folded into onchange).

## Install

```bash
npm install @lemonadejs/slider
```

```js
import Slider from '@lemonadejs/slider';
import '@lemonadejs/slider/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Slider} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Slider} />`                       // by value (no registration)
setComponents({ Slider });               // then <Slider /> by name anywhere
createWebComponent(Slider);              // <lm-slider> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way CURRENT value (unbound: starts at min) |
| `min` | number | `0` | lower bound |
| `max` | number | `100` | upper bound |
| `step` | number | `1` | snapping increment (0/invalid → 1) |
| `marks` | boolean | `false` | tick marks at every step (when feasible) |
| `label` | string | `''` | text label above the track |
| `disabled` | boolean | `false` | blocks interaction |
| `showvalue` | boolean | `false` | value bubble above the thumb while dragging/focused |
| `color` | string | `''` | green | orange | red | purple |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires on RELEASE with the final value (v5-style commit)
- `oninput` — fires on every value change while interacting

## Styling

All classes follow the `lm-slider-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/slider/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Slider)`.
