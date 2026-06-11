# `<Speeddial />` — @lemonadejs/speeddial

LemonadeJS speeddial block — contract-verified, framework-agnostic.

**✓ verified** — 18 contract checks · framework-agnostic · zero dependencies

## Overview

<Speeddial /> — a MUI-inspired floating action button that fans out a
column/row of small action buttons. New v6 block (no v5 ancestor).

One FAB toggles the fan on click; hovering opens it and leaving closes
it after a 150ms grace timer (cancelled on re-enter and on unmount —
destroy-clean). Escape closes. Picking an action fires its own onclick,
then onaction(name, event), then closes the fan.

bind is the open state (named `fanned`), two-way: external writes flip
the fan silently — onopen/onclose fire on user/api transitions only.

Fan-out stagger: each action carries an inline transition-delay of
index * 30ms — deterministic, testable as a style attribute. The FAB
icon rotates 45° while open (pure CSS on lm-speeddial-open). Action
tooltips are plain CSS side labels — no Tooltip dependency.

## Install

```bash
npm install @lemonadejs/speeddial
```

```js
import Speeddial from '@lemonadejs/speeddial';
import '@lemonadejs/speeddial/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Speeddial} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Speeddial} />`                       // by value (no registration)
setComponents({ Speeddial });               // then <Speeddial /> by name anywhere
createWebComponent(Speeddial);              // <lm-speeddial> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | boolean | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way open state (`fanned`) |
| `options` | array | — | SpeeddialAction[] — live |
| `icon` | string | `''` | FAB icon (default '+' glyph; rotates 45° open) |
| `direction` | string | `''` | '' = up | down | left | right |
| `position` | string | `''` | '' = static in flow | 'fixed' (bottom-right) |
| `label` | string | `''` | aria-label for the FAB |
| `disabled` | boolean | `false` | blocks every trigger |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onopen` — fan opened (user/api — bind writes are silent)
- `onclose` — fan closed (user/api — bind writes are silent)
- `onaction` — (name, event) when an action is picked

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const speeddial = ref();
html`<${Speeddial} ref="${speeddial}" />`;
// speeddial.current.open(...)  ·  speeddial.current.close(...)  ·  speeddial.current.toggle(...)
```

- `open()`
- `close()`
- `toggle()`

## Styling

All classes follow the `lm-speeddial-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/speeddial/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Speeddial)`.
