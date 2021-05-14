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

    if (! jSuites) {
        if (window.jSuites) {
            var jSuites = window.jSuites;
        } else if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        }
    }

    if (! jSuites.app) {
        if (window.jSuites.app) {
            jSuites.app = window.jSuites.app;
            jSuites.actionsheet = window.jSuites.actionsheet;
            jSuites.dialog = window.jSuites.dialog;
            jSuites.confirm = window.jSuites.confirm;
            jSuites.refresh = window.jSuites.refresh;
        } else if (typeof(require) === 'function') {
            var mobile = require('@jsuites/mobile');
            Object.assign(jSuites, mobile);
        }
    }

    return (function(el, options) {
        var obj = options && options.app ? options.app : {};
        obj.options = {};

        // Default configuration
        var defaults = {
            socket: null,
            onload: null,
            onerror: null,
            scope: null,
            config: {},
        }

        // Loop through our object
        for (var property in defaults) {
            if (options && options.hasOwnProperty(property)) {
                obj.options[property] = options[property];
            } else {
                obj.options[property] = defaults[property];
            }
        }

        // Scope global
        if (! obj.options.scope) {
            obj.options.scope = window;
        }

        // Controllers
        var controllers = {};

        /**
         * Get the controller
         */
        obj.getController = function(route) {
            return controllers[route];
        }

        /**
         * Set the controller
         */
        obj.setController = function(route, o) {
            controllers[route] = o;
        }

        /**
         * Get the application
         */
        obj.getApplication = function() {
            return application;
        }

        /**
         * Loading necessary socket.io scripts
         */
        obj.socket = function(url, callback) {
            jSuites.loading.show();

            var head = document.head;
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onreadystatechange = callback;
            script.onload = function() {
                callback();
                jSuites.loading.hide();
            };
            head.appendChild(script);
        }

        /**
         * Read JWT information
         * @param piece
         * @returns {*|boolean}
         */
        obj.jwt = function(piece) {
            if (! piece) {
                piece = 'user_id';
            }
            var cookie = document.cookie.match(/bossanova=(.*);?/);
            if (cookie && cookie[1]) {
                cookie = cookie[1].split(';');
                cookie = cookie[0].split('.');
                if (cookie[1]) {
                    var json = atob(cookie[1]);
                    if (json) {
                        json = JSON.parse(json);
                        return json[piece] ? json[piece] : false;
                    }
                }
            }
            return false;
        }

        // Configuration of the applicadtion
        if (! obj.options.config) {
            obj.options.config = {};
        }

        // Default 
        obj.options.config.onbeforecreatepage = function (instance, page) {
            // Dynamic controller
            if (! controllers[page.options.ident]) {
                // Get route string and transform to object string
                var route = page.options.ident.substr(1).replace(new RegExp('/', 'g'), '.');
                // If the related object with the matching route string, create controller reference
                if (route = jSuites.path.call(obj.options.scope, route)) {
                    // Exists as a method, create the reference
                    if (typeof(route) == 'function') {
                        controllers[page.options.ident] = { controller: route };
                    }
                }
            }
            // If the controller does not exist, try to get the controller the view from the backend
            if (! controllers[page.options.ident]) {
                page.options.url = page.options.route;
            }
        }

        obj.options.config.oncreatepage = function (instance, page, view) {
            // Create and append the lemonade self to our container of controllers
            var o = controllers[page.options.ident];
            if (o) {
                var controller = o.controller;
            } else {
                // Get any autoload component
                var route = page.querySelector("[data-autoload]");
                if (route) {
                    if (route = route.getAttribute('data-autoload')) {
                        // Get self
                        if (route = jSuites.path.call(obj.options.scope, route)) {
                            // Dynamic controller
                            if (typeof(route) == 'function') {
                                var controller = route;
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
                controllers[page.options.ident].self = controller(instance, page);

                // Execute the lemonade parser
                try {
                    lemonade.apply(page, controllers[page.options.ident].self);
                } catch (e) {
                    console.log(e);
                }
            }
        }

        obj.options.config.onchangepage = function(instance, page, oldPage) {
            // If the controller exists
            var o = controllers[page.options.ident];
            if (o) {
                // And the onenter event is available
                if (o.self && typeof (o.self.onenter) == 'function') {
                    // Call event onenter
                    return o.self.onenter(page);
                }
            }
        }

        if (typeof(obj.options.onerror) == 'function') {
            obj.options.config.onerrorpage = function(instance, page) {
                obj.options.onerror(obj, instance, page);
            }
        }

        // Application
        var application = jSuites.app(el, obj.options.config);

        // Onload
        if (typeof(obj.options.onload) == 'function') {
            obj.options.onload(obj, application);
        }

        // Initial page
        if (! el.innerHTML) {
            application.pages(window.location.pathname + window.location.search);
        }

        // Shortcut
        el.application = obj;

        return obj;
    });
})));