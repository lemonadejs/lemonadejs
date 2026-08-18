# `<Editor />` — @lemonadejs/editor

LemonadeJS editor block — rich text on the Toolbar block, CKEditor-style tables with resize handles, local print/PDF and Word export; contract-verified, framework-agnostic.

**✓ verified** — 19 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/toolbar`

## Overview

<Editor /> — a rich text editor built ON the Toolbar block (the bar is
a dependency, not a fork: the editor drives it through live item
mutations + api.refresh()). Contenteditable engine, semantic HTML out.

  - formatting: block styles (paragraph, headings, quote, code), bold /
    italic / underline / strikethrough, sub / superscript, text and
    highlight colors (the Color block panel, hosted by the Toolbar's
    color items), alignment, ordered / unordered lists, indent /
    outdent, links (inline balloon), inline images (file picker, paste
    and drop — stored as data URLs), horizontal rule, clear
    formatting, fullscreen
  - images are objects: click one (or Tab to it — images are
    focusable, focusing selects) for drag-resize — corner handles
    keep the aspect ratio, edge handles stretch width or height
    independently — and an alignment menu: wrap left / center / wrap
    right / inline, full width, remove; Delete removes the selection
  - tables, CKEditor-style: a hover grid picker inserts (keyboard
    too: arrows size the grid, Enter inserts, Escape closes); a floating
    balloon over the active table carries Row / Column / Cell menus
    (insert above/below/left/right, header row/column, delete), cell
    merge (drag across cells to select, or merge right/down), split,
    cell background color and table delete. Column boundaries, row
    boundaries and the table edge grow DRAG HANDLES for resizing —
    widths land on the colgroup, so they survive as plain HTML.
  - own undo/redo stack (snapshots, typing coalesced) — structural
    table surgery is undoable, which native execCommand undo never was
  - paste is sanitized to a semantic subset (Word/Docs noise dropped,
    script vectors removed) — raw paste with filterpaste="false"
  - output extensions, all local to the browser: DIRECT PDF generation
    (api.exportPDF — the built-in zero-dependency writer lays the
    content out and downloads real selectable-text PDF bytes), print
    through a staged print document (api.print), and Word export as an
    MHTML .doc download (api.exportWord)

Two-way value: bind carries the HTML (onchange fires per input); the
value prop seeds an unbound editor.

## Install

```bash
npm install @lemonadejs/editor
```

```js
import Editor from '@lemonadejs/editor';
import '@lemonadejs/editor/style.css';
import '@lemonadejs/toolbar/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Editor} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Editor} />`                       // by value (no registration)
setComponents({ Editor });               // then <Editor /> by name anywhere
createWebComponent(Editor);              // <lm-editor> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | string | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way HTML content (the value prop seeds it when unbound) |
| `value` | string | `''` | initial HTML when unbound |
| `placeholder` | string | `''` | hint shown while the editor is empty |
| `toolbar` | boolean | `true` | false hides the formatting bar |
| `height` | string | `''` | CSS height of the writing area ('' grows with content) |
| `readonly` | boolean | `false` | true locks editing (toolbar disabled, content selectable) |
| `filterpaste` | boolean | `true` | sanitize pasted HTML to the semantic subset |
| `acceptimages` | boolean | `true` | paste / drop / pick images as inline data URLs |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onfocus` — (e) the writing area gained focus
- `onblur` — (e) the writing area lost focus

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const editor = ref();
html`<${Editor} ref="${editor}" />`;
// editor.current.getData(...)  ·  editor.current.setData(...)  ·  editor.current.getText(...)  ·  editor.current.exec(...)  ·  editor.current.focus(...)  ·  editor.current.insertTable(...)  ·  editor.current.undo(...)  ·  editor.current.redo(...)  ·  editor.current.toggleSource(...)  ·  editor.current.print(...)  ·  editor.current.exportPDF(...)  ·  editor.current.exportWord(...)
```

- `getData()`
- `setData()`
- `getText()`
- `exec()`
- `focus()`
- `insertTable()`
- `undo()`
- `redo()`
- `toggleSource()`
- `print()`
- `exportPDF()`
- `exportWord()`

## Styling

All classes follow the `lm-editor-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/editor/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Editor)`.
