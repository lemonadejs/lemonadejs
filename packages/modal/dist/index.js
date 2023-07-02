if (! lemonade && typeof(require) === 'function') {
    var lemonade = require('lemonadejs');
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Modal = factory();
}(this, (function () {
    let state = {};
    let editorAction;
    // Width of the border
    let cornerSize = 10;

    // Events
    const mouseDown = function(e) {
        let item = e.target.closest('.lm-modal');
        if (item !== null) {
            // Keep the tracking information
            let x;
            let y;
            let rect = item.getBoundingClientRect();

            if (e.changedTouches && e.changedTouches[0]) {
                x = e.changedTouches[0].clientX;
                y = e.changedTouches[0].clientY;
            } else {
                x = e.clientX;
                y = e.clientY;
            }

            if (item.self.closable === true && rect.width - (x - rect.left) < 40 && (y - rect.top) < 40) {
                item.self.closed = true;
            } else {
                editorAction = {
                    e: item,
                    x: x,
                    y: y,
                    w: rect.width,
                    h: rect.height,
                    d: item.style.cursor,
                    resizing: !!item.style.cursor,
                    actioned: false,
                    s: item.self,
                }

                // Make sure width and height styling is OK
                if (!e.target.style.width) {
                    item.style.width = rect.width + 'px';
                }

                if (!item.style.height) {
                    item.style.height = rect.height + 'px';
                }

                // Remove any selection from the page
                let s = window.getSelection();
                if (s.rangeCount) {
                    for (let i = 0; i < s.rangeCount; i++) {
                        s.removeRange(s.getRangeAt(i));
                    }
                }

                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    const mouseUp = function(e) {
        if (editorAction && editorAction.e) {
            // Element
            if (editorAction.resizing) {
                let w = parseInt(editorAction.e.style.width);
                let h = parseInt(editorAction.e.style.height)
                editorAction.s.width = w;
                editorAction.s.height = h;
            } else {
                let t = parseInt(editorAction.e.style.top);
                let l = parseInt(editorAction.e.style.left)
                editorAction.s.top = t;
                editorAction.s.left = l;
            }

            if (typeof(editorAction.e.refresh) == 'function') {
                state.actioned = true;
                editorAction.e.refresh.call(editorAction.s);
            }

            editorAction.e.style.cursor = '';
        }

        // Reset
        state = {
            x: null,
            y: null,
        }

        editorAction = false;
    }

    const mouseMove = function(e) {
        if (editorAction) {
            let x = e.clientX || e.pageX;
            let y = e.clientY || e.pageY;

            // Action on going
            if (! editorAction.resizing && editorAction.s.draggable === true) {
                if (state && state.x == null && state.y == null) {
                    state.x = x;
                    state.y = y;
                }

                let dx = x - state.x;
                let dy = y - state.y;
                let top = editorAction.e.offsetTop + dy;
                let left = editorAction.e.offsetLeft + dx;

                // Update position
                editorAction.top = top
                editorAction.left = left
                editorAction.e.style.top = top + 'px';
                editorAction.e.style.left = left + 'px';
                editorAction.e.style.cursor = "move";


                state.x = x;
                state.y = y;
                state.top = top
                state.left = left

                // Update element
                if (typeof(editorAction.e.refresh) == 'function') {
                    state.actioned = true;
                    editorAction.e.refresh.call(editorAction.s, 'position', top, left);
                }
            } else {
                let width = null;
                let height = null;
                let newHeight = null;

                if (editorAction.d === 'e-resize' || editorAction.d === 'ne-resize' || editorAction.d === 'se-resize') {
                    // Update width
                    width = editorAction.w + (x - editorAction.x);
                    editorAction.e.style.width = width + 'px';

                    // Update Height
                    if (e.shiftKey) {
                        newHeight = (x - editorAction.x) * (editorAction.h / editorAction.w);
                        height = editorAction.h + newHeight;
                        editorAction.e.style.height = height + 'px';
                    } else {
                        newHeight = false;
                    }
                }

                if (! newHeight) {
                    if (editorAction.d === 's-resize' || editorAction.d === 'se-resize' || editorAction.d === 'sw-resize') {
                        height = editorAction.h + (y - editorAction.y);
                        editorAction.e.style.height = height + 'px';
                    }
                }

                // Update element
                if (typeof(editorAction.e.refresh) == 'function') {
                    state.actioned = true;
                    editorAction.e.refresh.call(editorAction.s, 'dimensions', width, height);
                }
            }
        } else {
            let item = e.target.closest('.lm-modal');
            if (item !== null) {
                if (item.self && item.self.resizable === true) {
                    let rect = item.getBoundingClientRect();
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
                }
            }
        }
    }

    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('mousemove', mouseMove);

    const Modal = function (template) {
        let self = this;

        // Default values
        if (typeof(self.title) === 'undefined') {
            self.title = '';
        }
        if (typeof(self.closed) === 'undefined') {
            self.closed = false;
        }
        if (typeof(self.closable) === 'undefined') {
            self.closable = false;
        }

        // Dispatcher
        const Dispatch = (type, option) => {
            if (typeof self[type] === 'function') {
                self[type](self, option)
            }
        }

        self.mousedown = mouseDown;

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

            // Make sure the instance of the self is available via the DOM element
            self.el.self = self;

            // Close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && self.closed === false) {
                    self.closed = true;
                }
            });

            // Full screen
            if (self.height > 260) {
                self.el.classList.add('fullscreen');
            }
        }

        self.onchange = function(property) {
            if (property === 'closed') {
                self.closed ? Dispatch('onclose') : Dispatch('onopen');
            }
        }

        return `<div class="lm-modal" title="{{self.title}}" closed="{{self.closed}}" :closable="self.closable" style="width: {{self.width}}px; height: {{self.height}}px; top: {{self.top}}px; left: {{self.left}}px;" onmousedown="self.mousedown(e)" tabindex="-1">${template}</div>`
    }

    lemonade.setComponents({ Modal: Modal });

    return function (root, options) {
        if (typeof(root) === 'object') {
            lemonade.render(Modal, root, options)
            return options;
        } else {
            return Modal.call(this, root)
        }
    }
})));