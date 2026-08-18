# `<Tabs />` — @lemonadejs/tabs

LemonadeJS tabs block — contract-verified, framework-agnostic.

**✓ verified** — 20 contract checks · framework-agnostic · zero dependencies

## Overview

<Tabs /> — full behavioral parity with the v5 plugin.

The v5 model, ported faithfully:
  - tabs come from a data array ({ title, content?, icon?, el?, selected? })
    AND/OR element children: each child element becomes a tab, with
    title / selected / data-icon extracted from its attributes
  - every tab owns ONE panel element created once and KEPT ALIVE across
    switches (visibility is a class + CSS, never an unmount) — exactly
    v5, where panels were real elements toggling a selected class
  - selected index, position (center | bottom), round borders,
    allowcreate ("add" button creating an Untitled tab)

v6 additions (purely presentational — no behavior change):
  - variant: '' / 'basic' keeps the v5 boxed look; 'modern' is a
    borderless underline style with a sliding-in indicator
  - the header row scrolls horizontally when the tabs overflow (the
    scrollbar only appears when needed; tabs never shrink or wrap)
  - the active panel fades in on switch, CSS-only (no redraw loop)
  - drag-and-drop header sorting (reorders the data, selects the moved
    tab, fires onchangeposition) — simplified to reorder-on-drop, v5
    live-previewed during dragover by mutating DOM the engine now owns
  - keyboard: Enter selects, Arrow keys move focus (focus opens, v5's
    onfocusin behavior); Ctrl/Cmd+ArrowLeft/Right moves the focused tab
    (the keyboard alternative to drag sorting)

v5 → v6 mapping: selected → bind (live two-way) with selected as the
initial index when unbound; allowCreate → allowcreate (contract props
are lowercase: they become HTML attributes); events drop the v5
`instance` argument: onchange(index, oldIndex), onopen(index),
onbeforecreate(item, position) (return false cancels),
oncreate(item, position), onchangeposition(fromIndex, toIndex).
api: open(index), create(item, position?, select?).

## Install

```bash
npm install @lemonadejs/tabs
```

```js
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Tabs} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Tabs} />`                       // by value (no registration)
setComponents({ Tabs });               // then <Tabs /> by name anywhere
createWebComponent(Tabs);              // <lm-tabs> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way selected index (v5: selected) |
| `data` | array | — | TabItem[] — programmatic tabs |
| `selected` | number | `0` | initial index when unbound |
| `position` | string | `''` | center | bottom (v5 data-position) |
| `variant` | string | `''` | '' | basic | modern (underline) | segmented (inset pill) |
| `round` | boolean | `false` | round borders on the first/last header |
| `allowcreate` | boolean | `false` | v5: allowCreate — shows the "add" button |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (index, oldIndex) on user-initiated changes
- `onopen` — (index) whenever a tab opens
- `onbeforecreate` — (item, position) — return false to cancel
- `oncreate` — (item, position) after a tab is created
- `onchangeposition` — (fromIndex, toIndex) after drag sorting

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const tabs = ref();
html`<${Tabs} ref="${tabs}" />`;
// tabs.current.open(...)  ·  tabs.current.create(...)
```

- `open()`
- `create()`

## Styling

All classes follow the `lm-tabs-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/tabs/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Tabs)`.
