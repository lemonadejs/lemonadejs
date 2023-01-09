;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Navbar = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            const lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            const lemonade = window.lemonade;
        }
    }

    return function(template) {
        let self = this;

        let Icon = function() {
            let t = `<div class="icon"><a href='{{self.href}}'><i class="icon material-icons">{{self.icon}}</i></a></div>`;
            return lemonade.element(t, this);
        }

        let Header = function() {
            let t = `<div class='title'>{{self.title}}</div>`;
            return lemonade.element(t, this);
        }

        template = `<div class="navbar"><div class="navbar-container">${template}</div></div>`;

        return lemonade.element(template, self, { Header, Icon });
    }

})));