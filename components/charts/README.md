# `<Charts />` — @lemonadejs/charts

LemonadeJS charts block — 35 chart types from one data definition, responsive with no resize code.

**✓ verified** — 135 contract checks · framework-agnostic · zero dependencies

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
Pie slices take a `bordercolor` per point (`{ name, value, color,
bordercolor }`), with the series `bordercolor` as the fallback and its
`borderwidth` (px, default 1; 0 = no border); unset, a thin
surface-coloured seam separates the slices.
A `pie` with several series draws one ring per series, the first
outermost (a solid pie keeps a disc in the middle); slice k of every
ring shares colour k, the legend lists the slices once, and the
tooltip names the ring.

### Data

A series is `{ name, data, color? }`. Each entry of `data` is one point:

- a number, one per category: `[3, 5, 2]`
- a tuple: `[x, y]` for scatter, `[x, y, z]` for bubble, `[low, high]` for
  the range types, `[open, high, low, close]` (or `[high, low, close]`)
  for candlestick and ohlc, `[min, q1, median, q3, max]` for boxplot, or
  the raw sample of any other size and the box is computed (Excel's
  exclusive median method)
- an object: `{ name, value, color? }` for slices, `{ from, to, value }`
  for sankey, chord and arcdiagram links, `{ name, parent, value }` for
  sunburst and icicle
- `null`, a gap in a line

A series can set its own `type` (`bar`, `line`, `area` or `scatter`) to
build a combo chart, and `axis: 'right'` to use a secondary y-axis.
`color` is the fill and `bordercolor` the outline, with `borderwidth`
(px, default 1): on bars the outline (`color: 'transparent'` draws hollow
bars), on lines the line and the marker ring while the markers keep
`color` as their fill, on scatter the point outline. Line
series take `width`, `dashed` (`true`, `'dashed'`, `'dotted'` or
`'dashdot'`), `markers`, `markersize`, `marker` and `connectgaps`, and a
`trendline`: `'linear'`, `'exponential'`, `'logarithmic'`, `'power'`,
`'polynomial'` (`order`) or `'movingAverage'` (`period`), as a type or
`{ type, order?, period?, color?, dashed?, width? }`.

`marker` (line, radar and scatter points) is a filled `'circle'`, `'square'`,
`'triangle'` or `'diamond'`, or a stroked `'x'`, `'plus'`, `'dash'` or
`'star'` (the Excel asterisk, plus and x together): no fill, drawn in
`bordercolor` (else `color`), `borderwidth` px wide (at least 1.5; 2
without a `bordercolor`). `markersize` is the radius in px. Unset, scatter
series cycle circle, diamond, square, triangle. A radar series keeps its
small vertex dots until it asks for markers (`markers: true`, a `marker`
or a `markersize`), and `markers: false` hides them; its polygon takes
`bordercolor` as the stroke and `color` as the fill, like a line.

### Features

- Legend that shows and hides series, hover tooltip, shared tooltip with
  a crosshair
- Value labels, axis titles and number formatting: prefix, suffix,
  compact notation, decimals or a custom formatter
- Category, datetime and linear x-axes; logarithmic, reversed, fixed-step
  and secondary y-axes; trendlines
- Histogram binning by count (`bins`, default Sturges' rule) or by a
  fixed width from the minimum (`binwidth`); Excel's bins, closed on the
  right — `[28, 33]`, `(33, 38]`… — a boundary value counts in the lower
- Reference lines, reference bands and annotations pinned to data points
- Zoom by drag selection, a navigator strip and drilldown with a breadcrumb
- Sparkline mode for inline charts, and a toolbar with CSV download
- Four built-in palettes, or your own colors
- Responsive: the width is fluid and the chart follows its container
  through CSS and the SVG viewBox, with no resize listeners
- Accessible: a text summary and a hidden data table for screen readers,
  and animations that respect reduced motion

### Title, legend and axes

`title`, `subtitle`, `legend`, `xaxis`, `yaxis` and `y2axis` take an
object that groups the text with its font:

```js
title: { text: 'Sales', font: { size: 35, color: '#595959' } },
subtitle: { text: '2026', font: { italic: true } },
legend: { position: 'bottom', title: 'Products', font: { size: 12 }, titlefont: { bold: true } },
xaxis: { title: 'Month', titlefont: { size: 13 }, font: { size: 12, color: '#595959' } },
yaxis: { title: 'Revenue', font: { size: 12 } },
y2axis: { labels: false },               // hide the right-axis tick labels
```

A font is `{ size, color, family, bold, italic }`; `size` is px when a
number, or any CSS length as a string. On an axis, `font` styles its tick
labels and `titlefont` its title. The axes are physical: `xaxis` is the
bottom one, `yaxis` the left and `y2axis` the right, which falls back to
the `yaxis` fonts. With `horizontal` the categories are on `yaxis` and
the values on `xaxis`. `legend: { show: false }` hides the legend, and
`labels: false` on an axis hides its tick labels and frees their space
(the gridlines, the title and the scale stay).

`grid` on `xaxis` styles the vertical lines and on `yaxis` the
horizontal ones: `{ show, color, width, dash }`, with `dash` `'dashed'`,
`'dotted'` or `'dashdot'` (drawn dashed). On a value axis `show: false`
hides the lines and keeps the zero line and the ticks, and `show: true`
overrides `gridlines: false`. A category axis has no lines by default; a
`grid` on it draws one at each category boundary. With `horizontal` the
categories are on `yaxis`. The fields are the CSS variables
`--lm-chart-xgrid-color`, `-width` and `-style` (and `ygrid`).

In vertical charts, scatter and bubble included, the `axis: 'right'`
series use the right axis (`y2axis`, whose `reverse` and fonts fall back
to `yaxis`) on a scale of their own, its ticks aligned to the gridlines.
When every visible series is on the right, stacked included, only the
right axis is drawn: the left one, its title and its gutter go.

In horizontal bars the `axis: 'right'` series (the secondary axis) get
a value axis of their own at the top, configured by `x2axis` (`title`,
`titlefont`, `font`, `labels`, `reverse`; fonts fall back to `xaxis`).
Its ticks share the bottom axis' gridlines, and an axis with no visible
series is not drawn: only secondary series show only the top axis.
Mirrored bars, and stacks that mix both axes, have no secondary axis (a
stack sums on one axis, a pyramid shares one centred at zero): every
series uses the bottom one. A stack whose series are all secondary is a
single stack on the top axis.

The radar's radial axis is `raxis`: `min`/`max` and `step` set the scale
and the ring spacing (else 0 to a nice maximum, 4 rings), `reverse` puts
the maximum at the centre, `labels: false` hides the category labels
(`font` styles them), `ticks` shows the ring values always (`true`) or
never (`false`; unset, they follow the chart `labels`; `tickfont`), and
`grid` and `spokes` style the rings and the spokes like a grid
(`{ show, color, width, dash }`; variables `--lm-chart-rgrid-*` and
`--lm-chart-rspokes-*`, fonts `--lm-chart-rlabels-*` and `--lm-chart-rticks-*`).

`reverse: true` reverses an axis, physically like the rest:
`yaxis.reverse` (or `yreverse`) makes the values grow downwards, or with
`horizontal` runs the categories bottom to top (the Excel default);
`xaxis.reverse` runs the categories right to left, or with `horizontal`
(and on a continuous or scatter x) makes the values grow leftwards. The
waterfall keeps its running total in data order, trendlines are fitted
in data order and mirrored, and click indices stay data indices.

The plain forms still work: `title: 'Sales'`, `legend: false`, and the
flat `legendposition`, `legendtitle`, `xtitle`, `ytitle` and `y2title`.
When both are given, the object wins.

Each font field is the CSS variable `--lm-chart-<el>-size`, `-color`,
`-family`, `-weight` or `-style`, for `<el>` = `title`, `subtitle`,
`legend`, `legendtitle`, `xtitle`, `ytitle`, `y2title`, `xlabels`,
`ylabels` or `y2labels`, so a stylesheet can set them too.

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
| `series` | array | — | [{ name, data, color? }]; pie: one ring per series (the first outermost) |
| `categories` | array | — | x-axis labels (bar/stacked) / slice names (pie) |
| `title` | any | — | heading above the plot: string \| { text, font } |
| `titleposition` | string | `''` | '' above the plot \| 'bottom' |
| `subtitle` | any | — | muted line under the title: string \| { text, font } |
| `legendtitle` | string | `''` | heading of the legend (or legend.title) |
| `xtype` | string | `''` | '' category \| 'datetime' \| 'linear' (continuous x for line/area) |
| `xformat` | function | — | (x) => string; custom x-axis tick label (datetime/linear) |
| `xtitle` | string | `''` | x-axis title (or xaxis.title) |
| `ytitle` | string | `''` | y-axis (left) title (or yaxis.title) |
| `y2title` | string | `''` | secondary y-axis (right) title (or y2axis.title) |
| `xaxis` | object | — | bottom axis { title?, titlefont?, font?, labels?, grid?, reverse? } — font = its tick labels; labels: false hides them; grid = its vertical lines |
| `yaxis` | object | — | left axis { title?, titlefont?, font?, labels?, grid?, reverse? } — grid = the horizontal lines |
| `y2axis` | object | — | right axis { title?, titlefont?, font?, labels?, reverse? } (falls back to yaxis fonts and reverse) |
| `x2axis` | object | — | top axis of horizontal bars (the axis: 'right' series) { title?, titlefont?, font?, labels?, reverse? } (falls back to xaxis fonts) |
| `raxis` | object | — | radar: the radial axis { min?, max?, step?, reverse?, labels?, font?, ticks?, tickfont?, grid?, spokes? } |
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
| `legend` | any | — | show the legend (default on): boolean \| { show?, position?, title?, font?, titlefont? } |
| `legendposition` | string | `''` | '' auto \| 'top' \| 'bottom' \| 'left' \| 'right' (or legend.position) |
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
| `ystep` | number | — | distance between the y ticks (auto if unset) |
| `yreverse` | boolean | `false` | reverse the y (left) axis: values grow downwards; horizontal bars: first category at the bottom (or yaxis.reverse) |
| `xmin` | number | — | scatter/bubble: force the x-axis lower bound (auto if unset) |
| `xmax` | number | — | scatter/bubble: force the x-axis upper bound (auto if unset) |
| `bins` | number | — | histogram only: bin count (unset = Sturges' rule) |
| `binwidth` | number | — | histogram only: fixed bin width from the minimum (wins over bins; at most 200 bins) |
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
