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

// src/test.ts
var test_exports = {};
__export(test_exports, {
  default: () => test_default,
  flush: () => flush,
  render: () => render,
  setRect: () => setRect,
  verify: () => verify
});
module.exports = __toCommonJS(test_exports);
var import_index = require("./lemonade.js");
var serialize = function(node, depth) {
  const pad = "  ".repeat(depth);
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
    lines.push(...serialize(child, depth + 1));
  }
  return lines;
};
var render = function(component, props) {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const handle = (0, import_index.mount)(component, root, props);
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
      return (0, import_index.inspect)(root);
    },
    unmount: function() {
      handle.unmount();
      root.remove();
    }
  };
};
var flush = function() {
  return new Promise(function(resolve) {
    setTimeout(resolve, 0);
  });
};
var setRect = function(el, rect) {
  const r = {
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    top: rect.top ?? 0,
    left: rect.left ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    right: rect.right ?? (rect.left ?? 0) + (rect.width ?? 0),
    bottom: rect.bottom ?? (rect.top ?? 0) + (rect.height ?? 0)
  };
  el.getBoundingClientRect = function() {
    return { ...r, toJSON: () => r };
  };
};
var SAMPLES = {
  string: "sample",
  number: 1,
  boolean: true,
  array: [],
  object: {},
  function: function() {
  },
  any: "sample"
};
var verify = function(component) {
  const checks = [];
  const run = function(name, fn) {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = function(...args) {
      warnings.push(String(args[0]));
    };
    try {
      fn();
      const offences = warnings.filter(function(w) {
        return w.indexOf("LJS-") >= 0;
      });
      if (offences.length) {
        throw new Error(offences.join("; "));
      }
      checks.push({ name, pass: true });
    } catch (e) {
      checks.push({ name, pass: false, detail: e.message });
    } finally {
      console.warn = originalWarn;
    }
  };
  const schema = (0, import_index.contract)(component);
  if (!schema) {
    return {
      component: component.name || "Component",
      pass: false,
      checks: [
        {
          name: "has contract",
          pass: false,
          detail: "not published \u2014 wrap it: component(name, contract, fn)"
        }
      ]
    };
  }
  run("mounts with defaults", function() {
    render(component).unmount();
  });
  for (const key of Object.keys(schema.props)) {
    run("prop " + key, function() {
      const props = {};
      props[key] = SAMPLES[schema.props[key].type];
      render(component, props).unmount();
    });
    run("prop " + key + " (live state)", function() {
      const props = {};
      const state = (0, import_index.store)(SAMPLES[schema.props[key].type]);
      props[key] = state;
      const t = render(component, props);
      state.touch();
      t.unmount();
    });
  }
  for (const event of schema.events) {
    run("event " + event, function() {
      const props = {};
      props[event] = function() {
      };
      render(component, props).unmount();
    });
  }
  if (schema.bind) {
    run("bind", function() {
      const state = (0, import_index.store)(schema.bind.default);
      const t = render(component, { bind: state });
      state.value = SAMPLES[schema.bind.type];
      t.unmount();
    });
  }
  if (schema.api.length) {
    run("api via ref", function() {
      let api = null;
      const t = render(component, {
        ref: function(a) {
          api = a;
        }
      });
      t.unmount();
      for (const method of schema.api) {
        if (!api || typeof api[method] !== "function") {
          throw new Error("api." + method + " not exposed through props.ref");
        }
      }
    });
  }
  return {
    component: schema.name,
    pass: checks.every(function(c) {
      return c.pass;
    }),
    checks
  };
};
var test_default = render;
