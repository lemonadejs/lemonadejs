if (! lemonade && typeof(require) === 'function') {
    var lemonade = require('../../../dist/lemonade');
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Modal = factory();
}(this, (function () {

    // State of the resize and move modal
    let state = {};
    // Internal controls of the action of resize and move
    let controls = {};
    // Width of the border
    let cornerSize = 10;

    // Get the coordinates of the action
    const getCoords = function(e) {
        let x;
        let y;

        if (e.changedTouches && e.changedTouches[0]) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }

        return [x,y];
    }

    // Get the button status
    const getButton = function(e) {
        e = e || window.event;
        if (e.buttons) {
            return e.buttons;
        } else if (e.button) {
            return e.button;
        } else {
            return e.which;
        }
    }

    // Finalize any potential action
    const mouseUp = function(e) {
        // Finalize all actions
        if (typeof(controls.action) === 'function') {
            controls.action();
        }
        // Reset controls
        controls = {};
        // Reset state controls
        state = {
            x: null,
            y: null,
        }
    }

    const mouseMove = function(e) {
        if (! getButton(e)) {
            return false;
        }
        // Get mouse coordinates
        let [x,y] = getCoords(e);

        // Move modal
        if (controls.type === 'move') {
            if (state && state.x == null && state.y == null) {
                state.x = x;
                state.y = y;
            }

            let dx = x - state.x;
            let dy = y - state.y;
            let top = controls.e.offsetTop + dy;
            let left = controls.e.offsetLeft + dx;

            // Update position
            controls.top = top
            controls.left = left
            controls.e.style.top = top + 'px';
            controls.e.style.left = left + 'px';
            controls.e.style.cursor = "move";


            state.x = x;
            state.y = y;
            state.top = top
            state.left = left
        } else if (controls.type === 'resize') {
            let width = null;
            let height = null;
            let newHeight = null;

            if (controls.d === 'e-resize' || controls.d === 'ne-resize' || controls.d === 'se-resize') {
                // Update width
                width = controls.w + (x - controls.x);
                controls.e.style.width = width + 'px';

                // Update Height
                if (e.shiftKey) {
                    newHeight = (x - controls.x) * (controls.h / controls.w);
                    height = controls.h + newHeight;
                    controls.e.style.height = height + 'px';
                } else {
                    newHeight = false;
                }
            }

            if (! newHeight) {
                if (controls.d === 's-resize' || controls.d === 'se-resize' || controls.d === 'sw-resize') {
                    height = controls.h + (y - controls.y);
                    controls.e.style.height = height + 'px';
                }
            }
        }
    }

    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('mousemove', mouseMove);

    // Dispatcher
    const Dispatch = function(type, option){
        if (typeof this[type] === 'function') {
            this[type](this, option)
        }
    }

    const Modal = function (template) {
        let self = this;

        // Make sure keep the state as boolean
        self.closed = !!self.closed;

        self.onload = function() {
            if (self.url) {
                fetch(self.url)
                    .then(response => response.clone().body)
                    .then(body => {
                        let reader = body.getReader();
                        reader.read().then(function pump({done, value}) {
                            const decoder = new TextDecoder();
                            template += decoder.decode(value.buffer);
                        });
                    });
            }

            // Initial centralize
            if (self.center === true) {
                self.top = (window.innerHeight - self.height) / 2;
                self.left = (window.innerWidth - self.width) / 2;
            }

            // Full screen
            if (self.height > 260) {
                self.el.classList.add('fullscreen');
            }

            // Close and stop propagation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && self.closed === false) {
                    self.closed = true;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });
        }

        self.onchange = function(property) {
            if (property === 'closed') {
                self.closed ? Dispatch.call(self,'onclose') : Dispatch.call(self,'onopen');
            } else if (property === 'top' || property === 'left' || property === 'width' || property === 'height') {
                self.el.style[property] = self[property] + 'px';
            }
        }

        self.mousemove = function(e) {
            if (getButton(e)) {
                return;
            }

            // Root element of the component
            let item = self.el;
            // Get the position and dimensions
            let rect = item.getBoundingClientRect();

            controls = {
                type: null,
                e: item,
                w: rect.width,
                h: rect.height,
            }

            // When resizable
            if (self.resizable === true) {
                if (rect.height - (e.clientY - rect.top) < cornerSize) {
                    if (rect.width - (e.clientX - rect.left) < cornerSize) {
                        item.style.cursor = 'se-resize';
                    } else {
                        item.style.cursor = 's-resize';
                    }
                } else if (rect.width - (e.clientX - rect.left) < cornerSize) {
                    item.style.cursor = 'e-resize';
                } else {
                    item.style.cursor = '';
                }

                if (item.style.cursor) {
                    controls.type = 'resize';
                    controls.d = item.style.cursor;
                } else {
                    controls.type = null;
                    controls.d = null;
                }
            }
        }

        self.mousedown = function(e) {
            // Get mouse coordinates
            let [x,y] = getCoords(e);
            controls.x = x;
            controls.y = y;
            // Root element of the component
            let item = self.el;
            // Get the position and dimensions
            let rect = item.getBoundingClientRect();
            let corner = rect.width - (x - rect.left) < 40 && (y - rect.top) < 40 ? true : false;

            if (self.closabled === true && corner === true) {
                self.closed = true;
            } else if (self.minimizable === true && corner === true) {
                self.minimized = ! item.lemon.self.minimized;
            } else {
                if (controls.type === 'resize') {
                    // This will be the callback when finalize the resize
                    controls.action = function() {
                        self.width = parseInt(item.style.width);
                        self.height = parseInt(item.style.height);
                    }
                    // Make sure the width and height is defined for the modal
                    if (!item.style.width) {
                        item.style.width = controls.w + 'px';
                    }
                    if (!item.style.height) {
                        item.style.height = controls.h + 'px';
                    }
                } else {
                    // Modal is draggable by the title
                    if (self.draggable === true && self.title && y - rect.top < 40) {
                        // Action
                        controls.type = 'move';
                        // Callback
                        controls.action = function() {
                            self.top = parseInt(item.style.top);
                            self.left = parseInt(item.style.left);
                        }
                    }
                }
            }
        }

        return `<div class="lm-modal" title="{{self.title}}" closed="{{self.closed}}" :closable="self.closable" :minimized="self.minimized" :minimizable="self.minimizable" :top="self.top" :left="self.left" :width="self.width" :height="self.height" onmousedown="self.mousedown(e)" onmousemove="self.mousemove(e)" tabindex="-1">${template}</div>`
    }

    lemonade.setComponents({ Modal: Modal });

    return function (root, options) {
        if (typeof(root) === 'object') {
            let template = root.innerHTML;
            root.innerHTML = '';

            lemonade.render(Modal, root, options, template)
            return options;
        } else {
            return Modal.call(this, root)
        }
    }
})));