# `<Contextmenu />`

Full v5 property parity: items with icons, shortcuts, tooltips, disabled
states, separators and nested submenus (pure CSS hover). MUI Menu review
added nothing — the v5 item model is richer.

## Snippet

```ts
import { html, mount } from 'lemonadejs';
import Contextmenu from './contextmenu';

let menu;
mount(() => html`<main>
    <div oncontextmenu="${(e) => menu.openAt(e)}">Right-click me</div>
    <${Contextmenu} ref="${(api) => (menu = api)}" options="${[
        { title: 'Open', icon: 'folder_open', shortcut: 'Ctrl+O', onclick: () => open() },
        { type: 'line' },
        { title: 'Export', submenu: [{ title: 'CSV' }, { title: 'JSON' }] },
    ]}" />
</main>`, document.getElementById('app'));
```

## Contract

| Key | Type | Notes |
|---|---|---|
| `options` | array | `ContextItem[]` — the default item set |
| `onopen` / `onclose` | events | |
| `api` | — | `open(items, x, y)`, `openAt(x, y \| event)`, `close()` via `ref` |

`ContextItem`: `title`, `icon` (material icon name), `shortcut`, `tooltip`,
`disabled`, `type: 'line'`, `submenu: ContextItem[]`, `onclick(e, item)`.
The v5 per-item `render()` DOM hook was dropped — compose components instead.

Dismissal: outside mousedown, Escape, or item click. Position is clamped to
the viewport.

Machine-readable: [contract.json](contract.json) · proof: [verify.json](verify.json) ·
types: [contextmenu.d.ts](contextmenu.d.ts) (generated)

## Styling

`lm-contextmenu-*` convention: `.lm-contextmenu`, parts
`-list/-item/-icon/-title/-shortcut/-arrow/-line/-submenu`, states
`-disabled/-parent`.
