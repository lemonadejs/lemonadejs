;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.forms = factory();
}(this, (function () {

    'use strict';

    // Get or set a property from a JSON from a string.
    var path = function(str, val) {
        str = str.split('.');
        if (str.length) {
            var o = this;
            var p = null;
            while (str.length > 1) {
                // Get the property
                p = str.shift();
                // Check if the property exists
                if (o.hasOwnProperty(p)) {
                    o = o[p];
                } else {
                    // Property does not exists
                    if (val === undefined) {
                        return undefined;
                    } else {
                        // Create the property
                        o[p] = {};
                        // Next property
                        o = o[p];
                    }
                }
            }
            // Get the property
            p = str.shift();
            // Set or get the value
            if (val !== undefined) {
                o[p] = val;
                // Success
                return true;
            } else {
                // Return the value
                if (o) {
                    return o[p];
                }
            }
        }
        // Something went wrong
        return false;
    }

    // Get value from one element
    var getValue = function(e) {
        var value = null;
        if (e.type == 'checkbox') {
            if (e.checked == true) {
                value = e.value || true;
            }
        } else if (e.type == 'radio') {
            if (e.checked == true) {
                value = e.value;
            }
        } else if (e.type == 'file') {
            value = e.files;
        } else if (e.tagName == 'select' && e.multiple == true) {
            value = [];
            var options = el.querySelectorAll("options[selected]");
            for (var j = 0; j < options.length; j++) {
                value.push(options[j].value);
            }
        } else if (typeof(e.val) == 'function') {
            value = e.val();
        } else {
            value = e.value || '';
        }
        return value;
    }

    // Create forms
    return function(el, options) {
        var Component = {};

        // Load remote information
        Component.load = function (url) {
            fetch(url, {headers: {'X-Requested-With': 'http'}}).then(function (result) {
                result.json().then(function (result) {
                    Component.set(result);
                })
            })
        }

        // Get form elements
        Component.get = function () {
            var data = {};
            var name = null;
            var e = el.querySelectorAll("input, select, textarea, div[name]");
            for (var i = 0; i < e.length; i++) {
                if (name = e[i].getAttribute('name')) {
                    data[name] = getValue(e[i]) || '';
                }
            }
            return data;
        }

        // Set form elements
        Component.set = function (data) {
            var tmp = null;
            var name = null;
            var value = null;
            var e = el.querySelectorAll("input, select, textarea, div[name]");
            for (var i = 0; i < e.length; i++) {
                // Attributes
                var type = e[i].getAttribute('type');
                if (name = e[i].getAttribute('name')) {
                    // Transform variable names in pathname
                    name = name.replace(new RegExp(/\[(.*?)\]/ig), '.$1');
                    value = '';
                    // Search for the data in the path
                    if (name.match(/\./)) {
                        tmp = path.call(data, name) || '';
                        if (typeof (tmp) !== 'undefined') {
                            value = tmp;
                        }
                    } else {
                        if (typeof (data[name]) !== 'undefined') {
                            value = data[name];
                        }
                    }
                    // Set the values
                    if (type === 'checkbox' || type === 'radio') {
                        e[i].checked = value ? true : false;
                    } else if (type == 'file') {
                        // Do nothing
                    } else {
                        if (typeof (e[i].val) == 'function') {
                            e[i].val(value);
                        } else {
                            e[i].value = value;
                        }
                    }
                }
            }
        }

        // Integrate form
        el.val = function (v) {
            if (typeof (v) === 'undefined') {
                return Component.get();
            } else {
                Component.set(v)
            }
        }

        return Component;
    }
})));