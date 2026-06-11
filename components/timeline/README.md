# `<Timeline />` — @lemonadejs/timeline

LemonadeJS timeline block — contract-verified, framework-agnostic.

**✓ verified** — 32 contract checks · framework-agnostic · zero dependencies

## Overview

<Timeline /> — full behavioral parity with the v5 plugin.

The v5 model, ported faithfully:
  - a feed of events ({ title, subtitle, description, date, borderColor,
    borderStyle, tags }) sorted by date (order asc | desc), each item
    showing a formatted day bullet (v5 jSuites mask, default
    'dddd, dd' — or 'dd mmm yyyy' in monthly mode)
  - type="monthly": only the viewed month's events show, plus a header
    with the year / month name and prev / next month navigation
    (December/January roll the year over)
  - items can also come from element children (v5 extractFromHtml:
    title from textContent or title=, data-date, data-color, data-style)
  - per-item borders through borderColor / borderStyle, per-tag colors,
    tag onclick(e, tag) handlers
  - editable: an edit button per item firing onedition(record)
  - url: data fetched remotely ({ result: [...] } or a plain array);
    remote + monthly asks the server per month (?year&month&asc) and
    suppresses repeated consecutive en-GB day labels (v5 dateSignature)
  - align (left | right | top | bottom, invalid values fall back to
    left as v5), width/height in px, message when the feed is empty

v5 → v6 mapping: value → date (the viewed month anchor — "value" is
reserved for form semantics in v6); controls defaults true (the header
only ever shows in monthly mode, so the visual default is identical to
v5's controls = type === 'monthly'); onupdate(records) unchanged;
self.next/self.prev → api { next, prev }. The empty message is a real
.lm-timeline-message element (v5 used :empty::before, which cannot see
v6's slot markers). Border CSS vars are scoped: --lm-timeline-border-*.
Fetched data is kept internally instead of overwriting the data prop
(v5 wrote self.data); assigning data later replaces it, exactly v5.

## Install

```bash
npm install @lemonadejs/timeline
```

```js
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Timeline} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Timeline} />`                       // by value (no registration)
setComponents({ Timeline });               // then <Timeline /> by name anywhere
createWebComponent(Timeline);              // <lm-timeline> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | array | — | TimelineItem[] |
| `type` | string | `''` | 'monthly' filters by the viewed month + shows controls |
| `date` | string | `''` | viewed month anchor (v5: value) — defaults to today |
| `format` | string | `''` | day mask (v5 defaults: monthly 'dd mmm yyyy', feed 'dddd, dd') |
| `message` | string | `"No records found"` | text shown when the feed is empty |
| `order` | string | `"asc"` | asc | desc by date |
| `align` | string | `"left"` | left | right | top | bottom (invalid → left, v5) |
| `position` | string | `''` | v5 pass-through → data-mode on the feed |
| `controls` | boolean | `true` | month navigation header (visible in monthly mode only, as v5) |
| `editable` | boolean | `false` | shows the per-item edit button |
| `remote` | boolean | `false` | with url + monthly: server-side month queries |
| `url` | string | `''` | fetch the data remotely |
| `width` | number | `0` | px, 0 = natural |
| `height` | number | `0` | px, 0 = natural |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onupdate` — (records) after every recompute
- `onedition` — (record) when an item's edit button is clicked

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const timeline = ref();
html`<${Timeline} ref="${timeline}" />`;
// timeline.current.next(...)  ·  timeline.current.prev(...)
```

- `next()`
- `prev()`

## Styling

All classes follow the `lm-timeline-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/timeline/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Timeline)`.
