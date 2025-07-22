title: JavaScript Star Rating Component Example
keywords: LemonadeJS, two-way data binding, frontend, JavaScript library, JavaScript plugin, JavaScript, reactive, React, examples
description: Learn how to implement a simple reactive five-star rating component using LemonadeJS.

# JavaScript Five-Star Rating Example

This example demonstrates a basic `five-star rating` component built with LemonadeJS and a loop.

{.green}
> **Note**: Requires Material Icon\
> \<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

```html
<html>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Rating() {
    // Current clicked star self
    let current = null;
    // Five stars
    this.stars = [{},{},{},{},{}];
    // Click event
    this.click = (e, s) => {
        // If the self of the clicked item is not selected reset the null
        if (! s.selected) {
            current = null;
        }
        // Get the position of the self of the clicked item
        let index = this.stars.indexOf(s);
        // Go through all stars and define select or non selected
        for (let i = 0; i < this.stars.length; i++) {
            // Apply value to the self of the child
            this.stars[i].selected = (i <= index && s !== current);
        }
        // Keep the self of the last item clicked
        current = s;
    }

    return render => render`<div :loop="${this.stars}" class="stars">
        <i class="material-icons" onclick="this.parent.click" data-selected="{{self.selected}}"></i>
    </div>`;
}
lemonade.render(Rating, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Rating() {
    // Current clicked star self
    let current = null;
    // Five stars
    this.stars = [{},{},{},{},{}];
    // Click event
    this.click = (e, s) => {
        // If the self of the clicked item is not selected reset the null
        if (! s.selected) {
            current = null;
        }
        // Get the position of the self of the clicked item
        let index = this.stars.indexOf(s);
        // Go through all stars and define select or non selected
        for (let i = 0; i < this.stars.length; i++) {
            // Apply value to the self of the child
            this.stars[i].selected = (i <= index && s !== current);
        }
        // Keep the self of the last item clicked
        current = s;
    }

    return render => render`<div :loop="${this.stars}" class="stars">
        <i class="material-icons" onclick="this.parent.click" data-selected="{{self.selected}}"></i>
    </div>`;
}
```

## CSS for This Section

You need to include the following CSS.

```css
.stars > i::after {
    font-family: 'material icons',serif;
    font-size: 24px;
    content: 'star_outline';
    cursor: pointer;
}

.stars > i[data-selected='true']::after {
    content: 'star';
    color: red;
}
```

# More Resources

- [JS Rating Component](/docs/plugins/rating)
