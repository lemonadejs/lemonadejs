title: Color Generator
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: A simple reactive color generator using the mouse move event.

Color Changer
=============

Color Changer generates a hexadecimal code that corresponds to a color. In this example you will learn how to use LemonadeJS to create a hexadecimal color generator!  
  

A working example
-----------------

Pass the mouse over the cards to change their colors

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-color-generator-fc7e9)

  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var ColorChanger = function() {
    // Initializing self
    var self = {}

    var rand = function() {
        return parseInt(Math.random() * 255);
    }

    self.applyColor = function(element) {
        // Get a RANDOM RGB number
        var color = [ rand(), rand(), rand() ];
        // Set background of the DOM
        element.style.backgroundColor = 'rgb(' + color + ')';
        // Set text of the DOM
        element.innerText = color;
    }

    // Color changer template.
    var template = `
        <div class="grid">
            <div onmousemove="self.applyColor(this)">Hover here</div>
            <div onmousemove="self.applyColor(this)">Hover here</div>
            <div onmousemove="self.applyColor(this)">Hover here</div>
        </div>`;

    return lemonade.element(template, self);
}

lemonade.render(ColorChanger, document.getElementById('root'));
</script>
</html>
```
  
  

### CSS of this section

If you wish to use this example, please copy this CSS to your project.  
  
```css
.grid {
    display: flex;
    flex-direction: row;
    width: 300px;
}
.grid > div {
    width: 100px;
    height: 100px;
    margin: 2px;
    color: #fff;
    text-align: center;
    transition: 0.5s;
    background-color: #cecece;
}
```