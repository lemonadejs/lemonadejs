title: Reactive JavaScript Dropdown | LemonadeJS
keywords: JavaScript dropdown plugin, LemonadeJS Dropdown, framework-agnostic JavaScript, Vue, React, Angular, customizable, autocomplete, lazy loading, efficient, UI component, web development.
description: Explore LemonadeJS Dropdown, a JavaScript plugin compatible with Vue, React, and Angular. Features include autocomplete, smart loading, and easy integration for efficient option management.

JavaScript Dropdown
===============

The LemonadeJS Dropdown is a lightweight, high-performance JavaScript plugin with a reactive design. It offers various configurable options and integrates seamlessly with popular front-end frameworks like Vue, React, and Angular. The main key features include:

- **Autocomplete**: Enables quick and efficient search functionality, allowing users to find options rapidly.
- **Grouping**: Allows categorization of options into groups for organized and intuitive navigation.
- **Smart Loading**: Optimizes performance by intelligently managing the DOM, ensuring exceptional responsiveness and efficiency, especially with large datasets.
- **Framework Compatibility**: Its framework-neutral design guarantees easy integration across various technologies, ensuring a uniform platform experience.

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/dropdown
```

### Settings

| Attribute              | Description                                                                                                                                                                               |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| data: Item[]           | An array of options to be displayed. Each item should follow the structure defined in the 'Item Details' section.                                                                         |
| multiple?: boolean     | If provided, enables the multiple selection mode, allowing users to select more than one option simultaneously.                                                                           |
| autocomplete?: boolean | If provided, enables the autocomplete feature, displaying an input field that allows users to filter and quickly find options in the Dropdown.                                            |
| value?: string         | Represents the current value or selected option in the Dropdown.                                                                                                                          |
| type?: string          | Specifies the type of display the Dropdown will use. It can be "searchbar" for a search bar interface, "picker" for a selection picker, or "default" for the default dropdown appearance. |
| insert?: boolean       | Enables the `insert` feature, allowing users to add a new option directly by typing the title text and clicking on the plus symbol.                                                       |
| format?: number | Data format type, usually in the form of { id: name } or { value: text } |
| width?: number | Specifies the width of the dropdown |
| placeholder?: string | Placeholder text to guide users in the dropdown |


### Item Details

| Attribute                | Description                                                                                 |
|--------------------------|---------------------------------------------------------------------------------------------|
| value?: number or string | Represents the identifier or unique value associated with the option.                       |
| group?: string           | Indicates the group to which the option belongs, allowing for segregation and organization. |
| text?: string            | Displays the label or text associated with the option.                                      |
| image?: string           | Specifies the image URL to be displayed alongside the option.                               |
| synonyms?: string[] | Keywords for easier item identification |
| disabled?: boolean | Indicates whether the item is currently disabled |
| color?: string | Specifies the color associated with the item |


### Events

| Event                                     | Trigger                                                                    |
|-------------------------------------------|----------------------------------------------------------------------------|
| onclose?: () => void                      | Invoked when the dropdown modal is closed.                                 |
| onbeforeinsert?: (instance, Item) => void | Invoked before an item is added to the options through the insert feature. |
| oninsert?: (instance, Item) => void       | Invoked after an item is added to the options through the insert feature.  |
| onchange?: (instance, Item) => void       | Invoked when the value changes.                                            |
| onload?: (instance, Item) => void         | Invoked when appended to the DOM.                                          |
| onsearch?: (instance, Item) => void | Invoked when searching for an item.
 |
| onbeforesearch?: (instance, Item) => void | Invoked before initiating a search.
 |
| onopen?: (instance) => void | Invoked when the dropdown is opened. |

## Dropdown Examples

### Performance

Create a dropdown with 100000 items from a JSON list.

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>

<div id='root'></div>

<script>
let root = document.getElementById('root');
let data = [];

for (let i = 0; i < 100000; i++) {
    data.push({
        value: i,
        text: faker.commerce.productName()
    });
}

// Initial time before creating the table
let s = Date.now();

Dropdown(root, {
    data: data,
    value: 1,
    width: 260,
    autocomplete: true,
    onload: function() {
        let e = Date.now();
        let p = document.createElement('p');
        p.textContent = 'The dropown was created in: ' + (e - s) + 'ms';
        root.appendChild(p)
    },
});
</script>
</html>
```
```javascript
import Dropdown from '@lemonadejs/dropdown';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    let data = [];

    for (let i = 0; i < 100000; i++) {
        data.push({
            value: i,
            text: faker.commerce.productName()
        });
    }
    
    self.data = data; 

    return `<div>
        <Dropdown :data="self.data" :value="1" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Dropdown from '@lemonadejs/dropdown/dist/react';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'

let data = [];

for (let i = 0; i < 100000; i++) {
    data.push({
        value: i,
        text: faker.commerce.productName()
    });
}

export default function App() {
    const myRef = useRef();

    return (<div>
        <Dropdown ref={myRef} data={data} value={1} width={260} />
    </div>);
}
```
```vue
<template>
    <Dropdown :data="data" :value="1" :width="260" />
</template>

<script>
import Dropdown from '@lemonadejs/dropdown/dist/vue';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Dropdown
    },
    data() {
        let data = [];
        
        for (let i = 0; i < 100000; i++) {
            data.push({
                value: i,
                text: faker.commerce.productName()
            });
        }

        return {
            data: data
        };
    },
}
</script>
```

### Grouping and Multiple Selection

The dropdown supports categorizing options into lists, enhancing navigation and organization. It also allows multiple selections, enabling users to choose several options simultaneously for greater flexibility.

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>

<div id='root'></div>

<script>
let root = document.getElementById('root');

Dropdown(root, {
    data: [
        { "text": "Red", "value": 1, "group": "Warm" },
        { "text": "Blue", "value": 2, "group": "Cool" },
        { "text": "Green", "value": 3, "group": "Cool" },
        { "text": "Yellow", "value": 4, "group": "Warm" },
        { "text": "Purple", "value": 5, "group": "Cool" },
        { "text": "Gray", "value": 6, "group": "Cool" }
    ],
    value: 1,
    width: 260,
    multiple: true,
});
</script>
</html>
```
```javascript
import Dropdown from '@lemonadejs/dropdown';
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        { "text": "Red", "value": 1, "group": "Warm" },
        { "text": "Blue", "value": 2, "group": "Cool" },
        { "text": "Green", "value": 3, "group": "Cool" },
        { "text": "Yellow", "value": 4, "group": "Warm" },
        { "text": "Purple", "value": 5, "group": "Cool" },
        { "text": "Gray", "value": 6, "group": "Cool" }
    ]

    return `<div>
        <Dropdown :data="self.data" :value="1" :multiple="true" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Dropdown from '@lemonadejs/dropdown/dist/react';
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'


const data = [
    { "text": "Red", "value": 1, "group": "Warm" },
    { "text": "Blue", "value": 2, "group": "Cool" },
    { "text": "Green", "value": 3, "group": "Cool" },
    { "text": "Yellow", "value": 4, "group": "Warm" },
    { "text": "Purple", "value": 5, "group": "Cool" },
    { "text": "Gray", "value": 6, "group": "Cool" }
]

export default function App() {
    const myRef = useRef();

    return (<div>
        <Dropdown ref={myRef} data={data} value={1} width={260} multiple={true} />
    </div>);
}
```
```vue
<template>
    <Dropdown :data="data" :value="1" :width="260" :multiple="true" />
</template>

<script>
import Dropdown from '@lemonadejs/dropdown/dist/vue'
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'

export default {
    name: 'App',
    components: {
        Dropdown
    },
    data() {
        return {
            data: [
                { "text": "Red", "value": 1, "group": "Warm" },
                { "text": "Blue", "value": 2, "group": "Cool" },
                { "text": "Green", "value": 3, "group": "Cool" },
                { "text": "Yellow", "value": 4, "group": "Warm" },
                { "text": "Purple", "value": 5, "group": "Cool" },
                { "text": "Gray", "value": 6, "group": "Cool" }
            ]
        };
    },
}
</script>
```

### Autocomplete and Inserting New Options

The dropdown includes an autocomplete feature for fast, type-based option searches. Its DOM management system ensures efficient performance with large datasets. Users can also directly insert new options, offering enhanced flexibility and convenience.

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>

<div id='root'></div>

<script>
let root = document.getElementById('root');

let d = [];
for (let i = 0; i < 1000; i++) {
    d.push({
        value: i,
        text: faker.commerce.productName(),
    });
}

Dropdown(root, {
    data: d,
    value: 1,
    width: 260,
    autocomplete: true,
    insert: true,
});
</script>
</html>
```
```javascript
import Dropdown from '@lemonadejs/dropdown';
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css';

import { faker } from '@faker-js/faker';

export default function App() {
    const self = this;

    let d = [];
    for (let i = 0; i < 1000; i++) {
        d.push({
            value: i,
            text: faker.commerce.productName(),
        });
    }

    self.data = d

    return `<div>
        <Dropdown :data="self.data" :value="1" :autocomplete="true" :insert="true" />
    </div>`
}
```
```jsx
// codesandbox: https://codesandbox.io/p/devbox/clever-fast-8ky2d4

import React, { useRef } from 'react';
import Dropdown from '@lemonadejs/dropdown/dist/react';
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'

import { faker } from '@faker-js/faker';


let d = [];
for (let i = 0; i < 1000; i++) {
    d.push({
        value: i,
        text: faker.commerce.productName(),
    });
}

export default function App() {
    const myRef = useRef();

    return (<div>
        <Dropdown ref={myRef} data={d} value={1} width={260} autocomplete={true} insert={true} />
    </div>);
}
```
```vue
<!-- codesandbox: https://codesandbox.io/p/sandbox/fervent-goldberg-cpf3rq -->

<template>
    <Dropdown :data="data" :value="1" :width="260" :autocomplete="true" :insert="true" />
</template>

<script>
import Dropdown from '@lemonadejs/dropdown/dist/vue'
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'

import { faker } from '@faker-js/faker';

export default {
    name: 'App',
    components: {
        Dropdown
    },
    data() {
        let d = [];
        for (let i = 0; i < 1000; i++) {
            d.push({
                value: i,
                text: faker.commerce.productName(),
            });
        }

        return {
            data: d
        };
    },
}
</script>
```

## Codesandbox working examples

Here is more examples on codesandbox.

- [React Dropdown](https://codesandbox.io/p/devbox/clever-fast-8ky2d4){target="_blank"}
- [Vue Dropdown](https://codesandbox.io/p/sandbox/fervent-goldberg-cpf3rq){target="_blank"}

