"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  batch: () => batch,
  component: () => component,
  contract: () => contract,
  createWebComponent: () => createWebComponent,
  default: () => index_default,
  explain: () => explain,
  html: () => html,
  inspect: () => inspect,
  mount: () => mount,
  setComponents: () => setComponents,
  store: () => store,
  unsafe: () => unsafe,
  use: () => use
});
module.exports = __toCommonJS(index_exports);

// src/env.ts
var DEV = false ? true : false;

// src/errors.ts
var MESSAGES = {
  "LJS-001": "Component is not a function",
  "LJS-002": "Component must return a template created with html`...`",
  "LJS-003": "mount() requires a DOM element as root",
  "LJS-101": "Unexpected closing tag \u2014 check tag nesting",
  "LJS-102": "Unclosed tag at the end of the template",
  "LJS-104": "Unknown component \u2014 register it: setComponents({ Card }), or embed by value: <${Card} />",
  "LJS-105": "Expression ${...} is not allowed in this position",
  "LJS-201": "In-place mutation is silent \u2014 call state.touch() after mutating, or assign a new value",
  "LJS-202": "Slot holds a snapshot \u2014 wrap dynamic expressions: ${() => ...}",
  "LJS-203": "Update loop detected \u2014 a state change keeps triggering itself",
  "LJS-301": 'Event attributes require a function: onclick="${() => ...}"',
  "LJS-302": 'bind requires a state: bind="${state}"',
  "LJS-303": "bind works on <input>, <textarea> and <select> \u2014 on components it is a prop",
  "LJS-304": "bind owns the element value \u2014 remove the explicit value/checked attribute",
  "LJS-305": "Event and callback names are lowercase: onclick, onchange, onsave",
  "LJS-401": "Prop does not match its contract",
  "LJS-501": "Sugar singletons: expose once, never touch \u2014 check the api in the contract"
};
var EXPLAIN = !DEV ? {} : {
  "LJS-001": 'The value used as a component is not a function. Components are plain functions: const Card: Component = (props, { state }) => html`<div>...</div>`. When embedding, pass the function itself: <${Card} title="x" />.',
  "LJS-002": "A component must return the result of the html tag. Correct: return html`<div>${count}</div>`. Returning strings, DOM nodes or nothing is not supported.",
  "LJS-003": 'mount(Component, root) expects root to be an existing DOM element, e.g. document.getElementById("app").',
  "LJS-101": "A closing tag was found that does not match the currently open tag. Check the nesting of your template. Void elements (br, img, input...) must not be closed.",
  "LJS-102": "The template ended while a tag was still open. Every opened tag must be closed: <div>...</div>, or self-closed: <Component />.",
  "LJS-104": "Tags starting with an uppercase letter are components. Either register the function once \u2014 setComponents({ Card }) \u2014 and use <Card /> anywhere (names are case-sensitive and must match exactly), or embed it by value with no registration: <${Card} />. A typo in a registered name raises this error at mount time.",
  "LJS-105": "Expressions can appear as text content, as a full attribute value, inside a quoted attribute value, or as a component tag: <${Card}>. They cannot be used as attribute names or partial tag names.",
  "LJS-201": "State contents are NOT immutable (this is not React): mutating in place is allowed and free \u2014 rows.value[i].total = 9 \u2014 but it does not notify by itself. Call rows.touch() after mutating to run updates: no copies, no proxies, DOM writes are delta-only. For bulk operations wrap the work in batch(() => {...}) so thousands of changes notify once. For small data, assignment also works: state.value = [...state.value, x]. The footgun: mutate without touch() and nothing updates.",
  "LJS-202": "A template slot received a plain value (string/number/boolean) while states were being read. Plain values are one-time snapshots. If the slot should update when states change, wrap it: ${() => valid.value && html`...`}. If the snapshot is intentional, ignore this warning.",
  "LJS-203": "A state assignment inside a reactive expression triggered itself recursively more than 100 times. Do not assign to states inside template expressions; assign from event handlers or callbacks.",
  "LJS-301": 'Attributes starting with "on" are events and must receive a function: onclick="${() => count.value++}". String handlers are not supported (CSP-safe by design).',
  "LJS-302": 'The bind directive needs the state object itself: bind="${name}" (not bind="name", which is a string, and not bind="${name.value}", which is a one-time snapshot). Create it with const name = state("").',
  "LJS-303": 'On native elements, bind is engine sugar and only <input>, <textarea> and <select> have a defined wiring. On components, bind is a plain prop: implement it with the bind() tool \u2014 const value = bind(props, fallback) \u2014 and pass <${Comp} bind="${state}" />.',
  "LJS-304": "An element has both bind and an explicit value/checked attribute. bind drives that property in both directions, so the explicit attribute fights it. Remove value/checked and set the state instead.",
  "LJS-305": "One rule, no exceptions: every event and callback name is lowercase, HTML-style \u2014 onclick, oninput, onchange, onsave, onitemclick \u2014 exactly like the platform names onmousedown or onbeforeunload. On native elements other casings still attach (the event name is normalized) but warn; on components, props are case-sensitive JavaScript keys, so onChange would be silently ignored by a component reading onchange. Declare and pass component callbacks in lowercase.",
  "LJS-401": 'A published component received a prop that violates its contract: wrong type, a non-function for a declared event, or a contract key that cannot work (prop names must be lowercase because they become HTML attributes). Check describe(Component) for the expected interface. Attribute strings are coerced to the declared type automatically ("5" \u2192 5 for numbers, presence semantics for booleans).',
  "LJS-501": "Sugar services are singletons by definition: one <${C} expose /> per component, registered once and never touched. This warning fires when a second instance exposes the same component (last one wins \u2014 almost always a bug) or when expose is used without api: { ... } declared in the contract. Consume with use(Component), which returns null until the instance is mounted."
};
var format = function(code, detail) {
  const message = MESSAGES[code] || "Unknown error";
  return code + ": " + message + (detail ? " \u2014 " + detail : "");
};
var fail = function(code, detail) {
  throw new Error(format(code, detail));
};
var warn = function(code, detail) {
  if (DEV && typeof console !== "undefined") {
    console.warn(format(code, detail));
  }
};
var explain = function(code) {
  if (EXPLAIN[code]) {
    return EXPLAIN[code];
  }
  if (MESSAGES[code]) {
    return code + ": " + MESSAGES[code] + " \u2014 full docs in the dev build or llms.txt";
  }
  return "Unknown code: " + code;
};

// src/parser.ts
var VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr"
]);
var parse = function(strings) {
  const root = { type: "#root", children: [] };
  const stack = [root];
  let mode = 0 /* Text */;
  let text = "";
  let tag = null;
  let tagName = "";
  let attrName = "";
  let parts = [];
  let valBuf = "";
  let quote = "";
  let selfClose = false;
  let closeName = "";
  let closeIsSlot = false;
  let commentTail = "";
  const parent = function() {
    return stack[stack.length - 1];
  };
  const children = function(node) {
    if (!node.children) {
      node.children = [];
    }
    return node.children;
  };
  const flushText = function() {
    if (!text) {
      return;
    }
    let t;
    if (/\S/.test(text)) {
      t = text.replace(/\s*\r?\n\s*/g, " ");
    } else {
      t = /\n/.test(text) ? "" : text;
    }
    if (t) {
      children(parent()).push({ type: "#text", text: t });
    }
    text = "";
  };
  const commitAttr = function() {
    if (attrName) {
      if (valBuf) {
        parts.push(valBuf);
      }
      if (!tag.props) {
        tag.props = [];
      }
      tag.props.push({ name: attrName, parts });
    }
    attrName = "";
    parts = [];
    valBuf = "";
  };
  const openTag = function() {
    commitAttr();
    const node = tag;
    if (typeof node.type === "string" && /^[A-Z]/.test(node.type)) {
      node.type = { name: node.type };
    }
    children(parent()).push(node);
    const isVoid = typeof node.type === "string" && VOID_TAGS.has(node.type);
    if (!selfClose && !isVoid) {
      stack.push(node);
    }
    tag = null;
    tagName = "";
    selfClose = false;
    mode = 0 /* Text */;
  };
  const closeTag = function(name) {
    if (stack.length < 2) {
      fail("LJS-101", name ? "</" + name + ">" : "</...>");
    }
    const top = stack.pop();
    const topName = typeof top.type === "string" ? top.type : "name" in top.type ? top.type.name : null;
    if (name && topName !== name) {
      fail("LJS-101", "</" + name + "> (expected </" + String(topName ?? "component") + ">)");
    }
    closeName = "";
    closeIsSlot = false;
    mode = 0 /* Text */;
  };
  for (let s = 0; s < strings.length; s++) {
    const seg = strings[s];
    for (let i = 0; i < seg.length; i++) {
      const c = seg[i];
      switch (mode) {
        case 0 /* Text */:
          if (c === "<") {
            if (seg.startsWith("!--", i + 1)) {
              flushText();
              mode = 5 /* Comment */;
              commentTail = "";
              i += 3;
            } else if (seg[i + 1] === "/") {
              flushText();
              mode = 6 /* Close */;
              closeName = "";
              closeIsSlot = false;
              i++;
            } else if (seg[i + 1] === void 0 || /[a-zA-Z]/.test(seg[i + 1])) {
              flushText();
              tag = { type: "" };
              tagName = "";
              mode = 1 /* Tag */;
            } else {
              text += c;
            }
          } else {
            text += c;
          }
          break;
        case 1 /* Tag */:
          if (/[a-zA-Z0-9-]/.test(c)) {
            tagName += c;
            tag.type = tagName;
          } else if (c === ">") {
            openTag();
          } else if (c === "/") {
            selfClose = true;
          } else if (/\s/.test(c)) {
            mode = 2 /* Attr */;
          }
          break;
        case 2 /* Attr */:
          if (c === ">") {
            commitAttr();
            openTag();
          } else if (c === "/") {
            commitAttr();
            selfClose = true;
          } else if (c === "=") {
            mode = 3 /* Eq */;
          } else if (/\s/.test(c)) {
            if (attrName) {
              commitAttr();
            }
          } else {
            attrName += c;
          }
          break;
        case 3 /* Eq */:
          if (c === '"' || c === "'") {
            quote = c;
            valBuf = "";
            mode = 4 /* Value */;
          } else if (c === ">") {
            commitAttr();
            openTag();
          } else if (!/\s/.test(c)) {
            quote = "";
            valBuf = c;
            mode = 4 /* Value */;
          }
          break;
        case 4 /* Value */:
          if (quote) {
            if (c === quote) {
              commitAttr();
              quote = "";
              mode = 2 /* Attr */;
            } else {
              valBuf += c;
            }
          } else if (/\s/.test(c)) {
            commitAttr();
            mode = 2 /* Attr */;
          } else if (c === ">") {
            commitAttr();
            openTag();
          } else if (c === "/") {
            commitAttr();
            selfClose = true;
            mode = 2 /* Attr */;
          } else {
            valBuf += c;
          }
          break;
        case 5 /* Comment */:
          commentTail = (commentTail + c).slice(-3);
          if (commentTail === "-->") {
            mode = 0 /* Text */;
          }
          break;
        case 6 /* Close */:
          if (/[a-zA-Z0-9-]/.test(c)) {
            closeName += c;
          } else if (c === ">") {
            closeTag(closeIsSlot ? null : closeName || null);
          }
          break;
      }
    }
    if (s < strings.length - 1) {
      const slot = s;
      switch (mode) {
        case 0 /* Text */:
          flushText();
          children(parent()).push({ type: "#slot", slot });
          break;
        case 1 /* Tag */:
          if (!tagName) {
            tag.type = { slot };
            mode = 2 /* Attr */;
          } else {
            fail("LJS-105", "expression inside a tag name");
          }
          break;
        case 3 /* Eq */:
          parts.push({ slot });
          commitAttr();
          mode = 2 /* Attr */;
          break;
        case 4 /* Value */:
          if (valBuf) {
            parts.push(valBuf);
            valBuf = "";
          }
          parts.push({ slot });
          if (!quote) {
            commitAttr();
            mode = 2 /* Attr */;
          }
          break;
        case 6 /* Close */:
          closeIsSlot = true;
          break;
        case 5 /* Comment */:
          break;
        default:
          fail("LJS-105", "expression in an attribute name");
      }
    }
  }
  flushText();
  if (stack.length > 1) {
    const top = stack[stack.length - 1];
    const name = typeof top.type === "string" ? top.type : "name" in top.type ? top.type.name : "component";
    fail("LJS-102", "<" + name + ">");
  }
  return { nodes: root.children || [] };
};

// src/types.ts
function isView(v) {
  return typeof v === "object" && v !== null && Array.isArray(v.values) && typeof v.template === "object" && Array.isArray(v.template?.nodes);
}

// src/reactivity.ts
var current = null;
var depth = 0;
var forcing = false;
var isForcing = function() {
  return forcing;
};
var batching = null;
var batchForcing = false;
var batch = function(fn) {
  if (batching) {
    return fn();
  }
  batching = /* @__PURE__ */ new Set();
  try {
    return fn();
  } finally {
    const queue = batching;
    const wasForcing = batchForcing;
    batching = null;
    batchForcing = false;
    const previous = forcing;
    forcing = forcing || wasForcing;
    try {
      for (const binding of queue) {
        binding.run();
      }
    } finally {
      forcing = previous;
    }
  }
};
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
var StateImpl = class {
  constructor(initial, onchange) {
    this.onchange = onchange;
    this.subs = /* @__PURE__ */ new Set();
    this.v = initial;
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
    this.v = next;
    this.emit(old);
  }
  /**
   * Notify after in-place mutation of the value's contents:
   *   rows.value[i].total = 9; rows.touch();
   */
  touch() {
    const previous = forcing;
    forcing = true;
    try {
      this.emit(this.v);
    } finally {
      forcing = previous;
    }
  }
  emit(old) {
    if (batching) {
      for (const binding of this.subs) {
        batching.add(binding);
      }
      if (forcing) {
        batchForcing = true;
      }
    } else {
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
    }
    if (typeof this.onchange === "function") {
      this.onchange(this.v, old);
    }
  }
  /** Read without subscribing (used by inspect/tooling) */
  peek() {
    return this.v;
  }
  /**
   * Plain subscription: cb runs after every notification (assignment or
   * touch). Returns the unsubscribe function. The universal adapter to
   * other reactive worlds without adopting the renderer:
   *   React:  useSyncExternalStore(rows.subscribe, rows.peek)
   */
  subscribe(cb) {
    const self = this;
    const binding = new Binding(function() {
      cb(self.value);
    });
    this.subs.add(binding);
    binding.deps.add(this);
    return function() {
      binding.dispose();
    };
  }
};
var BoundState = class extends StateImpl {
  constructor(target, notify) {
    super(void 0);
    this.target = target;
    this.notify = notify;
  }
  get value() {
    return this.target.value;
  }
  set value(next) {
    this.target.value = next;
  }
  peek() {
    return this.target.peek();
  }
  touch() {
    this.target.touch();
  }
  subscribe(cb) {
    return this.target.subscribe(cb);
  }
  set(next) {
    const old = this.target.peek();
    this.target.value = next;
    if (!Object.is(next, old) && typeof this.notify === "function") {
      this.notify(next, old);
    }
  }
};
var STATE_BRAND = Symbol.for("lemonadejs.state");
StateImpl.prototype[STATE_BRAND] = true;
var isState = function(v) {
  return !!v && typeof v === "object" && v[STATE_BRAND] === true;
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

// src/contract.ts
var schemas = /* @__PURE__ */ new WeakMap();
var kindOf = function(v) {
  if (v === String) return { type: "string" };
  if (v === Number) return { type: "number" };
  if (v === Boolean) return { type: "boolean" };
  if (v === Array) return { type: "array" };
  if (v === Object) return { type: "object" };
  if (v === Function) return { type: "function" };
  if (v === null || v === void 0) return { type: "any" };
  if (Array.isArray(v)) return { type: "array", default: v };
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") {
    return { type: t, default: v };
  }
  if (t === "object") return { type: "object", default: v };
  return { type: "any", default: v };
};
var buildSchema = function(name, contract2) {
  const schema = { name, props: {}, bind: null, events: [], api: [] };
  for (const key of Object.keys(contract2)) {
    const v = contract2[key];
    if (key === "bind") {
      schema.bind = kindOf(v);
    } else if (key === "api" && v && typeof v === "object" && !Array.isArray(v)) {
      schema.api = Object.keys(v);
    } else if (key.length > 2 && key.startsWith("on")) {
      schema.events.push(key);
      if (DEV && /[A-Z]/.test(key)) {
        warn("LJS-305", "use " + key.toLowerCase() + " in the contract of <" + name + ">");
      }
    } else {
      schema.props[key] = kindOf(v);
      if (DEV && /[A-Z]/.test(key)) {
        warn("LJS-401", key + " in <" + name + "> \u2014 contract prop names must be lowercase (they become HTML attributes)");
      }
    }
  }
  return schema;
};
var coerce = function(v, p) {
  if (v === null) {
    return p.type === "boolean" ? false : p.default;
  }
  if (typeof v === "string") {
    if (p.type === "number") {
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }
    if (p.type === "boolean") {
      return !(v === "false" || v === "0");
    }
  }
  return v;
};
var matches = function(v, type) {
  if (type === "any" || v === void 0 || v === null) {
    return true;
  }
  if (type === "array") {
    return Array.isArray(v);
  }
  return typeof v === type;
};
var component = function(name, contractDef, fn) {
  const schema = buildSchema(name, contractDef);
  const wrapped = function(props, tools) {
    const incoming = props || {};
    const final = { ...incoming };
    for (const key of Object.keys(schema.props)) {
      const p = schema.props[key];
      const raw = incoming[key];
      if (isState(raw)) {
        final[key] = raw;
        continue;
      }
      const v = raw === void 0 ? p.default : coerce(raw, p);
      if (DEV && v !== void 0 && !matches(v, p.type)) {
        warn("LJS-401", key + " expects " + p.type + ", got " + typeof v + " in <" + name + ">");
      }
      final[key] = new StateImpl(v);
    }
    if (schema.bind && incoming.bind === void 0 && schema.bind.default !== void 0) {
      final.bind = schema.bind.default;
    }
    if (incoming.expose) {
      const previousRef = incoming.ref;
      final.ref = function(api) {
        if (schema.api.length) {
          const published = {};
          for (const method of schema.api) {
            published[method] = api[method];
          }
          if (DEV && exposed.has(wrapped)) {
            warn("LJS-501", "<" + name + "> was already exposed \u2014 singleton overwritten");
          }
          exposed.set(wrapped, published);
          tools.onUnmount(function() {
            if (exposed.get(wrapped) === published) {
              exposed.delete(wrapped);
            }
          });
        } else if (DEV) {
          warn("LJS-501", "<" + name + "> has no api in its contract \u2014 nothing to expose");
        }
        if (previousRef) {
          previousRef(api);
        }
      };
    }
    if (DEV) {
      for (const e of schema.events) {
        if (incoming[e] !== void 0 && typeof incoming[e] !== "function") {
          warn("LJS-401", e + " expects a function in <" + name + ">");
        }
      }
    }
    return fn(Object.freeze(final), tools);
  };
  Object.defineProperty(wrapped, "name", { value: fn.name || name });
  schemas.set(wrapped, schema);
  return wrapped;
};
var contract = function(c) {
  return schemas.get(c) || null;
};
var exposed = /* @__PURE__ */ new Map();
var use = function(c) {
  return exposed.get(c) || null;
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
var components = {};
var setComponents = function(map) {
  for (const name of Object.keys(map)) {
    if (typeof map[name] === "function") {
      components[name] = map[name];
    }
  }
};
var warned = /* @__PURE__ */ new WeakSet();
var warnedCasing = /* @__PURE__ */ new Set();
var checkCasing = function(name, context) {
  if (DEV && name.length > 2 && name.startsWith("on") && /[A-Z]/.test(name)) {
    const key = name + "|" + context;
    if (!warnedCasing.has(key)) {
      warnedCasing.add(key);
      warn("LJS-305", "use " + name.toLowerCase() + " in " + context);
    }
  }
};
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
        const equal = valuesEqual(o.holder.values, view.values);
        if (equal && !isForcing()) {
          next.push(o);
          continue;
        }
        if (!o.instances.length || equal) {
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
var bindForm = function(el, state, ctx) {
  const input = el;
  const tag = el.tagName.toLowerCase();
  const isCheckbox = tag === "input" && input.type === "checkbox";
  const isRadio = tag === "input" && input.type === "radio";
  const write = function() {
    const v = state.value;
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
  const isNumeric = tag === "input" && (input.type === "number" || input.type === "range");
  const event = isCheckbox || isRadio || tag === "select" ? "change" : "input";
  el.addEventListener(event, function() {
    if (isCheckbox) {
      state.value = input.checked;
    } else if (isRadio) {
      if (input.checked) {
        state.value = input.value;
      }
    } else if (isNumeric) {
      const n = input.valueAsNumber;
      state.value = Number.isNaN(n) ? null : n;
    } else {
      state.value = input.value;
    }
  });
};
var BINDABLE_TAGS = /* @__PURE__ */ new Set(["input", "textarea", "select"]);
var applyProp = function(el, prop, ctx, svg) {
  const name = prop.name;
  const parts = prop.parts;
  const whole = parts.length === 1 && typeof parts[0] === "object" ? parts[0].slot : -1;
  if (!parts.length) {
    applyAttr(el, name, name, svg);
    return;
  }
  if (name === "bind") {
    const raw = whole >= 0 ? ctx.holder.values[whole] : parts.join("");
    if (isState(raw)) {
      if (!BINDABLE_TAGS.has(el.tagName.toLowerCase())) {
        fail("LJS-303", "<" + el.tagName.toLowerCase() + ">");
      }
      bindForm(el, raw, ctx);
    } else {
      fail("LJS-302", "got " + typeof raw + " in <" + el.tagName.toLowerCase() + ">");
    }
    return;
  }
  if (name.length > 2 && name.startsWith("on")) {
    checkCasing(name, "<" + el.tagName.toLowerCase() + ">");
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
  const type = vnode.type;
  let fn;
  if ("slot" in type) {
    fn = ctx.holder.values[type.slot];
    if (typeof fn !== "function") {
      fail("LJS-001", "value of type " + typeof fn + " used as a component tag");
    }
  } else {
    fn = components[type.name];
    if (typeof fn !== "function") {
      fail("LJS-104", "<" + type.name + ">");
    }
  }
  const props = {};
  for (const prop of vnode.props || []) {
    checkCasing(prop.name, "<" + (fn.name || "component") + ">");
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
  if (DEV && vnode.props && vnode.props.some((p) => p.name === "bind")) {
    if (vnode.props.some((p) => p.name === "value" || p.name === "checked")) {
      warn("LJS-304", "<" + tag + ">");
    }
  }
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
var mountComponent = function(component2, props, parent) {
  if (typeof component2 !== "function") {
    fail("LJS-001");
  }
  const inst = {
    name: component2.name || "Component",
    component: component2,
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
    bind: function(p, fallback) {
      const raw = p ? p.bind : void 0;
      const target = isState(raw) ? raw : new StateImpl(raw !== void 0 ? raw : fallback);
      const bound = new BoundState(target, p ? p.onchange : void 0);
      inst.states.push(bound);
      return bound;
    },
    onMount: function(cb) {
      inst.mountCbs.push(cb);
    },
    onUnmount: function(cb) {
      inst.unmountCbs.push(cb);
    }
  };
  const finalProps = DEV ? Object.freeze({ ...props }) : props;
  const before = readCount();
  const view = component2(finalProps, tools);
  if (!isView(view)) {
    fail("LJS-002", inst.name);
  }
  if (DEV && readCount() > before && !warned.has(component2)) {
    const primitive = view.values.some(function(v) {
      return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
    });
    if (primitive) {
      warned.add(component2);
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
var mount = function(component2, root, props) {
  if (!root || root.nodeType !== 1) {
    fail("LJS-003");
  }
  const inst = mountComponent(
    component2,
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
  const schema = contract(inst.component);
  return {
    component: inst.name,
    contract: schema ? schema.name : null,
    states: inst.states.map(function(s) {
      return s.peek();
    }),
    children: children.map(report)
  };
};
var unsafe = function(html2) {
  const template = document.createElement("template");
  template.innerHTML = html2;
  return [...template.content.childNodes];
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

// src/store.ts
var store = function(initial, storage) {
  let value = initial;
  if (storage && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(storage);
      if (raw !== null) {
        value = JSON.parse(raw);
      }
    } catch {
    }
  }
  const persist = storage ? function(v) {
    try {
      localStorage.setItem(storage, JSON.stringify(v));
    } catch {
    }
  } : void 0;
  return new StateImpl(value, persist);
};

// src/webcomponents.ts
function createWebComponent(a, b, c) {
  let name;
  let component2;
  let options;
  if (typeof a === "function") {
    component2 = a;
    options = b;
  } else {
    name = a;
    component2 = b;
    options = c;
  }
  if (typeof component2 !== "function") {
    fail("LJS-001", "createWebComponent");
  }
  const schema = contract(component2);
  if (!name) {
    if (schema) {
      name = schema.name;
    } else {
      fail("LJS-001", "createWebComponent(Component) needs a contract \u2014 or pass a name");
    }
  }
  const tag = (options && options.prefix ? options.prefix : "lm") + "-" + name;
  if (typeof customElements === "undefined" || customElements.get(tag)) {
    return tag;
  }
  const propNames = schema ? Object.keys(schema.props) : [];
  class LemonadeElement extends HTMLElement {
    constructor() {
      super(...arguments);
      this.handle = null;
      this._states = null;
      this._bind = null;
    }
    _ensure() {
      if (!this._states) {
        this._states = {};
        if (schema) {
          for (const key of propNames) {
            this._states[key] = new StateImpl(schema.props[key].default);
          }
          if (schema.bind) {
            this._bind = new StateImpl(schema.bind.default);
          }
        }
      }
      return this._states;
    }
    static get observedAttributes() {
      const attrs = propNames.map(function(k) {
        return k.toLowerCase();
      });
      if (schema && schema.bind) {
        attrs.push("value");
      }
      return attrs;
    }
    attributeChangedCallback(attr, _old, value) {
      if (!schema) {
        return;
      }
      const states = this._ensure();
      const key = propNames.find(function(k) {
        return k.toLowerCase() === attr;
      });
      if (key) {
        states[key].value = coerce(value, schema.props[key]);
      } else if (attr === "value" && this._bind) {
        this._bind.value = coerce(value, schema.bind);
      }
    }
    connectedCallback() {
      if (this.handle) {
        return;
      }
      const props = {};
      if (schema) {
        const states = this._ensure();
        for (const attr of this.getAttributeNames()) {
          this.attributeChangedCallback(attr, null, this.getAttribute(attr));
        }
        Object.assign(props, states);
        if (this._bind) {
          props.bind = this._bind;
        }
        const host = this;
        for (const event of schema.events) {
          const type = event.slice(2);
          props[event] = function(detail) {
            host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
          };
        }
        if (schema.bind && schema.events.indexOf("onchange") < 0) {
          props.onchange = function(detail) {
            host.dispatchEvent(new CustomEvent("change", { detail, bubbles: true, composed: true }));
          };
        }
      } else {
        for (const attr of this.getAttributeNames()) {
          props[attr] = this.getAttribute(attr);
        }
      }
      const rich = this.props;
      if (rich && typeof rich === "object") {
        Object.assign(props, rich);
      }
      this.handle = mount(component2, this, props);
    }
    disconnectedCallback() {
      const host = this;
      queueMicrotask(function() {
        if (!host.isConnected) {
          host.unmount();
        }
      });
    }
    unmount() {
      if (this.handle) {
        this.handle.unmount();
        this.handle = null;
      }
    }
  }
  if (schema) {
    for (const key of propNames) {
      Object.defineProperty(LemonadeElement.prototype, key, {
        get() {
          return this._ensure()[key].peek();
        },
        set(v) {
          this._ensure()[key].value = v;
        }
      });
    }
    if (schema.bind) {
      Object.defineProperty(LemonadeElement.prototype, "value", {
        get() {
          this._ensure();
          return this._bind.peek();
        },
        set(v) {
          this._ensure();
          this._bind.value = v;
        }
      });
    }
  }
  customElements.define(tag, LemonadeElement);
  return tag;
}

// src/index.ts
var templates = /* @__PURE__ */ new WeakMap();
var html = function(strings, ...values) {
  let template = templates.get(strings);
  if (!template) {
    template = parse(strings);
    templates.set(strings, template);
  }
  return { template, values };
};
var lemonade = {
  html,
  mount,
  inspect,
  setComponents,
  store,
  batch,
  unsafe,
  component,
  contract,
  use,
  createWebComponent,
  explain,
  version: 6
};
var index_default = lemonade;
