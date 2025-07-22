title: JavaScript Switch Button
description: Discover the versatility of the LemonadeJS Switch, a dynamic and intuitive JavaScript plugin designed to serve as a toggle component seamlessly compatible with popular frameworks such as Vue and React. This framework-agnostic solution empowers developers to efficiently manage binary states within their web applications.
keywords: JavaScript switch plugin, LemonadeJS Switch, framework-agnostic JavaScript tool, Vue compatible switch, React switch component, Angular switch integration, customizable switch plugin, autocomplete feature, lazy loading integration, efficient option management, data visualization JavaScript, UI component for developers, web development tools, toggle, slider.
canonical: https://lemonadejs.com/docs/plugins/switch

# JavaScript Switch Button

The LemonadeJS Switch component offers a dynamic and intuitive solution for managing binary states within your web applications. As a versatile and framework-agnostic JavaScript plugin, it seamlessly integrates with popular frameworks like Vue, React, and Angular. This feature-packed Switch component simplifies the implementation of toggle functionality, providing a streamlined user interface for binary choices.

## Documentation

### Installation

```bash
npm install @lemonadejs/switch
```

### Settings

| Attribute          | Description                                          |
|--------------------|------------------------------------------------------|
| text?: String      | The displayed text.                                  |
| value?: Any        | The current value of the component.                  |
| name?: String      | The attribute `name` assigned to the switch element. |
| disabled?: Boolean | Disables the functionality of the switch.            |

## Examples

### JavaScript Switch Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/style.min.css" />

<div id='root'></div>

<script>
function Component() {
    this.value = false;
    return render => render`<div>
        <p>Value: ${this.value}</p>
        <Switch text="Toggle" :bind="this.value" />
    </div>`
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import Switch from '@lemonadejs/switch';
import '@lemonadejs/switch/dist/style.css'

export default function App() {
    this.value = false;
    return render => render`<div>
        <p>Value: ${this.value}</p>
        <Switch text="Toggle" :bind="this.value" />
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


### Basic HTML Example

{.visible}
```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/style.min.css" />

<div id='root'></div>

<script>
Switch(document.getElementById('root'), {
    text: 'Toggle'
});
</script>
</html>
```


### Render as Web Component

{.visible}
```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/index.min.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/switch/dist/style.min.css" />

<lm-switch text="Bitcoin" value="true"></lm-switch><br>
<lm-switch text="Ethereum" value="false"></lm-switch>

</html>
```