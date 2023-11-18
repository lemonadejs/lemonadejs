title: Getting started with LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, documentation
description: Getting started with LemonadeJS, basic reactive concepts, install and documentation.

![Getting started with LemonadeJS](img/getting-started.png)

Getting started
===============

LemonadeJS version 2 is about 6 KBytes

LemonadeJS is a free and powerful micro reactive JavaScript library to help build web-based interfaces. It does not require any transpile or dependencies. It can run using NodeJS or just the preferable web browser.  
  
You can build from a simple widget to more advanced web-based applications.  

Installation
------------

The reactive LemonadeJS can be installed using one of the following methods.  
  

### CDN

```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs@2/dist/lemonade.min.js"></script>  
```

### NPM installation

```bash
npm install lemonadejs  
```
  

### Source code (MIT)

[https://github.com/lemonadejs/lemonadejs](https://github.com/lemonadejs/lemonadejs)  
  
  

Official components
-------------------

The LemonadeJS official components are javascript implementation of common application required libraries.  
  

### Pico Library

The Pico library is a special collection of highly optimize components that does not require any dependencies and has a limit of 1.8 KBytes each. You can visit our [official libraries](/v2/library) page to know discover more about it.  
  
  

The concept of LemonadeJS
-------------------------

The `self` is an object where you define properties and methods. The self is bound to a template, and when the self properties are used in the template, they are included in the observer controller, so each change in the property value reflects automatically in the HTML.  
  
  

### Data binding

When a property is used in the template, all updates in the property value will affect the necessary DOM in the rendered template. In the example below, for each update in the `self.count` value, only the necessary DOM element will be updated.

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='counter'></div>
<script>
var Hello = function() {
    // Reactive properties
    var self = {
        count: 90
    }
    // Count down every second
    setInterval(function() {
        self.count--;
        if (self.count == 0) {
            self.count = 90;
        }
    }, 1000);
    // Component template
    var template = '<h1>Count: {{self.count}}</h1>';
    return lemonade.element(template, self)
}
lemonade.render(Hello, document.getElementById('counter'));
</script>
</html>
```
  
  
We will explore more about the javascript two-way binding in HTML elements in the next few chapters, but first lets learn more about the LemonadeJS special attributes.

[Next chapter: LemonadeJS attributes](/docs/v2/attributes)