title: LemonadeJS Router
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, router, router controller, plugins
description: Unveil how to leverage LemonadeJS Router for controlling which component is rendered based on routing.

LemonadeJS Router
======

Pico Library This library has less than 2 KBytes  
  
The LemonadeJS router plugin is part of the official libraries and is distributed under the MIT. This controls which component is rendered and append to the page based on the route. This library is part of the PICO Library, which is a very smart and optimized library that does not require any external dependencies.  
  

Documentation
-------------

  

### Installation

```bash
npm install @lemonadejs/router
```
  

### Attributes

| Attribute | Description |
|  --- | --- |
| **Router component** |
| animation?: Boolean | Enable the page change animation. |
| **Route element** |
| path: String | Route to execute this page. This should be a regular expression string. |
| controller: Component | Component name. |
| url?: String | URL to load a remote template. |
| preload?: Boolean | URL to load a remote template. |

### Events

| Event | Description |
| --- | --- |
| **Router component** |     |
| onchange?: function | Execute the page changes.  <br>`onchange(newPage: Object, oldPage: Object) => void;` |
| **Route element** |     |
| onenter?: function | When enters in the page  <br>`onenter(page: Object) => void;` |



Router SPA example
------------------

The router loads the page content from a remote HTML file in the following example.  

<div style="width: 428px; height: 889px; overflow: hidden; transform-origin: 0px 0px 0px; zoom:0.75;">
    <div style="position: relative; top: 0px; left: 0px; width: 428px; height: 889px; background: none; transform-origin: 0px 0px 0px; transform: scale(1);">
        <img src="img/iphone6_front.png" style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;" alt="LemonadeJS router example"/>
        <iframe src="/tests/home" class="bio-mp-screen" style="position: absolute; top: 109px; left: 26.5px; width: 375px; height: 669px; border: 0px;"></iframe>
    </div>
</div>

```xml
<html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans|Roboto|Material+Icons" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsuites/dist/jsuites.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jsuites/css/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/navbar/dist/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/toolbar/dist/style.css" type="text/css" />

<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/router/dist/index.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/toolbar/dist/index.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@lemonadejs/navbar/dist/index.min.js"></script>

<div id='root'></div>
<script>
function List () {
    // Create one self for each interaction in the array
    const self = this;
    // Template
    return `<div class="form-group option" style="padding: 8px">
        <div class="option-image">
            <div class="option-badge solid"></div>
            <img src="/templates/default/img/nouser.png" />
        </div>
        <div class="option-header">
            <div class="option-name">{{self.name}}</div>
            <div class="option-small">{{self.message}}</div>
        </div>
        <div class="option-date prettydate">1 mon ago</div>
    </div>`;
}

function Home() {
    const self = this;

    self.onenter = function() {
        console.log('Enter');
    };

    self.data = [
        { name: 'Alexander Foster', message: 'Lorem Ipsum é...' },
        { name: 'Alfie Chapman', message: 'Lorem Ipsum é ...' },
        { name: 'Fabian Byrne', message: 'Lorem Ipsum é...' }
    ];

    return `<>
        <Navbar>
            <Icon href="/tests/home" icon="menu" />
            <Text title="Inbox"/>
            <Icon />
        </Navbar>
        <div class="block-title">Messages</div>
        <div class='section-container'>
            <div class="options"><List :loop="self.data" /></div>
        </div>
    </>`;
}

function App() {
    const self = this;

    self.test = function() {
        console.log(arguments)
    };

    return `<>
        <Router animation="true" onchange="{{self.test}}">
            <Route path="/tests/home" controller="Home" />
            <Route path="/tests/compose" url="/tests/compose/1" />
            <Route path="/tests/profile" url="/tests/profile/1" />
        </Router>
        <Toolbar>
            <Icon content="inbox" title="Inbox" route="/tests/home" />
            <Icon content="create" title="New message" route="/tests/compose" />
            <Icon content="person" title="Profile" route="/tests/profile" />
        </Toolbar>
    </>`;
}

// Set the components
lemonade.setComponents({ Router, Toolbar, Home, Navbar, List });
// Render
lemonade.render(App, document.getElementById('root'));
</script>
</html>
```