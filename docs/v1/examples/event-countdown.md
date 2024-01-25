title: JavaScript Reactive Event Countdown Example
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple example to integrate an third party component and LemonadeJS.

Event countdown
===============

The countdown uses an event date to calculate how much time is left until a event, in this example you will learn how to create a countdown using Lemonadejs!

A working example
-----------------

[See this example on jsfiddle.net](https://jsfiddle.net/joaovmvini/st6a2whu/3/)

  

Source code
-----------


```html
<html>
<link rel="stylesheet" href="https://jsuites.net/jsuites.css" type="text/css" />
<link rel="stylesheet" href="https://jsuites.net/jsuites.layout.css" type="text/css" />
<script type="text/javascript" src="https://jsuites.net/jsuites.js"></script>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var Countdown = (function(container) {
    var self = {};

    self.days = '00';
    self.hours = '00';
    self.minutes = '00';
    self.seconds = '00';
    self.calendar = null;
    self.eventTimeElement = null;
    self.selectedDate = null;

    self.createCalendar = function(o) {
        self.calendar = jSuites.calendar(o);
    }

    self.startCountdown = function() {
        var userInput = self.validateInput();
        if(userInput) {
            self.selectedDate = self.calendar.getValue().slice(0,10) + " " + userInput;
            var timeLeft = self.getTimeLeft(self.selectedDate);
            if (timeLeft) {
                self.start();
            } else {
                alert('Invalid date, please select a later date')
            }
        } else {
            alert('Invalid input');
        }
    }

    self.validateInput = function() {
        var [h, m, s] = self.eventTimeElement.value.split(':');
        if (! isNaN(h) && ! isNaN(m) && ! isNaN(s) && (h >= 0 && h <= 24) && (m >= 0 && m <= 60) && (s >= 0 && s <= 60)) {
            return self.eventTimeElement.value;
        }
        return false;
    }

    self.getTimeLeft = function(eventDate) {
        var timeLeft = new Date(eventDate) - Date.now();
        return timeLeft > 0 ? timeLeft : false;
    }

    self.getFormattedTimeLeft = function(timeLeft) {
        var days = timeLeft / (1000 * 3600 * 24);
        var hours = (days - parseInt(days)) * 24;
        var minutes = (hours - parseInt(hours)) * 60;
        var seconds = (minutes - parseInt(minutes)) * 60;
        return [days, hours, minutes, seconds].map(n => parseInt(n));
    }

    self.start = function() {
        var timeLeft = self.getTimeLeft(self.selectedDate);
        var [d, h, m, s] = self.getFormattedTimeLeft(timeLeft);

        self.days = jSuites.two(d);
        self.hours = jSuites.two(h);
        self.minutes = jSuites.two(m);
        self.seconds = jSuites.two(s);

        if (d || h || m || s) {
            return setTimeout(self.start, 1000);
        } else {
            alert("Event countdown finished!");
        }
    }

    var template = `
    <div class="row" style="justify-content: space-evenly">
    <div class="column" @ready="self.createCalendar(this)"></div>
    <div class="column" style="color: #051e3e; font-weight: 600; background: #e6e6ea; border-radius: 8px; box-shadow: 0px 1px 5px 1px rgba(0,0,0,0.65);">
        <div class="form-group p10">
            <label>Event start time</label>
            <input @ref="self.eventTimeElement" type="text" placeholder="Example: 20:00:00"/>
        </div>
        <div class="row center p10">
            <div class="column f1">
                <span style="font-size: 1.8em;">{{self.days}}</span>
                <span style="display: block;">Days</span>
             </div>
             <div class="column f1">
                <span style="font-size: 1.8em;">{{self.hours}}</span>
                <span style="display: block;">Hours</span>
              </div>
              <div class="column f1">
                 <span style="font-size: 1.8em;">{{self.minutes}}</span>
                 <span style="display: block;">Minutes</span>
              </div>
              <div class="column f1">
                 <span style="font-size: 1.8em;">{{self.seconds}}</span>
                 <span style="display: block;">Seconds</span>
              </div>  
        </div>
        <div class="row p15" style="justify-content: center;">
            <button class="jbutton dark" onclick="self.startCountdown()">Start countdown</button>
        </div>
    </div>
</div>
    `
    return lemonade.element(template, self);
});
lemonade.render(Countdown, document.getElementById('root'));
</script>
```