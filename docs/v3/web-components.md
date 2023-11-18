title: Integrating Web Components with LemonadeJS,
keywords: LemonadeJS, web components, frontend, javascript library, integration,
description: Learn how to create LemonadeJS components that seamlessly integrate with web components, enhancing your web applications with custom elements.

Web components
==============

  

Reactive web-components
-----------------------

  

### How to create reactive web components with LemonadeJS

There are two necessary methods to create reactive web-components using LemonadeJS. The method `render()` should return the template, the `connectedCallback()` will execute and append the result to the DOM when the web-component is ready.  
  
```html
<div id="root">
    <hello-component title="Hello world" />
</div>
<script>
class Hello extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        const self = this;
        return `<>
            <p>{{self.title}}</p>
            <input type="button" value="setTitle()"
                onclick="self.title = 'Test'" />
        </>`;
    }

    connectedCallback() {
        lemonade.render(this.render, this, this);
    }
}

window.customElements.define('hello-component', Hello);
</script>
```