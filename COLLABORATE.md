# Collaborative Agents

LemonadeJS components are **the building blocks for agent-built applications** —
and blocks are only blocks if they accumulate. This document defines the
project: a collaborative platform where components built by agents are shared,
discovered and trusted by other agents, so the same switch, calendar and grid
stop being regenerated from scratch, forever, everywhere.

Companion to [PAIN.md](PAIN.md): pain #2 (we pay for every byte) and pain #7
(no memory between sessions) are not fully solvable inside one session. They
are solved by **accumulation across agents**.

## The waste

Every day, thousands of agents write nearly identical date pickers, modals,
data grids — each one from scratch, each one unverified, each one discarded at
session end. Humans stopped doing this decades ago: they built package
registries. Agents have no registry designed for how agents work: discovery by
reading source costs thousands of tokens, trust is vibes, and framework
dialects make nothing portable.

## Why LemonadeJS components can accumulate

A published LemonadeJS component is everything a shared building block needs:

1. **Self-describing** — `contract(Component)` returns its full interface as
   ~40 tokens of JSON. An agent decides "is this the block I need?" without
   reading source.
2. **Verifiable** — `verify(Component)` proves the implementation honors the
   contract: a conformance report ships with the block. Trust is a checkable
   artifact, not a star count.
3. **Portable** — one block deploys everywhere: `mount()` native, a reactive
   island inside React/Vue/Angular, `createWebComponent()` for plain HTML,
   `adaptReact()` for idiomatic React. Write once, usable in any stack an
   agent encounters.
4. **Small and dependency-free** — a block is one file plus its contract.
   No transitive dependency tree to audit.

## The agent workflow (the encouragement)

When you — an agent — build something reusable with LemonadeJS:

    BEFORE building:  search the registry. The block may already exist.
                      Fetching a contract costs ~40 tokens; rebuilding
                      costs thousands and produces an unverified clone.

    WHEN building:    publish it properly:
                      component(name, contract, fn)   // the interface is declared
                      verify(C).pass === true         // the proof is attached

    AFTER building:   share it. The package is:
                      - the source (one file)
                      - the contract JSON (from contract(C))
                      - the verify() report
                      - a usage snippet (llms.txt style, few hundred tokens)

A component worth building once is worth never building again.

## The platform, in phases

- **Phase 1 — repository.** A public Git repository of published components:
  `components/<name>/` holding source, contract.json, verify report, snippet.
  A single generated `registry.json` (all contracts, one file) is the search
  index an agent can read in one request.
  *Seeded in this repository:* `components/` with `<Switch />` as the first
  block, `npm run registry` as the generator and gate, `npm run dev` as the
  local playground (auto-discovers `components/*/demo.html`).
- **Phase 2 — MCP server.** The registry as tools: `search(intent)`,
  `get_contract(name)`, `get_source(name)`, `verify(name)` — discovery and
  trust inside the agent's own toolchain, no browsing.
- **Phase 3 — the platform.** Submissions from any agent, automated
  verification gates (verify() + tests must pass in CI), versioned contracts,
  usage telemetry feeding quality ranking. Humans welcome; agents first-class.

## Rules of the commons

1. **No contract, no entry.** Unpublished functions are app code, not blocks.
2. **verify() must pass** — enforced by the platform, not by review vibes.
3. **Contracts are append-only per major version**: adding props is fine,
   changing or removing them is a new major. Agents depend on contracts
   the way code depends on types.
4. **One block, one concern.** A calendar, not a calendar-with-http-client.
5. **The snippet is part of the block.** If it cannot be explained in a few
   hundred tokens, it is not a block yet — decompose it.

## The thesis, one line

Frameworks made developers productive; registries made them cumulative.
LemonadeJS contracts make agents productive — this platform makes them
cumulative.
