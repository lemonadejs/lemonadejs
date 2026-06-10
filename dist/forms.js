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
var import_index = require("./lemonade.js");
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
    fields[key] = isPlainObject(v) ? form(v) : (0, import_index.store)(v);
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
