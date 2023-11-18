LemonadeJS Dropdown
====================

The LemonadeJS Dropdown is a dynamic solution for streamlined option management. Featuring autocomplete for quick selections, grouping for organized options, and lazy loading for optimized performance, this feature-rich dropdown ensures a seamless and enhanced user experience. 

- Autocomplete
- Grouping Options
- Lazy loading

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/dropdown
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/lazy-loading/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/lazy-loading/dist/style.min.css" />
```

### Basic Example

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
        { text: "Red", value: "1" },
        { text: "Blue", value: "2" },
        { text: "Green", value: "3" },
    ],
    placeholder: "Choose a color",
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
        { text: "Red", value: "1" },
        { text: "Blue", value: "2" },
        { text: "Green", value: "3" },
    ]

    return `<div style="width: 150px">
        <Dropdown :data="self.data" placeholder="Choose a color" value="'1'" />
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
                    { text: "Red", value: "1" },
                    { text: "Blue", value: "2" },
                    { text: "Green", value: "3" },
                ],
                value: "1",
                placeholder: "Choose a color",
            })
        }
    }, []);

    return (
        <div ref={domRef} style={{ width: '150px' }}></div>
    );
}
```

### Settings

| Property  | Type | Description |
|-----------|------|-------------|
| data | array | An optional alternative method for providing the title and content used as the basis for rendering the dropdown. |
| autocomplete? | boolean | Enables the autocomplete feature. Defaults to false. |
| placeholder? | string | The text displayed on the component while an option is not selected. |
| width? | string | The width of the component. |

### Events

| Event | Trigger |
| -------- | ---- |
| onopen? | Called when the component opens. |
| onclose? | Called when the component closes. |
| onchange? | Called when the value changes. |

