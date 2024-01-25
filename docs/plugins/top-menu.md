title: LemonadeJS Top Menu
description: Elevate your application's user interface with the LemonadeJS Top Menu – a dynamic and efficient component crafted for seamless navigation and quick access to essential actions. This thoughtfully designed menu boasts a collection of carefully arranged buttons, ensuring a user-friendly experience. Prioritizing usability, the Top Menu combines a visually appealing layout with intuitive functionality. Its clear and simple design empowers users to effortlessly explore and interact with key features, enhancing overall navigation. Positioned as a centralized hub for core functionalities, this component enhances the accessibility of crucial actions, contributing to an enhanced user experience. Its adaptable nature allows for easy integration into a variety of applications, providing a consistent and responsive menu system tailored to your application's unique requirements.
keywords: LemonadeJS Top Menu, application top menu, functional component, user experience, usability, organized interface, efficient navigation, essential features, clarity in design, simplicity in navigation, centralized access, core functionalities, improved user experience, adaptable nature, seamless integration, diverse applications, consistent menu system, responsive menu, application requirements.


LemonadeJS Top Menu
==================

The LemonadeJS Top Menu is a functional component designed to facilitate convenient access to key actions within your application. Comprising a set of thoughtfully arranged buttons, this interface ensures a straightforward and efficient user experience.

With a focus on usability, the Top Menu presents a collection of essential features in a visually organized manner. The design emphasizes clarity and simplicity, allowing users to navigate through the menu with ease.

This component serves as a centralized point for accessing core functionalities, contributing to an improved overall user experience. Its adaptable nature enables seamless integration into diverse applications, ensuring a consistent and responsive menu system aligned with your application's requirements.

## Documentation

### Installation

```bash
npm install @lemonadejs/topmenu
```

### Settings

| Property  | Type | Description |
|-----------|------|-------------|
| options | optionItem[] | An array of option objects describing the rendering options. Each item should follow the structure defined in the 'Option Properties' section below.  |

### Options Properties

| Property  | Type | Description |
|-----------|------|-------------|
| title? | string | The title text associated with the option. |
| submenu? | submenuItem[] | An optional array containing options displayed as a sub-menu. Each item should follow the structure defined in the 'Submenu Properties' section below. |

### Submenu Properties

| Property  | Type | Description |
|-----------|------|-------------|
| title? | string | The title text associated with the option. |
| submenu? | array of submenu options | An optional array containing options displayed as a submenu. |
| onclick? | function | Onclick event for the contextmenu item. |
| render? | function | The function executed when rendering the option. |
| type? | string | Context menu item type: line, divisor, default. |
| id? | string | HTML id property of the item DOM element. |
| disabled? | boolean | Item is disabled. |
| shortcut? | string | A short description or instruction for the item. Normally a shortcut. `Ex. CTRL + C`. |
| tooltip? | string | Show this text when the user mouse over the element. |

### Keyboard Accessibility and Focus Management

The LemonadeJS Top Menu emphasizes user-friendly keyboard navigation with the following features:

1. **Comprehensive Keyboard Accessibility:**
    - Enables seamless navigation through menu options using standard keyboard controls.
  
2. **Smart Focus Management:**
    - Automatically opens submenus upon hovering over options after opening them for the first time.
    - Facilitates exploration of different sections without the need for manual submenu handling.

This design choice not only accommodates users relying on keyboard input but also enhances overall usability, providing an efficient navigation experience.

## Examples

### Displaying Options

To showcase options, incorporate objects containing a title and a submenu array with submenu objects.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/style.min.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<div id='root' style="background-color: white; border-radius: 5px"></div>

<script>
let root = document.getElementById('root');

const options = [
    {
        title: 'File',
        submenu: [
            {
                title: 'New',
            },
            {
                title: 'Open',
            },
            {
                title: 'Save',
            },
            {
                title: 'Save As',
            },
        ]
    },
    {
        title: 'About Us',
        submenu: [
            {
                title: 'Undo',
            },
            {
                title: 'Redo',
            },
            {
                title: 'Cut',
            },
            {
                title: 'Copy',
            },
            {
                title: 'Paste',
            },
        ]
    },
    {
        title: 'View',
        submenu: [
            {
                title: 'Zoom In',
            },
            {
                title: 'Zoom Out',
            },
        ]
    },
];
    

Topmenu(root, {
    options: options,
});
</script>
</html>
```
```javascript
// Add the following link to your HTML file:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
import Contextmenu from '@lemonadejs/topmenu';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.options = [
    {
        title: 'File',
        submenu: [
            {
                title: 'New',
            },
            {
                title: 'Open',
            },
            {
                title: 'Save',
            },
            {
                title: 'Save As',
            },
        ]
    },
    {
        title: 'About Us',
        submenu: [
            {
                title: 'Undo',
            },
            {
                title: 'Redo',
            },
            {
                title: 'Cut',
            },
            {
                title: 'Copy',
            },
            {
                title: 'Paste',
            },
        ]
    },
    {
        title: 'View',
        submenu: [
            {
                title: 'Zoom In',
            },
            {
                title: 'Zoom Out',
            },
        ]
    },
];

    return `<div>
        <Topmenu :options="self.options" :ref="self.topmenu" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Topmenu from '@lemonadejs/topmenu/dist/react';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';


const options = [
    {
        title: 'File',
        submenu: [
            {
                title: 'New',
            },
            {
                title: 'Open',
            },
            {
                title: 'Save',
            },
            {
                title: 'Save As',
            },
        ]
    },
    {
        title: 'About Us',
        submenu: [
            {
                title: 'Undo',
            },
            {
                title: 'Redo',
            },
            {
                title: 'Cut',
            },
            {
                title: 'Copy',
            },
            {
                title: 'Paste',
            },
        ]
    },
    {
        title: 'View',
        submenu: [
            {
                title: 'Zoom In',
            },
            {
                title: 'Zoom Out',
            },
        ]
    },
];

export default function App() {
    const myRef = useRef();
    
    return (
        <>
            <div>
                <Topmenu options={options} ref={myRef} />
            </div>
        </>
    );
}
```
```vue
<template>
    <div>
        <Topmenu :options="options" />
    </div>
</template>

<script>
import Topmenu from '@lemonadejs/topmenu/dist/vue'
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Topmenu
    },
    data() {
        return {
            options: [
                {
                    title: 'File',
                    submenu: [
                        {
                            title: 'New',
                        },
                        {
                            title: 'Open',
                        },
                        {
                            title: 'Save',
                        },
                        {
                            title: 'Save As',
                        },
                    ]
                },
                {
                    title: 'About Us',
                    submenu: [
                        {
                            title: 'Undo',
                        },
                        {
                            title: 'Redo',
                        },
                        {
                            title: 'Cut',
                        },
                        {
                            title: 'Copy',
                        },
                        {
                            title: 'Paste',
                        },
                    ]
                },
                {
                    title: 'View',
                    submenu: [
                        {
                            title: 'Zoom In',
                        },
                        {
                            title: 'Zoom Out',
                        },
                    ]
                },
            ]
        }
    }
}
</script>
```
### Submenus and Icons

The submenu feature facilitates the creation of nested submenus, allowing for submenus within submenus. Furthermore, icons can be associated with each option within the submenus.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/style.min.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<div id='root' style="background-color: white; border-radius: 5px"></div>

<script>
let root = document.getElementById('root');

const options = [
    {
        title: 'Tools',
        submenu: [
            {
                title: 'Selection',
                icon: 'select_all'
            },
            {
                title: 'Brush',
                icon: 'brush'
            },
            {
                title: 'Eraser',
                icon: 'delete'
            },
            {
                title: 'Advanced Tools',
                submenu: [
                    {
                        title: 'Clone Stamp',
                        icon: 'content_copy'
                    },
                    {
                        title: 'Magic Wand',
                        icon: 'wb_iridescent'
                    }
                ]
            },
        ]
    },
    {
        title: 'Effects',
        submenu: [
            {
                title: 'Blur',
                icon: 'blur_on'
            },
            {
                title: 'Sharpen',
                icon: 'tune'
            },
            {
                title: 'Color Adjustment',
                icon: 'color_lens'
            },
            {
                title: 'Artistic Effects',
                submenu: [
                    {
                        title: 'Watercolor',
                        icon: 'invert_colors'
                    },
                    {
                        title: 'Oil Paint',
                        icon: 'colorize'
                    }
                ]
            },
        ]
    },
];
    

Topmenu(root, {
    options: options,
});
</script>
</html>
```
```javascript
// Add the following link to your HTML file:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
import Contextmenu from '@lemonadejs/topmenu';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.options = [
        {
            title: 'Tools',
            submenu: [
                {
                    title: 'Selection',
                    icon: 'select_all'
                },
                {
                    title: 'Brush',
                    icon: 'brush'
                },
                {
                    title: 'Eraser',
                    icon: 'delete'
                },
                {
                    title: 'Advanced Tools',
                    submenu: [
                        {
                            title: 'Clone Stamp',
                            icon: 'content_copy'
                        },
                        {
                            title: 'Magic Wand',
                            icon: 'wb_iridescent'
                        }
                    ]
                },
            ]
        },
        {
            title: 'Effects',
            submenu: [
                {
                    title: 'Blur',
                    icon: 'blur_on'
                },
                {
                    title: 'Sharpen',
                    icon: 'tune'
                },
                {
                    title: 'Color Adjustment',
                    icon: 'color_lens'
                },
                {
                    title: 'Artistic Effects',
                    submenu: [
                        {
                            title: 'Watercolor',
                            icon: 'invert_colors'
                        },
                        {
                            title: 'Oil Paint',
                            icon: 'colorize'
                        }
                    ]
                },
            ]
        },
    ];

    return `<div>
        <Topmenu :options="self.options" :ref="self.topmenu" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Topmenu from '@lemonadejs/topmenu/dist/react';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';


const options = [
    {
        title: 'Tools',
        submenu: [
            {
                title: 'Selection',
                icon: 'select_all'
            },
            {
                title: 'Brush',
                icon: 'brush'
            },
            {
                title: 'Eraser',
                icon: 'delete'
            },
            {
                title: 'Advanced Tools',
                submenu: [
                    {
                        title: 'Clone Stamp',
                        icon: 'content_copy'
                    },
                    {
                        title: 'Magic Wand',
                        icon: 'wb_iridescent'
                    }
                ]
            },
        ]
    },
    {
        title: 'Effects',
        submenu: [
            {
                title: 'Blur',
                icon: 'blur_on'
            },
            {
                title: 'Sharpen',
                icon: 'tune'
            },
            {
                title: 'Color Adjustment',
                icon: 'color_lens'
            },
            {
                title: 'Artistic Effects',
                submenu: [
                    {
                        title: 'Watercolor',
                        icon: 'invert_colors'
                    },
                    {
                        title: 'Oil Paint',
                        icon: 'colorize'
                    }
                ]
            },
        ]
    },
];

export default function App() {
    const myRef = useRef();
    
    return (
        <>
            <div>
                <Topmenu options={options} ref={myRef} />
            </div>
        </>
    );
}
```
```vue
<template>
    <div>
        <Topmenu :options="options" />
    </div>
</template>

<script>
import Topmenu from '@lemonadejs/topmenu/dist/vue'
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Topmenu
    },
    data() {
        return {
            options: [
                {
                    title: 'Tools',
                    submenu: [
                        {
                            title: 'Selection',
                            icon: 'select_all'
                        },
                        {
                            title: 'Brush',
                            icon: 'brush'
                        },
                        {
                            title: 'Eraser',
                            icon: 'delete'
                        },
                        {
                            title: 'Advanced Tools',
                            submenu: [
                                {
                                    title: 'Clone Stamp',
                                    icon: 'content_copy'
                                },
                                {
                                    title: 'Magic Wand',
                                    icon: 'wb_iridescent'
                                }
                            ]
                        },
                    ]
                },
                {
                    title: 'Effects',
                    submenu: [
                        {
                            title: 'Blur',
                            icon: 'blur_on'
                        },
                        {
                            title: 'Sharpen',
                            icon: 'tune'
                        },
                        {
                            title: 'Color Adjustment',
                            icon: 'color_lens'
                        },
                        {
                            title: 'Artistic Effects',
                            submenu: [
                                {
                                    title: 'Watercolor',
                                    icon: 'invert_colors'
                                },
                                {
                                    title: 'Oil Paint',
                                    icon: 'colorize'
                                }
                            ]
                        },
                    ]
                },
            ]
        }
    }
}
</script>
```

### Associate Actions to Options

Options should be linked to corresponding actions. The following example illustrates how this association is established:

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/topmenu/dist/style.min.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/contextmenu/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

<div style="display:flex; margin-bottom: 20px">
    <div id='square' style="border: solid 1px black; height: 60px; width: 60px;"></div>
</div>
<div id='root' style="background-color: white; border-radius: 5px"></div>

<script>
let root = document.getElementById('root');
let square = document.getElementById('square');

const options = [
    {
        title: 'Color',
        submenu: [
            {
                title: 'Fill with Red',
                onclick: function() {
                    square.style.backgroundColor = 'red'
                }
            },
            {
                title: 'Fill with Green',
                onclick: function() {
                    square.style.backgroundColor = 'green'
                }
            },
            {
                title: 'Fill with Blue',
                onclick: function() {
                    square.style.backgroundColor = 'blue'
                }
            }
        ]
    },
    {
        title: 'Dimensions',
        submenu: [
            {
                title: 'Increase',
                onclick: function() {
                    square.style.width = square.offsetWidth + 10 + 'px'
                    square.style.height = square.offsetHeight + 10 + 'px'
                }
            },
            {
                title: 'Decrease',
                onclick: function() {
                    square.style.width = square.offsetWidth - 10 + 'px'
                    square.style.height = square.offsetHeight - 10 + 'px'
                }
            },
            {
                title: 'Reset',
                onclick: function() {
                    square.style.width = '60px'
                    square.style.height = '60px'
                }
            }
        ]
    }
];
    

Topmenu(root, {
    options: options,
});
</script>
</html>
```
```javascript
// Add the following link to your HTML file:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
import Contextmenu from '@lemonadejs/topmenu';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const self = this;

    self.options = [
        {
            title: 'Color',
            submenu: [
                {
                    title: 'Fill with Red',
                    onclick: function() {
                        self.square.style.backgroundColor = 'red'
                    }
                },
                {
                    title: 'Fill with Green',
                    onclick: function() {
                        self.square.style.backgroundColor = 'green'
                    }
                },
                {
                    title: 'Fill with Blue',
                    onclick: function() {
                        self.square.style.backgroundColor = 'blue'
                    }
                }
            ]
        },
        {
            title: 'Dimensions',
            submenu: [
                {
                    title: 'Increase',
                    onclick: function() {
                        self.square.style.width = self.square.offsetWidth + 10 + 'px'
                        self.square.style.height = self.square.offsetHeight + 10 + 'px'
                    }
                },
                {
                    title: 'Decrease',
                    onclick: function() {
                        self.square.style.width = self.square.offsetWidth - 10 + 'px'
                        self.square.style.height = self.square.offsetHeight - 10 + 'px'
                    }
                },
                {
                    title: 'Reset',
                    onclick: function() {
                        self.square.style.width = '60px'
                        self.square.style.height = '60px'
                    }
                }
            ]
        }
    ];

    return `<div>
        <div :ref="self.square" style="border: 1px solid black; height: 60px; width: 60px;"></div>
        <Topmenu :options="self.options" :ref="self.topmenu" />
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Topmenu from '@lemonadejs/topmenu/dist/react';
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';



export default function App() {
    const myRef = useRef();
    const squareRef = useRef();

    const options = [
        {
            title: 'Color',
            submenu: [
                {
                    title: 'Fill with Red',
                    onclick: function() {
                        squareRef.current.style.backgroundColor = 'red'
                    }
                },
                {
                    title: 'Fill with Green',
                    onclick: function() {
                        squareRef.current.style.backgroundColor = 'green'
                    }
                },
                {
                    title: 'Fill with Blue',
                    onclick: function() {
                        squareRef.current.style.backgroundColor = 'blue'
                    }
                }
            ]
        },
        {
            title: 'Dimensions',
            submenu: [
                {
                    title: 'Increase',
                    onclick: function() {
                        squareRef.current.style.width = squareRef.current.offsetWidth + 10 + 'px'
                        squareRef.current.style.height = squareRef.current.offsetHeight + 10 + 'px'
                    }
                },
                {
                    title: 'Decrease',
                    onclick: function() {
                        squareRef.current.style.width = squareRef.current.offsetWidth - 10 + 'px'
                        squareRef.current.style.height = squareRef.current.offsetHeight - 10 + 'px'
                    }
                },
                {
                    title: 'Reset',
                    onclick: function() {
                        squareRef.current.style.width = '60px'
                        squareRef.current.style.height = '60px'
                    }
                }
            ]
        }
    ];
    
    return (
        <>
            <div>
                <div ref={squareRef} style={{ border: 'solid 1px black', height: '60px', width: '60px' }}></div>
                <Topmenu options={options} ref={myRef} />
            </div>
        </>
    );
}
```
```vue
<template>
    <div>
        <div :ref="square" style="border: solid 1px black; height: 60px; width: 60px"></div>
        <Topmenu :options="options" />
    </div>
</template>

<script>
import Topmenu from '@lemonadejs/topmenu/dist/vue'
import '@lemonadejs/topmenu/dist/style.css';
import '@lemonadejs/contextmenu/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Topmenu
    },
    data() {
        return {
            options: [
                {
                    title: 'Color',
                    submenu: [
                        {
                            title: 'Fill with Red',
                            onclick: function() {
                                this.$refs.square.current.style.backgroundColor = 'red'
                            }
                        },
                        {
                            title: 'Fill with Green',
                            onclick: function() {
                                this.$refs.square.current.style.backgroundColor = 'green'
                            }
                        },
                        {
                            title: 'Fill with Blue',
                            onclick: function() {
                                this.$refs.square.current.style.backgroundColor = 'blue'
                            }
                        }
                    ]
                },
                {
                    title: 'Dimensions',
                    submenu: [
                        {
                            title: 'Increase',
                            onclick: function() {
                                this.$refs.square.current.style.width = this.$refs.square.current.offsetWidth + 10 + 'px'
                                this.$refs.square.current.style.height = this.$refs.square.current.offsetHeight + 10 + 'px'
                            }
                        },
                        {
                            title: 'Decrease',
                            onclick: function() {
                                this.$refs.square.current.style.width = this.$refs.square.current.offsetWidth - 10 + 'px'
                                this.$refs.square.current.style.height = this.$refs.square.current.offsetHeight - 10 + 'px'
                            }
                        },
                        {
                            title: 'Reset',
                            onclick: function() {
                                this.$refs.square.current.style.width = '60px'
                                this.$refs.square.current.style.height = '60px'
                            }
                        }
                    ]
                }
            ]
        }
    }
}
</script>
```