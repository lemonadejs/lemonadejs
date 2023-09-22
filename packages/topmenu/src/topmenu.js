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
            return `<div data-icon="{{self.icon}}" data-submenu="{{!!self.submenu}}" onmouseover="self.parent.mouseover(self, this);"><a>{{self.title}}</a> <span>{{self.shortcut}}</span></div>`;
        }
    }

    const Items = function() {
        let self = this;

        self.mouseover = function(s, element) {
            if (s.submenu) {
                self.modalSubmenu.closed = false;
                self.modalSubmenu.top = element.offsetTop;
                self.modalSubmenu.left = 250;

                if (! self.modalSubmenu.el.innerText) {
                    lemonade.render(Items, self.modalSubmenu.el, {options: s.submenu});
                } else {
                    self.modalSubmenu.options = s.submenu;
                }
            }
        }

        let template = `<div>
            <div class="lm-topmenu-menu" >
            <Item :loop="self.options" />
            </div>
            <Modal :closed="true" :ref="self.modalSubmenu" />
        </div>`;
        
        return lemonade.element(template, self, { Item: Item });
    }

    const Topmenu = function() {
        let self = this;

        self.open = function(s, element, e) {
            if (e.type === 'click') {
                self.modal.closed = !self.modal.closed;
            }
            if (self.modal.closed === false) {
                self.modal.left = element.offsetLeft;
                self.modal.items.options = s.submenu;
            }
        }

        return `<div class="lm-topmenu">
            <div  class="lm-topmenu-options" :loop="self.options">
                <div class="lm-topmenu-title"
                    onmouseover="self.parent.open(self, this, e)"
                    onclick="self.parent.open(self, this, e)">{{self.title}}</div>
            </div>
            <Modal :closed="true" :ref="self.modal"><Items :ref="self.items" :options="[]" /></Modal>
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