title: LemonadeJS as an ES6 Module,
keywords: LemonadeJS, module, browser, import, frontend, javascript library, javascript, ES6,
description: Master running LemonadeJS as an ES6 module in the browser using import statements for seamless integration.

Module
======

It is possible to run LemonadeJS as a module directly in the browser as below.  
  
  

Example
-------

```xml
<html>
<div id='root'></div>
<script type="module">
import lemonade from 'https://unpkg.com/lemonadejs@3/dist/index.js';

function Component() {
    const self = this;

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<table cellpadding="6">
        <thead><tr><th>Title</th><th>Description</th></tr></thead>
        <tbody :loop="self.rows">
        <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```