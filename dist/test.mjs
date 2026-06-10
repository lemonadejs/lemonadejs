// src/test.ts
import { mount, inspect, contract as contractOf, store } from "./lemonade.mjs";
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
  const schema = contractOf(component);
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
      const state = store(SAMPLES[schema.props[key].type]);
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
      const state = store(schema.bind.default);
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
export {
  test_default as default,
  render,
  verify
};
