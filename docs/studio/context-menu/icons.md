Context Menu Icons
====================

The Icons feature of the LemonadeJS Context Menu allows you to enhance the visual representation of each option by adding icons. To incorporate icons into your menu options, follow these steps:

1. Inside the `options` object, include a new key, `icon`, for the desired option.
2. Assign the `icon` key a value representing the name of an existing Material Icon.

For example: 

```
{ title: 'Add' }
```

Will become

```
{ title: 'Add', icon: 'add_box' }
```

### Icon Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<input type="button" value="Open Menu" id="button"/>
<div id='root'></div>

<script>
let root = document.getElementById('root');
let button = document.getElementById('button');

const options = [
    {
        title: 'Add',
        icon: 'add_box'
    },
    {
        title: 'Undo',
        icon: 'undo'
    },
];
    

const contextmenu = Contextmenu(root, {
    options: options,
});

button.addEventListener('click', (e) => {
    contextmenu.open(options, null, null, e);
});
</script>
</html>
```
```javascript
// Add the following to your HTML file:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
import Contextmenu from '@lemonadejs/contextmenu';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.options = [
        {
            title: 'Add',
            icon: 'add_box'
        },
        {
            title: 'Undo',
            icon: 'undo'
        },
    ];

    self.onload = function() {
        self.button.addEventListener('click', (e) => {
            self.contextmenu.open(self.options, null, null, e);
        });
    };

    return `<div>
        <Contextmenu :options="self.options" :ref="self.contextmenu" />
        <input type="button" value="Open Menu" :ref="self.button" />
    </div>`
}
```
```jsx
// Add the following to your HTML file:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
import React, { useRef, useEffect } from "react";
import Contextmenu from '@lemonadejs/contextmenu';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';


const options = [
    {
        title: 'Add',
        icon: 'add_box'
    },
    {
        title: 'Undo',
        icon: 'undo'
    },
];

export default function App() {
    const domRef = useRef();
    const buttonRef = useRef();

    useEffect(() => {
        let contextmenu;
        if (! domRef.current.innerText) {
            contextmenu = Contextmenu(domRef.current, {
                options: options
            });
        }

        buttonRef.current.addEventListener('click', (e) => {
            contextmenu.open(options, null, null, e)
        });
    }, []);

    return (
        <>
            <div ref={domRef}></div>
            <input type="button" value="Open Menu" ref={buttonRef} />
        </>
    );
}
```