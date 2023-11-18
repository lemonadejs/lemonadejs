
title: JavaScript Events
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, events, javascript events
description: The LemonadeJS events helps to create custom reactions on your components.

LemonadeJS Events
=================

This chapter will describe more about the two native events and the JavaScript event object (e).  

| Event | Description                                                                                                                                                                                                                                                                                                                             |
| --- |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| onload(component: DOMElement) | It happens when the component is mounted and ready in the DOM.                                                                                                                                                                                                                             `self.onload(component: DOMElement) => void` |
| onchange(property, affectedElements) | It happens when the value of a self property in observation is updated. `self.onchange(property: string, affected: object) => void` `@param property` - self property that triggered the event.   `@param affectedElements` - When the same property is bound to different HTML elements.                                               |

Examples
--------

### When a property value changes

There is a call to the method `self.onchange` when the value of a self property in observation changes. A self property is automatically added to the list of observable properties when this self property is included in the DOM.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Component = (function() {
    // Create the self object
    var self = {};
    self.onchange = function(property) {
        // It will be called when counter is updated
        alert('The self property: ' + property + ' is updated');
    }
    // Create the property
    self.counter = 1;
    // Template
    var template = `<>
        <div>{{self.counter}}</div>
        <input type="button" value="Counter+1"
            onclick="self.counter++;"/>
        </>`;
    // Render the template and create the observation
    return lemonade.element(template, self);
});
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-events-example-1qppb)

  
  

### When the component is ready

The component method `self.onload` will be called when the component is ready and appended to the DOM.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Component = (function() {
    // Create the self object
    var self = {};
    self.onload = function(element) {
        // It will be called when the component is ready
        self.container.style.color = 'red';
    }
    // Template
    var template = `<div @ref="self.container">
        My component
    </div>`;
    return lemonade.element(template, self);
});
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
  
  
  

The event object
----------------

From version 2.2.4 you can pass the event object (e) from the template to any event handler, as example below.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Component = (function() {
    // Create the self object
    var self = {};
    self.test = function(e) {
        console.log(e);
        e.preventDefault();
    }
    // The event object will be included
    var template = `<>
        <input type="button" value="Click test"
            onclick="self.test(e);"/>
        </>`;
    // Render the template and create the observation
    return lemonade.element(template, self);
});
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```

The event will be shown on the console