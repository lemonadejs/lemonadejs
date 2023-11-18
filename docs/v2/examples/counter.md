title: Counter
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples
description: A basic counter reactive example using LemonadeJS.

Counter
=======

Simple counter using LemonadeJS.  
  

Example
-------

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-basic-reactive-counter-o9i0o)

  

### Source code

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Counter = (function() {
    var self = {
        count: 0
    };

    self.add = function() {
        self.count++;
    }

    self.remove = function() {
        self.count--;
    }

    self.reset = function(element) {
        self.count = 0;
    }

    var template = `
        <div class="counter">
            <h1>Count {{self.count}}</h1>
            <div>
                <button onclick="self.add()" class="jbutton dark">+</button>
                <button onclick="self.remove()" class="jbutton dark">-</button>
                <button onclick="self.reset()" class="jbutton dark">Reset</button>
            </div>
        </div>
    `;

    return lemonade.element(template, self);
});

lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```
