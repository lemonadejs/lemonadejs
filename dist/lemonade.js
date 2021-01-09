/**
 * Lemonadejs v1.2.0
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
     * Multiple options private helper
     */
    var children = function(v) {
        for (var j = 0; j < this.children.length; j++) {
            this.children[j].selected = v.indexOf(this.children[j].value) >= 0;
        }
    }

    /**
     * Private method to process anything in the queue from one lemonadejs ready properties
     */
    var queue = function(o) {
        // Verify any pending ready
        if (o.self && o.self.queue) {
            var q = null;
            while (q = o.self.queue.shift()) {
                q.onload();
            }
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
        if (! isDOM(o)) {
            o = new o(self);
            if (typeof(o.render) == 'function') {
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
                        if (t[i].property == 'innerHTML') {
                            t[i].element.innerHTML = value;
                        } else if (t[i].property == 'textContent') {
                            t[i].element.textContent = value;
                        } else if (t[i].property == 'value') {
                            if (t[i].element.value != value) {
                                t[i].element.value = value;
                                if (typeof(t[i].element.change) == 'function') {
                                    t[i].element.change(value);
                                }
                            }
                        } else if (t[i].property == 'children') {
                            children.call(t[i].element, value);
                        } else if (t[i].property == 'checked') {
                            if (t[i].element.type == 'radio') {
                                t[i].element.checked = false;
                                if (t[i].element.value == value) {
                                    t[i].element.checked = true;
                                }
                            } else {
                                t[i].element.checked = value ? true : false;
                            }
                        } else {
                            t[i].element.setAttribute(t[i].property, value);
                        }
                    }
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
                } else if (type == 'children') {
                    e = element;
                    children.call(element, value);
                } else {
                    e = element;
                    e[type] = value;
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
                        element.events[event.substring(2)] = value;
                        element[event] = function(e) {
                            eval(this.events[e.type]);
                        }
                        // Other properties
                    } else {
                        // Events
                        if (! element.events) {
                            element.events = []
                        }
                        if (k[i] == '@ready') {
                            self.queue.push(element);
                            element.events.load = attr[k[i]];
                            element.onload = function(e) {
                                eval(this.events.load);
                            }
                            // Remove attribute
                            element.removeAttribute(k[i]);
                        } else if (k[i] == '@ref') {
                            eval(attr[k[i]] + ' = element');
                            // Remove attribute
                            element.removeAttribute(k[i]);
                        } else if (k[i] == '@bind') {
                            // Onchange event for the element
                            element.onchange = function(e) {
                                eval(this.events.change);
                            }
                            // Based on the element
                            if (element.type == 'checkbox') {
                                element.events.change = attr[k[i]] + ' = this.checked';
                                var property = 'checked';
                            } else if (element.type == 'radio') {
                                element.events.change = attr[k[i]] + ' = this.value;';
                                var property = 'checked';
                            } else {
                                if (element.multiple == true) {
                                    element.events.change = 'var a = []; for (var i = 0; i < this.options.length; i++) { if (this.options[i].selected) { a.push(this.options[i].value); } } ' + attr[k[i]] + ' = a; ' + attr[k[i]] + '.refresh()';
                                    var property = 'children';
                                } else {
                                    element.events.change = attr[k[i]] + ' = this.value';
                                    var property = 'value';
                                }
                            }
                            // Way back
                            create(element, { v:attr[k[i]] }, property, self);
                            // Remove attribute
                            element.removeAttribute(k[i]);
                        } else {
                            attributes(element, attr[k[i]], k[i], self);
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
            }

            // Create instances
            if (element.constructor == HTMLUnknownElement) {
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
            }
        }

        return obj;
    })();

    L.element = L.template;

    L.component = class {
        constructor() {
        }
    }

    return L;
})));