JavaScript Tabs
===============

Introducing the LemonadeJS JavaScript Tabs, a versatile and dynamic component designed to facilitate the organization and presentation of distinct content sections within a minimalist tabbed interface.  
  

Documentation
-------------

  

### Installation

```bash
npm install @lemonadejs/tabs
```

### Settings

| Attribute | Type | Description |
| --- | --- | --- |
| data? | Array | An optional alternative method to provide the title and content that will serve as the basis for rendering the tabs. |
| selected? | Number | The index of the initially selected tab. Starts from 0. |
position? | String | The position of the tabs bar within the parent element. Use 'center' to center-align the tabs. |

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
const root = document.getElementById("root");

Tabs(root, {
  selected: 0
});
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

lemonade.setComponents({ Tabs });

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
import React, { useRef, useEffect } from "react";
import Tabs from "@lemonadejs/tabs";
import "@lemonadejs/tabs/dist/style.css";

export default function App() {
    const wrapperRef = useRef(null);
    const tabsRef = useRef(null);
  
    useEffect(() => {
        if (!tabsRef.current) {
            tabsRef.current = Tabs(wrapperRef.current, {
                selected: 0
            });
        }
    }, []);
  
    return <div ref={wrapperRef}>
        <div title="Tab 1">Content of the first tab</div>
        <div title="Tab 2">Content of the second tab</div>
    </div>;
}
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
const root = document.getElementById("root");
const button = document.getElementById("bttn-select");


const data = [{
    title: "Monday", content: `<ul>
            <li>09:00 AM - 10:00 AM: Keynote Speech</li>
            <li>10:30 AM - 12:00 PM: Panel Discussion</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>01:30 PM - 03:00 PM: Workshop</li>
            <li>03:30 PM - 05:00 PM: Networking Session</li>
        </ul>`
},{
    title: "Tuesday", content: `<ul>
            <li>09:30 AM - 10:30 AM: Keynote Speech</li>
            <li>11:00 AM - 12:30 PM: Workshop</li>
            <li>12:30 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
            <li>04:00 PM - 05:30 PM: Fireside Chat</li>
        </ul>`
},{
    title: "Wednesday", content: `<ul>
            <li>10:00 AM - 11:30 AM: Workshop</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
            <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
        </ul>`
}]

const component = Tabs(root, {
    data: data,
    selected: 0
});

button.addEventListener("click", () => {
    component.selected = 2
})
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Tabs from '@lemonadejs/tabs';
import '@lemonadejs/tabs/dist/style.css';

lemonade.setComponents({ Tabs });

export default function App() {
    const self = this;

    self.data = [{
        title: "Monday", content: `<ul>
                <li>09:00 AM - 10:00 AM: Keynote Speech</li>
                <li>10:30 AM - 12:00 PM: Panel Discussion</li>
                <li>12:00 PM - 01:30 PM: Lunch Break</li>
                <li>01:30 PM - 03:00 PM: Workshop</li>
                <li>03:30 PM - 05:00 PM: Networking Session</li>
            </ul>`
    },{
        title: "Tuesday", content: `<ul>
                <li>09:30 AM - 10:30 AM: Keynote Speech</li>
                <li>11:00 AM - 12:30 PM: Workshop</li>
                <li>12:30 PM - 01:30 PM: Lunch Break</li>
                <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
                <li>04:00 PM - 05:30 PM: Fireside Chat</li>
            </ul>`
    },{
        title: "Wednesday", content: `<ul>
                <li>10:00 AM - 11:30 AM: Workshop</li>
                <li>12:00 PM - 01:30 PM: Lunch Break</li>
                <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
                <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
            </ul>`
    }]

    return `<>
            <Tabs :selected="0" :data="self.data" :ref="self.tabsRef"></Tabs>
            <button onclick="self.tabsRef.selected = 2">Go To Wednesday</button>
        </>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Tabs from "@lemonadejs/tabs";
import "@lemonadejs/tabs/dist/style.css";

const data = [{
    title: "Monday", content: `<ul>
            <li>09:00 AM - 10:00 AM: Keynote Speech</li>
            <li>10:30 AM - 12:00 PM: Panel Discussion</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>01:30 PM - 03:00 PM: Workshop</li>
            <li>03:30 PM - 05:00 PM: Networking Session</li>
        </ul>`
},{
    title: "Tuesday", content: `<ul>
            <li>09:30 AM - 10:30 AM: Keynote Speech</li>
            <li>11:00 AM - 12:30 PM: Workshop</li>
            <li>12:30 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Breakout Sessions</li>
            <li>04:00 PM - 05:30 PM: Fireside Chat</li>
        </ul>`
},{
    title: "Wednesday", content: `<ul>
            <li>10:00 AM - 11:30 AM: Workshop</li>
            <li>12:00 PM - 01:30 PM: Lunch Break</li>
            <li>02:00 PM - 03:30 PM: Case Study Presentations</li>
            <li>04:00 PM - 05:00 PM: Closing Ceremony and Awards</li>
        </ul>`
}]

export default function App() {
    const wrapperRef = useRef(null);
    const tabsRef = useRef(null);
  
    useEffect(() => {
        if (!tabsRef.current) {
            tabsRef.current = Tabs(wrapperRef.current, {
                selected: 0,
                data: data
            });
        }
    }, []);

    const handleClick = () => {
        tabsRef.current.selected = 2
    }
  
    return <>
        <div ref={wrapperRef}></div>
        <button onClick={() => handleClick()}>Go To Wednesday</button>
    </>;
}
```