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
        var self = this;
        var config = [];
        var current = null;

        if (! ext) {
            ext = {};
        }

        var change = this.onchange;

        /**
         * Get route
         * @param {string} p - pathname
         */
        var getConfig = function(p) {
            var c = config;
            for (var i = 0; i < c.length; i++) {
                if (p==c[i].path || p.match(new RegExp('^'+c[i].path+'$', 'gi'))) {
                    return c[i];
                }
            }
            return false;
        }

        self.onload = function() {
            var a = window.location;
            self.setPath(a.pathname + a.search, true);
        }

        self.setPath = function(p, ignore) {
            // Get the configuration based on the path
            var c = getConfig(p);

            // Configuration
            if (typeof(self.onbeforechange) === 'function') {
                var r = self.onbeforechange.call(config, p, c);
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
            // Extract config from the template definitions
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
                o.controller = ext[o.controller];
                // Preload
                if (o.preload) {
                    create(o);
                }
            }
        }

        /**
         * Create new page
         */
        var create = function(o, cb) {
            // Controller
            var c = o.controller || Base;
            // Renderer
            var r = lemonade.render;
            // Create the self and make that available on the route configuration
            var s = o.self = {};
            // Create element container
            var e = div();
            e.classList.add('page');
            // Hide that
            e.style.display = 'none';
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
                var u = o.url;
                if (u.indexOf('?') == -1) {
                    u += '?dt='
                } else {
                    u += '&dt=';
                }
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

        var hide = function(c) {
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
        var set = function(c) {
            var load = function() {
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

        var template = `<div class="pages"></div>`;

        // Intercept click
        document.onclick = function(e) {
            var a = e.target.closest('a');
            if (a && a.tagName == 'A' && a.pathname && ! a.getAttribute('target')) {
                self.setPath(a.pathname + a.search);
                e.preventDefault();
            }
        }

        // Events
        window.onpopstate = function(e) {
            var a = window.location;
            self.setPath(a.pathname + a.search, true);
        }

        // Create lemonade component
        var root = lemonade.element(template, self, ext);

        // Extra the configuration
        extract();

        return root;
    }
})));