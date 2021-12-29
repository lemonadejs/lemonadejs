/**
 * Lemonadejs v2.1.9
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
    if (! document.lemonadejs) {
        var R = document.lemonadejs = {
            queue: [],
            container: {}
        }
    }

    /**
     * Refresh prototype
     */
    Array.prototype.refresh = function() {
        console.error('Deprecated. Please use self.refresh("property")');
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
     * Process all methods queued from the ready property
     */
    var queue = function(e) {
        var o = null;
        if (o = e.lemon) {
            // Verify any pending ready
            if (o.queue) {
                var q = null;
                while (q = o.queue.shift()) {
                    R.queue.push(q);
                }
            }

            // Onload events
            if (typeof (o.self.onload) == 'function') {
                R.queue.push(o.self.onload.bind(o.self, e));
            }
        }
    }

    var unqueue = function(e) {
        if (document.body.contains(e) && R.queue.length) {
            var q = null;
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
            if (e.tagName == 'SELECT' && e.getAttribute('multiple')) {
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
                if (typeof(e.val) === 'function') {
                    if (e.val() != v) {
                        e.val(v);
                    }
                } else {
                    e.value = v;
                }
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
                v = eval(t[i].v);
                // Property
                p = t[i].property;
                // If the property is the value
                if (p == '@loop') {
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
                // Refresh binded elements
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

        var tokens = res.v.match(/self\.([a-zA-Z0-9_].*?)*/g);
        if (tokens && tokens.length) {
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
        var lemon = this;
        // Attributes
        var tmp = null;
        var attr = getAttributes.call(element);

        // Mark custom handlers
        if (this.components) {
            // Method name
            var m = element.tagName;
            // Custom ucfirst
            m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            // Expected function
            var f = this.components[m];
            // Verify scope in the declared extensions
            if (typeof(f) == 'function') {
                element.handler = f;
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
                        // Onchange event for the element
                        element.oninput = function(a, b) {
                            // Update val
                            this.state[b] = getAttribute(a);
                            // Refresh binded elements
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
            var tmp = [];
            for (var i = 0; i < element.children.length; i++) {
                tmp.push(element.children[i]);
            }
            for (var i = 0; i < tmp.length; i++) {
                parse.call(this, tmp[i]);
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
        var h = element.handler;

        // Root for custom is the parent
        if (typeof(h) === 'function') {
            // Root
            var r = element.parentNode;
            // Component type
            if (typeof(element.loop) == 'undefined') {
                // Make sure the self goes as a reference
                var s = L.setProperties.call(element.self, getAttributes.call(element, true), true);
                // Reference to the element
                register(s, 'el', r);
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
            get: function() {
                return r;
            }
        });
    }

    /**
     * Append custom compoents to the DOM
     */
    var generate = function(data, parent) {
        var t = null;
        // Root parent
        if (! this.parent) {
            this.parent = this.parentNode;
        }
        var r = this.parent;
        // Function handler
        var f = this.handler;
        // Template
        var t = this.template;
        // DOM element that need to go to the root
        var d = [];
        if (data.length) {
            for (let i = 0; i < data.length; i++) {
                let o = data[i].el;
                if (! o) {
                    // Create reference to the element
                    register(data[i], 'el', o);
                    register(data[i], 'parent', parent);
                    // Create element
                    o = L.render(f, r, data[i], t);
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
        queue(o);

        // When everything is in the DOM
        unqueue(el);

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
            var el = document.createElement('div');
            // Get the DOM content
            el.innerHTML = t;
            // Already single DOM, do not need a container
            if (el.childNodes.length > 1) {
                console.error('The template should have a single root');
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
        L.element(el, self);
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
            var t = localStorage.getItem(a);
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
                localStorage.setItem(a, JSON.stringify(d));
            }
        }
    }

    L.component = class {
        constructor() {
        }
    }

    return L;
})));