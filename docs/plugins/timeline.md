title: JavaScript Timeline: Versatile JavaScript Timeline Plugin
description: LemonadeJS Timeline is a framework-agnostic JavaScript plugin perfect can be integrated with Vue, React, and Angular developers. Effortlessly create interactive logs, event highlights, and minimalist roadmaps with extensive customization options. Modify colours, content, and point positions with ease. Featuring automatic monthly event grouping and intuitive navigation, LemonadeJS Timeline simplifies complex data visualization.
keywords: JavaScript timeline plugin, LemonadeJS Timeline, framework-agnostic JavaScript tool, Vue compatible timeline, React timeline component, Angular timeline integration, customizable timeline plugin, interactive logs JavaScript, roadmap visualization tool, monthly event grouping, data visualization JavaScript, UI component for developers, web development tools, timeline navigation feature.

![JavaScript Timeline](img/javascript-timeline.jpg){style="width: initial; margin: 60px;"}

LemonadeJS Timeline
===============

`Pico Library`{.jtag .black .framework-images}

LemonadeJS Timeline is a framework-agnostic JavaScript plugin that offers integration with **Vue**, **React**, and **Angular**. Designed to enable developers to craft logs, event highlights, and minimalist roadmaps easily, it provides extensive customization options. Users have the flexibility to modify colours, content, and point positions and can take advantage of the automatic event grouping by month, complete with navigation functionality.


## Documentation

### Installation

```bash
npm install @lemonadejs/timeline
```

### Settings

| Attribute      | Type         | Description                                                                                                        |
|----------------|--------------|--------------------------------------------------------------------------------------------------------------------|
| data           | Item[]       | An array of items to be displayed. Each item should follow the structure defined in the 'Item Properties' section. |
| type?          | string       | There are default and monthly types. The latter will create a navigation per month and group all items.            |
| align?         | string       | Align the bullet points. Accepted values include "left", "right", "top", and "bottom". `Default:  "left"`.         |
| message?       | string       | Will show when no data to display                                                                                  |
| order?         | string       | Accepted values are 'asc' for ascending and 'desc' for descending order. |
| width? | number | Determines the width of the timeline container. |
| height? | number | Determines the height of the timeline container. |

### Item Properties

| Attribute             | Description                                                                    |
|-----------------------|--------------------------------------------------------------------------------|
| date?: string         | A date associated with the item, providing chronological information. |
| title?: string      | Title for the item.                                                            |
| subtitle?: string     | Sub caption for the item.                                                      |
| description?: string  | Item description.                                                              |
| borderColor?: string  | Border color                                                                   |
| borderStyle?: string  | Define the style of the item's border, such as "solid," "dashed," or "dotted." |

### Events

| Event                  | Trigger                            |
|------------------------|------------------------------------|
| onupdate?              | Called when the items are updated. |

## Examples

The JavaScript timeline plugin offers a variety of options for customizing both style and behaviour to suit your project's needs. Below are several examples demonstrating how to use these options.

See more examples on https://codesandbox.io/p/sandbox/frosty-babycat-cjcwrk

### Appearance

The position, border style and colours can be defined using the component's attributes during initialization as below. 

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
        {
            title: "Issue Identification",
            date: new Date(2022, 6, 1),
        },
        {
            title: "Root Cause Analysis",
            date: new Date(2022, 6, 2),
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 3),
            borderColor: '#808000',
            borderStyle: 'dashed',
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 4),
        }
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

export default function App() {
    const self = this;

    self.data = [
        {
            title: "Issue Identification",
            date: new Date(2022, 6, 1),
        },
        {
            title: "Root Cause Analysis",
            date: new Date(2022, 6, 2),
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 3),
            borderColor: '#808000',
            borderStyle: 'dashed',
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 4),
        }
    ];

    return `<Timeline :data="self.data" align="left" /></div>`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';

export default function App() {
    const myRef = useRef();

    self.data = [
        {
            title: "Issue Identification",
            date: new Date(2022, 6, 1),
        },
        {
            title: "Root Cause Analysis",
            date: new Date(2022, 6, 2),
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 3),
            borderColor: '#808000',
            borderStyle: 'dashed',
        },
        {
            title: "Implementation of Solution",
            date: new Date(2022, 6, 4),
        }
    ];

    return (<div>
        <Timeline ref={myRef} data={data} align="left" />
    </div>);
}
```
```vue
<template>
    <Timeline :data="data" align="left" />
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
                {
                    title: "Issue Identification",
                    date: new Date(2022, 6, 1),
                },
                {
                    title: "Root Cause Analysis",
                    date: new Date(2022, 6, 2),
                },
                {
                    title: "Implementation of Solution",
                    date: new Date(2022, 6, 3),
                    borderColor: '#808000',
                    borderStyle: 'dashed',
                },
                {
                    title: "Implementation of Solution",
                    date: new Date(2022, 6, 4),
                }
            ]
        };
    },
}
</script>

<style>
</style>
```

### Timeline position

You have the option to position the timeline in four different ways: left, right, bottom, or top. Also, you can change that programatically as example below.

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

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]
    
    self.align = function(e) {
        self.ref.align = e.target.value;
    }

    return `<div>
        <label>Choose a position to align:</label>
        <select onchange="self.align">
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
        </select>
        <Timeline :data="self.data" :ref="self.ref" />
    </div>`
}
```
```jsx
// codesandbox: https://codesandbox.io/p/devbox/xenodochial-aj-9rdn66

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
        <label>Choose a position to align:</label>
        <select onChange={(e) => myRef.current.align = e.target.value}>
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
```vue
<!-- codesandbox: https://codesandbox.io/p/devbox/vigorous-wozniak-5dl5rk -->

<template>
    <label>Choose a position to align:</label>
    <select @change="this.$refs.timelineRef.current.align = $event.target.value">
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
    </select>
    <Timeline :data="data" ref="timelineRef" />
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
```


### Monthly Type

The monthly type will be a monthly navigation control and organize the data based on its respective month and year.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/timeline/dist/style.min.css" />

<div id="root"></div>

<script>
const root = document.getElementById("root")

let data = [];
for (let i = 0; i < 500; i++) {
    data.push({
        date: faker.date.between({ from: new Date(2024, 0, 1), to: new Date(2024, 11, 31)}),
        title: faker.commerce.productName(),
        subtitle: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
    })
}

const timeline = Timeline(root, {
    data: data,
    type: 'monthly',
    align: 'left',
    width: 500,
    height: 500,
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import { faker } from '@faker-js/faker';

import '@lemonadejs/timeline/dist/style.css';

export default function App() {
    const self = this;

    self.data = [];
    for (let i = 0; i < 10; i++) {
        self.data.push({
            date: faker.date.between({ from: new Date(2023, 0, 1), to: new Date(2023, 11, 31)}),
            title: faker.commerce.productName(),
            subtitle: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
        })
    }

    return `<Timeline :data="self.data" :type="monthly" :width="500" :height="300" />`
}
```
```jsx
import React, { useRef } from 'react';
import Timeline from '@lemonadejs/timeline/dist/react';
import { faker } from '@faker-js/faker';

import '@lemonadejs/timeline/dist/style.css';

let data = [];
for (let i = 0; i < 10; i++) {
    data.push({
        date: faker.date.between({ from: new Date(2023, 0, 1), to: new Date(2023, 11, 31)}),
        title: faker.commerce.productName(),
        subtitle: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
    })
}

export default function App() {
    const myRef = useRef();

    return (<Timeline ref={myRef} data={data} type="monthly" />);
}
```
```vue
<template>
   <Timeline :data="data" type="monthly" ref="timelineRef" />
</template>

<script>
import Timeline from '@lemonadejs/timeline/dist/vue'
import { faker } from '@faker-js/faker';

export default {
    name: 'App',
    components: {
        Timeline
    },
    data() {
        let data = [];
        for (let i = 0; i < 1000; i++) {
            data.push({
                date: faker.date.between({ from: new Date(2023, 0, 1), to: new Date(2023, 11, 31)}),
                title: faker.commerce.productName(),
                subtitle: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
            })
        }
        return {
            data: data
        }
    }
}
</script>
```


### Sorting

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
    tml.order = e.target.value;
})

</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]

    self.sort = function() {
        self.ref.order = e.target.value
    }

    return `<div>
        <label>Choose a sorting order:</label>
        <select onchange="self.sort">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
        </select>
        <Timeline :data="self.data" :ref="self.ref" />
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
        <select id="dropdown" onChange={(e) => myRef.current.order = e.target.value}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
        </select>
        <div style={{ height: '300px', width: '500px' }}>
            <Timeline ref={myRef} data={data} />
        </div>
    </>);
}
```
```vue
<template>
    <label for="dropdown">Choose a sorting order:</label>
    <select id="dropdown" @change="this.$refs.timelineRef.current.order = $event.target.value">
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
```

