title: DIV onresize - LemonadeJS
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: Learn how to implement a custom DIV onresize event using LemonadeJS and JavaScript Vanilla.

# DIV onresize Example

This Example demonstrates how to track changes in the dimensions of a `DIV` element using LemonadeJS.  
  
## Example

Tracking changes in a DIV dimensions example.  

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Width() {
    const onresize = (e) => {
        console.log('DIV has new dimensions');
    }

    const init = (element) => {
        // Initial values
        let w = element.offsetWidth;
        let h = element.offsetHeight;

        // Track the changes
        element.onmousemove = (e) => {
            if (e.which) {
                if (w !== element.offsetWidth || h !== element.offsetHeight) {
                    w = element.offsetWidth;
                    h = element.offsetHeight;
                    onresize(element);

                    // Update dimensions label
                    this.dimensions = w + ',' + h;
                }
            }
        }
    }

    // Component template
    return render => render`<div class="resizable" :ready="${init}">
        On resize on DIV elements: <b>${this.dimensions}</b>
    </div>`;
}
lemonade.render(Width, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Width() {
    const onresize = (e) => {
        console.log('DIV has new dimensions');
    }

    const init = function(element) {
        // Initial values
        let w = element.offsetWidth;
        let h = element.offsetHeight;

        // Track the changes
        element.onmousemove = (e) => {
            if (e.which) {
                if (w !== element.offsetWidth || h !== element.offsetHeight) {
                    w = element.offsetWidth;
                    h = element.offsetHeight;
                    onresize(element);

                    // Update dimensions label
                    this.dimensions = w + ',' + h;
                }
            }
        }
    }

    // Component template
    return render => render`<div class="resizable" :ready="${init}">
        On resize on DIV elements: <b>${this.dimensions}</b>
    </div>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/div-onresize-uzci2q)



## Pure JavaScript Implementation

For educational purposes, here’s a vanilla JavaScript implementation:  

[DIV onresize example on jsfiddle](https://jsfiddle.net/lemonadejs/ugj7tc0f/)  

{.ignore}
```html
<html>
<script>
function move(e) {
    if ((e.w && e.w !== e.offsetWidth) || (e.h && e.h !== e.offsetHeight)) {
        new Function(e.getAttribute('onresize')).call(e);
    }
    e.w = e.offsetWidth;
    e.h = e.offsetHeight;
}
function resize() {
    console.log('Resized')
}
</script>
<div class='resizable' onresize="resize(this)" onmousemove="move(this)">
Pure vanilla implementation
</div>
</html>
```

### CSS for This Section

Add the following CSS to test these examples:
  
```css
.resizable {
    resize: both;
    overflow: auto;
    width: 200px;
    border: 1px solid black;
    padding: 20px;
}
```