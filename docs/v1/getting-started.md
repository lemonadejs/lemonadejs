title: Getting started
keywords: Lemonadejs, two-way binding, frontend, javascript library, javascript plugin, javascript, views, documentation
description: Getting started with lemonadeJS, what it is and how to install.

![Getting started with LemonadeJS](img/getting-started.png)

Getting started
===============

Lemonadejs is about 4Kbytes

Lemonadejs is a free and powerful micro JavaScript library to help build web based interfaces. It does not require any infra or dependencies, just a browser and you are ready to go.

You can use it to build from a simple website widget to more advance single-page apps and web based applications.

  

Installation
------------

You can add the following to your project, download and use locally or even use NPM.

```xml
<script src="https://lemonadejs.net/v1/lemonade.js" crossorigin="anonymous"></script>
```

### NPM installation

```bash
npm install lemonadejs
```

### Source code (MIT)

[https://github.com/lemonadejs/lemonadejs](https://github.com/lemonadejs/lemonadejs)  
  
  

Component and plugins gallery
-----------------------------

It could be very interesting for you to check our [component gallery](/v1/components). It brings several plugins and contributions to help you understand the capabilities and boost the development time when builing new applications.

  

The concept of lemonadejs
-------------------------

The idea behind lemonade is to bind an object called `self` which could contain methods or data to a `HTML template`, them append the result to a valid existing DOM element. Each interaction with the self would have an automatically impact into the view.

The following example is the mininum usage of lemonadejs in your website or web application:

  
```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var self = { title:'Hello world' };
lemonade.blender('<h1>{{self.title}}</h1>', self, document.getElementById('root'));
</script>
</html>
```
  

Data binding
------------

When a self property is used in the View, and a change to this property happens, LemonadeJS makes sure to reflect the necessary updates back to the View. When an update in the View is required only the affect DOM elements are updated. In the example below, for each update in the `self.count` value, only the necessary DOM element will be updated.

```html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

<div id='root'></div>

<script>
var self = { count: 90 };
lemonade.blender('<h1>Count: {{self.count}}</h1>', self, document.getElementById('root'));

setInterval(function() {
    self.count--;
    if (self.count == 0) {
        self.count = 90;
    }
}, 1000);
</script>
</html>
```
  

Follow those principles, the two-way data binding implementation would fell very natural, and this is the topic we will explore further in the next chapter.

[Next chapter: Two-way binding](/docs/v1/two-way-binding)