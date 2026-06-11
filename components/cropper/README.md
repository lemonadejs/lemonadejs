# `<Cropper />` — @lemonadejs/cropper

LemonadeJS cropper block — contract-verified, framework-agnostic.

**✓ verified** — 21 contract checks · framework-agnostic · zero dependencies

## Overview

<Cropper /> — image crop editor, ported from the v5 plugin

The v5 plugin was a thumbnail + modal + contextmenu shell around the
@jsuites/cropper engine. v6 keeps blocks orthogonal: THIS block is the
editor itself (compose it with @lemonadejs/modal for the v5 dialog UX);
the engine behaviors are ported faithfully from the source:

  - load an image: file picker (click when empty, double click, the
    Upload button, api.upload()), drag-and-drop, the src prop (live),
    api.setValue() — scaled to fit the area and centered
  - drag the IMAGE to pan (mouse or touch, delta divided by the zoom)
  - wheel zoom (×0.9 / ×1.1 clamped to [0.1, 5], anchored at the cursor
    when it sits on a painted pixel — the v5 zoom-origin math verbatim),
    pinch zoom on touch, plus zoom/rotate/brightness/contrast levels
    (rotate is the v5 [-1..1] → ±180° model; the filters run the v5
    per-pixel pipelines on an offscreen canvas)
  - a crop BOX: drag to move (clamped to the area), resize from the
    8 edges/corners with live cursor feedback when resizable (5px hit
    zones, the configured crop size is the minimum — v5 rules)
  - export: save() reads the box pixels off the canvas into a dataURL
    and commits { file, content, extension(, original) } — the v5 value
    shape — to the bound state, firing onchange

v5 → v6 mapping: value → bind (commits on save/delete/setValue, exactly
like v5's Save/Delete buttons); options.area → width/height; the v5
wrapper width/height (the crop size) → cropwidth/cropheight;
allowResize → resizable; the modal's range controls + Save/Upload/Delete
buttons → the built-in controls bar (controls, default true);
original kept. Dropped: the thumbnail/modal/contextmenu shell, remote
URL parsing (remoteParser) and the HTML-drop path.

jsdom has no canvas: a null 2d context downgrades drawing to a no-op.

## Install

```bash
npm install @lemonadejs/cropper
```

```js
import Cropper from '@lemonadejs/cropper';
import '@lemonadejs/cropper/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Cropper} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Cropper} />`                       // by value (no registration)
setComponents({ Cropper });               // then <Cropper /> by name anywhere
createWebComponent(Cropper);              // <lm-cropper> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | object | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. committed crop data (v5: value) |
| `src` | string | `''` | image source — initial and live |
| `width` | number | `800` | editor area width (v5 desktop area) |
| `height` | number | `360` | editor area height |
| `cropwidth` | number | `300` | crop box width = minimum size (v5: width) |
| `cropheight` | number | `240` | crop box height = minimum size (v5: height) |
| `resizable` | boolean | `false` | crop box edge resize (v5: allowResize) |
| `controls` | boolean | `true` | built-in ranges + save/upload/delete bar |
| `original` | boolean | `false` | include the source image in saved data (v5) |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires when crop data commits (save/delete/setValue)
- `onload` — fires when an image lands in the editor

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const cropper = ref();
html`<${Cropper} ref="${cropper}" />`;
// cropper.current.getValue(...)  ·  cropper.current.setValue(...)  ·  cropper.current.getImage(...)  ·  cropper.current.zoom(...)  ·  cropper.current.rotate(...)  ·  cropper.current.brightness(...)  ·  cropper.current.contrast(...)  ·  cropper.current.save(...)  ·  cropper.current.reset(...)  ·  cropper.current.upload(...)
```

- `getValue()`
- `setValue()`
- `getImage()`
- `zoom()`
- `rotate()`
- `brightness()`
- `contrast()`
- `save()`
- `reset()`
- `upload()`

## Styling

All classes follow the `lm-cropper-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/cropper/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Cropper)`.
