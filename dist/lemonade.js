/**
 * Lemonadejs v2.0.5
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
     * Refresh prototype
     */
    Array.prototype.refresh = function() {
        console.error('Deprected. Please use self.refresh("property")');
    }

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
                e.checked = ! v || v === '0' || v === 'false' ? false : true;
            }
        } else if (typeof(e[t]) !== 'undefined' || typeof(v) == 'function' || typeof(v) == 'object') {
            e[t] = v;
        } else {
            e.setAttribute(t, v);
        }
    }

    /**
     * Dispatch changes in the self properties
     */
    var dispatch = function(property) {
        var self,t,v,e,p,i = null;
        // Tracking
        if (t = this.tracking[property]) {
            // Make sure self is visible during eval
            self = this.self;
            // Loop all affected elements
            for (i = 0; i < t.length; i++) {
                // Element
                e = t[i].element
                // Parse value
                v = eval(t[i].v);
                // Property
                p = t[i].property;
                // If the property is the value
                if (p == 'value') {
                    if (e.value != v) {
                        if (typeof(e.val) == 'function') {
                            e.val(v);
                        }
                        e.value = v;
                    }
                } else if (p == '@loop') {
                    generate.call(e, v, self)
                } else {
                    // Other properties
                    if (e.self) {
                        e.self[p] = v;
                    } else {
                        setAttribute(e, v, p);
                    }
                }
            }

            // Onchange // DOCS update
            if (typeof(self.onchange) == 'function') {
                self.onchange.call(this, property, t, self);
            }
        }
    }

    /**
     * Bind an property to one action and start tracking
     */
    var bind = function(property) {
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

    var create = function(element, res, type) {
        var tokens = res.v.match(/self\.([a-zA-Z0-9_].*?)*/g);
        if (tokens.length) {
            var self = this.self;
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
            } else if (type == '@loop') {
                var e = element;
            } else {
                var e = element;
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
                var v = this.self[token]||'';

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

    var attributes = function(e, type) {
        // Content
        var result = [];
        var index = 0;
        var r = function (a,b,c,d)  {
            result.push({ p: c - index, v: b });
            index = index + a.length;
            return '';
        }

        if (e.getAttribute && e.getAttribute(type)) {
            e.setAttribute(type, e.getAttribute(type).replace(/{{(.*?)}}/g, r));
        } else {
            if (typeof(e[type]) == 'string' && e[type]) {
                e[type] = e[type].replace(/{{(.*?)}}/g, r);
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

    /**
     * Get attributes as an object
     * @param {boolean} props Get all properties from the property of the element or the property string
     * @return {object}
     */
    var getAttributes = function(props) {
        var o = {};
        var k = null;
        var a = this.attributes;
        if (a && a.length) {
            for (var i = 0; i < a.length; i++) {
                k = a[i].name;
                if (props == true && typeof(this[k]) !== 'undefined') {
                    o[k] = this[k];
                } else {
                    o[k] = a[i].value;
                }
            }
        }
        return o;
    }

    /**
     * Parse all attributes from one element
     * @param {HTMLElement} element
     */
    var parse = function(element) {
        // Attributes
        var tmp = null;
        var attr = getAttributes.call(element);

        // Mark custom handlers
        if (this.components && element.constructor == HTMLUnknownElement) {
            // Method name
            var m = element.tagName;
            // Custom uccase
            m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            // Expected function
            var f = this.components[m];
            // Verify scope in the declared extensions
            if (typeof(f) == 'function') {
                element.handler = f;
                element.parent = element.parentNode;
                element.self = {};
                // When has a template
                element.template = element.innerHTML;
                // Remove the template
                element.innerHTML = '';
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
                    element[event] = Function('self', value).bind(element, this.self);
                    // Add attribute to the self
                    if (element.handler) {
                        element.self[event] = element[event];
                    }
                } else {
                    // Property name
                    var prop = attr[k[i]].replace('self.', '');
                    // Special properties
                    if (k[i] == '@ready') {
                        // Add this method to the queue
                        this.queue.push(Function('self', attr[k[i]]).bind(element, this.self));
                        // Remove attribute
                        element.removeAttribute(k[i]);
                    } else if (k[i] == '@ref') {
                        // Make it available to the self
                        this.self[prop] = element.self ? element.self : element;
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
                            element.oninput = element.onchange;
                        }
                        // Way back
                        create.call(this, element, { v:attr[k[i]] }, property);
                        // Keep reference to the original definition
                        element[k[i]] = prop;
                        // Remove attribute
                        element.removeAttribute(k[i]);
                    } else if (k[i] == '@loop') {
                        // Parse attributes
                        create.call(this, element, { v:attr[k[i]] }, '@loop');
                        element.loop = this.self[prop];
                        element.removeAttribute(k[i]);
                    } else {
                        // Parse attributes
                        attributes.call(this, element, k[i]);
                        // Lemonade translation helper
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
            if (element.textContent) {
                // Parse textual content
                attributes.call(this, element, 'textContent');
                // Lemonade translation helper
                if (L.dictionary) {
                    if (tmp = L.translate(element.innerText)) {
                        element.innerText = tmp;
                    }
                }
            }
        }

        // Process the custom handler
        var t = typeof(element.handler);
        if (t !== 'undefined') {
            // Root for custom is the parent
            if (t === 'function') {
                if (typeof(element.loop) == 'undefined') {
                    // Make sure the self goes as a reference
                    var s = L.setProperties.call(element.self, getAttributes.call(element, true), true);
                    // Add handler to the queue
                    L.render(element.handler, element.parent, s, element.template);
                }
                // Remove DOM from the view
                element.remove();
            }
        }
    }

    /**
     * Append custom compoents to the DOM
     */
    var generate = function(data, parent) {
        var t = null;
        // Root parent
        var r = this.parent;
        // Function handler
        var f = this.handler;
        // DOM element that need to go to the root
        var d = [];
        if (data.length) {
            for (let i = 0; i < data.length; i++) {
                let o = data[i].el;
                if (! o) {
                    // Create propety
                    Object.defineProperty(data[i], 'el', {
                        enumerable: false,
                        get: function() {
                            // Keep the reference to the DOM
                            return o;
                        }
                    });
                    // Parent
                    Object.defineProperty(data[i], 'parent', {
                        enumerable: false,
                        get: function() {
                            // Keep the reference to the parent
                            return parent;
                        }
                    });
                    // Create element
                    o = L.render(f, r, data[i]);
                }
                d.push(o);
            }
        }
        // Remove all DOM
        while (r.firstChild) {
            r.firstChild.remove();
        }
        // Insert necessary DOM
        while (t = d.shift()) {
            r.appendChild(t);
        }
    }

    // Lemonadejs object
    var L = {};

    /**
     * Render a lemonade DOM element, method or class into a root DOM element
     * @param o - Lemonade DOM created from a template
     * @param el - DOM Element to append the lemonade element
     * @param self - existing self
     * @param t - template when used used as a custom component
     */
    L.render = function(o, el, self, t) {
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
                o = o.call(self, t);
            } catch {
                o = new o(self);
                o = L.element(o.render(t), o);
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
            var el = document.createElement('div');
            // Get the DOM content
            el.innerHTML = t.trim();
            // Already single DOM, do not need a container
            if (el.childNodes.length == 1) {
                el = el.childNodes[0];
            } else {
                console.error('The template should have a single root');
            }
        } else {
            var el = t;
        }

        // Parse the content
        parse.call(lemon, el);

        // Refresh properties
        Object.defineProperty(lemon.self, 'refresh', {
            get: function() {
                return function(prop) {
                    dispatch.call(lemon, prop);
                }
            }
        });

        // Make lemon object available though the DOM is there a better way
        el.lemon = lemon;

        return el;
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
    L.setProperties = function(v, create) {
        for (var property in v) {
            if (this.hasOwnProperty(property) || create) {
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