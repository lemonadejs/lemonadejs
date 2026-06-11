# `<Schedule />` — @lemonadejs/schedule

LemonadeJS schedule block — contract-verified, framework-agnostic.

**✓ verified** — 35 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Schedule /> — the week/day time-grid scheduler, ported from the v5
plugin (@lemonadejs/schedule). The v5 block is NOT a month calendar:
it is a vertical time grid (1px per minute) with day columns, and that
exact model is preserved here:

  - views: type 'week' (Sun–Sat) | 'weekdays' (Mon–Fri) | 'day';
    weekly mode swaps real dates for abstract weekdays (recurring
    template schedules — events carry `weekday` instead of `date`)
  - grid: minutes per row (default 15, row height = grid px); snap:
    create/resize step in minutes (defaults to grid)
  - drag-create on empty cells, drag-move (top 25px zone) and
    drag-resize (bottom 5px zone) of events, with conflict blocking
    when overlap=false and read-only hour ranges
  - selection (click, Ctrl+click multi), keyboard: arrows walk events,
    Delete removes, Ctrl+C/V copy/paste (+1 row shift), Ctrl+Z/Y
    undo/redo (full history: add/update/delete/setData)
  - validrange hides hours outside the window; readonlyrange disables
    (striped) hour ranges; now-pointer line on today's column
  - the v5 Event editor (dist/event.js — a Modal with title/when/
    start/end/location/color palette) is built in, composing
    @lemonadejs/modal; it opens on double click and after drag-create
    (v5's onedition moments) — disable with editor=false

v5 → v6 mapping: validRange → validrange, readOnlyRange → readonlyrange,
onchangeevent → onupdate(record, oldValue, newValue),
onbeforechangeevent → onbeforedrag({ kind, record }), render() →
api.refresh(); callbacks drop the leading `self` argument (pure
components, no this); document.dictionary → weekdays prop; getEvent
returns the RECORD (not a DOM node). Data is BY REFERENCE: mutate the
array (or a record) and touch() — the grid re-renders once.

## Install

```bash
npm install @lemonadejs/schedule
```

```js
import Schedule from '@lemonadejs/schedule';
import '@lemonadejs/schedule/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Schedule} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Schedule} />`                       // by value (no registration)
setComponents({ Schedule });               // then <Schedule /> by name anywhere
createWebComponent(Schedule);              // <lm-schedule> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | ScheduleEvent[] BY REFERENCE (mutate + touch()) |
| `value` | string | `''` | anchor date 'YYYY-MM-DD' (default: today) |
| `type` | string | `"week"` | 'week' | 'weekdays' | 'day' |
| `weekly` | boolean | `false` | abstract weekday columns (no dates) |
| `grid` | number | `15` | minutes per row (row height = grid px) |
| `snap` | number | `0` | create/resize step in minutes (0 = grid) |
| `overlap` | boolean | `false` | allow overlapping events (true staggers them) |
| `validrange` | array | — | visible hours, e.g. ['08:00','20:00'] (v5: validRange) |
| `readonlyrange` | array | — | disabled hours: ['a','b'] or [['a','b'],...] (v5: readOnlyRange) |
| `editor` | boolean | `true` | built-in event editor (v5 shipped it as lm-event) |
| `weekdays` | array | — | 7 weekday names (v5: document.dictionary) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (data) — any user/api change to the data
- `oncreate` — (events) — events added
- `onbeforecreate` — (events) — return false to cancel
- `onbeforeinsert` — (event) — drag-create template; false cancels, object replaces
- `onupdate` — (record, oldValue, newValue) (v5: onchangeevent)
- `onbeforechange` — ({ action, ... }) — return false to cancel
- `onbeforedrag` — ({ kind, record }) — false cancels the gesture (v5: onbeforechangeevent)
- `ondelete` — (record) — per removed event
- `ondblclick` — (record)
- `onedition` — (record) — editor moment (dblclick / after drag-create)
- `onerror` — (message)

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const schedule = ref();
html`<${Schedule} ref="${schedule}" />`;
// schedule.current.addEvents(...)  ·  schedule.current.updateEvent(...)  ·  schedule.current.deleteEvents(...)  ·  schedule.current.getData(...)  ·  schedule.current.setData(...)  ·  schedule.current.getEvent(...)  ·  schedule.current.getSelected(...)  ·  schedule.current.resetSelection(...)  ·  schedule.current.setRange(...)  ·  schedule.current.setReadOnly(...)  ·  schedule.current.undo(...)  ·  schedule.current.redo(...)  ·  schedule.current.next(...)  ·  schedule.current.prev(...)  ·  schedule.current.today(...)  ·  schedule.current.openEditor(...)  ·  schedule.current.refresh(...)
```

- `addEvents()`
- `updateEvent()`
- `deleteEvents()`
- `getData()`
- `setData()`
- `getEvent()`
- `getSelected()`
- `resetSelection()`
- `setRange()`
- `setReadOnly()`
- `undo()`
- `redo()`
- `next()`
- `prev()`
- `today()`
- `openEditor()`
- `refresh()`

## Styling

All classes follow the `lm-schedule-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/schedule/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Schedule)`.
