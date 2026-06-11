# `<Formify />` — @lemonadejs/formify

LemonadeJS formify block — smart HTML forms: your markup in, one data object out (get/set/load/save, two-way bind). Contract-verified, framework-agnostic.

**✓ verified** — 8 contract checks · framework-agnostic · zero dependencies

## Overview

<Formify /> — v6 port of v5's "pico smart HTML forms" (@lemonadejs/formify).

v5 is NOT a field generator: it is a smart <form> wrapper around YOUR
markup. Any child carrying a name attribute participates; Formify
collects them into one data object and applies data objects back —
including nested names: name="address[city]" ⇄ { address: { city } }.

v5 → v6 mapping:
  get()/set()       → api.get/api.set, PLUS bind="${state}": the whole
                      form as one two-way data object (user edits flow
                      out, external writes flow in)
  load(url)         → api.load(url) — now returns the promise — plus a
                      url prop that loads on mount; onload(data) fires
                      (declared but unused in v5)
  save(url, cb)     → api.save(url, cb) — same wire format as v5
                      (POST, JSON body, X-Requested-With header)
  .val() protocol   → still honored on custom children; v6 web
                      components are covered through their value
                      property and any inner [name] native inputs

Deliberate fixes over v5 (the v5 code, not its intent):
  - radio groups: the checked value wins regardless of DOM order
    (v5 let a later unchecked sibling erase it)
  - multiple <select>: runtime selections are read (v5 queried the
    selected ATTRIBUTE, so user picks were invisible)
  - get() returns NESTED data for bracket names, symmetric with set()
    (v5 returned flat 'a[b]' keys but consumed nested data)
  - bare checkboxes are booleans; value-carrying ones submit their
    value ('' when off) — v5 returned the browser default 'on'

Validation and submit stay native: required/pattern/etc on the children
block submission by constraint validation; a declared onsubmit receives
(data, event) with the default prevented.

## Install

```bash
npm install @lemonadejs/formify
```

```js
import Formify from '@lemonadejs/formify';
import '@lemonadejs/formify/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Formify} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Formify} />`                       // by value (no registration)
setComponents({ Formify });               // then <Formify /> by name anywhere
createWebComponent(Formify);              // <lm-formify> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | object | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. the whole form as one two-way data object (v5: get/set only) |
| `url` | string | `''` | remote JSON applied to the form on mount (v5: load()) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (data, previous) after any user edit
- `onsubmit` — (data, event) — declaring it intercepts native submit
- `onload` — (data) after url / api.load() data lands

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const formify = ref();
html`<${Formify} ref="${formify}" />`;
// formify.current.get(...)  ·  formify.current.set(...)  ·  formify.current.load(...)  ·  formify.current.save(...)
```

- `get()`
- `set()`
- `load()`
- `save()`

## Styling

All classes follow the `lm-formify-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/formify/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Formify)`.
