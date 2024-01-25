title: LemonadeJS Calendar: Stylish reactive Date & Time Picker Component compatible Vue, React, Angular
keywords: Sleek Calendar component, date and time picker, Vue compatible calendar, React calendar component, Angular calendar integration, functional date picker, customizable time picker, event management tool, deadline tracker, optimal performance UI component, lightweight calendar, stylish design, sophisticated date and time selection, web development tools, UI component for developers.
description: Discover the versatility of our Sleek Calendar, a stylish and functional date and time picker component seamlessly compatible with Vue, React, and Angular. Effortlessly navigate through dates and select times flexibly for events or deadlines. This lightweight component ensures optimal performance and delivers a polished, customizable design. Unlock the perfect blend of style and functionality to simplify your tasks with understated sophistication.

![JavaScript Calendar](img/javascript-calendar.jpg){style="width: initial; margin: 60px;"}

JavaScript Calendar
==================

`JavaScript Components`{.jtag .black .framework-images}

`Component size: 3.18KB gzipped`{.small}

Unlock versatility with our sleek calendar – seamlessly blending style with functionality. Effortlessly pick dates, navigate with ease, and select times flexibly. Ideal for events or deadlines, this lightweight component ensures optimal performance, delivering a polished, customizable design. Simplify your tasks with understated sophistication.

Documentation
-------------


### Installation

```bash
npm install @lemonadejs/calendar
```

### Settings

| Attribute | Type             | Description                                                                                                       |
| --------- |------------------|-------------------------------------------------------------------------------------------------------------------|
| type?     | string           | Determines the rendering type for the calendar. Options: 'inline', 'default'.                                     |
| range?    | boolean          | Enables the range mode for date selection.                                                                        |
| value?    | number or string | Represents the currently selected date.                                                                           |
| numeric?  | boolean          | Enables the use of numeric dates, treating them as serial numbers.                                                |
| input?    | HTML element     | An optional reference to control the calendar opening. The value is automatically bound when using this property. |


### Events

| Event                            | Description                         |
|----------------------------------|-------------------------------------|
| onchange?: (self, value) => void | Called when a new date is selected. |

### Examples

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>

<div id='root' style='background-color: white;'></div>

<script>
const calendar = Calendar(document.getElementById('root'), { type: 'inline', value: new Date() });
</script>
</html>
```
```javascript
import Calendar from '@lemonadejs/calendar';
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const self = this;

    return `<div>
        <Calendar type="inline" value="2023-11-11" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Calendar from '@lemonadejs/calendar/dist/react';
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const calendarRef = useRef();

    return (<>
        <Calendar type={'inline'} ref={calendarRef} value={new Date()} />
    </>);
}
```
```vue
<template>
    <div>
        <Calendar type="inline" value="2022-01-15" ref="calendarRef" />
    </div>
</template>

<script>
import Calendar from '@lemonadejs/calendar/dist/vue'
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default {
    name: 'App',
    components: {
        Calendar
    },
}
</script>

<style></style>
```

### Overview

The LemonadeJS Calendar boasts a range of features that greatly enhance its flexibility and user-friendliness. These include the ability to pick date ranges, navigate through the calendar using keyboard controls, select specific times, and more.

### Range picking

```html
<!-- codesandbox: https://codesandbox.io/p/sandbox/dreamy-waterfall-mh572x -->
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>

<input type="text" id="input-range-eg" /> <div id="root"></div>

<script>
Calendar(document.getElementById("root"), {
    range: true,
    input: document.getElementById("input-range-eg"),
});
</script>
</html>
```
```javascript
// codesandbox: https://codesandbox.io/p/sandbox/lemonadejs-reactive-app-forked-wfjw3n
import Calendar from '@lemonadejs/calendar';
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const self = this;

    return `<div>
        <input type="text" :ref="self.inputRef" />
        <Calendar :input="self.inputRef" :range="true" />
    </div>`
}
```
```jsx
// codesandbox: https://codesandbox.io/p/devbox/nostalgic-jackson-ljty72
import React, { useRef, useEffect, useState } from 'react';
import Calendar from '@lemonadejs/calendar/dist/react';
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const calendarRef = useRef();
    const inputRef = useRef();

    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (inputRef.current) {
            setReady(true)
        }
    }, [inputRef.current])

    return (<>
        <input type='text' ref={inputRef}/>
        {ready && (
            <div>
                <Calendar
                    range={true}
                    input={inputRef.current}
                    ref={calendarRef}
                />
            </div>
        )}
    </>);
}
```
```vue
<!-- codesandbox: https://codesandbox.io/p/sandbox/funny-sea-yfxyjr -->
<template>
    <input type="text" ref="inputRef" />
    <div v-if="ready">
        <Calendar :input="inputRef" :range="true" ref="calendarRef" />
    </div>
</template>

<script>
import Calendar from '@lemonadejs/calendar/dist/vue'
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default {
    name: 'App',
    components: {
        Calendar
    },
    watch: {
        inputRef() {
            if (this.inputRef) {
                this.ready = true;
            }
        }
    },
    data() {
        return { 
            inputRef: null,
            calendarRef: null,
            ready: false,
        }
    },
    mounted() {
        // Accessing the DOM element using the ref after the component is mounted
        this.inputRef = this.$refs.inputRef;
        this.calendarRef = this.$refs.calendarRef;
    },
}
</script>
```

## Codesandbox

See a working example on codesandbox in different frameworks.

- [JavaScript Calendar](https://codesandbox.io/p/sandbox/dreamy-waterfall-mh572x){target="blank"}
- [LemonadeJS Calendar](https://codesandbox.io/p/sandbox/lemonadejs-reactive-app-forked-wfjw3n){target="blank"}
- [React Calendar](https://codesandbox.io/p/devbox/nostalgic-jackson-ljty72){target="blank"}
- [VueJS Calendar](https://codesandbox.io/p/sandbox/funny-sea-yfxyjr){target="blank"}


