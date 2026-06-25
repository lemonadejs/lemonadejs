# `<Gantt />` — @lemonadejs/gantt

LemonadeJS gantt block — %-positioned bars that align across embedded instances; contract-verified, framework-agnostic.

**✓ verified** — 26 contract checks · framework-agnostic · zero dependencies

## Overview

<Gantt /> — a simple, beautiful gantt chart designed to be EMBEDDED:
bars are positioned in PERCENTAGES of a date range, never pixels, so
any number of instances sharing the same start/end stay perfectly
aligned regardless of container width. That makes the table case
trivial — one headerless <Gantt> per row div, same range, done:

  <tr><td>Design</td><td><div><!-- <Gantt header=false ...> --></div></td></tr>
  <tr><td>Build</td> <td><div><!-- <Gantt header=false ...> --></div></td></tr>

Standalone mode adds the timeline header (months + days), weekend
shading and the today line — same engine, same percentages.

  - tasks { label, start, end, color, progress, type, readonly }
  - milestones: type 'milestone' (or start === end) render a diamond
  - editable: drag the bar to move, drag the edges to resize — day
    snapping, live preview, Escape cancels mid-drag, onchange(task,
    start, end) fires ONLY on commit and mutates YOUR task object
  - dates are 'YYYY-MM-DD' strings, all math in LOCAL time
  - data BY REFERENCE: mutate + touch() re-renders

TWO MOUNTING MODES:
  1. In a div: the full chart — header timeline + one row per task
     (non-headless by default).
  2. OVER A TABLE: set `table` to a CSS selector — the gantt injects
     one lane cell per tbody row (task i ↔ row i), %-aligned, drag
     editing included, and renders its own element as the timeline
     header you place above/beside the table. Unmount removes every
     injected cell — the table returns to its original state.

## Install

```bash
npm install @lemonadejs/gantt
```

```js
import Gantt from '@lemonadejs/gantt';
import '@lemonadejs/gantt/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Gantt} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Gantt} />`                       // by value (no registration)
setComponents({ Gantt });               // then <Gantt /> by name anywhere
createWebComponent(Gantt);              // <lm-gantt> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | GanttTask[] BY REFERENCE (mutate + touch()) |
| `start` | string | `''` | viewport start (default: earliest task - 2 days) |
| `end` | string | `''` | viewport end (default: latest task + 2 days) |
| `header` | boolean | `true` | timeline header (months + day ticks) |
| `grid` | boolean | `true` | weekend shading + day grid (standalone look) |
| `rowheight` | number | `36` |  |
| `today` | boolean | `true` | the today line |
| `editable` | boolean | `false` | drag to move, edges to resize |
| `snap` | number | `1` | drag snapping, in days |
| `table` | string | `''` | CSS selector: inject lanes into that table's rows |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (task, start, end) on drag commit
- `onclick` — (task, event)
- `onlink` — (fromTask, toTask) a dependency was drawn
- `onunlink` — (fromTask, toTask) a dependency was removed

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const gantt = ref();
html`<${Gantt} ref="${gantt}" />`;
// gantt.current.getRange(...)  ·  gantt.current.setRange(...)
```

- `getRange()`
- `setRange()`

## Styling

All classes follow the `lm-gantt-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/gantt/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Gantt)`.
