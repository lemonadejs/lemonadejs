Data Grid Pagination
====================

Pagination can be enabled within the Data Grid, allowing it to divide its items into pages based on a specified number of items per page.

### How to enable

Simply add `pagination` followed by a numerical value to the options object. This number will determine the quantity of items displayed per page.

### Pagination Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>

<script>
const data = [
    { name: "John Smith", department: 'HR' },
    { name: "Jane Doe", department: 'IT' },
    { name: "Bob Johnson", department: 'Sales' },
    { name: "Alice Williams", department: 'Finance' },
    { name: "Mark Davis", department: 'Marketing' },
    { name: "Sarah Brown", department: 'IT' },
]

const columns = [
    { name: 'name', title: 'Name', width: '100px', align: 'left' },
    { name: 'department', title: 'Department', width: '80px', align: 'left' },
]

const datagrid = Datagrid(document.getElementById('root'), {
    data: data,
    columns: columns,
    pagination: 3, // This line will enable pagination
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
        { name: "John Smith", department: 'HR' },
        { name: "Jane Doe", department: 'IT' },
        { name: "Bob Johnson", department: 'Sales' },
        { name: "Alice Williams", department: 'Finance' },
        { name: "Mark Davis", department: 'Marketing' },
        { name: "Sarah Brown", department: 'IT' },
    ]

    self.columns = [
        { name: 'name', title: 'Name', width: '100px', align: 'left' },
        { name: 'department', title: 'Department', width: '80px', align: 'left' },
    ]

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" :pagination="3" /> 
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

const columns = [
    { name: 'name', title: 'Name', width: '100px', align: 'left' },
    { name: 'department', title: 'Department', width: '80px', align: 'left' },
]
const data = [
    { name: "John Smith", department: 'HR' },
    { name: "Jane Doe", department: 'IT' },
    { name: "Bob Johnson", department: 'Sales' },
    { name: "Alice Williams", department: 'Finance' },
    { name: "Mark Davis", department: 'Marketing' },
    { name: "Sarah Brown", department: 'IT' },
]

export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Datagrid(domRef.current, {
                data: data,
                column: column,
                pagination: 3, // This line will enable pagination
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```