/**
 * Lemonadejs v2.0.0.alpha
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distribute under MIT License
 */

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            global.lemonade = factory();
}(this, (function () {

    'use strict';

    /**
     * The element passed is a DOM element
     */
    var isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
    }

    /**
     * Process all methods queued from the ready property
     */
    var queue = function(e) {
        var o = null;
        if (o = e.lemon) {
            // Verify any pending ready
            if (o.queue) {
                var q = null;
                while (q = o.queue.shift()) {
                    q();
                }
            }

            // Onload events
            if (typeof(o.self.onload) == 'function') {
                o.self.onload.call(o.self, e);
            }
        }
    }

    /**
     * Set attribute value helper
     */
    var setAttribute = function(e, v, t) {
        if (t == 'children') {
            for (var j = 0; j < e.children.length; j++) {
                e.children[j].selected = v.indexOf(e.children[j].value) >= 0;
            }
        } else if (t == 'checked') {
            if (e.type == 'radio') {
                e.checked = false;
                if (e.value == v) {
                    e.checked = true;
                }
            } else {
                e.checked = v ? true : false;
            }
        } else if (t == 'value' || typeof(e[t]) !== 'undefined') {
            e[t] = v;
        } else {
            e.setAttribute(t, v);
        }
    }

    /**
     * Dispatch changes in the self properties
     */
    var dispatch = function(property) {
        var t,v,e = null;
        // Tracking
        if (t = this.tracking[property]) {
            for (var i = 0; i < t.length; i++) {
                // Make sure self is visible during eval
                var self = this.self;
                // Element
                e = t[i].element
                // Parse value
                v = eval(t[i].v);
                // If the property is the value
                if (t[i].property == 'value') {
                    if (e.value != v) {
                        if (typeof(e.val) == 'function') {
                            e.val(v);
                        }
                        e.value = v;
                    }
                } else {
                    // Other properties
                    if (e.lemon) {
                        e.lemon.self[t[i].property] = v;
                    } else {
                        setAttribute(e, v, t[i].property);
                    }
                }
            }
        }

        // Onchange
        if (typeof(this.onchange) == 'function') {
            this.onchange.call(this.self, property, t);
        }
    }

    /**
     * Bind an property to one action and start tracking
     */
    var bind = function(property) {
        // Save as state
        if (Array.isArray(this.self[property])) {
            Array.prototype.refresh = function() {
                dispatch.call(lemon, property);
            }
        } else {
            // Lemon handler
            var lemon = this;
            // Create the observer
            Object.defineProperty(this.self, property, {
                set: function(val) {
                    // Update val
                    lemon.state[property] = val;
                    // Refresh binded elements
                    dispatch.call(lemon, property);
                },
                get: function() {
                    // Get value
                    return lemon.state[property];
                }
            });
        }
    }

    var create = function(element, res, type) {
        var tokens = res.v.match(/self\.([a-zA-Z0-9_].*?)*/g);
        if (tokens.length) {
            // Value
            var value = eval(res.v) || '';
            // Create text node
            if (type == 'textContent') {
                var e = document.createTextNode(value);
                if (element.childNodes[0]) {
                    element.insertBefore(e, element.childNodes[0].splitText(res.p));
                } else {
                    element.appendChild(e);
                }
            } else {
                e = element;
                setAttribute(element, value, type);
            }

            if (! e) {
                return;
            }
            for (var i = 0; i < tokens.length; i++) {
                // Get property name
                var token = tokens[i].replace('self.', '');

                // Current value of token
                var b = false;
                var v = this.self[token];

                // Create tracking
                if (! this.tracking[token]) {
                    // Create tracking container for the property
                    this.tracking[token] = [];
                    // Bind
                    b = true;
                }

                // Add to the tracking
                this.tracking[token].push({
                    element: e,
                    property: type,
                    v: res.v
                });

                // Create tracker
                if (b) {
                    bind.call(this, token);
                }

                // Initial value
                this.self[token] = v;
            }
        }
    }

    var attributes = function(e, attr, type) {
        // Content
        var result = [];
        var index = 0;

        if (e.getAttribute && e.getAttribute(type)) {
            e.setAttribute(type, e.getAttribute(type).replace(/{{(.*?)}}/g, function (a,b,c,d) {
                result.push({ p: c - index, v: b });
                index = index + a.length;
                return '';
            }));
        } else {
            if (typeof(e[type]) == 'string' && e[type]) {
                e[type] = e[type].replace(/{{(.*?)}}/g, function (a,b,c,d) {
                    result.push({ p: c - index, v: b });
                    index = index + a.length;
                    return '';
                });
            }
        }

        if (result.length) {
            if (result.length == 1 && type == 'textContent' && ! e.innerText) {
                type = 'innerHTML';
            }

            for (var i = result.length - 1; i >= 0; i--) {
                create.call(this, e, result[i], type);
            }
        }
    }

    var parse = function(element) {
        // Attributes
        var tmp = null;
        var attr = {};

        if (element.attributes && element.attributes.length) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr[element.attributes[i].name] = element.attributes[i].value;
            }
        }

        // Keys
        var k = Object.keys(attr);

        if (k.length) {
            for (var i = 0; i < k.length; i++) {
                // Parse events
                if (k[i].substring(0,2) == 'on') {
                    // Get event
                    var event = k[i].toLowerCase();
                    var value = attr[k[i]];

                    // Get action
                    element.removeAttribute(event);
                    if (! element.events) {
                        element.events = []
                    }
                    element[event] = Function('self', value).bind(element, this.self);
                } else {
                    // Events
                    if (! element.events) {
                        element.events = []
                    }
                    if (k[i] == '@ready') {
                        // Add this method to the queue
                        this.queue.push(Function('self', attr[k[i]]).bind(element, this.self));
                        // Remove attribute
                        element.removeAttribute(k[i]);
                    } else if (k[i] == '@ref') {
                        // Get the property name of the reference
                        var ref = attr[k[i]].replace('self.', '');
                        // Make it available to the self
                        this.self[ref] = element;
                        // Remove attribute
                        element.removeAttribute(k[i]);
                    } else if (k[i] == '@bind') {
                        // Definitions
                        var property = 'value';
                        var e = attr[k[i]] + ' = this.value;';
                        // Based on the element
                        if (element.multiple == true) {
                            var e = 'var a = []; for (var i = 0; i < this.options.length; i++) { if (this.options[i].selected) { a.push(this.options[i].value); } } ' + attr[k[i]] + ' = a; ' + attr[k[i]] + '.refresh();';
                            var property = 'children';
                        } else if (element.type == 'checkbox') {
                            var e = attr[k[i]] + " = this.checked && this.getAttribute('value') ? this.value : this.checked;";
                            var property = 'checked';
                        } else if (element.type == 'radio') {
                            var property = 'checked';
                        }
                        // Onchange event for the element
                        element.onchange = Function('self', e).bind(element, this.self);
                        if (property == 'value') {
                            element.onkeyup = element.onchange;
                        }
                        // Way back
                        create.call(this, element, { v:attr[k[i]] }, property);
                        // Remove attribute
                        element.removeAttribute(k[i]);
                    } else {
                        // Parse attributes
                        attributes.call(this, element, attr[k[i]], k[i]);
                        // TODO: Translate move to attributes?
                        if (L.dictionary) {
                            if (tmp = L.translate(attr[k[i]])) {
                                element.setAttribute(k[i], tmp);
                            }
                        }
                    }
                }
            }
        }

        // Check the children
        if (element.children.length) {
            for (var i = 0; i < element.children.length; i++) {
                parse.call(this, element.children[i]);
            }
        } else {
            // Parse textual content
            attributes.call(this, element, 'innerText', 'textContent');
            // TODO: Translate move to attributes?
            if (L.dictionary) {
                if (tmp = L.translate(element.innerText)) {
                    element.innerText = tmp;
                }
            }
        }

        // TODO: add extensions to queue!
        if (this.components && element.constructor == HTMLUnknownElement) {
            // Method name
            var m = element.tagName;
            // Custom uccase
            m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            // Verify scope in the declared extensions
            if (typeof(this.components[m]) == 'function') {
                var s = {};
                // Options
                for (var i = 0; i < element.attributes.length; i++) {
                    s[element.attributes[i].name] = element.attributes[i].value;
                }
                // Render
                var o = L.render(this.components[m], element, s);
                // Custom lemonade
                element.lemon = o.lemon;
            }
        }
    }

    // Lemonadejs object
    var L = {};

    /**
     * Render a lemonade DOM element, method or class into a root DOM element
     * @param o - Lemonade DOM created from a template
     * @param el - DOM Element to append the lemonade element
     */
    L.render = function(o, el, self) {
        // Root element but be a valid DOM element
        if (! isDOM(el)) {
            console.log('DOM element given is not valid')
            return false;
        }

        if (! self) {
            self = {};
        }

        // Flexible element (class or method)
        if (typeof(o) == 'function') {
            try {
                o = o.call(self);
            } catch {
                o = new o(self);
                o = L.element(o.render(), o);
            }
        }

        // Append child if not appended
        el.appendChild(o);

        // Process ready queue
        queue(o);

        return o;
    }

    /**
     * Create a new component
     * @param mixed - DOM/template
     * @param s - self component object
     * @param components - related objects
     */
    L.element = function(t, self, ext) {
        // Lemonade handler
        var lemon = {
            self: self||{},
            state: {},
            tracking: {},
            queue: [],
        }

        // Extended components
        if (ext) {
            lemon.components = ext;
        }

        if (! isDOM(t)) {
            // Create the root element
            var div = document.createElement('div');
            // Get the DOM content
            div.innerHTML = t.trim();
            // Already single DOM, do not need a container
            if (div.childNodes.length == 1) {
                div = div.childNodes[0];
            }
        } else {
            var div = t;
        }

        // Parse the content
        parse.call(lemon, div);

        // Make lemon object available though the DOM is there a better way
        div.lemon = lemon;

        return div;
    }

    // Deprected
    L.template = L.element;


    /**
     * Mix all template, self
     */
    L.blender = function(template, self, el) {
        return L.render(L.element(template, self), el, self);
    }

    /**
     * Apply self to an existing appended DOM element
     */
    L.apply = function(el, self) {
        L.template(el, self);
        // Process whatever we have in the queue
        queue(el);
    }

    /**
     * Get only the properties described on v
     */
    L.getProperties = function(v) {
        var o = {};
        for (var property in v) {
            o[property] = this[property];
        }
        return o;
    }

    /**
     * Set the values described on v
     */
    L.setProperties = function(v) {
        for (var property in v) {
            if (this.hasOwnProperty(property)) {
                this[property] = v[property];
            }
        }
        return this;
    }

    /**
     * Reset the values described on v
     */
    L.resetProperties = function(v) {
        for (var property in v) {
            this[property] = '';
        }
    }

    /**
     * Translate
     */
    L.translate = function(o) {
        if (o.substr(0,3) == '^^[' && o.substr(-3) == ']^^') {
            o = o.replace('^^[','').replace(']^^','');
            return L.dictionary[o] || o;
        }
    }

    L.component = class {
        constructor() {
        }
    }

    return L;
})));