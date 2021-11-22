/**
 * (c) LemonadeJS components
 *
 * Website: https://lemonadejs.net
 * Description: Single page app router
 *
 * MIT License
 *
 */

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.router = factory();
}(this, (function () {

    'use strict';

    // Load jSuites
    if (typeof(jSuites) == 'undefined') {
        if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        } else if (window.jSuites) {
            var jSuites = window.jSuites;
        }
    }

    // Set the app extensions
    if (typeof(jSuites.app) == 'undefined') {
        if (typeof(require) === 'function') {
            // Loading App Extensions
            var app = require('@jsuites/app');
            // Set the jSuites.app extension
            jSuites.setExtensions(app);
        }
    }

    // Load lemonadejs
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    /**
     * Get existing route controller
     * @param route
     * @returns {object}
     */
    var getController = function(route) {
        if (this.controllers[route]) {
            return this.controllers[route];
        }
        return null;
    }

    /**
     * Set a router controller
     * @param route
     * @returns {object}
     */
    var setController = function(route, controller) {
        if (typeof(route) == 'string') {
            this.controllers[route] = {
                controller: controller,
                self: null
            };
        }
    }

    var router = (function(el, options) {
        // Controllers
        var controllers = {};

        if (options.routes && typeof(options.routes) == 'object') {
            controllers = options.routes;
        }

        /**
         * Find a controller object based on a general route string
         * @param route
         * @returns {string}
         */
        var findController = function(route) {
            // Remove any possible query string from the route
            route = route.split('?')[0];
            // Search matching route in the container
            var k = Object.keys(controllers);
            var e = null;
            if (k.length) {
                for (var i = 0; i < k.length; i++) {
                    e = new RegExp(k[i], 'gi');
                    if (route.match(e)) {
                        return route;
                    }
                }
            }
            return route;
        }

        // Make sure the options is an object with the configuration
        if (! options && typeof(options) !== 'object') {
            options = {};
        }
        // Scope must exist for the automatic view path identification
        if (! options.scope) {
            options.scope = window;
        }
        // Autoload helps to bind the controller with the route
        if (typeof(options.autoload) == 'undefined') {
            options.autoload = true;
        }
        // Application config
        if (options.config) {
            var config = options.config;
        } else {
            var config = {};
        }

        // Router identifier
        if (! config.ident) {
            config.ident = findController;
        }

        // Dictionary
        if (options.dictionary) {
            lemonade.dictionary = options.dictionary;
        }

        // Default
        config.onbeforecreatepage = function (instance, page) {
            // Controller
            var controller = null;
            // Pre-defined routes
            var route = config.ident(page.options.route, page);
            if (route && controllers[route]) {
                controller = controllers[route];
            }

            // Autoload
            if (options.autoload == true) {
                // Dynamic controller
                if (! controller) {
                    if (page.options.controller) {
                        controller = page.options.controller;
                    } else {
                        // Get route string and transform to object string
                        route = page.options.ident.substr(1).replace(new RegExp('/', 'g'), '.');
                        // If the related object with the matching route string, create controller reference
                        var path = null
                        if (path = jSuites.path.call(options.scope, route)) {
                            // Exists as a method, create the reference
                            if (typeof (path) == 'function') {
                                // Controller
                                controller = path;
                            }
                        }
                    }
                }

                // Register controller
                if (controller) {
                    controllers[page.options.ident] = { controller: controller };
                }
            }

            // If the controller does not exist, try to get the controller the view from the backend
            if (! controller && ! page.options.url) {
                page.options.url = page.options.route;
            }
        }

        config.oncreatepage = function (instance, page, view) {
            // Controller
            var controller = null;
            // Create and append the lemonade self to our container of controllers
            var o = controllers[page.options.ident];
            if (o) {
                controller = o.controller;
            } else {
                // Get any autoload component
                var route = page.querySelector("[data-autoload]");
                if (route) {
                    if (route = route.getAttribute('data-autoload')) {
                        // Get self
                        if (route = jSuites.path.call(config.scope, route)) {
                            // Dynamic controller
                            if (typeof(route) == 'function') {
                                controller = route;
                            }
                        }
                    }
                }
            }

            if (controller) {
                if (! controllers[page.options.ident]) {
                    controllers[page.options.ident] = { controller: controller };
                }

                // Self
                controllers[page.options.ident].self = controller.call(instance, page);

                // Execute the lemonade parser
                try {
                    lemonade.apply(page, controllers[page.options.ident].self);
                } catch (e) {
                    console.log(e);
                }
            }
        }

        config.onchangepage = function(instance, page, oldPage) {
            // If the controller exists
            var o = controllers[page.options.ident];
            if (o) {
                // And the onenter event is available
                if (o.self && typeof (o.self.onenter) == 'function') {
                    // Call event onenter
                    return o.self.onenter(page);
                }
            }
            if (oldPage) {
                // If the controller exists
                var o = controllers[oldPage.options.ident];
                if (o) {
                    // And the onenter event is available
                    if (o.self && typeof (o.self.onleave) == 'function') {
                        // Call event onenter
                        return o.self.onleave(oldPage);
                    }
                }
            }

            if (typeof(options.onchange) == 'function') {
                options.onchange(router, instance, page);
            }
        }

        // Application
        var application = jSuites.app(el, config);

        // Extensions
        application.controllers = controllers;
        application.get = getController;
        application.set = setController;

        // Onload
        if (typeof(options.onload) == 'function') {
            if (jSuites.ajax.pending('app')) {
                jSuites.ajax.oncomplete.app = function () {
                    options.onload(router, application);
                }
            } else {
                options.onload(router, application);
            }
        }

        // Shortcut
        el.application = application;

        // Return instance
        return application;
    });

    return router;
})));