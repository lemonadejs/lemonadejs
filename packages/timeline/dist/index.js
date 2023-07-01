;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Timeline = factory();
}(this, (function () {

    // Load LemonadeJS
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    if (typeof(jSuites) == 'undefined') {
        if (typeof(require) === 'function') {
            var jSuites = require('jsuites');
        }
    }

    const isLight = function(color) {
        let r,g,b;
        if (color.match(/^rgb/)) {
            color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            r = color[1];
            g = color[2];
            b = color[3];
        } else {
            color = color.replace('#', '');
            color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));
            r = color >> 16;
            g = color >> 8 & 255;
            b = color & 255;
        }
        // Using the HSP value, determine whether the color is light or dark
        return Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)) > 180;
    }

    const Tags = (function() {
        let self = this;
        self.fontColor = isLight(self.color) ? '#000' : '#fff';
        return `<div class="jtimeline-tag" style="{{'background-color:' + self.color + '; color:' + self.fontColor}}">{{self.text}}</div>`;
    });

    const Events = (function() {
        let self = this;

        if (! Array.isArray(self.tags)) {
            self.tags = [];
        }

        return `<div class="jtimeline-item">
            <div class="jtimeline-date-container">
                <div class="{{!self.day? 'jtimeline-date' : 'jtimeline-date jtimeline-date-bullet'}}">{{self.day}}</div>
            </div>
            <div class="jtimeline-content">
                <div class="jtimeline-title-container">
                    <div class="jtimeline-title">{{self.title || 'No title'}}</div>
                    <div class="jtimeline-controls" style="{{!self.author? 'display:none;':'display:block;'}}">
                        <i class='material-icons timeline-edit' onclick="self.parent.edit(self)">edit</i>
                    </div>
                </div>
                <div class="jtimeline-subtitle">{{self.subtitle || ''}}</div>
                <div class="jtimeline-text">{{self.text}}</div>
                <div class="jtimeline-tags"><Tags @loop="self.tags" /></div>
            </div>
        </div>`;
    });

    return function() {
        let self = this;
        let date = new Date();

        self.data = [];
        self.year = date.getFullYear();
        self.month = 1 + date.getMonth();
        self.containerClass = 'jtimeline-container';
        self.timelineDays = [];
        self.container = null;
        self.months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

        const getData = function() {
            self.el.classList.add('jtimeline-loading');

            jSuites.ajax({
                url: self.url + '?year=' + self.year + '&month=' + self.month,
                type: 'GET',
                dataType:'json',
                success: function(data) {
                    self.data = data;

                    self.el.classList.remove('jtimeline-loading');
                }
            });
        };

        const animate = function(sufix) {
            self.containerClass += ' slide-left-' + sufix;
            self.container.onanimationend = function() {
                self.containerClass = 'jtimeline-container';
            }
        }

        self.reload = function() {
            getData();
        }

        self.update = function() {
            let day = '';
            let prevDay = '';

            for (let i = 0; i < self.data.length; i ++) {
                day = self.data[i].date.substr(8,9);

                if (day != prevDay) {
                    self.data[i].day = day;
                } else {
                    self.data[i].day = '';
                }

                prevDay = day;
            }

            // self.refresh('data');
        }

        self.next = function() {
            if (self.month === 12) {
                self.year++;
                self.month = 1;
            } else {
                self.month++;
            }
        }

        self.prev = function() {
            if (self.month === 1) {
                self.year--;
                self.month = 12;
            } else {
                self.month--;
            }
        }

        self.onchange = function(prop) {
            if (prop === 'month') {
                getData();
            } else if (prop === 'data') {
                self.update();
            }
        }

        self.onload = function() {
            getData();

            // Add global events
            self.root.addEventListener("swipeleft", function(e) {
                self.next();
                e.preventDefault();
                e.stopPropagation();
            });

            self.root.addEventListener("swiperight", function(e) {
                self.prev();
                e.preventDefault();
                e.stopPropagation();
            });
        }

        self.add = function(data) {
            // Save on the server
            [self.year, self.month] = data.date.split('-');
            // Get the data
            getData();
        }

        self.delete = function(id) {
            var index = self.data.findIndex(item => item.id === id);
            if (index >= 0) {
                self.data.splice(index, 1);
            }
            self.refresh('data');
        }

        self.edit = function(s) {
            if (typeof (self.onaction) === 'function') {
                self.onaction(s.id);
            }
        }

        if (! self.message) {
            self.message = 'No records found';
        }

        self.el.val = function(v) {
            if (typeof(v) === 'undefined') {
                return self.value;
            } else {
                self.value = v;
            }
        }

        let template = `<div class="jtimeline" @ref="self.root">
                <div class="jtimeline-header">
                <div class="jtimeline-label">
                    <div class="jtimeline-month">{{self.months[self.month - 1]}}</div>
                    <div class="jtimeline-year">{{self.year}}</div>
                </div>
                <div class="jtimeline-navigation">
                    <i class="material-icons" onclick="self.prev()">keyboard_arrow_left</i>
                    <i class="material-icons" onclick="self.next()">keyboard_arrow_right</i>
                </div>
                </div>
                <div @ref="self.container" class="{{self.containerClass}}">
                    <div class="jtimeline-data" data-message="{{self.message}}"><Events @loop="self.data" edit="{{self.edit}}" @ref="self.event" /></div>
                </div>
            </div>`;

        return lemonade.element(template, self, { Events, Tags });
    }

})));