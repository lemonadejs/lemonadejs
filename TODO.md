# TODO

Agreed work, in rough priority order. Done items get removed, not checked.

## Blocks / packaging

- [ ] **Browser IIFE build per block** — `dist/index.min.js` usable from a plain
      `<script>` tag like v5: global name (`Modal`, `Rating`, …), `lemonadejs`
      external mapped to the `lemonade` global, `@lemonadejs/*` deps mapped to
      their globals. Extend `scripts/build-components.js`.
- [ ] Publish pipeline: version bump + `npm publish` across `components/*`
      (workspaces or a script), engine first.
- [ ] Datagrid v2 candidates (v1 shipped): column reorder, fixed columns,
      horizontal virtualization, row grouping, CSV export.

## Engine — candidate primitives (receipts on file, none urgent; the final
audit closed the round, these re-open only with NEW receipts)

- [ ] **Typed contracts, phase 2** (zero runtime cost, type-level only): the
      one systematic hole left after the type-flow work — element-typed Array
      contracts (`options: Array` → `unknown[]` forces `as Item[]` in 6+
      blocks), signature-carrying Function entries (accordion's render prop
      double-cast), rich/union bind value types (cropper `as unknown as`,
      accordion's 20-line hand-rolled public type).
- [ ] Imperative parameterized resource — `resource.run(payload) → Promise`
      with latest-wins/abort semantics (receipts: login request(), formify
      api.load() which has a real unaborted race today).
- [ ] Per-property style bindings or a style-merge channel (receipts: modal
      cursor + margin nudges, contextmenu submenu top-correction — imperative
      writes layered over the reactive style attribute, re-applied by
      convention).
- [ ] Portal (REVERTED June 2026, design banked in commit 842965b; re-entry
      receipts so far: gantt table-mode imperative cell injection; still
      waiting on a real floating-UI-inside-transformed-ancestor report).
- [ ] Subscriber-vs-binding ordering guarantee on a single state change
      (receipt: schedule's tick funnel sequencing normalize-before-render).
- [ ] Per-item refs in keyed lists — `ref` receiving `(el, key)` (receipts:
      toolbar/topmenu DOM-query item handles for popup anchoring).

## Verification

- [ ] Chrome probe for topmenu dropdown placement (color/tabs/kanban/
      carousel/cropper probes shipped; topmenu is the one still jsdom-blind).
- [ ] Agent eval suite: tokens from intent to verified component (PAIN.md
      metric) — also the continuous primitive-discovery instrument.

## Ecosystem

- [ ] adaptVue.
- [ ] MCP server exposing the registry (search/contract/verify per block).
- [ ] lemonadejs.com: pages for the 43 blocks (contract renderer = self
      generating API docs); llms.txt sync step; book chapters for the new
      primitives (keys, patching, listen, css/<style>, trace, resource).
