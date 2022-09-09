;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Login = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    /**
     * The element passed is a DOM element
     */
    var isDOM = function(o) {
        return (o instanceof Element || o instanceof HTMLDocument);
    }

    var Component = function(template) {
        var self = this;

        var template = `
            <div class="jlogin" fullscreen="{{self.fullscreen}}">
                <form>
                    <div class="jlogin-logo"></div>
                    <div>
                        <label>Name</label>
                        <input type="text" name="name">
                    </div>
                    <div>
                        <label>Username</label>
                        <input type="text" name="login" autocomplete="off">
                    </div>
                    <div>
                        <label>E-mail</label>
                        <input type="text" name="username" autocomplete="new-username">
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="password" name="password" autocomplete="new-password">
                    </div>
                    <div>
                        <input type="button" value="Login">
                    </div>
                    <div class="rememberButton">
                        <label>Remember me on this device<input type="checkbox" name="remember" value="1"></label>
                    </div>
                    <div class="requestButton"
                        <span>Request a new password</span>
                    </div>
                    <div class="newProfileButton">
                        <span>Create a new profile</span>
                    </div>
                </form>
            </div>
        `;

        return lemonade.element(template, self);
    }

    return function(a, b) {
        if (isDOM(a)) {
            lemonade.render(Component, a, b);
        } else {
            return Component(a);
        }
    }

})));