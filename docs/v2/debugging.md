title: Debug and troubleshooting
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, troubleshooting, debug, debugging
description: A summary of the most common problems and solutions when creating LemonadeJS components. A guide of debugging and troubleshooting LemonadeJS components.

Debugging
=========

This section presents the most common problems when dealing with LemonadeJS.  
  

The Scope
---------

LemonadeJS works differently from other libraries when dealing with variables and the template. It does not require transpile, and the variables won't be available at the renderer scope when the HTML is processed.  
  

### The Problem

The following the example will thrown an error because test is not in the same scope when the template is created and appended to the DOM.  
  
```javascript
var Component = (function() {
    // Self object
    var self = {};
    // The test variable
    var test = 123;
    // This will raise an error, since test does not exist when the template is created
    var template = `<div>{{test*10}}</div>`;
    // Render the template
    return lemonade.element(template, self);
});
// Generate the component and append to the DOM
lemonade.render(Component, document.getElementById('root'));
```

  
**The following example is not the ideal solution**, but it is possible to pre-process the information before the LemonadeJS renderer. But of course, you won't be able to pass objects or functions from your component to the view.  
  
```javascript
var Component = (function() {
    // The self object
    var self = {};
    // Create the variable
    var test = 123;
    // Render the javascript and add the result to the template
    var template = `<div>${test*10}</div>`;
    // Render the element
    return lemonade.element(template, self);
});
// Render the element to the DOM
lemonade.render(Component, document.getElementById('root'));
```

  
  

### The Solution

Using the `self` you can share properties, objects, and methods with your view. That will bind the property to the HTML and create a property observer. Thus, any change in the property value will reflect in the View.  
  
```javascript
var Component = (function() {
    // Create the self object
    var self = {};
    // Create the property
    self.test = 123;
    // The self is bound to the template and changes in the self.test value will be updated in the view.
    var template = `<div>{{self.test * 10}}</div>`;
    // Render the template and create the observer for the self
    return lemonade.element(template, self);
});
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
```
  
  

Empty custom tags
-----------------

If you add a component to the template, and you have an empty tag resulted. The probable cause is that the component reference is missing in your call to `lemonade.element(template, self, { missingComponent }).`  
  
```javascript
import Custom from "./custom";

export default function Test() {
    // Create the self object
    let self = {};
    // Add custom the template
    var template = `<div><Custom /></div>`;
    // Any component used in the template, should be declared as below.
    // If Custom is not declared as below, the result would be a blank tag.
    return lemonade.element(template, self, { Custom });
}
```  

Non reactive arrays
-------------------

There is a limitation on the observer when dealing with arrays. For example, it is not possible to trigger the reaction of LemonadeJS when adding or removing items from an array in the self. For that reason, you must call self.refresh('nameOfTheProperty');  
  
```javascript
const Cryto = function() {
    let self = {};

    self.data = [
        { title: 'BTC' },
        { title: 'ETH' },
        { title: 'LTC' },
    ];

    self.add = function() {
        // Adding a new option in the array require the refresh.
        self.data.push({ title: 'ZPH' })
        // Trigger the reaction
        self.refresh('data');
    }

    // @Loop on real tag: the ul.innerHTML is the template used as a template for each item of the array.
    let template = `<ul @loop="self.data">
            <li>{{self.title}}</li>
        </ul>`;

    return lemonade.element(template, self);
}
```