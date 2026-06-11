# `<Signature />` — @lemonadejs/signature

LemonadeJS signature block — contract-verified, framework-agnostic.

**✓ verified** — 21 contract checks · framework-agnostic · zero dependencies

## Overview

<Signature /> — canvas signature pad, ported from the v5 plugin

Full behavioral parity with v5: pointer drawing (mouse + touch), the v5
value format (a flat list of [x, y] points with '1' separators between
strokes), line thickness, instructions text, disabled, and the full
replay algorithm (commit): clear + redraw the whole value as one path —
including the v5 quirk where a click stroke becomes a round dot.

v5 → v6 mapping: value (two-way) → bind; value (initial) stays value;
line/width/height/instructions/disabled unchanged; onchange/onload
unchanged (onchange now receives the value, not the instance);
getValue/setValue/getImage move to the api surface (props.ref), plus
clear() = setValue([]). New: color (v5 hardcoded #000) and name (renders
a hidden input so the pad participates in forms — v5 only patched .val()
onto the canvas).

jsdom has no canvas: a null 2d context downgrades the pad to a no-op.

## Install

```bash
npm install @lemonadejs/signature
```

```js
import Signature from '@lemonadejs/signature';
import '@lemonadejs/signature/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Signature} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Signature} />`                       // by value (no registration)
setComponents({ Signature });               // then <Signature /> by name anywhere
createWebComponent(Signature);              // <lm-signature> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | array | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way stroke data (v5: value) |
| `value` | array | — | initial strokes when unbound |
| `width` | number | `0` | canvas width (0: browser default) |
| `height` | number | `0` | canvas height (0: browser default) |
| `line` | number | `0` | stroke thickness, 3 when unset (v5) |
| `color` | string | `''` | stroke color, #000 when unset (v5 fixed) |
| `name` | string | `''` | form field name (hidden input, JSON value) |
| `instructions` | string | `''` | helper text under the canvas |
| `disabled` | boolean | `false` | blocks drawing |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires on stroke end, setValue and clear
- `onload` — fires once the canvas is ready (v5)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const signature = ref();
html`<${Signature} ref="${signature}" />`;
// signature.current.getValue(...)  ·  signature.current.setValue(...)  ·  signature.current.getImage(...)  ·  signature.current.clear(...)
```

- `getValue()`
- `setValue()`
- `getImage()`
- `clear()`

## Styling

All classes follow the `lm-signature-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/signature/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Signature)`.
