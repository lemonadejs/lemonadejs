<h1>Lemonadejs: Reactive micro library</h1>

<h2>Create amazing web-based interfaces with Lemonade v2</h2>

<img src='https://lemonadejs.net/templates/default/img/home.png' align="right" width="50%">

Lemonadejs is a super lightweight reactive vanilla javascript micro-library (6 KBytes). It aims to help the integration between the JavaScript (controllers) and the HTML (view). It supports two-way binding and integrates natively with jSuites to help to create amazing interfaces quicker.<br><br>

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
<script src="https://lemonadejs.net/v2/lemonade.js"></script>

<div id="root"></div>

<script>
function Hello() {
    let self = {};
    let template = `<h1>Hello World</h1>`;

    return lemonade.element(template, self);
}


function App() {
  let self = {};
  self.count = 1;
  let template = `<div>
        <div><Hello /></div>
        <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">Click me</button>
    </div>`;

    return lemonade.element(template, self, { Hello });
}

lemonade.render(App, document.getElementById('root'));
</script>
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
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
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
</html>
```

<h2>Installation</h2>

% npm install lemonadejs


<h2>License</h2>

This software is free to use and it is distributed under the MIT license.


<h2>Other tools</h2>

https://jsuites.net<br>
https://jspreadsheet.com<br>
https://bossanova.uk/jspreadsheet<br>
