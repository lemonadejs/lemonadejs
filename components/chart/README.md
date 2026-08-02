# `<Chart />` — @lemonadejs/chart

LemonadeJS chart block — one unified data definition, bar/stacked/pie, responsive with no JS layout.

**✓ verified** — 111 contract checks · framework-agnostic · zero dependencies

## Overview

<Chart /> — LemonadeJS v6 block

One block, two dozen chart types selected by `type` (bar, line, pie,
radar, radialbar, polararea, lollipop, dumbbell, histogram, streamgraph,
heatmap, treemap, candlestick... see the `type` prop for the full list).
Presentation is flat, typed, verifiable props; only the data itself —
`series` and `categories` — travels as arrays:

  const series = [
      { name: 'Product A', data: [3, 5, 2] },
      { name: 'Product B', data: [1, 2, 4] },
  ];
  <${Chart} type="bar" categories="${cats}" series="${series}" legend labels />

THE DESIGN, AND WHY IT IS NOT HIGHCHARTS:
  - bar / stackedbar render in PLAIN HTML + CSS (flex columns, % heights —
    the same mechanism <Progress> uses for its linear bar). They are
    responsive on both axes with ZERO JavaScript: no ResizeObserver, no
    redraw loop. The browser reflows the flexbox; we never recompute.
  - pie renders as a single <svg viewBox>; the viewBox scales the scene
    natively, so it too needs no resize handling. Per-slice paths give
    hover and labels for free.

LAYOUT: index.ts owns the component (state, legend, tooltip, export,
dispatch); model.ts the data shapes + normalize(); helpers.ts the pure
math/geometry; cartesian.ts / radial.ts / extras.ts the renderers, as
plain (model, ctx) => View functions wired through RenderCtx.

The scene is one reactive `model` derived from the props: change any prop
(assignment triggers, mutation does not — the v6 contract) and only the
dependent bindings rebuild. There is no imperative chart object to sync.

## Install

```bash
npm install @lemonadejs/chart
```

```js
import Chart from '@lemonadejs/chart';
import '@lemonadejs/chart/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Chart} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Chart} />`                       // by value (no registration)
setComponents({ Chart });               // then <Chart /> by name anywhere
createWebComponent(Chart);              // <lm-chart> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | string | `"bar"` | bar | stackedbar | line | stackedarea | streamgraph | pie | scatter | bubble | radar | radialbar | polararea | gauge | funnel | pyramid | waterfall | bullet | lollipop | dumbbell | histogram | heatmap | candlestick | ohlc | boxplot | arearange | columnrange | treemap | sunburst | icicle | sankey | chord | arcdiagram | packedbubble | pareto | wordcloud | pictogram (aka pictorial/isotype/waffle) |
| `series` | array | — | [{ name, data, color? }]; pie uses the first series |
| `categories` | array | — | x-axis labels (bar/stacked) / slice names (pie) |
| `title` | string | `''` | optional heading above the plot |
| `subtitle` | string | `''` | muted line under the title |
| `xtype` | string | `''` | '' category | 'datetime' | 'linear' (continuous x for line/area) |
| `xformat` | function | — | (x) => string; custom x-axis tick label (datetime/linear) |
| `xtitle` | string | `''` | x-axis title (bar/stacked) |
| `ytitle` | string | `''` | y-axis (left) title |
| `y2title` | string | `''` |  |
| `markers` | boolean | `true` | line/area: show point markers |
| `smooth` | boolean | `false` | line/area: smooth (spline) curves |
| `step` | boolean | `false` | line/area: step (stairs) — true/'before' or 'mid' |
| `area` | boolean | `false` | line type: fill the area under the line |
| `toolbar` | boolean | `false` | show a small toolbar with a CSV download button |
| `zoom` | boolean | `false` | bar/line: drag-select along x to zoom in (reset button) |
| `navigator` | boolean | `false` | bar/line: overview strip below with a draggable x-window |
| `sparkline` | boolean | `false` | tiny axisless/chrome-free inline chart (line/area/bar) |
| `gridlines` | boolean | `true` | show horizontal y-gridlines |
| `valueprefix` | string | `''` | unit prefix on values (e.g. '$') |
| `valuesuffix` | string | `''` | unit suffix on values (e.g. ' USD') |
| `labelrotation` | number | — | x-label angle in deg (unset = auto-rotate when crowded) |
| `legend` | boolean | `true` | show the series/slice legend |
| `legendposition` | string | `''` | '' auto | 'top' | 'bottom' | 'left' | 'right' |
| `labels` | boolean | `true` | value labels on bars / % on slices (set false to hide) |
| `horizontal` | boolean | `false` | bar/stacked: horizontal bars (categories on the y-axis) |
| `mirror` | boolean | `false` | horizontal bars: population pyramid — series[0] grows leftward, abs labels |
| `tooltip` | boolean | `true` | styled hover tooltip following the cursor |
| `sharedtooltip` | boolean | `true` | bar/stacked: hover a column → all series + crosshair |
| `animate` | boolean | `true` | CSS entrance/update animation (reduced-motion aware) |
| `stackmode` | string | `"normal"` | stackedbar only: 'normal' | 'percent' (100%-stacked) |
| `innerradius` | number | `0` | pie: donut hole as a fraction (0–0.9) or percent (10–90); ring thickness = radius × (1 − innerradius) |
| `borderradius` | any | — | corner rounding: donut segment corners / heatmap cells; default = subtle per-type value |
| `ymin` | number | — | bar/stacked: force the y-axis lower bound (auto if unset) |
| `ymax` | number | — | bar/stacked: force the y-axis upper bound (auto if unset) |
| `ylog` | boolean | `false` | logarithmic y-axis (positive values only) |
| `bins` | number | — | histogram only: bin count (unset = Sturges' rule) |
| `plotlines` | array | — | reference lines [{ value, color?, label?, dashed?, axis? }] |
| `plotbands` | array | — | reference bands [{ from, to, color?, label?, axis? }] |
| `annotations` | array | — | callouts [{ x, y, text, color? }] pinned to data points |
| `palette` | string | `"lemonade"` | built-in palette: lemonade | classic | category10 | material |
| `colors` | array | — | custom palette (overrides `palette`) |
| `height` | number | `0` | plot height in px (width is always fluid); default 320 |
| `icon` | string | `''` | pictogram: preset ('person'|'square'|'circle'|'capsule'|'star'|'heart') or an SVG path |
| `columns` | number | — | pictogram: glyphs across one row (default 10) |
| `iconcount` | number | — | pictogram: total glyphs per row (0 = one row of `columns`; e.g. 100 = a waffle grid) |
| `total` | number | — | pictogram: the value that fills every glyph (default 100 = percentages) |
| `valueformat` | function | — | (n) => string; override the default compact formatter |
| `compact` | boolean | `true` | compact numbers (1.2k/3.4M); false = full numbers |
| `thousands` | boolean | `false` | group full numbers with separators (1,234) when not compact |
| `decimals` | number | — | fixed decimal places (unset = auto) |
| `tooltipformat` | function | — | ({ title, rows }) => string; custom tooltip body |
| `drilldown` | object | — | { [category|slice]: { series, categories?, type?, title? } } |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onpointclick` — (point, { seriesIndex, pointIndex }) on bar/slice click
- `onlegendclick` — (key, visible) when a legend entry is toggled
- `ondrilldown` — (key, depth) after descending into a drilldown level
- `ondrillup` — (depth) after climbing back up via the breadcrumb

## Styling

All classes follow the `lm-chart-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/chart/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Chart)`.
