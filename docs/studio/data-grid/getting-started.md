LemonadeJS Data Grid
====================

The LemonadeJS data grid is a lightweight (5KBytes) and highly customizable JavaScript component that provides a solution for rendering data in rows and columns.

- Sorting
- Search
- Filter
- Pagination
- Cell Editing
- Fast and Efficient Performance


### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/data-grid
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
```

### Basic example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>

<script>
const data = [
    { id: 1, name: "T-Shirt", price: '$ 19.99' },
    { id: 2, name: "Jeans", price: '$ 49.99' },
    { id: 3, name: "Sneakers", price: '$ 79.99' },
    { id: 4, name: "Backpack", price: '$ 39.99' },
    { id: 5, name: "Hat", price: '$ 43.99' },
]

const columns = [
    { name: 'name', title: 'Product', width: '80px', align: 'left' },
    { name: 'price', title: 'Price', width: '80px', align: 'center' },
]

Datagrid(document.getElementById('root'), {
    data: data,
    columns: columns,
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
        { id: 1, name: "T-Shirt", price: '$ 19.99' },
        { id: 2, name: "Jeans", price: '$ 49.99' },
        { id: 3, name: "Sneakers", price: '$ 79.99' },
        { id: 4, name: "Backpack", price: '$ 39.99' },
        { id: 5, name: "Hat", price: '$ 43.99' },
    ]

    self.columns = [
        { name: 'name', title: 'Product', width: '80px', align: 'left' },
        { name: 'price', title: 'Price', width: '80px', align: 'center' },
    ]

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

const data = [
    { id: 1, name: "T-Shirt", price: '$ 19.99' },
    { id: 2, name: "Jeans", price: '$ 49.99' },
    { id: 3, name: "Sneakers", price: '$ 79.99' },
    { id: 4, name: "Backpack", price: '$ 39.99' },
    { id: 5, name: "Hat", price: '$ 43.99' },
]

const column = [
    { name: 'name', title: 'Product', width: '80px', align: 'left' },
    { name: 'price', title: 'Price', width: '80px', align: 'center' },
]

export default function App() {
    const domRef = useRef();
    const datagrid = useRef();

    useEffect(() => {
        if (! datagrid.current.innerText) {
            datagrid.current = Datagrid(domRef.current, {
                data: data,
                column: column,
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```

### Settings

| Attribute | Description |
| --- | --- |
| data: Array<Object> | The data that will be displayed on the grid based on the columns attribute. |
| columns: Array<Object> | Each object represents a column of data to be displayed. The key 'name' refers to the data object key. |
| pagination?: Number | Enable the pagination and define the number of items per page. | 
| search?: Boolean | Enable the search. `Default: false` |
| editable?: Boolean | The grid cells are editable. `Default: false` |

### Events

| Event | Description |
| --- | --- |
| onsearch?: (self) => void | Called when a search happens. |
| onchangepage?: (self) => void | Called when the user changes the page. |
| onupdate?: (self, object) => void | Called when cell data is changed. |

