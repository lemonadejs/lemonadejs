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

    /**
     * Extract configuration
     */
    var extract = function(html) {
        // Extract config from the template definitions
        var d = document.createElement('div');
        d.innerHTML = html;
        var o,t = null;
        var c = d.children;
        for (var i = 0; i < c.length; i++) {
            o = {};
            // Load attributes
            t = c[i].attributes;
            for (var j = 0; j < t.length; j++) {
                o[t[j].name] = t[j].value;
            }
            // Push to the configuration
            this.data.push(o);
        }
    }

    return function(html) {
        var self = this;

        if (! self.data) {
            self.data = [];
        }

        if (html) {
             extract.call(self, html);
        }

        var template = `<div class="toolbar" @loop="self.data">
                <div>
                    <a href="{{self.route}}">
                    <i class="material-icons">{{self.content}}</i>
                    <span>{{self.title}}</span>
                    </a>
                </div>
            </div>`;

        // Create lemonade component
        return lemonade.element(template, self);
    }
})));