title: Debugging
keywords: Lemonadejs, two-way binding, frontend, javascript library, javascript plugin, javascript, quick reference
description: A summary of the main concepts, methods and events when using LemonadeJS.

![Most common problems and debug suggestions](img/debug.png)

Debugging
=========

The most common problems when dealing with LemonadeJS is the a undefined root element where you would like to render your component.

Scope
-----

LemonadeJS works a bit different from other libraries, when running the javascript embedded in the template. Because it not depends on transpiler, any javascript will not run in the same scope of the element and therefore the only available variable would be the `self`.  
  

### The Problem

The folling example will thrown an error because test is not in the same scope when the embedded javascript code is executed.  
  
```javascript
var Component = (function(root) {
    var test = 123
    var template = `<div>{{test * 10}}</div>`;
    return lemonade.element(template, self);
})
lemonade.render(Component, document.getElementById('root'));
```

  
  
If you need to run a javascript code in the same scope of the component you need to use something closedly to vanilla JS. So, the solution for that would be:  
  

```javascript
var Component = (function(root) {
    var self = {};
    self.test = 123;
    var template = `<div>${test * 10}</div>`;
    return lemonade.element(template, self);
})
lemonade.render(Component, document.getElementById('root'));
```
  

### The Solution

But, if you adapt your code to use the lemonade `self` the libraryk will track the changes in the variables and update the view, the scope solution among other advantages.

```javascript
var Component = (function(root) {
    var self = {};
    self.test = 123;
    var template = `<div>{{self.test * 10}}</div>`;
    return lemonade.element(template, self);
})
lemonade.render(Component, document.getElementById('root'));
```