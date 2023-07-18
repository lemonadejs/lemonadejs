(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lemonadejs"));
	else if(typeof define === 'function' && define.amd)
		define(["lemonadejs"], factory);
	else if(typeof exports === 'object')
		exports["Calendar"] = factory(require("lemonadejs"));
	else
		root["Calendar"] = factory(root["lemonade"]);
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

/***/ 766:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

if (!lemonade && "function" === 'function') {
    var lemonade = __webpack_require__(461);
}

if (!Modal && "function" === 'function') {
    var Modal = __webpack_require__(72);
}

; (function (global, factory) {
     true ? module.exports = factory() :
        0;
}(this, (function () {

    const controller = {}

    const makeMatrix = function (month, year) {
        let quantityOfDays = month === 1 ? getDaysInFebruary(year) : daysInMonth[month]

        // First day position on the first week array
        let firstDay = getFirstDayOfMonth(month, year)

        // Last day considering the first day
        let lastDay = firstDay + quantityOfDays

        // Quantity of week arrays
        let weeks = Math.ceil(((quantityOfDays + firstDay) / 7) - 0.01)

        let m = new Array(weeks).fill(new Array(7)).map(dow => Array.from(dow));

        for (let i = 0; i < 7; i++) {
            if (i < firstDay) {
                m[0][i] = null
            }
        }

        // Quantity of days of the last week array
        let d = lastDay % 7

        if (d !== 0) {
            for (let i = 0; i < 7; i++) {
                if (i > d - 1) {
                    m[weeks - 1][i] = null
                }
            }
        }

        let counter = 1;

        for (let i = 0; i < weeks; i++) {
            for (let j = 0; j < 7; j++) {
                if (m[i][j] !== null) {
                    m[i][j] = counter++;
                }
            }
        }

        return m
    };

    const getDaysInFebruary = function (year) {
        // Check if the year is divisible by 4
        if (year % 4 !== 0) {
          return 28; // Not a leap year, February has 28 days
        }
      
        // Check if the year is divisible by 100
        if (year % 100 === 0) {
          // If divisible by 100, also check if it's divisible by 400
          if (year % 400 === 0) {
            return 29; // Leap year, February has 29 days
          } else {
            return 28; // Not a leap year, February has 28 days
          }
        }
      
        return 29; // Leap year (divisible by 4 but not by 100), February has 29 days
    }
    
    const getFirstDayOfMonth = function (month, year) {
        return new Date(year, month, 1).getDay()
    }

    const daysInMonth = {
        0: 31,
        1: 28,
        2: 31,
        3: 30,
        4: 31,
        5: 30,
        6: 31,
        7: 31,
        8: 30,
        9: 31,
        10: 30,
        11: 31
    };


    function Calendar() {
        let self = this;

        self.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (!self.value) {
            self.value = new Date()
        }

        self.currentMonth = self.value.getMonth();
        self.currentYear = self.value.getFullYear();

        self.onload = function () {
            self.makeTable()
        }

        self.onchange = function (prop) {
            if (prop === "currentMonth" || prop === "currentYear") {
                self.makeTable()
            } else if (prop === "value") {
                if (typeof (self.onupdate) === 'function') {
                    self.onupdate(self.value)
                }
            }
        }

        self.select = function (td) {
            const v = td.getAttribute('value')
            if (v == '') {
                return
            }

            if (controller.selected) {
                controller.selected.classList.remove('selected')
            }
            td.classList.add('selected')
            self.value = new Date(self.currentYear, self.currentMonth, v)

            controller.selected = td
        }

        self.makeTable = function () {
            // Get the matrix to build the HTML table based on
            const m = makeMatrix(self.currentMonth, self.currentYear)

            let html = ''

            for (let i = 0; i < m.length; i++) {
                html += '<tr>'
                for (let j = 0; j < m[i].length; j++) {
                    html += `<td value="${m[i][j] || ''}" onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(this)">${m[i][j] || ''}</td>`
                }
                html += '</tr>'
            }

            self.component.tbody.innerHTML = html
        }

        self.addMonth = function () {
            if (self.currentMonth === 11) {
                self.currentMonth = 0
                self.currentYear += 1
            } else {
                self.currentMonth += 1
            }
        }

        self.subMonth = function () {
            if (self.currentMonth === 0) {
                self.currentMonth = 11
                self.currentYear -= 1
            } else {
                self.currentMonth -= 1
            }
        }

        let template = `<div class="lm-calendar" date="{{self.value}}">
            <Modal closed="{{self.closed}}" width="400" height="260" :onopen="self.onopen" :onclose="self.onclose" :ref="self.component">
                <div class="lm-calendar-controllers">
                    <div><button onclick="self.parent.currentYear -= 1"><</button><div>{{self.parent.currentYear}}</div><button onclick="self.parent.currentYear += 1">></button></div>
                    <div><button onclick="self.parent.subMonth()"><</button><div>{{self.parent.months[self.parent.currentMonth]}}</div><button onclick="self.parent.addMonth()">></button></div>
                </div>
                <div class="lm-calendar-table-wrapper">
                    <table>
                        <thead><tr><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr></head>
                        <tbody :ref="self.tbody"></tbody>
                    </table>
                </div>
            </Modal>
        </div>`

        return lemonade.element(template, self)
    }

    lemonade.setComponents({ Calendar: Calendar });

    return function (root, options) {
        if (typeof (root) === 'object') {
            lemonade.render(Calendar, root, options)
            return options;
        } else {
            return Calendar.call(this, root)
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
/* harmony import */ var _calendar_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(766);
/* harmony import */ var _calendar_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_calendar_js__WEBPACK_IMPORTED_MODULE_0__);




window.Calendar = (_calendar_js__WEBPACK_IMPORTED_MODULE_0___default());

/* harmony default export */ __webpack_exports__["default"] = ((_calendar_js__WEBPACK_IMPORTED_MODULE_0___default()));
}();
__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});