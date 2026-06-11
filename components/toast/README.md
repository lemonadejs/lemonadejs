# `<Toast />` — @lemonadejs/toast

LemonadeJS toast block — contract-verified, framework-agnostic.

**✓ verified** — 11 contract checks · framework-agnostic · zero dependencies

## Overview

<Toast /> — transient notifications with a queue, modeled on MUI's
Snackbar + notistack on the v6 contract model.

The component is a HOST: mount it once, grab the api through props.ref
and fire toasts imperatively from anywhere:

  let toast;
  html`<${Toast} ref="${(api) => (toast = api)}" position="bottom-right" />`
  toast.success('Saved');
  toast.show('Reconnecting…', { duration: 0, action: { label: 'Retry', onclick: retry } });

Queue model: up to `max` toasts are visible at once; overflow waits in
an internal FIFO and is promoted when a visible toast finishes leaving.
Each toast auto-dismisses after its duration (host default 4000ms,
per-toast override, 0 = sticky until closed), then plays a 200ms leave
animation (data-leaving) before it is removed and onclose(message)
fires. Manual close (×), the action button and unmount all clear the
pending timers — destroy-clean. clear() drops everything at once,
silently (bulk reset, no onclose storm).

Severities (info | success | warning | error) share the alert block's
palette but the CSS is self-contained; no severity = the neutral dark
MUI Snackbar look.

## Install

```bash
npm install @lemonadejs/toast
```

```js
import Toast from '@lemonadejs/toast';
import '@lemonadejs/toast/style.css';
```

## Usage

```js
import { html, mount } from 'lemonadejs';

const App = () => html`<div>
    <${Toast} />
</div>`;

mount(App, document.getElementById('root'));
```

Three deployment forms, one component:

```js
html`<${Toast} />`                       // by value (no registration)
setComponents({ Toast });               // then <Toast /> by name anywhere
createWebComponent(Toast);              // <lm-toast> in plain HTML/any framework
```

## Props

Every declared prop arrives as a **live state** — pass a value for a snapshot or a
state for a two-way live wire. Attribute strings are coerced to the declared type.

| Prop | Type | Default | Description |
|---|---|---|---|
| `position` | string | `''` | '' = bottom-left | bottom-right | top-left | top-right |
| `duration` | number | `4000` | default auto-dismiss ms; 0 = sticky |
| `max` | number | `5` | visible at once; overflow queues |
| `closable` | boolean | `true` | × button on each toast |

## Events

All event names are lowercase (the platform convention — LJS-305 warns otherwise).

- `onclose` — (message) when one toast is dismissed

## API (via `ref`)

```js
import { ref } from 'lemonadejs';
const toast = ref();
html`<${Toast} ref="${toast}" />`;
// toast.current.show(...)  ·  toast.current.success(...)  ·  toast.current.error(...)  ·  toast.current.warning(...)  ·  toast.current.info(...)  ·  toast.current.clear(...)
```

- `show()`
- `success()`
- `error()`
- `warning()`
- `info()`
- `clear()`

## Styling

All classes follow the `lm-toast-*` convention; visual variants are `data-*`
attributes on the root. Override freely — there is no styling engine to fight.

## Contract

The machine-readable schema ships with the package:

```js
import contract from '@lemonadejs/toast/contract.json';
```

`verify.json` carries the conformance proof produced by `verify(Toast)`.
