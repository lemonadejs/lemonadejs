Color Pallete Personalization
====================

Palette Personalization in our Color Picker component allows users to customize color palettes for a personalized experience. Easily organize and categorize colors based on projects or themes, enhancing efficiency and usability. This feature provides flexibility, enabling users to create a tailored color palette that aligns seamlessly with their design preferences.

### How to enable

Enhance your palette customization by adding a matrix of color values to the configuration object, where each value corresponds to a square on the color grid. For instance:

```
palette: [
    ['#001969', '#233178', '#394a87', '#4d6396', '#607ea4', '#7599b3' ],
    ['#00429d', '#2b57a7', '#426cb0', '#5681b9', '#6997c2', '#7daeca' ],
    ['#3659b8', '#486cbf', '#597fc5', '#6893cb', '#78a6d1', '#89bad6' ],
    ['#003790', '#315278', '#48687a', '#5e7d81', '#76938c', '#8fa89a' ],
]
```

### Palette Personalization Example

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
Color(root, {
    input: button,
    palette: [
        ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF' ],
        ['#00429d', '#2b57a7', '#426cb0', '#5681b9', '#6997c2', '#7daeca' ],
        ['#3659b8', '#486cbf', '#597fc5', '#6893cb', '#78a6d1', '#89bad6' ],
        ['#003790', '#315278', '#48687a', '#5e7d81', '#76938c', '#8fa89a' ],
    ]
});
</script>
</html>
```
```javascript
import Color from '@lemonadejs/color';
import '@lemonadejs/color/dist/style.css';

export default function App() {
    const self = this;

    self.palette = [
        ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF' ],
        ['#00429d', '#2b57a7', '#426cb0', '#5681b9', '#6997c2', '#7daeca' ],
        ['#3659b8', '#486cbf', '#597fc5', '#6893cb', '#78a6d1', '#89bad6' ],
        ['#003790', '#315278', '#48687a', '#5e7d81', '#76938c', '#8fa89a' ],
    ]

    return `<Color :palette="self.palette" />`
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
            Color(domRef.current, {
                input: button,
                palette: [
                    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF' ],
                    ['#00429d', '#2b57a7', '#426cb0', '#5681b9', '#6997c2', '#7daeca' ],
                    ['#3659b8', '#486cbf', '#597fc5', '#6893cb', '#78a6d1', '#89bad6' ],
                    ['#003790', '#315278', '#48687a', '#5e7d81', '#76938c', '#8fa89a' ],
                ]
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```