title: JavaScript color picker
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, color picker
description: How to create a reactive JavaScript color picker with LemonadeJS.

LemonadeJS Color picker
=======================

The LemonadeJS JavaScript Color is a responsive and reactive component that simplifies color selection. It features two sections: a personalized palette and a pre-defined gradient of colors. With a customizable button, this component seamlessly integrates into your application, allowing users to pick colors effortlessly.  
  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/color
```

### Settings

| Attribute          | Description                                                               |
|--------------------|---------------------------------------------------------------------------|
| palette?: string[] | A matrix containing hexadecimal color values. There is a default palette. |
| closed?: boolean   | Controls the open and close state of the modal.                           |
| type?: 'default' | The type of element that will toggle the color picker modal. |
| value?: string     | The value of the color that is currently selected.                        |

### Events

| Event                               | Description |
|-------------------------------------| --- |
| onopen?: () => void                 | Called when modal opens. |
| onclose?: () => void                | Called when modal closes. |
| onupdate?: (instance.value) => void | Called when value updates. |

Examples
--------

### Quick example

Simple implementation of Color Component.  
[See this example on codesandbox](https://codesandbox.io/s/flamboyant-night-6fgj2c?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.min.css" />

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

    return `<div><Color type="inline" /><div/>`;
}
```
```jsx
import React, { useRef } from 'react';
import Color from '@lemonadejs/color/dist/react';

export default function App() {
    const myRef = useRef();

    return (<>
        <Color type={"inline"} ref={myRef}/>
    </>);
}
```
<!-- ```vue
<template>
        <Color type="inline" />
</template>

<script>
import Color from '@lemonadejs/color/dist/vue'

export default {
    name: 'App',
    components: {
        Color
    }
}
</script>

<style></style>
```
-->

### Customization

This example showcases the use of a custom element to toggle the color picker.  
[See this example on codesandbox](https://codesandbox.io/s/boring-drake-7xxwvq?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.css"/>

<input type="button" id="btn" value="Open"></div>

<div id="root"></div>

<script>
const root = document.getElementById("root");
const button = document.getElementById("btn");

const component = Color(root, {
    onupdate: function (s, color) {
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
        <Color :closed="true" :onupdate="self.handleUpdate" :palette="self.palette" :ref="self.component" />
    </>`
}
```
```jsx
import React, { useRef } from 'react';
import Color from '@lemonadejs/color/dist/react';

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
                onupdate={(s, color) => buttonRef.current.style.backgroundColor = color}
            />
        </div>
    </>);
}
```
<!-- ```vue
<template>
    <div>
        <button @click="this.$refs.colorRef.current.open()" ref="buttonRef">Open</button>
        <Color :palette="palette" :onupdate="updateColor" ref="colorRef" />
    </div>
</template>

<script>
import Color from '@lemonadejs/color/dist/vue'

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
``` -->