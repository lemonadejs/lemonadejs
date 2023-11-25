LemonadeJS Calendar
==================

Unlock versatility with our sleek calendar – seamlessly blending style with functionality. Effortlessly pick dates, navigate with ease, and select times flexibly. Ideal for events or deadlines, this lightweight component ensures optimal performance, delivering a polished, customizable design. Simplify your tasks with understated sophistication.

Documentation
-------------


### Installation

```bash
npm install @lemonadejs/calendar
```

### Settings

| Attribute | Type    | Description |
| --------- | ----    | ----------- |
| range?    | boolean | Enables the range mode for date selection. |
| type?     | string  | Determines the rendering type for the calendar. Options: 'inline', 'default'. |
| value?    | number or string | Represents the currently selected date. |
| numeric?  | boolean | Enables the use of numeric dates, treating them as serial numbers. |
| input?    | HTML element | An optional reference to control the calendar opening. The value is automatically bound when using this property. |


### Events

| Event | Description |
| ----- | ----------- |
| onupdate?: (self, value) => void | Called when a new date is selected. |

### Examples

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />

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
import React, { useRef } from 'react';
import Calendar from '@lemonadejs/calendar/dist/react';

export default function App() {
    const calendarRef = useRef();

    return (<>
        <Calendar type={'inline'} ref={calendarRef} value={new Date()} />
    </>);
}
```
<!-- ```vue
<template>
    <div>
        <Calendar type="inline" value="2022-01-15" ref="calendarRef" />
    </div>
</template>

<script>
import Calendar from '@lemonadejs/calendar/dist/vue'

export default {
    name: 'App',
    components: {
        Calendar
    },
}
</script>

<style></style>
```
-->

### Overview

The LemonadeJS Calendar boasts a range of features that greatly enhance its flexibility and user-friendliness. These include the ability to pick date ranges, navigate through the calendar using keyboard controls, select specific times, and more.

### Range picking

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Icons" />


<input type="text" value="" id="input-range-eg"/>
<div id="root" style="background-color: white;"></div>

<script>
const root = document.getElementById("root")
const input = document.getElementById("input-range-eg")

const calendar = Calendar(root, {
    range: true,
    input: input,
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
        <input type="text" :ref="self.inputRef"/>
        <Calendar :input="self.inputRef" type="inline" value="2023-11-11" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect, useState } from 'react';
import Calendar from '@lemonadejs/calendar/dist/react';

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
                    value={'2022-01-15'}
                />
            </div>
        )}
    </>);
}
```
<!-- ```vue
<template>
    <input type="text" ref="inputRef" />
    <div v-if="ready">
        <Calendar :input="inputRef" :range="true" value="2022-01-15" ref="calendarRef" />
    </div>
</template>

<script>
import Calendar from '@lemonadejs/calendar/dist/vue'

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

<style></style>
```
-->