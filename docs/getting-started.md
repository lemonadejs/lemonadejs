title: Getting Started with LemonadeJS v4: Reactive Programming for Frontend Developers
keywords: LemonadeJS, JavaScript library, reactive programming, two-way data binding, frontend architecture, micro-library efficiency, version 4 documentation
description: Initiate development with LemonadeJS v4, the advanced reactive micro-library tailored for efficient front-end development. Learn the mechanics of two-way data binding and state management to construct performant web interfaces. Delve into version 4's technical advancements and streamlined API in our detailed documentation.

![Getting started with LemonadeJS](img/getting-started.png)

Getting started
===============

LemonadeJS v4 continues its tradition of efficiency in a 4 KByte compressed package, offering a robust, performance-optimized micro-reactive JavaScript library. It facilitates the development of web interfaces that can be used directly in the browser or with module bundlers like webpack without transpilation or external dependencies.

This version is designed to support developers in constructing a broad range of applications—from simple widgets to sophisticated web applications—leveraging the foundational reactive programming model. Diverse installation methods are available to accommodate different project requirements and developer preferences.

{.green}
> **Create CSP-compliant interfaces**
> 
> Essential advancements in version 4 include support for creating interfaces compliant with Content Security Policy (CSP), providing an extra layer of security in web applications. The library enhances reactive tracking for complex nested objects and arrays, improving state management efficiency. These updates are delivered with a commitment to maintaining high-performance standards.

Installation
------------

Begin using the reactive LemonadeJS library by selecting one of the following installation methods that best suits your project's needs:  
  

### CDN

Incorporate LemonadeJS directly into your HTML files by including the following script tag:

```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
```

### NPM installation

For those integrating LemonadeJS into a project with Node.js workflow, use npm to install the package:

```bash
npm install lemonadejs
```

### Source code (MIT)

Access the complete source code on GitHub to customize or contribute to the LemonadeJS project:

[https://github.com/lemonadejs/lemonadejs](https://github.com/lemonadejs/lemonadejs)



Quick Start Guide
-----------

To swiftly set up a base project with LemonadeJS on your local machine, follow these steps for a smooth and fast start:

```bash
// Create a New Project:
npx @lemonadejs/create myApp
// Go to the project file
cd myApp
// Launch a development server with hot reload by running:
npm run start
```
After executing these steps, open your web browser to the address provided by the development server. You're now ready to develop with LemonadeJS and see your changes in real-time. Enjoy crafting your reactive interfaces!
  
  

Official components
-------------------

LemonadeJS offers a suite of official components, which are JavaScript implementations of commonly required libraries for application development. These are designed to work seamlessly with the LemonadeJS ecosystem:  
  

### Testing Library

- Tester: This is the official testing library tailored for LemonadeJS components, providing a robust framework for ensuring your components behave as expected.

[Unit Tests Documentation](/docs/tests)  
  

### Pico Library

- Pico: A curated collection of minimalist LemonadeJS UI components. Each component in the Pico library is standalone, with no dependencies and a size limit of 2 KBytes, ensuring lightweight and fast-loading web applications.

[Pico Plugins Documentation](/docs/plugins)  



## The Core Concept of LemonadeJS
At the heart of LemonadeJS lies the
{self} object, the cornerstone for each component's properties and methods. This object plays a pivotal role in the framework's reactive nature.


### Data Binding:
In LemonadeJS, data binding is both intuitive and efficient. When you declare a property within the {self} object and utilize it within your template, LemonadeJS automatically sets up observers. These observers are responsible for syncing any changes in your property's value with the corresponding HTML element in the Document Object Model (DOM).


```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Hello() {
    // Reactive properties
    const self = this;
    self.count = 90;
    // Count down every second
    setInterval(() => {
        self.count--;
        if (self.count == 0) {
            self.count = 90;
        }
    }, 1000);
    // Component template
    return `<p>Count: {{self.count}}</p>`;
}
lemonade.render(Hello, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export function Hello() {
    // Reactive properties
    const self = this;
    self.count = 90;
    // Count down every second
    setInterval(() => {
        self.count--;
        if (self.count == 0) {
            self.count = 90;
        }
    }, 1000);
    // Component template
    return `<p>Count: {{self.count}}</p>`;
}
```

### Up Next: Attributes and Two-Way Data Binding

Before we explore the dynamic two-way data binding in LemonadeJS, let's first get acquainted with the attributes that make it possible. Up next, we'll break down these essentials and set the stage for a deeper dive into reactive UI development.

&nbsp;

[LemonadeJS attributes](/docs/attributes){.button .main}