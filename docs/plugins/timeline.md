LemonadeJS Timeline
===============

A user-friendly component designed for displaying logs, highlights, and minimalist roadmaps. Easily configure colors, content, and point positions to suit your preferences. This lightweight tool ensures efficient performance, making data presentation a breeze. Simplify your displays with LemonadeJS Timeline.

Documentation
-------------

### Installation

```bash
npm install @lemonadejs/timeline
```

### Settings

| Attribute | Type | Description |
| --------- | ---- | ----------- |
| data | Array<Item> | An array of items to be displayed. Each item should follow the structure defined in the 'Item Details' section. |
| type? | String | An optional parameter specifying the type of the timeline component. Use "monthly" to enable segregation and display only the items in the current month. If not set or set to a value other than "monthly" the timeline will display all items without monthly segregation. |
| align? | String | An optional parameter determining the alignment of the timeline content. Accepted values include "left", "right", "top" and "bottom". Defaults to "left". |
| message? | String | An optional message or label associated with the settings, providing additional context. This message will be displayed when there are no items to show in the timeline. |
| orderdesc | Boolean | A boolean flag indicating whether the items should be ordered in descending order. If true, the items will be sorted in descending order; otherwise, they will be sorted in ascending order. |

### Item Details

| Attribute | Type | Description |
| --------- | ---- | ----------- |
| date | Date | An date associated with the item, providing chronological information. |
| title? | String | An optional title for the item, serving as a concise and meaningful identifier. |
| subtitle? | String | An optional subtitle providing additional information or context related to the item. |
| description? | String | An optional detailed description of the item, offering comprehensive information or context. |
| borderColor? | String | An optional parameter specifying the color of the item's border for visual customization. |
| borderStyle? | String | An optional parameter defining the style of the item's border, such as "solid," "dashed," or "dotted." |

### Events

| Event | Trigger |
| ----- | ------- |
| onupdate? | Called when the items are updated. |

### Examples

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<div id="root"></div>

<script>
const root = document.getElementById("root")

Timeline(root, {
    data: [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';


lemonade.setComponents({ Timeline });

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]

    return `<div style="width: 500px; height: 300px;">
        <Timeline :data="self.data" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

export default function App() {
    const myRef = useRef();

    const data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ];

    return (
    <div>
        <Timeline ref={myRef} data={data}/>
    </div>
    );
}
```
<!--
vue```
<template>
    <div style="height: 500px;">
        <Timeline :data="data" />
    </div>
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        return {
            data: [
                { title: "Issue Identification", date: new Date(2022, 6, 1) },
                { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
                { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
            ]
        };
    },
}
</script>

<style>
</style>
```
-->

### Overview

The LemonadeJS Timeline offers a pre-built solution designed for showcasing stylish and straightforward data visualizations. It allows customization of each element and provides options to fine-tune user engagement.

### Modifying Appearance and Content

You have the flexibility to position the content as desired, and customizing the colors of the Timeline is a straightforward process.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<div id="root"></div>

<script>
const root = document.getElementById("root")

Timeline(root, {
    data: [
        { title: "Issue Identification", date: new Date(2022, 6, 1), borderColor: '#800080' },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2), borderColor: '#008080' },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3), borderColor: '#808000' },
    ],
    align: 'left'
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';


lemonade.setComponents({ Timeline });

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1), borderColor: '#800080' },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2), borderColor: '#008080' },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3), borderColor: '#808000' },
    ]

    return `<div style="width: 500px; height: 300px;">
        <Timeline :data="self.data" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

export default function App() {
    const myRef = useRef();

    const data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1), borderColor: '#800080' },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2), borderColor: '#008080' },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3), borderColor: '#808000' },
    ];

    return (
    <div>
        <Timeline ref={myRef} data={data}/>
    </div>
    );
}
```
<!--
vue```
<template>
    <div style="height: 500px;">
        <Timeline :data="data" />
    </div>
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        return {
            data: [
                { title: "Issue Identification", date: new Date(2022, 6, 1), borderColor: '#800080' },
                { title: "Root Cause Analysis", date: new Date(2022, 6, 2), borderColor: '#008080' },
                { title: "Implementation of Solution", date: new Date(2022, 6, 3), borderColor: '#808000' },
            ]
        };
    },
}
</script>

<style>
</style>
```
-->

### Timeline position

You have the option to position the timeline in four different ways: left, right, bottom, or top.

Play with this example on [codesandbox](https://codesandbox.io/p/sandbox/frosty-babycat-cjcwrk?file=%2Fsrc%2Findex.js).

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<label for="dropdown">Choose a position to align:</label>
<select id="dropdown">
    <option value="left">Left</option>
    <option value="right">Right</option>
    <option value="top">Top</option>
    <option value="bottom">Bottom</option>
</select>
<div id="root"></div>

<script>
const root = document.getElementById("root")
const dropdown = document.getElementById("dropdown")


const tml = Timeline(root, {
    data: [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ],
})

dropdown.addEventListener('change', (e) => {
    tml.align = e.target.value
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';


lemonade.setComponents({ Timeline });

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]

    self.onload = function() {
        self.dropdown.addEventListener('change', (e) => {
            self.tml.align = e.target.value
        })
    }

    return `<div>
        <label for="dropdown">Choose a position to align:</label>
        <select id="dropdown" :ref="self.dropdown">
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
        </select>
        <div style="width: 500px; height: 300px;">
            <Timeline :data="self.data" :ref="self.tml" />
        </div>
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

export default function App() {
    const myRef = useRef();

    const data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ];

    return (<>
        <label for="dropdown">Choose a position to align:</label>
        <select id="dropdown" onChange={(e) => myRef.current.align = e.target.value}>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
        </select>
        <div style={{ height: '300px', width: '500px' }}>
            <Timeline ref={myRef} data={data} />
        </div>
    </>);
}
```
<!--
vue```
<template>
    <label for="dropdown">Choose a position to align:</label>
    <select id="dropdown" @change="this.$refs.timelineRef.current.align = $event.target.value">
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
    </select>
    <div style="height: 300px; width: 500px">
        <Timeline :data="data" ref="timelineRef" />
    </div>
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        return {
            data: [
                { title: "Issue Identification", date: new Date(2022, 6, 1) },
                { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
                { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
            ]
        }
    }
}
</script>

<style></style>

```
-->

### Monthly Type

The monthly type will organize the data based on its respective month and year. Enabling this option will display a controller with buttons for navigating to the next and previous months.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<div id="root" style="width: 500px; height: 300px;"></div>

<script>
const root = document.getElementById("root")

const today = new Date()

const names = ["Anne", "Louis", "Hector", "Maria", "John", "Carlos", "Grace", "Anthony", "Julia", "Olivia", "Ethan", "Sophia", "Jackson", "Liam", "Isabella", "Emma", "Aiden"];

// Generate random dates
const data = names.map(name => {
    const randomDay = Math.ceil(Math.random() * 31);
    const monthOffset = Math.floor(Math.random() * 3) - 1;
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, randomDay);

    return { title: name, date: date };
});

const timeline = Timeline(root, {
    data: data,
    type: 'monthly',
    align: 'left'
})

</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';


lemonade.setComponents({ Timeline });

const today = new Date()

const names = ["Anne", "Louis", "Hector", "Maria", "John", "Carlos", "Grace", "Anthony", "Julia", "Olivia", "Ethan", "Sophia", "Jackson", "Liam", "Isabella", "Emma", "Aiden"];

// Generate random dates
const data = names.map(name => {
    const randomDay = Math.ceil(Math.random() * 31);
    const monthOffset = Math.floor(Math.random() * 3) - 1;
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, randomDay);

    return { title: name, date: date };
});

export default function App() {
    const self = this;

    self.data = data

    return `<div style="width: 500px; height: 300px;">
            <Timeline :data="self.data" :type="monthly" :ref="self.tml" />
        </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

const today = new Date()

const names = ["Anne", "Louis", "Hector", "Maria", "John", "Carlos", "Grace", "Anthony", "Julia", "Olivia", "Ethan", "Sophia", "Jackson", "Liam", "Isabella", "Emma", "Aiden"];

// Generate random dates
const data = names.map(name => {
    const randomDay = Math.ceil(Math.random() * 31);
    const monthOffset = Math.floor(Math.random() * 3) - 1;
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, randomDay);

    return { title: name, date: date };
});

export default function App() {
    const myRef = useRef();

    return (<div style={{ height: '300px', width: '500px' }}>
            <Timeline ref={myRef} data={data} type={"monthly"} />
        </div>);
}
```
<!--
vue```
<template>
    <div style="height: 300px; width: 500px">
        <Timeline :data="data" type="monthly" ref="timelineRef" />
    </div>
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        const today = new Date()

        const names = ["Anne", "Louis", "Hector", "Maria", "John", "Carlos", "Grace", "Anthony", "Julia", "Olivia", "Ethan", "Sophia", "Jackson", "Liam", "Isabella", "Emma", "Aiden"];

        // Generate random dates
        const data = names.map(name => {
            const randomDay = Math.ceil(Math.random() * 31);
            const monthOffset = Math.floor(Math.random() * 3) - 1;
            const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, randomDay);

            return { title: name, date: date };
        });

        return {
            data: data
        }
    }
}
</script>

<style></style>

```
-->

### Sort

The timeline can be organized either in ascending or descending order based on dates. This feature enhances the user experience by providing flexibility in viewing chronological events.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<label for="dropdown">Choose a sorting order:</label>
<select id="dropdown-order">
    <option value="asc">Asc</option>
    <option value="desc">Desc</option>
</select>
<div id="root"></div>

<script>
const root = document.getElementById("root")
const dropdown = document.getElementById("dropdown-order")


const tml = Timeline(root, {
    data: [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ],
})

dropdown.addEventListener('change', (e) => {
    tml.orderdesc = e.target.value === 'desc'
})

</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';


lemonade.setComponents({ Timeline });

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]

    self.onload = function() {
        self.dropdown.addEventListener('change', (e) => {
            self.tml.orderdesc = e.target.value === 'desc'
        })
    }

    return `<div>
        <label for="dropdown">Choose a sorting order:</label>
        <select id="dropdown" :ref="self.dropdown">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
        </select>
        <div style="width: 500px; height: 300px;">
            <Timeline :data="self.data" :ref="self.tml" />
        </div>
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

export default function App() {
    const myRef = useRef();

    const data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ];

    return (<>
        <label for="dropdown">Choose a sorting order:</label>
        <select id="dropdown" onChange={(e) => myRef.current.orderdesc = e.target.value === 'desc'}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
        </select>
        <div style={{ height: '300px', width: '500px' }}>
            <Timeline ref={myRef} data={data} />
        </div>
    </>);
}
```
<!--
vue```
<template>
    <label for="dropdown">Choose a sorting order:</label>
    <select id="dropdown" @change="this.$refs.timelineRef.current.orderdesc = $event.target.value === 'desc'">
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
    </select>
    <div style="height: 300px; width: 500px">
        <Timeline :data="data" ref="timelineRef" />
    </div>
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        return {
            data: [
                { title: "Issue Identification", date: new Date(2022, 6, 1) },
                { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
                { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
            ]
        }
    }
}
</script>

<style></style>

```
-->
