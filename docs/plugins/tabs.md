title: LemonadeJS Tabs: Versatile and Dynamic JavaScript Component for Vue, React, Angular
description: Explore the capabilities of LemonadeJS Tabs, a versatile and dynamic component designed to facilitate the organization and presentation of distinct content sections within a minimalist tabbed interface. This JavaScript component seamlessly integrates with Vue, React, and Angular, offering an intuitive solution to enhance content navigation and user experience.
keywords: LemonadeJS Tabs, versatile JavaScript component, dynamic content organization, minimalist tabbed interface, Vue compatible, React integration, Angular tabs, intuitive navigation, user-friendly interface, optimal performance UI component, web development tools, UI component for developers.

LemonadeJS Tabs
===============

Introducing the LemonadeJS JavaScript Tabs, a versatile and dynamic component designed to facilitate the organization and presentation of distinct content sections within a minimalist tabbed interface.  
  

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/tabs
```

### Settings

| Property | Type | Description |
| -------- | ---- | ----------- |
| selected? | number | The index of the initially selected tab. Starts from 0. |
| position? | string | The position of the tabs bar within the parent element. Use 'center' to center-align the tabs. |
| data? | tabItem[] | An optional alternative method to provide the title and content that will serve as the basis for rendering the tabs. See more about the `tabItem` object in the Tab Item section below. |
| round? | boolean | Dictates whether the tab style will feature rounded corners. |
| onopen? | function | When a new tabs is opened. |

#### Tab Item

| Property | Description |
| -------- | ----------- |
| title    | The title of the tab, serving as the label displayed on the tab options. |
| content  | The HTML content intended for this specific tab. |

### Useful Notes

*   **Data Flexibility:** There are multiple ways to pass data to the Tabs component, giving you flexibility in how you populate the content.

Examples
--------

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
Tabs(document.getElementById("root"), {
  selected: 0
});
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

export default function App() {
    const self = this;

    return `<div>
        <Tabs :selected="0">
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

This example showcases the approach with the data property.  
[See this example on codesandbox](https://codesandbox.io/s/affectionate-lamarr-fmwvdx?file=/index.html)

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />

<div id="root"></div>
<input id="bttn-select" type="button" value="Select Wednesday" />

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
    },
    {
        title: "Wednesday",
        content: `<ul>
            <li>10:00 AM - 11:30 AM: Workshop</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
            <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
        </ul>`
    }
];

const component = Tabs(document.getElementById("root"), {
    data: data,
    selected: 0
});

document.getElementById("bttn-select").addEventListener("click", () => {
    component.selected = 2;
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
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
        },
        {
            title: "Wednesday",
            content: `<ul>
                <li>10:00 AM - 11:30 AM: Workshop</li>
                <li>12:00 PM - 01:30 PM: Lunch Break</li>
                <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
                <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
            </ul>`
        }
    ];

    self.goToWednesday = function () {
        self.tabsRef.selected = 2;
    }

    return `<>
        <Tabs :selected="0" :data="self.data" :ref="self.tabsRef"></Tabs>
        <button onclick="self.goToWednesday">Go To Wednesday</button>
    </>`
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
    },
    {
        title: "Wednesday",
        content: `<ul>
            <li>10:00 AM - 11:30 AM: Workshop</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
            <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
        </ul>`
    }
];

export default function App() {
    const component = useRef();

    const goToWednesday = () => {
        component.current.selected = 2;
    }
  
    return <>
        <Tabs ref={component} data={data} />
        <button onClick={() => goToWednesday()}>Go To Wednesday</button>
    </>;
}
```
```vue
<template>
    <Tabs ref="component" :data="data" />
    <button @click="goToWednesday">Go To Wednesday</button>
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
            },
            {
                title: "Wednesday",
                content: `<ul>
                    <li>10:00 AM - 11:30 AM: Workshop</li>
                    <li>12:00 PM - 01:30 PM: Lunch Break</li>
                    <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
                    <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
                </ul>`
            }
        ]

        return {
            data
        }
    },
    methods: {
        goToWednesday: function () {
            this.$refs.component.current.selected = 2;
        }
    }
};
</script>
```