<h1>LemonadeJS v3: Reactive micro library</h1>

<h2>Create amazing web-based interfaces with LemonadeJS</h2>

<img src='https://lemonadejs.net/templates/default/img/home.png' align="right" width="50%">

LemonadeJS is a super lightweight reactive vanilla javascript micro-library (7 KBytes). It helps to integrate the JavaScript (controllers) and the HTML (view). It supports two-way data binding and integrates natively with jSuites to help to create amazing interfaces quicker.<br><br>

It would help you deliver reusable components and does not require transpilers, babel, or hundreds of other dependencies. It works just fine in any javascript dev environment. LemonadeJS has a quick learning curve, keeps coding fun, and is very close to native JS.

- Make rich and user-friendly web interfaces and applications
- Handle complicated data inputs with ease and convenience
- Improve the software user experience
- Create rich CRUDS and beautiful UI
- Highly flexible and customizable
- Lightweight and simple to use

<br>
<h2>Installation</h2>

<h3>NPM package</h3>
% npm install lemonadejs

<h3>Using from CDN</h3>

```html
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
```

<h3>Create a LemonadeJS sample app</h3>

% npx @lemonadejs/create myApp<br>
% cd myApp<br>
% npm run start<br>

<h3>Running tests</h3>

% npm run tests<br>

<br><br>

<h2>Examples</h2>

<h3>Node</h3>

Build modern applications with lemonadeJS and node.

 <a href='https://codesandbox.io/s/reactive-micro-library-ny99bk'>See this example on codesandbox</a>

```javascript
import lemonade from "lemonadejs";
import Hello from "./Hello";

export default function App() {
  let self = this;
  self.count = 1;
  return `<div>
        <div><Hello /></div>
        <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">Click me</button>
  </div>`;
}
```

<h3>Browser</h3>

Simplicity to run in the browser without dependencies, servers, transpilers.<br>

```html
<html>
<body>
<div id="root"></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function Hello() {
    let self = this;
    return `<h1>{{self.title}}</h1>`;
}

function App() {
    let self = this;
    self.count = 1;
    return `<>
      <Hello title="your title" />
      <p>You clicked {{self.count}} times</p>
      <button onclick="self.count++;">Click me</button>
    </>`;
}
lemonade.render(App, document.getElementById('root'));
</script>
</body>
</html>
```

<h3>Creating a table from an array of objects</h3>

```javascript
import lemonade from "lemonadejs";

export default function Component() {
    let self = this;

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<table cellpadding="6">
        <thead><tr><th>Title</th><th>Description</th></th></thead>
        <tbody @loop="self.rows">
            <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
```


<h3>The event object</h3>

```html
<html>
<body>
<div id='root'></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function Component() {
    // Create the self object
    let self = this;
    self.test = function(e) {
        console.log(e);
        e.preventDefault();
    }
    // The property call is added to the observable list when added to the DOM
    return `<input type="button" value="Click test" onclick="self.test(e);"/>`;
}

// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</body>
</html>
```

<h3>Enable/disable HTML elements</h3>

```html
<html>
<body>
<div id='root'></div>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
function App() {
    let self = this;
    self.disabled = false;
    return `<>
      <button onclick="self.disabled = !self.disabled">Toggle</button>
      <input type="text" disabled="{{self.disabled}}" />
    </>`;
}
lemonade.render(App, document.getElementById('root'));
</script>
</body>
</html>
```

<h3>Reactive Webcomponents</h3>

```html
<hello-element title="Hello world" />
```

```javascript
class HelloElement extends HTMLElement {
    constructor() {
        super();
    }
 
    render() {
        let self = this;
        return `<>
            <h1>{{self.title}}</h1>
            <input type="button" value="setTitle()"
                onclick="self.title = 'Test'" />
        </>`;
    }
 
    connectedCallback() {
        lemonade.render(this.render, this, this);
    }
}
 
window.customElements.define('hello-element', HelloElement);
```


<h2>License</h2>

This software is free to use and it is distributed under the MIT license.

<h2>Learning LemonadeJS</h2>

<h3>Documentation</h3>
<ul>
    <li><a href="https://lemonadejs.net/v3/docs/getting-started">Getting started</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/benchmark" style="display: none">Benchmark</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/attributes">Attributes</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/two-way-binding">Two-way binding</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/arrays">Arrays</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/methods">Methods</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/events">Events</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/components">Components</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/classes">Classes</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/web-components">Webcomponents</a></li>
</ul>

<h3>Utilities</h3>
<ul>
    <li><a href="https://lemonadejs.net/v3/docs/awesome">Awesome</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/sugar">Sugar</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/tests">Testing</a></li>
    <li><a href="https://lemonadejs.net/v3/libraries">Libraries</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/module">Module (ESM)</a></li>
</ul>

<h3>Useful</h3>
<ul>
    <li><a href="https://lemonadejs.net/v3/docs/quick-reference">Quick reference</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/debugging">Debugging</a></li>
    <li><a href="https://lemonadejs.net/v3/docs/contributions">Contributing</a></li>
</ul>


<h2>Other tools</h2>

https://jsuites.net<br>
https://jspreadsheet.com/<br>
https://bossanova.uk/jspreadsheet<br>
