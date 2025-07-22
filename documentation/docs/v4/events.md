title: LemonadeJS Core Events,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, events, javascript events,
description: Utilize LemonadeJS events to design custom component responses and interactions.

LemonadeJS events
=================

This chapter will describe more about the two native events and the JavaScript event object (e). That can be defined inside your component to treat further and advance behavior.

| Event                                | Description                                                                                                                                                                                                                                                                                              |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| onload(component: DOMElement)        | It happens when the component is mounted and ready in the DOM.  <br>`self.onload(component: DOMElement) => void`                                                                                                                                                                                         |
| onchange(property, affectedElements) | It happens when the value of a self property in observation is updated.  <br>`self.onchange(property: string, affected: object) => void`  <br>`@param property` \- self property that triggered the event.  <br>`@param affectedElements` \- When the same property is bound to different HTML elements. |
  

Examples
--------

### When a property value changes

There is a call to the method `self.onchange` when the value of a self property in observation changes. A self property is automatically added to the list of observable properties when this self property is included in the DOM.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Create the self object
    const self = this;
    self.onchange = function(property) {
        // It will be called when counter is updated
        alert('The self property: ' + property + ' is updated');
    }
    // Create the property
    self.counter = 1;
    // Template
    return `<>
        <p>{{self.counter}}</p>
        <input type="button" value="Counter+1" onclick="self.counter++;"/>
    </>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    // Create the self object
    const self = this;
    self.onchange = function(property) {
        // It will be called when counter is updated
        alert('The self property: ' + property + ' is updated');
    }
    // Create the property
    self.counter = 1;
    // Template
    return `<>
        <p>{{self.counter}}</p>
        <input type="button" value="Counter+1" onclick="self.counter++;"/>
    </>`;
}
```

[See this example on codesandbox](https://codesandbox.io/s/javascript-events-re4bwy)

  
  

### When the component is ready

The component method `self.onload` will be called when the component is ready and appended to the DOM.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Create the self object
    const self = this;
    self.onload = function(element) {
        // It will be called when the component is ready
        self.container.style.color = 'red';
    }
    // Template
    return `<div :ref="self.container">My component</div>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    // Create the self object
    const self = this;
    self.onload = function(element) {
        // It will be called when the component is ready
        self.container.style.color = 'red';
    }
    // Template
    return `<div :ref="self.container">My component</div>`;
}
```
 
The event object
----------------

From version 2.2.4 you can pass the event object (e) from the template to any event handler, as example below.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Create the self object
    const self = this;
    self.test = function(e) {
        console.log(e);
        e.preventDefault();
    }
    // The event object will be included
    return `<input type="button" value="Click here" onclick="self.test(e);"/>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    // Create the self object
    const self = this;
    self.test = function(e) {
        console.log(e);
        e.preventDefault();
    }
    // The event object will be included
    return `<input type="button" value="Click here" onclick="self.test(e);"/>`;
}
```

The console shows the event object.