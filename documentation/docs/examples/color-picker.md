title: JavaScript Color Picker Example  
keywords: LemonadeJS, two-way binding, frontend, JavaScript library, JavaScript plugin, JavaScript, reactive, React, colour picker  
description: A simple implementation of a reactive JavaScript colour picker using LemonadeJS.  
canonical: https://lemonadejs.com/docs/examples/color-picker  

# Color Picker

Learn how to create a fully reactive JavaScript colour picker with LemonadeJS for seamless state management and dynamic updates.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onload } = lemonade;
function Color() {

    let context = null;

    const decToHex = function(num) {
        let hex = num.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    
    const rgbToHex = function(r, g, b) {
        return "#" + decToHex(r) + decToHex(g) + decToHex(b);
    }

    const draw = () => {
        let g = context.createLinearGradient(0, 0, this.canvas.width, 0);
        // Create color gradient
        g.addColorStop(0,    "rgb(255,0,0)");
        g.addColorStop(0.15, "rgb(255,0,255)");
        g.addColorStop(0.33, "rgb(0,0,255)");
        g.addColorStop(0.49, "rgb(0,255,255)");
        g.addColorStop(0.67, "rgb(0,255,0)");
        g.addColorStop(0.84, "rgb(255,255,0)");
        g.addColorStop(1,    "rgb(255,0,0)");
        context.fillStyle = g;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        g = context.createLinearGradient(0, 0, 0, this.canvas.height);
        g.addColorStop(0,   "rgba(255,255,255,1)");
        g.addColorStop(0.5, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(0,0,0,0)");
        g.addColorStop(1,   "rgba(0,0,0,1)");
        context.fillStyle = g;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Moves the marquee point to the specified position
    const update = (e) => {
        let x;
        let y;
        let buttons = 1;
        if (e.type === 'touchmove') {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        } else {
            buttons = e.buttons;
            x = e.clientX;
            y = e.clientY;
        }

        if (buttons === 1) {
            let rect = this.el.getBoundingClientRect();
            let left = x - rect.left;
            let top = y - rect.top;
            // Get the color in this pixel
            let pixel = context.getImageData(left, top, 1, 1).data;
            // Position pointer
            this.point.style.left = left + 'px';
            this.point.style.top = top + 'px';
            // Return color
            return rgbToHex(pixel[0], pixel[1], pixel[2]);
        }
    }

    onload(() => {
        context = this.canvas.getContext("2d");
        draw();
    });

    this.color = 'Click to get a color';

    return render => render`<div class="lm-color-hsl" style="width: 200px; height: 160px;">
        <canvas width="200" height="160" :ref="self.canvas"
            onmousedown="${update}"
            onmousemove="${update}"
            ontouchmove="${update}"></canvas>
        <div class="lm-color-point" :ref="self.point"></div>
    </div>`;
}
lemonade.render(Color, document.getElementById('root'));
</script>
</html>
```
```javascript
import { onload } from 'lemonadejs';

export default function Color() {

    let context = null;

    const decToHex = function(num) {
        let hex = num.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    const rgbToHex = function(r, g, b) {
        return "#" + decToHex(r) + decToHex(g) + decToHex(b);
    }

    const draw = () => {
        let g = context.createLinearGradient(0, 0, this.canvas.width, 0);
        // Create color gradient
        g.addColorStop(0,    "rgb(255,0,0)");
        g.addColorStop(0.15, "rgb(255,0,255)");
        g.addColorStop(0.33, "rgb(0,0,255)");
        g.addColorStop(0.49, "rgb(0,255,255)");
        g.addColorStop(0.67, "rgb(0,255,0)");
        g.addColorStop(0.84, "rgb(255,255,0)");
        g.addColorStop(1,    "rgb(255,0,0)");
        context.fillStyle = g;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        g = context.createLinearGradient(0, 0, 0, this.canvas.height);
        g.addColorStop(0,   "rgba(255,255,255,1)");
        g.addColorStop(0.5, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(0,0,0,0)");
        g.addColorStop(1,   "rgba(0,0,0,1)");
        context.fillStyle = g;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Moves the marquee point to the specified position
    const update = (e) => {
        let x;
        let y;
        let buttons = 1;
        if (e.type === 'touchmove') {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        } else {
            buttons = e.buttons;
            x = e.clientX;
            y = e.clientY;
        }

        if (buttons === 1) {
            let rect = this.el.getBoundingClientRect();
            let left = x - rect.left;
            let top = y - rect.top;
            // Get the color in this pixel
            let pixel = context.getImageData(left, top, 1, 1).data;
            // Position pointer
            this.point.style.left = left + 'px';
            this.point.style.top = top + 'px';
            // Return color
            return rgbToHex(pixel[0], pixel[1], pixel[2]);
        }
    }

    onload(() => {
        context = this.canvas.getContext("2d");
        draw();
    });

    this.color = 'Click to get a color';

    return render => render`<div class="lm-color-hsl" style="width: 200px; height: 160px;">
        <canvas width="200" height="160" :ref="self.canvas"
            onmousedown="${update}"
            onmousemove="${update}"
            ontouchmove="${update}"></canvas>
        <div class="lm-color-point" :ref="self.point"></div>
    </div>`;
}
```

### Style for this section

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