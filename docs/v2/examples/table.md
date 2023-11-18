title: Table
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples, table
description: How to create a reactive dynamic table from an array of objects using the loop attribute.

Table
=====

Create a dynamic table from an array of objects using the `@loop` special attribute.  
  

Basic example
-------------

Creating a dynamic HTML table using LemonadeJS.  


### Source code

  

Browser

```html
<html>
<script src="https://lemonadejs.net/v2/lemonade.js"></script>
<div id='root'></div>
<script>
var Component = (function() {
    var self = {};

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    var template = `<table cellpadding="6">
            <thead><tr><th>Title</th><th>Description</th></th></thead>
            <tbody @loop="self.rows">
            <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
            </tbody>
        </table>`;

    return lemonade.element(template, self);
});

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```

NPM

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
