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
                calendar.hover(controller.hoverPos[0] + 1, controller.hoverPos[1], null, true)
                break;
            case 'ArrowLeft':
                calendar.hover(controller.hoverPos[0] - 1, controller.hoverPos[1], null, true)
                break;
            case 'ArrowUp':
                calendar.hover(controller.hoverPos[0], controller.hoverPos[1] - 1, null, true)
                break;
            case 'ArrowDown':
                calendar.hover(controller.hoverPos[0], controller.hoverPos[1] + 1, null, true)
                break;
            case 'n':
                calendar.hover(controller.hoverPos[0], 999, null, true)
                break;
            case 'p':
                calendar.hover(controller.hoverPos[0], -1, null, true)
                break;
            case 't':
                calendar.time ? calendar.mode = 'time' : null
                break;
            case 'Enter':
                calendar.select(controller.hoverPos[0], controller.hoverPos[1])
                break;
        }
    }

    document.addEventListener('keydown', handleKeyDown)

    function ControllerDisplay() {
        let self = this;

        let template = `<div>
            <button :class="self.mode === 'date' ? 'visible' : ''" onclick="self.parent.parent.mode = 'month'">{{self.month}}</button>
            <button :class="self.mode === 'date' || self.mode === 'month' ? 'visible' : ''" onclick="self.parent.parent.mode = 'year'">{{self.year}}</button>
            <button :class="self.mode === 'date' ? 'visible' : ''" onclick="self.parent.parent.mode = 'time'">{{self.hours}}:{{self.minutes}} {{self.ampm}}</button>
            <button :class="self.mode === 'year' ? 'visible' : ''">{{self.year-4}}-{{self.year+11}}</button>
        </div>`

        return lemonade.element(template, self)
    }

    function Table() {
        let self = this;

        let m;

        if (self.mode === "date") {
            m = makeDaysMatrix(self.month, self.year, self.range);
        } else if (self.mode === "month") {
            m = makeMonthsMatrix(self.months);
        } else if (self.mode === "year") {
            m = makeYearsMatrix(self.year);
        }

        // <thead><tr :loop="self.parent.header"><th>{{self.title}}</th></tr></head>

        let template = '<tbody>';

        
        for (let i = 0; i < m.length; i++) {
            template += '<tr>'
            for (let j = 0; j < m[i].length; j++) {
                template += '<td '

                if (m[i][j].type === 'disabled') {
                    template += 'class="disabled-cell"';
                }

                template += `x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}"
                    ondblclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})"
                    onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.hover(${j}, ${i})">${m[i][j].value || ''}</td>`;
            }
            template += '</tr>';
        }

        template += '</tbody>'

        return template
    }

    function Calendar() {
        let self = this;

        if (!self.months || !self.months.length || self.months.length !== 12) {
            self.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        }

        if (!self.value) {
            self.value = new Date();
        }

        if (!self.selected) {
            self.selected = new Date();
        }

        if (!self.type) {
            self.type = "default";
        }
        
        self.mode = self.type === "year-month" ? "year" : "date";

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
            lemonade.render(Table, self.component.table, { ...self, onload: null, onchange: null })
        }

        self.onchange = function(prop) {
            if (prop === "month" || prop === "year" || prop === "mode") {
                self.component.table.innerHTML = ''
                lemonade.render(Table, self.component.table, { ...self, onload: null, onchange: null })
            } else if (prop === "value") {
                if (typeof (self.onupdate) === 'function') {
                    self.onupdate(self.value);
                }
            }
        }

        self.reset = function() {
            const now = new Date()

            self.value = now
            self.month = now.getMonth()
            self.day = now.getDate()
            self.year = now.getFullYear()
            self.hours = now.getHours()
            self.minutes = now.getMinutes()
            self.selected = now

            setFormatTime()

            self.mode = "date"
            self.select(null, null, self.day)
            self.hover(null, null, self.day)
        }

        self.hover = function (x, y, v, isMouse = false) {
            if (self.mode === "date" && isMouse && controller.hoverType === "current" && !isDateInRange(self.selected, new Date(self.year, self.month, 1), new Date(self.year, self.month, daysInMonth[self.month] + 1))) {
                self.month = self.selected.getMonth()
                self.year = self.selected.getFullYear()
                return;
            }

            if (x > (dimensions[self.mode][0] - 1)) {
                x = 0;
                y++;
            } else if (x < 0) {
                x = dimensions[self.mode][0] - 1;
                y--;
            }

            if (y > (dimensions[self.mode][1] - 1)) {
                self.handleRight();
                y = 0;
            } else if (y < 0) {
                self.handleLeft();
                y = dimensions[self.mode][1] - 1;
            }


            const td = v ? self.el.querySelector(`td[value="${v}"][type="current"]`) : self.el.querySelector(`td[x="${x}"][y="${y}"]`);
            
            const type = td.getAttribute('type');
            
            controller.hoverPos = [x || Number(td.getAttribute('x')), y || Number(td.getAttribute('y'))];
            controller.hoverType = type

            if (type === 'disabled') {
                return;
            }

            const tdvalue = td.getAttribute('value');

            if (controller.hover) {
                controller.hover.classList.remove('hover');
            }

            td.classList.add('hover');
            controller.hover = td;

            let day = self.day;
            let month = self.month;
            let year = self.year;

            if (self.mode === 'date') {
                day = tdvalue;
                self.day = tdvalue;

                if (type === 'previous') {
                    month--;
                } else if (type === 'next') {
                    month++;
                }
            } if (self.mode === 'month') {
                month = self.months.indexOf(tdvalue)
            } if (self.mode === 'year') {
                year = tdvalue
            }

            self.selected = new Date(year, month, day, self.hours, self.minutes);
        }

        self.select = function (x, y, v) {
            const td = v ? self.el.querySelector(`td[value="${v}"][type="current"]`) : self.el.querySelector(`td[x="${x}"][y="${y}"]`);

            const type = td.getAttribute('type');

            if (type === 'disabled') {
                return;
            }

            const value = td.getAttribute('value');

            if (controller.selected) {
                controller.selected.classList.remove('selected');
            }

            td.classList.add('selected');
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
                
                if (self.type === "default") {
                    self.month = month;
                    self.mode = "date";
                }
            } else if (self.mode === 'year') {
                year = value;
                self.mode = "month";
                self.year = Number(year);
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
                    
                    html += `x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}"
                    ondblclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})"
                    onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.hover(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }
            
            self.component.tbody.innerHTML = html;

            if (isDateInRange(self.selected, new Date(self.year, self.month, 1), new Date(self.year, self.month, daysInMonth[self.month] + 1))) {
                self.hover(null, null, self.selected.getDate())
            }

            if (isDateInRange(self.value, new Date(self.year, self.month, 1), new Date(self.year, self.month, daysInMonth[self.month] + 1))) {
                self.select(null, null, self.value.getDate())
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
                    html += `<td x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}"
                    ondblclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})"
                    onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.hover(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }

            self.component.tbody.innerHTML = html;

            if (isDateInRange(self.selected, new Date(self.year, 1, 1), new Date(self.year + 1, 1, 1)) && self.mode === "month") {
                self.hover(null, null, self.months[self.selected.getMonth()])
            }

            if (isDateInRange(self.value, new Date(self.year, 1, 1), new Date(self.year + 1, 1, 1)) && self.type === "year-month") {
                self.select(null, null, self.months[self.value.getMonth()])
            }
        }

        self.makeYearsTable = function () {
            self.header = [];

            // Get the matrix to build the HTML table based on
            const m = makeYearsMatrix(self.year);

            let html = '';

            for (let i = 0; i < m.length; i++) {
                html += '<tr>';
                for (let j = 0; j < m[i].length; j++) {
                    html += `<td x="${j}" y="${i}" value="${m[i][j].value || ''}" type="${m[i][j].type}"
                    ondblclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.select(${j}, ${i})"
                    onclick="this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.lemon.self.hover(${j}, ${i})">${m[i][j].value || ''}</td>`;
                }
                html += '</tr>';
            }

            self.component.tbody.innerHTML = html;

            if (isDateInRange(self.selected, new Date(self.year - 4, 1, 1), new Date(self.year + 12, 1, 1))) {
                self.hover(null, null, self.selected.getFullYear())
            }
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

            controller[ts] = target;
        }

        let template = `<div class="lm-calendar" date="{{self.value}}">
            <Modal closed="{{self.closed}}" width="350" height="300" :onopen="self.onopen" :onclose="self.onclose" :ref="self.component">
                <div class="lm-calendar-options">
                    <button onclick="self.parent.reset()">Reset</button>
                    <button onclick="self.parent.closed = true;">Done</button>
                </div>
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
                    <table mode="{{self.parent.mode}}" :ref="self.table">
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