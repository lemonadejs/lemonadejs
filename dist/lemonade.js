/**
 * Lemonadejs v1.6.0
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
     * Private method to process anything in the queue from one lemonadejs ready properties
     */
    var queue = function(o) {
        // Verify any pending ready
        if (o.self) {
            if (o.self.queue) {
                var q = null;
                while (q = o.self.queue.shift()) {
                    q.onload();
                }
            }
            if (typeof(o.self.onload) == 'function') {
                o.self.onload.call(o.self, o);
            }
        }
    }

    /**
     * Set value helper
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
     * The element passed is a DOM element
     */
    var isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
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
                o = L.template(o.render(), o);
            }
        }

        // Append child if not appended
        el.appendChild(o);

        // Process ready queue
        queue(o);

        return o;
    }

    /**
     * Mix all template, self
     */
    L.blender = function(template, self, el) {
        return L.render(L.template(template, self), el, self);
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
     * Mix the self and the template or DOM element
     */
    L.template = (function() {
        /**
         * Create a new component
         * @param mixed - DOM/template
         * @param s - self component object
         */
        var obj = function(t, self) {
            // Self
            if (! self) {
                self = {};
            }
            // Create only if is a new self
            if (! self.state) {
                self.state = {};
            }
            if (! self.tracking) {
                self.tracking = {};
            }
            // Queue
            self.queue = [];

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
            parse(div, self);
            // Share self
            div.self = self;

            return div;
        }

        /**
         * Bind an property to one action and start tracking
         */
        var bind = function(property, self) {
            // If exists get the current value
            var tmp = self[property] || '';

            // Refresh
            var refreshProperty = function() {
                var t = null;
                // Tracking
                if (t = self.tracking[property]) {
                    for (var i = 0; i < t.length; i++) {
                        var value = eval(t[i].v);
                        if (t[i].property == 'value') {
                            if (t[i].element.value != value) {
                                if (typeof(t[i].element.val) == 'function') {
                                    t[i].element.val(value);
                                }
                                t[i].element.value = value;
                            }
                        } else {
                            setAttribute(t[i].element, value, t[i].property);
                        }
                    }
                }

                // Onchange
                if (typeof(self.onchange) == 'function') {
                    self.onchange.call(self, property, t);
                }
            }

            // Save as state
            if (Array.isArray(self[property])) {
                Array.prototype.refresh = refreshProperty;
            } else {
                Object.defineProperty(self, property, {
                    set: function(val) {
                        // Update val
                        self.state[property] = val;
                        // Refresh binded elements
                        refreshProperty(val);
                    },
                    get: function() {
                        // Get value
                        return self.state[property];
                    }
                });
            }

            // Set valuke
            self[property] = tmp;

            // Create tracking container for the property
            self.tracking[property] = [];
        }

        var create = function(element, res, type, self) {
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

                    if (! self.tracking[token]) {
                        // Create tracker
                        bind(token, self);
                    }

                    // Add to the tracking
                    self.tracking[token].push({
                        element: e,
                        property: type,
                        v: res.v
                    });
                }
            }
        }

        var attributes = function(element, attr, type, self) {
            // Content
            var result = [];
            var index = 0;

            if (element.getAttribute && element.getAttribute(type)) {
                element.setAttribute(type, element.getAttribute(type).replace(/\{\{(.*?)\}\}/g, function (a,b,c,d) {
                    result.push({ p: c - index, v: b });
                    index = index + a.length;
                    return '';
                }));
            } else {
                if (typeof(element[type]) == 'string' && element[type]) {
                    element[type] = element[type].replace(/\{\{(.*?)\}\}/g, function (a,b,c,d) {
                        result.push({ p: c - index, v: b });
                        index = index + a.length;
                        return '';
                    });
                }
            }

            if (result.length) {
                if (result.length == 1 && type == 'textContent' && ! element.innerText) {
                    type = 'innerHTML';
                }

                for (var i = result.length - 1; i >= 0; i--) {
                    create(element, result[i], type, self);
                }
            }
        }

        var parse = function(element, self) {
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
                        element[event] = Function('self', value).bind(element, self);
                    } else {
                        // Events
                        if (! element.events) {
                            element.events = []
                        }
                        if (k[i] == '@ready') {
                            self.queue.push(element);
                            element.onload = Function('self', attr[k[i]]).bind(element, self);
                            // Remove attribute
                            element.removeAttribute(k[i]);
                        } else if (k[i] == '@ref') {
                            var ref = attr[k[i]].replace('self.', '');
                            self[ref] = element;
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
                            element.onchange = Function('self', e).bind(element, self);
                            if (property == 'value') {
                                element.onkeyup = element.onchange;
                            }
                            // Way back
                            create(element, { v:attr[k[i]] }, property, self);
                            // Remove attribute
                            element.removeAttribute(k[i]);
                        } else {
                            attributes(element, attr[k[i]], k[i], self);
                            // Translate
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
                    parse(element.children[i], self);
                }
            } else {
                attributes(element, 'innerText', 'textContent', self);
                // Translate
                if (L.dictionary) {
                    if (tmp = L.translate(element.innerText)) {
                        element.innerText = tmp;
                    }
                }
            }

            // TODO: Subelements
            /*if (element.constructor == HTMLUnknownElement) {
                var m = element.tagName;
                m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
                m = eval(m);
                if (typeof(m) == 'function') {
                    if (element.getAttribute('extended') == 'true') {
                        var e = self;
                    } else {
                        var e = {};
                    }

                    for (var i = 0; i < element.attributes.length; i++) {
                        e[element.attributes[i].name] = element.attributes[i].value;
                    }

                    L.render(m, element, e);
                }
            }*/
        }

        return obj;
    })();

    L.element = L.template;

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