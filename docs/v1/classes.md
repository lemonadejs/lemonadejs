title: Component Classes
keywords: Lemonadejs, two-way binding, frontend, javascript library, javascript plugin, javascript, classes
description: How to create LemonadeJS components as javascript classes.

Classes
=======

It is also possible to create reusable LemonadeJS components from JavaScript classes. The most important point when dealing with classes is that the `self` object is a reference to the `this` inside the class. Thus, you can update internal attributes or invoke the class methods from the self into the template as in the example below.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
class Counter extends lemonade.component {
    constructor(o) {
        super();
        this.count = 1;
    }

    counter() {
        this.count++;
    }

    render() {
        return `
            <div>{{self.count}}</div>
            <input type='button' onclick="self.counter()" value='Go' />
            <input type='button' onclick="self.count = 0" value='Reset' />
        `;
    }
}
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```

See this [working example](https://codesandbox.io/s/lemonadejs-examples-r0ymc) on codesandbox.