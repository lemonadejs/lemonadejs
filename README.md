<h1>LemonadeJS: Reactive micro library</h1>

<h2>Create amazing web-based interfaces with LemonadeJS v2</h2>

<img src='https://lemonadejs.net/templates/default/img/home.png' align="right" width="50%">

LemonadeJS is a super lightweight reactive vanilla javascript micro-library (7 KBytes). It aims to help the integration between the JavaScript (controllers) and the HTML (view). It supports two-way binding and integrates natively with jSuites to help to create amazing interfaces quicker.<br><br>

It would help you deliver reusable components and does not require transpilers, babel, or hundreds of other dependencies. It works just fine in any javascript dev environment. LemonadeJS has a quick learning curve and keeps coding fun and very close to native JS.

- Make rich and user-friendly web interfaces and applications
- Handle complicated data inputs with ease and convenience
- Improve the software user experience
- Create rich CRUDS and beautiful UI
- Highly flexible and customizable
- Lightweight and simple to use

<h2>Examples</h2>

<h3>Node</h3>

Build modern applications with lemonadeJS and node.

 <a href='https://codesandbox.io/s/lemonadejs-reactive-app-no2dl'>See this example on codesandbox</a>

```javascript
import lemonade from "lemonadejs";
import Hello from "./Hello";

export default function App() {
  let self = {};
  self.count = 1;

  let template = `<div>
        <div><Hello /></div>
        <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">Click me</button>
    </div>`;

  return lemonade.element(template, self, { Hello });
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
    let template = `<h1>{{self.title}}</h1>`;
    return lemonade.element(template, self);
}

function App() {
    let self = {};
    self.count = 1;
    let template = `<>
      <Hello title="your title" />
      <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">Click me</button>
      </>`;
    return lemonade.element(template, self, { Hello });
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
    let self = {};

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    let template = `<table cellpadding="6">
            <thead><tr><th>Title</th><th>Description</th></th></thead>
            <tbody @loop="self.rows">
                <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
            </tbody>
        </table>`;

    return lemonade.element(template, self);
}
```


<h3>The event object</h3>

```javascript
<html>
<body>
<div id='root'></div>

<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
var Component = (function() {
    // Create the self object
    var self = {};
    self.test = function(e) {
        console.log(e);
        e.preventDefault();
    }

    // The property call is added to the observable list when added to the DOM
    var template = `<>
        <input type="button" value="Click test" onclick="self.test(e);"/>
        </>`;

    // Render the template and create the observation
    return lemonade.element(template, self);
});

// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</body>
</html>
```

<h3>Enable/disable HTML elements</h3>

```javascript
<html>
<body>
<div id='root'></div>

<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script>
var App = (function() {
    let self = {};
    self.disabled= false;

    let template = `<>
            <button onclick="self.disabled = !self.disabled">Toggle</button>
            <input type="text" disabled="{{self.disabled}}" />
            </>`;

    return lemonade.element(template, self);
});

lemonade.render(App, document.getElementById('root'));
</script>
</body>
</html>
```


<h2>Installation</h2>

% npm install lemonadejs


<h2>License</h2>

This software is free to use and it is distributed under the MIT license.

<h2>Documentation</h2>

<ul>
<li><a href="/v2/docs/getting-started">Getting started</a></li>
<li><a href="/v2/docs/attributes">Attributes</a></li>
<li><a href="/v2/docs/two-way-binding">Two-way binding</a></li>
<li><a href="/v2/docs/arrays">Arrays</a></li>
<li><a href="/v2/docs/methods">Methods</a></li>
<li><a href="/v2/docs/events">Events</a></li>
<li><a href="/v2/docs/classes">Classes</a></li>
<li><a href="/v2/docs/components">Components</a></li>
</ul>

<h2>Other tools</h2>

https://jsuites.net<br>
https://jspreadsheet.com/home<br>
https://bossanova.uk/jspreadsheet<br>
