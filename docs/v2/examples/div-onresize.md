title: DIV onresize
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: Learn how to implement a custom DIV onresize event using LemonadeJS

DIV onresize
============

There is no support via native JavaScript to track changes in the width and height of a DIV. So, in the following example, we will show a simple implementation to track the changes in dimensions of a DIV using LemonadeJS.  
  

Example
-------

Tracking changes in a DIV dimensions example  
  

  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Width = (function() {
    var self = {};

    self.init = function(element) {
        // Initial values
        var w = element.offsetWidth;
        var h = element.offsetHeight;

        // Track the changes
        element.onmousemove = function(e) {
            if (e.which) {
                if (w !== element.offsetWidth || h !== element.offsetHeight) {
                    w = element.offsetWidth;
                    h = element.offsetHeight;
                    self.onresize(element);

                    // Update dimensions label
                    self.dimensions = w + ',' + h;
                }
            }
        }
    }

    self.onresize = function(element) {
        console.log('DIV has new dimensions');
    }

    // Component template
    var template = `<div class="resizable" @ready="self.init(this)">
        On resize on DIV elements: <span>{{self.dimensions}}</span>
        </div>`;

    return lemonade.element(template, self);
});

lemonade.render(Width, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-onresize-div-td5ng)

  

A pure vanilla implementation
-----------------------------

Although this site is dedicated to LemonadeJS, for education purposes, we present you with a pure javascript vanilla implementation using onmousemove.  
  

Pure vanilla implementation

  
[DIV onresize example on jsfiddle](https://jsfiddle.net/lemonadejs/ugj7tc0f/)  
  

### Source code

```html
<html>
<script>
var move = function(e) {
    if ((e.w && e.w !== e.offsetWidth) || (e.h && e.h !== e.offsetHeight)) {
        new Function(e.getAttribute('onresize')).call(e);
    }
    e.w = e.offsetWidth;
    e.h = e.offsetHeight;
}
var resize = function() {
    console.log('Resized')
}
</script>
<div class='resizable' onresize="resize(this)" onmousemove="move(this)">
Pure vanilla implementation
</div>
</html>
```
  
  

### The CSS used for this section

If you wish to test the examples of this section, please copy this CSS to your project.  
  
```css
.resizable {
    resize: both;
    overflow: auto;
    width: 200px;
    border: 1px solid black;
    padding: 20px;
}
```
