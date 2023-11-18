title: Create Reactive Sortable Lists with LemonadeJS
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, sortable
description: Design interactive, reactive sortable lists using the intuitive Lemonade Sortable JavaScript plugins.

Sortable
========

This library has 1.3 Kbytes

A optimized javascript sortable list using LemonadeJS.  
  
Documentation
-------------

### Attributes

| Attribute | Description |
| --- | --- |
| data: Array <Object> | Data should be an array of objects. |
| draggable?: boolean | Enable or disable drag and drop. |
| onchange?: function | The method is fired when a drag event occurs. |

Usage example
-------------

### Source code

```html
<div id='root'></div>

<script>
function Component() {
    let self = {
        data: [
            { title: 'Item A' },
            { title: 'Item B' },
            { title: 'Item C' },
        ],
        draggable: true
    };

    var template = `
        <ul style="padding-inline-end: 40px; user-select: none; list-style: none;">
            <Sortable data="{{self.data}}" draggable={{self.draggable}}>
                <li style="cursor: pointer; width: 200px; border: 1px solid grey; background: #eee;">{{self.title}}</li>
            </Sortable>
        </ul>`;

    return lemonade.element(template, self, { Sortable });
}

document.addEventListener("DOMContentLoaded", function() {
    lemonade.render(Component, document.getElementById('root'));
});
</script>
```
