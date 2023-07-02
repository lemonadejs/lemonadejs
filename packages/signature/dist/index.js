if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Signature = factory();
}(this, (function () {

    function Signature() {
        let self = this;
        let x = null;
        let y = null;
        let canvas = null;
        let ctx = null;

        // Onchange declared event
        let c = self.onchange;
        let o = self.onload;
        let update = function() {
            if (c) {
                c(self);
            }
        }

        /**
         * Make sure the value is an array format
         */
        const valid = function() {
            if (! Array.isArray(self.value)) {
                self.value = [];
            }
        }

        valid();

        /**
         * Mark the initial position basd on the mouse event
         * @param e
         */
        const point = function(e) {
            if (e.changedTouches && e.changedTouches[0]) {
                let rect = e.target.getBoundingClientRect();
                x = e.changedTouches[0].clientX - rect.x;
                y = e.changedTouches[0].clientY - rect.y;
            } else {
                x = e.offsetX;
                y = e.offsetY;
            }

            self.value.push([ x, y ]);
        }

        const move = function(i, j) {
            ctx.beginPath();
            ctx.lineWidth = self.line || 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            ctx.moveTo(i, j);
        }

        const line = function(i, j) {
            ctx.lineTo(i, j);
            ctx.stroke();
        }

        const draw = function(e) {
            if (x !== null) {
                if (e.which || e.type === 'touchmove') {
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
            e.preventDefault();
        }

        self.onload = function() {
            if (o) {
                o(self);
            }
        }

        self.onchange = function() {
            // Reset
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Update points
            let c = JSON.parse(JSON.stringify(self.value));
            if (c && c.length) {
                // Position to the initial point
                let t = c.shift();
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

        self.getValue = function() {
            return self.value;
        }

        self.setValue = function(v) {
            self.value = v;
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

        return `<><canvas value="{{self.value}}" width="{{self.width}}" height="{{self.height}}" :ready="self.init(this)"></canvas><div>{{self.instructions}}</div></>`;
    }


    // Register signature component across the application
    lemonade.setComponents({ Signature: Signature });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Signature, root, options)
            return options;
        } else {
            return Signature.call(this, root)
        }
    }
})));