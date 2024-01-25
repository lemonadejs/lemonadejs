title: JavaScript Modal: Responsive and Reactive Floating Modals for Vue, React, Angular | LemonadeJS
keywords: LemonadeJS Modal, responsive modal, reactive component, floating modals, Vue, React, Angular, draggable modals, closable modals, resizable modals, user interaction, UI optimization, web development, JavaScript UI components
description: Discover LemonadeJS Modal, a dynamic and responsive JavaScript component for creating floating modals in web applications. It is designed for versatility and features configurable options like draggability, closability, and resizability, enhancing user interaction and integration across Vue, React, and Angular.

![JavaScript Modal](img/javascript-modal.jpg){style="width: initial; margin: 60px;"}

# JavaScript Modal

`JavaScript Components`{.jtag .black .framework-images}

`Component size: 2.79KB gzipped`{.small}

## Overview

LemonadeJS Modal is a lightweight, responsive, and reactive JavaScript component designed to create dynamic floating modals. It offers flexible configuration options, allowing extended features such as draggability, closability, and resizability to meet specific user requirements.

## Configurable Features

LemonadeJS Modal offers a range of customizable features, giving developers the flexibility to tailor the modals to their specific needs. Below are some of the key configurable settings:

- **Draggable**: Easy to move across the screen.
- **Resizable**: Adjust modal size with ease.
- **Layered Modals**: Manage multiple modals with layer control.
- **Minimizable**: Option to minimize the modal.
- **Auto-Close**: Automatically closes when clicking outside the modal.
- **Auto-Adjust**: Adjusts position within the visible viewport.
- **Positioning**: Customizable modal placement.
- **Responsive Design**: Adapts to different screen sizes.
- **Reactive Functionality**: Reacts to user interactions and data changes.

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/modal
```

### Settings

| Attribute    | Type    | Description                                                                |
|--------------|---------|----------------------------------------------------------------------------|
| title?       | String  | The header title of the modal. If empty, the header will be not displayed. |
| height?      | Number  | The height of the modal in pixels.                                         |
| width?       | Number  | The width of the modal in pixels.                                          |
| top?         | Number  | The vertical position of the modal within its window in pixels.            |
| left?        | Number  | The horizontal position of the modal within its window in pixels.          |
| draggable?   | Boolean | Determines if the modal can be dragged. `Default: false`.                  |
| resizable?   | Boolean | Determines if the modal can be resized. `Default: false`.                  |
| closed?      | Boolean | Controls the open and close state of the modal. `Default: false`.          |
| closable?    | Boolean | Disables the ability to close the modal. `Default: false`.                 |
| position?    | String  | center, left, right, bottom, absolute. `Default: none`.                    |
| url?         | String  | The URL from which to fetch and render content.                            |
| auto-close?  | Boolean | Close the modal when it loses the focus. `Default: false`.                 |
| auto-adjust? | Boolean | Ensures modal will be visible on screen. `Default: false`.                 |
| backdrop?    | Boolean | Enables the backdrop when the modal is opened.                             |
| minimizable? | Boolean | Modal can be minimized. `Default: false`.                                  |
| minimized?   | Boolean | Current minimized state of the modal.                                      |
| position?    | String  | Modal is automatic align during initialization.                            |
| title?       | String  | Title of the modal.                                                        |
| responsive?  | Boolean | Enables responsive mode. `Default: true`.                                  |
| layers?      | Boolean | Bring to front on focus.                                                   |
| focus?       | Boolean | Focus on the modal when open it. `Default: true`.                          |
| overflow?    | Boolean | Create scroll when the content is larger than the modal. `Default: false`. |


### Events

| Event                        | Description |
|------------------------------| --- |
| onclose? | Called when modal closes. |
| onopen? | Called when modal opens. |

{.green}
> **Keyboard Events:** The modal can be closed by pressing the 'Escape' key or using other available methods while it is open.
> **Material icons:** It requires material icons.
  

Examples
--------

### Basic example

This example demonstrates the presentation of a centrally positioned modal and outlines procedures for managing its opening and closing.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root">
    <div style="padding: 10px;">
        <p>Quick example!</p>
        <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
    </div>
</div>
<input type="button" value="Toggle Modal" id="button" />

<script>
const modal = Modal(document.getElementById("root"), {
    width: 400,
    height: 200,
    title: "My window modal",
    closed: true,
    closable: true,
    draggable: true,
    position: 'center',
});
button.addEventListener('click', () => {
    modal.closed = !modal.closed;
});
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.toggle = function () {
        self.modal.closed = !self.modal.closed
    }

    return `<>
        <Modal :ref="self.modal" :width="400" :height="200" title="My window modal" :closed="true"
            :closable="true" :draggable="true" position="center">
            <div style="padding: 10px;">
                <p>Quick example!</p>
                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
            </div>
        </Modal>
        <input type="button" value="Toggle Modal" onclick="self.toggle" />        
    </>`
}
```
```jsx
import React, { useRef, useState } from "react";
import Modal from "@lemonadejs/modal/dist/react";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const modalRef = useRef(null);

    const [closed, setClosed] = useState(true)

    return (<>
        <Modal ref={modalRef} width={400} height={200} title={"My window modal"} closed={closed}
            closable={true} draggable={true} position={"center"}>
            <div>
                <p>Quick example!</p>
                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
            </div>
        </Modal>
        <input type="button" value="Toggle Modal" onClick={() => setClosed(!closed)} />
    </>);
}
```
```vue
<template>
    <Modal ref="modal" :position="center" :width="400" :height="200" title="My window modal"
       :closed="true" :closable="true" :draggable="true" position="center">
        <div>
            <p>Quick example!</p>
            <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
        </div>
    </Modal>
</template>
<script>
import Modal from '@lemonadejs/modal/dist/vue';

import '@lemonadejs/modal/dist/style.css'

export default {
    name: 'App',
    components: {
        Modal,
    },
    data() {
        return {
            width: 400,
            height: 200,
            title: "My window modal",
            closed: true,
            closable: true,
            draggable: true,
            position: 'center',
        };
    }
};
</script>
```

### Minimizable modals

Create multiple minimizable modals via JavaScript. This feature can be util on Chat Application or application that requires multiple windows. 

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root"></div>

<input type="button" value="Create Modal" id="createModal" />

<script>
const root = document.getElementById("root");

const create = function(val) {
    let d = document.createElement('div');
    root.appendChild(d);

    Modal(d, {
        draggable: true,
        title: "Modal" + val,
        width: 100,
        height: 100,
        position: 'center',
        closable: true,
        minimizable: true
    });
}

let i = 0;

document.getElementById("createModal").addEventListener("click", () => {
    create(++i);
});
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css"

export default function Component() {
    const self = this;

    self.setLeft = function () {
        self.modalRef.left = 0
    }

    return `<div>
        <Modal :draggable="true" title="Drag by clicking here" :width="200"
            :height="200" :ref="self.modalRef" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Modal from "@lemonadejs/modal/dist/react";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const modalRef = useRef(null);  

    const setLeft = () => {
        modalRef.current.left = 0;
    };  

    return (<>
        <input type="button" onClick={setLeft} value="Set to Left" />
        <Modal ref={modalRef} draggable={true} title={"Drag by clicking here"} width={200} height={200} />
    </>);
}
```
```vue
<template>
    <input type="button" @click="setLeft" value="Set to Left" />
    <Modal ref="modal" :draggable="true" title="Drag by clicking here" :width="200" :height="200" />
</template>
  
<script>
import Modal from '@lemonadejs/modal/dist/vue';
import '@lemonadejs/modal/dist/style.css'

export default {
    name: 'App',
    components: {
        Modal,
    },
    methods: {
        setLeft() {
            this.$refs.modal.current.left = 0;
        }
    }
};
</script>
```
## Advanced example

### Reactive properties

Please open the modal and change the configuration. You can have a compreensive configuration that makes this plugin a very useful reusable JavaScript indepdent of the framework you are using.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<div id="root"></div>

<script>
function Component() {
    const self = this;

    self.toggle = function () {
        self.modal.closed = !self.modal.closed
    }
    
    self.onchange = function(prop) {
        if (prop === 'position') {
            self.modal.top = '0';
            self.modal.left = '0';
        }
    }

    // Default Properties
    self.title = 'My modal';
    self.position = 'center';
    self.draggable = true;
    self.resizable = true;
    self.closable = true;

    return `<div>
        <Modal :position="self.position" :draggable="self.draggable" :closable="self.closable" :resizable="self.resizable"
            :title="self.title" :closed="true" :minimizable="self.minimizable" :ref="self.modal">
            <div class="p20">
                <p>Quick example!</p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...
            </div>
        </Modal>
        <div class="form-group">
            <label>Title:</label>
            <input type="text" value="My window modal" :bind="self.title" />
        </div>
        <div class="form-group">
            <label>Position:</label>
            <select @bind="self.position">
                <option value="default">Default</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="bottom">Bottom</option>
            </select>
        </div>
        <div class="form-group">
            <Switch text="Draggable" :bind="self.draggable" />
        </div>
        <div class="form-group">
            <Switch text="Closable" :bind="self.closable" />
        </div>
        <div class="form-group">
            <Switch text="Resizable" :bind="self.resizable" />
        </div>
        <div class="form-group">
            <Switch text="Minimizable" :bind="self.minimizable" />
        </div>
        <input type="button" value="Toggle Modal" id="button" onclick="self.toggle" />        
    </div>`
}

lemonade.render(Component, root);
</script>
</html>
```