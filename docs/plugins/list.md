title: LemonadeJS List - Arrays and Loops Simplified
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, lists, loops, arrays, plugins
description: Explore the LemonadeJS List component, a powerful library for creating dynamic elements with search and pagination from arrays of objects.

LemonadeJS List
===============================
`Pico Library`{.jtag .black .framework-images}

This library has less than 2 KBytes

The LemonadeJS List is a library to create elements with search and pagination. It helps transform an array of objects into a list of HTML elements based on a defined template. It brings search and pagination natively, and it is possible to bind extended methods to extend its features.


Documentation
-------------

### Installation

```bash
npm install @lemonadejs/list
```


### Attributes

| Attribute | Description |
| --- | --- |
| data: Array<Object> | Data should be an array of objects. |
| pagination?: Number | Enable the pagination and define the number of items per page. |
| search?: Boolean | Enable the search. |
| onsearch?: Function | When a search happens. |
| onchangepage?: Function | When the user changes the page. |

> ### Important points
>
> *   **Reserved self properties**: This library will create a item for each position of the data array. Each item will have its own self and a few reserved properties such as `self.el` and `self.parent`.
> *   **Template**: The content of the component <List>`all code here`</List> is the template which will serve to create the items from the list. It is important you have only one root element.
> * **React/Vue Template**: In both React and Vue, it is essential to pass the template as a property. This requirement arises from the necessity for Lemonade to render the template in the component. Exploration of this necessity is detailed in the examples below.

Examples
--------

### Basic example

Create quick reactive javascript lists with search and pagination.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/list/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/list/dist/style.min.css"/>
<div id='root' class="cards"></div>
<script>
    function Component() {
        const self = this;
        self.rows = [
            { name:"bulbasaur", id: 1 },
            { name:"ivysaur", id: 2 },
            { name:"venusaur", id: 3 },
            { name:"charmander", id: 4 },
            { name:"charmeleon", id: 5 },
            { name:"charizard", id: 6 },
            { name:"squirtle", id: 7 },
            { name:"wartortle", id: 8 },
            { name:"blastoise", id: 9 },
            { name:"caterpie", id: 10 },
        ];

        return `<>
            <List :data="self.rows" :search="true" :pagination="5">
                <div class="card">
                    <img src="/templates/default/img/pokemon/{{self.id}}.svg" />
                    <div>{{self.name}}</div>
                </div>
            </List>
        </>`;
    }
// Render component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from "lemonadejs";
import List from "@lemonadejs/list";
import "@lemonadejs/list/dist/style.css";
import "./style.css"; // The CSS file should incorporate the CSS provided beneath this example.


export default function Component() {
    const self = this;
    self.rows = [
        { name:"bulbasaur", id: 1 },
        { name:"ivysaur", id: 2 },
        { name:"venusaur", id: 3 },
        { name:"charmander", id: 4 },
        { name:"charmeleon", id: 5 },
        { name:"charizard", id: 6 },
        { name:"squirtle", id: 7 },
        { name:"wartortle", id: 8 },
        { name:"blastoise", id: 9 },
        { name:"caterpie", id: 10 },
    ];

    return `<>
        <List :data="self.rows" :search="true" :pagination="5">
            <div class="card">
                <img src="https://lemonadejs.net/templates/default/img/pokemon/{{self.id}}.svg" />
                <div>{{self.name}}</div>
            </div>
        </List>
    </>`;
}
```
```jsx
import React, { useRef } from "react";
import List from "@lemonadejs/list/dist/react";
import "@lemonadejs/list/dist/style.css";

export default function Component() {
    const component = useRef();

    const rows = [
        { name:"bulbasaur", id: 1 },
        { name:"ivysaur", id: 2 },
        { name:"venusaur", id: 3 },
        { name:"charmander", id: 4 },
        { name:"charmeleon", id: 5 },
        { name:"charizard", id: 6 },
        { name:"squirtle", id: 7 },
        { name:"wartortle", id: 8 },
        { name:"blastoise", id: 9 },
        { name:"caterpie", id: 10 },
    ]

    const template = `<div class="card">
            <img src="/templates/default/img/pokemon/{{self.id}}.svg" />
            <div>{{self.name}}</div>
        </div>`

    return (<div>
        <List ref={component} data={rows} search={true} pagination={5} template={template} />
    </div>)
}
```
```vue
<template>
    <List :ref="component" :data="rows" :pagination="5" :search="true" :template="template" />
</template>

<script>
import List from '@lemonadejs/list/dist/vue';
import '@lemonadejs/list/dist/style.css';

export default {
    name: 'App',
    components: {
        List,
    },
    data() {
        const rows = [
            { name:"bulbasaur", id: 1 },
            { name:"ivysaur", id: 2 },
            { name:"venusaur", id: 3 },
            { name:"charmander", id: 4 },
            { name:"charmeleon", id: 5 },
            { name:"charizard", id: 6 },
            { name:"squirtle", id: 7 },
            { name:"wartortle", id: 8 },
            { name:"blastoise", id: 9 },
            { name:"caterpie", id: 10 },
        ];

        const template = `<div class="card">
            <img src="/templates/default/img/pokemon/{{self.id}}.svg" />
            <div>{{self.name}}</div>
        </div>`;

        return {
            rows,
            template
        }
    }
};
</script>
```



### Example with operations

The next example implements two operations on the array of objects.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/list/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/list/dist/style.min.css" />
<div id='root'></div>
<script>
// Create basic component
const Countries = function() {
    const self = this;

    self.countries = [
        { "name": "Australia" },
        { "name": "Austria" },
        { "name": "Chile" },
    ];

    self.add = function() {
        // Add the country
        self.countries.push({ name: self.name.value });
        // Refresh the array
        self.refresh('countries');
    }

    self.delete = function(_, s) {
        // Find and delete the position based on the self given
        self.countries.splice(self.countries.indexOf(s), 1);
        // Refresh the array
        self.refresh('countries');
    }

    return `<>
        <List :data="self.countries" search="false">
            <div class="p4">
                <span style="width: 200px; display: inline-block">{{self.name}}</span>
                <input type="button" onclick="self.parent.parent.delete" value="Delete" style="width: 80px;" />
            </div>
        </List>
        <div class="p4">
            <input type="text" :ref="self.name" placeholder="Add new item" style="width: 200px;" />
            <input type="button" value="Add" onclick="self.add" style="width: 80px;" />
        </div>
    </>`;
}
lemonade.render(Countries, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function() {
    const self = this;

    self.countries = [
        { "name": "Australia" },
        { "name": "Austria" },
        { "name": "Chile" },
    ];

    self.add = function() {
        // Add the country
        self.countries.push({ name: self.name.value });
        // Refresh the array
        self.refresh('countries');
    }

    self.delete = function(_, s) {
        // Find and delete the position based on the self given
        self.countries.splice(self.countries.indexOf(s), 1);
        // Refresh the array
        self.refresh('countries');
    }

    return `<>
        <List :data="self.countries" search="false">
            <div class="p4">
                <span style="width: 200px; display: inline-block">{{self.name}}</span>
                <input type="button" onclick="self.parent.parent.delete" value="Delete" style="width: 80px;" />
            </div>
        </List>
        <div class="p4">
            <input type="text" :ref="self.name" placeholder="Add new item" style="width: 200px;" />
            <input type="button" value="Add" onclick="self.add" style="width: 80px;" />
        </div>
    </>`;
}
```
```jsx
import React, { useRef, useEffect, useState } from "react";
import List from "@lemonadejs/list/dist/react";
import "@lemonadejs/list/dist/style.css";

const rows = [
    { "name": "Australia" },
    { "name": "Austria" },
    { "name": "Chile" },
];

export default function Component() {
    const component = useRef();
    const name = useRef();

    const [data, setData] = useState(rows);
    let d = data

    const template = `<div class="p4">
        <span style="width: 200px; display: inline-block">{{self.name}}</span>
        <input type="button" onclick="self.parent.delete" value="Delete" style="width: 80px;" />
    </div>`

    const add = function () {
        d = [...data, { name: name.current.value }]
        setData(d)
    }

    useEffect(() => {
        if (component.current) {
            component.current.delete = function (_, s) {
                let i = d.indexOf(s)
                d = d.slice(0, i).concat(d.slice(i + 1))
                setData(d)
            }
        }
    })

    return (<div>
        <List ref={component} data={data} search={false} template={template} />
        <div className="p4">
            <input type="text" ref={name} placeholder="Add new item" style={{width: '200px'}} />
            <input type="button" value="Add" onClick={add} style={{width: '80px'}} />
        </div>
    </div>)
}
```
```vue
<template>
    <List ref="component" :data="countries" :search="false" :template="template" />
    <div class="p4">
            <input type="text" ref="name" placeholder="Add new item" style="width: 200px;" />
            <input type="button" value="Add" @click="add" style="width: 80px;" />
    </div>
</template>

<script>
import List from '@lemonadejs/list/dist/vue';
import '@lemonadejs/list/dist/style.css';

export default {
    name: 'App',
    components: {
        List,
    },
    data() {
        const countries = [
            { "name": "Australia" },
            { "name": "Austria" },
            { "name": "Chile" },
        ];

        const template = `<div class="p4">
                <span style="width: 200px; display: inline-block">{{self.name}}</span>
                <input type="button" onclick="self.parent.delete" value="Delete" style="width: 80px;" />
            </div>`;

        return {
            countries,
            template
        }
    },
    mounted() {
        const self = this;

        this.$refs.component.current.delete = function (_, s) {
            let i = self.countries.indexOf(s)
            self.countries = self.countries.slice(0, i).concat(self.countries.slice(i + 1));
        }
    },
    methods: {
        add: function () {
            this.countries = [...this.countries, { name: this.$refs.name.value }];
        }
    }
};
</script>
```

#### Custom CSS for this example


```css
.cards .list-content {
    display: flex;
    max-width: 600px;
}
.card {
    width: 80px;
    height: 80px;
    margin: 5px;
    text-align: center;
    font-size: 0.8em
}
.card img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}
```