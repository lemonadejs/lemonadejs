LemonadeJS Color
====================

The LemonadeJS Color is a responsive and reactive component that simplifies color selection. It features two sections: a personalized palette and a pre-defined gradient of colors. With a customizable button, this component seamlessly integrates into your application, allowing users to pick colors effortlessly.

- Palette Personalization

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/color
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />
```

### Basic Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<input type="button" value="Toggle" id="toggle-color">
<div id='root' style='height: 280px; width: 300px;'>
</div>

<script>
let root = document.getElementById('root')
let button = document.getElementById('toggle-color')
Color(root, { input: button });
</script>
</html>
```
```javascript
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';

export default function App() {
    const self = this;

    return `<Color />`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';


export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Color(domRef.current);
        }
    }, []);

    return (
        <div ref={domRef}></div>
    );
}
```

### Settings

| Property | Type  |Description |
| -------- | ---- |--------|
| palette? | array | A matrix containing hexadecimal color values. There is a default palette. |
| closed? | boolean | Controls the open and close state of the modal. |
| type? | string | The type of element that will toggle the color picker modal. Options: 'input', 'inline' or empty. |
| value? | string | The value of the color that is currently selected. |

### Events

| Event | Trigger |
| -------- | ---- |
| onopen? | Called when modal opens. |
| onclose? | Called when modal closes. |
| onupdate? | Called when value updates. |

