LemonadeJS Modal
====================

The LemonadeJS Modal is a responsive and reactive component that creates floating modals. With its flexible settings, users can easily configure it according to their needs.

- Draggable
- Resizable
- Minimizable

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/modal
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
```

### Basic Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id='root' style='height: 280px; width: 300px;'>
    <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
        This is a modal
    </div>
</div>

<script>
Modal(document.getElementById('root'));
</script>
</html>
```
```javascript
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    return `<Modal>
            <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
                This is a modal
            </div>
        </Modal>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';


export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Modal(domRef.current);
        }
    }, []);

    return (
        <div ref={domRef} style={{ height: '280px', width: '300px' }}>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                This is a modal
            </div>
        </div>
    );
}
```

### Settings

| Property     | Type    | Description                                                        |
|--------------|---------|--------------------------------------------------------------------|
| title?       | string  | The header title of the modal                                      |
| height?      | number  | The height of the modal in pixels                                  |
| width?       | number  | The width of the modal in pixels                                   |
| top?         | number  | The vertical position of the modal within its container in pixels  |
| left?        | number  | The horizontal position of the modal within its container in pixels|
| draggable?   | boolean | Determines if the modal can be dragged                             |
| resizable?   | boolean | Determines if the modal can be resized                             |
| closed?      | boolean | Controls the open and close state of the modal                     |
| closable?    | boolean | Enables the close button                                           |
| minimized?   | boolean | Controls the minimized state of the modal                          |
| minimizable? | boolean | Enables the minimize button                                        |
| center?      | boolean | Enables rendering the modal in the center of its parent container  |
| url?         | string  | The URL from which to fetch and render content                     |
| autoadjust?  | boolean | Adjust the position when the modal is outside the viewport         |
| autoclose?   | boolean | Close when the modal loses focus                                   |

### Events

| Event | Trigger |
| ----- | ------- |
| onclose | Called when modal closes |
| onopen | Called when modal opens |

