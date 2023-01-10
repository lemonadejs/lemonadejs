;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Dropdown = factory();
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

    return function() {
        const self = this;

        self.create = function(o) {
            if (this.remotesearch === 'true') {
                this.remoteSearch = true;
            }
            if (this.multiple === 'true') {
                this.multiple = true;
            }
            if (this.autocomplete === 'true') {
                this.autocomplete = true;
            }
            self.instance = jSuites.dropdown(o, this);
        }

        return `<div @ready="self.create(this)" name="{{self.name}}"></div>`;
    }

})));