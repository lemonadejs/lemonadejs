title: Star rating,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: How to implement a simple reactive javascript five star rating implementation using LemonadeJS.

Rating
======

A LemonadeJS `{self}` property can be bound to an HTML DOM element attribute. In this sense, the HTML elements will automatically update when a property value changes.  
  

Examples
--------

A basic star rating implementation  

### Source code

```html
<html>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Rating() {
    const self = this;

    // Five stars
    self.stars = [{},{},{},{},{}];

    // Current clicked star self
    let current = null;

    self.click = function(e, s) {
        // If the self of the clicked item is not selected reset the null
        if (! s.selected) {
            current = null;
        }
        // Get the position of the self of the clicked item
        let index = self.stars.indexOf(s);
        // Go through all stars and define select or non selected
        for (let i = 0; i < self.stars.length; i++) {
            // What is the value
            let value = (i <= index && s !== current) ? 1 : 0;
            // Apply value to the self of the child
            self.stars[i].selected = value;
            self.stars[i].el.style.color = value ? 'red' : '';
        }
        // Keep the the self of the last item clicked
        current = s;
    }

    return `<div :loop="self.stars" style="cursor: pointer">
        <i class="material-icons" onclick="self.parent.click">{{self.selected ? 'star' : 'star_outline'}}</i>
    </div>`;
}
lemonade.render(Rating, document.getElementById('root'));
</script>
</html>
```
```javascript
// Add to your HTML: <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
import lemonade from 'lemonadejs';

export default function Rating() {
    const self = this;

    // Five stars
    self.stars = [{},{},{},{},{}];

    // Current clicked star self
    let current = null;

    self.click = function(e, s) {
        // If the self of the clicked item is not selected reset the null
        if (! s.selected) {
            current = null;
        }
        // Get the position of the self of the clicked item
        let index = self.stars.indexOf(s);
        // Go through all stars and define select or non selected
        for (let i = 0; i < self.stars.length; i++) {
            // What is the value
            let value = (i <= index && s !== current) ? 1 : 0;
            // Apply value to the self of the child
            self.stars[i].selected = value;
            self.stars[i].el.style.color = value ? 'red' : '';
        }
        // Keep the the self of the last item clicked
        current = s;
    }

    return `<div :loop="self.stars" style="cursor: pointer">
        <i class="material-icons" onclick="self.parent.click">{{self.selected ? 'star' : 'star_outline'}}</i>
    </div>`;
}
```