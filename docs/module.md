title: LemonadeJS ES6 Modules,
keywords: LemonadeJS, module, browser, import, frontend, javascript library, javascript, ES6,
description: Running LemonadeJS as an ES6 module in the browser using import statements.

Module
======

Mastering LemonadeJS integration is straightforward when using it as an ES6 module in the browser. This modern approach leverages the import statement, allowing for a more organized and maintainable codebase. Below is an example of how to include LemonadeJS in your project using module syntax:
  
  

Example
-------

{.ignore}
```html
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