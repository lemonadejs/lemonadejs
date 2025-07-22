title: LemonadeJS OnLoad
keywords: LemonadeJS, onload event, JavaScript library, frontend development, reactive programming, component lifecycle, DOM events, custom components
description: As part of the component lifecycle, the onload event in LemonadeJS enables additional features to be triggered when a component is fully loaded and appended to the DOM.
canonical: https://lemonadejs.com/docs/onload

# Onload

The `onload`{.highlight} event triggers when a component is fully rendered, allowing developers to set up listeners, trigger animations, or perform initialization tasks.

## Example

The following examples demonstrate two ways to use the `onload event`. The first example keeps the method private to the component, while the second binds the method to the component object.


### Bind to the Component Self

Bind onload directly to the component instance.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    this.onload = function() {
        console.log('The component is ready');
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b>Hello World</b>
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
function Test() {
    this.onload = function() {
        console.log('The component is ready');
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b>Hello World</b>
    </div>`;
}
```

### Create as a Hook

Register onload as a hook, keeping the method private within the component.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onload } = lemonade;

function Component() {
    onload(() => {
        console.log('The component is ready');
    })
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b>Hello World</b>
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { onload } from 'lemonadejs';

function Component() {
    onload(() => {
        console.log('The component is ready');
    })
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b>Hello World</b>
    </div>`;
}
```

## Related content

The LemonadeJS special property ready allows you to attach a function to specific DOM elements when they are initialized and appended to the DOM. For more details, please visit the [Ready Documentation](/docs/ready).

## What's Next?

Next, you'll learn more about the onchange event and how it works in LemonadeJS.

[Learn More About the Onchange](/docs/onchange){.button}



