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

    const Item = function() {
        if (this.type === 'line') {
            return `<hr />`;
        } else {
            return `<div data-icon="{{self.icon}}" data-submenu="{{!!self.submenu}}"><a>{{self.title}}</a> <span>{{self.shortcut}}</span></div>`;
        }
    }

    const Items = function() {
        let self = this;

        let template = `<div class="lm-topmenu-menu" ><Item :loop="self.options" /></div>`;
        
        return lemonade.element(template, self, { Item: Item });
    }

    const Create = function() {
        let self = this;

        let template = `<Modal :closed="true"><Items :ref="self.items" /></Modal>`;

        return lemonade.element(template, self, { Items: Items });
    }

    const Topmenu = function() {
        let self = this;


        self.open = function(e) {

            let index = e.target.getAttribute('data-index');

            if (typeof(index) !== 'undefined') {
                if (!self.modals.children[index]) {
                    lemonade.render(Create, self.modals);
                }

                let modal = self.modals.children[index].self;

                if (e.type === 'click') {
                    modal.closed = !modal.closed;
                }
                if (modal.closed === false) {
                    modal.left = e.target.offsetLeft;
                    modal.items.options = e.target.self.submenu;
                }
            }
        }

        return `<div class="lm-topmenu">
            <div class="lm-topmenu-options" :loop="self.options">
                <div class="lm-topmenu-title">{{self.title}}</div>
            </div>
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