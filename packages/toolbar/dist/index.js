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
    const extract = function(html) {
        // Extract config from the template definitions
        let d = document.createElement('div');
        d.innerHTML = html;
        let o,t = null;
        let c = d.children;
        for (let i = 0; i < c.length; i++) {
            o = {};
            // Load attributes
            t = c[i].attributes;
            for (let j = 0; j < t.length; j++) {
                o[t[j].name] = t[j].value;
            }
            // Push to the configuration
            this.data.push(o);
        }
    }

    return function(html) {
        const self = this;

        if (! self.options) {
            self.options = [];
        }

        if (html) {
             extract.call(self, html);
        }

        return `<div class="lm-toolbar" @loop="self.data">
            <div class="lm-toolbar-item">
                <a href="{{self.route}}">
                <i class="material-icons">{{self.content}}</i>
                <span>{{self.title}}</span>
                </a>
            </div>
        </div>`;
    }
})));