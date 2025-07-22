title: Dynamic Reactive Tables with LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, JavaScript library, JavaScript plugin, JavaScript, reactive, React, examples, table
description: Learn how to create a reactive dynamic table from an array of objects using LemonadeJS and the Loop attribute.

# Dynamic Tables Example

This example demonstrates how to create dynamic tables using LemonadeJS by rendering rows from a JavaScript array of objects with the :loop attribute.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Data
    this.rows = [
        { title:'Google', description: 'The google search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Dynamic table
    return render => render`<table>
        <thead><tr><th>Title</th><th>Description</th></th></thead>
        <tbody :loop="${this.rows}">
        <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Component() {
    // Data
    this.rows = [
        { title:'Google', description: 'The google search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Dynamic table
    return render => render`<table>
        <thead><tr><th>Title</th><th>Description</th></th></thead>
        <tbody :loop="${this.rows}">
        <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
```