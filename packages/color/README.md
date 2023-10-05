# LemonadeJS Color Picker

[Official website and documentation is here](https://lemonadejs.net/components/color-picker)

Compatible with Vanilla JavaScript, LemonadeJS, React, Vue or Angular.

The LemonadeJS JavaScript Color Picker is a responsive and reactive component that simplifies color selection. It features two sections: a personalized palette and a pre-defined gradient of colors. With a customizable button, this component seamlessly integrates into your application, allowing users to pick colors effortlessly.

## Features

-   Lightweight: The JavaScript Tabs is only about 2 KBytes;
-   Integration: It can be used as a standalone library or integrated with any modern framework;

## Getting Started

You can install using NPM or using directly from a CDN.

### npm Installation

To install it in your project using npm, run the following command:

```bash
$ npm install @lemonadejs/color
```

### CDN

To use color picker via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/color/dist/style.min.css" />
```

### Usage

Quick example with Lemonade

```javascript
import Color from "@lemonadejs/color";
import "@lemonadejs/color/dist/style.css"

export default function App() {
    const self = this;

    return `<Color type="input"/>`;
}
```

### Configuration

You can configure things such as color palette, toggle button type, and event management.

#### Color Picker Properties

| Property | Type | Description                                                                                       |
| -------- | ---- |---------------------------------------------------------------------------------------------------|
| palette? | array | A matrix containing hexadecimal color values. There is a default palette.                         |
| closed? | boolean | Controls the open and close state of the modal.                                                   |
| type? | string | The type of element that will toggle the color picker modal. Options: 'input', 'inline' or empty. |
| value? | string | The value of the color that is currently selected.                                                |

### Color Picker Events

| Event | Type | Description |
| -------- | ---- | ----------- |
| onopen? | () => void | Called when modal opens. |
| onclose? | () => void | Called when modal closes. |
| onupdate? | (instance.value) => void | Called when value updates. |

## License

The [LemonadeJS](https://lemonadejs.net) Color is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet Data Grid](https://jspreadsheet.com)
