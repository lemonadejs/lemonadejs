/**
 * LemonadeJS v6 — runtime
 *
 * Materializes parsed templates into real DOM and keeps them alive.
 *
 * Ownership model: every ${...} slot in text position owns a marker TextNode
 * (permanent position anchor) and a list of entries — the content it produced.
 * Static siblings are created once and never visited again; updates touch
 * exactly the slot that changed (see applySlot).
 *
 * Branch rules (the contract):
 *   falsy/true            → nothing (previous content detaches, kept for reuse)
 *   string/number         → escaped text (never parsed as HTML)
 *   html`...` View      → live DOM branch
 *   Node                  → inserted as-is
 *   array                 → flattened, each item by the same rules
 */

import type { Bindable, Component, Handle, State, Template, Tools, View, VNode, VProp } from './types';
import { isView } from './types';
import { fail, warn } from './errors';
import { DEV } from './env';
import { Binding, BoundState, isDynamic, isForcing, isState, readCount, resolve, StateImpl, untracked } from './reactivity';
import { contract as contractOf } from './contract';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
    'svg', 'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline', 'text', 'g', 'defs',
    'use', 'symbol', 'marker', 'mask', 'pattern', 'linearGradient', 'radialGradient', 'stop',
]);

/** Mutable container for a view's slot values — replaced on branch updates */
interface Holder {
    values: unknown[];
}

/** A live component instance */
export interface Instance {
    name: string;
    component: Function;
    props: Record<string, unknown>;
    states: StateImpl<unknown>[];
    bindings: Binding[];
    children: Instance[];
    slots: SlotState[];
    elements: Node[];
    pending: Instance[];
    mountCbs: ((el: Node) => unknown)[];
    unmountCbs: (() => void)[];
    /** Refs queued during the root build, fired by runMount */
    refs: RefEntry[];
    mounted: boolean;
    /** Set by unmountInstance — dead instances are never reused or resurrected */
    dead: boolean;
}

/** A ref captured at build, fired after the nodes attach */
interface RefEntry {
    value: unknown;
    el: Element;
}

/** Build context: who owns the bindings/instances created while building */
interface BuildCtx {
    inst: Instance;
    holder: Holder;
    /** true inside branch entries: every slot stays re-appliable */
    live: boolean;
    bindings: Binding[];
    instances: Instance[];
    /** Run when this build's DOM is disposed (e.g. object-ref nulling) */
    cleanups: (() => void)[];
    /** Refs queued during the build, fired on insertion */
    refs: RefEntry[];
}

/** One unit of content produced by a slot */
interface ViewEntry {
    kind: 'view';
    template: Template;
    holder: Holder;
    bindings: Binding[];
    instances: Instance[];
    nodes: Node[];
    cleanups: (() => void)[];
    /** Pending refs — fired (once) when the entry first attaches */
    refs: RefEntry[];
    /** List identity from key="${...}" — matching is by key, not position */
    key?: unknown;
}

type Entry =
    | { kind: 'text'; text: string; nodes: Node[] }
    | { kind: 'node'; node: Node; nodes: Node[] }
    | ViewEntry;

/** The retained record of one text-position slot */
interface SlotState {
    marker: Text;
    entries: Entry[];
    detached: boolean;
}

type Item =
    | { kind: 'text'; text: string }
    | { kind: 'node'; node: Node }
    | { kind: 'view'; view: View };

/** Element → Instance, for inspect() */
const registry = new WeakMap<Node, Instance>();

/** Registered components: <Card /> resolves here (case-sensitive) */
const components: Record<string, Component<Record<string, unknown>>> = {};

/**
 * Register components for use by name: setComponents({ Card, Modal })
 * enables <Card /> in templates. Names must start with a capital letter
 * and match exactly. Embedding by value (<${Card} />) needs no registration.
 */
export const setComponents = function (map: Record<string, Component<never>>): void {
    for (const name of Object.keys(map)) {
        if (typeof map[name] === 'function') {
            components[name] = map[name] as Component<Record<string, unknown>>;
        }
    }
};

/** Components already warned with LJS-202 (once per component type) */
const warned = new WeakSet<Function>();

/** Casing warnings already issued (once per name + context) */
const warnedCasing = new Set<string>();

/** One rule, no exceptions: on* names are lowercase (onclick, onsave) */
const checkCasing = function (name: string, context: string): void {
    if (DEV && name.length > 2 && name.startsWith('on') && /[A-Z]/.test(name)) {
        const key = name + '|' + context;
        if (!warnedCasing.has(key)) {
            warnedCasing.add(key);
            warn('LJS-305', 'use ' + name.toLowerCase() + ' in ' + context);
        }
    }
};

const valuesEqual = function (a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        const x = a[i];
        const y = b[i];
        if (Object.is(x, y)) {
            continue;
        }
        // Nested views: a fresh html`` carrying the same template and the
        // same values IS the same content — structural equality, so an
        // unchanged nested view never forces its parent entry to rebuild
        if (
            isView(x) &&
            isView(y) &&
            (x as View).template === (y as View).template &&
            valuesEqual((x as View).values, (y as View).values)
        ) {
            continue;
        }
        return false;
    }
    return true;
};

const toText = function (v: unknown): string {
    return v === null || v === undefined || v === false || v === true ? '' : String(v);
};

/** Normalize a resolved slot value into renderable items */
const normalize = function (v: unknown, out: Item[]): void {
    if (v === null || v === undefined || v === false || v === true || v === '') {
        return;
    }
    if (Array.isArray(v)) {
        for (const item of v) {
            normalize(item, out);
        }
        return;
    }
    if (isView(v)) {
        out.push({ kind: 'view', view: v });
        return;
    }
    if (typeof Node !== 'undefined' && v instanceof Node) {
        out.push({ kind: 'node', node: v });
        return;
    }
    out.push({ kind: 'text', text: String(v) });
};

const remove = function (node: Node): void {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
};

/**
 * key="${...}" on the FIRST element/component of a template makes list
 * matching identity-based. The resolver (values → key) is derived once per
 * template — the same identity that caches the parse. Templates without a
 * key resolve to null and lists of them keep the positional diff.
 */
type KeyFn = (values: unknown[]) => unknown;
const keyResolvers = new WeakMap<Template, KeyFn | null>();
const keyResolver = function (template: Template): KeyFn | null {
    let fn = keyResolvers.get(template);
    if (fn !== undefined) {
        return fn;
    }
    fn = null;
    for (const node of template.nodes) {
        if (node.type === '#text' || node.type === '#slot') {
            continue;
        }
        const prop = (node.props || []).find(function (p) {
            return p.name === 'key';
        });
        if (prop && prop.parts.length) {
            const parts = prop.parts;
            if (parts.length === 1 && typeof parts[0] === 'object') {
                const slot = (parts[0] as { slot: number }).slot;
                // Whole-value key: any value, compared by identity (Object.is)
                fn = function (values) {
                    return resolve(values[slot]);
                };
            } else {
                // Mixed/static parts concatenate to a string key
                fn = function (values) {
                    return resolveProp(parts, { values });
                };
            }
        }
        break; // only the first element/component carries the list key
    }
    keyResolvers.set(template, fn);
    return fn;
};

/**
 * True while the RENDERER is removing or blurring DOM (branch swaps,
 * slot detaches, unmounts). Removing a focused node makes the browser
 * fire focusout/blur exactly like a user leaving — handlers that close
 * or commit on focusout should ignore renderer-caused events:
 *
 *   onfocusout="${(e) => { if (isDisposing()) return; ... }}"
 */
let disposingDepth = 0;

export const isDisposing = function (): boolean {
    return disposingDepth > 0;
};

const withDisposal = function (fn: () => void): void {
    disposingDepth++;
    try {
        fn();
    } finally {
        disposingDepth--;
    }
};

/** Blur before removal when the subtree holds focus — consistent
 *  across browsers (Chrome fires focusout on removal, jsdom doesn't)
 *  and across both disposal paths (entries and instances) */
const blurWithin = function (nodes: Node[]): void {
    if (typeof document === 'undefined' || !document.activeElement) {
        return;
    }
    const active = document.activeElement as HTMLElement;
    for (const node of nodes) {
        if (node === active || node.contains(active)) {
            active.blur?.();
            return;
        }
    }
};

const disposeEntry = function (entry: Entry): void {
    withDisposal(function () {
        if (entry.kind === 'view') {
            for (const binding of entry.bindings) {
                binding.dispose();
            }
            for (const instance of entry.instances) {
                unmountInstance(instance);
            }
            for (const cleanup of entry.cleanups) {
                cleanup();
            }
        }
        blurWithin(entry.nodes);
        for (const node of entry.nodes) {
            remove(node);
        }
    });
};

/**
 * Fire queued refs: the element is inserted at this point, so focus and
 * measurement work inside callbacks (no microtask deferral needed).
 * Object refs register their disposal nulling with the owning cleanups.
 */
const fireRefs = function (refs: RefEntry[], cleanups: (() => void)[]): void {
    for (const entry of refs) {
        const v = entry.value;
        if (typeof v === 'function') {
            // Imperative escape hatch: reads inside the ref must not
            // subscribe the enclosing branch binding
            untracked(function () {
                (v as (el: Element) => void)(entry.el);
            });
        } else if (isRefObject(v)) {
            v.current = entry.el;
            const el = entry.el;
            cleanups.push(function () {
                if (v.current === el) {
                    v.current = null;
                }
            });
        }
    }
    refs.length = 0;
};

/**
 * Inject a template's lifted <style> CSS into document.head — ONCE per
 * template (call-site identity is the dedup key, the same key that caches
 * the parse). Styles are never removed: they are global by design (use
 * component class prefixes), and instances come and go while the CSS
 * stays warm. No-DOM environments skip silently.
 */
const styled = new WeakSet<Template>();
const injectStyles = function (template: Template): void {
    if (!template.styles || styled.has(template) || typeof document === 'undefined') {
        return;
    }
    styled.add(template);
    for (const cssText of template.styles) {
        const el = document.createElement('style');
        el.setAttribute('data-lemonade', '');
        el.textContent = cssText;
        document.head.appendChild(el);
    }
};

/** Build the DOM for a View inside a branch entry (live mode) */
const buildViewEntry = function (view: View, inst: Instance): ViewEntry {
    injectStyles(view.template);
    const holder: Holder = { values: view.values };
    const ctx: BuildCtx = { inst, holder, live: true, bindings: [], instances: [], cleanups: [], refs: [] };
    const nodes = buildNodes(view.template.nodes, ctx, false);
    return {
        kind: 'view',
        template: view.template,
        holder,
        bindings: ctx.bindings,
        instances: ctx.instances,
        nodes,
        cleanups: ctx.cleanups,
        refs: ctx.refs,
    };
};

/**
 * Apply a slot value: reconcile the slot's entries against the new content.
 * Positional diff — same kind/template at the same position keeps its DOM.
 */
const applySlot = function (s: SlotState, value: unknown, inst: Instance): void {
    const items: Item[] = [];
    normalize(value, items);

    // Nothing to render: detach (keep entries for reuse — show/hide is free)
    if (!items.length) {
        if (s.entries.length && !s.detached) {
            withDisposal(function () {
                for (const entry of s.entries) {
                    for (const node of entry.nodes) {
                        remove(node);
                    }
                }
            });
            s.detached = true;
        }
        return;
    }

    const old = s.entries;
    const next: Entry[] = [];
    const fresh: Instance[] = [];

    // Keys: identity-based matching when items carry key="${...}". Keys are
    // resolved up front; lists without keys never reach the Map.
    let keys: unknown[] | null = null;
    let byKey: Map<unknown, ViewEntry> | null = null;
    let seen: Set<unknown> | null = null;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'view') {
            const kf = keyResolver(item.view.template);
            if (kf) {
                const k = kf(item.view.values);
                if (k !== undefined) {
                    if (!keys) {
                        keys = new Array(items.length);
                    }
                    keys[i] = k;
                    if (DEV) {
                        if (!seen) {
                            seen = new Set();
                        }
                        if (seen.has(k)) {
                            warn('LJS-204', 'key ' + String(k));
                        }
                        seen.add(k);
                    }
                }
            }
        }
    }
    if (keys) {
        byKey = new Map();
        for (const o of old) {
            if (o.kind === 'view' && o.key !== undefined && !byKey.has(o.key)) {
                byKey.set(o.key, o);
            }
        }
    }

    // Every old entry ends up either claimed (reused, or disposed inline on
    // a rebuild) or swept after the loop — keyed matches consume entries out
    // of order, so the tail sweep alone is not enough
    const claimed = new Set<Entry>();

    /** The old entry this item matches: by key when it has one, by position
     *  otherwise (skipping entries that belong to the key map) */
    const candidate = function (i: number): Entry | undefined {
        const k = keys ? keys[i] : undefined;
        if (k !== undefined) {
            const m = byKey!.get(k);
            if (m && !claimed.has(m)) {
                return m;
            }
            return undefined;
        }
        const o = old[i];
        if (!o || claimed.has(o) || (byKey && o.kind === 'view' && o.key !== undefined)) {
            return undefined;
        }
        return o;
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const o = candidate(i);

        if (item.kind === 'text') {
            if (o && o.kind === 'text') {
                if (o.text !== item.text) {
                    o.nodes[0].nodeValue = item.text;
                    o.text = item.text;
                }
                claimed.add(o);
                next.push(o);
                continue;
            }
            next.push({ kind: 'text', text: item.text, nodes: [document.createTextNode(item.text)] });
        } else if (item.kind === 'node') {
            if (o && o.kind === 'node' && o.node === item.node) {
                claimed.add(o);
                next.push(o);
                continue;
            }
            next.push({ kind: 'node', node: item.node, nodes: [item.node] });
        } else {
            const view = item.view;
            if (o && o.kind === 'view' && o.template === view.template) {
                // A self-unmounted (dead) instance is never resurrected:
                // its entry rebuilds fresh
                const hasDead = o.instances.some(function (i) {
                    return i.dead;
                });
                const equal = valuesEqual(o.holder.values, view.values);
                if (equal && !isForcing() && !hasDead) {
                    // Identical content — reuse as-is (reattaches if detached,
                    // MOVES if reordered: the ordering walk fixes positions)
                    claimed.add(o);
                    next.push(o);
                    continue;
                }
                // touch(): equal references may hold mutated contents, so
                // re-run the bindings — appliers still skip unchanged output
                if (!hasDead && (!o.instances.length || equal)) {
                    o.holder.values = view.values;
                    for (const binding of o.bindings) {
                        binding.run();
                    }
                    claimed.add(o);
                    next.push(o);
                    continue;
                }
                // Contains components (snapshot props) — rebuild for fresh props
            }
            if (o) {
                claimed.add(o);
                disposeEntry(o);
            }
            const entry = buildViewEntry(view, inst);
            if (keys && keys[i] !== undefined) {
                entry.key = keys[i];
            }
            fresh.push(...entry.instances);
            next.push(entry);
        }
    }

    // Sweep: every old entry not reused or already disposed inline
    for (const o of old) {
        if (!claimed.has(o)) {
            disposeEntry(o);
        }
    }

    s.entries = next;
    s.detached = false;

    // Minimal-move ordering walk: entries must sit, in order, before the marker
    const parentNode = s.marker.parentNode;
    if (parentNode) {
        let ref: Node = s.marker;
        for (let i = next.length - 1; i >= 0; i--) {
            const nodes = next[i].nodes;
            for (let j = nodes.length - 1; j >= 0; j--) {
                const node = nodes[j];
                if (node.nextSibling !== ref || node.parentNode !== parentNode) {
                    parentNode.insertBefore(node, ref);
                }
                ref = node;
            }
        }
        // The nodes are attached NOW: fire pending refs (fresh entries,
        // plus cached entries that were built while detached)
        for (const entry of next) {
            if (entry.kind === 'view' && entry.refs.length) {
                fireRefs(entry.refs, entry.cleanups);
            }
        }
        for (const instance of fresh) {
            runMount(instance);
        }
        // Instances created in nested slots during this update
        if (inst.mounted && inst.pending.length) {
            const pending = inst.pending;
            inst.pending = [];
            for (const instance of pending) {
                runMount(instance);
            }
        }
    } else {
        // Initial build: nodes are returned to the caller; mount is deferred
        inst.pending.push(...fresh);
    }
};

/** useRef-style object refs: anything with a writable `current` slot */
const isRefObject = function (v: unknown): v is { current: unknown } {
    return !!v && typeof v === 'object' && 'current' in v;
};

/** Create an object ref: <div ref="${r}"> — r.current is the element
 *  (or the component api), nulled automatically on unmount. */
export const ref = function <T>(initial?: T): { current: T | null } {
    return { current: initial === undefined ? null : initial };
};

/** Apply a value to an element attribute/property */
const applyAttr = function (el: Element, name: string, v: unknown, svg: boolean): void {
    if (v === false || v === null || v === undefined) {
        el.removeAttribute(name);
        const anyEl = el as unknown as Record<string, unknown>;
        if (!svg && name in el && typeof anyEl[name] === 'boolean') {
            anyEl[name] = false;
        }
    } else if (typeof v === 'object' || typeof v === 'function') {
        (el as unknown as Record<string, unknown>)[name] = v;
    } else if (!svg && name !== 'class' && name !== 'style' && name in el) {
        try {
            (el as unknown as Record<string, unknown>)[name] = v;
        } catch {
            el.setAttribute(name, String(v));
        }
    } else {
        el.setAttribute(name, v === true ? '' : String(v));
    }
};

/** Resolve an attribute's parts into its current value */
const resolveProp = function (parts: VProp['parts'], holder: Holder): unknown {
    if (parts.length === 1 && typeof parts[0] === 'object') {
        return resolve(holder.values[parts[0].slot]);
    }
    let out = '';
    for (const part of parts) {
        out += typeof part === 'string' ? part : toText(resolve(holder.values[part.slot]));
    }
    return out;
};

/**
 * Native two-way binding: bind="${state}" on form elements. The directive
 * is consumed here — it never reaches the DOM as an attribute. Element →
 * state uses the input/change event; state → element uses a binding.
 */
const bindForm = function (el: Element, state: StateImpl<unknown>, ctx: BuildCtx): void {
    const input = el as HTMLInputElement;
    const tag = el.tagName.toLowerCase();
    const isCheckbox = tag === 'input' && input.type === 'checkbox';
    const isRadio = tag === 'input' && input.type === 'radio';

    const write = function (): void {
        const v = state.value; // tracked: re-runs when the state changes
        if (isCheckbox) {
            input.checked = !!v;
        } else if (isRadio) {
            input.checked = toText(v) === input.value;
        } else if (input.value !== toText(v)) {
            input.value = toText(v);
        }
    };
    const binding = new Binding(write);
    ctx.bindings.push(binding);
    binding.run();

    const isNumeric = tag === 'input' && (input.type === 'number' || input.type === 'range');
    const event = isCheckbox || isRadio || tag === 'select' ? 'change' : 'input';
    el.addEventListener(event, function () {
        if (isCheckbox) {
            state.value = input.checked;
        } else if (isRadio) {
            if (input.checked) {
                state.value = input.value;
            }
        } else if (isNumeric) {
            // Type honesty: a State<number> never silently becomes a string
            const n = input.valueAsNumber;
            state.value = Number.isNaN(n) ? null : n;
        } else {
            state.value = input.value;
        }
    });
};

const BINDABLE_TAGS = new Set(['input', 'textarea', 'select']);

const applyProp = function (el: Element, prop: VProp, ctx: BuildCtx, svg: boolean): void {
    const name = prop.name;
    const parts = prop.parts;
    const whole = parts.length === 1 && typeof parts[0] === 'object' ? parts[0].slot : -1;

    // Boolean attribute: <input disabled />
    if (!parts.length) {
        applyAttr(el, name, name, svg);
        return;
    }

    // List identity directive (consumed by applySlot, never rendered)
    if (name === 'key') {
        return;
    }

    // Two-way binding directive (validated, never rendered as an attribute)
    if (name === 'bind') {
        const raw = whole >= 0 ? ctx.holder.values[whole] : parts.join('');
        if (isState(raw)) {
            if (!BINDABLE_TAGS.has(el.tagName.toLowerCase())) {
                fail('LJS-303', '<' + el.tagName.toLowerCase() + '>');
            }
            bindForm(el, raw, ctx);
        } else {
            fail('LJS-302', 'got ' + typeof raw + ' in <' + el.tagName.toLowerCase() + '>');
        }
        return;
    }

    // Events: onclick="${() => ...}" — always read through the holder, so
    // branch updates replace the handler without re-attaching the listener
    if (name.length > 2 && name.startsWith('on')) {
        checkCasing(name, '<' + el.tagName.toLowerCase() + '>');
        if (whole < 0 || typeof ctx.holder.values[whole] !== 'function') {
            fail('LJS-301', name + ' in <' + el.tagName.toLowerCase() + '>');
        }
        const holder = ctx.holder;
        el.addEventListener(name.slice(2).toLowerCase(), function (e: Event) {
            const handler = holder.values[whole];
            if (typeof handler === 'function') {
                return (handler as (e: Event) => unknown)(e);
            }
        });
        return;
    }

    // Element reference: ref="${(el) => ...}" or ref="${refObject}".
    // Refs are QUEUED at build and fired right after the nodes are
    // inserted — the same synchronous update, no waiting — so the
    // element is attached and focus()/measurement work inside refs.
    if (name === 'ref' && whole >= 0) {
        const fn = ctx.holder.values[whole];
        if (typeof fn === 'function' || isRefObject(fn)) {
            ctx.refs.push({ value: fn, el });
        }
        return;
    }

    const hasSlots = parts.some(function (p) {
        return typeof p === 'object';
    });

    if (!hasSlots) {
        applyAttr(el, name, parts.join(''), svg);
        return;
    }

    const holder = ctx.holder;
    let last: unknown = applyAttr; // sentinel that never equals a real value
    const run = function (): void {
        const v = resolveProp(parts, holder);
        if (Object.is(v, last)) {
            return;
        }
        last = v;
        applyAttr(el, name, v, svg);
    };

    const dynamic =
        ctx.live ||
        parts.some(function (p) {
            return typeof p === 'object' && isDynamic(holder.values[p.slot]);
        });

    if (dynamic) {
        const binding = new Binding(run);
        ctx.bindings.push(binding);
        binding.run();
    } else {
        run();
    }
};

/** Build a text-position slot: marker TextNode + reactive branch */
const buildSlot = function (vnode: VNode, ctx: BuildCtx): Node[] {
    const marker = document.createTextNode('');
    const s: SlotState = { marker, entries: [], detached: false };
    ctx.inst.slots.push(s);

    const idx = vnode.slot!;
    const holder = ctx.holder;
    const inst = ctx.inst;
    const apply = function (): void {
        applySlot(s, resolve(holder.values[idx]), inst);
    };

    if (isDynamic(holder.values[idx]) || ctx.live) {
        const binding = new Binding(apply);
        ctx.bindings.push(binding);
        binding.run();
    } else {
        apply();
    }

    // Initial content travels with the marker; later updates use the marker
    const out: Node[] = [];
    for (const entry of s.entries) {
        out.push(...entry.nodes);
    }
    out.push(marker);
    return out;
};

/** Build a component: <${Card} /> (by value) or <Card /> (registered) */
const buildComponent = function (vnode: VNode, ctx: BuildCtx): Node[] {
    const type = vnode.type as { slot: number } | { name: string };
    let fn: unknown;
    if ('slot' in type) {
        fn = ctx.holder.values[type.slot];
        if (typeof fn !== 'function') {
            fail('LJS-001', 'value of type ' + typeof fn + ' used as a component tag');
        }
    } else {
        fn = components[type.name];
        if (typeof fn !== 'function') {
            fail('LJS-104', '<' + type.name + '>');
        }
    }

    const props: Record<string, unknown> = {};
    for (const prop of vnode.props || []) {
        if (prop.name === 'key') {
            continue; // list identity — consumed by applySlot, never a prop
        }
        checkCasing(prop.name, '<' + ((fn as Function).name || 'component') + '>');
        const parts = prop.parts;
        if (!parts.length) {
            props[prop.name] = true;
        } else if (parts.length === 1 && typeof parts[0] === 'string') {
            props[prop.name] = parts[0];
        } else if (parts.length === 1 && typeof parts[0] === 'object') {
            // Whole-value expression: passed by reference, untouched
            props[prop.name] = ctx.holder.values[parts[0].slot];
        } else {
            props[prop.name] = resolveProp(parts, ctx.holder);
        }
    }

    if (vnode.children && vnode.children.length) {
        props.children = buildNodes(vnode.children, ctx, false);
    }

    const child = mountComponent(fn as Component<Record<string, unknown>>, props, ctx.inst);
    ctx.instances.push(child);
    return child.elements;
};

const buildElement = function (vnode: VNode, ctx: BuildCtx, svg: boolean): Node[] {
    const tag = vnode.type as string;
    const isSvg = svg || SVG_TAGS.has(tag);
    const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);

    if (DEV && vnode.props && vnode.props.some((p) => p.name === 'bind')) {
        if (vnode.props.some((p) => p.name === 'value' || p.name === 'checked')) {
            warn('LJS-304', '<' + tag + '>');
        }
    }

    // Children first: directives like bind (e.g. on <select>) and ref must
    // see the complete element
    if (vnode.children) {
        for (const child of vnode.children) {
            for (const node of buildNode(child, ctx, isSvg)) {
                el.appendChild(node);
            }
        }
    }

    for (const prop of vnode.props || []) {
        applyProp(el, prop, ctx, isSvg);
    }

    return [el];
};

const buildNode = function (vnode: VNode, ctx: BuildCtx, svg: boolean): Node[] {
    if (vnode.type === '#text') {
        return [document.createTextNode(vnode.text || '')];
    }
    if (vnode.type === '#slot') {
        return buildSlot(vnode, ctx);
    }
    if (typeof vnode.type === 'object') {
        return buildComponent(vnode, ctx);
    }
    return buildElement(vnode, ctx, svg);
};

const buildNodes = function (vnodes: VNode[], ctx: BuildCtx, svg: boolean): Node[] {
    const out: Node[] = [];
    for (const vnode of vnodes) {
        out.push(...buildNode(vnode, ctx, svg));
    }
    return out;
};

/**
 * Create a component instance: run setup once, materialize its template.
 * Mount callbacks run later, when the elements are attached (runMount).
 */
export const mountComponent = function (
    component: Component<Record<string, unknown>>,
    props: Record<string, unknown>,
    parent: Instance | null
): Instance {
    if (typeof component !== 'function') {
        fail('LJS-001');
    }

    const inst: Instance = {
        name: component.name || 'Component',
        component,
        props,
        states: [],
        bindings: [],
        children: [],
        slots: [],
        elements: [],
        pending: [],
        mountCbs: [],
        unmountCbs: [],
        refs: [],
        mounted: false,
        dead: false,
    };

    // Object ref sugar: the component always sees a CALLABLE props.ref
    // (it writes props.ref?.(api)); an object ref becomes a setter and
    // .current is nulled on unmount so it never pins a dead api/subtree
    if (isRefObject(props.ref)) {
        const target = props.ref;
        let assigned: unknown = null;
        props.ref = function (api: unknown) {
            assigned = api;
            target.current = api;
        };
        inst.unmountCbs.push(function () {
            if (target.current === assigned) {
                target.current = null;
            }
        });
    }

    const tools: Tools = {
        state: function <T>(initial: T, onchange?: (v: T, o: T) => void) {
            const s = new StateImpl<T>(initial, onchange);
            inst.states.push(s as StateImpl<unknown>);
            return s;
        },
        computed: function <T>(fn: () => T) {
            const s = new StateImpl<T>(undefined as T);
            const binding = new Binding(function () {
                s.value = fn();
            });
            inst.states.push(s as StateImpl<unknown>);
            inst.bindings.push(binding);
            binding.run(); // initial value + dependency tracking
            return s;
        },
        bind: function <T>(p: Bindable<T>, fallback: T) {
            const raw = p ? (p.bind as State<T> | T | undefined) : undefined;
            // External state → two-way; plain value → initial; nothing → fallback
            const target = isState(raw)
                ? (raw as StateImpl<T>)
                : new StateImpl<T>(raw !== undefined ? (raw as T) : fallback);
            const bound = new BoundState<T>(target, p ? p.onchange : undefined);
            inst.states.push(bound as unknown as StateImpl<unknown>);
            return bound;
        },
        onMount: function (cb) {
            inst.mountCbs.push(cb);
        },
        onUnmount: function (cb) {
            inst.unmountCbs.push(cb);
        },
        listen: function <E extends Event>(
            target: EventTarget,
            type: string,
            cb: (event: E) => void,
            options?: AddEventListenerOptions | boolean
        ) {
            target.addEventListener(type, cb as EventListener, options);
            // off() fires ONCE (manual release and unmount may both reach it)
            // and self-prunes so gestures armed/released many times over a
            // component's life do not accumulate dead closures until unmount
            let on = true;
            const off = function () {
                if (!on) {
                    return;
                }
                on = false;
                target.removeEventListener(type, cb as EventListener, options);
                const at = inst.unmountCbs.indexOf(off);
                if (at >= 0) {
                    inst.unmountCbs.splice(at, 1);
                }
            };
            inst.unmountCbs.push(off);
            return off;
        },
        unmount: function () {
            unmountInstance(inst);
        },
    };

    const finalProps = DEV ? Object.freeze({ ...props }) : props;
    const before = readCount();
    // Setup bodies are imperative: their reads must not subscribe whatever
    // branch binding happens to be materializing this component
    const view = untracked(function () {
        return component(finalProps as never, tools);
    });
    if (!isView(view)) {
        fail('LJS-002', inst.name);
    }

    // Dev heuristic: states were read while the template was being built and
    // some slots hold primitives — likely a frozen snapshot (see explain LJS-202)
    if (DEV && readCount() > before && !warned.has(component)) {
        const primitive = view.values.some(function (v) {
            return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
        });
        if (primitive) {
            warned.add(component);
            warn('LJS-202', 'in component <' + inst.name + '>');
        }
    }

    const ctx: BuildCtx = {
        inst,
        holder: { values: view.values },
        live: false,
        bindings: inst.bindings,
        instances: inst.children,
        // Root-level object refs are nulled when the component unmounts
        cleanups: inst.unmountCbs,
        // Root-level refs fire in runMount — after the host attached them
        refs: inst.refs,
    };
    injectStyles(view.template);
    inst.elements = buildNodes(view.template.nodes, ctx, false);

    if (inst.elements[0]) {
        registry.set(inst.elements[0], inst);
    }

    return inst;
};

/** Run mount callbacks, children first */
export const runMount = function (inst: Instance): void {
    if (inst.mounted) {
        return;
    }
    inst.mounted = true;
    // Refs fire FIRST (the host attached the elements before calling
    // runMount), so onMount callbacks can rely on ref-captured values:
    // root-level refs, then pending refs of branch entries built during
    // the initial (detached) construction
    if (inst.refs.length) {
        fireRefs(inst.refs, inst.unmountCbs);
    }
    for (const s of inst.slots) {
        if (!s.detached) {
            for (const entry of s.entries) {
                if (entry.kind === 'view' && entry.refs.length) {
                    fireRefs(entry.refs, entry.cleanups);
                }
            }
        }
    }
    for (const child of inst.children) {
        runMount(child);
    }
    const pending = inst.pending;
    inst.pending = [];
    for (const instance of pending) {
        runMount(instance);
    }
    for (const cb of inst.mountCbs) {
        const cleanup = cb(inst.elements[0]);
        if (typeof cleanup === 'function') {
            inst.unmountCbs.push(cleanup as () => void);
        }
    }
};

/** Unmount: children first, dispose every binding, remove the DOM */
export const unmountInstance = function (inst: Instance): void {
    if (inst.dead) {
        return; // formally idempotent
    }
    inst.dead = true;
    for (const child of [...inst.children]) {
        unmountInstance(child);
    }
    for (const s of inst.slots) {
        for (const entry of s.entries) {
            disposeEntry(entry);
        }
        s.entries = [];
    }
    for (const binding of inst.bindings) {
        binding.dispose();
    }
    // Detach the list BEFORE running: listen() offs self-prune via splice,
    // which would skip the next callback if it hit the array mid-iteration
    const unmountCbs = inst.unmountCbs;
    inst.unmountCbs = [];
    for (const cb of unmountCbs) {
        cb();
    }
    // Never leave focus on a node being removed: correct UX, and the
    // document's last-focused reference would otherwise retain the subtree
    withDisposal(function () {
        blurWithin(inst.elements);
        for (const node of inst.elements) {
            remove(node);
        }
    });
    if (inst.elements[0]) {
        registry.delete(inst.elements[0]);
    }
    inst.mounted = false;
};

/** Mount a component into a root element */
export const mount = function <P>(component: Component<P>, root: Element, props?: P): Handle {
    if (!root || root.nodeType !== 1) {
        fail('LJS-003');
    }
    const inst = mountComponent(
        component as Component<Record<string, unknown>>,
        (props as Record<string, unknown>) || {},
        null
    );
    for (const node of inst.elements) {
        root.appendChild(node);
    }
    registry.set(root, inst);
    runMount(inst);
    return {
        el: root,
        unmount: function () {
            registry.delete(root);
            unmountInstance(inst);
        },
    };
};

export interface InspectReport {
    component: string;
    contract: string | null;
    states: unknown[];
    children: InspectReport[];
}

const report = function (inst: Instance): InspectReport {
    const children: Instance[] = [...inst.children];
    for (const s of inst.slots) {
        for (const entry of s.entries) {
            if (entry.kind === 'view') {
                children.push(...entry.instances);
            }
        }
    }
    const schema = contractOf(inst.component);
    return {
        component: inst.name,
        contract: schema ? schema.name : null,
        states: inst.states.map(function (s) {
            return s.peek();
        }),
        children: children.map(report),
    };
};

/**
 * The explicit escape hatch for TRUSTED markup. Plain strings in slots are
 * always escaped; unsafe() parses a trusted HTML string into nodes:
 *   html`<div>${unsafe(articleHtml)}</div>`
 * Never call it on user input — the name is the warning.
 */
export const unsafe = function (html: string): Node[] {
    const template = document.createElement('template');
    template.innerHTML = html;
    return [...template.content.childNodes];
};

/**
 * Programmatic DevTools: returns the live component tree (names, state
 * values, children) for the instance owning the given element. Plain JSON.
 */
export const inspect = function (target: Node): InspectReport | null {
    let node: Node | null = target;
    while (node) {
        const inst = registry.get(node);
        if (inst) {
            return report(inst);
        }
        node = node.parentNode;
    }
    return null;
};
