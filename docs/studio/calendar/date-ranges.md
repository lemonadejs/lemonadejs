Calendar Date Ranges
====================

One of the standout features of our Calendar Component is the versatile "Date Range" mode, designed to simplify the process of selecting a range of dates seamlessly. Enabling this mode transforms the calendar into an intuitive date range picker, empowering users to effortlessly choose a start date and an end date for their events, bookings, or scheduling needs.

### How to enable

Enabling the Date Range feature is as straightforward as adding ``type: range`` to the configuration object.

### Date Range Example

Explore the Date Range feature by selecting a range of dates.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar@3.0.1/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar@3.0.1/dist/style.min.css" />

<div id='root' style='background-color: white;'></div>

<script>
const calendar = Calendar(document.getElementById('root'), {
    type: 'range',
    value: new Date()
});
</script>
</html>
```
```javascript
import Calendar from '@lemonadejs/calendar';
import '@lemonadejs/calendar/dist/style.css';

export default function App() {
    const self = this;

    return `<div>
        <Calendar type="range" value="2023-11-11" />
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
                type: 'range',
                value: new Date(),
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```