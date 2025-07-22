title: Mastering LemonadeJS JavaScript Methods,
keywords: LemonadeJS, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, methods,
description: Learn the fundamental LemonadeJS methods to create powerful and dynamic JavaScript components for your web applications.

LemonadeJS methods
==================

Summary
-------

In this section, we delve into LemonadeJS' core and sugar methods, which are pivotal for component creation and inter-component communication.  

### Core functions

The core methods are instrumental in crafting, declaring, and presenting elements within the DOM. 

| Method                                       | Description                                                                                                                                                                    |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| element(string, object, object)              | Generates DOM elements from an HTML string and binds them to a `self` object. Syntax: `lemonade.element(template: String, self: Object, components: Object) => DOMElement`     |
| render(DOMElement, DOMElement, object?)      | Attaches LemonadeJS components to a specified DOM root. Syntax: `lemonade.render(component: Function, root: HTMLElement, self?: object, template?: HTMLElement) => DOMElement` |
| apply(DOMElement, object, object)            | Associates a 'self' scope with an existing DOM element. Syntax: `lemonade.apply(root: HTMLElement, self: Object, components: Object) => void`                                  |
| setComponents(object)                        | Includes component references for global application use. Syntax: `lemonade.setComponents(components: object) => void`                                                         |
| path(string, boolean)                        | Extract the value from an object based on a address. Syntax: `lemonade.path(str: string, config: boolean) => any`                                                              |
| createWebComponent(string, Function, object) | Includes component references for global application use. Syntax: `lemonade.createWebComponent(name: string, handler: Function, options: WebComponentOptions) => void`                                                         |


### Sugar functions

The sugar methods facilitate seamless communication across various components. These methods provide the foundation and communication channels necessary for creating dynamic and interactive web components with LemonadeJS.

| Method                         | Description                                                                                                                                                                          |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| set(string, self, persistence) | Shares a 'self' or a data dispatcher within the Sugar common container for component-wide access. Syntax: `lemonade.set(alias: String, self: Object, persistence?: Boolean) => void` |
| get(string)                    | Retrieves a 'self' reference from the Sugar container. Syntax: `lemonade.get(alias: String) => Object                                                                                | Function` |
| dispatch(string, data)         | Initiates a data dispatcher. Syntax: `lemonade.dispatch(alias: String, data: Object) => void`                                                                                        |

 
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

&nbsp;

[Next chapter: Native lemonade JavaScript events](/docs/events){.button .main}

