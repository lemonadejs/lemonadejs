title: Get started with LemonadeJS
keywords: LemonadeJS, getting started, two-way binding, frontend, javascript library, reactive, react, Vue, Angular, documentation,
description: Kick off your LemonadeJS journey with this getting started guide, covering installation, basic reactive concepts, and more.

![Getting started with LemonadeJS](img/getting-started.png)

Getting started
===============

LemonadeJS is about 4 KBytes (compressed). No dependencies are required.  
  
LemonadeJS is a compact yet potent micro-reactive JavaScript library for building web interfaces without transpile or external dependencies, enabling component development via webpack or directly in the browser.  
  
With LemonadeJS, you can create anything from simple widgets to more advanced web applications. To get started with the reactive LemonadeJS library, choose one of the following installation methods:  
  
  

Installation
------------

To get started with the reactive LemonadeJS library, choose one of the following installation methods:  
  

### CDN

```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs@3/dist/lemonade.min.js"></script>
```

### NPM installation

```bash
npm install lemonadejs
```

### Source code (MIT)

[https://github.com/lemonadejs/lemonadejs](https://github.com/lemonadejs/lemonadejs){target="blank"}
  
  

Quick Start
-----------

If you would like to create a base project on your machine, you can use.  

Create a new project, go to the project folder then run a hot reload server

```bash
npx @lemonadejs/create myApp

cd myApp

npm run start
```

Now you can go to your browser and have fun.  
  
  
  

Official components
-------------------

The LemonadeJS official components are javascript implementation of common application required libraries.  
  

### Testing Library

- Tester is a official library for testing LemonadeJS components.  
[https://lemonadejs.net/docs/v3/tests](/docs/v3/tests)  
  

### Pico Library

- Pico is a unique collection of LemonadeJS components with no dependencies and a limit of 2 KBytes each.  
[https://lemonadejs.net/docs/plugins](/docs/plugins)  
  
  

The concept of LemonadeJS
-------------------------

In LemonadeJS, the `self` object defines a component's properties and methods. A property `self` is used in the template to automatically create observers to synchronise the property value and associated HTML element.  
  
  

### Data binding

As shown in the example below, all property value updates will affect the elements in the DOM.  

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
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
 

### Next Chapter

Before we delve into the two-way data binding between JavaScript and HTML elements in the following few chapters, let's first look at the attributes provided by LemonadeJS.

&nbsp;

[Next chapter: LemonadeJS attributes](/docs/v3/attributes){.button .main}