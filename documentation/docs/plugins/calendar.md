title: JavaScript Calendar - LemonadeJS
keywords: JavaScript Calendar, Date and Time Picker, Range Picker, Vue, React, Angular, Customizable, Lightweight, High Performance, User-Friendly, Modern Design, Web Development, UI Components
description: Elevate web projects with our reactive JavaScript Calendar, which is compatible with Vue, React, and Angular. Effortlessly manage events and deadlines with this customizable, high-performance date and time or range picker. Enhance your application with our lightweight, user-friendly component.
canonical: https://lemonadejs.com/docs/plugins/calendar


![JavaScript Calendar](img/javascript-calendar.jpg){.right style="width: initial; margin: 60px;"}

# JavaScript Calendar

`JavaScript Components`{.jtag .black .framework-images}

`Component size: 3.18KB gzipped`{.small}

The LemonadeJS Calendar is a versatile JavaScript calendar component designed for seamless integration with popular frameworks like React, VueJS, and Angular. This component enhances your web applications by providing an embeddable calendar picker that can be easily incorporated into HTML forms, facilitating straightforward date, time, and range selections. It is engineered to support keyboard navigation, ensuring a superior user experience. Notably lightweight and built with a reactive and responsive design, the LemonadeJS Calendar offers:

- **Intuitive Keyboard Navigation**: Navigate dates using the keyboard for efficiency and accessibility.
- **Reactive & Responsive Design**: Adapts smoothly to different devices and screen sizes.
- **Flexible Range Selection**: Select date ranges with ease, ideal for booking systems and scheduling.
- **Event-Driven Integration**: Seamless integration into your application workflow.
- **Lightweight Architecture**: Optimized for speed and performance, ensuring minimal impact on load times.
- **High Customizable**: Tailor the calendar's appearance and functionality to fit your project's needs.


## Documentation

### Installation

```bash
npm install @lemonadejs/calendar
```

### Settings

| Attribute                  | Description                                                                                                       |
|----------------------------|-------------------------------------------------------------------------------------------------------------------|
| `type?: String`            | Determines the rendering type for the calendar. Options: 'inline', 'default'.                                     |
| `range?: Boolean`          | Enables the range mode for date selection.                                                                        |
| `value?: Number\|String` | Represents the currently selected date.                                                                           |
| `numeric?: Boolean`        | Enables the use of numeric dates, treating them as serial numbers.                                                |
| `input?: HTML Element`     | An optional reference to control the calendar opening. The value is automatically bound when using this property. |


### Events

| Event                            | Description                         |
|----------------------------------|-------------------------------------|
| onchange?: (self, value) => void | Called when a new date is selected. |

## Examples

### HTML Embed Example

Embed the LemonadeJS Calendar into your web application to create a user-friendly date picker. Utilize event handling to integrate seamlessly with your application's functionality.

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
    return render => render `<div>
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

### Range picking

The LemonadeJS JavaScript Calendar provides various features that greatly enhance flexibility. These include picking date ranges, navigating through the calendar using keyboard controls, selecting specific times, and more.

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
    return render => render`<div>
        <input type="text" :ref="${this.input}" />
        <Calendar :input="${this.input}" :range="true" />
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

    return (<>
        <input type='text' ref={inputRef}/>
        <Calendar range={true} input={inputRef} ref={calendarRef} />
    </>);
}
```
```vue
<!-- codesandbox: https://codesandbox.io/p/sandbox/funny-sea-yfxyjr -->
<template>
  <input type="text" ref="inputRef" />
  <Calendar :input="inputRef" ref="calendarRef" />
</template>

<script>
import { ref } from 'vue';

import Calendar from '@lemonadejs/calendar/dist/vue';
import "@lemonadejs/calendar/dist/style.css";
import "@lemonadejs/modal/dist/style.css";

export default {
  name: 'App',
  components: {
      Calendar
  },
  setup() {
    const inputRef = ref(null);

    return {
      inputRef,
    };
  }
}
</script>
```

## Codesandbox

### Working examples

To explore practical implementations of the LemonadeJS Calendar component in different frameworks, you can visit the following CodeSandbox examples. Each link provides a unique setup tailored to a specific framework, allowing you to see the calendar in action and understand how it integrates within various development environments.

- **[JavaScript Calendar](https://codesandbox.io/p/sandbox/dreamy-waterfall-mh572x){target="blank"}**: Experience the LemonadeJS Calendar in a vanilla JavaScript setting for a straightforward implementation.
- **[LemonadeJS Calendar](https://codesandbox.io/p/sandbox/lemonadejs-reactive-app-forked-wfjw3n){target="blank"}**: Dive into a more advanced example showcasing the reactive features of the LemonadeJS Calendar in a dynamic application context.
- **[React Calendar](https://codesandbox.io/p/devbox/nostalgic-jackson-ljty72){target="blank"}**: Integrate LemonadeJS calendar with React and enhancing your React applications with date, time or range picking functionalities.
- **[VueJS Calendar](https://codesandbox.io/p/sandbox/funny-sea-yfxyjr){target="blank"}**: Explore the integration of the LemonadeJS Calendar within a VueJS application.

