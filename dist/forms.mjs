// src/forms.ts
import { store } from "./lemonade.mjs";
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
    fields[key] = isPlainObject(v) ? form(v) : store(v);
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
export {
  forms_default as default,
  form
};
