title: LemonadeJS Class Components - Building Reactive Interfaces
keywords: LemonadeJS, JavaScript Classes, Reactive UI, Two-Way Binding, Frontend Development, JavaScript Library, Reactivity, Comparable to React, Vue, Angular
description: Discover how to create highly reactive and dynamic JavaScript class components with LemonadeJS. This guide provides insights into building frontend applications using LemonadeJS, emphasizing its unique approach to two-way data binding and reactivity, comparable to popular frameworks like React, Vue, and Angular.

Classes
=======

LemonadeJS components can be created using JavaScript classes. This approach ensures both reusability and encapsulation of component logic. LemonadeJS offers a `self` reference within these classes in any class context. This reference facilitates updating internal attributes and invocating class methods directly from within the template. The following example illustrates the process of creating LemonadeJS components using JavaScript classes.  


Example
-------

The following code snippet shows a LemonadeJS component as a class:
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
class Counter extends lemonade.component {
    constructor(self) {
        super(self);
        this.count = 1;
    }

    render() {
        return `<>
            <div>Counter: {{self.count}}</div><br>
            <input type='button' onclick="self.count++" value='Go' />
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

    render() {
        return `<>
            <div>Counter: {{self.count}}</div><br>
            <input type='button' onclick="self.count++" value='Go' />
            <input type='button' onclick="self.count = 0" value='Reset' />
        </>`;
    }
}
```

See this [working example](https://codesandbox.io/s/lemonadejs-examples-sebfeo) on codesandbox.

### Next Chapter

The next Chapter presents how to create a reactive Web-components using LemonadeJS.  
  
[Next chapter: Web-components](/docs/web-components){.button .main}