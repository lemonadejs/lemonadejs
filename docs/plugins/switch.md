title: LemonadeJS Switch: Dynamic JavaScript Toggle Component for Vue, React, Angular
description: Discover the versatility of the LemonadeJS Switch, a dynamic and intuitive JavaScript plugin designed to serve as a toggle component seamlessly compatible with popular frameworks such as Vue and React. This framework-agnostic solution empowers developers to efficiently manage binary states within their web applications.
keywords: JavaScript switch plugin, LemonadeJS Switch, framework-agnostic JavaScript tool, Vue compatible switch, React switch component, Angular switch integration, customizable switch plugin, autocomplete feature, lazy loading integration, efficient option management, data visualization JavaScript, UI component for developers, web development tools, toggle, slider.

LemonadeJS Switch
===============

The LemonadeJS Switch component offers a dynamic and intuitive solution for managing binary states within your web applications. As a versatile and framework-agnostic JavaScript plugin, it seamlessly integrates with popular frameworks like Vue, React, and Angular. This feature-packed Switch component simplifies the implementation of toggle functionality, providing a streamlined user interface for binary choices.

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/switch
```

### Settings

| Attribute | Description |
|-----------|-------------|
| text?: string | The displayed text. |
| value?: any | The current value of the component. |
| name?: string | The attribute `name` assigned to the switch element. |
| disabled?: boolean | Disables the functionality of the switch. |

## Examples

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/style.min.css" />

<div id='root'></div>

<script>
let root = document.getElementById('root');

Switch(root, { text: 'Toggle' });
</script>
</html>
```
```javascript
import Switch from '@lemonadejs/switch';
import '@lemonadejs/switch/dist/style.css'

export default function App() {
    const self = this;

    return `<div>
        <Switch text="Toggle" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Switch from '@lemonadejs/switch/dist/react';
import '@lemonadejs/switch/dist/style.css'


export default function App() {
    const myRef = useRef();

    return (<div>
        <Switch ref={myRef} text={'Toggle'} />
    </div>);
}
```
```vue
<template>
    <Switch text="Toggle" />
</template>

<script>
import Switch from '@lemonadejs/switch/dist/react';
import '@lemonadejs/switch/dist/style.css'

export default {
    name: 'App',
    components: {
        Switch
    },
}
</script>
```