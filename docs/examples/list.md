title: Dynamic Lists with LemonadeJS - Arrays and Loops Simplified,
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, lists, loops, arrays, plugins,
description: Explore the LemonadeJS List component, a powerful library for creating dynamic elements with search and pagination from arrays of objects.

List
====

It is possible bind a template multiple times using the directive `:loop`, creating lists.  

Basic example
-------------

A basic example to render an array of objects.  

### Source code


```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>

<script>
function List() {
    // Create one self for each interaction in the array
    const self = this;
    // Template
    return `<li>
        <b>{{self.title}}</b><br>
        <i>{{self.description}}</i>
    </li>`;
}

function Component() {
    const self = this;

    self.data = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Yahoo', description: 'The old stuff...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<ul><List :loop="self.data" /></ul>`;
}
// Register tag
lemonade.setComponents({ List });
// Render component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

function List() {
    // Create one self for each interaction in the array
    const self = this;
    // Template
    return `<li>
        <b>{{self.title}}</b><br>
        <i>{{self.description}}</i>
    </li>`;
}

function Component() {
    const self = this;

    self.data = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Yahoo', description: 'The old stuff...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<ul><List :loop="self.data" /></ul>`;
}
// Register tag
lemonade.setComponents({ List });
// Render component
lemonade.render(Component, document.getElementById('root'));
```