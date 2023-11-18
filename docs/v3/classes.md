title: Creating LemonadeJS Components as JavaScript Classes,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, classes,
description: Dive into LemonadeJS's reactive classes, and learn how to build components as JavaScript classes for modular and maintainable code.

Classes
=======

You can also create reusable LemonadeJS components using JavaScript classes. Remember that {self} references {this} within any LemonadeJS class. That allows you to update internal attributes or call class methods from the self within the template, as demonstrated in the example below.  
  

Example
-------

It is possible to create lemonade components using JavaScript classes, as seen in the example below.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
class Counter extends lemonade.component {
    constructor(self) {
        super(self);
        this.count = 1;
    }

    counter() {
        this.count++;
    }

    render() {
        return `<>
            <div>Counter: {{self.count}}</div><br>
            <input type='button' onclick="self.counter()" value='Go' />
            <input type='button' onclick="self.count = 0" value='Reset' />
        </>`;
    }
}
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default class Counter extends lemonade.component {
    constructor(self) {
        super(self);
        this.count = 1;
    }

    counter() {
        this.count++;
    }

    render() {
        return `<>
            <div>Counter: {{self.count}}</div><br>
            <input type='button' onclick="self.counter()" value='Go' />
            <input type='button' onclick="self.count = 0" value='Reset' />
        </>`;
    }
}
```

See this [working example](https://codesandbox.io/s/lemonadejs-examples-sebfeo) on codesandbox.

### Next Chapter

The next Chapter presents how to create a reactive Webcomponents using LemonadeJS.  
  
[Next chapter: Webcomponents](/docs/web-components)