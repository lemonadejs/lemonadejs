# `<Modal />`

Full v5 property parity plus MUI Dialog's `fullscreen`. Draggable, resizable,
minimizable, layered, with origin-aware close events.

## Snippet

```ts
import { html, mount } from 'lemonadejs';
import Modal from './modal';

let modal;
mount(() => html`<main>
    <button onclick="${() => modal.open()}">Open</button>
    <${Modal} ref="${(api) => (modal = api)}" title="Hello" backdrop closable draggable
        onclose="${(origin) => console.log('closed via', origin)}">
        <p>Content goes here as children.</p>
    </${Modal}>
</main>`, document.getElementById('app'));
```

## Contract

| Key | Type | Default | Notes |
|---|---|---|---|
| `bind` | boolean | — | the OPEN state (v5: `closed`, inverted) |
| `title` | string | `''` | header title |
| `width` / `height` | number | `0` | px; 0 = auto |
| `top` / `left` | number | `0` | px, for `position="absolute"` |
| `position` | string | `''` | `center` \| `left` \| `right` \| `bottom` \| `absolute` |
| `backdrop` | boolean | `false` | dim the page (click closes when closable) |
| `closable` | boolean | `false` | × button + Escape + backdrop click |
| `draggable` | boolean | `false` | move by the header |
| `resizable` | boolean | `false` | corner handle |
| `minimizable` / `minimized` | boolean | `false` | – button / initial state |
| `fullscreen` | boolean | `false` | MUI: cover the viewport |
| `autoclose` | boolean | `false` | close on focusout (v5: `auto-close`) |
| `autoadjust` | boolean | `false` | clamp into viewport on open (v5: `auto-adjust`) |
| `focus` | boolean | `true` | focus the modal when opened |
| `overflow` | boolean | `false` | scroll oversized content |
| `responsive` | boolean | `true` | small screens: full width |
| `layers` | boolean | `false` | bring to front on mousedown |
| `url` | string | `''` | load remote content on first open |
| `onopen` / `onclose(origin)` / `onmove(x,y)` / `onresize(w,h)` | events | — | |
| `api` | — | — | `open()`, `close()`, `toggle()`, `front()`, `back()` via `ref` |

Origins reported by `onclose`: `button`, `backdrop`, `escape`, `focusout`, `api`.

Machine-readable: [contract.json](contract.json) · proof: [verify.json](verify.json) ·
types: [modal.d.ts](modal.d.ts) (generated)

## Styling

`lm-modal-*` convention: `.lm-modal`, `.lm-modal-root[data-position]`,
parts `-backdrop/-header/-title/-controls/-content/-resizer`, states
`-minimized/-fullscreen/-responsive/-overflow`.
