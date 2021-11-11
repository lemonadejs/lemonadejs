<h1>Lemonadejs: Create amazing web-based interfaces</h1>

<img src='https://lemonadejs.net/templates/v1/img/home.png' align="right" width="50%">

Lemonadejs is a super lightweight reactive vanilla javascript micro-library (4Kb). It aims to help the integration between the JavaScript (controllers) and the HTML (view). It supports two-way binding and integrates natively with jSuites to help to create amazing interfaces quicker.<br><br>

It would help you deliver reusable components and does not require transpilers, babel, or hundreds of other dependencies. It works just fine in any javascript dev environment. LemonadeJS has a quick learning curve and keeps coding fun and very close to native JS.

- Make rich and user-friendly web interfaces and applications
- Handle complicated data inputs with ease and convenience
- Improve the software user experience
- Create rich CRUDS and beautiful UI
- Highly flexible and customizable
- Lightweight and simple to use

<h2>Example<h2>
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

```  html
<html>
<script src="https://lemonadejs.net/v1/lemonade.js"></script>

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

<h2>Instalation</h2>

% npm install lemonadejs


<h2>License</h2>

This software is free to use and it is distributed under the MIT license.


<h2>Other tools</h2>

https://jsuites.net<br>
https://jspreadsheet.com<br>
https://bossanova.uk/jspreadsheet<br>
