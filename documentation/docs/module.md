title: LemonadeJS ES6 Modules,
keywords: LemonadeJS, module, browser, import, frontend, javascript library, javascript, ES6,
description: Running LemonadeJS as an ES6 module in the browser using import statements.
canonical: https://lemonadejs.com/docs/module

# ES6 Module Integration

LemonadeJS can be imported as an ES6 module directly in the browser:

{.ignore}
```html
<script type="module">
import lemonade from 'https://cdn.jsdelivr.net/npm/lemonadejs@5/dist/index.js';
</script>
```

## Example

This example demonstrates a basic component.

{.ignore}
```html
<html>
<div id='root'></div>
<script type="module">
import lemonade from 'https://cdn.jsdelivr.net/npm/lemonadejs@5/dist/index.js';

function Component() {
    this.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return render => render`<table cellpadding="6">
        <thead><tr><th>Title</th><th>Description</th></tr></thead>
        <tbody :loop="${this.rows}">
        <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```

