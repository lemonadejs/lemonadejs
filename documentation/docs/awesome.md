title: Awesome LemonadeJS: Resources, Snippets & Inspiration,
keywords: LemonadeJS, awesome, resources, code snippets, frontend, javascript library, inspiration,
description: Dive into a curated collection of LemonadeJS resources, code snippets, and other inspirational material to help you create excellent web applications.

![Reactive library loop](img/drinking-lemonade.jpg){.right style="width:initial; margin: 60px;"}

# Awesome Resources
Unlock the full potential of your web applications with our handpicked selection of LemonadeJS resources. This guide is an indispensable tool for beginners and seasoned developers seeking to enhance their frontend development skills with the LemonadeJS library. Delve into various code snippets, tutorials, and inspirational examples that showcase the power and versatility of LemonadeJS.

## Embark on Your LemonadeJS Journey
LemonadeJS is a cutting-edge JavaScript library designed for effortlessly building dynamic and reactive web interfaces. Whether you're switching from other libraries or are a newcomer to the scene, this collection will equip you with the necessary tools and knowledge to effectively exploit the capabilities of LemonadeJS.
Here are some examples worth sharing:

### Creating Dynamic Tables

The children tag for a parent that has loop will be duplicated for each entry on your array

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {

    // Loop
    this.rows = [
        { title:'Google', description: 'The alpha search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    return render => render`<table>
        <thead>
            <tr><th>Title</th><th>Description</th></tr>
        </thead>
        <tbody :loop="${this.rows}">
            <tr><td>{{this.title}}</td><td>{{this.description}}</td></tr>
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
        { title:'Bing', description: 'The microsoft search engine...' },
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
        return render => render`<>
            <p>${this.title}</p>
            <input type="button" value="Update" onclick="${() => this.title = 'Test'}" />
        </>`;
    }

    connectedCallback() {
        lemonade.render(this.render, this, this);
    }
}
if (! window.customElements.get('first-element')) {
    window.customElements.define('first-element', FirstElement);
}
</script>
```

### Dynamic Dropdowns

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Default dropdown value
    this.value = 4;

    // Options for my dropdown
    this.options = [
        { id: 1, name: "Canada" },
        { id: 2, name: "United Kingdom" },
        { id: 3, name: "United States" },
        { id: 4, name: "New Zealand" },
        { id: 5, name: "Australia" }
    ]

    return render => render`<div>
        <div>The value is: ${this.value}</div>
        <select :loop="${this.options}" :bind="${this.value}">
            <option value='{{this.id}}'>{{this.name}}</option>
        </select>
    </div>`;
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

    render => render`<div>
        <div>The value is: ${this.value}</div>
        <select :loop="${this.options}" :bind="${this.value}">
            <option value='{{this.id}}'>{{this.name}}</option>
        </select>
    </div>`;
}
```

### Disable State Of An Element 

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;
function Component() {
    const disabled = state(true, () => {
        console.log('triggered');
    });

    const toggle = () => {
        disabled.value = !disabled.value;
    }
    return render => render`<div>
        <input type="text" disabled="${disabled}" value="test..." />
        <input type="button" onclick="${toggle}" value="Toggle" />
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Component() {
    const disabled = state(true, () => {
        console.log('triggered');
    });

    const toggle = () => {
        disabled.value = !disabled.value;
    }
    return render => render`<div>
        <input type="text" disabled="${disabled}" value="test..." />
        <input type="button" onclick="${toggle}" value="Toggle" />
    </div>`;
}
```