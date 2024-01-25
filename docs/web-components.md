title: Build Reactive Web Components with LemonadeJS
keywords: Reactive, Web Components, LemonadeJS, JavaScript
description: Learn to craft reactive web components using LemonadeJS with our quick-start guide. Enhance your front end with efficient, interactive elements.

Web components
==============

Reactive web-components
-----------------------

LemonadeJS simplifies the process of developing reactive web components. To create these components, you need to implement two essential methods:

- **render()**: This method is responsible for returning the HTML template of your component. It defines the structure and content that will be rendered on the page.
- **connectedCallback()**: This lifecycle hook is called when your web component is inserted into the DOM. Within LemonadeJS, you use this method to execute the rendering logic and append the template returned by the render() method to the DOM, ensuring that your component is ready for interaction.

### Example  

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
        lemonade.render(this.render, this, this);
    }
}

window.customElements.define('hello-component', Hello);
</script>
```