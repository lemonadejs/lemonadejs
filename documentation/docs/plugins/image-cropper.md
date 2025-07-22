title: LemonadeJS Image Cropper
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, plugins
description: A linkedin like reactive javascript image uploader plugin using LemonadeJS.
canonical: https://lemonadejs.com/docs/plugins/image-cropper

# JavaScript Image Cropper

The JavaScript image cropper is a plugin to support a user-friendly photo upload and allows small online editions such as image crop or changes in brightness, contrast, rotate, zoom.  
  
The LemonadeJS cropper is based on jSuites [image cropper](https://jsuites.net/docs/image-cropper) component.  
  

## Documentation

### Install

```bash
npm install @lemonadejs/cropper
```

### Methods

| Method        | Description                                        |
|---------------|----------------------------------------------------|
| deletePhoto | Clear any image on the container                   |
| uploadPhoto | Open the modal to upload a new photo               |
| getValue    | Get the photo information on the cropper container |
| setValue    | Set the photo to the cropper container             |

### Example

A linkedin-style photo uploader with cropper and adjustments.  

[See this example on JSFiddle](https://codesandbox.io/s/javascript-image-cropper-v1dslm)  

#### JavaScript example

```html
<html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/css/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.css" type="text/css" />

<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<script src="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/studio/dist/index.min.js"></script>
<script src='https://cdn.jsdelivr.net/npm/@lemonadejs/cropper/dist/index.min.js'></script>

<div id='root'></div>

<script>
function App() {
    const save = () => {
        console.log(this.cropper.getValue());
    }
    return render => render`<div>
        <div style="background: white">
            <Cropper :ref="self.cropper" />
        </div>
        <input type="button" value="console.log()" onclick="${save}" />
    </div>`
}
// Render app
lemonade.render(App, document.getElementById('root'));
</script>
</html>
```
```javascript
import '@lemonadejs/cropper';

// Make sure element id=root on the page
function App() {
    const save = () => {
        console.log(this.cropper.getValue());
    }
    return render => render`<div>
        <div style="background: white">
            <Cropper :ref="self.cropper" />
        </div>
        <input type="button" value="console.log()" onclick="${save}" />
    </div>`
}
// Render
lemonade.render(App, document.getElementById('root'));
```
```jsx
import React, { useRef, useEffect } from "react";
import Cropper from "@lemonadejs/cropper";

// Make sure element id=root on the page
export default function App() {
  const divRef = useRef();

  useEffect(() => {
    if (divRef.current && !divRef.current.innerHTML) {
      lemonade.render(Cropper, divRef.current);
    }
  }, []);

  return (
    <div style={{ backgroundColor: '#AAA' }}>
      <div ref={divRef}></div>
    </div>
  );
}
```