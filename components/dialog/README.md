# `<Dialog />` — @lemonadejs/dialog

LemonadeJS dialog block — contract-verified, framework-agnostic.

**✓ verified** — 19 contract checks · framework-agnostic · zero dependencies beyond `@lemonadejs/modal`

## Overview

<Dialog /> — confirm / alert / prompt on the Modal primitive.

Faithful port of @lemonadejs/dialog (the v5 jdialog): a small centered
box over a backdrop with a title, a message, an OK button and — per the
exact v5 visibility rule — a Cancel button, plus the 'input' type that
adds a prompt field whose value reaches onconfirm. Like v5, nothing but
the buttons closes it (no Escape, no backdrop click).

v5 → v6 mapping: show(options) → api.open(options) (per-open overrides,
exactly v5's setProperties merge — and open() returns a Promise of
{ confirmed, value } as the modern surface); hide() → api.close()
(silent, fires no events, v5 parity); input → bind (two-way prompt
value); inputPlaceholder → placeholder; confirmLabel → confirmlabel
(v5 declared it but hardcoded "OK" in the template — honored here);
cancelLabel → cancellabel; type 'default' → ''. onconfirm receives the
prompt VALUE (v5 passed self so handlers read self.input). The v5
rootClass accumulation bug (' jdialog-alert' appended on every show)
is replaced by a data-type attribute.

## Install

```bash
npm install @lemonadejs/dialog
```

```js
import Dialog from '@lemonadejs/dialog';
import '@lemonadejs/dialog/style.css';
import '@lemonadejs/modal/style.css'; // composed primitive
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Dialog} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Dialog} />`                       // by value (no registration)
setComponents({ Dialog });               // then <Dialog /> by name anywhere
createWebComponent(Dialog);              // <lm-dialog> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bind` | string | — | Two-way bound value. `.set()` fires `onchange`; plain assignment is silent. two-way prompt value (v5: input) |
| `title` | string | `''` | bold first line |
| `message` | string | `''` | body text under the title |
| `type` | string | `''` | '' (confirm) | 'alert' | 'input' (v5: 'default') |
| `confirmlabel` | string | `"OK"` | OK button label (v5: confirmLabel, never rendered — fixed) |
| `cancellabel` | string | `"Cancel"` | Cancel button label (v5: cancelLabel) |
| `placeholder` | string | `"Value"` | prompt placeholder (v5: inputPlaceholder) |
| `cancel` | boolean | `true` | v5 rule: hides Cancel only on alert/input types |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onconfirm` — (value) — the prompt value ('' for other types)
- `oncancel` — Cancel button pressed

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const dialog = ref();
html`<${Dialog} ref="${dialog}" />`;
// dialog.current.open(...)  ·  dialog.current.close(...)
```

- `open()`
- `close()`

## Styling

All classes follow the `lm-dialog-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/dialog/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Dialog)`.
