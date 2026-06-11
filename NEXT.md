# NEXT — the road to v6.0

Written June 11, 2026, at the close of the core-engineering phase. This file
is the session-connection point: state, plan, and the context a fresh
session (human or agent) needs to continue without re-deriving anything.

---

## Where things stand

The core is **shipped and frozen**:

| Surface | State |
| --- | --- |
| Engine | 9.3 KB gzip (10 KB budget), complete: templates, signals, contracts, keys + live prop patching + touch propagation, `listen()`, `css()` + `<style>` hoisting, `resource()`, `trace()` + LJS-205 containment |
| Blocks | 43, all contract-verified (registry gate), per-NPM-package layout |
| Verification | 1,050 jsdom tests · 62 real-Chrome geometry probes (`npm run probe`) · 43 demo smoke probes (`npm run probe:demos`) · tsc strict clean |
| Site (lemonadejs.com, branch v6-beta) | The Book complete (incl. lists/styling/async/debugging chapters), three-column docs layout, playground (9 examples, trace tab, explain() inline), redesigned home — 211 pages, probe-verified |
| llms.txt | The agent-facing API artifact, synced to the site |

**The final audit round is CLOSED** (commit `c1ce98b`): every workaround in
the catalog is either deleted, replaced by a primitive, or documented
in-source as deliberate. Engine changes re-open only on NEW receipts.

---

## The plan, in order

### 1. The ship train — publish pipeline  ← NEXT

Everything documented points at unpublished packages (`lemonadejs@6`,
`@lemonadejs/*` — jsdelivr URLs in llms.txt 404 today; the home page once
shipped a silent failure because of this). Deliverables:

- [ ] Per-block browser IIFE builds (`dist/index.min.js`, global names,
      `lemonadejs` external → `lemonade` global) — extend
      `scripts/build-components.js`
- [ ] Version alignment engine + 43 packages; publish order: engine first
- [ ] `6.0.0-beta.1` to npm under the `next` dist-tag (v5 users untouched)
- [ ] Sync script for the manual copies that can drift: site `public/llms.txt`,
      site `public/lemonade.mjs` (playground + home page engine)

### 2. The agent eval suite — launch QA and launch story

Agents receive component specs cold with llms.txt as their ONLY
documentation; measure tokens-to-verified-component and LJS codes hit
(the PAIN.md metric). Produces: the measurable launch claim with
transcripts, a final docs-gap pass, and the PERMANENT primitive-discovery
instrument — receipts come from eval data from here on.

### 3. Discovery surfaces — Studio pages + MCP server

- lemonadejs.com pages for the 43 blocks, GENERATED from `contract.json`
  (the contract renderer — docs as projections of the schema, never
  hand-written, cannot go stale)
- MCP server over the same registry: search blocks, read a contract,
  fetch the verify proof (COLLABORATE.md phase 2)

### 4. The quality tail (alongside or after)

- Accessibility pass (deliberately parked — behavior-changing): card
  keyboard activation, tabs roving tabindex, rating/signature/color roles,
  Modal `role` pass-through prop
- Modal scroll-lock + dialog-mode focus trap
- Chrome probes for jsdom-blind newer blocks (kanban drag, carousel swipe,
  color spectrum sampling, tabs drag-reorder, topmenu placement)
- adaptVue

Then **v6.0**: drop the beta tag, announce with the eval numbers, the
Book, and the playground as the receipts.

---

## Standing disciplines (do not relitigate)

- **Receipts first**: engine primitives need evidence, not ranking.
  Portal was shipped speculatively and reverted for exactly this
  (design banked in commit `842965b`; re-entry receipts tracked in TODO.md).
- **Lean is the product**: "agents trust and choose lemonade over react,
  and there is a WHY" — value per KB is the bar; budget 10 KB gzip.
- **Neutral docs**: never frame other frameworks negatively; describe
  mechanisms factually. LemonadeJS's positioning: small footprint, fits
  the agent, fewer tokens, errors minimized so agents are assertive.
- **Two-layer verification**: jsdom for logic, real Chrome for geometry —
  and now demo smoke probes for page-level integration (the bind+value
  crash lived exactly in the unprobed gap).
- **Docs stay clean** (no app chrome in chapters); home page carries the
  visual ambition, CSS-only motion, no animation frameworks.

## Parked engine candidates (receipts on file in TODO.md)

Typed contracts phase 2 (element-typed Array / signature-carrying
Function / rich bind — the one systematic type hole left, zero runtime
cost) · imperative `resource.run(payload)` (login/formify receipts) ·
style-merge channel (modal nudges) · portal (gantt table-injection is
receipt #1) · subscriber-vs-binding ordering guarantee (schedule tick) ·
per-item refs in keyed lists (toolbar/topmenu anchors).

## Session context — where everything lives

- **Library**: `D:\phpstorm\lemonadejs\lemonadejs`, branch `v6-beta`.
  `npm run dev` (:3000 block catalog) · `test` · `probe` · `probe:demos` ·
  `registry` · `build` · `build:components` · `typecheck`
- **Site**: `D:\phpstorm\lemonadejs\lemonadejs.com`, branch `v6-beta`.
  `npm run dev` (:4321) · `build` · `preview`;
  `scripts/probe-playground.mjs` + `scripts/probe-home.mjs` (run against
  `astro preview --port 4321`)
- **Design history**: PAIN.md (agent pains + the loop metric),
  COLLABORATE.md (platform phases), TODO.md (work queue + parked
  candidates with receipts), llms.txt (the API, source of truth for docs)
- **The recurring high-yield question**: "in v5 I would just…" — Paul's
  v5 habit-memories found gaps every audit missed (touch propagation came
  from one). Ask it when stuck.
