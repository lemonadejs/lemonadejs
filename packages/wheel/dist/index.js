if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Wheel = factory();
}(this, (function () {

    let isMouseDown = false;
    let startY;
    let startScroll;

    const mouseDown = function (e) {
        isMouseDown = true;
        startY = e.clientY;  // Get the current Y-coordinate
        startScroll = this.scrollTop;  // Get the current scroll position
        this.classList.remove('lm-wheel-grid');
    }

    const mouseMove = function(e) {
        if (! isMouseDown) {
            return;
        }
        let yDiff = e.clientY - startY;
        let s = this;
        s.scrollTop = startScroll - yDiff;
        e.preventDefault();
    }

    const Wheel = function () {
        let self = this;

        self.onchange = function (prop) {
            if (prop === "value" && typeof (self.onupdate) === "function") {
                self.onupdate(self.value);
            }
        }

        self.onload = function () {
            self.ul.addEventListener('wheel', function (e) {
                let isMouseWheel = false;
                if (typeof (e.wheelDelta) !== 'undefined') {
                    // The event is fired by a mouse wheel if the wheelDelta is a multiple of 120
                    isMouseWheel = e.wheelDelta % 120 === 0;
                } else if (typeof (e.detail) !== 'undefined') {
                    // The event is fired by a mouse wheel if the detail is a multiple of 3
                    isMouseWheel = e.detail % 3 === 0;
                }

                if (isMouseWheel) {
                    // Prevent the default scroll behavior
                    e.preventDefault();
                    // Determine the scroll direction: positive for down, negative for up
                    let scrollDirection = Math.sign(e.deltaY);
                    // Scroll the content by one line (change the value 20 to adjust the line height)
                    this.scrollBy(0, 40 * scrollDirection);

                }

                self.value = self.options[self.ul.scrollTop / 40];
            }, { passive: false });
            self.ul.addEventListener('mousedown', mouseDown);
            self.ul.addEventListener('mousemove', mouseMove);

            document.addEventListener('mouseup', function () {
                isMouseDown = false;  // Set the flag to false when mouse is released
                self.ul.classList.remove('lm-wheel-grid');
                self.ul.scrollTo({
                    behavior: "smooth",
                    top: Math.round(self.ul.scrollTop / 40) * 40
                })

                self.value = self.options[Math.round(self.ul.scrollTop / 40)];
            });
        }

        return `<div class="lm-wheel" :value="self.value">
            <ul class="lm-wheel-grid" :loop="self.options" :ref="self.ul">
                <li>{{self.title}}</li>
            </ul>
        </div>`;
    }

    lemonade.setComponents({ Wheel: Wheel });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Wheel, root, options);
            return options;
        } else {
            return Wheel.call(this, root);
        }
    }
})));