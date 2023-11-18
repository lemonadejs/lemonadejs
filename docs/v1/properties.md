title: Special properties
keywords: Lemonadejs, two-way binding, frontend, javascript library, javascript plugin, javascript, special properties
description: The LemonadeJS special properties are used to help in create actions between the view and the controllers.

![LemonadeJS component special attributes](img/properties.png)

Special properties
==================

LemonadeJS brings only three special properties: `@ref`, `@bind` and `@ready`. Those properties starts with @ and will be used in the template during the binding of the `self` to the template. Those methods would help to create great components with the minimum code possible.  
  
  

Quick reference to a DOM element with @ref
------------------------------------------

The `@ref` will create a property in the self and reference it to a existing real DOM element. That can be used to perform arbitraries read-write operation in the DOM element at any time. The following example will create a JavaScript calendar input from a simple input when the user triggers the button.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<script src="https://jsuites.net/jsuites.js"></script>
<link rel="stylesheet" href="https://jsuites.net/jsuites.css" type="text/css" />

<div id='root'></div>

<script>
var Calendar = (function() {
    var self = {};
    self.createSomething = function() {
        jSuites.calendar(self.reference);
    }

    var template = `<div>
        <input @ref='self.reference' />
        <input type='button' onclick='self.createSomething()'
            value='Create a instance of the calendar' /></div>`;

    return lemonade.template(template, self);
});

lemonade.render(Calendar, document.getElementById('root'));
</script>
</html>
```

### Example

  
  

Tracking changes in an element with @bind
-----------------------------------------

The `@bind` will bind the value of the HTML element into the self and create a change listener to keep synchronization between the element value and the defined self property. That is the most straight forward to achieve two-way binding using Lemonadejs.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var Binding = (function() {
    var self = {};
    self.name = 'Ringo';
    var template = `<div><span>{{self.name}}</span><br/><br/>
        <select @bind='self.name'>
        <option>John</option>
        <option>Paul</option>
        <option>George</option>
        <option>Ringo</option>
        </select>
        </div>`;

    return lemonade.element(template, self);
});
lemonade.render(Binding, document.getElementById('root'));
</script>
</html>
```

### Example

  
  

Callback a method when the element is appended to the DOM with @ready
---------------------------------------------------------------------

The `@ready` will call the defined method as soon as the element is ready and appended into the DOM. The following example creates an instance of the jSuites color picker.  
  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<script src="https://jsuites.net/jsuites.js"></script>
<link rel="stylesheet" href="https://jsuites.net/jsuites.css" type="text/css" />
<div id='root'></div>
<script>
(function(root) {
    var self = {};
    // This method will be called when the input is appended to the DOM
    self.create = function(element) {
        jSuites.color(element);
    }
    var template = `<input @ready='self.create(this)'/>`;

    return lemonade.blender(template, self, root);
})(document.getElementById('root'));
</script>
</html>
```

### Example

In previous examples, we have used `lemonade.template, lemonade.render and lemonade.blender`. In the next section we will see all methods available that will help you to adapt lemonadejs your needs.

Next section: [lemonadejs methods](/docs/v1/methods)