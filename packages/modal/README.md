# Javascript Modal

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

To use data grid via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
```

### Configuration

Quick example

```javascript
import Signature from "@lemonadejs/modal";

export default function Component() {
    const self = this;
    self.width = 400;
    self.height = 200;

    return `<Modal width="{{self.width}}" height="{{self.height}}" title="My windowmodal">
        <h1>Teste</h1>
    </Modal>`;
}
```

## License

The LemonadeJS Modal is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet](https://jspreadsheet.com)
