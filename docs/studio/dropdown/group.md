Dropdown Group
====================

The Grouping Options feature in the LemonadeJS Dropdown allows you to organize and categorize options by segregating them into groups. This creates a structured and visually appealing dropdown menu for users.

### How it Works

To implement Grouping Options, add a `group` key to each option in the `data` array, specifying the group to which the option belongs. The dropdown will automatically group the options by the specified groups in ascending order.

### Example:

Consider the following array of options:

```
[
    { text: "New York", value: "1" },
    { text: "Paris", value: "2" },
    { text: "Los Angeles", value: "3" },
    { text: "London", value: "4" },
]
```

To introduce grouping, add the group key to each option:

```
[
    { text: "New York", value: "1", group: "NA" },
    { text: "Paris", value: "2", group: "EU" },
    { text: "Los Angeles", value: "3", group: "NA" },
    { text: "London", value: "4", group: "EU" },
]
```

### Practical Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/lazy-loading/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/lazy-loading/dist/style.min.css" />

<div id='root' style="width: 150px"></div>

<script>
let root = document.getElementById('root');

Dropdown(root, {
    data: [
        { text: "New York", value: "1", group: "NA" },
        { text: "Paris", value: "2", group: "EU" },
        { text: "Los Angeles", value: "3", group: "NA" },
        { text: "London", value: "4", group: "EU" },
    ],
    value: "1",
});
</script>
</html>
```
```javascript
import Dropdown from '@lemonadejs/dropdown';
import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/lazy-loading/dist/style.css'
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        { text: "New York", value: "1", group: "NA" },
        { text: "Paris", value: "2", group: "EU" },
        { text: "Los Angeles", value: "3", group: "NA" },
        { text: "London", value: "4", group: "EU" },
    ]

    return `<div style="width: 150px">
        <Dropdown :data="self.data" value="'1'" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Dropdown from '@lemonadejs/dropdown';
import '@lemonadejs/dropdown/dist/style.css';
import '@lemonadejs/lazy-loading/dist/style.css'
import '@lemonadejs/modal/dist/style.css';


export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Dropdown(domRef.current, {
            data: [
                { text: "New York", value: "1", group: "NA" },
                { text: "Paris", value: "2", group: "EU" },
                { text: "Los Angeles", value: "3", group: "NA" },
                { text: "London", value: "4", group: "EU" },
            ],
            value: "1",
        })
        }
    }, []);

    return (
        <div ref={domRef} style={{ width: '150px' }}></div>
    );
}
```
