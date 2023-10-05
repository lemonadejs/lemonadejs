# LemonadeJS Tabs

[Official website and documentation is here](https://lemonadejs.net/components/tabs)

Compatible with Vanilla JavaScript, LemonadeJS, React, Vue or Angular.

The LemonadeJS JavaScript Tabs is a responsive and reactive component that creates selected tabs.

## Features

-   Lightweight: The JavaScript Tabs is only about 2 KBytes;
-   Integration: It can be used as a standalone library or integrated with any modern framework;

## Getting Started

You can install using NPM or using directly from a CDN.

### npm Installation

To install it in your project using npm, run the following command:

```bash
$ npm install @lemonadejs/tabs
```

### CDN

To use tabs via a CDN, include the following script tags in your HTML file:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/tabs/dist/style.min.css" />
```

### Usage

Quick example with Lemonade

```javascript
import Tabs from "@lemonadejs/tabs";
import "@lemonadejs/tabs/dist/style.css"

export default function Component() {
    const self = this;

    self.open = (index) => {
        console.log(index)
    }
    
    return `<Tabs :onopen="self.open">
        <div title="Tab 1">Content of the first tab</div>
        <div title="Tab 2">Content of the second tab</div>
    </Tabs>`;
}
```

[You can find more examples here in the official documentation.](https://lemonadejs.net/components/tabs)

### Configuration

You can configure things such as tabs titles, tabs contents and selected tab.

#### Tabs Properties

| Property  | Type     | Description                                                                                                          |
|-----------|----------|----------------------------------------------------------------------------------------------------------------------|
| data?     | array    | An optional alternative method to provide the title and content that will serve as the basis for rendering the tabs. |
| selected? | number   | The index of the initially selected tab. Starts from 0.                                                              |
| position? | string   | The position of the tabs bar within the parent element. Use 'center' to center-align the tabs.                       |
| onopen?   | function | When a new tabs is opened.                                                                                           |

## License

The [LemonadeJS](https://lemonadejs.net) Tabs is released under the MIT.

## Other Tools

-   [jSuites](https://jsuites.net/v4/)
-   [Jspreadsheet Data Grid](https://jspreadsheet.com)
