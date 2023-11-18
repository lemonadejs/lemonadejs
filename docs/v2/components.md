title: LemonadeJS components
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, hooks, components, reusable components
description: Create amazing reactive reusable components using LemonadeJS.

![How to create lemonadeJS components](img/components.svg)

Components
==========

A component is the best way to create reusable features, and it contains two main parts, the self, and the template. The element helps to bind both self (javascript) and the template (HTML) in the same scope making it possible to share properties, objects, and methods.  
  

### Summary of this chapter

The most important points:

*   **The self properties**: All attributes from the component HTML tag will be available in the method as `this`.
*   **Reserved properties**: the parent, el, and refresh are reserved properties in any component.
*   **Dynamic template**: All HTML within a component tag is the template and is part of the function call.
*   **Component refresh**: This is used to re-render the component keeping the self state.
*   **Component declaration**: A custom tag and its methods should have the same name and passed in your call `lemonade.element(template, self, { Component1, Component2, ... })`.

  
  

The self properties
-------------------

All attributes used in the custom component tag in the template will be available as `this` inside the custom component.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
function Hello() {
    // Get the attributes from the tag
    let self = this;

    // Title and year are declared in the parent template
    let template = `<h1>{{self.title}} {{self.year}}</h1>`;

    return lemonade.element(template, self);
}

function Component() {
    let self = {};
    self.value = '2022';
    // title and year will be available inside Hello through (this)
    let template = `<>
            <Hello title="Hello" year="{{self.value}}" />
            <input type="button" value="Next"
                onclick="self.value++" />
        </>`;

    // Please bear in mind to pass Hello to the element scope.
    return lemonade.element(template, self, { Hello });
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
  
  
  

### Reserved self properties

When a self is created from a custom component, the following properties are reserved:

*   parent: the self from the caller;
*   el: the HTML root element;
*   refresh: a method to trigger the refresh bound to a property. Normally used on array operations;

  
  
  

Dynamic template
----------------

Any HTML inside component tag is considered as a template, and it will passed to the component method handler as the first argument.  
  
```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
// Template is based on the caller innerHTML
function Crypto(template) {
    // this received title from the caller
    let self = this;
    // Create the component
    return lemonade.element(template, self)
}

function Component() {
    let self = {}

    // The innerHTML of Crypto is the template for the component
    let template = `<>
            <h3>Example</h3>
            <Crypto title="Bitcoin">
                <b>Coin: {{self.title}}</b>
            </Crypto>
        </>`;

    return lemonade.element(template, self, { Crypto });
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
  
  
  

Component refresh
-----------------

It is important to notice in the examples above that the components `Hello` and `Crypto` are included in the third argument of `lemonade.element`. This is because, the component reference should be available in the same scope of the template during the rendering.  

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
const Element = function() {
    var self = this;

    if (self.type) {
        var template = `<div>
            <select @bind="self.value">
                <option value=""></option>
                <option value="test">test</option>
            </select><br/>
            <input type="button" value="Update type"
                   onclick="self.type = !self.type; self.refresh();" />
        <div>`;
    } else {
        var template = `<div>
            <input type="text" @bind="self.value" /><br/>
            <input type="button" value="Update type"
                   onclick="self.type = !self.type; self.refresh();" />
        <div>`;
    }

    return lemonade.element(template, self);
}

function Form() {
    let self = {}

    // The innerHTML of Crypto is the template for the component
    let template = `<>
            <h3>Form</h3>
            <Element type="1" />
        </>`;

    return lemonade.element(template, self, { Element });
}
lemonade.render(Form, document.getElementById('root'));
</script>
</html>
```
  
  
  

Component declaration
---------------------

It is important to notice in the examples above that the components `Hello` and `Crypto` are included in the third argument of `lemonade.element`. This is because, the component reference should be available in the same scope of the template during the rendering.  