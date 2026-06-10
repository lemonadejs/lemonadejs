# `<Switch />`

Two-way bindable toggle on a real `<input type="checkbox">` — native form
participation, native disabled, native keyboard accessibility. The canonical
LemonadeJS block: contract, proof, types and snippet in one folder. Full
property parity with the v5 plugin plus the best of MUI's Switch.

## Snippet

```ts
import { html, mount, store } from 'lemonadejs';
import Switch from './switch';

const enabled = store(false);

mount(() => html`<main>
    <${Switch} bind="${enabled}" label="Dark mode" color="purple" size="large"
        onchange="${(v) => console.log('changed:', v)}" />
</main>`, document.getElementById('app'));
```

## Contract

| Key | Type | Default | Notes |
|---|---|---|---|
| `bind` | boolean | — | the live two-way state (wins when present) |
| `checked` | boolean | `false` | the INITIAL state when unbound |
| `label` | string | `''` | text beside the switch (`.lm-switch-label`) |
| `color` | string | `''` | `green` (default) \| `orange` \| `red` \| `purple` |
| `size` | string | `''` | `small` \| `large` |
| `name` | string | `''` | form identification name (on the input) |
| `value` | string | `''` | form submit value when on (DOM semantics) |
| `required` | boolean | `false` | native form validation |
| `disabled` | boolean | `false` | native, blocks interaction |
| `position` | string | `''` | `right` moves the label before the track |
| `onchange` | event | — | user-initiated changes only |
| `api.toggle` | function | — | imperative, via `ref` |

`bind` vs `checked` vs `value` — closer, but different, by design: `bind` is
the live state, `checked` is the initial fallback, `value` is the string a
form submits (exactly like a native checkbox).

Machine-readable: [contract.json](contract.json) · proof: [verify.json](verify.json) ·
types: [switch.d.ts](switch.d.ts) (generated from the contract)

## Styling

All hooks follow the `lm-switch-*` convention: `.lm-switch`, states
`.lm-switch-on/off/disabled`, sizes `.lm-switch-small/large`, parts
`.lm-switch-input/track/thumb/label`, plus `[data-color]` and `[position]`
attributes.

## Deployments

```ts
createWebComponent(Switch);          // <lm-switch label="..." /> anywhere in HTML
adaptReact(Switch);                  // <Switch checked label="..." /> in React
mount(Switch, el, { bind: state });  // native / island
```
