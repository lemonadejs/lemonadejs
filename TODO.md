# TODO

Agreed work, in rough priority order. Done items get removed, not checked.

## Blocks / packaging

- [ ] **Browser IIFE build per block** — `dist/index.min.js` usable from a plain
      `<script>` tag like v5: global name (`Modal`, `Rating`, …), `lemonadejs`
      external mapped to the `lemonade` global, `@lemonadejs/*` deps mapped to
      their globals. Extend `scripts/build-components.js`.
- [ ] Publish pipeline: version bump + `npm publish` across `components/*`
      (workspaces or a script), engine first.
- [ ] More Studio blocks on the Modal primitive: dropdown, autocomplete,
      calendar; then datagrid.

## Modal (platform primitive)

- [ ] Scroll lock while a backdrop modal is open (MUI `disableScrollLock` gap).
- [ ] Focus trap: Tab cycles inside an open modal (a11y).
- [ ] `width`/`height` live while open (position already is).

## Engine

- [ ] Keyed list diff — the Contextmenu per-Level WeakMap view cache is the
      userland workaround; the engine should reuse component-bearing list
      entries that survived a re-render.
- [ ] `computed()` derived state.
- [ ] Error containment seam in `binding.run` (one bad binding must not take
      the app down).
- [ ] `trace()` — causality-as-data, dev-build only, armed by call.
- [ ] `resource()` async primitive; error boundary.

## Verification

- [ ] Chrome probes for the six new blocks (color spectrum sampling, tabs
      drag-reorder geometry, topmenu dropdown placement are jsdom-blind).
- [ ] Agent eval suite: tokens from intent to verified component (PAIN.md
      metric).

## Ecosystem

- [ ] adaptVue.
- [ ] MCP server exposing the registry (search/contract/verify per block).
- [ ] lemonadejs.com: pages for the 10 blocks (contract renderer = self
      generating API docs); llms.txt sync step.
