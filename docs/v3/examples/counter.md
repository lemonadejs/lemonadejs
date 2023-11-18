title: Counter,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: A basic counter reactive example using LemonadeJS.

Counter
=======

Simple counter using LemonadeJS. [See this example on codesandbox](https://codesandbox.io/s/lemonadejs-basic-reactive-counter-430pge)

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Counter() {
    const self = this;

    self.count = 1;

    self.add = function() {
        self.count++;
    }

    self.remove = function() {
        self.count--;
    }

    self.reset = function(element) {
        self.count = 0;
    }

    return `<div>
        <p>Count {{self.count}}</p>
        <div>
            <input type="button" onclick="self.add()" value="+" />
            <input type="button" onclick="self.remove()" value="-" />
            <input type="button" onclick="self.reset()" value="Reset" />
        </div>
    </div>`;
};
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Counter() {
    const self = this;

    self.count = 1;

    self.add = function() {
        self.count++;
    }

    self.remove = function() {
        self.count--;
    }

    self.reset = function(element) {
        self.count = 0;
    }

    return `<div class="counter">
        <h1>Count {{self.count}}</h1>
        <div>
            <button onclick="self.add()" class="jbutton dark">+</button>
            <button onclick="self.remove()" class="jbutton dark">-</button>
            <button onclick="self.reset()" class="jbutton dark">Reset</button>
        </div>
    </div>`;
};
```