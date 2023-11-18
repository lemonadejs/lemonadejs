title: LemonadeJS Components: Create Reusable Reactive UI Components,
keywords: LemonadeJS, reusable components, reactive UI, frontend, javascript library, components, hooks,
description: Learn how to create reusable and reactive UI components with LemonadeJS, enhancing your web applications with a modular approach.

![Reactive components](img/components.svg){style="max-height: 220px"}

Components
==========

A component is an ideal solution for creating reusable features. It consists of two main parts: the self (JavaScript) and the template (HTML). LemonadeJS facilitates binding both the self and the template within the same scope, enabling seamless sharing of properties, objects, and methods between them.  

{.green}
> **Summary of this chapter**
>
> The most important points:
>
> -   **The self properties**: All attributes from the component HTML tag will be available in the method as `this`.
> -   **Reserved properties**: the parent, el, and refresh are reserved properties in any component.
> -   **Dynamic template**: All HTML within a component tag is the template and is part of the function call.
> -   **Component refresh**: This is used to re-render the component keeping the self state.
> -   **Component declaration**: A custom tag and its methods should have the same name and passed in your call `lemonade.element(template, self, { Component1, Component2, ... })`.

  
  

The self properties
-------------------

All attributes used in the custom component tag in the template will be available as `this` inside the custom component.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Hello() {
    // Get the attributes from the tag
    const self = this;
    // Title and year are declared in the parent template
    return `<p>{{self.title}} {{self.year}}</p>`;
}

function Component() {
    const self = this;
    self.value = '2023';
    // title and year will be available inside Hello through (this)
    return `<>
        <Hello title="Hello" year="{{self.value}}" />
        <input type="button" value="Next"
            onclick="self.value++" />
    </>`;
}
// Register custom tags
lemonade.setComponents({ Hello });
// Render the component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

function Hello() {
    // Get the attributes from the tag
    const self = this;
    // Title and year are declared in the parent template
    return `<h1>{{self.title}} {{self.year}}</h1>`;
}

// Register custom tags
lemonade.setComponents({ Hello });

export default function Component() {
    const self = this;
    self.value = '2023';
    // title and year will be available inside Hello through (this)
    return `<>
        <Hello title="Hello" year="{{self.value}}" />
        <input type="button" value="Next"
            onclick="self.value++" />
    </>`;
}
```

> ### Reserved self properties
>
> When a self is created from a custom component, the following properties are reserved:
>
> *   **parent**: the self from the caller;
> *   **el**: the HTML root element;
> *   **refresh**: a method to trigger the refresh bound to a property. Normally used on array operations;

  
  
  

Dynamic template
----------------

Any HTML inside component tag is considered as a template, and it will passed to the component method handler as the first argument.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
// Template is based on the caller innerHTML
function Crypto(template) {
    // this received title from the caller
    const self = this;
    // Create the component
    return template;
}

function Component() {
    let self = this

    // The innerHTML of Crypto is the template for the component
    return `<>
        <Crypto title="Bitcoin">
            <b>Coin: {{self.title}}</b>
        </Crypto>
    </>`;
}
// Register custom tags
lemonade.setComponents({ Crypto });
// Render the component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

// Template is based on the caller innerHTML
function Crypto(template) {
    // this received title from the caller
    const self = this;
    // Create the component
    return template;
}

// Register custom tags
lemonade.setComponents({ Crypto });

export default function Component() {
    let self = this

    // The innerHTML of Crypto is the template for the component
    return `<>
        <p>Example</p>
        <Crypto title="Bitcoin">
            <b>Coin: {{self.title}}</b>
        </Crypto>
    </>`;
}
```
  
  
  

Component refresh
-----------------

It is important to notice in the examples above that the components `Hello` and `Crypto` are included in the third argument of `lemonade.element`. This is because, the component reference should be available in the same scope of the template during the rendering.  


```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
function Test() {
    let self = this;
    if (self.type) {
        return `<select :bind="self.value">
            <option value=""></option>
            <option value="test">test</option>
        </select>`;
    } else {
        return `<input type="text" :bind="self.value" />`;
    }
}

function Form() {
    let self = this;
    // The innerHTML of Crypto is the template for the component
    return `<>
        <p>Form</p>
        <Test :type="self.type" :ref="self.element" /><br><br>
        <input type="button" value="Update type"
            onclick="self.type = !self.type; self.element.refresh();" />
    </>`;
}
// Register custom tags
lemonade.setComponents({ Test });
// Render the component
lemonade.render(Form, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

// Component
function Test() {
    let self = this;
    if (self.type) {
        return `<select :bind="self.value">
            <option value=""></option>
            <option value="test">test</option>
        </select>`;
    } else {
        return `<input type="text" :bind="self.value" />`;
    }
}

// Register custom tags
lemonade.setComponents({ Test });

export default function Form() {
    let self = this;
    // The innerHTML of Crypto is the template for the component
    return `<>
        <p>Form</p>
        <Test :type="self.type" :ref="self.element" /><br><br>
        <input type="button" value="Update type"
            onclick="self.type = !self.type; self.element.refresh();" />
    </>`;
}
```
  
  
  

Component declaration
---------------------

It is important to notice in the examples above that the components `Hello` and `Crypto` need to be register to be used across the application.  
  
  

### Local declaration

To declare a local component, you can use `lemonade.element` to create your component as below.  
  
```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
function Test() {
    let self = this;
    return `<p>Hello {{self.type}}</p>`;
}

function Form() {
    let self = this;
    // Declare the components locally
    let template = `<>
        <Test type="World" />
    </>`;

    return lemonade.element(template, self, { Test });
}
// Render the component
lemonade.render(Form, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

// Component
function Test() {
    let self = this;
    return `<p>Hello {{self.type}}</p>`;
}

lemonade.setComponents({ Element })

export default function Form() {
    let self = this;
    // Declare the components locally
    let template = `<>
        <Test type="World" />
    </>`;
    return lemonade.element(template, self, { Test });
}
```
  
  

### Next Chapter

The next Chapter presents how to create a Component as a JavaScript.  

&nbsp;

[Next chapter: Classes](/docs/v3/classes){.button .main}