title: Reactive Web Components with LemonadeJS
keywords: Reactive, Web Components, LemonadeJS, JavaScript
description: Learn how to create reactive web components using LemonadeJS, featuring two-way data binding.

# Web Components with LemonadeJS

This section explains how to create reactive web components using LemonadeJS. LemonadeJS assist in creating a reactive layer on top of web components, allowing developers to build amazing reactive components with two-way data binding in a fraction of the time.

## Documentation

### Native Methods

You can create a new web-component using the `createWebComponent` method.

| Method              | Description                                                                                                                         |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| createWebComponent  | Create a new web-component.<br>`lemonade.createWebComponent(name: string, handler: Function, options: WebComponentOptions) => void` |


LemonadeJS automatically prefixes `lm-` to the tag name, so you only need to choose a simple name for your web component, as shown below.

{.ignore}
```javascript
lemonade.createWebComponent('calendar', myCalendar);
```

For the example above, a new web-component will be created as: `<lm-calendar>`.

#### Settings

Available options when creating a new web-component using LemonadeJS.

| Method               | Description                                                                                                                         |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| shadowRoot?: boolean | Create the web component inside a `shadowRoot`                                                                                      |
| applyOnly?: boolean  | If set to true, LemonadeJS applies the `self` to the existing HTML inside the tag already in the DOM without rendering any template |
| prefix?: string      | Prefix for the name of your web component. Default: 'lm-'.                                                                          |

#### Events

| Method                                                | Description                                 |
|-------------------------------------------------------|---------------------------------------------|
| self.onconnect?: (self, firstTimeAppended) => boolean | When the component is added to the DOM.     |
| self.ondisconnect?: (whenCreated) => boolean          | When the component is removed from the DOM. |


#### Example

Create a web new reactive web component using the LemonadeJS components.

```html
<script src="https://cdn.jsdelivr.net/npm/lemonadejs@4.2.2/dist/lemonade.min.js"></script>
<lm-test title="Hello World"></lm-test>
<script>
const ComponentTest = function() {
    const self = this;
    self.update = function() {
        self.text.style.color = 'red';
    }
    return `<>
        <p>{{self.title}}</p>
        <input value='Any text' :bind='self.title' :ref='self.text' />
        <input type='button' onclick='self.update' value='Update' />
    </>`;
}

lemonade.createWebComponent('test', ComponentTest, {
    shadowRoot: false,
});
</script>
```

### Custom Reactive Web Components

Alternatively, you can manually create custom web components using LemonadeJS. This approach requires your web component class to include specific methods essential for its operation and integration within web applications.

| Method                  | Description                                                                                                                                                                                                            |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **render()**            | Returns the HTML template of your component, defining its structure and content.                                                                                                                                       |
| **connectedCallback()** | This is a lifecycle hook triggered when your web component is added to the DOM. In LemonadeJS, it carries out rendering logic and appends the render() method's template to the DOM, making the component interactive. |

> **Note:** It's crucial to check for `self.el` within connectedCallback to ensure the component renders only once. If the component is removed and re-inserted into the DOM, this method may be invoked multiple times.

#### Example

Here's a basic "Hello World" example to illustrate the use of these methods in a LemonadeJS component:

```html
<div id="root">
    <hello-component title="Hello world" />
</div>
<script>
class Hello extends HTMLElement {
    constructor() {
        super();
    }

    change() {
        // Change the title
        this.title = 'Test';
    }

    render() {
        const self = this;
        return `<>
            <p>{{self.title}}</p>
            <input type="button" value="setTitle()" onclick="self.change()" />
        </>`;
    }

    connectedCallback() {
        // Only renders for the first time
        if (! this.el) {
            lemonade.render(this.render, this, this);
        }
    }
}

window.customElements.define('hello-component', Hello);
</script>
```