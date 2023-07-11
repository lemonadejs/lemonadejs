# LemonadeJS Modal

[Official website and documentation is here](https://lemonadejs.net/components/modal)

Compatible with Vanilla JavaScript, LemonadeJS, React, Vue or Angular.

The LemonadeJS JavaScript Modal is a responsive and reactive component that creates floating modals. With its flexible settings, users can easily configure draggability, closability, and resizability according to their needs.

## Features

-   Lightweight: The JavaScript Modal is only about 4 KBytes;
-   Reactive: Any changes to the underlying data are automatically applied to the HTML, making it easy to keep your grid up-to-date;
-   Integration: It can be used as a standalone library or integrated with any modern framework;

## Getting Started

You can install using NPM or using directly from a CDN.

### npm Installation

To install it in your project using npm, run the following command:

```bash
$ npm install @lemonadejs/modal
```

### CDN

To use modal via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
```

### Usage

Declarative - Quick example with Lemonade

```javascript
import Modal from "@lemonadejs/modal";
import "@lemonadejs/modal/dist/style.css"

export default function Component() {
    const self = this;
    self.width = 400;
    self.height = 200;

    return `<Modal width="{{self.width}}" height="{{self.height}}" title="My window modal">
        <h1>Quick example!</h1>
    </Modal>`;
}
```

Programmatical - Quick example with Javascript 

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root">
    <h1>Quick example!</h1>
</div>

<script>
// Get root element to be the modal target
const root = document.getElementById("root")

// Call modal with the target and the options object
Modal(root, {
    width: 400,
    height: 200,
    title: "My window modal",
})
</script>
```

### Configuration

You can configure things such as position, size, and functionalities.

#### Modal Properties

| Property | Type | Description |
| -------- | ---- | ----------- |
| title? | string | The header title of the modal |
| height? | number | The height of the modal in pixels |
| width? | number | The width of the modal in pixels |
| top? | number | The vertical position of the modal within its container in pixels |
| left? | number | The horizontal position of the modal within its container in pixels |
| draggable? | boolean | Determines if the modal can be dragged |
| resizable? | boolean | Determines if the modal can be resized |
| closed? | boolean | Controls the open and close state of the modal |
| closable? | boolean | Disables the ability to close the modal |
| center? | boolean | Enables rendering the modal in the center of its parent container |
| url? | string | The URL from which to fetch and render content |

#### Modal Events

| Event | Trigger |
| ----- | ------- |
| onclose | Called when modal closes |
| onopen | Called when modal opens |

## License

The LemonadeJS Modal is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet](https://jspreadsheet.com)
