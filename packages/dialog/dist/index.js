;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Dialog = factory();
}(this, (function () {

    // Load lemonadejs
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    return function() {
        var self = this;

        self.rootClass = 'jdialog'
        self.title = '';
        self.message = '';
        self.confirmLabel = 'OK';
        self.input = '';
        self.inputPlaceholder = 'Value';
        self.cancelLabel = 'Cancel';
        self.type = 'default';
        self.cancel = true;

        // Events
        self.onconfirm = null;
        self.oncancel = null;

        self.show = function(options) {
            lemonade.setProperties.call(self, options);

            if (self.type === 'alert') {
                self.rootClass += ' jdialog-alert';
            } else if (self.type === 'input') {
                self.rootClass += ' jdialog-input'
            }

            // Append element to the app
            self.container.style.display = 'flex';
            self.container.children[0].style.opacity = 10;

            // Focus
            self.container.focus();
        }

        self.hide = function() {
            self.container.style.display = '';
            self.container.children[0].style.opacity = 0;
        }

        self.onload = function() {
            // Add event listeners
            self.confirmButton.onclick = function() {
                self.hide();

                if (typeof self.onconfirm === 'function') {   
                    self.onconfirm(self);  
                }
            }
            
            self.cancelButton.onclick = function() {
                self.hide();

                if (typeof self.oncancel === 'function') {
                    self.oncancel();
                }
            }
        }
        var template = `
        <div tabindex="901" class="{{self.rootClass}}" @ref="self.container">
            <div class="jdialog-container">
            <div class="jdialog-header">
                <div class="jdialog-title">{{self.title}}</div>
                <div class="jdialog-message">{{self.message}}</div>
            </div>
            <div class="jdialog-footer">
                <div style="{{self.type == 'input' ? 'display: block;' : 'display: none;'}}">
                    <input type="text" @bind="self.input" value="{{self.input}}" placeholder="{{self.inputPlaceholder}}" />
                </div>
                <div>
                    <input type="button" value="OK" @ref="self.confirmButton">
                </div>
                <div style="{{self.cancel || !(self.type == 'alert' || self.type == 'input')? 'display: block;' : 'display: none;'}}">
                    <input 
                        @ref="self.cancelButton" 
                        type="button" 
                        value="{{self.cancelLabel}}"
                    />
                </div>
            </div>
            </div>
        </div>
        `;

        return lemonade.element(template, self);
    }

})));


