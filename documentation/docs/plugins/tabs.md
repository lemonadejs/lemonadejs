title: JavaScript Tabs
keywords: LemonadeJS Tabs, versatile JavaScript component, dynamic content organization, minimalist tabbed interface, Vue compatible, React integration, Angular tabs, intuitive navigation, user-friendly interface, optimal performance UI component, web development tools, UI component for developers.
description: A versatile and dynamic JavaScript component designed to facilitate the organization and presentation of distinct content sections within a minimalist tabbed interface. This JavaScript component seamlessly integrates with Vue, React, and Angular, offering an intuitive solution to enhance content navigation and user experience.
canonical: https://lemonadejs.com/docs/plugins/tabs

# JavaScript Tabs

`JavaScript Component`{.jtag .black .framework-images}

`Package size: 1.4KB gzipped`{.small}

The Lemonade JavaScript tabs is a lightweight, framework-agnostic component designed to organize and display distinct content sections in a clean, minimalist tabbed interface.  


## Documentation

### Installation

```bash
npm install @lemonadejs/tabs
```

### Settings

| Property                 | Description                                                                                                                      |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `selected?: Number`      | Index of the initially selected tab (default: 0).                                                                                |
| `position?: String`      | Position of the tabs bar within the parent element (`'center'` to align tabs to the center).                                     |
| `data?: tabItem[]`       | Provides an alternative method for defining tab titles and content using a `tabItem` object. See the **Tab Item** section below. |
| `round?: Boolean`        | Determines if tabs should have rounded corners.                                                                                  |
| `allowCreate?: Boolean` | Displays a button to create a new tab when set.                                                                                  |
| `onopen?: (self: Object, selected: Number) => void`      | Callback triggered when a new tab is opened.                                                                                     |


#### Tab Item

| Property  | Description                                                              |
|-----------|--------------------------------------------------------------------------|
| `title`   | The title of the tab, serving as the label displayed on the tab options. |
| `content` | The HTML content intended for this specific tab.                         |

## Examples

### Basic example

How to utilize Tabs in simple implementations: This example demonstrates the declarative approach.  
[See this example on codesandbox](https://codesandbox.io/s/optimistic-chaplygin-tc764x?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<div id="root">
    <div title="Tab 1">Content of the first tab</div>
    <div title="Tab 2">Content of the second tab</div>
</div>

<script>
Tabs(document.getElementById("root"));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';

import '@lemonadejs/tabs/dist/style.css';

export default function App() {
    const self = this;

    return render => render`<div>
        <Tabs>
            <div title="Tab 1">Content of the first tab</div>
            <div title="Tab 2">Content of the second tab</div>
        </Tabs>
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Tabs from "@lemonadejs/tabs/dist/react";

import "@lemonadejs/tabs/dist/style.css";

export default function Component() {
    const component = useRef();

    return (<div>
        <Tabs ref={component}>
            <div title={"Tab 1"}>Content of the first tab</div>
            <div title={"Tab 2"}>Content of the second tab</div>
        </Tabs>
    </div>)
}
```
```vue
<template>
    <Tabs ref="component">
        <div title="Tab 1">Content of the first tab</div>
        <div title="Tab 2">Content of the second tab</div>
    </Tabs>
</template>

<script>
import Tabs from '@lemonadejs/tabs/dist/vue';
import '@lemonadejs/tabs/dist/style.css';

export default {
    name: 'App',
    components: {
        Tabs,
    },
};
</script>
```

### Data property

Create a new tabs instance based on a JSON data definition with the on open event.

[See this example on codesandbox](https://codesandbox.io/s/affectionate-lamarr-fmwvdx?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<div id="root"></div>

<input id="btn1" type="button" value="Select Second Tab" />

<script>
const data = [
    {
        title: "Monday",
        content: `<ul>
            <li>09:00 AM - 10:00 AM: Keynote Speech</li>
            <li>10:30 AM - 12:00 PM: Panel Discussion</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>01:30 PM - 03:00 PM: Workshop</li>
            <li>03:30 PM - 05:00 PM: Networking Session</li>
        </ul>`
    },
    {
        title: "Tuesday",
        content: `<ul>
            <li>09:30 AM - 10:30 AM: Keynote Speech</li>
            <li>11:00 AM - 12:30 PM: Workshop</li>
            <li>12:30 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
            <li>04:00 PM - 05:30 PM: Fireside Chat</li>
        </ul>`
    }
];

const component = Tabs(document.getElementById("root"), {
    data: data,
    onopen: () => {
        console.log('tab is opened');
    }
});

document.getElementById("btn1").addEventListener("click", () => {
    component.selected = 1;
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

export default function App() {

    const data = [
        {
            title: "Monday",
            content: `<ul>
                <li>09:00 AM - 10:00 AM: Keynote Speech</li>
                <li>10:30 AM - 12:00 PM: Panel Discussion</li>
                <li>12:00 PM - 01:30 PM: Lunch Break</li>
                <li>01:30 PM - 03:00 PM: Workshop</li>
                <li>03:30 PM - 05:00 PM: Networking Session</li>
            </ul>`
        },
        {
            title: "Tuesday",
            content: `<ul>
                <li>09:30 AM - 10:30 AM: Keynote Speech</li>
                <li>11:00 AM - 12:30 PM: Workshop</li>
                <li>12:30 PM - 01:30 PM: Lunch Break</li>
                <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
                <li>04:00 PM - 05:30 PM: Fireside Chat</li>
            </ul>`
        }
    ];

    const open = () => {
        this.selected = 1;
    }
    
    const onopen = () => {
        console.log('tab is opened');
    }

    return render => render`<div>
        <Tabs data="${data}" onopen="${onopen}"></Tabs>
        <button onclick="${open}">Go To Wednesday</button>
    </div>`
}
```
```jsx
import React, { useRef } from "react";
import Tabs from "@lemonadejs/tabs/dist/react";
import "@lemonadejs/tabs/dist/style.css";

const data = [
    {
        title: "Monday",
        content: `<ul>
            <li>09:00 AM - 10:00 AM: Keynote Speech</li>
            <li>10:30 AM - 12:00 PM: Panel Discussion</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>01:30 PM - 03:00 PM: Workshop</li>
            <li>03:30 PM - 05:00 PM: Networking Session</li>
        </ul>`
    },
    {
        title: "Tuesday",
        content: `<ul>
            <li>09:30 AM - 10:30 AM: Keynote Speech</li>
            <li>11:00 AM - 12:30 PM: Workshop</li>
            <li>12:30 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
            <li>04:00 PM - 05:30 PM: Fireside Chat</li>
        </ul>`
    }
];

export default function App() {
    const component = useRef();

    const open = () => {
        component.current.selected = 1;
    }

    const onopen = () => {
        console.log('tab is opened');
    }

    return <>
        <Tabs ref={component} data={data} onopen={onopen} />
        <button onClick={() => open()}>Go To Wednesday</button>
    </>;
}
```
```vue
<template>
    <Tabs ref="component" :data="data" :onopen="onopen" />
    <button @click="open">Go To Wednesday</button>
</template>

<script>
import Tabs from '@lemonadejs/tabs/dist/vue';
import '@lemonadejs/tabs/dist/style.css';

export default {
    name: 'App',
    components: {
        Tabs,
    },
    data() {
        const data = [
            {
                title: "Monday",
                content: `<ul>
                    <li>09:00 AM - 10:00 AM: Keynote Speech</li>
                    <li>10:30 AM - 12:00 PM: Panel Discussion</li>
                    <li>12:00 PM - 01:30 PM: Lunch Break</li>
                    <li>01:30 PM - 03:00 PM: Workshop</li>
                    <li>03:30 PM - 05:00 PM: Networking Session</li>
                </ul>`
            },
            {
                title: "Tuesday",
                content: `<ul>
                    <li>09:30 AM - 10:30 AM: Keynote Speech</li>
                    <li>11:00 AM - 12:30 PM: Workshop</li>
                    <li>12:30 PM - 01:30 PM: Lunch Break</li>
                    <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
                    <li>04:00 PM - 05:30 PM: Fireside Chat</li>
                </ul>`
            }
        ]

        return {
            data
        }
    },
    methods: {
        open: function() {
            this.$refs.component.current.selected = 1;
        },
        onopen: function() {
           console.log('tab is opened');
        }
    }
};
</script>
```

### Create as Web Component

Also, you can use the plugin as a web component as below.

{.visible}
```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<lm-tabs id="root">
    <div title="Tab 1">Content of the first tab</div>
    <div title="Tab 2">Content of the second tab</div>
</lm-tabs>

<input id="btn1" type="button" value="Select Second Tab" />

<script>
// My web component element
let instance = document.getElementById('root');
// Bind event to my button
document.getElementById("btn1").addEventListener("click", () => {
    instance.selected = 1;
})
</script>
</html>
```