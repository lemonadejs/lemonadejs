// src/types.ts
function isView(v) {
  return typeof v === "object" && v !== null && Array.isArray(v.values) && typeof v.template === "object" && Array.isArray(v.template?.nodes);
}

// src/errors.ts
var env = {
  /** Development mode: warnings + state freezing. Set to false for production. */
  dev: true
};
var MESSAGES = {
  "LJS-001": "Component is not a function",
  "LJS-002": "Component must return a template created with render`...`",
  "LJS-003": "mount() requires a DOM element as root",
  "LJS-101": "Unexpected closing tag \u2014 check tag nesting",
  "LJS-102": "Unclosed tag at the end of the template",
  "LJS-104": "Capitalized tag found \u2014 components are embedded by value: <${Card} />",
  "LJS-105": "Expression ${...} is not allowed in this position",
  "LJS-201": "State contents are frozen in dev mode \u2014 assign a new value instead of mutating",
  "LJS-202": "Slot holds a snapshot \u2014 wrap dynamic expressions: ${() => ...}",
  "LJS-203": "Update loop detected \u2014 a state change keeps triggering itself",
  "LJS-301": 'Event attributes require a function: onclick="${() => ...}"'
};
var format = function(code, detail) {
  const message = MESSAGES[code] || "Unknown error";
  return code + ": " + message + (detail ? " \u2014 " + detail : "");
};
var fail = function(code, detail) {
  throw new Error(format(code, detail));
};
var warn = function(code, detail) {
  if (env.dev && typeof console !== "undefined") {
    console.warn(format(code, detail));
  }
};

// src/reactivity.ts
var current = null;
var depth = 0;
var reads = 0;
var readCount = function() {
  return reads;
};
var Binding = class {
  constructor(fn) {
    this.fn = fn;
    this.deps = /* @__PURE__ */ new Set();
  }
  run() {
    for (const dep of this.deps) {
      dep.subs.delete(this);
    }
    this.deps.clear();
    const previous = current;
    current = this;
    try {
      this.fn();
    } finally {
      current = previous;
    }
  }
  dispose() {
    for (const dep of this.deps) {
      dep.subs.delete(this);
    }
    this.deps.clear();
  }
};
var devFreeze = function(value) {
  if (env.dev && value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (Array.isArray(value) || proto === Object.prototype || proto === null) {
      Object.freeze(value);
    }
  }
  return value;
};
var StateImpl = class {
  constructor(initial, onchange) {
    this.onchange = onchange;
    this.subs = /* @__PURE__ */ new Set();
    this.v = devFreeze(initial);
  }
  get value() {
    reads++;
    if (current) {
      this.subs.add(current);
      current.deps.add(this);
    }
    return this.v;
  }
  set value(next) {
    if (Object.is(next, this.v)) {
      return;
    }
    const old = this.v;
    this.v = devFreeze(next);
    if (depth > 100) {
      fail("LJS-203");
    }
    depth++;
    try {
      for (const binding of [...this.subs]) {
        binding.run();
      }
    } finally {
      depth--;
    }
    if (typeof this.onchange === "function") {
      this.onchange(this.v, old);
    }
  }
  /** Read without subscribing (used by inspect/tooling) */
  peek() {
    return this.v;
  }
};
var isState = function(v) {
  return v instanceof StateImpl;
};
var resolve = function(raw) {
  if (isState(raw)) {
    return raw.value;
  }
  if (typeof raw === "function") {
    return raw();
  }
  return raw;
};
var isDynamic = function(raw) {
  return isState(raw) || typeof raw === "function";
};

// src/runtime.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var SVG_TAGS = /* @__PURE__ */ new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "ellipse",
  "polygon",
  "polyline",
  "text",
  "g",
  "defs",
  "use",
  "symbol",
  "marker",
  "mask",
  "pattern",
  "linearGradient",
  "radialGradient",
  "stop"
]);
var registry = /* @__PURE__ */ new WeakMap();
var warned = /* @__PURE__ */ new WeakSet();
var valuesEqual = function(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
};
var toText = function(v) {
  return v === null || v === void 0 || v === false || v === true ? "" : String(v);
};
var normalize = function(v, out) {
  if (v === null || v === void 0 || v === false || v === true || v === "") {
    return;
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      normalize(item, out);
    }
    return;
  }
  if (isView(v)) {
    out.push({ kind: "view", view: v });
    return;
  }
  if (typeof Node !== "undefined" && v instanceof Node) {
    out.push({ kind: "node", node: v });
    return;
  }
  out.push({ kind: "text", text: String(v) });
};
var remove = function(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
};
var disposeEntry = function(entry) {
  if (entry.kind === "view") {
    for (const binding of entry.bindings) {
      binding.dispose();
    }
    for (const instance of entry.instances) {
      unmountInstance(instance);
    }
  }
  for (const node of entry.nodes) {
    remove(node);
  }
};
var buildViewEntry = function(view, inst) {
  const holder = { values: view.values };
  const ctx = { inst, holder, live: true, bindings: [], instances: [] };
  const nodes = buildNodes(view.template.nodes, ctx, false);
  return {
    kind: "view",
    template: view.template,
    holder,
    bindings: ctx.bindings,
    instances: ctx.instances,
    nodes
  };
};
var applySlot = function(s, value, inst) {
  const items = [];
  normalize(value, items);
  if (!items.length) {
    if (s.entries.length && !s.detached) {
      for (const entry of s.entries) {
        for (const node of entry.nodes) {
          remove(node);
        }
      }
      s.detached = true;
    }
    return;
  }
  const old = s.entries;
  const next = [];
  const fresh = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const o = old[i];
    if (item.kind === "text") {
      if (o && o.kind === "text") {
        if (o.text !== item.text) {
          o.nodes[0].nodeValue = item.text;
          o.text = item.text;
        }
        next.push(o);
        continue;
      }
      if (o) {
        disposeEntry(o);
      }
      next.push({ kind: "text", text: item.text, nodes: [document.createTextNode(item.text)] });
    } else if (item.kind === "node") {
      if (o && o.kind === "node" && o.node === item.node) {
        next.push(o);
        continue;
      }
      if (o) {
        disposeEntry(o);
      }
      next.push({ kind: "node", node: item.node, nodes: [item.node] });
    } else {
      const view = item.view;
      if (o && o.kind === "view" && o.template === view.template) {
        if (valuesEqual(o.holder.values, view.values)) {
          next.push(o);
          continue;
        }
        if (!o.instances.length) {
          o.holder.values = view.values;
          for (const binding of o.bindings) {
            binding.run();
          }
          next.push(o);
          continue;
        }
      }
      if (o) {
        disposeEntry(o);
      }
      const entry = buildViewEntry(view, inst);
      fresh.push(...entry.instances);
      next.push(entry);
    }
  }
  for (let i = items.length; i < old.length; i++) {
    disposeEntry(old[i]);
  }
  s.entries = next;
  s.detached = false;
  const parentNode = s.marker.parentNode;
  if (parentNode) {
    let ref = s.marker;
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
    for (const instance of fresh) {
      runMount(instance);
    }
    if (inst.mounted && inst.pending.length) {
      const pending = inst.pending;
      inst.pending = [];
      for (const instance of pending) {
        runMount(instance);
      }
    }
  } else {
    inst.pending.push(...fresh);
  }
};
var applyAttr = function(el, name, v, svg) {
  if (v === false || v === null || v === void 0) {
    el.removeAttribute(name);
    const anyEl = el;
    if (!svg && name in el && typeof anyEl[name] === "boolean") {
      anyEl[name] = false;
    }
  } else if (typeof v === "object" || typeof v === "function") {
    el[name] = v;
  } else if (!svg && name !== "class" && name !== "style" && name in el) {
    try {
      el[name] = v;
    } catch {
      el.setAttribute(name, String(v));
    }
  } else {
    el.setAttribute(name, v === true ? "" : String(v));
  }
};
var resolveProp = function(parts, holder) {
  if (parts.length === 1 && typeof parts[0] === "object") {
    return resolve(holder.values[parts[0].slot]);
  }
  let out = "";
  for (const part of parts) {
    out += typeof part === "string" ? part : toText(resolve(holder.values[part.slot]));
  }
  return out;
};
var applyProp = function(el, prop, ctx, svg) {
  const name = prop.name;
  const parts = prop.parts;
  const whole = parts.length === 1 && typeof parts[0] === "object" ? parts[0].slot : -1;
  if (!parts.length) {
    applyAttr(el, name, name, svg);
    return;
  }
  if (name.length > 2 && name.startsWith("on")) {
    if (whole < 0 || typeof ctx.holder.values[whole] !== "function") {
      fail("LJS-301", name + " in <" + el.tagName.toLowerCase() + ">");
    }
    const holder2 = ctx.holder;
    el.addEventListener(name.slice(2).toLowerCase(), function(e) {
      const handler = holder2.values[whole];
      if (typeof handler === "function") {
        return handler(e);
      }
    });
    return;
  }
  if (name === "ref" && whole >= 0) {
    const fn = ctx.holder.values[whole];
    if (typeof fn === "function") {
      fn(el);
    }
    return;
  }
  const hasSlots = parts.some(function(p) {
    return typeof p === "object";
  });
  if (!hasSlots) {
    applyAttr(el, name, parts.join(""), svg);
    return;
  }
  const holder = ctx.holder;
  let last = applyAttr;
  const run = function() {
    const v = resolveProp(parts, holder);
    if (Object.is(v, last)) {
      return;
    }
    last = v;
    applyAttr(el, name, v, svg);
  };
  const dynamic = ctx.live || parts.some(function(p) {
    return typeof p === "object" && isDynamic(holder.values[p.slot]);
  });
  if (dynamic) {
    const binding = new Binding(run);
    ctx.bindings.push(binding);
    binding.run();
  } else {
    run();
  }
};
var buildSlot = function(vnode, ctx) {
  const marker = document.createTextNode("");
  const s = { marker, entries: [], detached: false };
  ctx.inst.slots.push(s);
  const idx = vnode.slot;
  const holder = ctx.holder;
  const inst = ctx.inst;
  const apply = function() {
    applySlot(s, resolve(holder.values[idx]), inst);
  };
  if (isDynamic(holder.values[idx]) || ctx.live) {
    const binding = new Binding(apply);
    ctx.bindings.push(binding);
    binding.run();
  } else {
    apply();
  }
  const out = [];
  for (const entry of s.entries) {
    out.push(...entry.nodes);
  }
  out.push(marker);
  return out;
};
var buildComponent = function(vnode, ctx) {
  const slotIdx = vnode.type.slot;
  const fn = ctx.holder.values[slotIdx];
  if (typeof fn !== "function") {
    fail("LJS-001", "value of type " + typeof fn + " used as a component tag");
  }
  const props = {};
  for (const prop of vnode.props || []) {
    const parts = prop.parts;
    if (!parts.length) {
      props[prop.name] = true;
    } else if (parts.length === 1 && typeof parts[0] === "string") {
      props[prop.name] = parts[0];
    } else if (parts.length === 1 && typeof parts[0] === "object") {
      props[prop.name] = ctx.holder.values[parts[0].slot];
    } else {
      props[prop.name] = resolveProp(parts, ctx.holder);
    }
  }
  if (vnode.children && vnode.children.length) {
    props.children = buildNodes(vnode.children, ctx, false);
  }
  const child = mountComponent(fn, props, ctx.inst);
  ctx.instances.push(child);
  return child.elements;
};
var buildElement = function(vnode, ctx, svg) {
  const tag = vnode.type;
  const isSvg = svg || SVG_TAGS.has(tag);
  const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const prop of vnode.props || []) {
    applyProp(el, prop, ctx, isSvg);
  }
  if (vnode.children) {
    for (const child of vnode.children) {
      for (const node of buildNode(child, ctx, isSvg)) {
        el.appendChild(node);
      }
    }
  }
  return [el];
};
var buildNode = function(vnode, ctx, svg) {
  if (vnode.type === "#text") {
    return [document.createTextNode(vnode.text || "")];
  }
  if (vnode.type === "#slot") {
    return buildSlot(vnode, ctx);
  }
  if (typeof vnode.type === "object") {
    return buildComponent(vnode, ctx);
  }
  return buildElement(vnode, ctx, svg);
};
var buildNodes = function(vnodes, ctx, svg) {
  const out = [];
  for (const vnode of vnodes) {
    out.push(...buildNode(vnode, ctx, svg));
  }
  return out;
};
var mountComponent = function(component, props, parent) {
  if (typeof component !== "function") {
    fail("LJS-001");
  }
  const inst = {
    name: component.name || "Component",
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
    mounted: false
  };
  const tools = {
    state: function(initial, onchange) {
      const s = new StateImpl(initial, onchange);
      inst.states.push(s);
      return s;
    },
    onMount: function(cb) {
      inst.mountCbs.push(cb);
    },
    onUnmount: function(cb) {
      inst.unmountCbs.push(cb);
    }
  };
  const finalProps = env.dev ? Object.freeze({ ...props }) : props;
  const before = readCount();
  const view = component(finalProps, tools);
  if (!isView(view)) {
    fail("LJS-002", inst.name);
  }
  if (env.dev && readCount() > before && !warned.has(component)) {
    const primitive = view.values.some(function(v) {
      return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
    });
    if (primitive) {
      warned.add(component);
      warn("LJS-202", "in component <" + inst.name + ">");
    }
  }
  const ctx = {
    inst,
    holder: { values: view.values },
    live: false,
    bindings: inst.bindings,
    instances: inst.children
  };
  inst.elements = buildNodes(view.template.nodes, ctx, false);
  if (inst.elements[0]) {
    registry.set(inst.elements[0], inst);
  }
  return inst;
};
var runMount = function(inst) {
  if (inst.mounted) {
    return;
  }
  inst.mounted = true;
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
    if (typeof cleanup === "function") {
      inst.unmountCbs.push(cleanup);
    }
  }
};
var unmountInstance = function(inst) {
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
  for (const cb of inst.unmountCbs) {
    cb();
  }
  inst.unmountCbs = [];
  for (const node of inst.elements) {
    remove(node);
  }
  if (inst.elements[0]) {
    registry.delete(inst.elements[0]);
  }
  inst.mounted = false;
};
var mount = function(component, root, props) {
  if (!root || root.nodeType !== 1) {
    fail("LJS-003");
  }
  const inst = mountComponent(
    component,
    props || {},
    null
  );
  for (const node of inst.elements) {
    root.appendChild(node);
  }
  registry.set(root, inst);
  runMount(inst);
  return {
    el: root,
    unmount: function() {
      registry.delete(root);
      unmountInstance(inst);
    }
  };
};
var report = function(inst) {
  const children = [...inst.children];
  for (const s of inst.slots) {
    for (const entry of s.entries) {
      if (entry.kind === "view") {
        children.push(...entry.instances);
      }
    }
  }
  return {
    component: inst.name,
    states: inst.states.map(function(s) {
      return s.peek();
    }),
    children: children.map(report)
  };
};
var inspect = function(target) {
  let node = target;
  while (node) {
    const inst = registry.get(node);
    if (inst) {
      return report(inst);
    }
    node = node.parentNode;
  }
  return null;
};

// src/test.ts
var serialize = function(node, depth2) {
  const pad = "  ".repeat(depth2);
  if (node.nodeType === 3) {
    const text = (node.nodeValue || "").trim();
    return text ? [pad + '"' + text + '"'] : [];
  }
  if (node.nodeType !== 1) {
    return [];
  }
  const el = node;
  const attrs = [...el.attributes].map(function(a) {
    return a.value === "" ? a.name : a.name + '="' + a.value + '"';
  }).sort().join(" ");
  const open = "<" + el.tagName.toLowerCase() + (attrs ? " " + attrs : "") + ">";
  const lines = [pad + open];
  for (const child of [...el.childNodes]) {
    lines.push(...serialize(child, depth2 + 1));
  }
  return lines;
};
var test = function(component, props) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const handle = mount(component, root, props);
  return {
    root,
    query: function(selector) {
      return root.querySelector(selector);
    },
    queryAll: function(selector) {
      return [...root.querySelectorAll(selector)];
    },
    text: function() {
      return root.textContent || "";
    },
    snapshot: function() {
      const lines = [];
      for (const child of [...root.childNodes]) {
        lines.push(...serialize(child, 0));
      }
      return lines.join("\n");
    },
    inspect: function() {
      return inspect(root);
    },
    unmount: function() {
      handle.unmount();
      root.remove();
    }
  };
};
var test_default = test;
export {
  test_default as default,
  test
};
