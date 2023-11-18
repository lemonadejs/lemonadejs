title: Star rating
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: How to implement a simple reactive javascript five star rating implementation using LemonadeJS.

Rating
======

A LemonadeJS self property can be bound to an HTML DOM element attribute. In this sense, the HTML elements will automatically update when a self property value changes.  
  

Examples
--------

A basic star rating implementation  
  

  
  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Rating = (function() {
    var self = {}

    // Five stars
    self.stars = [{},{},{},{},{}];

    // Current clicked star self
    var current = null;

    self.click = function(s) {
        // If the self of the clicked item is not selected reset the null
        if (! s.selected) {
            current = null;
        }
        // Get the position of the self of the clicked item
        var index = self.stars.indexOf(s);
        // Go through all stars and define select or non selected
        for (var i = 0; i < self.stars.length; i++) {
            if (i <= index && s !== current) {
                self.stars[i].selected = 1;
                self.stars[i].el.style.color = 'red';
            } else {
                self.stars[i].selected = 0;
                self.stars[i].el.style.color = '';
            }
        }
        // Keep the the self of the last item clicked
        current = s;
    }

    var template = `
        <div @loop="self.stars" style="cursor: pointer">
            <i class="material-icons"
                onclick="self.parent.click(self)">{{self.selected ? 'star' : 'star_outline'}}</i>
        </div>`;

    return lemonade.element(template, self);
}

lemonade.render(Rating, document.getElementById('root'));
</script>
</html>
```