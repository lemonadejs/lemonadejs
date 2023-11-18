title: LemonadeJS classes
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, classes
description: How to create a LemonadeJS component as a JavaScript class. More about the LemonadeJS reactive classes.

Classes
=======

It is also possible to create reusable LemonadeJS components as JavaScript classes. The most important point when dealing with classes is that the `self` object is a reference to the `this` in the class. Thus, you can update internal attributes or invoke the class methods from the self into the template as in the example below.  
  

Example
-------

It is possible to create lemonade components using JavaScript classes as example below.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
class Counter extends lemonade.component {
    constructor() {
        super();
        this.count = 1;
    }

    counter() {
        this.count++;
    }

    render() {
        return `
            <>
            <div>Counter: {{self.count}}</div><br>
            <input type='button' onclick="self.counter()" value='Go' />
            <input type='button' onclick="self.count = 0" value='Reset' />
            </>
        `;
    }
}
lemonade.render(Counter, document.getElementById('root'));
</script>
</html>
```

See this [working example](https://codesandbox.io/s/lemonadejs-examples-r0ymc) on codesandbox.
