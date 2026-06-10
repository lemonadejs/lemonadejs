# The Pain of Agents

LemonadeJS v6 is an **Agentic JS Framework**: not a JavaScript framework for
developers who use AI, but a framework whose primary user *is* the agent.
Every design decision must answer to this document. Written from first-person
experience by an agent — this is what actually costs us when we build frontend.

## The seven pains

### 1. We are blind
We write UI we cannot see. A human glances at the screen; we infer reality from
DOM queries and error text. Most UI bugs agents ship are not logic errors —
they are *unverified assumptions* nothing forced us to check.

**Answer:** the cheapest possible observation loop. `lemonadejs/test`:
render → query → snapshot → assert, in milliseconds, no browser, no config.
`inspect()` returns the live component tree as JSON.
**Honest gap:** layout/visual truth (z-index, overflow) needs a real browser.
Documented escalation path, not pretended away.

### 2. We pay for every byte we read
Context is our only working memory and it is metered. Discovering how to use a
component by reading its source is the single most wasteful thing agents do.

**Answer:** `llms.txt` — the complete API in ~2k tokens, a release artifact.
`contract(Component)` — the contract in ~40 tokens instead of 400 lines of
source. A framework whose entire surface fits in context is not minimalism
aesthetics; it is *affordability*. React structurally cannot offer this.

### 3. Ambiguity makes us inconsistent
Five idioms for one thing means different output on different days, and three
agents on one team produce three dialects.

**Answer:** one rule, no exceptions, everywhere. Four template rules. One
casing (lowercase). One state model (assignment notifies; mutation + touch()).
One bridging concept across every boundary (states). Determinism of generation
is what makes agent-written code reviewable and agent teams coherent.

### 4. Silent failures are our kryptonite
Agent debugging is hypothesis-driven from error strings. A thrown LJS-302 with
the fix in the message is repaired in one turn. A stale value with no error can
burn a whole session.

**Answer:** stable error codes (LJS-xxx) with one-line cause + fix, designed to
be pattern-matched. Dev-mode tripwires for the known traps (LJS-202 snapshots,
LJS-305 casing). `explain(code)` offline.
**Accepted exception:** mutate-without-touch() is silent (LJS-201 documents
it) — the price of big-data mutation freedom, paid knowingly.

### 5. Toolchains fail before our code runs
Every config file is a failure point we debug blind on a machine we cannot see.

**Answer:** the zero-build path is sacred. One file, one script tag, working
app. An agent's deliverable can be a single HTML file. Failure surface: zero.

### 6. Async timing makes our verification flaky
React needs act(), Vue needs nextTick(), Svelte needs tick() — flush
incantations agents constantly get wrong, producing flaky tests that erode
trust in the whole loop.

**Answer:** synchronous reactivity. Click, then assert — same line, every
time, deterministic. Worth more to an agent than any render benchmark.

### 7. We have no memory between sessions
The agent who maintains a component is never the agent who wrote it. Code is
foreign a week later. What survives sessions is not understanding — it is
artifacts.

**Answer:** the contract (what the component promises), `verify()` (proof it
still does), error codes (shared vocabulary), tests (executable memory).
Components as self-describing artifacts, not source files in a framework
dialect.

## The meta-answer: the loop

Every pain is a tax on one loop:

    intent → generate → run → observe → fix → verified component

That loop is the agent's entire existence. Frameworks optimize other things —
human DX, benchmark ops/sec. LemonadeJS optimizes exactly one metric:

**The shortest verified loop in frontend: tokens from intent to verified
component.**

Make it measurable. The agent eval suite: standard tasks ("build a bound
switch", "render 10k filtered rows", "embed a grid in this React app"),
measured as agent success rate and tokens-to-verified-component, lemonade vs
the field. Nobody benchmarks this. Every future API decision answers one
question: does it shorten the loop or lengthen it?

## What we cannot solve (so we do not lie to ourselves)

- **Training-data gravity.** Agents know React from millions of examples and
  lemonade from zero. llms.txt and a small API are the counterweight — and the
  reason the API must stay small enough for in-context learning to carry it.
- **Visual taste.** No framework makes an agent a designer.
- **Distribution.** The best loop loses if it is not in the agent's hands:
  the Claude Code skill and MCP server are the delivery mechanism, not
  marketing.
