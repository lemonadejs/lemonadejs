title: Reactive Lamp Example
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple state change example using LemonadeJS.

Lamp
====

The following example uses Lemonadejs to easily change the lamp state.  
  

A working example
-----------------

[See this example on jsfiddle.net](https://jsfiddle.net/spreadsheet/btr1Lg6h/)

  

Source code
-----------

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var Lamp = (function() {
    var self = {};
    self.imageElement = null;
    self.lampState = 0;

    self.setLampState = function(state) {
        if (! state) {
            self.imageElement.src = "/templates/v1/img/example-lamp-off.jpg";
        } else {
            self.imageElement.src = "/templates/v1/img/example-lamp-on.jpg";
        }
    }

    var template = `<div>
        <div id="lamp-container">
            <img @ref="self.imageElement" src="/templates/v1/img/example-lamp-off.jpg" alt="lamp">
        </div>
        <div class="lamp-buttons">
            <button onclick="self.setLampState(1)">Light on</button>
            <button onclick="self.setLampState(0)">Light off</button>
        </div>
    </div>`

    return lemonade.element(template, self);
});
lemonade.render(Lamp, document.getElementById('root'));
</script>
```