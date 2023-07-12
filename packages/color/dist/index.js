(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lemonadejs"));
	else if(typeof define === 'function' && define.amd)
		define(["lemonadejs"], factory);
	else if(typeof exports === 'object')
		exports["Color"] = factory(require("lemonadejs"));
	else
		root["Color"] = factory(root["lemonade"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE__461__) {
return /******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 72:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

if (! lemonade && "function" === 'function') {
    var lemonade = __webpack_require__(461);
}

;(function (global, factory) {
     true ? module.exports = factory() :
    0;
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
            let template = root.innerHTML;
            root.innerHTML = '';

            lemonade.render(Modal, root, options, template)
            return options;
        } else {
            return Modal.call(this, root)
        }
    }
})));

/***/ }),

/***/ 560:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

if (!lemonade && "function" === 'function') {
    var lemonade = __webpack_require__(461);
}

; (function (global, factory) {
     true ? module.exports = factory() :
    0;
}(this, (function () {

    const Tabs = function (html) {
        let self = this

        let content = html;

        if (self.data) {
            for (let i = 0; i < self.data.length; i++) {
                content += `<div title="${self.data[i].title}">${self.data[i].content}</div>`;
            }
        }

        self.tabs = [];

        self.onload = function () {
            for (let i = 0; i < self.content.children.length; i++) {
                self.tabs.push({ title: self.content.children[i].title });
            }
            self.refresh('tabs');

            if (! isNaN(parseInt(self.selected))) {
                select(self.selected);
            }
        }

        const select = function (index) {
            index = parseInt(index);

            for (let i = 0; i < self.content.children.length; i++) {
                self.headers.children[i].classList.remove('selected');
                self.content.children[i].classList.remove('selected');
            }
            self.headers.children[index].classList.add('selected');
            self.content.children[index].classList.add('selected');
        }

        self.onchange = function (property) {
            if (property === 'selected') {
                select(self.selected);
            }
        }

        self.click = function (ev, el) {
            if (ev.target.tagName === 'LI') {
                self.selected = Array.prototype.indexOf.call(el.children, ev.target);
            }
        }

        return `<div class="lm-tabs" position="{{self.position||''}}">
            <ul :ref="self.headers" :loop="self.tabs" onclick="self.click(e, this)" :selected="self.selected"><li class="lm-tab-list-item">{{self.title}}</li></ul>
            <div :ref="self.content" class="lm-tabs-content">${content}</div>
        </div>`
    }

    lemonade.setComponents({ Tabs: Tabs });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Tabs, root, options)
            return options;
        } else {
            return Tabs.call(this, root)
        }
    }
})));

/***/ }),

/***/ 857:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

if (!lemonade && "function" === 'function') {
    var lemonade = __webpack_require__(461);
}

if (!Modal && "function" === 'function') {
    var Modal = __webpack_require__(72);
}

if (!Tabs && "function" === 'function') {
    var Tabs = __webpack_require__(560);
}

; (function (global, factory) {
     true ? module.exports = factory() :
    0;
}(this, (function () {

    const defaultPalette =  [
        ["#ffebee", "#fce4ec", "#f3e5f5", "#e8eaf6", "#e3f2fd", "#e0f7fa", "#e0f2f1", "#e8f5e9", "#f1f8e9", "#f9fbe7", "#fffde7", "#fff8e1", "#fff3e0", "#fbe9e7", "#efebe9", "#fafafa", "#eceff1"],
        ["#ffcdd2", "#f8bbd0", "#e1bee7", "#c5cae9", "#bbdefb", "#b2ebf2", "#b2dfdb", "#c8e6c9", "#dcedc8", "#f0f4c3", "#fff9c4", "#ffecb3", "#ffe0b2", "#ffccbc", "#d7ccc8", "#f5f5f5", "#cfd8dc"],
        ["#ef9a9a", "#f48fb1", "#ce93d8", "#9fa8da", "#90caf9", "#80deea", "#80cbc4", "#a5d6a7", "#c5e1a5", "#e6ee9c", "#fff59d", "#ffe082", "#ffcc80", "#ffab91", "#bcaaa4", "#eeeeee", "#b0bec5"],
        ["#e57373", "#f06292", "#ba68c8", "#7986cb", "#64b5f6", "#4dd0e1", "#4db6ac", "#81c784", "#aed581", "#dce775", "#fff176", "#ffd54f", "#ffb74d", "#ff8a65", "#a1887f", "#e0e0e0", "#90a4ae"],
        ["#ef5350", "#ec407a", "#ab47bc", "#5c6bc0", "#42a5f5", "#26c6da", "#26a69a", "#66bb6a", "#9ccc65", "#d4e157", "#ffee58", "#ffca28", "#ffa726", "#ff7043", "#8d6e63", "#bdbdbd", "#78909c"],
        ["#f44336", "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e", "#607d8b"],
        ["#e53935", "#d81b60", "#8e24aa", "#3949ab", "#1e88e5", "#00acc1", "#00897b", "#43a047", "#7cb342", "#c0ca33", "#fdd835", "#ffb300", "#fb8c00", "#f4511e", "#6d4c41", "#757575", "#546e7a"],
        ["#d32f2f", "#c2185b", "#7b1fa2", "#303f9f", "#1976d2", "#0097a7", "#00796b", "#388e3c", "#689f38", "#afb42b", "#fbc02d", "#ffa000", "#f57c00", "#e64a19", "#5d4037", "#616161", "#455a64"],
        ["#c62828", "#ad1457", "#6a1b9a", "#283593", "#1565c0", "#00838f", "#00695c", "#2e7d32", "#558b2f", "#9e9d24", "#f9a825", "#ff8f00", "#ef6c00", "#d84315", "#4e342e", "#424242", "#37474f"],
        ["#b71c1c", "#880e4f", "#4a148c", "#1a237e", "#0d47a1", "#006064", "#004d40", "#1b5e20", "#33691e", "#827717", "#f57f17", "#ff6f00", "#e65100", "#bf360c", "#3e2723", "#212121", "#263238"],
    ]

    function Grid() {
        const self = this;

        if (! self.palette) {
            self.palette = defaultPalette;
        }

        self.onchange = function (property) {
            if (property === 'palette') {
                self.constructRows()
            }
        }

        self.select = function (event) {
            if (event.target.tagName === 'TD') {
                let color = event.target.getAttribute('data-value')

                // Remove current selected mark
                let selected = document.querySelector('.lm-color-selected');
                if (selected) {
                    selected.classList.remove('lm-color-selected');
                }
                
                // Mark cell as selected
                if (color) {
                    event.target.classList.add('lm-color-selected');
                    self.parent.parent.parent.value = color;
                }
            }
        }

        self.constructRows = function () {
            let tbody = ''
            for (let j = 0; j < self.palette.length; j++) {
                tbody += '<tr>'
                for (let i = 0; i < self.palette[j].length; i++) {
                    let color = self.palette[j][i]
                    tbody += `<td data-value="${color}" style="background-color: ${color}" />`
                }
                tbody += '</tr>'
            }
            self.tableRef.innerHTML = tbody;
        }
        
        return `<div class="lm-color-grid" :palette="self.palette">
            <table cellpadding="7" cellspacing="0" onclick="self.select(e)" :ref="self.tableRef" :ready="self.constructRows()"></table>
            </div>`
    }

    function Spectrum() {
        const self = this;
        let context = null;

        let decToHex = function(num) {
            let hex = num.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }
        let rgbToHex = function(r, g, b) {
            return "#" + decToHex(r) + decToHex(g) + decToHex(b);
        }
        let draw = function() {
            let g = context.createLinearGradient(0, 0, self.canvas.width, 0);
            // Create color gradient
            g.addColorStop(0,    "rgb(255,0,0)");
            g.addColorStop(0.15, "rgb(255,0,255)");
            g.addColorStop(0.33, "rgb(0,0,255)");
            g.addColorStop(0.49, "rgb(0,255,255)");
            g.addColorStop(0.67, "rgb(0,255,0)");
            g.addColorStop(0.84, "rgb(255,255,0)");
            g.addColorStop(1,    "rgb(255,0,0)");
            context.fillStyle = g;
            context.fillRect(0, 0, self.canvas.width, self.canvas.height);
            g = context.createLinearGradient(0, 0, 0, self.canvas.height);
            g.addColorStop(0,   "rgba(255,255,255,1)");
            g.addColorStop(0.5, "rgba(255,255,255,0)");
            g.addColorStop(0.5, "rgba(0,0,0,0)");
            g.addColorStop(1,   "rgba(0,0,0,1)");
            context.fillStyle = g;
            context.fillRect(0, 0, self.canvas.width, self.canvas.height);
        }
     
        self.onload = function() {
            context = self.canvas.getContext("2d", { willReadFrequently: true });
            draw();
        }

        // Moves the marquee point to the specified position
        self.update = function(e) {
            let x;
            let y;
            let buttons = 1;
            if (e.type === 'touchmove') {
                x = e.changedTouches[0].clientX;
                y = e.changedTouches[0].clientY;
            } else {
                buttons = e.buttons;
                x = e.clientX;
                y = e.clientY;
            }
            
            if (buttons === 1) {
                let rect = self.el.getBoundingClientRect();
                let left = x - rect.left;
                let top = y - rect.top;
                // Get the color in this pixel
                let pixel = context.getImageData(left, top, 1, 1).data;
                // Position pointer
                self.point.style.left = left + 'px'
                self.point.style.top = top + 'px'

                // Return color
                self.parent.parent.parent.value = rgbToHex(pixel[0], pixel[1], pixel[2]);
            }
        }

        return `<div class="lm-color-hsl">
            <canvas :ref="self.canvas" onmousedown="self.update(e)" onmousemove="self.update(e)" ontouchmove="self.update(e)"></canvas>
            <div class="lm-color-point" :ref="self.point"></div>
        </div>`;
    }

    function Color() {
        let self = this;

        self.onchange = function(prop) {
            if (prop === 'value') {
                if (typeof(self.onupdate) === 'function') {
                    self.onupdate(self.value);
                }
            }
        }

        self.state = function(state) {
            if (self.closed !== state || self.closed !== self.component.closed) {
                self.closed = state;
            }
        }

        if (typeof(self.name) === 'undefined') {
            self.name = '';
        }
        if (typeof(self.closed) === 'undefined') {
            self.closed = true;
        }

        let type = '';
        if (self.type === 'input') {
            type = `<input type="text" name="${self.name}" onfocus="self.state(false)" onclick="self.state(false)" onblur="self.state(true)" :bind="self.value" class="lm-color-input" style="background-color: {{self.value}}"/>`;
        } else if (self.type === 'box') {
            type = `<div name="${self.name}"></div>`;
        }

        let template = `<div class="lm-color-picker" :value="self.value">${type}
            <Modal closed="{{self.closed}}" width="260" height="260" :onopen="self.onopen" :onclose="self.onclose" :ref="self.component">
                <div class="lm-color-picker-options">
                    <button onclick="self.parent.value = ''; self.parent.state(true);">Reset</button>
                    <button onclick="self.parent.state(true);">Done</button>
                </div>
                <Tabs selected="0" position="center">
                    <div title="Grid"><Grid :palette="self.parent.parent.palette" /></div>
                    <div title="Spectrum"><Spectrum /></div>
                </Tabs>
            </Modal>
        </div>`

        return lemonade.element(template, self, { Spectrum, Grid })
    }

    lemonade.setComponents({ Color: Color });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Color, root, options)
            return options;
        } else {
            return Color.call(this, root)
        }
    }
})));

/***/ }),

/***/ 461:
/***/ (function(module) {

"use strict";
module.exports = __WEBPACK_EXTERNAL_MODULE__461__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";
/* harmony import */ var _color_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(857);
/* harmony import */ var _color_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_color_js__WEBPACK_IMPORTED_MODULE_0__);





window.Color = (_color_js__WEBPACK_IMPORTED_MODULE_0___default());

/* harmony default export */ __webpack_exports__["default"] = ((_color_js__WEBPACK_IMPORTED_MODULE_0___default()));
}();
__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});