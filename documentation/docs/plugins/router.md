title: JavaScript Router - LemonadeJS
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, router, router controller, plugins
description: LemonadeJS Router is a JavaScript plugin to create rules on component rendering based on the defined routes.
canonical: https://lemonadejs.com/docs/plugins/router

# JavaScript Router

`Pico Library`{.jtag .black .framework-images}

{.small}
This library has less than 2 KBytes

The LemonadeJS Router, an MIT-licensed JavaScript plugin within the lightweight Pico Library (under 2 KBytes), facilitates content rendering based on routes. It smartly intercepts link clicks to display components according to set-up, all without extra dependencies.


## Documentation

### Installation

```bash
npm install @lemonadejs/router
```
 

### Attributes

#### Router settings

| Attribute               | Description                       |
|-------------------------|-----------------------------------|
| `animation?: Boolean`   | Enable the page change animation. |
| `single?: Boolean`      | Single page on the DOM            |

#### Page settings

| Attribute               | Description                                                             |
|-------------------------|-------------------------------------------------------------------------|
| `path: String`          | Route to execute this page. This should be a regular expression string. |
| `controller: Component` | Component name.                                                         |
| `url?: String`          | URL to load a remote template.                                          |
| `preload?: Boolean`     | URL to load a remote template.                                          |


### Events

#### Router events

| Event                           | Description                                                                                                |
|---------------------------------|------------------------------------------------------------------------------------------------------------|
| `onchangepage?: function`       | When the page changes.  <br>`onchangepage(newPage: Object, oldPage: Object, isNewPage: Boolean) => void;`  |
| `onbeforechangepage?: Function` | Called before the page is changed.<br>`onbeforechangepage(path: String, page: Object) => object \| boolean` |
| `onbeforecreatepage?: Function` | Before the page is created.<br>`onbeforecreatepage(page: Object, html: String) => boolean \| void`         |

#### Page events

| Event                | Description                                                                           |
|----------------------|---------------------------------------------------------------------------------------|
| `onenter?: function` | When enters in the page.<br>`onenter(newPage: Object, previousPage: Object) => void;` |
| `onleave?: Function` | When leaves a page.<br>`onleave(currentPage: Object, newPage: Object) => void;`       |                                     


## Examples

### Router SPA example

The router loads the page content from a remote HTML file in the following example.  

<div style="width: 428px; height: 889px; overflow: hidden; transform-origin: 0px 0px 0px; zoom:0.75;">
    <div style="position: relative; top: 0px; left: 0px; width: 428px; height: 889px; background: none; transform-origin: 0px 0px 0px; transform: scale(1);">
        <img src="img/iphone6_front.png" style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;" alt="LemonadeJS router example"/>
        <iframe src="/tests/home" class="bio-mp-screen" style="position: absolute; top: 109px; left: 26.5px; width: 375px; height: 669px; border: 0px;"></iframe>
    </div>
</div>

{.ignore-execution}
```html
<meta name='viewport' id="viewport" content='width=device-width,initial-scale=1,user-scalable=no' />
<meta name='format-detection' content = "telephone=no" />

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/router/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/studio/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/toolbar/dist/style.min.css" type="text/css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans|Roboto|Material+Icons" type="text/css" />

<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/router/dist/index.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/studio/dist/index.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/toolbar/dist/index.min.js"></script>

<div id='root'></div>

<script>
function Home() {

    this.onenter = function() {
        console.log('Enter home');
    }

    this.onleave = function() {
        console.log('Leave home');
    }

    return render => render`<div>
        <h1>Home</h1>
        <p>This is home...</p>
    </div>`;
}

function Message () {
    return render => render`<div>
        <h1>New message</h1>
        <p>Second page...</p>
    </div>`;
}

function Profile () {
    return render => render`<div>
        <h1>Profile</h1>
        <p>Profile page</p>
    </div>`;
}

function App() {

    const beforeChange = function() {
        console.log(arguments)
    }

    return render => render`<>
        <Router animation="${true}" onchangepage="${beforeChange}">
            <Route path="/tests/home" controller="${Home}" />
            <Route path="/tests/compose" controller="${Message}" />
            <Route path="/tests/profile" controller="${Profile}" />
        </Router>
        <Toolbar>
            <a data-icon="inbox" title="Inbox" href="/tests/home" />
            <a data-icon="create" title="New message" href="/tests/compose" />
            <a data-icon="person" title="Profile" href="/tests/profile" />
        </Toolbar>
    </>`;
}

// Render
lemonade.render(App, document.getElementById('root'));
</script>
```
```javascript
import Message from './Message';
import Profile from './Profile';
import Home from './Home';

export default function App() {

    const beforeChange = function() {
        console.log(arguments)
    }

    return render => render`<>
        <Router animation="${true}" onchangepage="${beforeChange}">
            <Route path="/tests/home" controller="${Home}" />
            <Route path="/tests/compose" controller="${Message}" />
            <Route path="/tests/profile" controller="${Profile}" />
        </Router>
        <Toolbar>
            <a data-icon="inbox" title="Inbox" href="/tests/home" />
            <a data-icon="create" title="New message" href="/tests/compose" />
            <a data-icon="person" title="Profile" href="/tests/profile" />
        </Toolbar>
    </>`;
}
```

### More Examples

- [JavaScript Router Example on Stackblitz](https://stackblitz.com/edit/vitejs-vite-xquqod)
