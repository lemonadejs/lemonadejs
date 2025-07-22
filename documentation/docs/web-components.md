title: Reactive Web Components with LemonadeJS
keywords: Reactive, Web Components, LemonadeJS, JavaScript, two-way data binding, frontend development
description: Discover how to build reactive web components with LemonadeJS, leveraging features like two-way data binding and seamless state management for modern frontend development.
canonical: https://lemonadejs.com/docs/web-components

# Web Components with LemonadeJS

This section explains how to create reactive web components using LemonadeJS. LemonadeJS assist in creating a reactive layer on top of web components, allowing developers to build amazing reactive components with two-way data binding in a fraction of the time.

## Documentation

### Native Methods

You can create a new web-component using the `createWebComponent` method.

| Method                                    | Description                                                                                                                         |
|-------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `createWebComponent`{.hightlight .nowrap} | Create a new web-component.<br>`lemonade.createWebComponent(name: string, handler: Function, options: WebComponentOptions) => void` |


LemonadeJS automatically prefixes `lm-` to the tag name, so you only need to choose a simple name for your web component, as shown below.

{.ignore}
```javascript
lemonade.createWebComponent('calendar', myCalendar);
```

For the example above, a new web-component will be created as: `<lm-calendar>`.

#### Settings

Available options when creating a new web-component using LemonadeJS.

| Method                             | Description                                                                                |
|------------------------------------|--------------------------------------------------------------------------------------------|
| `shadowRoot?: boolean` | Create the web component inside a `shadowRoot`                                             |
| `applyOnly?: boolean`  | If set to true, LemonadeJS use the existing HTML within the tag as the component template. |
| `prefix?: string`      | Prefix for the name of your web component. Default: 'lm-'.                                 |

#### Events

| Method                                                | Description                                 |
|-------------------------------------------------------|---------------------------------------------|
| `self.onconnect?: (self, firstTimeAppended) => boolean` | When the component is added to the DOM.     |
| `self.ondisconnect?: (whenCreated) => boolean`          | When the component is removed from the DOM. |


#### Example

Create a web new reactive web component using the LemonadeJS components.

```html
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<lm-test title="Hello World"></lm-test>
<script>
const ComponentTest = function() {
    const update = () => {
        this.text.style.color = 'red';
    }
    return render => render`<div>
        <p>${this.title}</p>
        <input value='Any text' :bind="${this.title}" :ref="${this.text}" />
        <input type='button' onclick="${update}" value='Update' />
    </div>`;
}

lemonade.createWebComponent('test', ComponentTest, {
    shadowRoot: false,
});
</script>
```

### Custom Reactive Web Components

You can manually create custom web components with LemonadeJS, offering precise control over their behavior and lifecycle. To do this, your web component class must implement the following methods:

| Method                   | Description                                                                                                                                                             |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `render()`               | Returns the HTML template of your component, defining its structure and content.                                                                                        |
| `connectedCallback()`    | A lifecycle hook triggered when the web component is added to the DOM. In LemonadeJS, it executes rendering logic, appending the render() method's template to the DOM. |

> **Note:** To prevent unnecessary re-rendering, check for the existence of self.el within connectedCallback. This ensures the component renders only once, even if it is removed and re-inserted into the DOM, as connectedCallback may be called multiple times.

### Examples

#### Basic Web Component

Here’s a simple "Hello World" example demonstrating how to use the `render()` and `connectedCallback()` methods to create a LemonadeJS-powered custom web component:

{.visible}
```html
<div id="root">
    <hello-component name="Jorge" />
</div>
<script>
let { render } = lemonade;

class Hello extends HTMLElement {
    constructor() {
        super();
    }

    update = () => {
        this.name = 'Ringo';
    }

    render() {
        return render => render`<div>
            <p>Hello: ${this.name}</p>
            <input type="button" value="Update" onclick="${this.update}" />
        </div>`;
    }

    connectedCallback() {
        if (! this.el) {
            render(this.render, this, this);
        }
    }
}

window.customElements.define('hello-component', Hello);
</script>
```

#### Web Component With ShadowRoot

The following example demonstrates creating a custom LemonadeJS web component with an attached `ShadowRoot` for encapsulating styles and content:

{.visible}
```html
<div id="root">
    <hello-component name="Jorge" />
</div>
<script>
let { render } = lemonade;

class Hello extends HTMLElement {
    constructor() {
        super();
    }

    update = () => {
        this.name = 'Ringo';
    }

    render() {
        return render => render`<div>
            <p>Hello: ${this.name}</p>
            <input type="button" value="Update" onclick="${this.update}" />
        </div>`;
    }

    connectedCallback() {
        // Only renders for the first time
        if (! this.el) {
            this.attachShadow({ mode: 'open' });
            const root = document.createElement('div');
            this.shadowRoot.appendChild(root);

            render(this.render, root, this);
        }
    }
}

window.customElements.define('hello-component', Hello);
</script>
```