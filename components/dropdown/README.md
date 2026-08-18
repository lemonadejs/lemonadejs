# `<Dropdown />` — @lemonadejs/dropdown

LemonadeJS dropdown block — select, autocomplete and picker on the Modal primitive; contract-verified, framework-agnostic.

**✓ verified** — 41 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Dropdown /> — select, autocomplete and picker in one block, built ON
the Modal primitive (the panel) with the datagrid's fixed-rowheight
virtualization (large option lists stay a window of DOM).

v5 parity, the full nuance set:
  - items { value, text, group, image, keywords, synonym, disabled };
    strings/numbers normalize to {value,text}; {id,name} too
  - groups: sorted together, header rows injected
  - single or multiple (Done/Reset controls); value as array or
    'a;b' string via divisor; allowempty=false pins a selection
  - autocomplete: the closed label swaps to a contenteditable search
    field while open; filters text/group/keywords/synonym; selected
    items always remain listed; FORCED on by insert/remote/searchbar
  - remote: url?q= fetch with 300ms debounce, onbeforesearch veto,
    results merge behind the selected items; initial url load
  - insert: + button adds the typed text (async onbeforeinsert can
    replace or cancel; oninsert after)
  - keyboard: closed Enter/arrows open; open: arrows wrap, Home/End,
    Enter selects, Space selects (no autocomplete), Escape CANCELS
    (restores the previous value) — closing any other way COMMITS
  - types: default (anchored panel) | picker | searchbar (sheet
    modes) | inline (no modal, list always visible) | auto (by
    viewport width at open)

## Install

```bash
npm install @lemonadejs/dropdown
```

```js
import Dropdown from '@lemonadejs/dropdown';
import '@lemonadejs/dropdown/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Dropdown} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Dropdown} />`                       // by value (no registration)
setComponents({ Dropdown });               // then <Dropdown /> by name anywhere
createWebComponent(Dropdown);              // <lm-dropdown> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | string | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. value: single, array (multiple) or 'a;b' string |
| `data` | array | — | DropdownItem[] (or strings/numbers/{id,name}) |
| `multiple` | boolean | `false` |  |
| `autocomplete` | boolean | `false` |  |
| `remote` | boolean | `false` | search against url?q= instead of locally |
| `url` | string | `''` |  |
| `insert` | boolean | `false` | + button adds the typed text |
| `type` | string | `''` | '' | default | picker | searchbar | inline | auto |
| `placeholder` | string | `''` |  |
| `aria-label` | string | `''` |  |
| `width` | number | `0` |  |
| `height` | number | `300` | panel viewport height |
| `rowheight` | number | `28` |  |
| `divisor` | string | `";"` | string-value separator (multiple) |
| `allowempty` | boolean | `true` | false: the last selection cannot be removed |
| `disabled` | boolean | `false` |  |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (value)
- `onopen`
- `onclose` — (origin)
- `onsearch` — (results) after a remote search
- `onbeforesearch` — (query, http) -> false cancels
- `oninsert` — (item)
- `onbeforeinsert` — async (item) -> item | false
- `onload` — data ready (incl. initial url load)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const dropdown = ref();
html`<${Dropdown} ref="${dropdown}" />`;
// dropdown.current.open(...)  ·  dropdown.current.close(...)  ·  dropdown.current.toggle(...)  ·  dropdown.current.isClosed(...)  ·  dropdown.current.getValue(...)  ·  dropdown.current.setValue(...)  ·  dropdown.current.getText(...)  ·  dropdown.current.getData(...)  ·  dropdown.current.setData(...)  ·  dropdown.current.add(...)  ·  dropdown.current.reset(...)
```

- `open()`
- `close()`
- `toggle()`
- `isClosed()`
- `getValue()`
- `setValue()`
- `getText()`
- `getData()`
- `setData()`
- `add()`
- `reset()`

## Styling

All classes follow the `lm-dropdown-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/dropdown/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Dropdown)`.
