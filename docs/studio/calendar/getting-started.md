LemonadeJS Calendar
====================

The LemonadeJS Calendar offers a compact yet powerful solution for effective date management. With intuitive Keyboard Navigation, users can easily move through dates, while the range selection feature ensures precise date picking within specified limits. The inclusion of Time Selection allows for fine-tuned scheduling down to the minute. Notably, it achieves all these functionalities with an emphasis on minimal size and swift performance, making it an efficient choice for diverse applications.

- Keyboard Navigation
- Picking Date Ranges
- Time Picking

### Setting up

You have the flexibility to set up the component in either an npm environment using Node.js Environment or an Browser Integration via CDN. Follow the appropriate instructions below based on your preferred setup method.

#### NPM

```bash
npm install @lemonadejs/calendar
```

#### CDN
```xml
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
```

### Basic Example

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar@3.0.1/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar@3.0.1/dist/style.min.css" />

<div id='root' style='background-color: white;'></div>

<script>
const calendar = Calendar(document.getElementById('root'), { type: 'inline', value: new Date() });
</script>
</html>
```
```javascript
import Calendar from '@lemonadejs/calendar';
import '@lemonadejs/calendar/dist/style.css';

export default function App() {
    const self = this;

    return `<div>
        <Calendar type="inline" value="2023-11-11" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Calendar from '@lemonadejs/calendar';
import '@lemonadejs/calendar/dist/style.css';


export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Calendar(domRef.current, {
                type: 'inline',
                value: new Date(),
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```

### Settings

| Property | Type | Description |
| -------- | ---- | ----------- |
| value | date | The value currently attached to the calendar. |
| type | string | The type of render the calendar will perform. Options are 'inline', 'range' or undefined.  |
| range | array | Defines a restricted range of selectable dates within the calendar. Example: ['2023-06-20', '2023-06-25']. |
| closed | boolean | Control when the calendar modal is open or closed. |
| time | boolean | Enables time selection into the calendar. |

### Events

| Event | Description |
| --- | --- |
| onupdate?: (self, object) => void | Called when cell data is changed. |

### Keyboard Navigation

Improve user interaction through seamlessly available keyboard navigation. This default integration of keyboard navigation, complementing mouse interaction, ensures a universally accessible and user-friendly experience with the Calendar component.

* **Arrow Up or Arrow Left:** Navigate to the previous day or the previous week. If there's no previous day, the navigation extends to the previous month.

* **Arrow Right or Arrow Down:** Navigate to the next day or the next week. If there's no next day, the navigation extends to the next month.

* **Enter:** Select the currently hovered date as the new value.