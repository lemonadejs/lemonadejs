;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Color = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    // Load LemonadeJS
    if (typeof(jSuites) == 'undefined') {
        if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        } else if (window.jSuites) {
            var jSuites = window.jSuites;
        }
    }

    return function() {
        var self = this;

        self.onchange = function(prop) {
            if (self.instance && prop === 'value') {
                self.instance.setValue(self.value);
            }
        }

        self.create = function(o) {
            self.instance = jSuites.color(o, this);
        }

        var template = `<input @ready="self.create(this)" name="{{self.name}}" />`;

        return lemonade.element(template, self);
    }
})));