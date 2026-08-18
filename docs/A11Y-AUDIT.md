# WCAG 2.1 AA static audit — v6 blocks

> **Remediation status (2026-08-11):** a remediation pass was completed the
> same day. All 15 blockers and the large majority of serious/minor findings
> below are FIXED, with 146 new tests covering the added keyboard paths and
> ARIA wiring (suite: 1473 passing, typecheck clean). The findings below are
> kept as the original audit record. Remaining known gaps:
>
> - **login** — the image captcha still has no non-visual alternative
>   (needs a server-side audio/text challenge). Inline error text for blur
>   validation also deferred (aria-invalid is wired; visible text is a
>   design decision).
> - **signature** — drawing remains a path-of-movement input; a typed
>   alternative is the host application's responsibility (documented in the
>   block README). A keyboard-operable clear button was added.
> - **treeview** — drag reorder has no keyboard alternative yet (the
>   three-mode drop semantics need interaction design first).
> - **gantt** — dependency *drawing* is still pointer-only (removal works by
>   keyboard; dependencies can also be set via data). No non-drag pointer
>   editing path (2.5.7) beyond `onclick` hosts wiring their own editor.
> - **toolbar** — items with neither `title` nor `tooltip` remain unnamed
>   (needs a new prop; API decision).
> - **charts** — cartesian zoom drag-select / navigator dragging stay
>   mouse-only (reset button + keyboard data access provide the alternative).
> - **backdrop** — obscured page content remains AT-reachable (managing
>   `inert` on arbitrary siblings is outside the component's scope).
> - **editor** — table column/row drag-resize and mouse-drag merge selection
>   keep pointer-only paths (balloon menu items cover merge).
>
> Still not covered by any static pass: screen-reader behavior testing,
> color-contrast measurement, 200%-zoom/reflow, touch-target sizes.

**Date:** 2026-08-11
**Method:** Static source review of every block (`components/<name>/src/index.ts` +
`style.css`) against WCAG 2.1 AA and the WAI-ARIA Authoring Practices patterns,
performed by five parallel reviewers split by component family. Every finding
cites the line that proves it.

**Limitations:** This is a code audit, not a full conformance assessment. It does
not include screen-reader testing (NVDA/JAWS/VoiceOver), color-contrast
measurement, 200%-zoom/reflow testing, or user testing. Findings marked here as
"OK" mean no statically detectable failure, not certified conformance.

**Severity:** `blocker` = fails a Level A criterion for a core use of the block ·
`serious` = fails AA or partially fails A · `minor` = best-practice gap.

## Summary

| | blocker | serious | minor |
|---|---|---|---|
| Overlays & feedback | 0 | 13 | 9 |
| Menus & navigation | 2 | 12 | 9 |
| Form controls | 4 | 11 | 12 |
| Data entry & display | 4 | 15 | 11 |
| Boards, media & charts | 5 | 15 | 8 |
| **Total** | **15** | **66** | **49** |

**Blockers (fix first):** navbar href-less links unfocusable · tabs add-button
mouse-only · dropdown missing all combobox/listbox ARIA · color selection
pointer-only · calendar grid has no grid semantics or AT-visible cursor · login
href-less links unfocusable · datagrid sort mouse-only · editor table-size
picker mouse-only · cropper crop box pointer-only · list interactive rows
keyboard-dead · kanban card drag has no keyboard path · kanban card click
keyboard-dead · schedule event create/move/resize/edit mouse-only · gantt all
edits mouse-only · imagelist interactive tiles keyboard-dead.

**Cross-cutting themes:**
1. **Pointer-only interactions (2.1.1)** — drag/resize/sort/pick surfaces with
   no keyboard alternative. The dominant failure class.
2. **Focus not restored on close (2.4.3)** — Modal (and everything composed on
   it), contextmenu, quickmenu, topmenu, toolbar popups never return focus to
   the trigger.
3. **State invisible to AT (4.1.2)** — active/selected/sort state conveyed by
   CSS class or `data-*` only; no `aria-activedescendant` on composite widgets
   (calendar, datagrid, contextmenu, wheel).
4. **Missing accessible names (4.1.2/3.3.2)** — icon-only buttons falling back
   to icon-font ligature text; unnamed dialogs; placeholder-as-label inputs.
5. **`outline: none` without replacement (2.4.7)** — button, dialog footer,
   actionsheet options, schedule root, contextmenu wrapper.

Cleanest blocks: **rating**, **formify**, **charts** (cartesian), **accordion**,
**toolbar** (pattern itself), **carousel** (pattern itself), **transferlist**
(operations), **alert**, **slider**, **switch**, **toggle**, **buttongroup**.

---

## Overlays & feedback

### modal
- [serious] 2.4.3 — No focus restore on close: `setup()` focuses the panel but `doClose()` never saves/restores `document.activeElement`; affects all Modal-based overlays (src/index.ts:196)
- [serious] 4.1.2 — `role="dialog"` name comes only from `aria-label="${title || false}"`; empty title → unnamed dialog, no `aria-labelledby` fallback (src/index.ts:651)
- [serious] 2.1.1 — Drag and resize are mouse-only; `onKey` handles only Escape/Tab (src/index.ts:569)
- [minor] 2.4.7 — `outline: none` on the panel; focus ring gated behind opt-in `data-outline` (src/style.css:97)
- Correct: `aria-modal`, initial focus, Tab trap incl. shift-Tab, Escape when closable, labeled close button, `prefers-reduced-motion`.

### dialog
- [serious] 2.4.7 — `.lm-dialog-footer input { outline: none; }` kills focus indicator on OK/Cancel/prompt input with no replacement (src/style.css:59)
- [serious] 4.1.2 — Unnamed modal dialog: no `title` passed to Modal; visible title div not wired via `aria-labelledby` (src/index.ts:130)
- [minor] 1.3.1 — Message not associated via `aria-describedby` (src/index.ts:133)
- [minor] APG — Escape never closes (`closable` not passed; deliberate v5 parity) (src/index.ts:130)
- [minor] 3.3.2 — Prompt input labeled by placeholder only (src/index.ts:139)

### drawer
- [serious] 4.1.2 — Default empty `title` → header-less drawer AND unnamed `role="dialog"` (src/index.ts:35)
- Correct: Escape/backdrop close by default; trap/initial focus via Modal. Inherits Modal focus-restore gap.

### actionsheet
- [serious] 4.1.2 — Unnamed modal dialog; sheet title is a plain div (src/index.ts:89)
- [serious] 2.1.2 — Default `closable: false` disables Escape and backdrop-click while the Tab trap is active and picks don't auto-close: no component-provided way out (src/index.ts:45)
- [serious] 2.4.7 — `outline: none` on options; `:focus-visible` replacement is a ~1.03:1 background change (src/style.css:72)
- Correct: options are real `<button>`s.

### backdrop
- [serious] 2.1.1 — `closable` dismissal is pointer-only (`onclick`, no Escape) (src/index.ts:77)
- [minor] 2.4.3 — Blocks pointer access but obscured content stays keyboard/AT reachable (no `inert`/`aria-hidden`) (src/index.ts:72)

### toast
- [serious] 2.2.1 — 4000ms auto-dismiss with no pause-on-hover/focus, incl. toasts carrying action buttons; `duration: 0` is developer-only (src/index.ts:117)
- [minor] 4.1.3 — `role="status"` on the inserted item, not on the persistent host: pre-populated live regions announce unreliably (src/index.ts:197)
- [minor] 4.1.3 — Error toasts use polite `role="status"` instead of `role="alert"` (src/index.ts:197)

### alert
- [minor] 4.1.3 — `role="alert"` hardcoded for all severities incl. info/success (src/index.ts:49)
- Otherwise OK: labeled close, `aria-hidden` icon, focus-visible outlines.

### tooltip
- [serious] 1.3.1/4.1.2 — No `aria-describedby` wiring; popper has `role="tooltip"` but no id and no trigger association (src/index.ts:137)
- [serious] 1.4.13 — Not hoverable: `pointer-events: none` + 8px gap + hide on wrapper `mouseleave` (src/style.css:17)
- [minor] 1.4.13 — Escape dismissal doesn't `stopPropagation`; also closes ancestor overlays (src/index.ts:134)
- Correct: focusin/focusout parity, Escape-dismissible, persistent.

### progress
- [minor] 4.1.2 — Correct progressbar value semantics but no accessible-name mechanism (src/index.ts:89)

## Menus & navigation

### contextmenu
- [serious] 1.3.1/4.1.2 — Invalid menu structure: `role=menu` wrapper owning Modal divs each with another `role=menu` (src/index.ts:371,376)
- [serious] 4.1.2 — Arrow-key cursor is visual-only (CSS class); no `aria-activedescendant`, no item ids (src/index.ts:333)
- [serious] 2.4.3 — Close never restores focus to the invoker (src/index.ts:82-103)
- [minor] 4.1.2 — Disabled items lack `aria-disabled` (src/index.ts:333)
- [minor] 2.1.1 — No Space activation, no Home/End (src/index.ts:261)
- [minor] 2.4.7 — `outline/box-shadow: none` on the focused wrapper (src/style.css:12)

### quickmenu
- [serious] 2.4.3 — Focus not returned to trigger header after close (src/index.ts:111; via contextmenu)
- Correct: trigger `role=button`, `aria-haspopup`/`aria-expanded`, Enter/Space/ArrowDown open, focus-visible outline.

### speeddial
- [serious] 4.1.2 — `role=menu/menuitem` without the menu keyboard model; all actions `tabindex="0"` (src/index.ts:116,132)
- [serious] 2.4.3/4.1.2 — Close leaves focus inside an `aria-hidden`, `opacity:0` container (src/index.ts:73)
- [serious] 1.4.13 — Hover-opened fan not dismissible without moving the pointer (Escape needs focus inside) (src/index.ts:114)
- [minor] 4.1.2 — Empty `label` → FAB named by icon ligature text (src/index.ts:117)

### navbar
- [blocker] 2.1.1/4.1.2 — href-less `<a>` with click handlers: not focusable, no link role; the documented "drive in-app state" use is keyboard-unreachable (src/index.ts:32-40)

### topmenu
- [serious] 2.4.3 — Escape in the open dropdown bypasses `close()`, stranding focus on the contextmenu wrapper (src/index.ts:107)
- [minor] 1.3.1 — `role=menubar` doesn't directly own its menuitems (src/index.ts:207)
- [minor] 2.4.3 — Per-item `tabindex="0"` instead of roving tabindex (src/index.ts:200)
- [minor] 2.1.1 — No Space activation, no ArrowDown/Up to open submenu (src/index.ts:140)

### toolbar
- [serious] 2.4.3 — Closing picker dropdown / color popover loses focus (src/index.ts:202,387)
- [minor] 4.1.2 — Icon-only items without `title`/`tooltip` have no accessible name (src/index.ts:356)
- Correct otherwise: full APG toolbar (roving tabindex, Arrow/Home/End wrap, aria-pressed/expanded/haspopup/disabled).

### tabs
- [blocker] 2.1.1 — Add-tab control is `<div role="button">` with no tabindex/key handler (src/index.ts:406)
- [serious] 1.3.1/4.1.2 — No tabpanel wiring: no `aria-controls`/ids on tabs; panels lack `role=tabpanel`/`aria-labelledby`/`tabindex=0` (src/index.ts:394,411)
- [serious] 2.1.1 — Reorder is drag-only; no keyboard alternative (src/index.ts:297)
- [minor] 1.3.1 — `role=tablist` contains non-tab children (scroll buttons, `<ul>`, add button) (src/index.ts:371)

### accordion
- [serious] 2.4.3 — Collapsed bodies hidden only by `grid-template-rows:0fr`; focusables inside stay in Tab order (src/style.css:80)
- Correct otherwise: native button headers, `aria-expanded`/`aria-controls`, `role=region`, arrow navigation, reduced-motion.

## Form controls

### button
- [serious] 2.4.7 — `.lm-button { outline: none; }` in shared catalog stylesheet with no `:focus-visible` replacement (components/style.css:583)
- [serious] 4.1.2 — No aria-label passthrough; icon-only name is the ligature text; icon not `aria-hidden` (src/index.ts:18-29,55)
- [minor] 4.1.2 — Loading spinner leaves the button nameless; no `aria-busy` (src/index.ts:50)

### buttongroup
- [minor] 4.1.2 — Icon-only options and the `role="group"` container lack name mechanisms (src/index.ts:96,100)
- Correct: native buttons, `aria-pressed`, native disabled, focus-visible ring.

### switch
- [minor] 4.1.2 — No aria-label passthrough when `label` empty; no `role="switch"` (src/index.ts:48)
- Correct: real checkbox in a `<label>`, native semantics, focus-visible ring.

### toggle
- [minor] 4.1.2 — No aria-label passthrough; no `aria-pressed`/switch semantics for the pressed presentation (src/index.ts:36)

### dropdown
- [blocker] 4.1.2 — No combobox/listbox ARIA at all: bare divs for trigger/search/list/options; no `aria-expanded`/`aria-activedescendant`/`role=option`/`aria-selected` (src/index.ts:687-721)
- [serious] 4.1.2/3.3.2 — No accessible-name mechanism; placeholder sits on a div (src/index.ts:720)
- [minor] 4.1.2 — Search is a `contenteditable` div, not an `<input>` (src/index.ts:714)
- Correct: keyboard model complete per APG (open/navigate/select/Escape).

### color
- [blocker] 2.1.1 — Selection is pointer-only: palette cells click-only, spectrum canvas mouse/touch-only; keyboard can open/commit/close but never change the color (src/index.ts:274,289,174)
- [serious] 4.1.2 — `role="grid"` declared with no focus management (src/index.ts:269)
- [serious] 4.1.2/3.3.2 — Input type has placeholder-only labeling, no `aria-expanded`/`haspopup` (src/index.ts:323)
- [minor] 1.1.1 — Spectrum canvas has no text alternative (src/index.ts:289)
- [minor] 4.1.2 — Tabs without tablist keyboard nav or tabpanel (src/index.ts:303)

### rating
- OK — correct slider pattern: `role="slider"`, `aria-valuemin/max/now`, aria-label fallback, arrow keys, `aria-hidden` stars.

### slider
- [minor] 4.1.2 — Empty `label` → thumb has no accessible name (src/index.ts:225)
- Correct: full slider semantics + Arrow/Home/End/PageUp/PageDown, focus-visible box-shadow.

### wheel
- [serious] 4.1.2 — Listbox container focus with no option ids/`aria-activedescendant`; selection invisible to AT (src/index.ts:221,234)
- [minor] 4.1.2 — No name mechanism for the listbox (src/index.ts:221)

### calendar
- [blocker] 4.1.2/1.3.1 — Day/month/year cells are bare divs: no grid semantics, no date labels, state as `data-*` only; no `aria-activedescendant` for the arrow cursor (src/index.ts:1123,1166)
- [serious] 4.1.2 — Prev/next month buttons empty, unnamed (src/index.ts:1153)
- [serious] 4.1.2/3.3.2 — Internal input placeholder-only, no `aria-expanded`/`haspopup` (src/index.ts:1202)
- [minor] 3.3.2 — Hour/minute selects unlabeled (src/index.ts:1176)
- [minor] 1.3.1 — Weekday headers single-letter divs (src/index.ts:1159)
- Correct: grid keyboard nav complete; focus styles replaced, not suppressed.

### login
- [blocker] 2.1.1 — "Forgot Password?" / "Create a new profile" are href-less `<a onclick>`: not focusable or operable (src/index.ts:571,605)
- [serious] 4.1.3 — Error/success containers have no `role=alert`/`aria-live` (src/index.ts:471)
- [serious] 3.3.1 — Email validation is a red border only; no error text, no `aria-invalid` (src/index.ts:425)
- [serious] 1.1.1 — Image-only captcha with no non-visual alternative (src/index.ts:584)
- [minor] 1.3.5 — Login password uses `autocomplete="new-password"` instead of `current-password` (src/index.ts:551)
- [minor] 3.3.2 — Required fields carry no `required`/`aria-required` (src/index.ts:544)
- Correct: labels wired for/id throughout.

### formify
- OK — real `<form>`, native constraint validation preserved; field semantics are the consumer's responsibility.

## Data entry & display

### datagrid
- [blocker] 2.1.1 — Sorting is mouse-only on non-focusable header divs; no sort key in `onKey` (src/index.ts:703,492)
- [serious] 1.3.1/4.1.2 — Headers lack `role=columnheader` (src/index.ts:697)
- [serious] 4.1.2 — No `aria-sort` (chevron/data-dir only) (src/index.ts:707)
- [serious] 4.1.2 — Active cell not exposed: no cell ids, no `aria-activedescendant` (src/index.ts:719,610)
- [serious] 4.1.2 — Row selection is a CSS class; no `aria-selected` (src/index.ts:666)
- [serious] 4.1.2/1.1.1 — All checkboxes nameless (select-all, per-row, cell) (src/index.ts:606,681,698)
- [serious] 2.1.1 — Column resize mousedown-only (src/index.ts:711,263)
- [minor] 1.3.1 — `aria-rowindex` uses raw-data order; wrong after sort/filter (src/index.ts:670)
- [minor] 1.3.1 — `aria-rowcount` excludes header; no `aria-colcount` (src/index.ts:720)
- [minor] 4.1.2 — Pagination current page `data-current` only, no `aria-current` (src/index.ts:763)
- Correct: Enter edit / Escape cancel / commit; visible focus rings; labeled search and pager buttons.

### editor
- [blocker] 2.1.1 — Table-size picker cells are mouse-only divs; keyboard user cannot insert a table from the UI (src/index.ts:1295)
- [serious] 4.1.2 — Writing area `role=textbox` has no accessible name (src/index.ts:1320)
- [serious] 2.1.1 — Image select/resize/align/remove require a pointer (src/index.ts:1191,1438,1138)
- [serious] 2.1.1 — Table column/row resize pointer-drag only (src/index.ts:1416,835)
- [minor] 2.1.1 — Multi-cell merge selection mouse-drag only (keyboard merge-right/down items mitigate) (src/index.ts:1206,683)
- [minor] 3.3.2 — Link URL input labeled by placeholder only (src/index.ts:1393)
- Correct: toolbar fully keyboard per APG; source textarea labeled with Escape exit; focus ring replaced, not suppressed.

### signature
- [serious] 2.1.1 — Capture is pointer-only with no non-pointer alternative (e.g. typed) and clear is unreachable without a pointer (src/index.ts:175)
- Correct: canvas `role=img` + `aria-label`.

### cropper
- [blocker] 2.1.1 — Crop box move/resize and image panning are pointer-only on a role-less, non-focusable div; no keyboard path to crop (src/index.ts:441,336,757)
- [serious] 1.1.1 — Canvas has no role/label/fallback; editor region unlabeled (src/index.ts:754,738)
- [minor] 4.1.2 — Aspect-ratio select unnamed (src/index.ts:809)
- Correct: zoom/rotate/filter ranges label-wrapped and keyboard operable; real buttons.

### transferlist
- [serious] 1.3.1 — `role=list` with `<label>` children lacking `role=listitem` (src/index.ts:235,206)
- [minor] 1.3.1/2.4.6 — Lists not programmatically named ("Available"/"Chosen" unassociated) (src/index.ts:223,235)
- [minor] 2.4.6 — Both search inputs named identically "Search" (src/index.ts:231)
- Correct: all moves keyboard-operable via native checkboxes + labeled buttons; focus-visible outlines.

### treeview
- [serious] 4.1.2 — Focus lands on the inner row div, not the `li[role=treeitem]` carrying state (src/index.ts:543)
- [serious] 2.1.1 — Drag reorder has no keyboard alternative (api lacks move) (src/index.ts:392,186)
- [minor] 2.4.3 — Every row `tabindex="0"` instead of roving tabindex (src/index.ts:548)
- Correct: tree/treeitem/group + `aria-expanded`/`aria-selected`; full APG arrow model; focus-visible outline.

### list
- [blocker] 2.1.1 — Interactive rows (`onitemclick`) are click-only divs: no tabindex, no key activation (src/index.ts:262)
- [serious] 4.1.2 — Clickable rows keep `role=listitem`; not reported as actionable (src/index.ts:262)
- [minor] 1.3.1 — Virtual scroll exposes only the window; no `aria-setsize`/`posinset` (src/index.ts:262,286)
- [minor] 4.1.2 — Pagination `data-current` only (src/index.ts:309)

## Boards, media & charts

### kanban
- [blocker] 2.1.1 — Card moves are drag-only (mousedown/mousemove/mouseup), no keyboard path, cards not focusable (src/index.ts:271,364)
- [blocker] 2.1.1 — `oncardclick`/`oncarddblclick` on a plain `<article>` with no tabindex/role/key activation (src/index.ts:360)
- [serious] 2.5.7 — No single-pointer non-drag alternative for moves (src/index.ts:304)

### timeline
- [serious] 2.1.1 — Clickable tags are `<span onclick>`: keyboard-inoperable (src/index.ts:326)
- [serious] 4.1.2 — Prev/next month buttons named by icon ligature text only (src/index.ts:303)
- [minor] 4.1.2 — Edit button named by ligature `edit` coincidentally (src/index.ts:318)

### schedule
- [blocker] 2.1.1 — Event create/move/resize are mouse drags and edit opens only on double-click; keyboard layer offers no create/move/resize/edit (src/index.ts:945,934,1016,1045)
- [serious] 2.5.7 — No non-drag pointer alternative (src/index.ts:786,847)
- [serious] 2.4.7 — Focusable root with `outline: none` and no replacement (src/index.ts:1324, src/style.css:20)
- [serious] 4.1.2 — Events are bare divs; title/times rendered via CSS `attr()` content; not focusable; selection visual-only (src/index.ts:1174, src/style.css:231)
- [serious] 4.1.2 — Editor color-palette buttons unnamed, color-only (src/index.ts:1314)

### gantt
- [blocker] 2.1.1 — All edits mouse-only: bar move/resize, dependency draw/remove, panning; nothing focusable; only Escape-during-drag handled (src/index.ts:297,368,747,429)
- [serious] 2.5.7 — No non-drag pointer alternative (src/index.ts:277)
- [serious] 1.1.1 — Task dates conveyed only via `title` tooltips on non-focusable divs; no text/table fallback (src/index.ts:567,654)
- [minor] 2.1.1 — Instructions live only in `title` attributes (src/index.ts:690,748)

### organogram
- [serious] 4.1.2 — Node cards focusable + Enter/Space (good) but no role and selection is a CSS class only (src/index.ts:551)
- [serious] 2.1.1 — Quick-search results are `<li onmousedown>`; Enter picks only the first match (src/index.ts:602)
- [minor] 1.3.1 — Hierarchy conveyed only by SVG connectors (src/index.ts:624)
- [minor] 1.1.1 — Status is a color dot with `title`-only label (src/index.ts:556)
- [minor] 2.1.1 — Viewport panning pointer-only (mitigated by zoom/fit buttons) (src/index.ts:475)

### card
- [minor] 1.1.1 — Media/avatar images hardcode `alt=""` with no prop for a text alternative (src/index.ts:66,72)
- Correct: clickable card gets `role="button"`, `tabindex="0"`, Enter/Space.

### carousel
- [serious] 2.2.2 — Autoplay has no pause control; pauses on mouseenter only, never on focus (src/index.ts:101,220)
- [serious] 2.4.3 — Links inside `aria-hidden` slides remain tabbable (no `tabindex="-1"`/`inert`) (src/index.ts:269,281)
- [minor] 4.1.2 — Slide labels position-only; changes not announced (src/index.ts:268)
- Correct otherwise: region + roledescription, named controls, ArrowLeft/Right, visible focus ring.

### imagelist
- [blocker] 2.1.1 — Interactive tiles (`onitemclick`) are `<div onclick>` with no tabindex/role/key handling (src/index.ts:94)
- [serious] 1.1.1 — `alt` falls back to empty when `title` absent; no dedicated alt field (src/index.ts:98)

### charts
- [serious] 2.1.1 — Pie/donut/polar/flow marks fire drilldown by mouse only, inside `aria-hidden` SVGs (src/radial.ts:114,160,205; src/flow.ts:119,200)
- [minor] 2.1.1 — Zoom drag-select and navigator dragging mouse-only (data stays accessible; reset exists) (src/cartesian.ts:600,658)
- Correct otherwise: `role="figure"` + generated description, hidden data-table fallback for all types, cartesian keyboard exploration with live label, legend as real `aria-pressed` buttons.

---

*Not audited (non-UI): router, jss, showcase. Not covered by static review:
contrast ratios, reflow/zoom, screen-reader behavior, touch-target sizes.*
