title: JavaScript Timeline Plugin
description: LemonadeJS Timeline is a framework-agnostic JavaScript plugin for creating dynamic, customizable timelines. Perfect for Vue, React, and Angular, it offers intuitive event grouping and easy navigation for effective data visualization.
keywords: JavaScript Timeline, LemonadeJS, Vue, React, Angular, Customizable, Event Grouping, Data Visualization
canonical: https://lemonadejs.com/docs/plugins/timeline

![JavaScript Timeline](img/javascript-timeline.jpg){.right style="width: initial; margin: 60px;"}

# JavaScript Timeline

`Pico Library`{.jtag .black .framework-images}

The LemonadeJS JavaScript Timeline is a framework-agnostic plugin designed for timeline creation, supporting Vue, React, and Angular integration. It facilitates the construction of logs, event timelines, and roadmaps, providing options for customization such as color adjustments, content modification, and control over point positioning. The plugin includes features for automatically grouping events by month and navigation controls, aiding in organizing and displaying timeline data.

## Documentation

### Installation

```bash
npm install @lemonadejs/timeline
```

### Configuration Options

Initialize the timeline with these settings to tailor the plugin to your specific needs:

| Attribute          | Description                                                                                                        |
|--------------------|--------------------------------------------------------------------------------------------------------------------|
| `data: Item[]`     | An array of items to be displayed. Each item should follow the structure defined in the 'Item Properties' section. |
| `type?: String`    | There are default and monthly types. The latter will create a navigation per month and group all items.            |
| `align?: String`   | Align the bullet points. Accepted values include "left", "right", "top", and "bottom". `Default:  "left"`.         |
| `message?: String` | Will show when no data to display                                                                                  |
| `order?: String`   | Accepted values are 'asc' for ascending and 'desc' for descending order.                                           |
| `width?: Number`   | Determines the width of the javascript timeline container.                                                         |
| `height?: Number`  | Determines the height of the javascript timeline container.                                                                   |

### Entry Attributes

Define each timeline event with these specific properties to customize its appearance and behavior:

| Attribute               | Description                                                                     |
|-------------------------|---------------------------------------------------------------------------------|
| `date?: String`         | A date associated with the item, providing chronological information.           |
| `title?: String`        | Title for the item.                                                             |
| `subtitle?: String`     | Sub caption for the item.                                                       |
| `description?: String`  | Item description.                                                               |
| `borderColor?: String`  | Border color                                                                    |
| `borderStyle?: String`  | Define the style of the item's border, such as "solid," "dashed," or "dotted."  |

### Event Handling

Utilize this event to monitor user interactions, enabling data synchronization with the server:

| Event                  | Trigger                            |
|------------------------|------------------------------------|
| onupdate?              | Called when the items are updated. |

## Examples

This section illustrates practical applications of the JavaScript timeline plugin, highlighting customization techniques for style and functionality to align with specific project objectives.

See more examples on https://codesandbox.io/p/sandbox/frosty-babycat-cjcwrk

### Styling Attributes

Customize the visual aspects such as position, border style, and color schemes by setting the corresponding attributes during the initialization phase as demonstrated below: 

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
    const data = [
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

    return render => render`<Timeline data="${data}" align="left" /></div>`
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

### Positioning Options

Configure the placement of the timeline on the page by choosing from four positions: left, right, bottom, or top. Adjustments can also be made programmatically, as shown in the following example:

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

    const ref = null;

    const data = [
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]

    const change = (e) => {
        ref.align = e.target.value;
    }

    return render => render`<div>
        <label>Choose a position to align:</label>
        <select onchange="${change}">
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
        </select>
        <Timeline data="${data}" :ref="${(e) => ref = e}" />
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
        <label>Choose a position to align:</label>
        <select onChange={(e) => myRef.current.align = e.target.value}>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
        </select>
        <div>
            <Timeline ref={myRef} data={data} />
        </div>
    </>);
}
```
```vue
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

- See this [React Timeline](https://codesandbox.io/p/devbox/xenodochial-aj-9rdn66) example on codesandbox;
- See this [Vue Timeline](https://codesandbox.io/p/devbox/vigorous-wozniak-5dl5rk) example on codesandbox;

### Monthly View Configuration

This setting enables a navigation control for monthly views, automatically grouping entries by their respective month and year.

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
        date: faker.date.between(new Date(2025, 1, 1), new Date(2025, 12, 30)),
        title: faker.commerce.productName(),
        subtitle: faker.commerce.department(),
        description: faker.commerce.productName(),
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

    const data = [];
    for (let i = 0; i < 10; i++) {
        data.push({
            date: faker.date.between(new Date(2025, 1, 1), new Date(2025, 12, 30)),
            title: faker.commerce.productName(),
            subtitle: faker.commerce.department(),
            description: faker.commerce.productName(),
        })
    }
    
    this.data = data;

    return render => render`<Timeline data="${this.data}" width="${500}" height="${300}" type="monthly" />`
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
        date: faker.date.between(new Date(2025, 1, 1), new Date(2025, 12, 30)),
        title: faker.commerce.productName(),
        subtitle: faker.commerce.department(),
        description: faker.commerce.productName(),
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
                date: faker.date.between(new Date(2025, 1, 1), new Date(2025, 12, 30)),
                title: faker.commerce.productName(),
                subtitle: faker.commerce.department(),
                description: faker.commerce.productName(),
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

Configure the timeline to display events in ascending or descending chronological order.

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
import { state } from 'lemonadejs'
import Timeline from '@lemonadejs/timeline';
import '@lemonadejs/timeline/dist/style.css';

export default function App() {

    let data = state([
        { title: "Issue Identification", date: new Date(2022, 6, 1) },
        { title: "Root Cause Analysis", date: new Date(2022, 6, 2) },
        { title: "Implementation of Solution", date: new Date(2022, 6, 3) },
    ]) 

    const sort = (e) => {
        this.ref.order = e.target.value
    }

    return render => render`<div>
        <label>Choose a sorting order:</label>
        <select onchange="${sort}">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
        </select>
        <Timeline data="${data}" :ref="this.ref" />
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

