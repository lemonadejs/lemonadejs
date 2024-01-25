title: Awesome LemonadeJS: Resources, Snippets & Inspiration,
keywords: LemonadeJS, awesome, resources, code snippets, frontend, javascript library, inspiration,
description: Dive into a curated collection of LemonadeJS resources, code snippets, and other inspirational material to help you create excellent web applications.

![Reactive library loop](img/drinking-lemonade.jpg){style="width:initial; margin: 60px;"}

# Awesome Resources
Unlock the full potential of your web applications with our handpicked selection of LemonadeJS resources. This guide is an indispensable tool for beginners and seasoned developers seeking to enhance their frontend development skills with the LemonadeJS library. Delve into various code snippets, tutorials, and inspirational examples that showcase the power and versatility of LemonadeJS.

## Embark on Your LemonadeJS Journey
LemonadeJS is a cutting-edge JavaScript library designed for effortlessly building dynamic and reactive web interfaces. Whether you're switching from other libraries or are a newcomer to the scene, this collection will equip you with the necessary tools and knowledge to effectively exploit the capabilities of LemonadeJS.
Here are some examples worth sharing:

### Creating dynamic tables

```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
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
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
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
  
  

### Control to disable of a form element

```html
<html>
<script src="https://lemonadejs.net/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const self = this;
    self.disabled = true;
    self.toggle = () => {
        self.disabled = !self.disabled;
    }
    return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.toggle" value="Toggle" />
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
    self.toggle = () => {
        self.disabled = !self.disabled;
    }
    return `<>
        <input type="text" :disabled="self.disabled" value="test..." />
        <input type="button" onclick="self.toggle" value="Toggle" />
    </>`;
}
```