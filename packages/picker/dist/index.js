if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('../../../dist/lemonade');
}

if (! Contextmenu && typeof (require) === 'function') {
    var Contextmenu = require('../../contextmenu/dist/index');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Picker = factory();
}(this, (function () {

    const Picker = function() {
        let self = this;

        if (typeof(self.width) === 'undefined') {
            self.width = 200;
        }

        self.onchange = function(prop) {
            if (prop === 'width') {
                self.el.firstChild.style.width = self.width + 'px';
            }
        }

        self.onload = function() {
            self.el.firstChild.style.width = self.width + 'px';
        }

        self.open = function(e) {
            let x = e.target.offsetLeft;
            let y = e.target.offsetTop + e.target.offsetHeight + 2;
            self.menu.open(e, self.options, x, y);
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        return `<div class="lm-picker" :width="self.width"><div class="lm-picker-header" oncontextmenu="self.open(e)" onmouseover="self.open(e)" onclick="self.open(e)">{{self.title}}</div>
            <Contextmenu :ref="self.menu" />
        </div>`;
    }

    lemonade.setComponents({ Picker: Picker });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Picker, root, options);
            return options;
        } else {
            return Picker.call(this, root);
        }
    }
})));