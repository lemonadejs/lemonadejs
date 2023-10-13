if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('../../../dist/lemonade');
}

if (!Modal && typeof (require) === 'function') {
    var Modal = require('../../modal/dist/index');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Calendar = factory();
}(this, (function () {

    // Weekdays
    const Weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Months
    const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    /**
     * Create a data calendar object based on the view
     */
    const views = {
        years: function(date) {
            let year = date.getFullYear();
            let result = [];

            let start = year % 16;
            let complement = 16 - start;

            for (let i = year-start; i < year+complement; i++) {
                let item = {
                    title: i,
                    value: i
                };
                result.push(item);
                // Select cursor
                if (this.cursor.y === i) {
                    // Select item
                    item.selected = true;
                    // Cursor
                    this.cursor.index = result.length - 1;
                }
            }
            return result;
        },
        months: function(date) {
            let year = date.getFullYear();
            let result = [];
            for (let i = 0; i < 12; i++) {
                let item = {
                    title: Months[i].substring(0,3),
                    value: i
                }
                // Add the item to the data
                result.push(item);
                // Select cursor
                if (this.cursor.y === year && this.cursor.m === i) {
                    // Select item
                    item.selected = true;
                    // Cursor
                    this.cursor.index = result.length - 1;
                }
            }

            return result;
        },
        days: function(date) {
            let year = date.getFullYear();
            let month = date.getMonth();

            // First day
            let tmp = new Date(year, month, 1, 0, 0, 0);
            let firstDay = tmp.getDay();

            let result = [];
            for (let i = 1-firstDay; i <= 42-firstDay; i++) {
                // Get the day
                tmp = new Date(year, month, i, 0, 0, 0);
                // Day
                let day = tmp.getDate();
                // Create the item
                let item = {
                    title: day,
                    value: i
                }
                // Add the item to the date
                result.push(item);
                // Check selections
                if (tmp.getMonth() !== month) {
                    // Days are not in the current month
                    item.grey = true;
                } else {
                    // Select cursor
                    if (this.cursor.y === year && this.cursor.m === month && this.cursor.d === day) {
                        // Select item
                        item.selected = true;
                        // Cursor
                        this.cursor.index = result.length - 1;
                    }
                }
            }

            return result;
        }
    }

    // Get the short weekdays name
    const getWeekdays = function() {
        return Weekdays.map(w => {
            return { title: w.substring(0, 1) };
        })
    }

    // Define the hump based on the view
    const getJump = function(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            return this.view === 'days' ? 7 : 4;
        }

        return 1;
    }

    // Get the position of the data based on the view
    const getPosition = function() {
        let position = 2;
        if (this.view === 'years') {
            position = 0;
        } else if (this.view === 'months') {
            position = 1;
        }
        return position;
    }

    // Transform in two digits
    const Two = function(value) {
        value = '' + value;
        if (value.length == 1) {
            value = '0' + value;
        }
        return value;
    }

    const Calendar = function() {
        let self = this;

        // Weekdays
        self.weekdays = getWeekdays();

        // Cursor
        self.cursor = {};

        // Calendar date
        let date = new Date();

        /**
         * Update the internal date
         * @param {Date|string|number[]} d instance of Date
         *
         */
        const setDate = function(d) {
            if (Array.isArray(d)) {
                d = new Date(Date.UTC(...d));
            } else if (typeof(d) === 'string') {
                d = new Date(d);
            }
            // Update internal date
            date = d;
            // Update the headers of the calendar
            let value = d.toISOString().substring(0,10).split('-');
            // Update the month label
            self.month = Months[parseInt(value[1])-1];
            // Update the year label
            self.year = parseInt(value[0]);
            // Load data
            if (! self.view) {
                // Start on the days view will start the data
                self.view = 'days';
            } else {
                // Reload the data for the same view
                self.data = views[self.view].call(self, date);
            }
        }

        /**
         * Set the internal cursor
         * @param {object} s
         */
        const setCursor = function(s) {
            // Remove selection from the current object
            if (typeof(self.data[self.cursor.index]) !== 'undefined') {
                self.data[self.cursor.index].selected = false;
            }
            // Update the date based on the click
            let v = updateDate(s.value, getPosition.call(self));
            let d = new Date(Date.UTC(...v));
            // Update cursor controller
            self.cursor = {
                y: d.getFullYear(),
                m: d.getMonth(),
                d: d.getDate(),
            };
            // Update cursor based on the object position
            if (s) {
                // Update selected property
                s.selected = true;
                // New cursor
                self.cursor.index = self.data.indexOf(s);
            }
            return d;
        }

        /**
         * Update the current date
         * @param {number} v new value for year, month or day
         * @param {number} position (0,1,2 - year,month,day)
         * @returns {number[]}
         */
        const updateDate = function(v, position) {
            // Current internal date
            let value = [date.getFullYear(), date.getMonth(), date.getDate(),0,0,0];
            // Update internal date
            value[position] = v;
            // Return new value
            return value;
        }

        /**
         * This method move the data from the view up or down
         * @param direction
         */
        self.move = function(direction) {
            let value;

            // Update the new internal date
            if (self.view === 'days') {
                // Select the new internal date
                value = updateDate(date.getMonth()+direction, 1);
            } else if (self.view === 'months') {
                // Select the new internal date
                value = updateDate(date.getFullYear()+direction, 0);
            } else if (self.view === 'years') {
                // Select the new internal date
                value = updateDate(date.getFullYear()+(direction*16), 0);
            }

            // Update view
            if (value) {
                setDate(value);
            }
        }

        /**
         * Keyboard handler
         * @param {number} direction of the action
         * @param {object} e keyboard event
         */
        self.moveCursor = function(direction, e) {
            direction = direction * getJump.call(self, e);
            // Remove the selected from the current selection
            let s = self.data[self.cursor.index];
            // If the selection is going outside the viewport
            if (typeof(s) === 'undefined' || ! s.selected) {
                // Go back to the view
                setDate([ self.cursor.y, self.cursor.m, self.cursor.d ]);
            }

            // Jump to the index
            let index = self.cursor.index + direction;

            // See if the new position is in the viewport
            if (typeof(self.data[index]) === 'undefined') {
                // Adjust the index for next collection of data
                if (self.view === 'days') {
                    if (index < 0) {
                        index = 42 + index;
                    } else {
                        index = index - 42;
                    }
                } else if (self.view === 'years') {
                    if (index < 0) {
                        index = 4 + index;
                    } else {
                        index = index - 4;
                    }
                } else if (self.view === 'months') {
                    if (index < 0) {
                        index = 12 + index;
                    } else {
                        index = index - 12;
                    }
                }

                // Move the data up or down
                self.move(direction > 0 ? 1 : -1);
            }

            // Update the date based on the click
            setCursor(self.data[index]);
        }

        /**
         * Select an item with the enter or mouse
         * @param {object} item - selected cell
         */
        self.select = function(item) {
            // Update cursor generic
            let value = setCursor(item);
            // Based where was the click
            if (! (self.view === 'days' && ! item.grey)) {
                // Update the internal date
                setDate(value);
            }
            // Go back to the view of days
            if (self.view !== 'days') {
                self.view = 'days';
            }
        }

        /**
         * Next handler
         * @param {object} e mouse event
         */
        self.next = function(e) {
            if (! e) {
                // Icon click
                self.move(1)
            } else {
                // Keyboard handler
                self.moveCursor(1, e);
            }
        }

        /**
         * Next handler
         * @param {object} e mouse event
         */
        self.prev = function(e) {
            if (! e) {
                // Icon click
                self.move(-1);
            } else {
                // Keyboard handler
                self.moveCursor(-1, e);
            }
        }

        /**
         * Open the modal
         */
        self.open = function() {
            if (self.modal) {
                self.modal.closed = false;
            }
        }

        /**
         * Close the modal
         */
        self.close = function() {
            if (self.modal && self.modal.closed === false) {
                self.modal.closed = true;
            }
        }

        /**
         * Get value from cursor
         * @returns {string}
         */
        self.getValue = function() {
            let v = [ self.cursor.y, self.cursor.m, self.cursor.d ];
            let d = new Date(Date.UTC(...v));
            // Update the headers of the calendar
            return d.toISOString().substring(0,10);
        }

        self.onchange = function(prop) {
            if (prop === 'view') {
                if (typeof(views[self.view]) === 'function') {
                    // When change the view update the data
                    self.data = views[self.view].call(self, date);
                }
            } else if (prop === 'value') {
                if (typeof(self.onupdate) === 'function') {
                    self.onupdate.call(self, self.value);
                }
            }
        }

        self.onload = function() {
            let d = new Date(self.value);
            // Update my index
            self.cursor = {
                y: d.getFullYear(),
                m: d.getMonth(),
                d: d.getDate(),
            };
            // Update the internal calendar date
            setDate(d);

            if (self.type !== "inline") {
                // Create modal instance
                self.modal = {
                    width: 300,
                    closed: true,
                    autoclose: true,
                };
                // Generate modal
                Modal(self.el, self.modal);
            }

            // Create input controls
            if (self.input) {
                self.input.classList.add('lm-calendar-input');
                self.input.addEventListener('focus', self.open);
                self.input.addEventListener('click', self.open);
                self.input.addEventListener('blur', self.blur);
            }
        }

        /**
         * Handler blur
         * @param e
         */
        self.blur = function(e) {
            if (self.modal) {
                if (!(e.relatedTarget && self.modal.el.contains(e.relatedTarget))) {
                    if (self.modal.closed === false) {
                        self.modal.closed = true
                    }
                }
            }
        }

        /**
         * Handler keyboard
         * @param e
         */
        const keydown = function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                self.prev(e);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                self.next(e);
            } else if (e.key === 'Enter') {
                self.value = self.getValue();
                self.close();
            }
        }

        document.addEventListener('keydown', keydown);

        return `<div class="lm-calendar">
                <div class="lm-calendar-options">
                <button onclick="self.value = ''; self.close();">Reset</button>
                <button onclick="self.value = self.getValue(); self.close();">Done</button>
            </div>
            <div class="lm-calendar-container" data-view="{{self.view}}">
                <div class="lm-calendar-header">
                    <div>
                        <div class="lm-calendar-labels"><div onclick="self.view = 'months'">{{self.month}}</div> <div onclick="self.view = 'years'">{{self.year}}</div></div> 
                        <div class="lm-calendar-navigation"><i class="material-icons" onclick="self.prev()">arrow_drop_up</i> <i class="material-icons" onclick="self.next()">arrow_drop_down</i></div>
                    </div>
                    <div class="lm-calendar-weekdays" :loop="self.weekdays"><div>{{self.title}}</div></div>
                </div>
                <div class="lm-calendar-content" :loop="self.data"><div data-grey="{{self.grey}}" data-bold="{{self.bold}}" data-selected="{{self.selected}}" onclick="self.parent.select(self)">{{self.title}}</div></div>
            </div>
        </div>`
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