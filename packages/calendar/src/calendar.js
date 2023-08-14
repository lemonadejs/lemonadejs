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

    const dimensions = {
        date: [7, 6],
        month: [3, 4],
        year: [4, 4]
    }

    const daysInMonth = {
        '-1': 31,
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

    function makeDaysMatrix(month, year, validRange = ['1500-01-01', '2500-01-01']) {
        let quantityOfDays = month === 1 ? getDaysInFebruary(year) : daysInMonth[month]
        let quantityOfDaysLastMonth = (month - 1 === 1 ? getDaysInFebruary(year) : daysInMonth[month - 1])

        // First day position on the first week array
        let firstDay = getFirstDayOfMonth(month, year)

        let m = new Array(6).fill(new Array(7)).map(dow => Array.from(dow));

        for (let i = 0; i < 7; i++) {
            if (i < firstDay) {
                let day = quantityOfDaysLastMonth + (i - firstDay + 1)
                m[0][i] = { value: day, type: isDateInRange(new Date(year, month - 1, day), validRange[0], validRange[1]) ? 'previous' : 'disabled' }
            }
        }

        let counterCurrentMonth = 1;
        let counterNextMonth = 1;

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                if (m[i][j] !== null && typeof(m[i][j]) !== 'object' && counterCurrentMonth <= quantityOfDays) {
                    m[i][j] = { value: counterCurrentMonth, type: isDateInRange(new Date(year, month, counterCurrentMonth), validRange[0], validRange[1]) ? 'current' : 'disabled' }
                    counterCurrentMonth++
                } else if (typeof m[i][j] === 'undefined') {
                    m[i][j] = { value: counterNextMonth, type: isDateInRange(new Date(year, month + 1, counterNextMonth), validRange[0], validRange[1]) ? 'next' : 'disabled' }
                    counterNextMonth++
                }
            }
        }

        return m
    };

    function makeMonthsMatrix(monthsArray) {
        let m = new Array(4).fill(new Array(3)).map(dow => Array.from(dow));

        for (let i = 0; i < m.length; i++) {
            for (let j = 0; j < m[0].length; j++) {
                m[i][j] = { value: monthsArray[(i * 3) + j], type: 'current' }
            }
        }

        return m
    };

    function makeYearsMatrix(year) {
        const yearsArray = [];
        const startingYear = year - 4; // Year at position 4 will be 3 years before the given year
  
        // Populate the array with 16 years in ascending order
        for (let i = 0; i < 4; i++) {
            yearsArray[i] = []
            for (let j = 0; j < 4; j++) {
                const currentYear = startingYear + (i * 4 + j);
                yearsArray[i][j] = { value: currentYear, type: 'current' }
            }
        }

        return yearsArray;
    }

    function getDaysInFebruary(year) {
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
    
    function getFirstDayOfMonth(month, year) {
        return new Date(year, month, 1).getDay()
    }

    function isDateInRange(date, startDate, endDate) {
        const dateToCheck = new Date(date);
        
        const start = new Date(startDate);
        
        const end = new Date(endDate);

        return dateToCheck >= start && dateToCheck <= end;
    }

    function handleKeyDown(event) {
        const calendar = document.querySelector('.lm-calendar').lemon.self

        switch (event.key) {
            case 'ArrowRight':
                calendar.select(controller.selectedPos[0] + 1, controller.selectedPos[1])
                break;
            case 'ArrowLeft':
                calendar.select(controller.selectedPos[0] - 1, controller.selectedPos[1])
                break;
            case 'ArrowUp':
                calendar.select(controller.selectedPos[0], controller.selectedPos[1] - 1)
                break;
            case 'ArrowDown':
                calendar.select(controller.selectedPos[0], controller.selectedPos[1] + 1)
                break;
            case 'n':
                calendar.select(controller.selectedPos[0], 999)
                break;
            case 'p':
                calendar.select(controller.selectedPos[0], -1)
                break;
            case 't':
                calendar.time ? calendar.mode = 'time' : null
                break;
        }
    }

    document.addEventListener('keydown', handleKeyDown)

    function ControllerDisplay() {
        let self = this

        let template = `<div>
            <button :class="self.mode === 'date' ? 'visible' : ''" onclick="self.parent.parent.mode = 'month'">{{self.month}}</button>
            <button :class="self.mode === 'date' || self.mode === 'month' ? 'visible' : ''" onclick="self.parent.parent.mode = 'year'">{{self.year}}</button>
            <button :class="self.mode === 'date' ? 'visible' : ''" onclick="self.parent.parent.mode = 'time'">{{self.hours}}:{{self.minutes}} {{self.ampm}}</button>
            <button :class="self.mode === 'year' ? 'visible' : ''">{{self.year-4}}-{{self.year+11}}</button>
        </div>`

        return lemonade.element(template, self)
    }

    function Calendar() {
        let self = this;

        if (!self.months || !self.months.length || self.months.length !== 12) {
            self.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        }

        if (!self.value) {
            self.value = new Date();
        }
        
        self.mode = "date"

        function setFormatTime() {
            let h = self.value.getHours();
            self.minutes = self.value.getMinutes();
            self.ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            self.hours = ('0' + h).slice(-2);
            self.minutes = ('0' + self.minutes).slice(-2);
        }

        self.month = self.value.getMonth();
        self.year = self.value.getFullYear();
        self.day = self.value.getDate();
        setFormatTime();

        self.onload = function() {
            if (self.mode === "date") {
                self.makeDaysTable();
            } else if (self.mode === "month") {
                self.makeMonthsTable();
            } else if (self.mode === "year") {
                self.makeYearsTable();
            }
        }

        self.onchange = function(prop) {
            if (prop === "month" || prop === "year" || prop === "mode") {
                if (self.mode === "date") {
                    self.makeDaysTable();
                } else if (self.mode === "month") {
                    self.makeMonthsTable();
                } else if (self.mode === "year") {
                    self.makeYearsTable();
                }
            } else if (prop === "value") {
                if (typeof (self.onupdate) === 'function') {
                    self.onupdate(self.value);
                }
            }
        }

        self.select = function (x, y, v) {
            if (x > (dimensions[self.mode][0] - 1)) {
                x = 0;
                y++;
            } else if (x < 0) {
                x = 6;
                y--;
            }

            if (y > (dimensions[self.mode][1] - 1)) {
                self.handleRight();
                y = 0;
            } else if (y < 0) {
                self.handleLeft();
                y = 5;
            }

            const td = v ? self.el.querySelector(`td[value="${v}"]`) : self.el.querySelector(`td[x="${x}"][y="${y}"]`);

            const type = td.getAttribute('type');

            if (type === 'disabled') {
                return;
            }

            const value = td.getAttribute('value');

            if (controller.selected) {
                controller.selected.classList.remove('selected');
            }

            td.classList.add('selected');
            controller.selectedPos = [x, y];
            controller.selected = td;

            let day = self.day;
            let month = self.month;
            let year = self.year;

            if (self.mode === 'date') {
                day = value;
                self.day = value;

                if (type === 'previous') {
                    month--;
                } else if (type === 'next') {
                    month++;
                }
            } else if (self.mode === 'month') {
                month = self.months.indexOf(value);
                self.month = month;
                self.mode = "date";
            } else if (self.mode === 'year') {
                year = value;
                self.year = Number(year);
                self.mode = "month";
            }

            self.value = new Date(year, month, day, self.hours, self.minutes);
        }

        self.makeDaysTable = function () {
            self.header = [{ title: 'S' }, { title: 'M' }, { title: 'T' }, { title: 'W' }, { title: 'T' }, { title: 'F' }, { title: 'S' }];

            // Get the matrix to build the HTML table based on
            const m = makeDaysMatrix(self.month, self.year, self.range);

            let html = '';

            for (let i = 0; i < m.length; i++) {
                html += '<tr>';
                for (let j = 0; j < m[i].length; j++) {
                    html += `<td `;
                    
                    if (m[i][j].type === 'disabled') {
                        html += 'class="disabled-cell"';
                    }
                    
                    html += `x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}" onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }

            self.component.tbody.innerHTML = html;
            if (!controller.selected) {
                self.select(0, 0, self.day);
            }
        }

        self.makeMonthsTable = function () {
            self.header = [];

            // Get the matrix to build the HTML table based on
            const m = makeMonthsMatrix(self.months);

            let html = '';

            for (let i = 0; i < m.length; i++) {
                html += '<tr>';
                for (let j = 0; j < m[i].length; j++) {
                    html += `<td x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}" onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }

            self.component.tbody.innerHTML = html;
            controller.selected = null;
        }

        self.makeYearsTable = function () {
            self.header = [];

            // Get the matrix to build the HTML table based on
            const m = makeYearsMatrix(self.year);

            let html = '';

            for (let i = 0; i < m.length; i++) {
                html += '<tr>';
                for (let j = 0; j < m[i].length; j++) {
                    html += `<td x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}" onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }

            self.component.tbody.innerHTML = html;
        }

        self.handleRight = function () {
            if (self.mode === "date") {
                if (self.month === 11) {
                    self.month = 0;
                    self.year += 1;
                } else {
                    self.month += 1;
                }
            } else if (self.mode === "month") {
                self.year += 1;
            } else if (self.mode === "year") {
                self.year += 16;
            }

            self.select(0, 0);
        }

        self.handleLeft = function () {
            if (self.mode === "date") {
                if (self.month === 0) {
                    self.month = 11;
                    self.year -= 1;
                } else {
                    self.month -= 1;
                }
            } else if (self.mode === "month") {
                self.year -= 1;
            } else if (self.mode === "year") {
                self.year -= 16;
            }

            self.select(6, 5);
        }

        self.selectTime = function (target, type) {
            target.classList.add('selected');

            let ts = type + 'Selected';

            if (controller[ts]) {
                controller[ts].classList.remove('selected');
            }

            target.classList.add('selected');

            if (type === 'hours') {
                self.hours = target.innerText;
            } else if (type === 'minutes') {
                self.minutes = target.innerText;
            } else if (type === 'ampm') {
                self.ampm = target.innerText;
            }

            if (self.hours != 12) {
                self.value = new Date(self.year, self.month, self.day, self.ampm === 'AM' ? self.hours : Number(self.hours) + 12, self.minutes);
            } else {
                self.value = new Date(self.year, self.month, self.day, self.ampm === 'AM' ? 0 : 12, self.minutes);
            }

            setFormatTime();

            controller.selected = null;
            controller[ts] = target;
        }

        let template = `<div class="lm-calendar" date="{{self.value}}">
            <Modal closed="{{self.closed}}" width="350" height="260" :onopen="self.onopen" :onclose="self.onclose" :ref="self.component">
                <div class="lm-calendar-controllers" mode="{{self.parent.mode}}">
                    <ControllerDisplay
                        mode="{{self.parent.mode}}" day="{{self.parent.day}}" month="{{self.parent.months[self.parent.month]}}" year="{{self.parent.year}}"
                        time="{{self.parent.time}}" hours="{{self.parent.hours}}" minutes="{{self.parent.minutes}}" ampm="{{self.parent.ampm}}"
                    />
                    <div><button onclick="self.parent.handleLeft()"><</button><button onclick="self.parent.handleRight()">></button></div>
                </div>
                <div class="lm-calendar-content-wrapper">
                    <div mode="{{self.parent.mode}}">
                        <div class="hours options" onclick="self.parent.selectTime(event.target, 'hours')">
                            <div>12</div><div>01</div><div>02</div><div>03</div><div>04</div><div>05</div><div>06</div><div>07</div><div>08</div><div>09</div><div>10</div><div>11</div>
                        </div>
                        <div class="minutes options" onclick="self.parent.selectTime(event.target, 'minutes')">
                            <div>00</div><div>05</div><div>10</div><div>15</div><div>20</div><div>25</div><div>30</div><div>35</div><div>40</div><div>45</div><div>50</div><div>55</div>
                        </div>
                        <div class="ampm options" onclick="self.parent.selectTime(event.target, 'ampm')">
                            <div>AM</div><div>PM</div>
                        </div>
                        <button onclick="self.parent.mode = 'date'">Done</button>
                    </div>
                    <table mode="{{self.parent.mode}}">
                        <thead><tr :loop="self.parent.header"><th>{{self.title}}</th></tr></head>
                        <tbody :ref="self.tbody"></tbody>
                    </table>
                </div>
            </Modal>
        </div>`

        return lemonade.element(template, self, { ControllerDisplay })
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