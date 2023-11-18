title: JavaScript image cropper
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, plugins
description: A linkedin like reactive javascript image uploader plugin using LemonadeJS.

Image cropper
=============

The JavaScript image cropper is a plugin to support a user-friendly photo upload and allows small online editions such as image crop or changes in brightness, contrast, rotate, zoom.  
  
The LemonadeJS cropper is based on jsuites [image cropper](https://jsuites.net/v4/image-cropper) component.  
  

Documentation
-------------

| Method | Description |
| --- | --- |
| deletePhoto() | Clear any image on the container |
| uploadPhoto() | Open the modal to upload a new photo |
| getValue() | Get the photo information on the cropper container |
| setValue() | Set the photo to the cropper container |

Example
-------

A linkedin-style photo uploader with cropper and adjustments.  

[See this example on JSFiddle](https://codesandbox.io/s/javascript-image-cropper-v1dslm)  

#### JavaScript example

```html
<html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/css/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.css" type="text/css" />

<script src="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src='https://cdn.jsdelivr.net/npm/@lemonadejs/cropper/dist/cropper.min.js'></script>

<div id='root'></div>

<script>
function App() {
    const self = this;
    self.save = function() {
        console.log(self.cropper.getValue());
    }
    return `<>
        <div style="background: white">
            <Cropper :ref="self.cropper" />
        </div>
        <input type="button" value="console.log()" onclick="self.save()" />
    </>`
}
// Register component
lemonade.setComponents({ Cropper });
// Render app
lemonade.render(App, document.getElementById('root'));
</script>
</html>
```
```javascript
/*
For installation: % npm install @lemonadejs/cropper
To display everything right, add the following to your base html:

<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/css/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.css" type="text/css" />
*/
import lemonade from "lemonadejs";
import Cropper from '@lemonadejs/cropper';

// Register component
lemonade.setComponents({ Cropper });

// Make sure element id=root on the page
function App() {
    const self = this;
    self.save = function() {
        console.log(self.cropper.getValue());
    }
    return `<>
        <div style="border:1px solid #ccc;">
            <Cropper :ref="self.cropper" />
        </div>
        <input type="button" value="console.log()" onclick="self.save()" />
    </>`
}
// Render
lemonade.render(App, document.getElementById('root'));
```
```jsx
/*
For installation: % npm install @lemonadejs/cropper
To display everything right, add the following to your base html:

<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/css/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/cropper/cropper.min.css" type="text/css" />
*/
import React, { useRef, useEffect } from "react";
import lemonade from "lemonadejs";
import Cropper from "@lemonadejs/cropper";

// Register component
lemonade.setComponents({ Cropper });

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