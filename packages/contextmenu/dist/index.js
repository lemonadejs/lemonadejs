if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

if (!Modal && typeof (require) === 'function') {
    var Modal = require('@lemonadejs/modal');
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

        self.onload = function() {
            if (self.item && typeof (self.onclick) === 'function') {
                self.item.addEventListener("click", (e) => {
                    self.onclick()
                    self.parent.parent.parent.close(0)
                });
            }
        }

        if (self.type === 'line') {
            return `<hr />`;
        } else {
            return `<div data-icon="{{self.icon}}" data-submenu="{{!!self.submenu}}" onmouseover="self.parent.parent.open(e, self)" :ref="self.item">
                <a>{{self.title}}</a> <span>{{self.shortcut}}</span>
            </div>`;
        }
    }

    const Create = function() {
        let self = this;

        self.open = function(e, s) {
            if (s.submenu) {
                // Get the modal in the container of modals
                let item = self.parent.modals[self.index+1];
                if (! item) {
                    // Modal need to be created
                    item = self.parent.create();
                }
                // Get the parent from this one
                let parent = self.parent.modals[self.index].modal;
                // Get the self of the modal
                let modal = item.modal;

                if (modal.options !== s.submenu) {
                    // Close modals with higher level
                    modal.options = s.submenu;
                    // Close other modals
                    self.parent.close(self.index+1);
                }

                // Open modal
                modal.closed = false;
                // Define the position
                modal.top = parent.top + e.target.offsetTop + 2;
                modal.left = parent.left + 248;
            } else {
                // Close modals with higher level
                self.parent.close(self.index+1);
            }
        }

        let template = `<Modal :closed="true" :ref="self.modal">
            <div class="lm-menu-submenu">
                <Item :loop="self.options" />
            </div>
        </Modal>`;

        return lemonade.element(template, self, { Item: Item });
    }

    const Contextmenu = function() {
        let self = this;

         // Level
        let index = 0;

        // Container for all modals
        self.modals = [];

        self.create = function() {
            // Create a new self for each modal
            let s = {
                index: index++,
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
            if (e.type == 'click') {
                modal.closed = ! modal.closed;
            } else if (e.type == 'contextmenu') {
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
                    value.modal.closed = true;
                }
            })
        }

        self.onload = function() {
            if (! self.root) {
                self.root = self.el.parentNode;
            }
            // Create event for focus out
            self.root.addEventListener("focusout", (e) => {
                if (!e.relatedTarget) {
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