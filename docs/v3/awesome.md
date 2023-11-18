title: Awesome LemonadeJS: Resources, Snippets & Inspiration,
keywords: LemonadeJS, awesome, resources, code snippets, frontend, javascript library, inspiration,
description: Dive into a curated collection of LemonadeJS resources, code snippets, and other inspirational material to help you create excellent web applications.

Awesome examples
================

A summary of nice examples using LemonadeJS.  
  

Micro reactive components
-------------------------

Here is a interesting working examples worth sharing.  
  

### Creating dynamic tables

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const self = this;

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<table cellpadding="6">
        <thead>
            <tr><th>Title</th><th>Description</th></tr>
        </thead>
        <tbody :loop="self.rows">
            <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const self = this;

    self.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bind', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    // Custom components such as List should always be unique inside a real tag.
    return `<table cellpadding="6">
        <thead>
            <tr><th>Title</th><th>Description</th></tr>
        </thead>
        <tbody :loop="self.rows">
            <tr><td>{{self.title}}</td><td>{{self.description}}</td></tr>
        </tbody>
    </table>`;
}
```

  
  

### Reactive web-components
```html
<div id="root">
    <first-element title="Hello world" />
</div>

<script>
class FirstElement extends HTMLElement {
    constructor() {
        super();
    }

    render() {
        const self = this;
        return `<>
            <p>{{self.title}}</p>
            <input type="button" value="setTitle()"
                onclick="self.title = 'Test'" />
        </>`;
    }

    connectedCallback() {
        lemonade.render(this.render, this, this);
    }
}

window.customElements.define('first-element', FirstElement);
</script>
```
  
  

### Creating a dynamic dropdown from a JS array

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const self = this;
    this.value = 2;
    this.options = [
        { id: 1, name: "Canada" },
        { id: 2, name: "United Kingdom" },
        { id: 3, name: "United States" },
        { id: 4, name: "New Zealand" },
        { id: 5, name: "Australia" }
    ]

    return `<>
        <select :loop='self.options' :bind='self.value'>
        <option value='{{self.id}}'>{{self.name}}</option>
        </select>
        <div>The value is: {{self.value}}</div>
    </>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const self = this;
    this.value = 2;
    this.options = [
        { id: 1, name: "Canada" },
        { id: 2, name: "United Kingdom" },
        { id: 3, name: "United States" },
        { id: 4, name: "New Zealand" },
        { id: 5, name: "Australia" }
    ]

    return `<>
        <select :loop='self.options' :bind='self.value'>
        <option value='{{self.id}}'>{{self.name}}</option>
        </select>
        <div>The value is: {{self.value}}</div>
    </>`;
}
```
  
  

### Control the disable of a form element

```html
<html>
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
  const self = this;
  self.disabled = true;
  return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.disabled = false" value="Enable" />
        <input type="button" onclick="self.disabled = true" value="Disable" />
    </>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
  const self = this;
  self.disabled = true;
  return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.disabled = false" value="Enable" />
        <input type="button" onclick="self.disabled = true" value="Disable" />
    </>`;
}
```