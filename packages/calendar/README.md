# LemonadeJS Calendar

[Official website and documentation is here](https://lemonadejs.net/components/calendar)

Compatible with Vanilla JavaScript, LemonadeJS, React, Vue or Angular.

The LemonadeJS Calendar Component is a lightweight and agile calendar solution that empowers developers with efficient date management capabilities. With seamless navigation between months and years, intuitive day selection, and the ability to attach values and events, this highly customizable component provides a versatile foundation for scheduling applications, booking systems, and more. Its optimized codebase ensures fast performance, while its responsive design guarantees a consistent user experience across devices. Streamline your date management with the LemonadeJS Calendar Component and unlock enhanced productivity for your users.

## Features

-   Lightweight: The JavaScript Calendar is only about 2 KBytes;
-   Integration: It can be used as a standalone library or integrated with any modern framework;

## Getting Started

You can install using NPM or using directly from a CDN.

### npm Installation

To install it in your project using npm, run the following command:

```bash
$ npm install @lemonadejs/calendar
```

### CDN

To use calendar via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/calendar/dist/style.min.css" />
```

### Usage

Quick example with Lemonade

```javascript
import Calendar from "@lemonadejs/calendar";
import "@lemonadejs/calendar/dist/style.css"

export default function App() {
    const self = this;

    return `<Calendar />`;
}
```

### Configuration

You can configure things such as calendar starting date, calendar events, and customize functions.

#### Calendar Properties

| Property | Type | Description |
| -------- | ---- | ----------- |
| value | date | The value currently attached to the calendar. |
| validRange | array |  |
| closed | boolean | Control when the calendar modal is open or closed. |
| time | boolean | Enables time selection into the calendar. |

### Calendar Events

| Event | Type | Description |
| -------- | ---- | ----------- |
| onopen? | () => void | Called when modal opens. |
| onclose? | () => void | Called when modal closes. |
| onupdate? | (instance.value) => void | Called when value updates. |
| onchange? | (instance.value) => void | Called when some state inside the component changes. |

## License

The [LemonadeJS](https://lemonadejs.net) Calendar is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet](https://jspreadsheet.com)
