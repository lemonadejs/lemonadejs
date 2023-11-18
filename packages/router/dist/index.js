if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Router = factory();
}(this, (function () {

    /**
     * Create a DIV container
     */
    const div = function() {
        return document.createElement('div');
    }

    /**
     * Basic handler
     * @param h - HTML
     * @returns lemonade.element
     */
    const Base = function(h) {
        return lemonade.element(h, this)
    }

    const getComponent = function(controller, components) {
        if (controller) {
            if (typeof(controller) === 'function') {
                return controller;
            } else {
                let t = document.lemonadejs.components[controller.toUpperCase()];
                if (t) {
                    return t;
                } else {
                    t = components[controller]
                    if (t) {
                        return t;
                    }
                }
            }
        }
        return Base;
    }

    /**
     * Extract configuration
     */
    const extract = function(content, components) {
        if (content) {
            // Extract config from the template definitions
            if (! this.config) {
                this.config = [];
            }
            let d = content;
            // Extract configuration from children
            let o = null;
            while (d.children[0]) {
                o = {};
                // Push to the configuration
                this.config.push(o);
                // Temporary attributes from the entry
                let t = d.children[0].attributes;
                for (let j = 0; j < t.length; j++) {
                    o[t[j].name] = t[j].value;
                }
                if (d.children[0].controller) {
                    o.controller = d.children[0].controller;
                }
                // Depending on how you declare
                if (! o.controller && d.children[0].tagName === 'DIV') {
                    o.element = d.children[0];
                    o.element.classList.add('page');
                    o.self = { parent: this };
                } else {
                    // Controller
                    o.controller = getComponent(o.controller, components);
                }
                // Remove
                d.children[0].remove();
            }
        }
    }

    /**
     * Create new page
     */
    const create = function(page, cb) {
        let self = this;
        // Renderer
        let r = lemonade.render;
        // Create the self and make that available on the route configuration
        let s = page.self = { parent: self };
        // Create element container
        let e = div();
        e.classList.add('page');
        // Hide that
        e.style.display = 'none';
        // Add the element to the configuration
        page.element = e;
        // Temp
        let t = null;
        if (! self.single) {
            // Make sure the order is correct
            for (let i = 0; i < self.config.length; i++) {
                t = self.config[i].element;
                if (t) {
                    self.el.appendChild(t);
                }
            }
        }

        if (page.url) {
            // Fetch a remote view
            let u = page.url;
            if (u.indexOf('?') === -1) {
                u += '?dt='
            } else {
                u += '&dt=';
            }
            // Fetch a remote view
            fetch(u + new Date().getTime(), { headers: { 'X-Requested-With': 'http' }}).then(function(v) {
                v.text().then(function(v) {
                    if (typeof(self.onbeforecreatepage) === 'function') {
                        self.onbeforecreatepage.call(self, page, v);
                    }
                    // Controller
                    let handler = page.controller;
                    if (handler) {
                        e.innerHTML = '';
                        // Call the LemonadeJS renderer
                        r(handler, e, s, "<>" + v + "</>");
                    } else {
                        e.innerHTML = v;
                    }
                    if (cb) {
                        cb.call(self, page, true);
                    }
                })
            });
        } else {
            if (typeof(self.onbeforecreatepage) === 'function') {
                self.onbeforecreatepage.call(self, page);
            }
            // Controller
            let handler = page.controller;
            if (handler) {
                r(handler, e, s);
                if (cb) {
                    cb.call(self, page, true);
                }
            }
        }
    }

    const load = function(page, newPage) {
        // Hide old element
        if (! this.current || page.element !== this.current.element) {
            if (this.current && ! this.single && this.animation) {
                // Show element for the animation
                page.element.style.display = '';
                // Start the animation
                animation.call(this, page, newPage);
            } else {
                changePage.call(this, page, newPage);
            }
        }
    }

    const animation = function(page, newPage) {
        let self = this;
        // Correct class
        let e = self.el.classList;
        let d = 'slide-left-' + (self.config.indexOf(page) < self.config.indexOf(self.current) ? 'in' : 'out');
        e.add(d);
        setTimeout(function() {
            // Remove animation
            e.remove(d);
            // Change page
            changePage.call(self, page, newPage);
        }, 400);
    }

    const changePage = function(page, newPage) {
        // Hide previous
        if (this.single) {
            if (this.current) {
                this.current.element.remove();
            }
            this.el.appendChild(page.element);
        } else {
            if (this.current) {
                this.current.element.style.display = 'none';
            }
        }
        // Make sure the new page is visible
        page.element.style.display = '';
        // Onchange
        if (typeof(this.onchangepage) === 'function') {
            this.onchangepage.call(this, page, this.current, newPage);
        }
        // Current page
        this.current = page;
        // On enter
        if (page.self.onenter) {
            page.self.onenter.call(this, page.element, page);
        }
        // Remove loading animation
        this.el.classList.remove('loading');
    }

    /**
     * Get route
     * @param {string} p - pathname
     */
    const getConfig = function(p) {
        let c = this.config;
        for (let i = 0; i < c.length; i++) {
            if (p === c[i].path || p.match(new RegExp('^'+c[i].path+'$', 'gi'))) {
                return c[i];
            }
        }
        return false;
    }

    const Router = function(html, components) {
        let self = this;

        self.onload = function() {
            // Extract configuration
            if (html) {
                extract.call(this, self.el, components);
            }
            // Pre load
            let c = self.config;
            for (let i = 0; i < c.length;i++) {
                if (c[i].preload) {
                    create.call(self, c[i]);
                }
            }
            // Current address
            let a = window.location;
            // Set the initial path
            self.setPath(a.pathname + a.search, true);
        }

        self.setPath = function(path, ignore) {
            // Get the configuration based on the path
            let page = getConfig.call(self, path);

            // Configuration
            if (typeof(self.onbeforechangepage) === 'function') {
                let r = self.onbeforechangepage.call(self, path, page);
                if (r === false) {
                    return;
                } else if (r) {
                    if (typeof(r) == 'object') {
                        page = r;
                    } else {
                        path = r;
                        page = getConfig.call(self, path);
                    }
                }
            }

            if (page && path !== self.path) {
                if (! ignore) {
                    history.pushState({ route: path }, '', path);
                }
                // Set the new path
                self.path = path;

                // Loading animation
                self.el.classList.add('loading');

                // Render new page based on the configuration found for this path
                if (! page.element) {
                    create.call(self, page, load);
                } else {
                    load.call(self, page, false);
                }
            }

            // Return the page object
            return page;
        }

        // Intercept click
        document.body.addEventListener('click', function(e) {
            let a = e.target.closest('a');
            if (a && a.tagName === 'A' && a.pathname && ! a.getAttribute('target')) {
                self.setPath(a.pathname + a.search);
                e.preventDefault();
            }
        });

        // Events
        window.addEventListener('popstate', function(e) {
            let a = window.location;
            self.setPath(a.pathname + a.search, true);
        });

        return `<div class="pages">${html}</div>`;
    }

    lemonade.setComponents({ Router: Router });

    return function(root, options, components) {
        // Render element
        if (typeof(root) === 'object') {
            // Do not accept blank options
            if (! options) {
                options = {};
            }
            // Extract any possible existing page
            extract.call(options, root, components);
            // Render
            lemonade.render(Router, root, options, '', false, components);

            return options;
        } else {
            // Render element
            return Router.call(this, root, components);
        }
    }
})));