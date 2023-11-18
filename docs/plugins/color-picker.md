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

| Attribute | Type | Description |
| --- | --- | --- |
| pallete? | Array | A matrix containing hexadecimal color values. There is a default palette. |
| closed? | Boolean | Controls the open and close state of the modal. |
| type? | String | The type of element that will toggle the color picker modal. Options: 'input',  'box' or empty. |
| value? | String | The value of the color that is currently selected. |

### Events

| Event | Type | Description |
| --- | --- | --- |
| onopen? | () => void | Called when modal opens. |
| onclose? | () => void | Called when modal closes. |
| onupdate? | (instance.value) => void | Called when value updates. |

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
const root = document.getElementById("root")

Color(root, {
    type: 'input',
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';

lemonade.setComponents({ Color });

function App() {
    let self = this;

    return `<>
            <Color type="input" />
        </>`;
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Color from "@lemonadejs/color";
import "@lemonadejs/color/dist/style.css";

export default function App() {
    const divRef = useRef(null);
    const colorRef = useRef(null);
  
    useEffect(() => {
        if (!colorRef.current) {
            colorRef.current = Color(divRef.current, {
                type: "input"
            });
        }
    }, []);
  
    return <div ref={divRef}></div>;
}
```

### Customization

This example showcases the use of a custom element to toggle the color picker.  
[See this example on codesandbox](https://codesandbox.io/s/boring-drake-7xxwvq?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.css"
/>

<button id="btn">
  Toggle Color Picker
</button>
<div id="root"></div>

<script>
const root = document.getElementById("root");
const button = document.getElementById("btn");

const component = Color(root, {
  onupdate: function (color) {
    button.style.color = color;
  },
  palette: [
    ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
    ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
    ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
    ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
  ]
});

button.onclick = function () {
  component.closed = !component.closed;
};
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

    self.handleUpdate = function(color) {
        self.fontColor = color;
    }   

    self.closed = true; 
    self.fontColor = '#000000'; 
    self.palette = [
        ['#001969', '#233178', '#394a87', '#4d6396', '#607ea4', '#7599b3' ],
        ['#00429d', '#2b57a7', '#426cb0', '#5681b9', '#6997c2', '#7daeca' ],
        ['#3659b8', '#486cbf', '#597fc5', '#6893cb', '#78a6d1', '#89bad6' ],
        ['#003790', '#315278', '#48687a', '#5e7d81', '#76938c', '#8fa89a' ],
    ];  

    return `<>
        <button onclick="self.closed = !self.closed" style="color: {{self.fontColor}};">Toggle Color Picker</button>
        <Color :closed="self.closed" :onupdate="self.handleUpdate" :palette="self.palette"/>
    </>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Color from "@lemonadejs/color";
import "@lemonadejs/color/dist/style.css";

export default function App() {
    const divRef = useRef(null);
    const colorRef = useRef(null);  

    const [color, setColor] = useState("#000000");  

    const handleToggle = function () {
        colorRef.current.closed = !colorRef.current.closed;
    };  

    useEffect(() => {
        if (!colorRef.current) {
            colorRef.current = Color(divRef.current, {
                onupdate: function (c) {
                    setColor(c);
                },
                palette: [
                    ["#001969", "#233178", "#394a87", "#4d6396", "#607ea4", "#7599b3"],
                    ["#00429d", "#2b57a7", "#426cb0", "#5681b9", "#6997c2", "#7daeca"],
                    ["#3659b8", "#486cbf", "#597fc5", "#6893cb", "#78a6d1", "#89bad6"],
                    ["#003790", "#315278", "#48687a", "#5e7d81", "#76938c", "#8fa89a"]
                ]
            });
        }
    }, []);

    return (
        <div>
            <button style={{ color: color }} onClick={handleToggle}>
                Toggle Color Picker
            </button>
            <div ref={divRef}></div>
        </div>
    );
}
```