# `<Wheel />` — @lemonadejs/wheel

LemonadeJS wheel block — contract-verified, framework-agnostic.

**✓ verified** — 16 contract checks · framework-agnostic · zero dependencies

## Overview

<Wheel /> — iOS-style scroll wheel picker, ported from the v5 plugin

The v5 model, kept: a column of options behind two frosted masks; the
row in the middle band is the selection. A mouse-wheel NOTCH steps one
row; trackpad deltas glide freely and settle on the nearest row; press
and drag scrolls with the pointer (snap suspended while dragging, as
v5 toggled lm-wheel-grid) and snaps to the closest row on release.

v6 rebuild: the position is a transform driven from props (rowheight ×
visible), not native scrollTop — deterministic everywhere (jsdom has
no layout) and the snap animation is one CSS transition. v5 leaked a
document mousemove/mouseup pair per instance forever and shared one
module-global drag flag; v6 arms document listeners per gesture with
ONE persistent cleanup (the Modal track pattern), released on pointer
up and on unmount.

v5 → v6 mapping: value (the selected OPTION object, two-way) → bind
(the selected INDEX — survives attribute coercion and primitive
options; api.getValue() still returns the entry itself); onupdate →
onchange; options stays options, now also accepting plain strings and
numbers (v5 required { title } objects); the fixed 40px/200px
geometry becomes rowheight and visible. New: touch dragging, tap to
select a row, keyboard arrows/Home/End, disabled.

## Install

```bash
npm install @lemonadejs/wheel
```

```js
import Wheel from '@lemonadejs/wheel';
import '@lemonadejs/wheel/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Wheel} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Wheel} />`                       // by value (no registration)
setComponents({ Wheel });               // then <Wheel /> by name anywhere
createWebComponent(Wheel);              // <lm-wheel> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way selected index (v5: value held the option) |
| `selected` | number | `0` | initial index when unbound |
| `options` | array | — | entries: strings/numbers or { title } objects (v5) |
| `rowheight` | number | `40` | px per row (v5: fixed 40) |
| `visible` | number | `5` | rows in the viewport (v5: fixed 200px / 40) |
| `disabled` | boolean | `false` | blocks interaction (new) |
| `aria-label` | string | `''` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (index) on user/component-initiated changes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const wheel = ref();
html`<${Wheel} ref="${wheel}" />`;
// wheel.current.getIndex(...)  ·  wheel.current.setIndex(...)  ·  wheel.current.getValue(...)
```

- `getIndex()`
- `setIndex()`
- `getValue()`

## Styling

All classes follow the `lm-wheel-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/wheel/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Wheel)`.
