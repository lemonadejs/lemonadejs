;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Actionsheet = factory();
}(this, (function () {

    // Load lemonadejs
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    const Groupoptions = function() {
        const self = this;
            
        return `<div>
                <input 
                    type="button" 
                    class="{{self.className || ''}}" 
                    value="{{self.title}}" 
                    onclick="self.onclick(self)"
                    style="{{self.action == 'cancel' ? 'color:red;' : ''}}"
                />
            </div>`;
    }

    const Actiongroup = function() {
        const self = this;

        if (! Array.isArray(self.options)) {
            self.options = [];
        }

        var template = `<div class="jactionsheet-group">
            <Groupoptions @loop="self.options" />
        </div>`;

        return lemonade.element(template, self, { Groupoptions });
    }

    return function() {
        const self = this;

        self.visible = false;
        self.actions = []
        self.className = 'jactionsheet-content';

        // Events
        self.hide = function() {
            self.className += 'slide-bottom-out';

            self.container.onanimationend = function() {
                self.className = 'jactionsheet-content';
                self.visible = false;
            }
        }

        self.show = function(options) {
            if (options) {
                lemonade.setProperties.call(self, options);
            }

            self.visible = true;
            self.className += ' slide-bottom-in';

            self.container.onanimationend = function() {
                self.className = self.className.replace('slide-bottom-in', '');
            }
        }

        let template = `<div class="jactionsheet" style="display: {{self.visible?'flex':'none'}}">
                <div @ref="self.container" class="{{self.className}}">
                    <Actiongroup @loop="self.actions" close="{{self.close}}" />
                </div>
            </div>`;

        return lemonade.element(template, self, { Actiongroup, Groupoptions });
    }

})));


