if (!lemonade && typeof (require) === 'function') {
    var lemonade = require('lemonadejs');
}

if (!Modal && typeof (require) === 'function') {
    var Modal = require('@lemonadejs/modal');
}

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            global.Calendar = factory();
}(this, (function () {

    const controller = {}

    const makeMatrix = function (month, year) {
        let quantityOfDays = daysInMonth[month]

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


    const getFirstDayOfMonth = function (month, year) {
        return new Date(year, month, 1).getDay()
    }

    function Calendar() {
        let self = this;

        self.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


        self.currentMonth = new Date().getMonth();
        self.currentYear = new Date().getFullYear();

        self.onload = function () {
            self.makeTable()
        }

        self.onchange = function (prop) {
            if (prop === "currentMonth" || prop === "currentYear") {
                self.makeTable()
            }
        }

        self.select = function (td) {
            if (td.getAttribute('value') == '') {
                return null
            }

            if (controller.selected) {
                controller.selected.classList.remove('selected')
            }
            td.classList.add('selected')

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

        let template = `<div class="lm-calendar">
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