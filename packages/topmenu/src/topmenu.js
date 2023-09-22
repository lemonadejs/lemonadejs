if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

if (!Modal && typeof (require) === 'function') {
    var Modal = require('@lemonadejs/modal');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Topmenu = factory();
}(this, (function () {

    const Items = function() {
        let self = this;
        return `<div>1</div>`;
    }

    const Topmenu = function() {
        let self = this;

        self.open = function(s) {
            let d = document.createElement('div');
            self.el.appendChild(d);
            lemonade.render(Menu, d, s);
        }

        return `<div class="lm-topmenu" :loop="self.options">
            <div onclick="self.parent.open(self)">
                <div class="lm-topmenu-title">{{self.title}}</div>
                <Modal closed><Items :options="self.submenu" /></Modal>
            </div>
        </div>`
    }

    lemonade.setComponents({ Topmenu: Topmenu, Items: Items });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Topmenu, root, options)
            return options;
        } else {
            return Topmenu.call(this, root)
        }
    }
})));