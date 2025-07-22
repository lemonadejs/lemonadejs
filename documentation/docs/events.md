title: LemonadeJS Events
keywords: LemonadeJS, events, JavaScript library, two-way binding, frontend development, reactive programming, custom components, JavaScript events, interactions
description: Learn LemonadeJS events to create dynamic and responsive interactions in your components, enhancing user experiences and frontend workflows.
canonical: https://lemonadejs.com/docs/events

# Events

This section explains how to handle native JavaScript events within component templates and the two core component events provided by LemonadeJS.

## JavaScript Events
 
### The Event Object

When declaring a JavaScript event to a DOM element, you will have the event object and component scope object, which can help with extra logic and event reuse.
  
### A Simple Onclick Event

A basic onclick event example to log the objects on the console.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const test = (e, s) => {
        // Onclick Event Object
        console.log(e);
        // Will be same as `this`
        console.log(s);
        e.preventDefault();
    }
    return render => render`<input type="button" value="Click here" onclick="${test}"/>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const test = (e, s) => {
        // Onclick Event Object
        console.log(e);
        // Will be same as `this`
        console.log(s);
        e.preventDefault();
    }
    return render => render`<input type="button" value="Click here" onclick="${test}"/>`;
}
```

### A Event With Loop

When an event is used in a template within a loop, the s parameter represents the scope of each loop entry, enabling dynamic interactions with individual items of the array.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    this.coin = 'Click in a coin';
    
    this.options = [
        { title: 'Bitcoin' },
        { title: 'Ethereum' },
        { title: 'Litecoin' },
    ];
    
    const test = (e, s) => {
        // Update the component property
        this.coin = s.title;
    }
    return render => render`<div>
        <p>${this.coin}</p>
        <ul :loop="${this.options}">
            <li onclick="${test}">{{this.title}}</ul>
        </ul>
    </div>`;
}
// Render the LemonadeJS element into the DOM
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    this.coin = 'Click in a coin';

    this.options = [
        { title: 'Bitcoin' },
        { title: 'Ethereum' },
        { title: 'Litecoin' },
    ];

    const test = (e, s) => {
        // Update the component property
        this.coin = s.title;
    }
    return render => render`<div>
        <p>${this.coin}</p>
        <ul :loop="${this.options}">
            <li onclick="${test}">{{this.title}}</ul>
        </ul>
    </div>`;
}
```


## Core Events

LemonadeJS provides two core events: `onload`{.highlight} and `onchange`{.highlight}. The `onload` event fires when a component is mounted to the DOM, while `onchange` is triggered when reactive properties are updated.

| Event                  | Description                                                                                                                                |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `onload`{.highlight}   | Fires after component DOM mounting. Used for initialization.<br>`self.onload(component: DOMElement) => void`                               |
| `onchange`{.highlight} | Fires when reactive properties update. Handles property changes.<br>`self.onchange(property: string, affectedElements: object) => void`    |

### Private Declaration

Events can be registered privately within the component as example below.

{.ignore}
```javascript
import { onload } from 'lemonadejs';

export default function Component() {
    
    onload((element) => {
        console.log(element, 'is ready');
    })
    
    return render => render`<h1>Hello</h1>`;
}
```

### Component Property Events

Alternatively, events can be registered directly on the component's `this` context, allowing parent components to access them. In contrast, private events remain fully encapsulated within the component, ensuring they are not externally accessible.

{.ignore}
```javascript
export default function Component() {
    
    this.onload((element) => {
        console.log(element, 'is ready');
    })

    return render => render`<h1>Hello</h1>`;
}
```

## What's Next?

To learn more about the core events, explore the dedicated sections below:

- [Onload Event](/docs/onload)
- [Onchange Event](/docs/onchange)

