Modal Resizable
====================

The Resizable feature in the LemonadeJS Modal allows users to adjust the size of the modal, offering flexibility to accommodate various content and layout preferences.

### How to Enable Resizable:

To enable the Resizable feature, include the `resizable` option in the modal configuration object and set it to `true`.

When the Resizable feature is enabled, users will notice visual indicators—arrows—near the right and bottom borders of the modal when hovering. These arrows signify that the modal can be resized in the corresponding direction.

### Example:

Consider the following configuration object:

```
const modalConfig = { resizable: true }
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
        This is a resizable modal
    </div>
</div>

<script>
Modal(document.getElementById('root'), { resizable: true });
</script>
</html>
```
```javascript
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    return `<Modal :resizable="true">
            <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
                This is a resizable modal
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
            Modal(domRef.current, { resizable: true });
        }
    }, []);

    return (
        <div ref={domRef} style={{ height: '280px', width: '300px' }}>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                This is a resizable modal
            </div>
        </div>
    );
}
```
