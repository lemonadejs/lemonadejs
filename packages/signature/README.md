# Javascript Signature Pad

[Official website and documentation is here](https://lemonadejs.net/library/signature)

Compatible with Vanilla JavaScript, LemonadeJS, React, Vue or Angular.

The LemonadeJS JavaScript Signature Pad is a versatile and responsive component that simplifies signature capture in web applications. It is compatible with Vanilla JavaScript, React, Vue, and Angular frameworks, allowing users to capture signatures using either mouse or touch input. With convenient methods for loading and retrieving signatures, developers can easily create solutions that empower users to sign documents and securely store their signatures.

## Features

-   Lightweight: The lemonade signature pad is only about 2 KBytes;
-   Reactive: Any changes to the underlying data are automatically applied to the HTML, making it easy to keep your grid up-to-date;
-   Integration: It can be used as a standalone library or integrated with any modern framework;

## Getting Started

You can install using NPM or using directly from a CDN.

### npm Installation

To install it in your project using npm, run the following command:

```bash
$ npm install @lemonadejs/signature
```

### CDN

To use data grid via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/signature/dist/index.min.js"></script>
```

### Configuration

Quick example

```javascript
import Signature from "@lemonadejs/signature";

export default function Component() {
    const self = this;
    self.width = 400;
    self.height = 200;
    self.value = [];

    return `<Signature
        value="{{self.value}}"
        width="{{self.width}}"
        height="{{self.height}}"
        instructions="Please sign this document" />`;
}
```

## License

The LemonadeJS signature pad is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet](https://jspreadsheet.com)
