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

    const Weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const views = {
        years: function(date) {
            let year = date.getFullYear();
            let result = [];
            // Get the weekdays
            for (let i = year-12; i <= year+12; i++) {
                result.push({
                    title: i,
                });
            }
            return result;
        },
        months: function() {
            let result = [];
            // Get the weekdays
            for (let i = 0; i < 12; i++) {
                result.push({
                    title: Months[i].substring(0,3),
                });
            }
            return result;
        },
        days: function(date) {
            let Y = date.getFullYear();
            let M = date.getMonth();
            let D = date.getDate();
            let tmp;

            let result = [];

            // Get the weekdays
            // for (let i = 0; i < 7; i++) {
            //     result.push({
            //         title: Weekdays[i].substring(0,1).toUpperCase(),
            //         bold: true,
            //     });
            // }

            // Number of days in the month
            tmp = new Date(Y, M, 0, 0, 0);
            let numOfDays = tmp.getDate();

            // First day
            tmp = new Date(Y, M, 0, 0, 0, 0);
            let firstDay = tmp.getDay() + 1;

            for (let i = 1-firstDay; i <= 42-firstDay; i++) {
                tmp = new Date(Y, M, i, 0, 0);
                let r = {
                    title: tmp.getDate(),
                }
                if (i <= 0 || i >= numOfDays) {
                    r.grey = true;
                }
                result.push(r);
            }

            return result;
        }
    }

    const Picker = function() {
        let self = this;

        window.xxx = self;

        // Internal date
        let date = new Date();

        const setIndex = function(newIndex) {
            // Reset the current selection
            self.data[self.index].selected = false;
            // Set the new selection
            if (typeof(self.data[newIndex]) === 'undefined') {
                if (self.view === 'days') {
                    if (newIndex < self.index) {
                        // Go to the previous month
                        newIndex = 42 + newIndex
                        self.render(date = new Date(date.getFullYear(),date.getMonth()-1,15));
                    } else {
                        // Go to the next month
                        self.render(date = new Date(date.getFullYear(),date.getMonth()+1,15));
                        newIndex = newIndex - 42
                    }
                } else if (self.view === 'years') {
                    let year;
                    if (newIndex < self.index) {
                        // Go to the previous month
                        year = -5;
                        newIndex = 5 + newIndex;
                    } else {
                        year = 5;
                        newIndex = newIndex - 5;
                    }
                    self.render(date = new Date(date.getFullYear()+year,date.getMonth(),1));
                } else if (self.view === 'months') {
                    if (newIndex < self.index) {
                        newIndex = 12 + newIndex;
                    } else {
                        newIndex = newIndex - 12;
                    }
                }
            }

            self.data[newIndex].selected = true;
            // Update index
            self.index = newIndex;

            // Update year on the header if the view is years view
            if (self.view === 'years') {
                self.year = self.data[newIndex].title;
            } else if (self.view === 'months') {
                self.month = self.data[newIndex].title;
            }
        }


        self.render = function(newDate, view) {
            // Update internal date
            date = newDate;
            // Update headers
            let value = date.toISOString().substring(0,10).split('-');
            self.month = Months[parseInt(value[1])-1];
            self.year = parseInt(value[0]);
            // Update view
            if (view) {
                self.view = view;
            } else {
                self.data = views[self.view](date);
            }
        }

        self.weekdays = Weekdays.map(weekname => {
            return { title: weekname.substring(0, 1) }
        })


        self.onchange = function(prop) {
            if (prop === 'view') {
                if (typeof(views[self.view]) === 'function') {
                    self.data = views[self.view](date);
                }
            }
        }

        self.onload = function() {
            self.render(new Date(self.parent.value), 'days');
        }

        const getJump = function() {
            // Default is view = days;
            let jump = 7;
            if (self.view === 'months') {
                jump = 3;
            } else if (self.view === 'years') {
                jump = 5;
            }
            return jump;
        }

        self.next = function(jump) {
            if (jump) {
                jump = getJump();
            } else {
                jump = 1;
            }
            setIndex(self.index+jump)
        }

        self.prev = function(jump) {
            if (jump) {
                jump = getJump();
            } else {
                jump = 1;
            }
            setIndex(self.index-jump)
        }

        const keydown = function(event) {

            switch (event.key) {
                case 'ArrowLeft':
                    self.prev(false);
                    break;
                case 'ArrowRight':
                    self.next(false);
                    break;
                case 'ArrowUp':
                    self.prev(true);
                    break;
                case 'ArrowDown':
                    self.next(true);
                    break;
            }
        }

        document.addEventListener('keyup', keydown)

        self.select = function(s) {
            // Update selected property
            s.selected = true;
            // Get the index of my self
            let index = self.data.indexOf(s);
            // Remove the selected from the current selection
            self.data[self.index].selected = false;
            // Update my index
            self.index = index;
        }

        self.done = function() {
            self.set(date.toISOString().substring(0,10));
        }

        self.reset = function() {
            self.set('');
        }

        self.index = 0;

        return `<div class="lm-calendar-container" data-view="{{self.view}}">
            <div class="lm-calendar-header">
                <div>
                    <div><span onclick="self.view = 'months'">{{self.month}}</span> <span onclick="self.view = 'years'">{{self.year}}</span></div> 
                    <div><i class="material-icons" onclick="self.prev(true)">arrow_drop_up</i> <i class="material-icons" onclick="self.next(true)">arrow_drop_down</i></div>
                </div>
                <div class="lm-calendar-weekdays" :loop="self.weekdays"><div>{{self.title}}</div></div>
            </div>
            <div class="lm-calendar-content" :loop="self.data"><div data-grey="{{self.grey}}" data-bold="{{self.bold}}" data-selected="{{self.selected}}" onclick="self.parent.select(self)">{{self.title}}</div></div>
        </div>`;
    }

    const Calendar = function() {
        let self = this;

        if (typeof(self.closed) === 'undefined') {
            self.closed = true;
        }

        self.onchange = function(prop) {
            if (prop === 'value') {
                if (typeof(self.onupdate) === 'function') {
                    self.onupdate.call(self, self.value);
                }
            }
        }

        self.get = function() {
            return self.value;
        }

        self.set = function(v) {
            self.value = v;
        }

        self.open = function() {
            self.closed = false;
        }

        self.close = function() {
            if (self.closed === false) {
                self.closed = true;
            }
        }

        self.blur = function(e) {
            if (! self.el.contains(e.relatedTarget) && self.closed === false) {
                self.closed = true;
            }
        }

        let template;
        if (self.type === 'inline') {
            template = `<div class="lm-calendar"><Picker :set="self.set" /></div>`
        } else {
            // if (self.input) {
            //     self.input.classList.add('lm-color-input');
            //     self.input.addEventListener('focus', self.open);
            //     self.input.addEventListener('click', self.open);
            //     self.input.addEventListener('blur', self.blur);
            // }

            template = `<div class="lm-calendar">
                <Modal closed="{{self.closed}}" :width="260" :height="240" :onopen="self.onopen" :onclose="self.onclose" :autoclose="true">
                    <div class="lm-calendar-options">
                        <button onclick="self.parent.value = ''; self.parent.close();">Reset</button>
                        <button onclick="self.parent.close();">Done</button>
                    </div>
                    <Picker :set="self.parent.set" />
                </Modal>
            </div>`
        }

        return lemonade.element(template, self, { Picker })
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