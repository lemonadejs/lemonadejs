title: Building Reactive Classes with LemonadeJS
keywords: LemonadeJS, JavaScript Classes, Reactive UI, Two-Way Data Binding, Frontend Development, JavaScript Library, Reactivity, React Alternative, Vue Alternative, Angular Alternative
description: Learn to build reactive JavaScript class components with LemonadeJS, leveraging two-way data binding and reactivity as a lightweight alternative to React, Vue, and Angular.
canonical: https://lemonadejs.com/docs/classes

# Reactive Classes

LemonadeJS supports creating components with JavaScript classes, ensuring re-usability and encapsulation. Using reference to the object `this`, you can update attributes and invoke class methods directly within the template.

## Example

Here’s how to create a LemonadeJS component using a JavaScript class:
  
```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { component } = lemonade;

class Counter extends component {
    render() {
        // Initial value
        this.count = 1;
        return render => render`<div>
            <div>Counter: ${this.count}</div><br>
            <input type='button' onclick="${() => this.count++}" value='Go' />
            <input type='button' onclick="${() => this.count = 0}" value='Reset' />
        </div>`;
    }
}
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```
```javascript
import { component } from 'lemonadejs';

export default class Counter extends component {
    constructor(self) {
        super(self);
        // Initial value
        this.count = 1;
    }

    render() {
        return render => render`<div>
            <div>Counter: ${this.count}</div><br>
            <input type='button' onclick="${() => this.count++}" value='Go' />
            <input type='button' onclick="${() => this.count = 0}" value='Reset' />
        </div>`;
    }
}
```

See this [working example](https://codesandbox.io/s/lemonadejs-examples-sebfeo) on codesandbox.

### Next Chapter

The next Chapter presents how to create a reactive Web-components using LemonadeJS.  
  
[Web Components](/docs/web-components){.button}