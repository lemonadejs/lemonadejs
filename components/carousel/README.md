# `<Carousel />` — @lemonadejs/carousel

LemonadeJS carousel block — single-file (styles ship inside the component), contract-verified, framework-agnostic.

**✓ verified** — 14 contract checks · framework-agnostic · zero dependencies

## Overview

<Carousel /> — LemonadeJS v6 block (MUI/embla-inspired, new in v6)

SINGLE-FILE component: the CSS ships INSIDE the template via the v6
component-owned <style> hoisting — no style.css anywhere. The engine
lifts the <style> at parse time and injects it into document.head ONCE
per template, however many instances mount. Hoisted styles are global,
so every selector is prefixed lm-carousel-*.

Model: slides sit side by side in a flex strip (each 100% wide); the
position is a translateX on the strip — `-index·100% + dragPx` — fully
deterministic (jsdom has no layout), built with css(). The snap
animation is one CSS transition, suspended while dragging via the
lm-carousel-dragging class.

Gestures (the llms.txt listen() pattern): pointer-down arms document
mousemove/touchmove/mouseup/touchend (+ keydown for Escape) per
gesture with ONE persistent release; pointer-up COMMITS — a drag past
25% of the viewport width goes to the next/prev slide, anything less
snaps back. Escape cancels the drag in flight. A mid-drag unmount
releases everything (onUnmount → release).

Autoplay: setInterval armed when autoplay > 0, re-armed live on prop
change (subscribe), PAUSED while hovering or dragging, cleared on
unmount. Autoplay always wraps (rewinds to 0 after the last slide),
even when loop=false — loop only governs user navigation at the edges.

Contract: bind (current index, two-way; set → onchange), data (slides:
{ image?, title?, description?, link? } — only provided fields
render), autoplay (ms, 0 = off), loop, arrows, dots, onchange(index);
api { next, prev, goto }. Keyboard: ArrowLeft/ArrowRight on the
focused region. ARIA: aria-roledescription carousel/slide, off-screen
slides aria-hidden.

## Install

```bash
npm install @lemonadejs/carousel
```

```js
import Carousel from '@lemonadejs/carousel';
import '@lemonadejs/carousel/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Carousel} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Carousel} />`                       // by value (no registration)
setComponents({ Carousel });               // then <Carousel /> by name anywhere
createWebComponent(Carousel);              // <lm-carousel> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | number | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way current slide index |
| `data` | array | — | slides: { image?, title?, description?, link? } |
| `autoplay` | number | `0` | ms between automatic advances (0 = off) |
| `loop` | boolean | `false` | wrap next/prev past the edges |
| `arrows` | boolean | `true` | prev/next overlay buttons |
| `dots` | boolean | `true` | one dot per slide, clickable |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — (index) on user/component-initiated changes

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const carousel = ref();
html`<${Carousel} ref="${carousel}" />`;
// carousel.current.next(...)  ·  carousel.current.prev(...)  ·  carousel.current.goto(...)
```

- `next()`
- `prev()`
- `goto()`

## Styling

All classes follow the `lm-carousel-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/carousel/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Carousel)`.
