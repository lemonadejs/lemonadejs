LemonadeJS Context Menu
====================

The LemonadeJS Context Menu is a versatile solution for interactive menu navigation, offering a customizable and intuitive experience. Designed for efficient decision-making, users can choose options that trigger specific actions or toggle the opening of another menu—configurable to your preferences.

With a focus on flexibility, this component empowers you to tailor the menu's behavior according to your application's needs. Whether it's executing actions directly or revealing nested options for a more in-depth selection process, the Context Menu adapts seamlessly.

Noteworthy features include a user-friendly interface, allowing for smooth interactions and a clear decision-making process. The configuration options provided by the Context Menu make it a valuable addition to various applications, ensuring a responsive and adaptable menu system.

- Keyboard Navigation
- Option Types
- Nested Menus
- Lines

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/contextmenu
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
```

### Basic Example

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
        title: 'Console.log',
        onclick:function() {
            console.log('Hello!')
        },
    },
    {
        title: 'Show Alert',
        onclick:function() {
            alert('Hello!')
        },
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
            title: 'Console.log',
            onclick:function() {
                console.log('Hello!')
            },
        },
        {
            title: 'Show Alert',
            onclick:function() {
                alert('Hello!')
            },
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
        title: 'Console.log',
        onclick:function() {
            console.log('Hello!')
        },
    },
    {
        title: 'Show Alert',
        onclick:function() {
            alert('Hello!')
        },
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

### Settings

| Property  | Type | Description |
|-----------|------|-------------|
| options | array | An array of option objects describing the rendering options. |

### Option Object

| Property  | Type | Description |
|-----------|------|-------------|
| title? | string | The title text associated with the option. |
| submenu? | array of options | An optional array containing options displayed as a sub-menu. |
| type? | string | The type of the current object, which can be utilized to display a line with 'line'. |
| onclick? | function | The function executed upon selecting the option. |
| render? | function | The function executed when rendering the option. |

### Keyboard Navigation

Improve user interaction through seamlessly available keyboard navigation. This default integration of keyboard navigation, complementing mouse interaction, ensures a universally accessible and user-friendly experience with the Context Menu component.

* **Arrow Up or Arrow Down:** Navigate between options.

* **Enter:** Select the current option. If the selected option has a sub-menu, the keyboard navigation will seamlessly transition to it, providing a user-friendly experience for exploring nested menu items.