title: Debugging LemonadeJS Components: Troubleshooting & Solutions,
keywords: LemonadeJS, debugging, troubleshooting, frontend, javascript library, reactive components,
description: This handy debugging and troubleshooting guide identifies and resolves common issues when creating LemonadeJS components.

Debugging
=========

This section presents the most common problems when working with LemonadeJS.  
  

The Scope
---------

LemonadeJS works differently from other libraries when dealing with variables and the template. It does not require transpile, and the variables won't be available at the renderer scope when the HTML is processed.  
  

### The Problem

The following example throws an error because the variable test is not in the same scope when the template is created and appended to the DOM.  
  
```javascript
function Component() {
    // Self object
    const self = this;
    // The test variable
    let test = 123;
    // This will raise an error, since test does not exist when the template is created
    return `<div>{{test*10}}</div>`;
}
// Generate the component and append to the DOM
lemonade.render(Component, document.getElementById('root'));
```

  
The following example gives you the correct value but won't bring any reactivity to your template.  
  

```javascript
function Component() {
    // The self object
    const self = this;
    // Create the variable
    let test = 123;
    // Render the javascript and add the result to the template
    return `<div>${test*10}</div>`;
}
// Render the element to the DOM
lemonade.render(Component, document.getElementById('root'));
```
  
  

### The Solution

You can use the self on your template to get the best of the reactivity, as below.  
  

```javascript
function Component() {
    // Create the self object
    const self = this;
    // Create the property
    self.test = 123;
    // The self is bound to the template and changes in the self.test value will be updated in the view.
    return `<div>{{self.test*10}}</div>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
```
  
  

Empty custom tags
-----------------

If you have a non-rendered custom component tag in the DOM, you will need to register the component with one of the following options:  

*   `lemonade.element(template, self, { missingComponent });`
*   `lemonade.setComponents({ missingComponent });`

  
```javascript
import Custom from "./custom";

export default function Test() {
    // Create the self object
    const self = this;
    // Add custom the template
    var template = `<div><Custom /></div>`;
    // Any component used in the template, should be declared as below.
    // If Custom is not declared as below, the result would be a blank tag.
    return lemonade.element(template, self, { Custom });
}
```
  
  
  

Non-reactive arrays
-------------------

There is a limitation on the observer when dealing with arrays. For example, there are no automatic reactions when adding or removing items from an array in the self. For that reason, you must call self.refresh('nameOfTheProperty');  
  
```javascript
const Cryto = function() {
    const self = this;

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
    return `<ul :loop="self.data">
            <li>{{self.title}}</li>
        </ul>`;
}
```