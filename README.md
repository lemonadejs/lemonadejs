# LemonadeJS v4: Reactive micro library

## Create amazing web-based interfaces with LemonadeJS

![Micro Library](https://lemonadejs.com/templates/default/img/lemonadejs-home.jpg)

LemonadeJS is a super lightweight reactive vanilla javascript micro-library (7 KBytes). It helps to integrate the JavaScript (controllers) and the HTML (view). It supports two-way data binding and integrates natively with jSuites to help to create amazing interfaces quicker.<br><br>

It would help you deliver reusable components and does not require transpiler, babel, or hundreds of other dependencies. It works just fine in any javascript dev environment. LemonadeJS has a quick learning curve, keeps coding fun, and is very close to native JS.

- Make rich and user-friendly web interfaces and applications
- Handle complicated data inputs with ease and convenience
- Improve the software user experience
- Create rich CRUDS and beautiful UI
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

[See this example on codesandbox](https://codesandbox.io/s/reactive-micro-library-ny99bk)

```javascript
import lemonade from "lemonadejs";

export default function App() {
  this.count = 1;
  return render => render`<div>
        <p>You clicked ${this.count} times</p>
        <button onclick="${this.count++}">Click me</button>
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
        <button onclick="${this.count++}">Click me</button>
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

* [Getting started](/docs/getting-started)
* [Upgrades](/docs/upgrades)
* [Quick reference](/docs/quick-reference)
* [Changelog](/docs/changelog)
* [Introduction](/docs/intro)
* [Components](/docs/components)
* [Props](/docs/props)
* [Events](/docs/events)
* [Onload](/docs/onload)
* [Onchange](/docs/onchange)
* [State](/docs/state)
* [References](/docs/references)
* [Ready](/docs/ready)
* [Two-way data binding](/docs/two-way-data-binding)
* [Render](/docs/render)
* [Forms](/docs/forms)
* [Arrays](/docs/arrays)
* [Sugar](/docs/sugar)
* [Testing](/docs/tests)
* [Methods](/docs/methods)
* [Classes](/docs/classes)
* [Web-components](/docs/web-components)
* [Module (ESM](/docs/module)

### Libraries


* [JavaScript Lists with Search and Pagination](/docs/plugins/list): Create a list of elements from an array based on a given template, including search and pagination.
* [JavaScript Rating](/docs/plugins/rating): A micro JavaScript star rating plugin.
* [JavaScript Router](/docs/plugins/router): Create a JavaScript single-page application with routes using LemonadeJS.
* [Signature Pad](/docs/plugins/signature): A JavaScript Signature pad using LemonadeJS.
* [JavaScript Data Grid](/docs/plugins/data-grid) : A micro (5KBytes) JavaScript Data Grid with search, pagination, sorting.
* [JavaScript Modal](/docs/plugins/modal) : Create advance resizable, draggable, closable or minimizable modals. 
* [JavaScript Calendar](/docs/plugins/calendar) : JavaScript date picker with range selection and much more.
* [JavaScript Dropdown](/docs/plugins/dropdown) : Highly performance autocomplete dropdown with groups, images, and much more.
* [JavaScript Color picker](/docs/plugins/color-picker) : Simple javascript color picker.
* [JavaScript Timeline](/docs/plugins/timeline) : JavaScript timeline with grouping and other other customizable visual attributes.  
* [JavaScript Context Menu](/docs/plugins/context-menu) : JavaScript responsive context menu.
* [JavaScript Tabs](/docs/plugins/tabs) : Simple javascript tabs component.
* [JavaScript Image cropper](/docs/plugins/image-cropper) : A linkedin-style photo cropper.
* [JavaScript Switch](/docs/plugins/switch): A lightweight reactive switch button.
* [JavaScript Top Menu](/docs/plugins/top-menu): A lightweight reactive top menu.



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




### Utilities

* [Awesome](https://lemonadejs.com/docs/awesome)
* [Sugar](https://lemonadejs.com/docs/sugar)
* [Testing](https://lemonadejs.com/docs/tests)
* [Plugins](https://lemonadejs.com/docs/plugins)
* [Module (ESM)](https://lemonadejs.com/docs/module)



## Other tools

- [JavaScript Components](https://jsuites.net/)
- [JavaScript Data Grid](https://jspreadsheet.com/)
- [Free JavaScript Data Grid](https://bossanova.uk/jspreadsheet/)
