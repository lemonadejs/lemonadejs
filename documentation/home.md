title: Agnostic Micro Reactive JavaScript Library
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react
description: LemonadeJS is a lightweight vanilla javascript reactive micro library (7Kb) that helps the integration between the JavaScript and the HTML.
canonical: https://lemonadejs.com

<div class="home">

<div class="row">
    <div class="column f4">
        <div class="limit-85">
            <h1>Agnostic Micro Reactive JavaScript Library</h1>
            <p class="small">This library is about 5 KBytes compressed.</p>
            <p>LemonadeJS is a dependency-free lightweight library featuring an abstract reactive layer and two-way data binding. It enables the creation of modern platform-agnostic components using pure JavaScript, JSX, or TypeScript.</p>
            <br>
			<button type="button" class="button main"><a href="/docs/getting-started">Get Started</a></button>
        </div>
    </div><div class="column f3 p20">
        <div style="aspect-ratio: 16/9;">
            <!-- set a 640:360 i.e a 16:9 aspect ratio -->
            <video src="media/intro.webm" width="640" height="360" style="width: 100%; height: auto;" autoplay muted loop playsinline></video>
        </div>
    </div>
</div>

<div class="space50"></div>

<div class="stats">
    <div class="stats-item">
        <img src="img/home/npm-logo.svg" alt="NPM Logo" style="height: 22px;">
        <div>
            <b>1k +</b>
            <p>Weekly downloads</p>
        </div>
    </div>
    <div class="stats-item">
        <img src="img/home/github-logo.svg" alt="GitHub Logo" style="height: 36px;">
        <div>
            <b>400+</b>
            <p>GitHub stars</p>
        </div>
    </div>
    <div class="stats-item">
        <img src="img/home/license-icon.svg" alt="MIT License Icon" style="height: 36px;">
        <div>
            <b>MIT License</b>
            <p>Free and open-source</p>
        </div>
    </div>
</div>

<div class="space100 line" style="height: 100px"></div>

<div class="row">
	<div class="column f1 p20">
        <div style="aspect-ratio: 16/9;">
            <!-- set a 640:360 i.e a 16:9 aspect ratio -->
            <img src='img/home/lemon-car.webp' width="640" height="340" style="width: 100%; height: auto;" alt="LemonadeJS reactive library">
        </div>
	</div>
    <div class="column f1">
        <div class="limit-85 p20">
            <h2>Why Use LemonadeJS?</h2>
            <p>LemonadeJS ensures efficiency, speed, and clarity in your code. It facilitates distribution, standardizes reactivity, and empowers you with full control over your development process. The library is dependency-free, allowing you to decide if you want to use transpiling or external dependencies.</p>
        </div>
    </div>
</div>

<div class="space200 line" style="height: 200px"></div>

<div class="container center p20" style="max-width: 840px;">
    <h2>Freedom to Develop Your Way</h2>
    <p>Whether you prefer the simplicity of JavaScript Browser, the robust type-checking of TypeScript, or the modern syntax of JSX, LemonadeJS supports it all. Designed to adapt to your workflow, the library ensures flexibility without sacrificing performance or compatibility.</p>
    <div>
        <img src="img/home/js.png" style="height: 60px; padding: 10px;" alt="JavaScript Logo" >
        <img src="img/home/ts.png" style="height: 60px; padding: 10px;" alt="TypeScript Logo">
        <img src="img/home/jsx.png" style="height: 60px; padding: 10px;" alt="JSX Logo">
    </div>
</div>

<div class="space200 line" style="height: 200px"></div>

<div class="box shadow" data-number="3">
    <div>
        <img src="img/home/lightweight.svg" style="height: 44px; width: 44px;" alt="Lightweight Library">
        <b>Lightweight</b>
        <p>A robust JavaScript library in a compressed package of just 5KB.</p>
    </div>
    <div>
        <img src="img/home/agnostic.svg" style="height: 44px; width: 44px;" alt="Agnostic Library">
        <b>Agnostic</b>
        <p>Integrates with popular front-end frameworks like VUE, React, and Angular.</p>
    </div>
    <div>
        <img src="img/home/flexible.svg" style="height: 44px; width: 44px;" alt="Flexible">
        <b>Flexible</b>
        <p>Code in your browser with no dependencies or transpiling required.</p>
    </div>
</div>

<div class="space200 line" style="height: 200px"></div>

<div class="row">
<div class="column f1">
<div class="limit-85">

<h2>Sugar</h2>

Sugar is a communication system in LemonadeJS that enables components to share data and actions using a pub/sub pattern. Components subscribe to named events with set, defining global actions or state updates, and trigger updates with dispatch, ensuring seamless synchronization and reactivity across the application.

When an action is available, you can execute it anywhere in your application using the dispatch{.highlight} method.\
\
[Learn more about Sugar](/docs/sugar){.button .main}

</div>
</div>
<div class="column f1">

{.ignore}
```javascript
import { set, dispatch } from 'lemonadejs';

export default function Profile() {

    // Register this action and make it available on the global scope
    set('updateName', (s) => {
        this.name = s.name;
    });

    // Counter is created from the attribute counter
    return render => render`<form>
        <label>Name:</label><br/>
        <input type="text" :bind="${this.name}" /><br/>
    </form>`;
}
```


</div>
</div>

<div class="space200 line" style="height: 200px"></div>

<div class="container center" style="max-width: 750px;">
    <h2>Two-way Data Binding</h2>
    <p>LemonadeJS enables two-way data binding to synchronize changes between a component property and its corresponding HTML element value seamlessly.</p>
</div>

<br>

<div class="box shadow" data-number="3">
    <div>
        <img src="img/home/bind.svg" style="height: 44px; width: 44px;" alt="Two-way-data binding with inputs">
        <b>Data Binding On Input Text</b>
        <p>The :bind creates a transparent event to keep the self property in sync with the value of the input text.</p>
    </div>
    <div>
        <img src="img/home/checkboxes.svg" style="height: 44px; width: 44px;" alt="Two-way-data binding with checkboxes">
        <b>Checkboxes</b>
        <p>The checkbox works similarly to the example above. The state of the checkbox and the value of the {self}property is bound.</p>
    </div>
    <div>
        <img src="img/home/radio.svg" style="height: 44px; width: 44px;" alt="Two-way-data binding with radio">
        <b>Radio</b>
        <p>On a radio HTML element, the self attribute should be the same so that self property holds the exact value of the radio.</p>
    </div>
</div>

<div class="space200 line big-screen-only" style="height: 200px"></div>

<div class="row big-screen-only">
    <div class="column f4">
        <h2>Components</h2>
        <p>A component provides a powerful solution for crafting reusable functionalities. This section outlines the essential considerations for developing your custom components within LemonadeJS.</p>
        <div class="example-select-framework">
            <img src='/templates/default/img/javascript.png' onclick="setFramework('html')" alt="JavaScript Vanilla"/>
            <img src='/templates/default/img/react.png' onclick="setFramework('jsx')" alt="React"/>
            <img src='/templates/default/img/icon.svg' onclick="setFramework('javascript')" alt="LemonadeJS"/>
            <img src='/templates/default/img/vuejs.png' onclick="setFramework('vue')" alt="VueJS"/>
        </div>
        <br>
        <div>
            <div class="example-selectable-card selected" id="first-example" onclick="showText('data-grid', this)">
                <b>JavaScript Data Grid</b>
                <p>A solution for rendering data in rows and columns. It offers features like search, filter, pagination, and in-cell editing, making it ideal for building complex interfaces.</p>
            </div>
            <div class="example-selectable-card" onclick="showText('modal', this)">
                <b>JavaScript Modal</b>
                <p>create dynamic floating modals. It offers flexible configuration options, allowing extended features such as draggability, closability, and resizability to meet specific user requirements.</p>
            </div>
            <div class="example-selectable-card" onclick="showText('calendar', this)">
                <b>JavaScript Calendar</b>
                <p>Create a user-friendly date picker. Utilize event handling to integrate seamlessly with your application’s functionality.</p>
            </div>
            <div class="example-selectable-card" onclick="showText('dropdown', this)">
                <b>JavaScript Dropdown</b>
                <p>A lightweight, high-performance JavaScript plugin with a reactive design. It offers various configurable options.</p>
            </div>
        </div>
    </div>
    <div class="column f5 code-block-col">
<div id="data-grid" class="code-block active">

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />

<div id='root'></div>

<script>
const datagrid = Datagrid(document.getElementById('root'), {
    data: [
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ],
    columns: [
        { name: 'name', title: 'Product', width: '80px', align: 'left' },
        { name: 'price', title: 'Price', width: '80px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ],
    pagination: 2,
});
</script>
</html>
```
```javascript
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    this.data = [
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ]

    this.columns = [
        { name: 'name', title: 'Product', width: '200px', align: 'left' },
        { name: 'price', title: 'Price', width: '100px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ]

    return render => render`<div style="display: flex; justify-content: space-evenly">
        <Datagrid data="${this.data}" columns="${this.columns}" pagination="2" :ref="self.ref" />
    </div>`
}
```
```jsx
import React, { useRef, useState } from "react";
import Datagrid from '@lemonadejs/data-grid/dist/react';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const datagridRef = useRef();

    const [columns] = useState([
        { name: 'name', title: 'Product', width: '200px', align: 'left' },
        { name: 'price', title: 'Price', width: '100px', align: 'center' },
        { name: 'description', title: 'Description', width: '300px', align: 'left' },
    ])

    const [data] = useState([
        {
            id: 1,
            name: "T-Shirt",
            price: 19.99,
            description: "This is a high-quality cotton t-shirt in a variety of colors and sizes.",
        },
        {
            id: 2,
            name: "Jeans",
            price: 49.99,
            description: "These are premium denim jeans in a slim-fit style.",
        },
        {
            id: 3,
            name: "Sneakers",
            price: 79.99,
            description: "These are comfortable and stylish sneakers in a range of colors.",
        },
        {
            id: 4,
            name: "Backpack",
            price: 39.99,
            description: "This is a durable and spacious backpack with multiple compartments.",
        },
    ])

    return (<>
        <Datagrid
            ref={datagridRef}
            data={data}
            columns={columns}
            pagination={2}
        />
    </>);
}
```
```vue
<template>
    <div>
        <Datagrid ref="datagridRef" :data="data" :columns="columns" :pagination="2" />
    </div>
</template>
  
<script>
import Datagrid from '@lemonadejs/data-grid/dist/vue';
import '@lemonadejs/data-grid/dist/style.css';

export default {
    name: 'App',
    components: {
        Datagrid,
    },
    data() {
        const columns = [
            { name: 'name', title: 'Product', width: '200px', align: 'left' },
            { name: 'price', title: 'Price', width: '100px', align: 'center' },
            { name: 'description', title: 'Description', width: '300px', align: 'left' },
        ];

        const data = [
            {
                id: 1,
                name: 'T-Shirt',
                price: 19.99,
                description: 'This is a high-quality cotton t-shirt in a variety of colors and sizes.',
            },
            {
                id: 2,
                name: 'Jeans',
                price: 49.99,
                description: 'These are premium denim jeans in a slim-fit style.',
            },
            {
                id: 3,
                name: 'Sneakers',
                price: 79.99,
                description: 'These are comfortable and stylish sneakers in a range of colors.',
            },
            {
                id: 4,
                name: 'Backpack',
                price: 39.99,
                description: 'This is a durable and spacious backpack with multiple compartments.',
            },
        ];

        return {
            columns,
            data,
        };
    },
};
</script>
```

</div>
<div id="modal" class="code-block">

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />

<div id="root">
    <div style="padding: 10px;">
        <p>Quick example!</p>
        <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
    </div>
</div>
<input type="button" value="Toggle Modal" id="button" />

<script>
const modal = Modal(document.getElementById("root"), {
    width: 400,
    height: 200,
    title: "My window modal",
    closed: true,
    closable: true,
    draggable: true,
    position: 'center',
});
button.addEventListener('click', () => {
    modal.closed = !modal.closed;
});
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs'
import Modal from '@lemonadejs/modal';

import '@lemonadejs/modal/dist/style.css';

export default function App() {
    const toggle = () => {
        this.modal.closed = ! this.modal.closed;
    }

    return render => render`<div>
        <Modal width="400" height="200" title="My window modal" position="center"
            closable="${true}" draggable="${true}" closed="${true}" :ref="self.modal">
            <div style="padding: 10px;">
                <p>Quick example!</p>
                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
            </div>
        </Modal>
        <input type="button" value="Toggle Modal" onclick="${toggle}" />        
    </div>`
}
```
```jsx
import React, { useRef, useState } from "react";
import Modal from "@lemonadejs/modal/dist/react";
import "@lemonadejs/modal/dist/style.css";

export default function App() {
    const modalRef = useRef(null);

    const [closed, setClosed] = useState(true)

    return (<>
        <Modal ref={modalRef} width={400} height={200} title={"My window modal"} closed={closed}
            closable={true} draggable={true} position={"center"}>
            <div>
                <p>Quick example!</p>
                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
            </div>
        </Modal>
        <input type="button" value="Toggle Modal" onClick={() => setClosed(!closed)} />
    </>);
}
```
```vue
<template>
    <Modal ref="modal" :position="center" :width="400" :height="200" title="My window modal"
       :closed="true" :closable="true" :draggable="true" position="center">
        <div>
            <p>Quick example!</p>
            <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</div>
        </div>
    </Modal>
</template>
<script>
import Modal from '@lemonadejs/modal/dist/vue';

import '@lemonadejs/modal/dist/style.css'

export default {
    name: 'App',
    components: {
        Modal,
    },
    data() {
        return {
            width: 400,
            height: 200,
            title: "My window modal",
            closed: true,
            closable: true,
            draggable: true,
            position: 'center',
        };
    }
};
</script>
```

</div>
<div id="calendar" class="code-block">

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
        <input type="text" :ref="this.input" />
        <Calendar :input="this.input" range="${true}" />
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

</div>
<div id="dropdown" class="code-block">

```html
<html>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/style.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/style.min.css" />
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/dropdown/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/modal/dist/index.min.js"></script>

<div id='root'></div>

<script>
let root = document.getElementById('root');
let data = [];

for (let i = 0; i < 100000; i++) {
    data.push({
        value: i,
        text: faker.commerce.productName()
    });
}

// Initial time before creating the table
let s = Date.now();

Dropdown(root, {
    data: data,
    value: 1,
    width: 260,
    autocomplete: true,
    onload: function() {
        let e = Date.now();
        let p = document.createElement('p');
        p.textContent = 'The dropdown with 100000 items was created in: ' + (e - s) + 'ms';
        root.appendChild(p)
    },
});
</script>
</html>
```
```javascript
import Dropdown from '@lemonadejs/dropdown';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css';

export default function App() {
    let data = [];

    for (let i = 0; i < 100000; i++) {
        data.push({
            value: i,
            text: faker.commerce.productName()
        });
    }
    
    this.data = data; 

    return render => render`<div>
        <Dropdown data="${this.data}" value="${1}" />
    </div>`
}
```
```jsx
import React, { useRef } from 'react';
import Dropdown from '@lemonadejs/dropdown/dist/react';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css'
import '@lemonadejs/modal/dist/style.css'

let data = [];

for (let i = 0; i < 100000; i++) {
    data.push({
        value: i,
        text: faker.commerce.productName()
    });
}

export default function App() {
    const myRef = useRef();

    return (<div>
        <Dropdown ref={myRef} data={data} value={1} width={260} />
    </div>);
}
```
```vue
<template>
    <Dropdown :data="data" :value="1" :width="260" />
</template>

<script>
import Dropdown from '@lemonadejs/dropdown/dist/vue';
import { faker } from '@faker-js/faker';

import '@lemonadejs/dropdown/dist/style.css';
import '@lemonadejs/modal/dist/style.css';

export default {
    name: 'App',
    components: {
        Dropdown
    },
    data() {
        let data = [];
        
        for (let i = 0; i < 100000; i++) {
            data.push({
                value: i,
                text: faker.commerce.productName()
            });
        }

        return {
            data: data
        };
    },
}
</script>
```

</div>
    </div>
</div>

<div class="space200 line" style="height: 200px"></div>

<div class="container center p20" style="max-width: 650px;">
    <h1>JavaScript Components</h1>
    <p>Explore the powerful and versatile components designed to elevate your productivity. From data management to collaboration, our ecosystem seamlessly integrates to meet your needs.</p>
    <br>
</div>

<div class="box" data-number="2">
    <div>
        <a href="https://jspreadsheet.com"><img src="img/jspreadsheet-pro-logo.svg" style="height: 44px; width: 44px;" alt="Jspreadsheet Pro"></a>
        <p><b>Jspreadsheet Pro</b></p>
        <p>Enterprise JavaScript data grid component to integrate spreadsheet UI into your web-based application.</p>
    </div>
    <div>
        <a href="https://intrasheets.com"><img src="img/intrasheets-logo.svg" style="height: 44px; width: 44px;" alt="Intrasheets"></a>
        <p><b>Intrasheets</b></p>
        <p>Collaborate with ease using Intrasheets, an intuitive tool for managing spreadsheets across teams, ensuring that everyone stays on the same page.</p>
    </div>
    <div>
        <a href="https://jsuites.net"><img src="img/jsuites-logo.svg" style="height: 44px; width: 44px;" alt="Jsuites"></a>
        <p><b>Jsuites</b></p>
        <p>Comprehensive JavaScript plugins and tools for diverse web-based applications.</p>
    </div>
    <div>
        <a href="https://bossanova.uk/jspreadsheet/"><img src="img/jspreadsheet-ce-logo.svg" style="height: 44px; width: 44px;" alt="Jspreadsheet CE"></a>
        <p><b>Jspreadsheet CE</b></p>
        <p>An open-source spreadsheet component that offers essential features for developers looking for flexibility without the need for a commercial license.</p>
    </div>
    <div>
        <a href="https://bossanova.uk/openetl/"><img src="img/openetl-logo.svg" style="height: 44px; width: 44px;" alt="OpenETL"></a>
        <p><b>OpenETL</b></p>
        <p>OpenETL is a free, lightweight and stateless open-source ETL (Extract, Transform, Load) framework built in TypeScript.</p>
    </div>
</div>

<div class="space50" style="height: 50px"></div>

<div class="row middle center" style="justify-content: center;">
    <div class="column">
        <br><br>
        <h2>Subscribe to our newsletter</h2>
        <p>Tech news, tips and technical advice</p>
        <div>
            <div id="mc_embed_signup">
                <form action="https://bossanova.us20.list-manage.com/subscribe/post?u=f9b5adf8223e3d5a8f575b0bb&amp;id=37f97a936c" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
                    <div id="mc_embed_signup_scroll">
                        <div class="mc-field-group">
                            <input type="email" value="" name="EMAIL" class="required email" id="mce-EMAIL" placeholder="user@email.com"> <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class='main button'>
                        </div>
                        <div id="mce-responses" class="clear">
                            <div class="response" id="mce-error-response" style="display:none"></div>
                            <div class="response" id="mce-success-response" style="display:none"></div>
                        </div>    <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
                        <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_f9b5adf8223e3d5a8f575b0bb_37f97a936c" tabindex="-1" value=""></div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>



</div>
