# LemonadeJS v6 (beta)

**The contracted, machine-checkable component system.** Components are
published with a typed schema and proven against it — `verify()` returns the
proof as JSON. The engine underneath is 9.3 KB gzip, zero dependencies, zero
build step, and the complete API fits in [llms.txt](llms.txt) (~2k tokens,
made to be pasted into a prompt).

## The loop

A component, its machine-readable interface, and its proof — one breath:

```ts
import { html, component, contract } from 'lemonadejs';
import { verify } from 'lemonadejs/test';

const Switch = component('switch', {
    bind: false,                // two-way bound state
    label: '',                  // declared props arrive as LIVE states
    onchange: Function,
    api: { toggle: Function },
}, (props, { bind }) => {
    const checked = bind(props, false);
    const toggle = () => checked.set(!checked.value);
    props.ref?.({ toggle });
    return html`<div class="switch ${() => (checked.value ? 'on' : 'off')}"
        onclick="${toggle}">${props.label}</div>`;
});

contract(Switch);   // → { name, props: { label: { type: 'string', ... } }, bind, events, api }
                    //   the schema an agent reads INSTEAD of the source

verify(Switch);     // → { pass: true, checks: [ 'mounts with defaults',
                    //     'prop label', 'prop label (live state)', 'event onchange',
                    //     'bind', 'api via ref' ] }
                    //   conformance, not vibes — any LJS warning fails it
```

That loop is the design center: the shortest *verified* path from intent to
working component, whether the author is a human or an AI agent. 43 building
blocks ship this way in [`components/`](components/) — every one gated by its
`verify()` report (`contract.json` + `verify.json` are build artifacts, and
the registry refuses anything that fails).

One declaration, every deployment: embed by value (`<${Switch} />`), register
by name (`<Switch />`), a real custom element (`<lm-switch>` — live
attributes, element properties, CustomEvents, all derived from the contract),
or idiomatic React via `adaptReact()`.

## The engine

```ts
import { html, mount, type Component } from 'lemonadejs';

const Counter: Component = (props, { state }) => {
    const count = state(0);
    return html`<div>
        <p>${count}</p>
        <button onclick="${() => count.value++}">+1</button>
    </div>`;
};

mount(Counter, document.getElementById('app'));
```

Four template rules, fine-grained signals, and a set of tools that make
whole bug classes unwritable rather than discouraged:

- **Keys + live patching** — `key="${item.id}"` moves DOM *and* component
  state on reorder; changed values patch living instances instead of
  rebuilding them; `touch()` reaches components holding the same reference.
- **`listen()`** — listeners the component owns: removed on unmount,
  armable mid-gesture. A forgotten `removeEventListener` cannot be written.
- **`resource()`** — tracked fetch lifecycle: stale requests abort, only
  the latest response lands, unmount kills zombies.
- **`trace()`** — causality as data (dev builds): every write, who wrote
  it, which bindings re-ran — plain JSON, no devtools UI required.
- **Errors that teach** — stable `LJS-xxx` codes with the fix in the
  message, `explain(code)` offline, and containment: one throwing
  expression never takes down the update pass.
- **Single-file components** — `<style>` inside `html` is hoisted and
  injected once per template; `css()` builds style values with typed keys.

## Verification culture

Nothing in this README is a promise; everything is enforced by the build:

| Gate | Count |
| --- | --- |
| jsdom behavior tests | 1,051 |
| Real-Chrome geometry probes (`npm run probe`) | 62 |
| Demo smoke probes — every block page, zero exceptions (`npm run probe:demos`) | 43 |
| Contract-verified blocks (`npm run registry` — failing `verify()` = exit 1) | 43 |
| Engine budget (hard, build fails over it) | 10 KB gzip |

## Development

```bash
npm install
npm test                  # vitest (jsdom)
npm run typecheck         # tsc strict — engine, blocks and tests
npm run build             # dist/: ESM + CJS + IIFE + d.ts, 10 KB gzip budget
npm run dev               # localhost:3000 — the 43-block catalog, live source
npm run registry          # contract.json + verify.json + d.ts per block, gated
npm run probe             # real-Chrome geometry probes (needs npm run dev)
npm run probe:demos       # every demo page loads with zero exceptions
```

Docs: [lemonadejs.com/docs](https://lemonadejs.com/docs) — written as a book,
including [when *not* to use LemonadeJS](https://lemonadejs.com/docs/when-not).
v5 lives on the `v5` branch (branch-per-version convention).
