# `<Charts />` — @lemonadejs/charts

LemonadeJS charts block — 35 chart types from one data definition, responsive with no resize code.

**✓ verified** — 111 contract checks · framework-agnostic · zero dependencies

## Overview

A chart component for LemonadeJS v6. One component draws 35 chart types,
selected by the `type` prop, from a single data definition: `series` and
`categories`. Everything else is a plain prop.

```js
const categories = ['Jan', 'Feb', 'Mar'];
const series = [
    { name: 'Product A', data: [3, 5, 2] },
    { name: 'Product B', data: [1, 2, 4] },
];

html`<${Charts} type="bar" title="Sales" categories="${categories}" series="${series}" />`;
```

### Chart types

| Family | `type` |
|---|---|
| Bars and columns | `bar`, `stackedbar`, `histogram`, `pareto`, `waterfall`, `bullet`, `lollipop`, `dumbbell`, `columnrange` |
| Lines and areas | `line`, `stackedarea`, `streamgraph`, `arearange` |
| Parts of a whole | `pie`, `funnel`, `pyramid`, `treemap`, `sunburst`, `icicle`, `pictogram` |
| Radial | `radar`, `radialbar`, `polararea`, `gauge` |
| Points and distributions | `scatter`, `bubble`, `packedbubble`, `boxplot`, `heatmap` |
| Financial | `candlestick`, `ohlc` |
| Flows and relations | `sankey`, `chord`, `arcdiagram` |
| Text | `wordcloud` |

A donut is a `pie` with `innerradius`. An area chart is a `line` with `area`.

### Data

A series is `{ name, data, color? }`. Each entry of `data` is one point:

- a number, one per category: `[3, 5, 2]`
- a tuple: `[x, y]` for scatter, `[x, y, z]` for bubble, `[low, high]` for
  the range types, `[open, high, low, close]` for candlestick and ohlc,
  `[min, q1, median, q3, max]` for boxplot
- an object: `{ name, value, color? }` for slices, `{ from, to, value }`
  for sankey, chord and arcdiagram links, `{ name, parent, value }` for
  sunburst and icicle
- `null`, a gap in a line

A series can set its own `type` (`bar`, `line`, `area` or `scatter`) to
build a combo chart, and `axis: 'right'` to use a secondary y-axis.

### Features

- Legend that shows and hides series, hover tooltip, shared tooltip with
  a crosshair
- Value labels, axis titles and number formatting: prefix, suffix,
  compact notation, decimals or a custom formatter
- Category, datetime and linear x-axes; logarithmic and secondary y-axes
- Reference lines, reference bands and annotations pinned to data points
- Zoom by drag selection, a navigator strip and drilldown with a breadcrumb
- Sparkline mode for inline charts, and a toolbar with CSV download
- Four built-in palettes, or your own colors
- Responsive: the width is fluid and the chart follows its container
  through CSS and the SVG viewBox, with no resize listeners
- Accessible: a text summary and a hidden data table for screen readers,
  and animations that respect reduced motion

### Updating

The chart is derived from its props. Assign a new array to `series` or
`categories`, or change any other prop, and the chart updates. Mutating
an array in place does not trigger an update.

## Install

```bash
npm install @lemonadejs/charts
```

```js
import Charts from '@lemonadejs/charts';
import '@lemonadejs/charts/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Charts} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Charts} />`                       // by value (no registration)
setComponents({ Charts });               // then <Charts /> by name anywhere
createWebComponent(Charts);              // <lm-charts> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | string | `"bar"` | bar \| stackedbar \| line \| stackedarea \| streamgraph \| pie \| scatter \| bubble \| radar \| radialbar \| polararea \| gauge \| funnel \| pyramid \| waterfall \| bullet \| lollipop \| dumbbell \| histogram \| heatmap \| candlestick \| ohlc \| boxplot \| arearange \| columnrange \| treemap \| sunburst \| icicle \| sankey \| chord \| arcdiagram \| packedbubble \| pareto \| wordcloud \| pictogram (aka pictorial/isotype/waffle) |
| `series` | array | — | [{ name, data, color? }]; pie uses the first series |
| `categories` | array | — | x-axis labels (bar/stacked) / slice names (pie) |
| `title` | string | `''` | optional heading above the plot |
| `subtitle` | string | `''` | muted line under the title |
| `xtype` | string | `''` | '' category \| 'datetime' \| 'linear' (continuous x for line/area) |
| `xformat` | function | — | (x) => string; custom x-axis tick label (datetime/linear) |
| `xtitle` | string | `''` | x-axis title (bar/stacked) |
| `ytitle` | string | `''` | y-axis (left) title |
| `y2title` | string | `''` | secondary y-axis (right) title |
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
| `legendposition` | string | `''` | '' auto \| 'top' \| 'bottom' \| 'left' \| 'right' |
| `labels` | boolean | `true` | value labels on bars / % on slices (set false to hide) |
| `horizontal` | boolean | `false` | bar/stacked: horizontal bars (categories on the y-axis) |
| `mirror` | boolean | `false` | horizontal bars: population pyramid — series[0] grows leftward, abs labels |
| `tooltip` | boolean | `true` | styled hover tooltip following the cursor |
| `sharedtooltip` | boolean | `true` | bar/stacked: hover a column → all series + crosshair |
| `animate` | boolean | `true` | CSS entrance/update animation (reduced-motion aware) |
| `stackmode` | string | `"normal"` | stackedbar only: 'normal' \| 'percent' (100%-stacked) |
| `innerradius` | number | `0` | pie: donut hole as a fraction (0–0.9) or percent (10–90); ring thickness = radius × (1 − innerradius) |
| `borderradius` | any | — | corner rounding: donut segment corners / heatmap cells; default = subtle per-type value |
| `ymin` | number | — | bar/stacked: force the y-axis lower bound (auto if unset) |
| `ymax` | number | — | bar/stacked: force the y-axis upper bound (auto if unset) |
| `ylog` | boolean | `false` | logarithmic y-axis (positive values only) |
| `bins` | number | — | histogram only: bin count (unset = Sturges' rule) |
| `plotlines` | array | — | reference lines [{ value, color?, label?, dashed?, axis? }] |
| `plotbands` | array | — | reference bands [{ from, to, color?, label?, axis? }] |
| `annotations` | array | — | callouts [{ x, y, text, color? }] pinned to data points |
| `palette` | string | `"lemonade"` | built-in palette: lemonade \| classic \| category10 \| material |
| `colors` | array | — | custom palette (overrides `palette`) |
| `height` | number | `0` | plot height in px (width is always fluid); default 320 |
| `icon` | string | `''` | pictogram: preset ('person'\|'square'\|'circle'\|'capsule'\|'star'\|'heart') or an SVG path |
| `columns` | number | — | pictogram: glyphs across one row (default 10) |
| `iconcount` | number | — | pictogram: total glyphs per row (0 = one row of `columns`; e.g. 100 = a waffle grid) |
| `total` | number | — | pictogram: the value that fills every glyph (default 100 = percentages) |
| `valueformat` | function | — | (n) => string; override the default compact formatter |
| `compact` | boolean | `true` | compact numbers (1.2k/3.4M); false = full numbers |
| `thousands` | boolean | `false` | group full numbers with separators (1,234) when not compact |
| `decimals` | number | — | fixed decimal places (unset = auto) |
| `tooltipformat` | function | — | ({ title, rows }) => string; custom tooltip body |
| `drilldown` | object | — | { [category\|slice]: { series, categories?, type?, title? } } |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onpointclick` — (point, { seriesIndex, pointIndex }) on bar/slice click
- `onlegendclick` — (key, visible) when a legend entry is toggled
- `ondrilldown` — (key, depth) after descending into a drilldown level
- `ondrillup` — (depth) after climbing back up via the breadcrumb

## Styling

All classes follow the `lm-charts-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/charts/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Charts)`.
