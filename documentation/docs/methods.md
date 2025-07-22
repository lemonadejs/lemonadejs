title: LemonadeJS Methods,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, methods,
description: LemonadeJS methods documentation.
canonical: https://lemonadejs.com/docs/methods

# LemonadeJS Methods

## Overview

In this section, we delve into LemonadeJS' core and sugar methods, which are pivotal for component creation and inter-component communication.  

| Method                                                                                                  | Description                                                                                                                                     |
|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `element(template: String, self: Object, components: Object) => DOMElement`                             | Creates DOM elements from an HTML string, binding them to a `self` context.                                                                     |
| `render(component: Function, root: HTMLElement, self?: Object, template?: HTMLElement) => DOMElement`   | Renders a LemonadeJS component into a DOM root element.                                                                                         |
| `apply(root: HTMLElement, self: Object, components: Object) => void`                                    | Binds a `self` scope and components to an existing DOM element.                                                                                 |
| `setComponents(components: Object) => void`                                                             | Registers components globally for use across the application.                                                                                   |
| `setPath(initial: Object, callback: Function) => [form: Object, setForm: Function, getForm: Function]`  | Initializes a reactive form object and returns it along with a function to update its values. See the [Forms](/docs/forms) section for details. |
| `createWebComponent(name: String, handler: Function, options: WebComponentOptions) => void`             | Defines a custom web component with the specified name and logic.                                                                               |
| `onchange(callback: (prop: String, newValue: Any, oldValue: Any) => void)`                              | Callback triggered when a property in the context changes.                                                                                      |
| `onload(root: HTMLElement) => void`                                                                     | Callback returning the root element when the component is ready in the DOM.                                                                     |
| `track(prop: String) => void`                                                                           | Force onchange when a property change value                                                                                                     |

### Helpers

| Method                  | Description                                                                                                           |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `path(string, boolean)` | Retrieves a value from an object using a specified path. Syntax: `lemonade.path(str: string, config: boolean) => any` |

### Sugar functions

The sugar methods facilitate seamless communication across various components. These methods provide the foundation and communication channels necessary for creating dynamic and interactive web components with LemonadeJS.

| Method                           | Description                                                                                                                                                                          |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `set(string, self, persistence)` | Shares a 'self' or a data dispatcher within the Sugar common container for component-wide access. Syntax: `lemonade.set(alias: String, self: Object, persistence?: Boolean) => void` |
| `get(string)`                    | Retrieves a 'self' reference from the Sugar container. Syntax: `lemonade.get(alias: String) => Object                                                                                | Function` |
| `dispatch(string, data)`         | Initiates a data dispatcher. Syntax: `lemonade.dispatch(alias: String, data: Object) => void`                                                                                        |

 
## Examples

### Lemonade apply to existing HTML

This example demonstrates how to integrate LemonadeJS into an existing HTML structure by binding a 'self' object to the DOM. If you have a pre-existing block of HTML you'd like to manage with LemonadeJS, you can apply a 'self' object to it. The following example shows how to bind a simple 'self' to a DOM element. That is a basic illustration intended for educational purposes, and it's recommended that more sophisticated scope encapsulation be implemented in production.

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>

<div id='root'>
    <p><strong>{{self.title}}</strong></p>
    <input type="button" value="Update"
        onclick="self.title = 'New title'" />
</div>

<script>
// Apply the self object to an existing HTML element already in the DOM
let self = {};
self.title = 'Hello world';
lemonade.apply(document.getElementById('root'), self);
</script>
</html>
```
 

Creating a component
----------

In the most common applications you can use `lemonade.render` to render elements to the DOM and `lemonade.setComponents` to declare components across the application.   

