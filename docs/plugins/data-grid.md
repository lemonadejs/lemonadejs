title: JavaScript Data Grid
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, reactive, react, plugins
description: A micro reactive javascript data grid with edition, search and pagination using LemonadeJS.

![JavaScript Data Grid](img/javascript-data-grid.jpg){style="width: initial; margin: 60px;"}

LemonadeJS Data Grid
====================

`JavaScript Components`{.jtag .black .framework-images}

The LemonadeJS JavaScript Data Grid is a lightweight (5KBytes) and highly customizable JavaScript component that provides a free (MIT) solution for rendering data in rows and columns. It offers features like search, filter, pagination, and in-cell editing, making it ideal for building complex interfaces. With its lightweight design and virtual scrolling, the data grid ensures fast and efficient performance, even with large datasets. Its flexibility allows easy configuration to suit specific requirements, providing developers with a powerful tool for creating scalable and interactive user interfaces.  

> You can utilize this component with Vanilla JavaScript, LemonadeJS, or React.
{.green style="display: inline-block"}

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/data-grid
```
  
### Settings

| Attribute             | Description                                                                                                                                                  |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| data: object[]        | The data that will be displayed on the grid based on the columns attribute.                                                                                  |
| columns: columnItem[] | Each columnItem object represents a column of data to be displayed. For more information about this object, please refer to the 'Column Item' section below. |
| pagination?: Number   | Enable the pagination and define the number of items per page.                                                                                               | 
| search?: Boolean      | Enable the search. `Default: false`                                                                                                                          |
| editable?: Boolean    | The grid is editable. `Default: false`                                                                                                                       |

### Column Item

The columns property regulates the presentation of columns on the JavaScript data grid, specifying characteristics such as the sequence of columns, their width, and the positioning of data within them.  

| Option                 | Description                                                                                                                                                                                                                                            |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **name**?: string      | Determines the key of the data object to which the column refers.                                                                                                                                                                                      |
| **title**: string      | Required. Determines the text that will be displayed in the column Header.                                                                                                                                                                             |
| **width**?: string     | This option specifies the width of the column and should be provided as a string with the unit of measurement, such as '200px' or '2.5em'. By default, the width is set to '100px'.                                                                    |
| **align**?: string     | This option determines the alignment of the text within the cells of the column. It should be provided as a string with a valid entry. The available options are 'left', 'right', 'center', and 'justify'. By default, the alignment is set to 'left'. |
| **render**?: function  | render(cell, x, y, value, instance) => void<br>                                                                                                                                                                                                        | This option allows you to override the default rendering of the column and instead render a specific value. It is particularly useful for rendering HTML elements or components. In the context of this property, the keyword 'self' refers to the current row being rendered. |

### Instance

| Property                                         | Description                       |
|--------------------------------------------------|-----------------------------------|
| data: object[]                                   | Change the state of data.         |
| page: Number                                     | Change the page index.            |
| pagination: Number                               | Enable pagination.                |
| search: Boolean                                  | Enable search.                    |
| sort: Function(sortBy: String, sortAsc: Boolean) | Sort the data.                    |
| setValue: Function(x: Number                     | String, y: Number, value: String) | Set the value of a cell. |

### Events

| Event                             | Description                            |
|-----------------------------------|----------------------------------------|
| onsearch?: (self) => void         | Called when a search happens.          |
| onchangepage?: (self) => void     | Called when the user changes the page. |
| onupdate?: (self, object) => void | Called when cell data is changed.      |

> ### Important points
>
> *   **Reserved Properties:** This library automatically generates an item for each index in the data array. Each array item contains two unique reserved properties, the el and parent, representing the DOM element and its parent self.
> *   **Modifying Cell Values:** When a user double-clicks a cell, it becomes editable. You can exit the edition mode by pressing 'Enter' or clicking on a different cell in the data grid.

Examples
--------

### How to create a data grid from JSON.

The LemonadeJS Data Grid component is designed for creating high-performance grids with features like search and pagination. It offers flexible settings for custom rendering and event handling. Below is a straightforward example demonstrating how to generate a grid from a JSON object:

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>
<p>
    <input type="button" value="Go To Page 2" id="goToPage">
    <input type="button" value="Change Value in 'Product' Second Line" id="updateProduct">
</p>
<script>
const datagrid = Datagrid(document.getElementById('root'), {
    data: [
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ],
    columns: [
        { name: 'name', title: 'Product', width: '80px', align: 'left' },
        { name: 'price', title: 'Price', width: '80px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ],
    pagination: 2,
    onupdate: () => {
        console.log('Data grid was updated')
    },
    onchangepage: () => {
        console.log('Data grid page changed')
    }
});

// This function assigns a value to the second cell of the column 'name'.
document.getElementById('goToPage').addEventListener('click', () => datagrid.page = 1);
document.getElementById('updateProduct').addEventListener('click', () => datagrid.setValue('name', 1, 'Blue Jeans'));
</script>
</html>
```
```javascript
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ]

    self.columns = [
        { name: 'name', title: 'Product', width: '200px', align: 'left' },
        { name: 'price', title: 'Price', width: '100px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ]

    // This function update the current page in pagination to 2.
    const goToPage2 = function () {
        self.ref.page = 1;
    }

    // This function assigns a value to the second cell of the column 'name'.
    const setItemValue = function () {
        self.ref.setValue('name', 2, 'Blue Jeans')
    }

    return `<div style="display: flex; justify-content: space-evenly">
        <Datagrid
            data="{{self.data}}"
            columns="{{self.columns}}"
            onupdate="console.log('Data grid was updated')"
            onchangepage="console.log('Data grid page changed')"
            :pagination="2"
            :ref="self.ref" />
        <input type="button" value="Go to Page 2" onclick="self.goToPage2()" />
        <input type="button" value="Change Value in 'Name' Second Line" onclick="self.setItemValue()" />
    </div>`
}
```
```jsx
import React, { useRef, useState } from "react";
import Datagrid from '@lemonadejs/data-grid/dist/react';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const datagridRef = useRef();

    const [columns] = useState([
        { name: 'name', title: 'Product', width: '200px', align: 'left' },
        { name: 'price', title: 'Price', width: '100px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ])

    const [data] = useState([
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ])

    // This function assigns a value to the second cell of the column 'name'.
    const setItemValue = function () {
        datagridRef.current.setValue('name', 1, 'Blue Jeans')
    }
    
    // This function update the current page in pagination to 2.
    const goToPage2 = function () {
        datagridRef.current.page = 1;
    }

    return (<>
        <Datagrid
            ref={datagridRef}
            data={data}
            columns={columns}
            pagination={2}
            onupdate={() => console.log('Data grid was updated')}
            onchangepage={() => console.log('Data grid page changed')}
        />
        <button onClick={() => goToPage2()}>Go To Page 2</button>
        <button onClick={() => setItemValue()}>Change Value in 'Name' Second Line</button>
    </>);
}
```
```vue
<template>
    <div>
        <Datagrid ref="datagridRef" :data="data" :columns="columns" :pagination="2" :onupdate="handleUpdate"
            :onchangepage="handleChangePage" />
        <button @click="goToPage2">Go To Page 2</button>
        <button @click="setItemValue">Change Value in 'Name' Second Line</button>
    </div>
</template>
  
<script>
import Datagrid from '@lemonadejs/data-grid/dist/vue';
import '@lemonadejs/data-grid/dist/style.css';

export default {
    name: 'App',
    components: {
        Datagrid,
    },
    data() {
        const columns = [
            { name: 'name', title: 'Product', width: '200px', align: 'left' },
            { name: 'price', title: 'Price', width: '100px', align: 'center' },
            { name: 'description', title: 'Description', width: '300px', align: 'left' },
        ];

        const data = [
            {
                id: 1,
                name: 'T-Shirt',
                price: 19.99,
                description: 'This is a high-quality cotton t-shirt in a variety of colors and sizes.',
            },
            {
                id: 2,
                name: 'Jeans',
                price: 49.99,
                description: 'These are premium denim jeans in a slim-fit style.',
            },
            {
                id: 3,
                name: 'Sneakers',
                price: 79.99,
                description: 'These are comfortable and stylish sneakers in a range of colors.',
            },
            {
                id: 4,
                name: 'Backpack',
                price: 39.99,
                description: 'This is a durable and spacious backpack with multiple compartments.',
            },
        ];

        return {
            columns,
            data,
        };
    },
    methods: {
        goToPage2() {
            this.$refs.datagridRef.current.page = 1
        },
        setItemValue() {
            this.$refs.datagridRef.current.setValue('name', 1, 'Blue Jeans')
        },
        handleUpdate() {
            console.log('Data grid was updated')
        },
        handleChangePage() {
            console.log('Data grid page changed')
        }
    }
};
</script>
```

### Programmatic Updates and Working with Large Data Sets

Upon creating a new data grid in LemonadeJS, an instance is generated that simplifies programmatic modifications. The following example highlights the data grid's ability to handle and load a large dataset. It also demonstrates the process of fetching data after initiating the data grid.

In this example, the mock data is retrieved from [fakerapi.it](https://fakerapi.it/), which is a free API for generating fake data.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>
<script>
const datagrid = Datagrid(document.getElementById('root'), {
    data: [],
    columns: [
        { name: 'firstname', title: 'First Name', width: '100px', align: 'center' },
        { name: 'lastname', title: 'Last Name', width: '100px', align: 'center' },
        { name: 'email', title: 'Email', width: '100px', align: 'left' },
        { name: 'phone', title: 'Phone', width: '150px', align: 'center' },
        { name: 'address.country', title: 'Country', width: '250px', align: 'left' },
    ],
    pagination: 10,
    search: true,
})

fetch('https://fakerapi.it/api/v1/persons?_quantity=500&_seed=1')
    .then(response => response.clone().json())
    .then(body => {
        datagrid.data = body.data;
    })
</script>
</html>
```
```javascript
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const self = this;

    self.data = []

    self.columns = [
        { name: 'firstname', title: 'First Name', width: '100px', align: 'center' },
        { name: 'lastname', title: 'Last Name', width: '100px', align: 'center' },
        { name: 'email', title: 'Email', width: '250px', align: 'left' },
        { name: 'phone', title: 'Phone', width: '150px', align: 'center' },
        { name: 'address.country', title: 'Country', width: '200px', align: 'left' },
    ]

    fetch('https://fakerapi.it/api/v1/persons?_quantity=500&_seed=1')
        .then(response => response.clone().json())
        .then(body => {
            self.data = body.data;
        })

    return `<Datagrid :data="self.data" :columns="self.columns" :pagination="10" :search="true" />`;
}
```
```jsx
import React, { useRef, useState, useEffect } from "react";
import Datagrid from '@lemonadejs/data-grid/dist/react';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const datagridRef = useRef();

    const [columns] = useState([
        { name: 'firstname', title: 'First Name', width: '100px', align: 'center' },
        { name: 'lastname', title: 'Last Name', width: '100px', align: 'center' },
        { name: 'email', title: 'Email', width: '250px', align: 'left' },
        { name: 'phone', title: 'Phone', width: '150px', align: 'center' },
        { name: 'address.country', title: 'Country', width: '200px', align: 'left' },
    ])

    const [data] = useState([])

    useEffect(() => {
        if (!datagridRef.current.innerText) {
            fetch('https://fakerapi.it/api/v1/persons?_quantity=500&_seed=1')
                .then(response => response.clone().json())
                .then(body => {
                    setData(body.data);
                })
        }
    }, [])

    return (<>
        <Datagrid
            ref={datagridRef}
            data={data}
            columns={columns}
            pagination={10}
            search={true}
        />
    </>);
}
```
```vue
<template>
    <div>
        <Datagrid ref="datagridRef" :data="data" :columns="columns" :pagination="10" :search="true" />
    </div>
</template>
  
<script>
import Datagrid from '@lemonadejs/data-grid/dist/vue';
import '@lemonadejs/data-grid/dist/style.css';

export default {
    name: 'App',
    components: {
        Datagrid,
    },
    data() {
        const columns = [
            { name: 'firstname', title: 'First Name', width: '100px', align: 'center' },
            { name: 'lastname', title: 'Last Name', width: '100px', align: 'center' },
            { name: 'email', title: 'Email', width: '250px', align: 'left' },
            { name: 'phone', title: 'Phone', width: '150px', align: 'center' },
            { name: 'address.country', title: 'Country', width: '200px', align: 'left' },
        ];

        const data = [];

        return {
            columns,
            data,
        };
    },
    mounted() {
        fetch('https://fakerapi.it/api/v1/persons?_quantity=500&_seed=1')
                .then(response => response.clone().json())
                .then(body => {
                    this.data = body.data;
                })
    }
};
</script>
```

### Custom Cell Rendering
This example demonstrates the render property, which enables HTML rendering within grid cells. This feature allows developers to design custom cell behaviours, tailoring the rendering process to specific requirements for each column.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>

<script>
const datagrid1 = Datagrid(document.getElementById('root'), {
        data: [
            { name: "Product A", price: 100, hasDiscount: false },
            { name: "Product B", price: 130, hasDiscount: true },
            { name: "Product C", price: 150, hasDiscount: true }
        ],
        columns: [
            {
                name: 'name',
                title: 'Product',
                width: '100px',
                align: 'center'
            },
            {
                name: 'price',
                title: 'Price',
                width: '100px',
                render: function (e, x, y, value, instance) {
                    e.innerHTML = instance.hasDiscount ? `<div><s>$ ${value}</s> -> <strong>$ ${value-20}</strong></div>` : `<div>$ ${value}</div>`;
                }
            },
        ]
});
</script>
</html>
```
```javascript
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        { name: "Product A", price: 100, hasDiscount: false },
        { name: "Product B", price: 130, hasDiscount: true },
        { name: "Product C", price: 150, hasDiscount: true }
    ];

    self.columns = [
        {
            name: 'name',
            title: 'Product',
            width: '100px',
            align: 'center'
        },
        {
            name: 'price',
            title: 'Price',
            width: '100px',
            render: function (e, x, y, value, instance) {
                e.innerHTML = instance.hasDiscount ? `<div><s>$ ${value}</s> -> <strong>$ ${value-20}</strong></div>` : `<div>$ ${value}</div>`;
            }
        },
    ];

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" />
    </div>`;
}
```
```jsx
// codesandbox: https://codesandbox.io/p/devbox/gifted-ully-6lmppx
import React, { useRef, useState } from "react";
import Datagrid from '@lemonadejs/data-grid/dist/react';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const datagridRef = useRef();

    const [columns] = useState([
        {
            name: 'name',
            title: 'Product',
            width: '100px',
            align: 'center'
        },
        {
            name: 'price',
            title: 'Price',
            width: '100px',
            render: function (e, x, y, value, instance) {
                e.innerHTML = instance.hasDiscount ? `<div><s>$ ${value}</s> -> <strong>$ ${value-20}</strong></div>` : `<div>$ ${value}</div>`;
            }
        },
    ]);

    const [data] = useState([
        { name: "Product A", price: 100, hasDiscount: false },
        { name: "Product B", price: 130, hasDiscount: true },
        { name: "Product C", price: 150, hasDiscount: true }
    ]);

    return (<>
        <Datagrid
            ref={datagridRef}
            data={data}
            columns={columns}
        />
    </>);
}
```
```vue
<!-- codesandbox: https://codesandbox.io/p/sandbox/epic-monad-smnxt8 -->
<template>
    <div>
        <Datagrid ref="datagridRef" :data="data" :columns="columns" />
    </div>
</template>
  
<script>
import Datagrid from '@lemonadejs/data-grid/dist/vue';
import '@lemonadejs/data-grid/dist/style.css';

export default {
    name: 'App',
    components: {
        Datagrid,
    },
    data() {
        const columns = [
            {
                name: 'name',
                title: 'Product',
                width: '100px',
                align: 'center'
            },
            {
                name: 'price',
                title: 'Price',
                width: '100px',
                render: function (e, x, y, value, instance) {
                    e.innerHTML = instance.hasDiscount ? `<div><s>$ ${value}</s> -> <strong>$ ${value-20}</strong></div>` : `<div>$ ${value}</div>`;
                }
            },
        ];

        const data = [
            { name: "Product A", price: 100, hasDiscount: false },
            { name: "Product B", price: 130, hasDiscount: true },
            { name: "Product C", price: 150, hasDiscount: true }
        ];

        return {
            columns,
            data,
        };
    },
};
</script>
```

Enterprise Data Grid
--------------------

### Jspreadsheet

Jspreadsheet is a remarkable commercial [data grid](https://jspreadsheet.com/) solution that offers a lightweight and efficient platform for building professional-grade data grids. It stands out with its Excel-like controls, providing users with a familiar and intuitive interface for data manipulation. With Jspreadsheet, developers can effortlessly create stunning and highly functional data grids that meet the highest standards of usability and aesthetics. Its lightweight design ensures optimal performance, allowing for seamless data rendering and interaction. Whether organizing, sorting, filtering, or performing complex calculations, Jspreadsheet empowers users to create fantastic, sophisticated data grids tailored to their needs.

[Jspreadsheet Data grid](https://jspreadsheet.com/)
