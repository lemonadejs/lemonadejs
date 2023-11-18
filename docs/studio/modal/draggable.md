Modal Draggable
====================

The Draggable feature in the LemonadeJS Modal allows users to interactively move the modal around the screen, providing a dynamic and flexible user experience.

### How to Enable Draggable:

To enable the Draggable feature, simply include the `draggable` option in the modal configuration object and set it to `true`.

### Example:

Consider the following configuration object:

```
const modalConfig = { draggable: true }
```

Initialize the modal with the specified configuration

```
Modal(root, modalConfig)
```

### Practical Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id='root' style='height: 280px; width: 300px;'>
    <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
        This is a draggable modal
    </div>
</div>

<script>
Modal(document.getElementById('root'), { draggable: true });
</script>
</html>
```
```javascript
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    return `<Modal :draggable="true">
            <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
                This is a draggable modal
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
            Modal(domRef.current, { draggable: true });
        }
    }, []);

    return (
        <div ref={domRef} style={{ height: '280px', width: '300px' }}>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                This is a draggable modal
            </div>
        </div>
    );
}
```
