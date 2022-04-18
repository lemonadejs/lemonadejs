/**
 * Lemonadejs v2.6.2
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
     * Global queue
     */
    var R = null;
    if (! document.lemonadejs) {
        R = document.lemonadejs = {
            queue: [],
            container: {}
        }
    }

    /**
     * The element passed is a DOM element
     */
    var isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
    }

    /**
     * Is a class
     */
    var isClass = function(f) {
        return typeof f === 'function' && /^class\s/.test(Function.prototype.toString.call(f));
    }

    /**
     * Basic handler
     * @param h - HTML
     * @param e - Extensions
     * @returns lemonade.element
     */
    var Basic = function(h, e) {
        return L.element(h, this, e)
    }

    /**
     * Process all methods queued from the ready property
     */
    var queue = function(e, el) {
        var q = null;
        var o = null;
        if (o = e.lemon) {
            // Verify any pending ready
            if (o.queue) {
                while (q = o.queue.shift()) {
                    R.queue.push(q);
                }
            }

            // Onload events
            if (typeof (o.self.onload) == 'function') {
                R.queue.push(o.self.onload.bind(o.self, e));
            }
        }

        // Unqueue
        if (document.body.contains(el) && R && R.queue && R.queue.length) {
            while (q = R.queue.shift()) {
                q();
            }
        }
    }

    /**
     * Get the attribute helper
     */
    var getAttribute = function(e) {
        var v = null;
        if (typeof(e.val) === 'function') {
            v = e.val();
        } else {
            if (e.tagName == 'SELECT' && e.getAttribute('multiple')) {
                v = [];
                for (var i = 0; i < e.options.length; i++) {
                    if (e.options[i].selected) {
                        v.push(e.options[i].value);
                    }
                }
            } else if (e.type == 'checkbox') {
                v = e.checked && e.getAttribute('value') ? e.value : e.checked;
            } else if (e.getAttribute('contenteditable')) {
                v = e.innerHTML;
            } else {
                v = e.value;
            }
        }
        return v;
    }

    /**
     * Set attribute value helper
     */
    var setAttribute = function(e, v, t) {
        if (t === 'value') {
            // Update HTML form element
            if (typeof(e.val) === 'function') {
                if (e.val() != v) {
                    e.val(v);
                }
            } else if (e.tagName == 'SELECT' && e.getAttribute('multiple')) {
                for (var j = 0; j < e.children.length; j++) {
                    e.children[j].selected = v.indexOf(e.children[j].value) >= 0;
                }
            } else if (e.type == 'checkbox') {
                e.checked = ! v || v === '0' || v === 'false' ? false : true;
            } else if (e.type == 'radio') {
                e.checked = false;
                if (e.value == v) {
                    e.checked = true;
                }
            } else if (e.getAttribute('contenteditable')) {
                if (e.innerHTML != v) {
                    e.innerHTML = v;
                }
            } else {
                e.value = v;
            }
        } else if (typeof(e[t]) !== 'undefined' || typeof(v) == 'function' || typeof(v) == 'object') {
            e[t] = v;
        } else {
            e.setAttribute(t, v);
        }
    }

    /**
     * Parse javascript
     */
    var run = function(s) {
        return Function('self', '"use strict";return (' + s + ')')(this);
    }

    /**
     * Dispatch changes in the self properties
     */
    var dispatch = function(property, first) {
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
                v = run.call(self, t[i].v);
                // Property
                p = t[i].property;
                // If the property is the value
                if (p == '@loop') {
                    generate.call(e, v, self, this.components)
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
            if (! first && typeof(self.onchange) == 'function') {
                self.onchange.call(e, property, t, self);
            }
        }
    }

    /**
     * Bind an property to one action and start tracking
     */
    var bind = function(p) {
        // Lemon handler
        var lemon = this;
        // First call
        var first = true;
        // Create the observer
        Object.defineProperty(this.self, p, {
            set: function(v) {
                // Update val
                lemon.state[p] = v;
                // Refresh bound elements
                dispatch.call(lemon, p, first);
                // First call
                first = false;
            },
            get: function() {
                // Get value
                return lemon.state[p];
            },
            configurable: true, // For JSON export
            enumerable: true  // For JSON export
        });
    }

    var create = function(element, res, type) {
        var self = this.self;
        // Value
        var value = run.call(self, res.v);
        if (typeof(value) === 'undefined') {
            value = '';
        }
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

        var tokens = res.v.match(/self\.([a-zA-Z0-9_].*?)*/g);
        if (tokens && tokens.length) {
            for (var i = 0; i < tokens.length; i++) {
                // Get property name
                var token = tokens[i].replace('self.', '');

                // Current value of token
                var b = false;
                var v = this.self[token];
                if (typeof(v) === 'undefined') {
                    v = '';
                }

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
        var lemon = this;
        // Attributes
        var t = null;
        var attr = getAttributes.call(element);

        // Mark custom handlers
        if (this.components) {
            // Method name
            var m = element.tagName;
            // Custom capital letter first
            m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            // Expected function
            t = this.components[m];
            // Verify scope in the declared extensions
            if (typeof(t) == 'function') {
                element.handler = t;
            }
        }

        // Loop without a handler
        if (element.getAttribute('@loop') && ! t) {
            t = true;
            element.parent = element;
        }

        // Bind properties
        if (t) {
            element.self = {};
            element.template = element.innerHTML;
            element.innerHTML = '';
        }

        // Keys
        var k = Object.keys(attr);
        if (k.length) {
            for (var i = 0; i < k.length; i++) {
                // Parse events
                if (! element.handler && k[i].substring(0,2) == 'on') {
                    // Get event
                    let event = k[i].toLowerCase();
                    let value = attr[k[i]];
                    // Get action
                    element.removeAttribute(event);
                    element.addEventListener(k[i].substring(2), function(e) {
                        Function('self','e', value).call(this, lemon.self, e);
                    });
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
                        // Onchange event for the element
                        element.oninput = function(a, b) {
                            // Update val
                            this.state[b] = getAttribute(a);
                            // Refresh bound elements
                            dispatch.call(this, b);
                        }.bind(this, element, prop);
                        // Way back
                        create.call(this, element, { v:attr[k[i]] }, 'value');
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
                        if (document.dictionary) {
                            if (t = L.translate(attr[k[i]])) {
                                element.setAttribute(k[i], t);
                            }
                        }
                    }
                }
            }
        }

        // Check the children
        if (element.children.length) {
            var t = [];
            for (var i = 0; i < element.children.length; i++) {
                t.push(element.children[i]);
            }
            for (var i = 0; i < t.length; i++) {
                parse.call(this, t[i]);
            }
        } else {
            if (element.textContent) {
                // Parse textual content
                attributes.call(this, element, 'textContent');
                // Lemonade translation helper
                if (document.dictionary) {
                    if (t = L.translate(element.innerText)) {
                        element.innerText = t;
                    }
                }
            }
        }

        // Process the custom handler
        var h = element.handler;

        // Root for custom is the parent
        if (typeof(h) === 'function') {
            // Component type
            if (typeof(element.loop) == 'undefined') {
                // Root
                var r = element.parentNode;
                // Make sure the self goes as a reference
                var s = L.setProperties.call(element.self, getAttributes.call(element, true), true);
                // Reference to the element
                register(s, 'parent', this.self);
                // Create component
                L.render(h, r, s, element.template, element, lemon.components);
            }
            // Remove component container
            element.remove();
        }
    }

    /**
     * Register element
     */
    var register = function(o, p, r) {
        Object.defineProperty(o, p, {
            enumerable: false,
            configurable: true,
            get: function() {
                return r;
            }
        });
    }

    /**
     * Append custom components to the DOM
     * @param {object} data - self for each element in the array
     * @param {HTMLElement} - parentNode or root for the children
     * @param {object} ext - components declared in the lemonade.element
     */
    var generate = function(data, parent, ext) {
        var t = null;
        // Root parent
        if (! this.parent) {
            this.parent = this.parentNode;
        }
        var r = this.parent;
        // Function handler
        var f = this.handler || Basic;
        // Template
        var t = this.template;
        // DOM element that need to go to the root
        var d = [];
        if (data.length) {
            for (let i = 0; i < data.length; i++) {
                let o = data[i].el;
                if (! o) {
                    // Create reference to the element
                    register(data[i], 'parent', parent);
                    // Create element
                    o = L.render(f, r, data[i], t, null, ext);
                }
                if (r.getAttribute('unique') === 'false') {
                    register(data[i], 'el', null);
                }
                d.push(o);
            }
        }

        // Remove all DOM
        while (r.children[0]) {
            r.children[0].remove();
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
    L.render = function(o, el, self, t, ref, ext) {
        // Root element but be a valid DOM element
        if (! isDOM(el)) {
            console.log('Not valid DOM')
            return false;
        }

        if (! self) {
            self = {};
        }

        // Flexible element (class or method)
        if (typeof(o) == 'function') {
            if (isClass(o)) {
                o = new o(self);
                o = L.element(o.render(t, ext), o);
            } else {
                o = o.call(self, t, ext);
            }

            if (! isDOM(o)) {
                console.log('Component did not returned a valid DOM');
                return false;
            }
        }

        // Append element to the root
        if (o.tagName == 'ROOT') {
            while (o.firstChild) {
                if (ref) {
                    el.insertBefore(o.firstChild, ref);
                } else {
                    el.appendChild(o.firstChild);
                }
            }
        } else {
            if (ref) {
                el.insertBefore(o, ref);
            } else {
                el.appendChild(o);
            }
        }

        // Process ready queue
        queue(o, el);

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
            // Close any custom not fully closed component
            t = t.replace(/(<([A-Z]{1}[a-zA-Z0-9_-]+)[^>]*)(\/|\/.{1})>/gm, "$1></$2>");
            // Parse fragment
            t = t.replace(/<>/gi, "<root>").replace(/<\/>/gi, "<\/root>").trim();
            // Create the root element
            var el = document.createElement('template');
            // Get the DOM content
            el.innerHTML = t;
            // Extract
            if (el.content) {
                el = el.content;
            } else {
                el = document.createElement('div');
                el.innerHTML = t;
            }

            // Already single DOM, do not need a container
            if (el.childNodes.length > 1) {
                console.error('Single root required');
                return;
            } else {
                el = el.firstChild;
            }
        } else {
            var el = t;
        }

        // Parse the content
        parse.call(lemon, el);

        // Refresh properties
        register(lemon.self, 'refresh', function(prop) {
            dispatch.call(lemon, prop);
        });

        // Create the el bound to the self
        register(lemon.self, 'el', el);

        // Make lemon object available though the DOM is there a better way
        el.lemon = lemon;

        return el;
    }

    // Deprecated
    L.template = L.element;


    /**
     * Mix all template, self
     */
    L.blender = function(t, s, el) {
        return L.render(L.element(t, s), el, s);
    }

    /**
     * Apply self to an existing appended DOM element
     */
    L.apply = function(el, s, ext) {
        L.element(el, s, ext);
        // Process whatever we have in the queue
        queue(el, el);
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
    L.setProperties = function(v, c) {
        for (var p in v) {
            if (this.hasOwnProperty(p) || c) {
                this[p] = v[p];
            }
        }
        return this;
    }

    /**
     * Reset the values described on v
     */
    L.resetProperties = function(v) {
        for (var p in v) {
            this[p] = '';
        }
    }

    /**
     * Lemonade CC (common container) helps you share a self or function through the whole application
     * @param String - alias for your declared object(self) or function
     * @returns Object | Function
     */
    L.get = function(a) {
        return R.container[a];
    }

    /**
     * Register something to the Lemonade CC (common container)
     * @param a: String - alias for your declared object(self) or function
     * @param e: Object | Function - the element to be added to the common container. Can be an object(self) or function.
     * @param p?: Boolean - the persistence flag. Only applicable for functions.
     * @returns Object | Function
     */
    L.set = function(a, e, p) {
        // Add to the common container
        R.container[a] = e;
        // Applicable only when the o is a function
        if (typeof(e) === 'function' && p === true) {
            // Keep the flag
            R.container[a].storage = true;
            // Any existing values
            var t = window.localStorage.getItem(a);
            if (t) {
                // Parse JSON
                t = JSON.parse(t);
                // Execute method with the existing values
                e(t);
            }
        }
    }

    /**
     * Dispatch the new values to the function
     * @param a: String - alias to the element saved on the Lemonade CC (common container)
     * @param d: Object - data to be dispatched
     */
    L.dispatch = function(a, d) {
        // Get from the container
        var h = R.container[a];
        // Confirm that the alias is a function
        if (typeof(h) === 'function') {
            // Dispatch the data to the function
            h(d);
            // Save the data to the local storage
            if (h.storage === true) {
                window.localStorage.setItem(a, JSON.stringify(d));
            }
        }
    }

    /**
     * Translate
     */
    L.translate = function(o) {
        if (o.substr(0,3) == '^^[' && o.substr(-3) == ']^^') {
            o = o.replace('^^[','').replace(']^^','');
            return document.dictionary[o] || o;
        }
    }

    L.component = class {
        constructor() {
        }
    }

    return L;
})));