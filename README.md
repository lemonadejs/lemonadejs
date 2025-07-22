# LemonadeJS: Micro Reactive JavaScript Library

## Create amazing web-based interfaces and framework-agnostic components with LemonadeJS

![Micro Library](https://lemonadejs.com/templates/default/img/lemonadejs-home.jpg)

LemonadeJS is a super lightweight, reactive, vanilla JavaScript micro-library (7 KB). It helps integrate JavaScript (controllers) with HTML (view) through two-way data binding. It also integrates natively with jSuites to help you build amazing interfaces more quickly.<br><br>

LemonadeJS enables the creation of reusable components without the need for a transpiler, Babel, or dozens of dependencies. It works seamlessly in any JavaScript development environment. With a fast learning curve, LemonadeJS keeps coding enjoyable and stays close to native JavaScript.

- Build rich and user-friendly web interfaces and applications  
- Handle complex data inputs with ease  
- Enhance the software user experience  
- Create rich CRUD interfaces and beautiful UIs  
- Highly flexible and customizable  
- Lightweight and simple to use  

## Installation

### NPM package

```bash
% npm install lemonadejs
```

### Using from CDN

```html
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
```

### Create a LemonadeJS sample app

```
% npx @lemonadejs/create myApp<br>
% cd myApp<br>
% npm run start<br>
```

### Running tests

```
% npm run test
```

## Examples

### Webpack

Build modern applications with lemonadeJS and node.

[See this example on StackBlitz](https://stackblitz.com/edit/vitejs-vite-ke7wwphz)

```javascript
import lemonade from "lemonadejs";

export default function App() {
  this.count = 1;
  return render => render`<div>
        <p>You clicked ${this.count} times</p>
        <button onclick="${()=>this.count++}">Click me</button>
  </div>`;
}
```

### Browser

Simplicity to run in the browser without dependencies, servers, transpiler.<br>

```html
<html>
<body>
<div id="root"></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function Hello() {
    return render => render`<h1>${this.title}</h1>`;
}

function App() {
  this.count = 1;
  return render => render`<div>
        <Hello title="some title" />
        <p>You clicked ${this.count} times</p>
        <button onclick="${()=>this.count++}">Click me</button>
  </div>`;
}
lemonade.render(App, document.getElementById('root'));
</script>
</body>
</html>
```

### Creating a table from an array of objects

```javascript
import lemonade from "lemonadejs";

export default function Component() {
    this.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return render => render`<table cellpadding="6">
        <thead><tr><th>Title</th><th>Description</th></th></thead>
        <tbody :loop="${this.rows}">
            <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
```

### The event object

```html
<html>
<body>
<div id='root'></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function Component() {
    const test = (e) => {
        console.log(e);
        e.preventDefault();
    }
    // The property call is added to the observable list when added to the DOM
    return render => render`<input type="button" value="Click test" onclick="${test}"/>`;
}

// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</body>
</html>
```

### Enable/disable HTML elements

```html
<html>
<body>
<div id='root'></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function App() {
    this.disabled = false;
    const toggle = () => {
        this.disabled = !this.disabled;
    }
    return render => render`<>
      <button onclick="${toggle}">Toggle</button>
      <input type="text" disabled="${this.disabled}" />
    </>`;
}
lemonade.render(App, document.getElementById('root'));
</script>
</body>
</html>
```


## License

This software is free to use, and it is distributed under the MIT license.

## Learning LemonadeJS

### Documentation

* [Getting started](https://lemonadejs.com/docs/getting-started)
* [Upgrades](https://lemonadejs.com/docs/upgrades)
* [Quick reference](https://lemonadejs.com/docs/quick-reference)
* [Changelog](https://lemonadejs.com/docs/changelog)
* [Introduction](https://lemonadejs.com/docs/intro)
* [Components](https://lemonadejs.com/docs/components)
* [Props](https://lemonadejs.com/docs/props)
* [Events](https://lemonadejs.com/docs/events)
* [Onload](https://lemonadejs.com/docs/onload)
* [Onchange](https://lemonadejs.com/docs/onchange)
* [State](https://lemonadejs.com/docs/state)
* [References](https://lemonadejs.com/docs/references)
* [Ready](https://lemonadejs.com/docs/ready)
* [Two-way data binding](https://lemonadejs.com/docs/two-way-data-binding)
* [Render](https://lemonadejs.com/docs/render)
* [Forms](https://lemonadejs.com/docs/forms)
* [Arrays](https://lemonadejs.com/docs/arrays)
* [Sugar](https://lemonadejs.com/docs/sugar)
* [Testing](https://lemonadejs.com/docs/tests)
* [Methods](https://lemonadejs.com/docs/methods)
* [Classes](https://lemonadejs.com/docs/classes)
* [Web-components](https://lemonadejs.com/docs/web-components)
* [Module (ESM](https://lemonadejs.com/docs/module)

### Libraries


* [JavaScript Lists with Search and Pagination](https://lemonadejs.com/docs/plugins/list): Create a list of elements from an array based on a given template, including search and pagination.
* [JavaScript Rating](https://lemonadejs.com/docs/plugins/rating): A micro JavaScript star rating plugin.
* [JavaScript Router](https://lemonadejs.com/docs/plugins/router): Create a JavaScript single-page application with routes using LemonadeJS.
* [Signature Pad](https://lemonadejs.com/docs/plugins/signature): A JavaScript Signature pad using LemonadeJS.
* [JavaScript Data Grid](https://lemonadejs.com/docs/plugins/data-grid) : A micro (5KBytes) JavaScript Data Grid with search, pagination, sorting.
* [JavaScript Modal](https://lemonadejs.com/docs/plugins/modal) : Create advance resizable, draggable, closable or minimizable modals. 
* [JavaScript Calendar](https://lemonadejs.com/docs/plugins/calendar) : JavaScript date picker with range selection and much more.
* [JavaScript Dropdown](https://lemonadejs.com/docs/plugins/dropdown) : Highly performance autocomplete dropdown with groups, images, and much more.
* [JavaScript Color picker](https://lemonadejs.com/docs/plugins/color-picker) : Simple javascript color picker.
* [JavaScript Timeline](https://lemonadejs.com/docs/plugins/timeline) : JavaScript timeline with grouping and other other customizable visual attributes.  
* [JavaScript Context Menu](https://lemonadejs.com/docs/plugins/context-menu) : JavaScript responsive context menu.
* [JavaScript Tabs](https://lemonadejs.com/docs/plugins/tabs) : Simple javascript tabs component.
* [JavaScript Image cropper](https://lemonadejs.com/docs/plugins/image-cropper) : A linkedin-style photo cropper.
* [JavaScript Switch](https://lemonadejs.com/docs/plugins/switch): A lightweight reactive switch button.
* [JavaScript Top Menu](https://lemonadejs.com/docs/plugins/top-menu): A lightweight reactive top menu.



### Examples

* [Lamp](https://lemonadejs.com/docs/examples/lamp">)
* [Counter](https://lemonadejs.com/docs/examples/counter">)
* [Color generator](https://lemonadejs.com/docs/examples/color-generator">)
* [Value persistence](https://lemonadejs.com/docs/examples/value-persistence">)
* [DIV onresize](https://lemonadejs.com/docs/examples/div-onresize">)
* [Star rating](https://lemonadejs.com/docs/examples/rating">)
* [Table](https://lemonadejs.com/docs/examples/table">)
* [Disable elements](https://lemonadejs.com/docs/examples/enable-disable-elements">)
* [Color picker](https://lemonadejs.com/docs/examples/color-picker">)
* [Hangman game](https://lemonadejs.com/docs/examples/hangman">)
* [Tic tac toe](https://lemonadejs.com/docs/examples/tic-tac-toe">)


## Other tools

- [JavaScript Components](https://jsuites.net/)
- [JavaScript Data Grid](https://jspreadsheet.com/)
- [Free JavaScript Data Grid](https://bossanova.uk/jspreadsheet/)
