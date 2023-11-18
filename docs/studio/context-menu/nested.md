Context Menu Nested Menus
====================

The Nested Menus feature in the LemonadeJS Context Menu enables you to create hierarchical menu structures by allowing an option to open another menu. To implement a Nested Menu, follow these steps:

1. Inside the `options` object, introduce a new key, `submenu`, and attach it to an array of options for the desired menu.
2. Customize the options within the `submenu` array to define the contents of the nested menu.

Consider the following option without a nested menu:

### Example:

```
{ title: 'Option' }
```

Will become

```
{ 
    title: 'Option',
    submenu: [
        { title: 'Suboption' }
    ]
}
```

### Nested Menus Example

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
        title: 'Has submenu',
        submenu: [
            {
                title: 'Submenu 1'
            },
            {
                title: 'Submenu 2'
            }
        ]
    },
    {
        title: "Doesn't have submenu",
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
            title: 'Has submenu',
            submenu: [
                {
                    title: 'Submenu 1'
                },
                {
                    title: 'Submenu 2'
                }
            ]
        },
        {
            title: "Doesn't have submenu",
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
        title: 'Has submenu',
        submenu: [
            {
                title: 'Submenu 1'
            },
            {
                title: 'Submenu 2'
            }
        ]
    },
    {
        title: "Doesn't have submenu",
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