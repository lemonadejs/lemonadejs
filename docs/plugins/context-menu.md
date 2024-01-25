title: JavaScript Context Menu
keywords: LemonadeJS Context Menu, versatile navigation component, customizable menu, Vue compatibility, React integration, Angular support, efficient decision-making, configurable options, responsive menu system, user-friendly interface, UI component for developers.
description: Multi-use, flexible, reactive JavaScript context menu plugin. This component facilitates efficient decision-making with configurable options, making it a valuable addition to applications seeking a responsive and user-friendly menu system.

LemonadeJS Context Menu
==================

The LemonadeJS Context Menu is a reactive JavaScript plugin to create dynamic and interactive menu navigation on web applications. It provides a customizable and user-friendly experience, featuring intelligent configurations that automatically adjust the menu's position to prevent it from disappearing off-screen, thus enhancing both the user experience and the responsive design of your application.

This plugin allows for the customization of the menu's behaviour to align with the specific needs of your application. Whether executing direct actions or unveiling nested options for an in-depth selection process, the Context Menu adapts effortlessly to various user interactions.

With a strong emphasis on responsive design and adaptability, the LemonadeJS Context Menu is a vital tool for web development. Its ease of integration with major frameworks like React, Vue, Angular, and others makes it an invaluable asset for creating sophisticated and user-friendly navigation experiences in modern web applications.

## Documentation

### Installation

```bash
npm install @lemonadejs/contextmenu
```

### Settings

| Property   | Type     | Description                                                                                                                                 |
|------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------|
| options    | option[] | An array of option objects describing the rendering options. Each item should follow the structure defined in the 'Option Details' section. |

### Option Details

| Property   | Type             | Description                                                                          |
|------------|------------------|--------------------------------------------------------------------------------------|
| submenu?   | array of options | An optional array containing options displayed as a sub-menu.                        |
| title?     | string           | The title text associated with the option.                                           |
| type?      | string           | The type of the current object, which can be utilized to display a line with 'line'. |
| onclick?   | function         | The function executed upon selecting the option.                                     |
| icon?      | string           | The name of the Material Icon associated with the option.                            |
| render?    | function         | The function executed when rendering the option.                                     |
| onopen?    | function         | The function executed when the submenu is opened.                                    |
| onclose?   | function         | The function executed when the submenu is closed.                                    |

## Examples

### Activating Actions

Actions can be incorporated into the context menu by adding an onclick method to the option.

{.small}Right-click within the blue area of the example to open the context menu.

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>

<div id='root' style="background-color: #ccc; width: 100px; height: 100px;"></div>

<script>
let root = document.getElementById('root');

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
</script>
</html>
```
```javascript
// Add the following link to your HTML file:
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

    return `<div style="background-color: #2222AA; width: 100px; height: 100px;">
        <Contextmenu :options="self.options" :ref="self.contextmenu" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Contextmenu from '@lemonadejs/contextmenu/dist/react';
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
    const myRef = useRef();
    
    return (
        <>
            <div style={{ backgroundColor: '#2222AA', height: '100px', width: '100px' }}>
                <Contextmenu options={options} ref={myRef} />
            </div>
        </>
    );
}
```
```vue
<template>
    <div style="background-color: #2222AA; width: 100px; height: 100px;">
        <Contextmenu :options="options" />
    </div>
</template>

<script>
import Contextmenu from '@lemonadejs/contextmenu/dist/vue'
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Contextmenu
    },
    data() {
        return {
            options: [
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
            ]
        }
    }
}
</script>
```

### Configuring Submenu and Option Icons

Submenus can be integrated to display additional options within an option. Icons can also be added to options, providing users with visual cues to identify the associated actions.

{.small}Right-click within the blue area of the example to open the context menu.

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>

<div id='root' style="background-color: #ccc; width: 100px; height: 100px;"></div>

<script>
let root = document.getElementById('root');

const options = [
    {
        title: 'Add',
        icon: 'add_box'
    },
    {
        title: 'Undo',
        icon: 'undo'
    },
    {
        title: 'Open submenu',
        submenu: [
            { title: 'Submenu Option 1' },
            { title: 'Submenu Option 2' },
        ]
    }
];


const contextmenu = Contextmenu(root, {
    options: options,
});

</script>
</html>
```
```javascript
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
        {
            title: 'Open submenu',
            submenu: [
                { title: 'Submenu Option 1' },
                { title: 'Submenu Option 2' },
            ]
        }
    ];

    return `<div style="background-color: #2222AA; width: 100px; height: 100px;">
        <Contextmenu :options="self.options" :ref="self.contextmenu" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Contextmenu from '@lemonadejs/contextmenu/dist/react';
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
    {
        title: 'Open submenu',
        submenu: [
            { title: 'Submenu Option 1' },
            { title: 'Submenu Option 2' },
        ]
    }
];

export default function App() {
    const myRef = useRef();
    
    return (
        <>
            <div style={{ backgroundColor: '#2222AA', height: '100px', width: '100px' }}>
                <Contextmenu options={options} ref={myRef} />
            </div>
        </>
    );
}
```
```vue
<template>
    <div style="background-color: #2222AA; width: 100px; height: 100px;">
        <Contextmenu :options="options" />
    </div>
</template>

<script>
import Contextmenu from '@lemonadejs/contextmenu/dist/vue'
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Contextmenu
    },
    data() {
        return {
            options: [
                {
                    title: 'Add',
                    icon: 'add_box'
                },
                {
                    title: 'Undo',
                    icon: 'undo'
                },
                {
                    title: 'Open submenu',
                    submenu: [
                        { title: 'Submenu Option 1' },
                        { title: 'Submenu Option 2' },
                    ]
                }
            ]
        }
    }
}
</script>
```