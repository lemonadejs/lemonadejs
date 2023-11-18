JavaScript Modal
================

The LemonadeJS JavaScript Modal is a responsive and reactive component that creates floating modals. With its flexible settings, users can easily configure draggability, closability, and resizability according to their needs.  
  

Documentation
-------------

  

### Installation

npm install @lemonadejs/modal

  

### Settings

| Attribute | Type | Description |
| --- | --- | --- |
| title? | String | The header title of the modal. If empty, the header will be not displayed. |
| height? | Number | The height of the modal in pixels. |
| width? | Number | The width of the modal in pixels. |
| top? | Number | The vertical position of the modal within its window in pixels. |
| left? | Number | The horizontal position of the modal within its window in pixels. |
| draggable? | Boolean | Determines if the modal can be dragged. `Default: false` |
| resizable? | Boolean | Determines if the modal can be resized. `Default: false` |
| closed? | Boolean | Controls the open and close state of the modal. `Default: false` |
| closable? | Boolean | Disables the ability to close the modal. `Default: false` |
| center? | Boolean | Enables rendering the modal in the center of its window. `Default: false` |
| url? | String | The URL from which to fetch and render content. |
| autoclose? | Boolean | Close the modal when loses its focus. |

### Events

| Event | Type | Description |
| --- | --- | --- |
onclose? | (instance) => void | Called when modal closes.
onopen? | (instance) => void | Called when modal opens.

  
  

### Useful Notes

*   **Keyboard Events:** The modal can be closed by pressing the 'Escape' key or using other available methods while it is open.

  
  

Examples
--------

  

### Basic example

How to use the modal in vanilla implementations.
[See this example on codesandbox](https://codesandbox.io/s/snowy-wood-ydy7vg?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root">
    <div style="display: flex; flex-direction: column; justify-content: center; padding: 10px;">
        <p>Quick example!</p>
        <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
    </div>
</div>

<script>
const root = document.getElementById("root")

Modal(root, {
    width: 400,
    height: 200,
    title: "My window modal"
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

lemonade.setComponents({ Modal });

export default function App() {
    const self = this;

    return `
        <>
            <Modal :width="400" :height="200" title="My window modal">
                <div style="display: flex; flex-direction: column; justify-content: center; padding: 10px;">
                    <p>Quick example!</p>
                    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
                </div>
            </Modal>
        </>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css";

const divStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "10px"
};

export default function App() {
    const wrapperRef = useRef(null);

    const modalRef = useRef(null);  

    useEffect(() => {
        if (!modalRef.current) {
            modalRef.current = Modal(wrapperRef.current, {
                width: 400,
                height: 200,
                title: "My window modal"
            });
        }
    }, []);

    return (
        <div ref={wrapperRef}>
            <div style={divStyle}>
                <p>Quick example!</p>
                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
            </div>
        </div>
    );
}    
```

### Modal position

The following example implements some features related to the modal position.  
[See this example on codesandbox](https://codesandbox.io/s/vibrant-margulis-lvntgw?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal@2.0.4/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%">
        <p>Drag me!</p>
        <input type="button" value="Set left to 0" onclick="component.left = 0" />
        <input type="button" value="Reset Position" onclick="reset()" />
    </div>
</div>

<script>
const root = document.getElementById("root")

const component = Modal(root, {
    width: 200,
    height: 200,
    draggable: true,
})

function reset () {
    // Sets the top and left to the initial position
    [component.top, component.left] = [0, 0]
}
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css"

const Component = function() {
    const self = this;

    self.reset = function () {
        // Sets the top and left to the initial position
        [self.modalRef.top, self.modalRef.left] = [0, 0];
    }

    return `<div>
    <Modal :width="200" :height="200" :draggable="true" :ref="self.modalRef">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%">
            <p>Drag me!</p>
            <input type="button" value="Set left to 0" onclick="self.parent.modalRef.left = 0" />
            <input type="button" value="Reset Position" onclick="self.parent.reset()" />
        </div>
    </Modal>
    </div>`
}

// Register signature component across the application
lemonade.setComponents({ Modal });

export default Component;
```
```jsx
import React, { useRef, useEffect } from "react";
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css";

const divStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%"
};

export default function App() {
    const wrapperRef = useRef(null);
    const modalRef = useRef(null);  

    const anchorLeft = () => {
        modalRef.current.left = 0;
    };  

    const reset = () => {
        [modalRef.current.top, modalRef.current.left] = [0, 0];
    };  

    useEffect(() => {
        if (!modalRef.current) {
            modalRef.current = Modal(wrapperRef.current, {
                width: 200,
                height: 200,
                draggable: true
            }); 
        }
    }, []); 

    return (
        <>
            <button onClick={() => anchorLeft()}>Set left to 0</button>
            <button onClick={() => reset()}>Reset Position</button> 
            <div ref={wrapperRef}>
                <div style={divStyle}>
                    <p>Drag me!</p>
                </div>
            </div>
        </>
    );
}    
```
  
  

### Modal dimensions

The following example implements some features related to the modal dimensions.  
[See this example on codesandbox](https://codesandbox.io/s/gifted-hertz-y7n7fz?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal@2.0.4/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<input type="button" value="Toggle modal" onclick="toggle()" />
<div id="root">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%">
        <p>Resize me clicking on the right or bottom borders</p>
        <input type="button" value="Set Width to 800" onclick="component.width = 800" />
        <input type="button" value="Set Height to 300" onclick="component.height = 300" />
    </div>
</div>

<script>
const root = document.getElementById("root")

const component = Modal(root, {
    width: 300,
    height: 200,
    resizable: true
})

function toggle() {
    component.closed = !component.closed
}
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css"

const Component = function() {
    const self = this;

    self.toggle = function() {
        self.modalRef.closed = !self.modalRef.closed
    }

    return `<div>
    <input type="button" value="Toggle modal" onclick="self.toggle()" />
    <Modal :width="300" :height="200" :resizable="true" :ref="self.modalRef">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%">
            <p>Resize me clicking on the right or bottom borders</p>
            <input type="button" value="Set Width to 800" onclick="self.parent.modalRef.width = 800" />
            <input type="button" value="Set Height to 300" onclick="self.parent.modalRef.height = 300" />
        </div>
    </Modal>
    </div>`
}


// Register signature component across the application
lemonade.setComponents({ Modal });

export default Component;
```
```jsx
import React, { useRef, useEffect } from "react";
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css";

const divStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%"
};

export default function App() {
    const wrapperRef = useRef(null);
    const modalRef = useRef(null);  

    const toggle = () => {
        modalRef.current.closed = !modalRef.current.closed;
    };  

    const setWidth = (width) => {
        modalRef.current.width = width;
    };  

    const setHeight = (height) => {
        modalRef.current.height = height;
    };  

    useEffect(() => {
        if (!modalRef.current) {
            modalRef.current = Modal(wrapperRef.current, {
                width: 300,
                height: 200,
                resizable: true
            });
        }
    }, []); 

    return (
      <>
        <button onClick={() => setWidth(800)}>Set Width to 800</button>
        <button onClick={() => setHeight(300)}>Set Height to 300</button>
        <button onClick={() => toggle()}>Toggle Modal</button>  
        <div ref={wrapperRef}>
          <div style={divStyle}>
            <p>Resize me clicking on the right or bottom borders</p>
          </div>
        </div>
      </>
    );
}    
```