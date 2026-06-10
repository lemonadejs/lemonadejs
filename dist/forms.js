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

// src/forms.ts
var forms_exports = {};
__export(forms_exports, {
  default: () => forms_default,
  form: () => form
});
module.exports = __toCommonJS(forms_exports);

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
  "LJS-104": "Unknown component \u2014 register it: setComponents({ Card }), or embed by value: <${Card} />",
  "LJS-105": "Expression ${...} is not allowed in this position",
  "LJS-201": "State contents are frozen in dev mode \u2014 assign a new value instead of mutating",
  "LJS-202": "Slot holds a snapshot \u2014 wrap dynamic expressions: ${() => ...}",
  "LJS-203": "Update loop detected \u2014 a state change keeps triggering itself",
  "LJS-301": 'Event attributes require a function: onclick="${() => ...}"',
  "LJS-302": 'bind requires a state: bind="${state}"',
  "LJS-303": "bind works on <input>, <textarea> and <select> \u2014 on components it is a prop",
  "LJS-304": "bind owns the element value \u2014 remove the explicit value/checked attribute",
  "LJS-305": "Callback names are lowercase \u2014 did you mean onchange?"
};
var format = function(code, detail) {
  const message = MESSAGES[code] || "Unknown error";
  return code + ": " + message + (detail ? " \u2014 " + detail : "");
};
var fail = function(code, detail) {
  throw new Error(format(code, detail));
};

// src/reactivity.ts
var current = null;
var depth = 0;
var reads = 0;
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

// src/forms.ts
var isPlainObject = function(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return false;
  }
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};
var form = function(initial) {
  const fields = {};
  for (const key of Object.keys(initial)) {
    const v = initial[key];
    fields[key] = isPlainObject(v) ? form(v) : new StateImpl(v);
  }
  const isGroup = function(field) {
    return typeof field.$get === "function";
  };
  Object.defineProperty(fields, "$get", {
    value: function() {
      const out = {};
      for (const key of Object.keys(fields)) {
        const field = fields[key];
        out[key] = isGroup(field) ? field.$get() : field.peek();
      }
      return out;
    }
  });
  Object.defineProperty(fields, "$set", {
    value: function(values) {
      if (!values || typeof values !== "object") {
        return;
      }
      for (const key of Object.keys(values)) {
        const field = fields[key];
        if (field === void 0) {
          continue;
        }
        const v = values[key];
        if (isGroup(field)) {
          field.$set(v);
        } else {
          field.value = v;
        }
      }
    }
  });
  return fields;
};
var forms_default = form;
