LemonadeJS Tabs
====================

The LemonadeJS Tabs is a versatile and user-friendly component designed to seamlessly organize and showcase content through a series of responsive and reactive tabs. With this feature-rich component, users can easily navigate and explore different sections of content by selecting specific tabs, enabling a dynamic and engaging user experience.

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/tabs
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />
```

### Basic Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<div id='root'>
    <div title="First Tab">Content inside the first tab</div>
    <div title="Second Tab">Content inside the second tab</div>
</div>

<script>
let root = document.getElementById('root')
Tabs(root, { selected: 0 });
</script>
</html>
```
```javascript
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

export default function App() {
    const self = this;

    return `<Tabs :selected="0">
        <div title="First Tab">Content inside the first tab</div>
        <div title="Second Tab">Content inside the second tab</div>
    </Tabs>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';


export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Tabs(domRef.current, { selected: 0 });
        }
    }, []);

    return (
        <div ref={domRef}>
            <div title="First Tab">Content inside the first tab</div>
            <div title="Second Tab">Content inside the second tab</div>
        </div>
    );
}
```

### Settings

| Property  | Type | Description |
|-----------|------|-------------|
| data? | array | An optional alternative method to provide the title and content that will serve as the basis for rendering the tabs. |
| selected? | number | The index of the initially selected tab. Starts from 0. |
| position? | string   | The position of the tabs bar within the parent element. Use 'center' to center-align the tabs. |

### Events

| Event | Trigger |
| -------- | ---- |
| onopen?  | Called when a new tabs is opened. |

