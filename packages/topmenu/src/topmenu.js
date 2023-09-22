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
        

        return `<div :loop="self.options"><div >{{self.title}}</div></div>`;
    }

    const Menu = function() {
        let self = this;

        console.log(self)

        return '<Modal :closed="false"><Items :options="self.parent.submenu" /></Modal>'
    }

    const Topmenu = function() {
        let self = this;

        self.open = function(s, el) {
            console.log(el.childNodes.length)
            let d = document.createElement('div');
            el.appendChild(d);
            lemonade.render(Menu, d, s);
        }

        // <Modal :closed="true"><Items :options="self.parent.submenu" /></Modal>


        return `<div class="lm-topmenu" :loop="self.options">
            <div onclick="self.parent.open(self, this)">
                <div class="lm-topmenu-title">{{self.title}}</div>
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