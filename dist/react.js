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

// src/react.ts
var react_exports = {};
__export(react_exports, {
  adaptReact: () => adaptReact,
  default: () => react_default
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");
var import_index = require("./lemonade.js");
var reactAlias = function(event) {
  return "on" + event.charAt(2).toUpperCase() + event.slice(3);
};
var adaptReact = function(component) {
  const schema = (0, import_index.contract)(component);
  return (0, import_react.forwardRef)(function(props, ref) {
    const rootRef = (0, import_react.useRef)(null);
    const statesRef = (0, import_react.useRef)(null);
    const bindRef = (0, import_react.useRef)(null);
    const apiRef = (0, import_react.useRef)(null);
    const propsRef = (0, import_react.useRef)(props);
    propsRef.current = props;
    if (!statesRef.current) {
      const states = {};
      if (schema) {
        for (const key of Object.keys(schema.props)) {
          states[key] = (0, import_index.store)(props[key] !== void 0 ? props[key] : schema.props[key].default);
        }
        if (schema.bind) {
          bindRef.current = (0, import_index.store)(props.value !== void 0 ? props.value : schema.bind.default);
        }
      }
      statesRef.current = states;
    }
    (0, import_react.useEffect)(function() {
      const mountProps = { ...statesRef.current };
      if (schema) {
        if (bindRef.current) {
          mountProps.bind = bindRef.current;
        }
        for (const event of schema.events) {
          mountProps[event] = function(...args) {
            const cb = propsRef.current[event] || propsRef.current[reactAlias(event)];
            if (typeof cb === "function") {
              return cb(...args);
            }
          };
        }
        if (schema.bind && schema.events.indexOf("onchange") < 0) {
          mountProps.onchange = function(...args) {
            const cb = propsRef.current.onchange || propsRef.current.onChange;
            if (typeof cb === "function") {
              return cb(...args);
            }
          };
        }
        if (schema.api.length) {
          mountProps.ref = function(api) {
            apiRef.current = api;
          };
        }
      } else {
        Object.assign(mountProps, propsRef.current);
      }
      const handle = (0, import_index.mount)(component, rootRef.current, mountProps);
      return function() {
        apiRef.current = null;
        handle.unmount();
      };
    }, []);
    (0, import_react.useEffect)(function() {
      const states = statesRef.current;
      if (schema && states) {
        for (const key of Object.keys(schema.props)) {
          if (props[key] !== void 0) {
            states[key].value = props[key];
          }
        }
        if (bindRef.current && props.value !== void 0) {
          bindRef.current.value = props.value;
        }
      }
    });
    (0, import_react.useImperativeHandle)(
      ref,
      function() {
        const facade = {};
        if (schema) {
          for (const method of schema.api) {
            facade[method] = function(...args) {
              const api = apiRef.current;
              if (api && typeof api[method] === "function") {
                return api[method](...args);
              }
            };
          }
        }
        return facade;
      },
      []
    );
    return (0, import_react.createElement)("div", { ref: rootRef, style: { display: "contents" } });
  });
};
var react_default = adaptReact;
