/**
 * LemonadeJS v4.0.0 (ESM build)
 *
 * Website: https://lemonadejs.net
 * Description: Create amazing web based reusable components.
 *
 * This software is distributed under MIT License
 */
function Lemonade() {

    'use strict';

    /**
     * Global control element
     */
    let R = {
        queue: [],
        container: {},
        tracking: new Map,
        components: {},
    };

    // Global LemonadeJS controllers
    if (typeof(document) !== "undefined") {
        if (! document.lemonadejs) {
            document.lemonadejs = R;
        } else {
            R = document.lemonadejs;
        }
    }

    // Script expression inside LemonadeJS templates
    let isScript = /{{(.*?)}}/g;

    /**
     * Extract a property from a nested object using a string address
     * @param {string} str address inside the nested object
     * @param {boolean} config get the configuration obj => property
     */
    const extractFromPath = function(str, config) {
        try {
            let t = str.toString().replace(/[\[\]]/g, '.').split('.');
            if (t[0] === 'self') {
                t.shift();
            }
            // Remove blanks
            t = t.filter(item => item !== '');
            // Object
            let o = this;
            let lastObject;
            while (t.length) {
                // Get the property
                let p = t.shift();
                // Process config
                if (config) {
                    if (typeof(o) === 'object' && ! Array.isArray(o)) {
                        lastObject = [o,p];
                    }
                    if (t.length === 0) {
                        return lastObject;
                    }
                }
                // Check if the property exists
                if (o.hasOwnProperty(p)) {
                    o = o[p];
                } else {
                    return undefined;
                }
            }

            if (typeof(o) !== 'undefined') {
                return o;
            }
        } catch (e) {}

        // Something went wrong
        return undefined;
    }

    /**
     * Cast the value of an attribute
     */
    const castProperty = function(attr) {
        // Parse type
        try {
            if (typeof(attr) === 'string' && attr) {
                // Remove any white spaces
                attr = attr.trim();
                if (attr === 'true') {
                    return true;
                } else if (attr === 'false') {
                    return false;
                } else if (! isNaN(attr)) {
                    return Number(attr);
                } else if (attr.substring(0, 1) === '{') {
                    if (attr.slice(-1) === '}') {
                        return JSON.parse(attr);
                    }
                } else if (attr.substring(0, 5) === 'self.') {
                    let v = extractFromPath.call(this, attr);
                    if (typeof(v) !== 'undefined') {
                        return v;
                    }
                }
            }
        } catch (e) {}

        return attr;
    }

    /**
     * This allows to run inline script on legacy system. Inline script can lead to security issues so use carefully.
     * @param {string} s string to function
     */
    const run = function(s) {
        return Function('self', '"use strict";return (' + s + ')')(this);
    }

    /**
     * Create a new HTML element
     * @param {string} type - create a new HTML element as a type
     * @param {string} html - initial content
     * @return {HTMLElement} e - new HTML element
     */
    const create = function(type, html) {
        let e = document.createElement(type);
        e.innerHTML = html;
        return e;
    }

    /**
     * Check if the content {o} is a valid DOM Element
     * @param {HTMLElement|DocumentFragment|object} o - is this a valid dom?
     * @return {boolean}
     */
    const isDOM = function(o) {
        return (o instanceof HTMLElement || o instanceof Element || o instanceof DocumentFragment);
    }

    /**
     * Check if the method is a method or a class
     * @param {function} f
     * @return {boolean}
     */
    const isClass = function(f) {
        return typeof f === 'function' && /^class\s/.test(Function.prototype.toString.call(f));
    }

    /**
     * Basic handler
     * @param {string} t - HTML template
     * @return {HTMLElement}
     */
    const Basic = function(t) {
        return L.element(t, this);
    }

    /**
     * Execute pending tasks and remove from queue
     * @param {string} type - task type
     * @param {function} f - task
     * @return {HTMLElement}
     */
    const unqueue = function(type, f) {
        let q = null;
        for (let i = 0; i < R.queue.length; i++) {
            q = R.queue[i];
            if (q.type === type) {
                // Reset item in the queue
                R.queue[i] = {};
                // Execute method
                f(q);
            }
        }
    }

    /**
     * Check if a element is appended to the DOM or a shadowRoot
     * @param {HTMLElement} node
     * @return {boolean}
     */
    const contains = function(node) {
        while (node) {
            if (node === document.body) {
                return true; // Node is in main document
            }

            if (node.parentNode === null) {
                if (node.host) {
                    node = node.host; // Traverse up through ShadowRoot
                } else {
                    return false; // Detached node
                }
            } else {
                node = node.parentNode; // Traverse up through parentNode
            }
        }
        return false;
    }

    /**
     * Process all methods queued from the ready property
     * @param {HTMLElement} e - check if the element is already in the DOM
     */
    const queue = function(e) {
        // Un-queue
        if (contains(e)) {
            // Process ready elements
            unqueue('ready', function(q) {
                q.method();
            });
            // Process ready elements
            unqueue('onload', function(q) {
                q.method();
            });
            // Reset anything left in the queue
            R.queue = [];
        }
    }

    /**
     * Get the attribute helper
     * @param {object} e - element
     */
    const getAttribute = function(e) {
        // Final value
        let v;
        if (typeof(e.val) === 'function') {
            v = e.val();
        } else {
            if (e.tagName === 'SELECT' && e.getAttribute('multiple')) {
                v = [];
                for (let i = 0; i < e.options.length; i++) {
                    if (e.options[i].selected) {
                        v.push(e.options[i].value);
                    }
                }
            } else if (e.type === 'checkbox') {
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
    const setAttribute = function(e, v, t) {
        if (t === 'value') {
            // Update HTML form element
            if (typeof(e.val) === 'function') {
                if (e.val() != v) {
                    e.val(v);
                }
            } else if (e.tagName === 'SELECT' && e.getAttribute('multiple')) {
                for (let j = 0; j < e.children.length; j++) {
                    e.children[j].selected = v.indexOf(e.children[j].value) >= 0;
                }
            } else if (e.type === 'checkbox') {
                e.checked = ! (! v || v === '0' || v === 'false');
            } else if (e.type === 'radio') {
                e.checked = false;
                if (e.value == v) {
                    e.checked = true;
                }
            } else if (e.getAttribute && e.getAttribute('contenteditable')) {
                if (e.innerHTML != v) {
                    e.innerHTML = v;
                }
            } else {
                // Make sure apply that to the value
                e.value = v;
                // Update attribute if exists
                if (e.getAttribute && e.getAttribute('value') !== null) {
                    e.setAttribute('value', v);
                }
            }
        } else if (t === 'src') {
            if (! v) {
                v = e.getAttribute('default');
            }
            if (v) {
                e.setAttribute(t, v);
            }
        } else if (typeof(e[t]) !== 'undefined' || typeof(v) == 'function' || typeof(v) == 'object') {
            e[t] = v;
        } else {
            if (v === '') {
                e.removeAttribute(t);
            } else {
                e.setAttribute(t, v);
            }
        }
    }

    /**
     * Get attributes as an object
     * @param {boolean} props - all attributes that are not undefined
     * @return {object}
     */
    const getAttributes = function(props) {
        let o = {};
        let k = null;
        let a = this.attributes;
        if (a && a.length) {
            for (let i = 0; i < a.length; i++) {
                k = a[i].name;
                if (props && typeof(this[k]) !== 'undefined') {
                    o[k] = this[k];
                } else {
                    o[k] = a[i].value;
                }
            }
        }
        return o;
    }

    /**
     * Run a loop in the data for the element {e}
     * @param {object} o - tracking content object
     */
    const loop = function(o) {
        let data = extractFromPath.call(o.s, o.v);
        if (data) {
            // Template for the render
            let t;
            // Method handler for custom elements
            let m;
            // Contains all new elements
            let d = [];
            // If data exists render each element of the array
            if (data.length) {
                for (let i = 0; i < data.length; i++) {
                    let e = data[i].el;
                    if (! e) {
                        t = o.e.lemonade;
                        m = t.handler || Basic;
                        // Create reference to the element
                        register(data[i], 'parent', o.s);
                        // Create element
                        e = L.render(m, o.r, data[i], t.template);
                    }
                    if (o.e.getAttribute('unique') === 'false') {
                        register(data[i], 'el', null);
                    }
                    d.push(e);
                }
            }
            // TODO: try to improve this process

            // Remove all DOM
            while (o.r.firstChild) {
                o.r.firstChild.remove();
            }
            // Insert necessary DOM
            while (t = d.shift()) {
                o.r.appendChild(t);
            }
        }
    }

    /**
     * Process the value of a content object
     * @param {object} o - tracking content object
     */
    const process = function(o) {
        // Attribute
        let a;
        if (o.bind) {
            a = 'value';
        } else {
            a = o.a;
        }
        // Value
        if (o.loop) {
            loop(o);
        } else {
            let v;
            // Verify if the value is a reference or a string
            if (o.reference) {
                v = castProperty.call(o.s, o.v);
            } else {
                v = o.v.replace(isScript, function(a,b) {
                    let r = extractFromPath.call(o.s, b);
                    if (typeof(r) === 'function') {
                        return r.call(o.s);
                    } else {
                        if (typeof(r) === 'undefined') {
                            r = run.call(o.s, b);
                        }
                        return r;
                    }
                });
            }

            if (o.e.lemonade) {
                o.e.lemonade.self[a] = v;
            }

            if (o.protect) {
                // Protect from loop
                if (o.e[a] == v) {
                    return;
                }
            }

            if (o.reference) {
                o.e[a] = v;
            } else {
                setAttribute(o.e, v, a);
            }
        }
    }

    /**
     * Dispatch all updates for a property from the self
     * @param {string} property - property from the self
     */
    const dispatch = function(property) {
        // Tracking object
        let o = R.tracking.get(this);
        if (o) {
            o = o[property];
            if (o) {
                // Process all registered elements
                for (let i = 0; i < o.length; i++) {
                    // Element to be updated
                    process(o[i]);
                }
            }

            // A property has changed
            if (typeof(this.onchange) === 'function') {
                this.onchange(property, o, this);
            }
        }
    }

    /**
     * Register a getter without setter for a self object
     * @param {object} s - self object
     * @param {string} p - self property
     * @param {string|object|number} v - value
     */
    const register = function(s, p, v) {
        if (typeof(s) === 'object') {
            Object.defineProperty(s, p, {
                enumerable: false,
                configurable: true,
                get: function () {
                    return v;
                }
            });
        }
    }

    /**
     * Bind an property to one action and start tracking
     * @param {string} p - property to be tracked
     */
    const observers = function(p) {
        // Lemon handler
        let s = this;
        if (typeof(s) === 'object') {
            let value = this[p];
            // Do not allow undefined
            if (typeof (value) === 'undefined') {
                value = '';
            }
            // Create the observer
            Object.defineProperty(s, p, {
                set: function (v) {
                    // Update val
                    value = v;
                    // Refresh bound elements
                    dispatch.call(this, p);
                },
                get: function () {
                    // Get value
                    return value;
                },
                configurable: true,
                enumerable: true,
            });
        }
    }

    /**
     * Parse the tokens from a content object to start tracking the self
     * @param {object} content - content tracking object
     */
    const parseTokens = function(content) {
        // Get all self tokens in use
        if (typeof(content.v) === 'string') {
            let tokens = content.v.match(/self([.a-zA-Z0-9_\[\]]+)*/gm);
            if (tokens) {
                for (let i = 0; i < tokens.length; i++) {
                    // Get path to the object
                    let p = extractFromPath.call(this, tokens[i], true);
                    if (p) {
                        // Register
                        let t = R.tracking.get(p[0]);
                        if (!t) {
                            t = {};
                            R.tracking.set(p[0], t);
                        }
                        // Register the properties of the self
                        if (! t[p[1]]) {
                            t[p[1]] = [];
                        }
                        // Save relationship between the self and the tag attributes. TODO: avoid double call when {{self.value*self.value}}
                        t[p[1]].push(content);
                        // Create the necessary observers for this property
                        observers.call(p[0], p[1]);
                    }
                }
            }
        }

        // Render the value from the element attribute
        process(content);
    }

    /**
     * Parse the content object to see if is necessary to start tracking
     * @param {object} content the tracking object
     */
    const parseExpression = function(content) {
        // Check if the content has script marks {{}}
        if (typeof(content.v) === 'string') {
            if (content.v.match(isScript)) {
                // Get all self tokens in use
                parseTokens.call(this, content);
            }
        }
    }

    /**
     * Read a attribute from an element to see if there is any script associated
     * @param {HTMLElement} e
     * @param {string} name - attribute name
     * @param {string|number?} value - value to be attributed
     */
    const parseAttribute = function(e, name, value) {
        // Get the content of the property
        if (typeof(value) === 'undefined') {
            value = e.getAttribute(name).trim();
        }
        // Parse expression
        parseExpression.call(this, { e: e, a: name, v: value, s: this });
    }

    /**
     * Read a textContent from an element to see if there is any script associated
     * @param {HTMLElement} e - element
     * @param {array} injection
     */
    const parseContent = function(e, injection) {
        // Get the content of the property
        let text = e.textContent;
        // Check if the content has script marks {{}}
        if (text.match(isScript)) {
            // Replace the entries
            let result = text.split(/({{.*?}})/g);
            // Reset element
            e.textContent = '';
            // Recreate content
            for (let j = 0; j < result.length; j++) {
                // Text node
                text = result[j];
                // Injected values
                if (text && injection) {
                    let r = text.match(/__lm=(\d+)/);
                    if (r && r[1]) {
                        text = injection[r[1]].v;
                    }
                }
                // Create text node
                let node = document.createTextNode(text);
                // Append text node back to the element
                e.appendChild(node);
                // Parse expression
                parseExpression.call(this, { e: node, a: 'textContent', v: text, s: this })
            }
        }
    }

    const shouldBeReference = 'should be a reference to a function on';

    /**
     * Parse all attributes from one element
     * @param {HTMLElement} element
     * @param {object} components
     * @param {array} injection
     */
    const parse = function(element, components, injection) {
        // Self for this parser
        let self = this;
        // Helpers
        let t;
        // Get attributes from the element
        let attr = getAttributes.call(element);
        /** @type {function|null} */
        let handler = null;
        // Custom elements
        let m = element.tagName;
        // Expected function
        if (components) {
            t = components[m];
        }
        if (! t) {
            t = R.components[m];
        }
        // Verify scope in the declared extensions
        if (typeof(t) == 'function') {
            handler = t;
        }

        // A custom handler is conflicting with a VALID tag name
        if (t) {
            if (element instanceof HTMLUnknownElement) {
                if (! handler && m !== 'ROOT') {
                    console.error(m + ' is not found.');
                }
            } else {
                console.log(m + ' conflicts with a valid tag name');
            }
        }

        // Is this a loop?
        let isLoop = attr[':loop'] || attr['@loop'];

        // Special cases where the content is actually the template
        if (handler || isLoop) {
            // Create the lemonade element controller
            let s = {};
            if (handler && isClass(handler)) {
                s = new handler(s);
            }
            element.lemonade = {
                self: s,
                handler: handler,
                template: element.innerHTML,
                loop: isLoop,
            };

            // Reset content
            element.innerHTML = '';
        }

        // Keys
        let k = Object.keys(attr);
        if (k.length) {
            for (let i = 0; i < k.length; i++) {
                let value = attr[k[i]];
                if (injection) {
                    let r = value.match(/{{__lm=(\d+)}}/);
                    if (r && r[1]) {
                        value = injection[r[1]].v;
                        element.setAttribute(k[i], value);
                    }
                }

                // Create input event to monitor changes in the HTML element
                let prop = attr[k[i]].replace('self.', '');

                // Parse events
                if (! handler && k[i].substring(0,2) === 'on') {
                    // Remove any inline javascript from the template
                    element.removeAttribute(k[i]);
                    // If not a method, should be converted to a method
                    if (typeof(value) !== 'function') {
                        let t = extractFromPath.call(self, prop);
                        if (t) {
                            value = t;
                        }
                    }
                    element.addEventListener(k[i].substring(2), (e) => {
                        if (typeof(value) === 'function') {
                            value.call(this, e, self);
                        } else {
                            Function('self', 'e', value).call(this, self, e);
                        }
                    });
                } else {
                    // Check for special properties
                    let first = k[i].substr(0,1);
                    if (first === '@' || first === ':') {
                        // Type
                        let type = k[i].substr(1);
                        // Process
                        let q = { type };
                        // Process types
                        if (type === 'ready') {
                            // If not a method, should be converted to a method
                            if (typeof(value) !== 'function') {
                                value = extractFromPath.call(self, prop);
                            }
                            if (typeof(value) === 'function') {
                                q.method = value.bind(element, element, self);
                            } else {
                                q.method = Function('self', attr[k[i]]).bind(element, self);
                            }
                        } else if (type === 'ref') {
                            // Create a reference to the HTML element or to the self of the custom element
                            self[prop] = element.lemonade && element.lemonade.handler ? element.lemonade.self : element;
                        } else if (type === 'bind') {
                            // Register the value attribute to be tracked
                            parseTokens.call(self, { e: element, a: prop, v: '{{' + attr[k[i]] + '}}', s: self, bind: true })

                            // Register the value attribute to be tracked in the parent
                            if (handler) {
                                let s = element.lemonade.self;
                                parseTokens.call(s, { e: self, a: prop, v: '{{self.value}}', s: s, protect: true });
                            } else {
                                // Add event oninput for the two-way binding
                                let h = function() {
                                    // Get the reference to the object
                                    let o = extractFromPath.call(self, prop, true);
                                    // Apply the new value
                                    (o[0])[o[1]] = getAttribute(this);
                                }
                                // This will be implemented soon with jSuites 5
                                //element.addEventListener('input', h);
                                // Deprecated. Legacy purpose only
                                element.oninput = h;
                            }
                            // Deprecated. Legacy purpose only
                            element[k[i]] = prop;
                        } else if (type === 'loop') {
                            let r = element;
                            if (element.lemonade.handler) {
                                r = element.parentNode
                            }
                            // Register the value attribute to be tracked
                            parseTokens.call(self, { e: element, a: prop, v: attr[k[i]], s: self, r: r, loop: true })
                        } else {
                            // Parse attributes
                            parseTokens.call(self, { e: element, a: type, v: value, s: self, reference: true })
                        }

                        // Sent to the queue
                        R.queue.push(q);
                        // Remove special attribute from the tag
                        element.removeAttribute(k[i]);
                    } else {
                        // Parse attributes
                        parseAttribute.call(self, element, k[i]);
                    }
                }
            }
        }

        // Check the children
        if (element.children && element.children.length) {
            t = [];
            for (let i = 0; i < element.children.length; i++) {
                t.push(element.children[i]);
            }
            for (let i = 0; i < t.length; i++) {
                parse.call(self, t[i], components, injection);
            }
        } else {
            if (element.textContent) {
                // Parse textual content
                parseContent.call(self, element, injection);
            }
        }

        // Render component
        t = element.lemonade;
        if (t && t.handler && ! t.loop) {
            let s = getAttributes.call(element, true);
            // Make sure we have the attributes with the most recent values
            L.setProperties.call(s, t.self);
            // Make sure the self goes as a reference
            L.setProperties.call(t.self, s, true);
            // Reference to the element
            register(t.self, 'parent', self);
            // Create component
            L.render(t.handler, element, t.self, t.template, true, components);
        }
    }

    /**
     * Extract variables from the dynamic and append to the self
     * @return {[string, array]} grab the literal injection
     */
    const dynamic = function() {
        let d = [];
        let a = arguments;
        let total = a[0].length - 1;

        const result = a[0].map((value, index) => {
            if (index < total) {
                d.push({
                    v: a[index+1]
                });
                return value + '{{__lm=' + (index) + '}}';
            } else {
                return value;
            }
        }).join('');

        // Return the final template
        return [result,d];
    }

    // LemonadeJS object
    const L = {};

    /**
     * Render a lemonade DOM element, method or class into a root DOM element
     * @param {function|HTMLElement} o - LemonadeJS component or DOM created
     * @param {HTMLElement} el - root DOM element to receive the new HTML
     * @param {object?} self - self to be used
     * @param {string?} template - template to be used
     * @param {boolean?} action - before (true), append (false)
     * @param {object} components - running with components
     * @return {HTMLElement|boolean} o
     */
    L.render = function(o, el, self, template, action, components) {
        // Component
        let args = Array.from(arguments);

        // Root element but be a valid DOM element
        if (!isDOM(el)) {
            console.error('Invalid DOM')
            return false;
        }

        // Flexible element (class or method)
        if (typeof(o) == 'function') {
            if (isClass(o)) {
                if (typeof(self) === 'undefined') {
                    self = new o({});
                }
                o = L.element(self.render(template), self, components);
            } else {
                if (typeof(self) === 'undefined') {
                    self = {};
                }
                // Execute component
                o = o.call(self, template, components);

                // Process return
                if (typeof(o) === 'function') {
                    let d = o(dynamic.bind({ c: o, s: self }));
                    o = L.element(d[0], self, components, d[1]);
                } else if (typeof(o) === 'string') {
                    o = L.element(o, self, components);
                }
            }

            if (! isDOM(o)) {
                console.error('Invalid DOM return');
                return false;
            }

            // Process the first child
            o = o.firstChild;
        }

        // Keep reference to the root elements
        if (o.tagName === 'ROOT') {
            // Keep the references
            o.root = Array.from(o.childNodes);
            o.rootChild = o.children[0];
            // Append
            if (action === true) {
                el.before(...o.childNodes);
                el.remove();
            } else {
                el.append(...o.childNodes);
            }
        } else {
            // Reference
            o.root = [o];
            o.rootChild = o;
            // Append
            if (action === true) {
                el.before(o);
                el.remove();
            } else {
                el.append(o);
            }
        }

        // Refresh property
        register(self, 'refresh', function (p) {
            // Re-render the whole component
            if (typeof(p) === 'undefined') {
                // Reference to before
                args[1] = o.rootChild;
                // Self
                args[2] = this;
                // Action before
                args[4] = true;
                // Apply that to a new render
                L.render.apply(null, args);
                // Remove old items
                let t;
                while (t = o.root.shift()) {
                    t.remove();
                }
            } else {
                let s = extractFromPath.call(this, p, true);
                if (s) {
                    dispatch.call(s[0], s[1]);
                }
            }
        });

        // Process ready queue
        queue(el);

        o.rootChild.lemon = {
            self: self
        }

        return o;
    }

    /**
     * Create a new component
     * @param {string|HTMLElement} t - HTML template to be parsed or a existing DOM element
     * @param {object} self - The default self object
     * @param {object?} components - all custom components references
     * @param {object?} injection - arguments from a string literal injection
     * @return {HTMLElement|null} el - result of the DOM parse
     */
    L.element = function(t, self, components, injection) {
        // Element
        let el;
        let root;
        // Lemonade handler
        if (typeof(self) === 'undefined') {
            self = {};
        }

        // Make sure all uppercase
        if (typeof(components) === 'object') {
            let k = Object.keys(components);
            // Make sure they follow the standard
            for (let i = 0; i < k.length; i++) {
                components[k[i].toUpperCase()] = components[k[i]];
            }
        }

        // Parse a HTML template
        if (! isDOM(t)) {
            if (! t) {
                t = '';
            }
            // Close any custom not fully closed component
            t = t.trim()
                .replace(/(<(([A-Z]{1}|[a-z]*-){1}[a-zA-Z0-9_-]+)[^>]*)(\/|\/.{1})>/gm, "$1></$2>")
                .replace(/<>/gi, "<root>").replace(/<\/>/gi, "<\/root>").trim();
            // Create the root element
            el = create('template', t);

            // Extract
            if (el.content) {
                el = el.content;
            } else {
                el = create('div', t);
            }

            // Already single DOM, do not need a container
            if (el.childNodes.length > 1) {
                console.error('Single root required');
                return null;
            } else {
                root = el;
                el = el.firstChild;
            }
        } else {
            el = t;
            root = el;
        }

        // Parse the content
        parse.call(self, el, components, injection);

        // Create the el bound to the self
        register(self, 'el', el);

        // Onload event
        if (typeof(self.onload) == 'function') {
            R.queue.push({
                type: 'onload',
                method: self.onload.bind(self, el),
            });
        }

        return root;
    }

    // Deprecated
    L.template = L.element;

    /**
     * Apply self to an existing appended DOM element
     * @param {HTMLElement} el - element root
     * @param {object} s - self to associate to the template
     * @param {object?} components - object with component declarations
     */
    L.apply = function(el, s, components) {
        // Generate the element
        L.element(el, s, components);
        // Process whatever we have in the queue
        queue(el);
    }

    /**
     * Get all properties existing in {o} and create a new object with the values from {this};
     * @param {object} o - reference object with the properties relevant to the new object
     * @return {object} n - the new object with all new values
     */
    L.getProperties = function(o) {
        // The new object with all properties found in {o} with values from {this}
        let n = {};
        for (let p in o) {
            n[p] = this[p];
        }
        return n;
    }

    /**
     * Set the values from {o} to {this}
     * @param {object} o set the values of {this} when the this[property] is found in {o}, or when flag force is true
     * @param {boolean} f create a new property when that does not exists yet, but is found in {o}
     * @return {object} this is redundant since object {this} is a reference and is already available in the caller
     */
    L.setProperties = function(o, f) {
        for (let p in o) {
            if (this.hasOwnProperty(p) || f) {
                this[p] = o[p];
            }
        }
        return this;
    }

    /**
     * Reset the values of any common property name between this and a given object
     * @param {object} o - all properties names in the object {o} found in {this} will be reset.
     */
    L.resetProperties = function(o) {
        for (let p in o) {
            this[p] = '';
        }
    }

    /**
     * Lemonade CC (common container) helps you share a self or function through the whole application
     * @param {string} name alias for your declared object(self) or function
     * @returns {Object | Function} - registered element
     */
    L.get = function(name) {
        return R.container[name];
    }

    /**
     * Register something to the Lemonade CC (common container)
     * @param {string} name - alias for your declared object(self) or function
     * @param {object|function} e - the element to be added to the common container. Can be an object(self) or function.
     * @param {boolean} persistence - optional the persistence flag. Only applicable for functions.
     */
    L.set = function(name, e, persistence) {
        // Add to the common container
        R.container[name] = e;
        // Applicable only when the o is a function
        if (typeof(e) === 'function' && persistence === true) {
            // Keep the flag
            R.container[name].storage = true;
            // Any existing values
            let t = window.localStorage.getItem(name);
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
     * @param {string} name - alias to the element saved on the Lemonade CC (common container)
     * @param {object} data - data to be dispatched
     */
    L.dispatch = function(name, data) {
        // Get from the container
        let h = R.container[name];
        // Confirm that the alias is a function
        if (typeof(h) === 'function') {
            // Dispatch the data to the function
            h(data);
            // Save the data to the local storage
            if (h.storage === true) {
                window.localStorage.setItem(name, JSON.stringify(data));
            }
        }
    }

    /**
     * Register components
     * @param {object} components - register components
     */
    L.setComponents = function(components) {
        if (typeof(components) === 'object') {
            // Component names
            let k = Object.keys(components);
            // Make sure they follow the standard
            for (let i = 0; i < k.length; i++) {
                R.components[k[i].toUpperCase()] = components[k[i]];
            }
        }
    }

    L.component = class {
        constructor(s) {
            if (s) {
                Object.assign(this, s);
            }
        }
    }

    return L;
}

export default Lemonade();