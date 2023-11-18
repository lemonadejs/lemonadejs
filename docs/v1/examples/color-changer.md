title: Color picker
keywords: Lemonadejs, two-way binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple color picker example with lemonadeJS.

Color Changer
=============

Color Changer generates a hexadecimal code that corresponds to a color. In this example you will learn how to use LemonadeJS to create a hexadecimal color generator!  
  

A working example
-----------------

[See this example on jsfiddle.net](https://jsfiddle.net/joaovmvini/qxhn154k/2/)

  

Source code
-----------

```html
<html>
<link rel="stylesheet" href="https://jsuites.net/jsuites.layout.css" type="text/css" />
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var Color = (function(container) {
    var self = {};

    self.container = null;
    self.hexCode = '#';
    self.hexNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F'];

    self.getHex = function() {
        if(self.hexCode.length == 7) {
            self.hexCode = '#';
        }        
        for(var i = 0; i < 6; i ++) {
            var random = self.hexNumbers[Math.floor(Math.random() * self.hexNumbers.length)];
            self.hexCode += random;
        }
        self.container.style.background = self.hexCode;
    }

    var template = `
    <div>
        <div style="max-width: 400px;" class="column" @ref="self.container" @ready="self.getHex()">
            <span class="row center p10" style="font-size: 1.5em; display:block;">The Hex Color Code Is:</span>
            <span class="row center" style="font-size: 2em; display:block;">{{ self.hexCode }}</span>
            <br>
            <div class="row p10" style="justify-content: center;">
                <button onclick="self.getHex()" class="jbutton dark">Press Here To Change Color</button>
            </div>
        </div>
    </div>
    `
  return lemonade.element(template, self);
});
lemonade.render(Color, document.getElementById('root'));
</script>
```