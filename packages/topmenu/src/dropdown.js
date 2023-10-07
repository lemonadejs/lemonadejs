if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('../../../dist/lemonade');
}

if (! Contextmenu && typeof (require) === 'function') {
    var Contextmenu = require('../../contextmenu/dist/index');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Dropdown = factory();
}(this, (function () {

    const updateWidth = function() {
        this.el.firstChild.style.width = this.width + 'px';
    }

    const Dropdown = function() {
        let self = this;

        self.onchange = function(prop) {
            if (prop === 'width') {
                updateWidth.call(self);
            }
        }

        self.onload = function() {
            if (typeof(self.width) === 'undefined') {
                self.width = 200;
            }
        }

        self.open = function(e) {
            let x = e.target.offsetLeft;
            let y = e.target.offsetTop + e.target.offsetHeight + 2;
            self.menu.open(e, self.options, x, y);
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        return `<div class="lm-dropdown" :width="self.width">
            <div class="lm-picker-header" oncontextmenu="self.open(e)" onmouseover="self.open(e)" onclick="self.open(e)">
                <input type="title" value="{{self.title}}" />
            </div>
            <Contextmenu :ref="self.menu" />
        </div>`;
    }

    lemonade.setComponents({ Dropdown: Dropdown });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Picker, root, options);
            return options;
        } else {
            return Dropdown.call(this, root);
        }
    }
})));