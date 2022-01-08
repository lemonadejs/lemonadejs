;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Signature = factory();
}(this, (function () {

    // Load LemondeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    return function() {
        var self = this;
        var x = null;
        var y = null;
        var canvas = null;
        var ctx = null;

        // Onchange declared event
        var c = self.onchange;
        var update = function() {
            if (c) {
                c();
            }
        }

        /**
         * Make sure the value is an array format
         */
        var valid = function() {
            if (! Array.isArray(self.value)) {
                self.value = [];
            }
        }

        /**
         * Mark the initial position basd on the mouse event
         * @param e
         */
        var point = function(e) {
            if (e.changedTouches && e.changedTouches[0]) {
                var rect = e.target.getBoundingClientRect();
                x = e.changedTouches[0].clientX - rect.x;
                y = e.changedTouches[0].clientY - rect.y;
            } else {
                x = e.offsetX;
                y = e.offsetY;
            }

            self.value.push([ x, y ]);
        }

        var move = function(i, j) {
            ctx.beginPath();
            ctx.lineWidth = self.line || 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            ctx.moveTo(i, j);
        }

        var line = function(i, j) {
            ctx.lineTo(i, j);
            ctx.stroke();
        }

        var draw = function(e) {
            if (x !== null) {
                if (e.which) {
                    if (! self.disabled) {
                        move(x, y);
                        point(e);
                        line(x, y);
                    }
                } else {
                    x = null;
                    y = null;
                    self.value.push('1');
                    update();
                }
            }
        }

        self.onchange = function() {
            // Reset
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Update points
            var c = JSON.parse(JSON.stringify(self.value));
            if (c && c.length) {
                // Position to the initial point
                var t = c.shift();
                move(t[0], t[1]);

                // Draw points
                while (t = c.shift()) {
                    if (t == 1) {
                        t = c.shift();
                        if (Array.isArray(t)) {
                            ctx.moveTo(t[0], t[1]);
                        }
                    }
                    if (Array.isArray(t)) {
                        line(t[0], t[1]);
                    }
                }
            } else {
                valid();
            }

            update();
        }

        self.getImage = function() {
            return canvas.toDataURL();
        }

        self.init = function(o) {
            canvas = o;

            // Canvas references
            ctx = o.getContext('2d');

            // Integration with forms
            o.val = function(v) {
                if (typeof(v) === 'undefined') {
                    return self.value;
                } else {
                    self.value = v;
                }
            }

            // Intercept click
            o.onmousedown = o.ontouchstart = point;
            o.onmousemove = o.ontouchmove = draw;
        }

        var template = `<><canvas value="{{self.value}}" width="{{self.width}}" height="{{self.height}}" @ready="self.init(this)"></canvas><div>{{self.instructions}}</div></>`;

        valid();

        return lemonade.element(template, self);
    }
})));