;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Toolbar = factory();
}(this, (function () {

    // Load LemondeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    return function(html) {
        var self = this;

        var Icon = function() {
            var t = `<div>
                <a href="{{self.route}}">
                <i class="material-icons">{{self.content}}</i>
                <span>{{self.title}}</span>
                </a>
            </div>`;

            return lemonade.element(t, this);
        }

        var template = `<div class="toolbar">${html}</div>`;

        // Create lemonade component
        return lemonade.element(template, self, { Icon });
    }
})));