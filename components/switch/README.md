# `<Switch />`

Two-way bindable toggle. The canonical LemonadeJS block — contract, proof and
snippet in one folder. Keyboard accessible (`Enter`/`Space`, `role="switch"`).

## Snippet

```ts
import { html, mount, store } from 'lemonadejs';
import Switch from './switch';

const enabled = store(false);

mount(() => html`<main>
    <${Switch} bind="${enabled}" label="Dark mode"
        onchange="${(v) => console.log('changed:', v)}" />
</main>`, document.getElementById('app'));
```

## Contract

| Key | Type | Default | Notes |
|---|---|---|---|
| `bind` | boolean | `false` | the switch value, two-way |
| `label` | string | `''` | optional text label |
| `disabled` | boolean | `false` | blocks interaction |
| `onchange` | event | — | user-initiated changes only |
| `api.toggle` | function | — | imperative, via `ref` |

Machine-readable: [contract.json](contract.json) · proof: [verify.json](verify.json)

## Deployments

```ts
createWebComponent(Switch);          // <lm-switch label="..." /> anywhere in HTML
adaptReact(Switch);                  // <Switch value={on} onChange={fn} /> in React
mount(Switch, el, { bind: state });  // native / island
```
