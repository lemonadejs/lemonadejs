if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

if (! Contextmenu && typeof (require) === 'function') {
    var Contextmenu = require('@lemonadejs/contextmenu');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Topmenu = factory();
}(this, (function () {

    const Topmenu = function() {
        let self = this;

        self.open = function(e, s) {
            let x = e.target.offsetLeft;
            let y = e.target.offsetTop + e.target.offsetHeight;
            self.menu.open(e, s.submenu, x, y);
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        return `<div class="lm-topmenu">
            <div class="lm-topmenu-options" :loop="self.options">
                <div class="lm-topmenu-title" oncontextmenu="self.parent.open(e, self)" onmouseover="self.parent.open(e, self)" onclick="self.parent.open(e, self)">{{self.title}}</div>
            </div>
            <Contextmenu :ref="self.menu"/>
        </div>`
    }

    lemonade.setComponents({ Topmenu: Topmenu });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Topmenu, root, options)
            return options;
        } else {
            return Topmenu.call(this, root)
        }
    }
})));