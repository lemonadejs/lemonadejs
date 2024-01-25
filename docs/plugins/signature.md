title: LemonadeJS Signature Pad
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, signature pad, plugins
description: Delve into an optimized reactive JavaScript signature pad implementation using the power of LemonadeJS.

LemonadeJS Signature Pad
=============
`Pico Library`{.jtag .black .framework-images}

This library has less than 2 KBytes  
  
The LemonadeJS JavaScript Signature Pad is a lightweight, reactive component that facilitates signature capture in web applications. Compatible with Vanilla, React, Vue, and Angular frameworks, it provides a canvas for capturing user signatures using mouse or touch input. With built-in methods for loading and retrieving signatures, developers can effortlessly build solutions that empower users to sign documents and securely store their signatures.  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/signature
```

### Attributes

| Attribute | Type | Description |
|  --- | --- | --- |
| name? | String | Represents the identifier for the signature pad. |
| line? | Number | The size of each painted point. |
| value? | Array of Arrays | The value represents the painted point's position. |
| width? | Number | The width of the signature pad. |
| height? | Number | The height of the signature pad. |
| instructions? | String | The instruction text. It appears at the bottom of the signature pad. |
| getValue | Function | Gets the value array. |
| setValue | Function | Sets the internal state value. |
| getImage | Function | Gets the image based on the value. |

### Events

| Event | Description |
| --- |---------------|
| onchange? | When the value of the component changes |
| onload? | When the component completes loading |

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
import React, { useRef } from 'react';
import Signature from '@lemonadejs/signature/dist/react';

export default function App() {
    const signatureRef = useRef();

    return (<>
        <Signature
            ref={signatureRef}
            value={[]}
            width={400}
            height={200}
            instructions={"Please sign this document"}
        />
    </>);
}
```
```vue
<template>
    <Signature ref="signature" :value="[]" :width="400" :height="200" instructions="Please sign this document" />
</template>
  
<script>
import Signature from '@lemonadejs/signature/dist/vue';

export default {
    name: 'App',
    components: {
        Signature,
    },
};
</script>
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

function Component() {
    const self = this;

    self.change = function() {
        console.log(JSON.stringify(self.signRef.value));
    }

    self.load = function() {
        self.signRef.value = [
            [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
            [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
            [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
            [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
        ];
    }

    self.increase = function() {
        self.signRef.width = 800
    }

    return `<>
        <div class="signature">
            <Signature
                :ref="self.signRef"
                :value="[]"
                :onchange="self.change"
                :width="500"
                :height="200"
                instructions="Please sign in the box above"
            />
        </div><br>
        <input type="button" value="Update width" onclick="self.increase" />
        <input type="button" value="Update value" onclick="self.load"  />
    </>`;
}
```
```jsx
import React, { useRef } from 'react';
import Signature from '@lemonadejs/signature/dist/react';

export default function App() {
    const signatureRef = useRef();

    const displayNewValue = function () {
        console.log(JSON.stringify(signatureRef.current.value));
    };

    const increase = function () {
        signatureRef.current.width = 800;
    };

    const load = function () {
        signatureRef.current.value = [
            [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
            [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
            [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
            [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
        ];
    };

    return (<>
        <Signature
            ref={signatureRef}
            value={[]}
            width={500}
            height={200}
            instructions={"Please sign in the box above"}
            onchange={displayNewValue}
        />

        <input type="button" onClick={increase} value="Update Width" />
        <input type="button" onClick={load} value="Update Value" />
    </>);
}
```
```vue
<template>
    <Signature
        ref="signature"
        :value="[]"
        :width="500"
        :height="200"
        instructions="Please sign in the box above"
    />

    <input type="button" @click="increase" value="Update Width" />
    <input type="button" @click="load" value="Update Value" />
</template>
  
<script>
import Signature from '@lemonadejs/signature/dist/vue';

export default {
    name: 'App',
    components: {
        Signature,
    },
    methods: {
        increase() {
            this.$refs.signature.current.width = 800 
        },
        load() {
            this.$refs.signature.current.value = [
                [139,41],[139,45],[139,51],[139,56],[138,61],[138,65],[137,67],[137,69],[137,70],
                [137,71],[138,71],[142,66],[154,56],[171,45],[194,32],[220,21],[247,15],[270,10],
                [282,10],[292,11],[297,14],[297,15],[297,18],[297,20],[297,24],[297,27],[297,30],
                [297,33],[297,34],[297,35],[298,35],[299,36],[300,37],[302,37],1
            ]
        },
        displayNewValue() {
            console.log(JSON.stringify(this.$refs.signature.current.value));
        }
    }
};
</script>
```
  
### Methods

Exporting the signature as image base64.  

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/signature/dist/index.min.js"></script>

<div id='root'></div>
<input type="button" value="Reset" id="resetCanvas" />
<input type="button" value="Save as image" id="getImage" />
<img id="image" class="image full-width" />

<script>
const root = document.getElementById("root")
const resetCanvas = document.getElementById("resetCanvas")
const getImage = document.getElementById("getImage")
// Call signature with the root element and the options object, saving its reference in a variable
const component = Signature(root, {
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
import "@lemonadejs/signature";

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
import React, { useRef } from 'react';
import Signature from '@lemonadejs/signature/dist/react';

export default function App() {
    const signatureRef = useRef(null);
    const imgRef = useRef(null);

    const onGetImage = function () {
        imgRef.current.src = signatureRef.current.getImage();
    };

    const reset = function () {
        signatureRef.current.value = [];
    };

    return (<>
        <Signature
            ref={signatureRef}
            value={[]}
            width={500}
            height={100}
            instructions={"Please sign in the box above"}
        />

        <input type="button" value="Reset" onClick={reset} />
        <input
            type="button"
            value="Download as image"
            onClick={onGetImage}
        />
        <div>
            <img ref={imgRef} className="image full-width" />
        </div>
    </>);
}
```
```vue
<template>
    <Signature
        ref="signature"
        :value="[]"
        :width="500"
        :height="100"
        instructions="Please sign in the box above"
    />

    <input type="button" value="Reset" @click="reset" />
        <input
            type="button"
            value="Download as image"
            @click="onGetImage"
        />
        <div>
            <img ref="imgRef" className="image full-width" />
        </div>
</template>
  
<script>
import Signature from '@lemonadejs/signature/dist/vue';

export default {
    name: 'App',
    components: {
        Signature,
    },
    methods: {
        onGetImage() {
            this.$refs.imgRef.src = this.$refs.signature.current.getImage();
        },
        reset() {
            this.$refs.signature.current.value = [];
        }
    }
};
</script>
```

## Further references

### Downloading Image from Base64

To initiate the download of an image from the signature component, you can employ a method akin to the previous example, with additional code for downloading the base64-encoded image.

Below is a sample code snippet that can serve as a foundation:

{.ignore}
```javascript
function handleDownload() {
    // Retrieve the base64 string value from the signature component
    const cleanBase64 = component.getImage().split(',')[1]


    // Convert base64 to a blob
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });

    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'signature.png'; // Set the desired file name and extension

    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Remove the link from the page
    document.body.removeChild(downloadLink);
}
```