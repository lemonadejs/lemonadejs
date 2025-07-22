title: Color Generator,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: A simple reactive color generator using the mouse move event.
canonical: https://lemonadejs.com/docs/examples/color-generator

Color Changer
=============

Color Changer generates a hexadecimal code that corresponds to a color. In this example you will learn how to use LemonadeJS to create a hexadecimal color generator!  
  

A working example
-----------------

Pass the mouse over the cards to change their colors

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-color-generator-83fv4t)

  

### Source code


```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function ColorChanger() {
    // Initializing self
    const self = this;

    let rand = function() {
        return parseInt(Math.random() * 255);
    }

    self.applyColor = function(e) {
        // Get a RANDOM RGB number
        let color = [ rand(), rand(), rand() ];
        // Set background of the DOM
        e.target.style.backgroundColor = 'rgb(' + color + ')';
        // Set text of the DOM
        e.target.innerText = color;
    }

    // Color changer template.
    return `<div class="grid">
        <div onmousemove="self.applyColor">Hover here</div>
        <div onmousemove="self.applyColor">Hover here</div>
        <div onmousemove="self.applyColor">Hover here</div>
    </div>`;
}
lemonade.render(ColorChanger, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function ColorChanger() {
    // Initializing self
    const self = this;

    let rand = function() {
        return parseInt(Math.random() * 255);
    }

    self.applyColor = function(e) {
        // Get a RANDOM RGB number
        let color = [ rand(), rand(), rand() ];
        // Set background of the DOM
        e.target.style.backgroundColor = 'rgb(' + color + ')';
        // Set text of the DOM
        e.target.innerText = color;
    }

    // Color changer template.
    return `<div class="grid">
        <div onmousemove="self.applyColor">Hover here</div>
        <div onmousemove="self.applyColor">Hover here</div>
        <div onmousemove="self.applyColor">Hover here</div>
    </div>`;
}
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