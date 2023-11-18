title: JavaScript Signature Pad Plugin
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, signature pad, plugins
description: Delve into an optimized reactive JavaScript signature pad implementation using the power of LemonadeJS.

Signature Pad
=============
`Pico Library`{.jtag .black}

This library has less than 2 KBytes  
  
The LemonadeJS JavaScript Signature Pad is a lightweight, reactive component that facilitates signature capture in web applications. Compatible with Vanilla, React, Vue, and Angular frameworks, it provides a canvas for capturing user signatures using mouse or touch input. With built-in methods for loading and retrieving signatures, developers can effortlessly build solutions that empower users to sign documents and securely store their signatures.  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/signature
```

### Attributes

| Attribute | Description |
|  --- | --- |
| value?: Array | The value represents the painted point's position. |
| width?: Number | The width of the signature pad. |
| height?: Number | The height of the signature pad. |
| instructions?: String | The instruction text. It appears at the bottom of the signature pad. |
| line?: Number | The size of each painted point. |
| disabled?: Boolean | Signature is disabled if true. |

### Methods

| Method | Description                                                                  |
| --- |------------------------------------------------------------------------------|
| getValue: function | Gets the value array  `instance.getValue() => number[][]`                    |
| setValue: function | Sets the internal state value  `instance.setValue(value: number[][]) => void` |
| getImage: function | Gets the image based on the value  `instance.getImage() => string`           |

### Events

| Event | Description                                                               |
| --- |---------------------------------------------------------------------------|
| onchange?: Function | When the value of the component changes  `onchange(value: object) => void` |
| onload?: Function | When the component completes loading  `onload(value: object) => void`     |

  
  

#### Codesandbox example

[See this example on codesandbox.](https://codesandbox.io/s/javascript-signature-pad-hdzckq)

Examples
--------

### Basic example

Basic example to show how to embed the LemonadeJS signature pad on your components.  

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/signature/dist/index.min.js"></script>
<div id="root"></div>
<script>
// Get the element to render signature component inside
const root = document.getElementById("root");
// Call signature with the root element and the options object
Signature(root, {
    value: [],
    width: 400,
    height: 200,
    instructions: "Please sign this document"
});
</script>
</html>
```
```javascript
import lemonade from "lemonadejs";
import Signature from "@lemonadejs/signature";

// Register signature component across the application
lemonade.setComponents({ Signature });

export default function Component() {
    const self = this;
    self.width = 400;
    self.height = 200;
    self.value = [];
    return `<Signature
        value="{{self.value}}"
        width="{{self.width}}"
        height="{{self.height}}"
        instructions="Please sign this document" />`;
}
```
```jsx
import React, { useEffect, useRef } from "react";
import Signature from "@lemonadejs/signature";

export default function Component() {
    const componentRef = useRef(null);

    useEffect(() => {
        if (!componentRef.current.innerText) {
            Signature(componentRef.current, {
                width: 400,
                height: 200,
                value: [],
                instructions: "Please sign this document"
            });
        }
    }, []);

    return <div ref={componentRef}></div>;
}
```

### Programmatic changes

The following example implement some programmatic changes in the JavaScript signature component.  

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/signature/dist/index.min.js"></script>

<div id="root"></div>

<input type="button" value="Update width" id="updateWidth" />
<input type="button" value="Update value" id="updateValue" />

<script>
// Call signature with the root element and the options object, saving its reference in a variable
const component = Signature(document.getElementById("root"), {
    width: 500,
    height: 200,
    value: [],
    onchange: (o) => {
        console.log(JSON.stringify(o.value));
    }
});

// Changes the value of the signature instance
updateValue.addEventListener("click", () => {
    component.value = [
        [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
        [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
        [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
        [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
    ];
});

updateWidth.addEventListener("click", () => {
    component.width = 800;
});
</script>
</html>
```
```javascript
import lemonade from "lemonadejs";
import Signature from "@lemonadejs/signature";

// Register signature component across the application
lemonade.setComponents({ Signature });

function Component() {
    const self = this;
    self.width = 500;
    self.height = 200;
    self.value = [];

    self.change = function() {
        console.log(JSON.stringify(self.value));
    }

    self.load = function() {
        self.value = [
            [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
            [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
            [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
            [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
        ];
    }

    return `<>
        <div class="signature">
            <Signature value="{{self.value}}"
               onchange="{{self.change}}"
               width="{{self.width}}"
               height="{{self.height}}"
               instructions="Please sign in the box above" />
        </div><br>
        <input type="button" value="Update width" onclick="self.width = 800" />
        <input type="button" value="Update value" onclick="self.load()"  />
    </>`;
}
```
```jsx
import React, { useEffect, useRef } from "react";
import Signature from "@lemonadejs/signature";
    
export default function Component() {
    const divRef = useRef(null);
    const componentRef = useRef(null);

    const change = function () {
        console.log(JSON.stringify(componentRef.current.value));
    };

    const increase = function () {
        componentRef.current.width = 800;
    };

    const load = function () {
        componentRef.current.value = [
            [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
            [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
            [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
            [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
        ];
    };

    useEffect(() => {
        if (!componentRef.current) {
            componentRef.current = Signature(divRef.current, {
                width: 500,
                height: 200,
                value: [],
                instructions: "Please sign in the box above",
                onchange: change
            });
        }
    }, []);

    return (
        <>
            <div ref={divRef}></div>
            <input type="button" value="Update width" onClick={() => increase()} />
            <input type="button" value="Update value" onClick={() => load()} />
        </>
    );
}
```
  
### Methods

Exporting the signature as image base64.  

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/signature/dist/index.min.js"></script>

<div id='root'></div>
<input type="button" value="Reset" id="resetCanvas" />
<input type="button" value="Download as image" id="getImage" />
<img id="image" class="image full-width" />

<script>
// Call signature with the root element and the options object, saving its reference in a variable
const component = Signature(document.getElementById("root"), {
    width: 500,
    height: 100,
    instructions: "Please sign in the box above"
});

resetCanvas.addEventListener("click", () => {
    component.value = [];
});

getImage.addEventListener("click", () => {
    getImage.nextElementSibling.src = component.getImage();
});
</script>
</html>
```
```javascript
import lemonade from "lemonadejs";
import Signature from "@lemonadejs/signature";

// Register signature component across the application
lemonade.setComponents({ Signature });

function Component() {
    const self = this;
    self.width = 500;
    self.height = 100;
    self.value = [];

    self.onGetImage = function() {
        self.image.src = self.component.getImage();
    };

    return `<>
        <div class="signature">
                <Signature :ref="self.component" value="{{self.value}}"
                    width="{{self.width}}"
                    height="{{self.height}}"
                    instructions="Please sign in the box above" />
        </div><br>
        <input type="button" value="Reset" onclick="self.value = []" />
        <input type="button" value="Download as image" onclick="self.onGetImage()" />
        <div>
            <img :ref="self.image" class="image full-width"/>
        </div>
    </>`;
}
```
```jsx
import React, { useEffect, useRef } from "react";
import Signature from "@lemonadejs/signature";

export default function Component() {
    const divRef = useRef(null);
    const componentRef = useRef(null);
    const imgRef = useRef(null);

    const onGetImage = function () {
        imgRef.current.src = componentRef.current.getImage();
    };

    const reset = function () {
        componentRef.current.value = [];
    };

    useEffect(() => {
        if (!componentRef.current) {
            componentRef.current = Signature(divRef.current, {
                width: 500,
                height: 100,
                value: [],
                instructions: "Please sign in the box above"
            });
        }
    }, []);

    return (
        <>
            <div ref={divRef}></div>
            <input type="button" value="Reset" onClick={() => reset()} />
            <input
                type="button"
                value="Download as image"
                onClick={() => onGetImage()}
            />
            <div>
                <img ref={imgRef} className="image full-width" />
            </div>
        </>
    );
}
```

### CSS for this section

```css
.signature {
    border: 1px dashed #ccc;
    display: inline-block;
    text-align: center;
    margin-bottom: 10px;
}
```
