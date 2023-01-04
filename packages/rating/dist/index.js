;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Rating = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    return function() {
        let self = this;

        if (! self.number) {
            self.number = 5;
        }
        self.stars = [];

        // Event
        let change = self.onchange;

        // Current self star
        let current = null;

        /**
         * Update the number of stars
         */
        const len = function() {
            // Remove stars
            if (self.number < self.stars.length) {
                self.stars.splice(self.number, self.stars.length);
                if (self.value > self.number) {
                    self.value = self.number;
                }
            }
            // Add missing stars
            for (var i = 0; i < self.number; i++) {
                if (! self.stars[i]) {
                    self.stars[i] = {};
                }
            }
            // Refresh
            self.refresh('stars');
        }

        const val = function() {
            // Update value
            if (self.value > 0) {
                let t = self.stars[self.value-1];
                if (t) {
                    self.click(t);
                }
            }
        }

        self.onchange = function(prop) {
            if (prop === 'number') {
                len();
            } else if (prop === 'value') {
                val();
            }
        }

        self.onload = function() {
            len();
            val();
        }

        self.click = function(s) {
            if (! s.selected) {
                current = null;
            }
            let index = self.stars.indexOf(s);
            for (let i = 0; i < self.number; i++) {
                let selected = i <= index && s !== current ? 1 : 0;
                self.stars[i].selected = selected;
                self.stars[i].el.style.color = selected ? 'red' : '';
            }
            current = s;

            if (change) {
                change(index+1, s);
            }
        }

        let template = `<div value="{{self.value}}" number="{{self.number}}" name="{{self.name}}" style="cursor: pointer" @loop="self.stars" @ref="self.component">
            <i class="material-icons" onclick="self.parent.click(self)">{{self.selected?'star':'star_outline'}}</i>
        </div>`;

        let root = lemonade.element(template, self);

        root.val = function(v) {
            if (typeof(v) === 'undefined') {
                return self.value;
            } else {
                self.value = v;
            }
        }

        return root;
    }

})));