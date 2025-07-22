title: JavaScript Reactive Counter Example
keywords: LemonadeJS, two-way data binding, frontend, JavaScript library, JavaScript, reactive, React, examples
description: A basic counter reactive example using LemonadeJS.
canonical: https://lemonadejs.com/docs/examples/counter

# Reactive Counter Example

This example demonstrates how to create a simple reactive counter using LemonadeJS.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;
function Counter() {
    // Create a state object
    let count = state(0);

    // Update state methods
    const add = function() {
        count.value++;
    }

    const remove = function() {
        count.value--;
    }

    const reset = function() {
        count.value = 0;
    }

    return render => render`<div>
        <p>Count ${count}</p>
        <div>
            <input type="button" onclick="${add}" value="+" />
            <input type="button" onclick="${remove}" value="-" />
            <input type="button" onclick="${reset}" value="Reset" />
        </div>
    </div>`;
};
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Counter() {
    let count = state(0);

    const add = function() {
        count++;
    }

    const remove = function() {
        count--;
    }

    const reset = function() {
        count = 0;
    }

    return render => render`<div>
        <p>Count ${count}</p>
        <div>
            <input type="button" onclick="${add}" value="+" />
            <input type="button" onclick="${remove}" value="-" />
            <input type="button" onclick="${reset}" value="Reset" />
        </div>
    </div>`;
};
```

