Modal Minimize
====================

The Minimize feature in the LemonadeJS Modal allows users to minimize the modal, reducing its size and placing it at the bottom of the page. This feature is particularly useful when users want to temporarily hide the modal without closing it completely.

### How to Enable Minimizable:

To enable the Minimize feature, include the `minimizable` option in the modal configuration object and set it to `true`.

When the Minimizable feature is enabled, users will see a minimization icon displayed on the modal. Clicking this icon will minimize the modal, moving it to the bottom of the page.

### Example:

Consider the following configuration object:

```
const modalConfig = { minimizable: true }
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
        This is a minimizable modal
    </div>
</div>

<script>
Modal(document.getElementById('root'), { minimizable: true });
</script>
</html>
```
```javascript
import Modal from '@lemonadejs/modal';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    return `<Modal :minimizable="true">
            <div style='height: 100%; display: flex; align-items: center; justify-content: center;'>
                This is a minimizable modal
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
            Modal(domRef.current, { minimizable: true });
        }
    }, []);

    return (
        <div ref={domRef} style={{ height: '280px', width: '300px' }}>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                This is a minimizable modal
            </div>
        </div>
    );
}
```
