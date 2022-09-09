;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Modal = factory();
}(this, (function () {

    // Load lemonadejs
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    // Load lemonadejs
    if (typeof(jSuites) == 'undefined') {
        if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        } else if (window.jSuites) {
            var jSuites = window.jSuites;
        }
    }

    return function(html) {
        var self = this;

        self.create = function(o) {
            self.modal = jSuites.modal(o, self);
        }

        var template = `
            <div @ready="self.create(this)" name={{self.name}}>
                ${html}
            </div>
        `;

        return lemonade.element(template, self);
    }

})));