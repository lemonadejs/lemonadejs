# `<Cropper />` — @lemonadejs/cropper

LemonadeJS cropper block — contract-verified, framework-agnostic.

**✓ verified** — 31 contract checks · framework-agnostic · zero dependencies

## Overview

<Cropper /> — a quick image editor (crop · transform · adjust · filter · export)

Evolved from the v5 @jsuites/cropper engine, which v6 vendored inline
(zero runtime deps). The pan / wheel-zoom / crop-box geometry is the v5
math verbatim; everything else is modernised:

  - ADJUST + FILTER run on the native CanvasRenderingContext2D.filter
    (GPU-accelerated) instead of the v5 per-pixel getImageData loops:
    brightness, contrast, saturation, hue, blur, grayscale, sepia,
    invert — one filter string, baked into the canvas so the crop
    export picks them up for free (prefer the platform over JS emulation)
  - TRANSFORM: continuous rotate (v5 [-1..1] → ±180°) plus 90° steps and
    horizontal/vertical flip, composed in one center transform
  - CROP box: drag to move, resize from the 8 edges/corners when
    resizable, with an optional ASPECT-RATIO lock (free / 1:1 / 16:9 /
    custom) that constrains the box as it resizes
  - LOAD: file picker (click when empty, double click, Upload button,
    api.upload()), drag-and-drop, the src prop (live), api.setValue()
  - EXPORT: save() reads the box pixels into a dataURL with an optional
    output format (png/jpeg/webp), quality and output size, and commits
    { file, content, extension(, original) } — the v5 value shape — to
    the bound state, firing onchange

v5 → v6 mapping is unchanged from the original port (value → bind,
options.area → width/height, wrapper size → cropwidth/cropheight,
allowResize → resizable, range controls + buttons → the controls bar).
New props/api are purely additive; the old contract still holds.

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
| `controls` | boolean | `true` | built-in ranges + tools + buttons bar |
| `original` | boolean | `false` | include the source image in saved data (v5) |
| `aspect` | number | `0` | crop aspect ratio (w/h); 0 = free |
| `format` | string | `"png"` | export format: png | jpeg | webp |
| `quality` | number | `0.92` | export quality for jpeg/webp (0..1) |
| `outputwidth` | number | `0` | export width; 0 = crop box width |
| `outputheight` | number | `0` | export height; 0 = crop box height |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onchange` — fires when crop data commits (save/delete/setValue)
- `onload` — fires when an image lands in the editor

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const cropper = ref();
html`<${Cropper} ref="${cropper}" />`;
// cropper.current.getValue(...)  ·  cropper.current.setValue(...)  ·  cropper.current.getImage(...)  ·  cropper.current.zoom(...)  ·  cropper.current.rotate(...)  ·  cropper.current.brightness(...)  ·  cropper.current.contrast(...)  ·  cropper.current.saturate(...)  ·  cropper.current.grayscale(...)  ·  cropper.current.sepia(...)  ·  cropper.current.hue(...)  ·  cropper.current.blur(...)  ·  cropper.current.invert(...)  ·  cropper.current.rotateLeft(...)  ·  cropper.current.rotateRight(...)  ·  cropper.current.flipHorizontal(...)  ·  cropper.current.flipVertical(...)  ·  cropper.current.setAspect(...)  ·  cropper.current.save(...)  ·  cropper.current.reset(...)  ·  cropper.current.upload(...)
```

- `getValue()`
- `setValue()`
- `getImage()`
- `zoom()`
- `rotate()`
- `brightness()`
- `contrast()`
- `saturate()`
- `grayscale()`
- `sepia()`
- `hue()`
- `blur()`
- `invert()`
- `rotateLeft()`
- `rotateRight()`
- `flipHorizontal()`
- `flipVertical()`
- `setAspect()`
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
