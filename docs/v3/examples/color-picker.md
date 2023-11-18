title: JavaScript color picker,
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, color picker,
description: How to create a reactive JavaScript color picker with LemonadeJS.

Color picker
============

How to create a reactive JavaScript color picker using LemonadeJS.  
  

Example
-------

Reactive color picker LemonadeJS.  
 

### Source code

  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Color() {
    const self = this;
    let context = null;
    let decToHex = function(num) {
        let hex = num.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    let rgbToHex = function(r, g, b) {
        return "#" + decToHex(r) + decToHex(g) + decToHex(b);
    }
    let draw = function() {
        let g = context.createLinearGradient(0, 0, self.canvas.width, 0);
        // Create color gradient
        g.addColorStop(0,    "rgb(255,0,0)");
        g.addColorStop(0.15, "rgb(255,0,255)");
        g.addColorStop(0.33, "rgb(0,0,255)");
        g.addColorStop(0.49, "rgb(0,255,255)");
        g.addColorStop(0.67, "rgb(0,255,0)");
        g.addColorStop(0.84, "rgb(255,255,0)");
        g.addColorStop(1,    "rgb(255,0,0)");
        context.fillStyle = g;
        context.fillRect(0, 0, self.canvas.width, self.canvas.height);
        g = context.createLinearGradient(0, 0, 0, self.canvas.height);
        g.addColorStop(0,   "rgba(255,255,255,1)");
        g.addColorStop(0.5, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(0,0,0,0)");
        g.addColorStop(1,   "rgba(0,0,0,1)");
        context.fillStyle = g;
        context.fillRect(0, 0, self.canvas.width, self.canvas.height);
    }

    self.onload = function() {
        context = self.canvas.getContext("2d");
        draw();
    }
    // Moves the marquee point to the specified position
    self.update = function(e) {
        let x;
        let y;
        let buttons = 1;
        if (e.type == 'touchmove') {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        } else {
            buttons = e.buttons;
            x = e.clientX;
            y = e.clientY;
        }

        if (buttons === 1) {
            let rect = self.el.getBoundingClientRect();
            let left = x - rect.left;
            let top = y - rect.top;
            // Get the color in this pixel
            let pixel = context.getImageData(left, top, 1, 1).data;
            // Position pointer
            self.point.style.left = left + 'px';
            self.point.style.top = top + 'px';
            // Return color
            return rgbToHex(pixel[0], pixel[1], pixel[2]);
        }
    }

    self.color = 'Click to get a color';

    return `<div class="lm-color-hsl">
        <canvas width="200" height="160" :ref="self.canvas"
            onmousedown="self.update(e)"
            onmousemove="self.update(e)"
            ontouchmove="self.update(e)"></canvas>
        <div class="lm-color-point" :ref="self.point"></div>
    </div>`;
}
lemonade.render(Color, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Color() {
    const self = this;
    let context = null;
    let decToHex = function(num) {
        let hex = num.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    let rgbToHex = function(r, g, b) {
        return "#" + decToHex(r) + decToHex(g) + decToHex(b);
    }
    let draw = function() {
        let g = context.createLinearGradient(0, 0, self.canvas.width, 0);
        // Create color gradient
        g.addColorStop(0,    "rgb(255,0,0)");
        g.addColorStop(0.15, "rgb(255,0,255)");
        g.addColorStop(0.33, "rgb(0,0,255)");
        g.addColorStop(0.49, "rgb(0,255,255)");
        g.addColorStop(0.67, "rgb(0,255,0)");
        g.addColorStop(0.84, "rgb(255,255,0)");
        g.addColorStop(1,    "rgb(255,0,0)");
        context.fillStyle = g;
        context.fillRect(0, 0, self.canvas.width, self.canvas.height);
        g = context.createLinearGradient(0, 0, 0, self.canvas.height);
        g.addColorStop(0,   "rgba(255,255,255,1)");
        g.addColorStop(0.5, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(0,0,0,0)");
        g.addColorStop(1,   "rgba(0,0,0,1)");
        context.fillStyle = g;
        context.fillRect(0, 0, self.canvas.width, self.canvas.height);
    }

    self.onload = function() {
        context = self.canvas.getContext("2d");
        draw();
    }
    // Moves the marquee point to the specified position
    self.update = function(e) {
        let x;
        let y;
        let buttons = 1;
        if (e.type == 'touchmove') {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        } else {
            buttons = e.buttons;
            x = e.clientX;
            y = e.clientY;
        }

        if (buttons === 1) {
            let rect = self.el.getBoundingClientRect();
            let left = x - rect.left;
            let top = y - rect.top;
            // Get the color in this pixel
            let pixel = context.getImageData(left, top, 1, 1).data;
            // Position pointer
            self.point.style.left = left + 'px';
            self.point.style.top = top + 'px';
            // Return color
            return rgbToHex(pixel[0], pixel[1], pixel[2]);
        }
    }

    self.color = 'Click to get a color';

    return `<div class="lm-color-hsl">
        <canvas width="200" height="160" :ref="self.canvas"
            onmousedown="self.update(e)"
            onmousemove="self.update(e)"
            ontouchmove="self.update(e)"></canvas>
        <div class="lm-color-point" :ref="self.point"></div>
    </div>`;
}
```

### Style fo this section

```css
.lm-color-hsl {
    box-sizing: border-box;
    position: relative;
    display: inline-block;
}

.lm-color-hsl canvas {
    display: block;
    border-radius: 4px;
    -webkit-user-drag: none;
}

.lm-color-point {
    height: 5px;
    width: 5px;
    background-color: #000;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    outline: 1px solid white;
}
```