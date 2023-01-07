;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Router = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    /**
     * Basic handler
     * @param h - HTML
     * @returns lemonade.element
     */
    const Base = function(h) {
        return lemonade.element(h, this)
    }

    return function(html, ext) {
        let self = this;
        let config = [];
        let current = null;

        if (! ext) {
            ext = {};
        }

        let change = this.onchange;

        const getComponent = function(o) {
            if (o) {
                let t;
                if (t = document.lemonadejs.components[o.toUpperCase()]) {
                    return t;
                } else if (t = ext[o]) {
                    return t;
                }
            }
            return Base;
        }
        /**
         * Get route
         * @param {string} p - pathname
         */
        const getConfig = function(p) {
            let c = config;
            for (let i = 0; i < c.length; i++) {
                if (p === c[i].path || p.match(new RegExp('^'+c[i].path+'$', 'gi'))) {
                    return c[i];
                }
            }
            return false;
        }

        self.onload = function() {
            let a = window.location;
            self.setPath(a.pathname + a.search, true);
        }

        self.setPath = function(p, ignore) {
            // Get the configuration based on the path
            let c = getConfig(p);

            // Configuration
            if (typeof(self.onbeforechange) === 'function') {
                let r = self.onbeforechange.call(config, p, c);
                if (r === false) {
                    return;
                } else if (r) {
                    if (typeof(r) == 'object') {
                        c = r;
                    } else {
                        p = r;
                        c = getConfig(p);
                    }
                }
            }

            if (p !== self.path) {
                if (! ignore) {
                    history.pushState({route: p}, '', p);
                }
                self.path = p;
                set(c);
            }

            // Return the page object
            return c;
        }

        /**
         * Create a DIV container
         */
        const div = function() {
            return document.createElement('div');
        }

        /**
         * Extract configuration
         */
        const extract = function() {
            // Extract config from the template definitions
            let d = div();
            d.innerHTML = html;
            let o,t = null;
            let c = d.children;
            for (let i = 0; i < c.length; i++) {
                o = {};
                // Push to the configuration
                config.push(o);
                // Load attributes
                t = c[i].attributes;
                for (let j = 0; j < t.length; j++) {
                    o[t[j].name] = t[j].value;
                }
                // Controller
                o.controller = getComponent(o.controller);
                // Preload
                if (o.preload) {
                    create(o);
                }
            }
        }

        /**
         * Create new page
         */
        const create = function(o, cb) {
            // Controller
            let c = o.controller;
            // Renderer
            let r = lemonade.render;
            // Create the self and make that available on the route configuration
            let s = o.self = { parent: self };
            // Create element container
            let e = div();
            e.classList.add('page');
            // Hide that
            e.style.display = 'none';
            // Add the element to the configuration
            o.element = e;
            // Temp
            let t = null;
            // Make sure the order is correct
            for (let i = 0; i < config.length; i++) {
                if (t = config[i].element) {
                    self.el.appendChild(t);
                }
            }
            if (o.url) {
                // Fetch a remote view
                let u = o.url;
                if (u.indexOf('?') == -1) {
                    u += '?dt='
                } else {
                    u += '&dt=';
                }
                // Fetch a remote view
                fetch(u + new Date().getTime(), { headers: { 'X-Requested-With': 'http' }}).then(function(v) {
                    v.text().then(function(v) {
                        e.innerHTML = v;
                        if (t = e.querySelector('[data-autoload]')) {
                            if (t = t.getAttribute('data-autoload')) {
                                if (ext[t]) {
                                    c = o.controller = ext[t];
                                }
                            }
                        }
                        e.innerHTML = '';
                        // Call the LemonadeJS renderer
                        r(c, e, s, "<>"+v+"</>");
                        if (cb) {
                            cb();
                        }
                    })
                });
            } else {
                // Call the LemonadeJS renderer
                r(c, e, s);
                if (cb) {
                    cb();
                }
            }
        }

        const hide = function(c) {
            // Hide previous
            if (current) {
                current.element.style.display = 'none';
            }
            // Make sure the new page is visible
            c.element.style.display = '';
            // Onchange
            if (change) {
                change(c, current);
            }
            // Current page
            current = c;
            // On enter
            if (c.self.onenter) {
                c.self.onenter.call(c, c.element);
            }
        }

        /**
         * Set route
         */
        const set = function(c) {
            let load = function() {
                // Hide old element
                if (self.animation === 'true' && current && c.element !== current.element) {
                    // Show element for the animation
                    c.element.style.display = '';
                    // Start the animation
                    animation(c);
                } else {
                    hide(c);
                }
            }
            if (! c.element) {
                create(c, load);
            } else {
                load();
            }
        }

        const animation = function(c) {
            // Correct class
            let e = self.el.classList;
            let d = 'slide-left-' + (config.indexOf(c) < config.indexOf(current)?'in':'out');
            e.add(d);
            setTimeout(function() {
                e.remove(d);
                hide(c);
            }, 400);
        }

        let template = `<div class="pages" path="{{self.path}}"></div>`;

        // Intercept click
        document.onclick = function(e) {
            let a = e.target.closest('a');
            if (a && a.tagName === 'A' && a.pathname && ! a.getAttribute('target')) {
                self.setPath(a.pathname + a.search);
                e.preventDefault();
            }
        }

        // Events
        window.onpopstate = function(e) {
            let a = window.location;
            self.setPath(a.pathname + a.search, true);
        }

        // Create lemonade component
        let root = lemonade.element(template, self, ext);

        // Extra the configuration
        extract();

        return root;
    }
})));