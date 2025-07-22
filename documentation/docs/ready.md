title: LemonadeJS Ready Attribute
keywords: LemonadeJS, ready attribute, JavaScript library, reactive programming, DOM initialization, frontend development, dynamic UI
description: Learn how to use the ready attribute in LemonadeJS to trigger functions when DOM elements are fully initialized and appended to the DOM, enabling dynamic modifications and interactions.
canonical: https://lemonadejs.com/docs/ready

# Ready

## Overview

The `ready`{.highlight} special attribute in Lemonade allows you to bind a function to a DOM element. This function will be triggered when the element is fully initialized and appended to the DOM.

Here is an example of using the ready attribute to modify a DOM element after it has been rendered:

### Examples

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    const ready = (element) => {
        element.textContent = 'Hello World';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b :ready="${ready}"></b>
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Component() {
    const ready = (element) => {
        element.textContent = 'Hello World';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <b :ready="${ready}"></b>
    </div>`;
}
```

### Related Content

For executing code after the entire template is rendered and appended to the DOM, consider using the global onload event. [More about the onload event](/docs/onload)

## What's Next?

Learn more about LemonadeJS's two-way data binding in the next section.

[Two way data binding](/docs/two-way-data-binding)



