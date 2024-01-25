title: JavaScript Color Picker
keywords: LemonadeJS, Two-Way Data Binding, Frontend, JavaScript Library, JavaScript Plugin, JavaScript, Reactive, React, Color Picker
description: LemonadeJS introduces a versatile and responsive JavaScript color picker. This reactive component simplifies the color selection process in web applications.


![JavaScript Color Picker](img/javascript-color-picker.jpg){style="margin: 40px; width: initial;"}

JavaScript Color picker
=======================

`JavaScript Components`{.jtag .black .framework-images}

`Component size: 2.59KB gzipped`{.small}

The LemonadeJS JavaScript Color Picker is a lightweight, responsive, and reactive component for web applications. It features two primary elements: a customizable personal palette and a pre-defined color gradient. Additionally, it supports various events and offers seamless integration with frameworks like React, Vue, and Angular.  
  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/color
```

### Settings

| Attribute          | Description                                                                                       |
|--------------------|---------------------------------------------------------------------------------------------------|
| palette?: string[] | A matrix containing hexadecimal color values. There is a default palette.                         |
| closed?: boolean   | Controls the open and close state of the color picker modal.                                      |
| type?:string       | The type of element that will toggle the color picker modal. Options: 'input', 'inline' or empty. |
| value?: string     | The value of the color that is currently selected.                                                |

### Events

| Event                                             | Description                |
|---------------------------------------------------|----------------------------|
| onopen?: (self: object) => void                   | Called when modal opens.   |
| onclose?: (self: object) => void                  | Called when modal closes.  |
| onchange?: (self: object, string: value) => void  | Called when value changes. |

Examples
--------

### Inline usage

The `type: inline` configuration allows for embedding the color picker directly within a webpage or application. Utilizing this setup, user interactions with the color picker can trigger actions through events, facilitating a more interactive and integrated experience.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<div id="root"></div>

<script>
Color(document.getElementById("root"), {
    type: 'inline',
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';

function App() {
    let self = this;

    return `<><Color type="inline" /></>`;
}
```
```jsx
import React, { useRef } from 'react';
import Color from '@lemonadejs/color/dist/react';
import '@lemonadejs/color/dist/style.css';

export default function App() {
    const myRef = useRef();

    return (<>
        <Color type={"inline"} ref={myRef}/>
    </>);
}
```
```vue
<template>
    <Color type="inline" />
</template>

<script>
import Color from '@lemonadejs/color/dist/vue';
import '@lemonadejs/color/dist/style.css';

export default {
    name: 'App',
    components: {
        Color
    }
}
</script>
```

### Custom Color Palette

The following example illustrates how to incorporate the `onchange` event and customize the palette. It also features the default modal type, enabling users to open a modal for color selection from the color picker.

```html
<!-- codesandbox: https://codesandbox.io/p/sandbox/gifted-kowalevski-d6xyjy -->
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.css"/>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.css"/>

<input type="button" id="btn" value="Open"></div>

<div id="root"></div>

<script>
const root = document.getElementById("root");
const button = document.getElementById("btn");

const component = Color(root, {
    onchange: function (s, color) {
        button.style.backgroundColor = color;
    },
    palette: [
        ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
        ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
        ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
        ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
    ]
});

button.addEventListener('click', () => {
  component.open();
});
</script>
</html>
```
```javascript
// codesandbox: https://codesandbox.io/p/sandbox/lemonadejs-reactive-app-forked-s2rsll?file=%2Fsrc%2FApp.js
import lemonade from 'lemonadejs'
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';

lemonade.setComponents({ Color });

function App() {
    const self = this;

    self.handleUpdate = function(s, color) {
        button.style.backgroundColor = color;
    }   
 
    self.palette = [
        ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
        ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
        ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
        ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
    ];  

    return `<>
        <input type="button" onclick="self.component.open"></div>
        <Color :closed="true" :onchange="self.handleUpdate" :palette="self.palette" :ref="self.component" />
    </>`
}
```
```jsx
import React, { useRef } from 'react';
import Color from '@lemonadejs/color/dist/react';
import '@lemonadejs/color/dist/style.css';

const palette = [
    ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
    ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
    ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
    ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
]

export default function App() {
    const colorRef = useRef();
    const buttonRef = useRef();

    return (<>
        <div>
            <button onClick={() => colorRef.current.open()} ref={buttonRef}>Open</button>
            <Color
                palette={palette}
                ref={colorRef}
                onchange={(s, color) => buttonRef.current.style.backgroundColor = color}
            />
        </div>
    </>);
}
```
```vue
<template>
    <div>
        <button @click="this.$refs.colorRef.current.open()" ref="buttonRef">Open</button>
        <Color :palette="palette" :onchange="updateColor" ref="colorRef" />
    </div>
</template>

<script>
import Color from '@lemonadejs/color/dist/vue';
import '@lemonadejs/color/dist/style.css';

export default {
    name: 'App',
    components: {
        Color
    },
    data() {
        const palette = [
            ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
            ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
            ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
            ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
        ]

        return { palette }
    },
    methods: {
        updateColor(s, color) {
            this.$refs.buttonRef.style.backgroundColor = color;
        }
    }
}
</script>

<style></style>
```