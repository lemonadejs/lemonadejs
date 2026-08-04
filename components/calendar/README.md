# `<Calendar />` — @lemonadejs/calendar

LemonadeJS calendar block — date, datetime and range picker on the Modal primitive; contract-verified, framework-agnostic.

**✓ verified** — 45 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Calendar /> — date, datetime and range picker on the Modal primitive.

v5 parity, the full nuance set:
  - value shapes: 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM:SS' (time), Excel
    serial numbers (numeric — 1900 leap-bug compatible), arrays or
    comma strings (range), Date instances accepted on the way in
  - three views: 42-cell day grid (grey out-of-month days), 12-month
    picker, 16-year pages; month/year header buttons drill, selecting
    a month/year returns to the day grid
  - range: first click starts, second ends (clicking at/before the
    start restarts), live mouseover preview, commit via Done/Update
  - time: hour/minute selects; a day click commits but keeps the
    panel open, Update closes (v5)
  - min/max ISO bounds + validate(day, month, year, cell) hook (v5
    validRange array/function split into three clean props)
  - input mode: the calendar owns its input; typing is masked per
    format (inlined jSuites date tokens) and steers the view live —
    commit happens on Enter/click/Done only; the popup is a Modal
    anchored beneath the input (anchor measured at open)
  - input adoption: `input` accepts an EXISTING HTMLInputElement (v5
    `input`; v5's 'auto' is simply v6's default internal input) — the
    calendar renders no internal input and drives the host's element
    instead: value kept formatted per `format` (an initial input value
    seeds an empty calendar), open on focus/click, masked typing
    steers the view, keyboard, and a bubbling `change` event on every
    commit; every listener goes through listen() so unmount removes
    them all
  - initinput=false (v5 initInput): the interactive listeners are NOT
    wired on the input (adopted or internal — v5 applied it to
    whichever input the option configured): no open-on-focus/click,
    no type-to-update, no input keyboard; the input text still tracks
    the committed value
  - types: default (anchored panel) | picker (bottom sheet) | inline
    (no modal, always visible) | auto (viewport width at open)
  - keyboard: closed Enter/arrows open; input arrows focus the grid;
    grid arrows move the cursor (7/4 vertical jump), wrapping across
    months/years/pages; Enter selects; Escape CANCELS (uncommitted
    cursor/range/typed text revert) — like every v6 overlay block
  - wheel month navigation (wheel=false opts out), event markers from
    data=[{date}], today bold, starting weekday (live), grid lines,
    footer toggle, disabled, placeholder
  - localization through document.dictionary (month/weekday names and
    the Reset/Done/Update labels), v5's T()/Helpers hooks

Events: onchange(value), onupdate(cursorIso) on every cursor move,
onopen(), onclose(origin: 'button' | 'escape' | 'focusout').

## Install

```bash
npm install @lemonadejs/calendar
```

```js
import Calendar from '@lemonadejs/calendar';
import '@lemonadejs/calendar/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Calendar} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Calendar} />`                       // by value (no registration)
setComponents({ Calendar });               // then <Calendar /> by name anywhere
createWebComponent(Calendar);              // <lm-calendar> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | string | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. selected value (v5: value) — see formats above |
| `name` | string | `''` | form field name — when set, the root reflects |
| `range` | boolean | `false` | two-click range selection |
| `time` | boolean | `false` | hour/minute picker, value carries time |
| `numeric` | boolean | `false` | value as Excel serial number(s) |
| `format` | string | `''` | input display/typing mask (default YYYY-MM-DD) |
| `type` | string | `''` | '' | default | picker | inline | auto |
| `data` | array | — | [{ date: 'YYYY-MM-DD', ... }] event markers |
| `min` | string | `''` | first selectable date (v5 validRange[0]) |
| `max` | string | `''` | last selectable date (v5 validRange[1]) |
| `validate` | function | — | (day, month, year, cell) -> disabled (v5 validRange fn) |
| `startingday` | number | `0` | first weekday: 0 Sunday .. 6 Saturday (live) |
| `disabled` | boolean | `false` | blocks selection, dims the grid |
| `grid` | boolean | `false` | grid-line styling (data-grid) |
| `footer` | boolean | `true` | Update button / time row |
| `wheel` | boolean | `true` | mouse wheel month navigation |
| `placeholder` | string | `''` | input placeholder |
| `input` | any | — | 'any': an existing HTMLInputElement to adopt |
| `initinput` | boolean | `true` | wire the interactive input listeners: open on |
| `width` | number | `300` | popup panel width (v5 modal width) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (value) on commit
- `onupdate` — (cursorIso) on every cursor move
- `onopen`
- `onclose` — (origin: 'button' | 'escape' | 'focusout')

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const calendar = ref();
html`<${Calendar} ref="${calendar}" />`;
// calendar.current.open(...)  ·  calendar.current.close(...)  ·  calendar.current.isClosed(...)  ·  calendar.current.getValue(...)  ·  calendar.current.setValue(...)  ·  calendar.current.update(...)  ·  calendar.current.reset(...)  ·  calendar.current.next(...)  ·  calendar.current.prev(...)  ·  calendar.current.setView(...)
```

- `open()`
- `close()`
- `isClosed()`
- `getValue()`
- `setValue()`
- `update()`
- `reset()`
- `next()`
- `prev()`
- `setView()`

## Styling

All classes follow the `lm-calendar-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/calendar/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Calendar)`.
