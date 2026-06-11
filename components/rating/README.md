# `<Rating />` — @lemonadejs/rating

LemonadeJS rating block — contract-verified, framework-agnostic.

**✓ verified** — 20 contract checks · framework-agnostic · zero dependencies

## Overview

<Rating /> — LemonadeJS v6 block

Full behavioral parity with the v5 rating plugin: a row of stars where
clicking star N sets the value to N, clicking the current value again
resets it to 0, hovering previews the would-be selection, `number`
controls the star count (shrinking it clamps the value, v5 behavior),
`tooltip` provides per-star titles (comma-separated), `name` and `size`
pass through as in v5. Plus MUI-inspired additions the v5 plugin lacked:
disabled, readonly and color variants.

bind vs value (the Switch convention):
  bind="${state}"  the live two-way rating (wins when present)
  value            the INITIAL rating when unbound

## Install

```bash
npm install @lemonadejs/rating
```

```js
import Rating from '@lemonadejs/rating';
import '@lemonadejs/rating/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Rating} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Rating} />`                       // by value (no registration)
setComponents({ Rating });               // then <Rating /> by name anywhere
createWebComponent(Rating);              // <lm-rating> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way rating (v5: value) |
| `value` | number | `0` | initial rating when unbound |
| `number` | number | `5` | how many stars (v5: number) |
| `tooltip` | string | `''` | per-star titles, comma-separated (v5: tooltip) |
| `name` | string | `''` | form identification name (v5: name) |
| `size` | string | `''` | small (v5: data-size variant) |
| `color` | string | `''` | yellow | orange | green | purple (default red, as v5) |
| `disabled` | boolean | `false` | blocks interaction (new) |
| `readonly` | boolean | `false` | display-only, full color (new) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires on component-initiated changes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const rating = ref();
html`<${Rating} ref="${rating}" />`;
// rating.current.getValue(...)  ·  rating.current.setValue(...)
```

- `getValue()`
- `setValue()`

## Styling

All classes follow the `lm-rating-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/rating/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Rating)`.
