# LemonadeJS v6 (beta)

React-like patterns, ~5 KB gzip, zero dependencies, zero build step — designed to be the
framework agents can hold entirely in context. The complete API reference lives in
[llms.txt](llms.txt) (~2k tokens, made to be pasted into a prompt).

```ts
import { render, mount, type Component } from 'lemonadejs';

const Counter: Component<{ start?: number }> = (props, { state }) => {
    const count = state(props.start ?? 0);
    return render`<div>
        <p>${count}</p>
        <button onclick="${() => count.value++}">+1</button>
    </div>`;
};

mount(Counter, document.getElementById('app'));
```

## Architecture

One module per concern — each independently unit-testable:

| Module | Responsibility |
|---|---|
| `src/parser.ts` | Tagged-template strings → JSON tree. Runs **once per call site** (`TemplateStringsArray` identity is the cache key — minifier/transpiler-proof). |
| `src/reactivity.ts` | Fine-grained signals. `state()` + `Binding` with automatic dependency tracking; only computations that read a state re-run when it changes. |
| `src/runtime.ts` | Materializes trees into DOM. Every `${...}` slot owns a marker TextNode and its branch of entries: positional diff, detach-cache (show/hide reuses the same DOM), surgical updates — static siblings are never revisited. Components, props, lifecycle, `inspect()`. |
| `src/errors.ts` | Stable error codes (LJS-xxx) with one-line cause + fix; `explain(code)` returns long-form docs offline. Dev mode (`env.dev`) freezes state contents and warns about snapshot mistakes. |
| `src/test.ts` | The `lemonadejs/test` harness: render, query, snapshot, inspect, unmount — agents verify their own output headlessly. |
| `src/types.ts` | Public types: `Component<Props>`, `State<T>`, `Tools`, `View`. |
| `src/index.ts` | Public API: `render` tag (+ `html` alias), `mount`, `inspect`, `explain`, `env`. |

## Development

```bash
npm install
npm test            # vitest (jsdom)
npm run typecheck   # tsc strict
npm run build       # dist/: ESM + CJS + minified IIFE + d.ts, with a hard 8 KB gzip budget
```

v5 lives on the `v5` branch, following the repository's branch-per-version convention.
