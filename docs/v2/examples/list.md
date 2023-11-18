title: List with loops and arrays
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, lists, loops, arrays, plugins
description: The LemonadeJS List is a library to create elements with search and pagination from an array of objects.

List
====

It is possible bind a template multiple times using the directive `@loop`, creating lists.  

Basic example
-------------

A basic example to render an array of objects.  
  

  

### Source code

```javascript
const List = function() {
    // Create one self for each interaction in the array
    let self = this;
    // Template
    let template = `
        <li>
            <b>{{self.title}}</b><br>
            <i>{{self.description}}</i>
        </li>`;

    return lemonade.element(template, self);
}

const Component = function() {
    let self = {};

    self.data = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Yahoo', description: 'The old stuff...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    let template = `<ul><List @loop="self.data" /></ul>`;

    return lemonade.element(template, self, { List });
}

lemonade.render(Component, document.getElementById('root'));
```
