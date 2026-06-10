// src/react.ts
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { contract, mount, store } from "./lemonade.mjs";
var reactAlias = function(event) {
  return "on" + event.charAt(2).toUpperCase() + event.slice(3);
};
var adaptReact = function(component) {
  const schema = contract(component);
  return forwardRef(function(props, ref) {
    const rootRef = useRef(null);
    const statesRef = useRef(null);
    const bindRef = useRef(null);
    const apiRef = useRef(null);
    const propsRef = useRef(props);
    propsRef.current = props;
    if (!statesRef.current) {
      const states = {};
      if (schema) {
        for (const key of Object.keys(schema.props)) {
          states[key] = store(props[key] !== void 0 ? props[key] : schema.props[key].default);
        }
        if (schema.bind) {
          bindRef.current = store(props.value !== void 0 ? props.value : schema.bind.default);
        }
      }
      statesRef.current = states;
    }
    useEffect(function() {
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
      const handle = mount(component, rootRef.current, mountProps);
      return function() {
        apiRef.current = null;
        handle.unmount();
      };
    }, []);
    useEffect(function() {
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
    useImperativeHandle(
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
    return createElement("div", { ref: rootRef, style: { display: "contents" } });
  });
};
var react_default = adaptReact;
export {
  adaptReact,
  react_default as default
};
