# `<Color />` — @lemonadejs/color

LemonadeJS color block — contract-verified, framework-agnostic.

**✓ verified** — 16 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Color /> — color picker on the Modal primitive (v5 architecture).

Faithful port of @lemonadejs/color: a Grid tab (the material palette
matrix, custom palettes supported, the picked cell marked with a
checkmark) and a Spectrum tab (canvas gradient, drag to sample pixels),
Reset/Done bar, popup built ON Modal exactly as v5 built on
@lemonadejs/modal (headerless, absolute, auto-adjust, no focus steal),
optional text input toggle with the full v5 keyboard system
(ArrowUp/Down opens, Enter commits, Escape closes) and focusout close.

v5 → v6 mapping: value → bind; closeOnChange → closeonchange;
input: 'auto' → type="input" (the block renders its own input — adopting
an external element was dropped, incompatible with by-value blocks);
type: 'inline' keeps its meaning (panel without a popup, selection
commits immediately since the Done bar is a popup affordance);
@lemonadejs/tabs → internal lm-color-tabs strip (no Tabs block in v6).
onclose(origin): 'select' | 'button' | 'escape' | 'focusout' | 'api'.

## Install

```bash
npm install @lemonadejs/color
```

```js
import Color from '@lemonadejs/color';
import '@lemonadejs/color/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Color} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Color} />`                       // by value (no registration)
setComponents({ Color });               // then <Color /> by name anywhere
createWebComponent(Color);              // <lm-color> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | string | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. the picked color (v5: value) |
| `name` | string | `''` | form field name — root reflects el.value (form-associated) |
| `palette` | array | — | string[][] matrix — a flat string[] becomes one row |
| `type` | string | `''` | '' (popup via api) | 'input' | 'inline' |
| `placeholder` | string | `''` | input placeholder (v5) |
| `closeonchange` | boolean | `false` | v5: closeOnChange — picking commits + closes immediately |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen` — popup opened
- `onclose` — popup closed (origin)
- `onchange` — the picked color changed (user-initiated)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const color = ref();
html`<${Color} ref="${color}" />`;
// color.current.open(...)  ·  color.current.close(...)  ·  color.current.isClosed(...)  ·  color.current.reset(...)  ·  color.current.setValue(...)  ·  color.current.getValue(...)
```

- `open()`
- `close()`
- `isClosed()`
- `reset()`
- `setValue()`
- `getValue()`

## Styling

All classes follow the `lm-color-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/color/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Color)`.
