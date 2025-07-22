title: Color Generator,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: A simple reactive color generator using the mouse move event.
canonical: https://lemonadejs.com/docs/examples/color-generator

# Colour Changer

This example demonstrates using a native JavaScript `mousemove`{.highlight} event in LemonadeJS to update the DOM dynamically with a generated hexadecimal colour code.

## A Working Example

Please move your mouse over the cards below to see their colours change dynamically.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function ColorChanger() {

    const rand = function() {
        return parseInt(Math.random() * 255);
    }

    const applyColor = (e) => {
        // Get a RANDOM RGB number
        let color = [ rand(), rand(), rand() ];
        // Set background of the DOM
        e.target.style.backgroundColor = 'rgb(' + color + ')';
        // Set text of the DOM
        e.target.innerText = color;
    }

    // Color changer template.
    return render => render`<div class="grid">
        <div onmousemove="${applyColor}">Hover here</div>
        <div onmousemove="${applyColor}">Hover here</div>
        <div onmousemove="${applyColor}">Hover here</div>
    </div>`;
}
lemonade.render(ColorChanger, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function ColorChanger() {

    const rand = function() {
        return parseInt(Math.random() * 255);
    }

    const applyColor = (e) => {
        // Get a RANDOM RGB number
        let color = [ rand(), rand(), rand() ];
        // Set background of the DOM
        e.target.style.backgroundColor = 'rgb(' + color + ')';
        // Set text of the DOM
        e.target.innerText = color;
    }

    // Color changer template.
    return render => render`<div class="grid">
        <div onmousemove="${applyColor}">Hover here</div>
        <div onmousemove="${applyColor}">Hover here</div>
        <div onmousemove="${applyColor}">Hover here</div>
    </div>`;
}
```

### CSS for the Color Generator Example

To style the grid for the Color Generator example, use the following CSS:
  
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