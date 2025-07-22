title: Create Reusable Reactive UI Components with LemonadeJS
keywords: LemonadeJS, reusable components, reactive UI, frontend, javascript library, components, hooks
description: Learn how to create reusable and reactive UI components with LemonadeJS.

Components
==========

A component provides a powerful solution for crafting reusable functionalities. This section outlines the essential considerations for developing your custom components within LemonadeJS.

## Custom components

In LemonadeJS, custom components consist of two primary elements: 'self', which encompasses the data and controls, and the HTML template, which forms the view. LemonadeJS simplifies the process of binding `self` and the template within a unified scope, thus ensuring a fluid interchange of properties, objects, and methods.

{.green}
> **Summary of this chapter**
> 
> Key points to remember
> - **Self properties**: All attributes from the component's HTML tag are accessible in the method as this;
> - **Reserved Properties**: parent, el, and refresh are reserved properties in any component;
> - **Dynamic template**: All HTML contained within a component tag serves as the template and is part of the function call;
> - **Component refresh**: Re-render the component while preserving the self's state;
> - **Component declaration**: A custom tag and its methods should bear the same name and be declared in your call to lemonade.element(template, self, { Component1, Component2, ... });




### Self Properties

All attributes defined within the custom component tag in the template are accessible inside the corresponding custom component's JavaScript code via `this`.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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

> **Reserved Self Properties**
> 
> Upon instantiation of a custom component, specific properties within the `self` object are reserved for distinct functions:
> - **`parent`**: Refers to the self of the parent component from which the current component is called.
> - **`el`**: Denotes the root HTML element of the custom component.
> - **`refresh`**: A method that initiates a re-render of the component. It is frequently used after operations on arrays or objects when the view needs to be refreshed.


### Dynamic Template

Any HTML content within a custom component tag is recognized as its template. This content is passed into the component's method handler as the first argument, facilitating dynamic template functionality.
 
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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
  

### Component declaration

It is important to notice in the examples above that the components `Hello` and `Crypto` need to be declared to be used across the application.  
    

#### Local declaration

To declare a local component, you can use `lemonade.element` to create your component as below.  
  
```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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

### Component refresh

The `refresh` method within `self` is designed to initiate the update of an entire component or a specific array within a component. The following example illustrates conditional rendering: the component should execute a refresh to render different content based on certain conditions

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
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


## Next Chapter

The next Chapter presents how to create a Component as a JavaScript class.  

&nbsp;

[Next chapter: Classes](/docs/classes){.button .main}