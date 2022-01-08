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
        var self = this;
        if (! self.number) {
            self.number = 5;
        }
        self.stars = [];

        // Event
        var change = self.onchange;

        // Current self star
        var current = null;

        /**
         * Update the number of stars
         */
        var len = function() {
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

        var val = function() {
            // Update value
            if (self.value > 0) {
                var t = null;
                if (t = self.stars[self.value-1]) {
                    self.click(t);
                }
            }
        }

        self.onchange = function(prop) {
            if (prop == 'number') {
                len();
            } else if (prop == 'value') {
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
            var index = self.stars.indexOf(s);
            for (var i = 0; i < self.number; i++) {
                if (i <= index && s !== current) {
                    self.stars[i].selected = 1;
                    self.stars[i].el.style.color = 'red';
                } else {
                    self.stars[i].selected = 0;
                    self.stars[i].el.style.color = '';
                }
            }
            current = s;
            if (change) {
                change(index+1, s);
            }
        }

        var template = `<div @loop="self.stars" value="{{self.value}}" @ref="self.component" number="{{self.number}}" name="{{self.name}}" style="cursor: pointer">
            <i class="material-icons" onclick="self.parent.click(self)">{{self.selected?'star':'star_outline'}}</i>
        </div>`;

        var root = lemonade.element(template, self);

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