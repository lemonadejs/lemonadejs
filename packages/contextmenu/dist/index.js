if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

if (! Modal && typeof (require) === 'function') {
    var Modal = require('@lemonadejs/modal"');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Contextmenu = factory();
}(this, (function () {

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

    const Item = function() {
        let self = this;
        if (this.type === 'line') {
            return `<hr />`;
        } else if (this.type === 'inline') {
            return '<div>' + this.component() + '</div>';
        } else {
            return `<div class="lm-menu-item" data-cursor="{{self.cursor}}" data-icon="{{self.icon}}" data-submenu="{{!!self.submenu}}" onmouseover="self.parent.parent.open(self)">
                <a>{{self.title}}</a> <div>{{self.shortcut}}</div>
            </div>`;
        }
    }

    const Create = function() {
        let self = this;

        // Save the position of this modal
        let index = self.parent.modals.length;

        // Close handler
        self.onclose = function() {
            // if (typeof(value.modal.cursor) !== 'undefined') {
            //     value.modal.options[value.modal.cursor].cursor = false;
            //     delete value.modal.cursor;
            // }

            console.log(self.cursor,self.options);
        }

        // Open handler
        self.open = function(s) {
            if (s.submenu) {
                // Get the modal in the container of modals
                let item = self.parent.modals[index+1];
                if (! item) {
                    // Modal need to be created
                    item = self.parent.create();
                }
                // Get the parent from this one
                let parent = self.parent.modals[index].modal;
                // Get the self of the modal
                let modal = item.modal;

                if (modal.options !== s.submenu) {
                    // Close modals with higher level
                    modal.options = s.submenu;
                    // Remove cursor
                    if (modal.cursor) {
                        delete modal.cursor;
                    }
                    // Close other modals
                    self.parent.close(index+1);
                }

                // Open modal
                modal.closed = false;
                // Update selected modal
                self.parent.modalIndex = index+1;
                // Define the position
                modal.top = parent.top + s.el.offsetTop + 2;
                modal.left = parent.left + 248;
            } else {
                // Close modals with higher level
                self.parent.close(index+1);
            }
        }

        let template = `<Modal :closed="true" :ref="self.modal" :responsive="false" :autoadjust="true" :onclose="self.onclose">
            <div class="lm-menu-submenu">
                <Item :loop="self.options" />
            </div>
        </Modal>`;

        return lemonade.element(template, self, { Item: Item });
    }

    const setCursor = function(direction) {
        let cursor = null;

        if (typeof(this.cursor) !== 'undefined') {
            if (! direction) {
                // Up
                cursor = this.cursor - 1;
                if (cursor < 0) {
                    cursor = this.options.length - 1;
                }
            } else {
                // Down
                cursor = this.cursor + 1;
                if (cursor >= this.options.length) {
                    cursor = 0;
                }
            }
        }

        // Remove the cursor
        if (cursor === null) {
            if (direction) {
                cursor = 0;
            } else {
                cursor = this.options.length - 1;
            }
        } else {
            this.options[this.cursor].cursor = false;
        }
        // Add the cursor
        this.options[cursor].cursor = true;
        // Cursor
        this.cursor = cursor;
    }

    const openSubmenu = function() {
        if (typeof(this.options[this.cursor]) !== 'undefined') {
            // Get the selected cursor
            let item = this.options[this.cursor];
            // Open submenu in case that exists
            if (item.submenu) {
                this.parent.open(item);
            }
        }
    }

    const closeSubmenu = function() {
        this.parent.parent.close(this.parent.parent.modalIndex);
    }

    const Contextmenu = function() {
        let self = this;

        // Container for all modals
        self.modals = [];
        self.modalIndex = 0;

        self.create = function() {
            // Create a new self for each modal
            let s = {
                parent: self,
            };
            // Render the modal inside the main container
            lemonade.render(Create, self.el, s);
            // Add the reference of the modal in a container
            self.modals.push(s);
            // Return self
            return s;
        }

        self.open = function(e, options, x, y) {
            // Get the main modal
            let modal = self.modals[0].modal;
            // Click on the top level menu toggle the state of the menu
            if (e.type === 'click') {
                modal.closed = ! modal.closed;
            } else if (e.type === 'contextmenu') {
                modal.closed = false;
            }
            
            // If the modal is open and the content is different from what is shown
            if (modal.closed === false) {
                // Close modals with higher level
                self.close(1);
                // Define new position
                modal.top = y;
                modal.left = x;
                if (modal.options !== options) {
                    // Refresh content
                    modal.options = options;
                }
            }
        }
        
        self.close = function(level) {
            self.modals.forEach(function(value, k) {
                if (k >= level) {
                    // Close the modal
                    value.modal.closed = true;
                }
            });

            self.modalIndex = level ? level-1 : 0;
        }

        self.onload = function() {
            if (! self.root) {
                self.root = self.el.parentNode;
            }
            // Keyboard event
            self.root.addEventListener("keydown", function(e) {
                // Modal object
                let m = self.modals[self.modalIndex].modal;
                if (e.key === 'ArrowLeft') {
                    closeSubmenu.call(m);
                } else if (e.key === 'ArrowRight') {
                    openSubmenu.call(m);
                } else if (e.key === 'ArrowUp') {
                    setCursor.call(m, 0);
                } else if (e.key === 'ArrowDown') {
                    setCursor.call(m, 1);
                }
            });

            // Create event for focus out
            self.root.addEventListener("focusout", (e) => {
                if (! self.el.contains(e.relatedTarget)) {
                    self.close(0);
                }
            });
            // Parent
            self.root.addEventListener("contextmenu", function(e) {
                let [x,y] = getCoords(e);
                // Open the context menu
                self.open(e, self.options, x, y);
                e.preventDefault();
                e.stopImmediatePropagation();
            });
            self.root.setAttribute('tabindex', -1);
            // Create first menu
            self.create();
        }

        return `<div class="lm-menu"></div>`;
    }

    lemonade.setComponents({ Contextmenu: Contextmenu });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Contextmenu, root, options)
            return options;
        } else {
            return Contextmenu.call(this, root)
        }
    }
})));