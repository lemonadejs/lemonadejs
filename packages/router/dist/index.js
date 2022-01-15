;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Router = factory();
}(this, (function () {

    // Load lemonadejs
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
        var self = this;
        var config = [];
        var current = null;

        if (! ext) {
            ext = {};
        }

        var change = this.onchange;

        self.onchange = function(attr) {
            if (attr == 'path') {
                set();
            }
        }

        self.onload = function() {
            self.setPath(location.pathname, true);
        }

        self.setPath = function(p, ignore) {
            if (typeof(self.onbeforechange) === 'function') {
                var r = self.onbeforechange(p);
                if (r === false) {
                    return;
                } else if (r) {
                    p = r;
                }
            }

            if (p !== self.path) {
                if (! ignore) {
                    history.pushState({route: p}, '', p);
                }
                self.path = p;
            }
        }

        /**
         * Create a DIV container
         */
        var div = function() {
            return document.createElement('div');
        }

        /**
         * Extract configuration
         */
        var extract = function() {
            var d = div();
            d.innerHTML = html;
            var o,t = null;
            var c = d.children;
            for (var i = 0; i < c.length; i++) {
                o = {};
                // Push to the configuration
                config.push(o);
                // Load attributes
                t = c[i].attributes;
                for (var j = 0; j < t.length; j++) {
                    o[t[j].name] = t[j].value;
                }
                // Controller
                o.controller = ext[o.controller] || Base;
                // Preload
                if (o.preload) {
                    create(o);
                    // Hide that
                    o.element.style.display = 'none';
                }
            }
        }

        /**
         * Create new page
         */
        var create = function(o) {
            // Controller
            var c = o.controller;
            // Renderer
            var r = lemonade.render;
            // Create the self and make that available on the route configuration
            var s = o.self = {};
            // Create element container
            var e = div();
            e.classList.add('page');
            // Add the element to the configuration
            o.element = e;
            // Temp
            var t = null;
            // Make sure the order is correct
            for (var i = 0; i < config.length; i++) {
                if (t = config[i].element) {
                    root.appendChild(t);
                }
            }
            if (o.url) {
                // Fetch a remote view
                fetch(o.url, { headers: { 'X-Requested-With': 'http' }}).then(function(v) {
                    v.text().then(function(v) {
                        // Call the LemonadeJS renderer
                        r(c, e, s, "<>"+v+"</>");
                    })
                });
            } else {
                // Call the LemonadeJS renderer
                r(c, e, s);
            }
        }

        /**
         * Get route
         */
        var get = function() {
            var c = config;
            for (var i = 0; i < c.length; i++) {
                if (self.path.match(new RegExp('^'+c[i].path+'$', 'gi'))) {
                    return c[i];
                }
            }
        }

        var hide = function(c) {
            if (current) {
                current.element.style.display = 'none';
            }
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
        var set = function() {
            var c = get();
            if (c) {
                if (! c.element) {
                    create(c);
                }
                // Show element
                c.element.style.display = '';
                // Hide old element
                if (self.animation === 'true' && current && c.element !== current.element) {
                    animation(c);
                } else {
                    hide(c);
                }
            } else {
                // Not found
            }
        }

        var animation = function(c) {
            // Correct class
            var e = root.classList;
            var d = 'slide-left-' + (config.indexOf(c) < config.indexOf(current)?'in':'out');
            e.add(d);
            setTimeout(function() {
                e.remove(d);
                hide(c);
            }, 400);
        }

        var template = `<div class="pages" path="{{self.path}}"></div>`;

        // Intercept click
        document.onclick = function(e) {
            var a = e.target.closest('a');
            if (a && a.tagName == 'A' && a.pathname) {
                self.setPath(a.pathname);
                e.preventDefault();
            }
        }

        // Events
        window.onpopstate = function(e) {
            self.setPath(window.location.pathname, true);
        }

        // Create lemonade component
        var root = lemonade.element(template, self, ext);

        // Extra the configuration
        extract();

        return root;
    }
})));