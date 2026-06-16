# `<Button />` — @lemonadejs/button

LemonadeJS button block — contract-verified, framework-agnostic.

**✓ verified** — 22 contract checks · framework-agnostic · zero dependencies

## Overview

<Button /> — a pressable action block (LemonadeJS v6)

Built on the v6 contract model: a real
<button> (native semantics, native disabled, native keyboard
activation) — or a real <a> when `href` is set. Three variants
(contained is the default), five colors, three sizes, an optional
material icon, and a loading state whose spinner replaces the content
while clicks are blocked. Ripple-free by design: hover/active/
focus-visible states live entirely in CSS.

Content: `label` for plain text, or children for anything richer —
both render inside the same button.

## Install

```bash
npm install @lemonadejs/button
```

```js
import Button from '@lemonadejs/button';
import '@lemonadejs/button/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Button} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Button} />`                       // by value (no registration)
setComponents({ Button });               // then <Button /> by name anywhere
createWebComponent(Button);              // <lm-button> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | string | `''` | text content (children also supported) |
| `variant` | string | `''` | '' = contained | outlined | text |
| `color` | string | `''` | '' = primary | secondary | success | error | warning |
| `size` | string | `''` | small | large (default in between) |
| `disabled` | boolean | `false` | blocks interaction (native on <button>) |
| `loading` | boolean | `false` | spinner replaces the content; disabled while on |
| `fullwidth` | boolean | `false` | stretch to the container width |
| `href` | string | `''` | renders a real <a> instead of <button> |
| `type` | string | `''` | button type: submit | reset ('' = button) |
| `icon` | string | `''` | material icon name shown before the label |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onclick` — fires on activation (never while disabled/loading)

## Styling

All classes follow the `lm-button-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/button/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Button)`.
