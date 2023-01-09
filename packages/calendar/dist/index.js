;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Calendar = factory();
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
        const self = this;

        self.onchange = function(prop) {
            if (self.instance && prop === 'value') {
                self.instance.setValue(self.value);
            }
        }

        self.create = function(o) {
            if (this.time || this.time == 'true') {
                this.time = true;
            }

            self.instance = jSuites.calendar(o, this);
        }

        if (self.type == 'input') {
            const template = `<input type="text" @ready="self.create(this)" name="{{self.name}}" value="{{self.value}}" />`;
        } else {
            const template = `<div @ready="self.create(this)" name="{{self.name}}"  value="{{self.value}}"></div>`;
        }

        return lemonade.element(template, self);
    }
})));