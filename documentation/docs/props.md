title: Using Component Props in LemonadeJS
keywords: LemonadeJS, component props, reactive components, JavaScript library, frontend development, reusable UI, hooks, dynamic UI
description: Discover how to pass arguments to components in LemonadeJS and utilize props for building dynamic and reusable user interfaces.
canonical: https://lemonadejs.com/docs/props

# Props

Props, short for properties, are inputs passed to a component, similar to attributes passed to DOM elements.

## Reading the Inputs

All attributes declared in the component tag are automatically bound to the `this`{.highlight} object context as follows.

### Component

{.ignore}
```javascript
function Hello() {
    return render => render`<div>${this.year}</div>`;
}
```

#### Component Usage

{.ignore}
```html
<Hello year="2025" />
```


### Property Parsing

LemonadeJS supports parsing template string content into proper JavaScript types and references using the `lm-` or `:` prefix for props. This approach directly binds JavaScript values, such as functions or objects, without relying on string interpolation. Below is an example:

{.ignore}
```javascript
function Component() {
    this.test = () => {}

    return render => render`<div>
        // Parses the string into a function reference
        <Hello :test="this.test" />
        // Assign the function reference to the component property
        <Hello test="${this.test}" />
    </div>`;
}
```

### Dynamic Props

It is possible to bind a component prop a property for its parent, which will trigger automatically updates inside the children when the property in the parent changes as follow.

{.ignore}
```javascript
function Component() {
    // Year
    this.value = 2025;
    const update = () => {
        // Trigger changes in the attribute year for the component Hello
        this.value++;
    }
    // title and year will be available inside Hello through (this)
    return render => render`<div>
        <Hello year="${this.value}" />
        <input type="button" value="Next" onclick="${update}" />
    </div>`;
}
```

## Tracking Property Changes

LemonadeJS automatically tracks properties used in the template literal, enabling the reactivity system to update the DOM seamlessly when these properties change. Additionally, the onchange hook allows developers to monitor these updates and execute custom logic in response to property changes.

### Forcing Property Tracking

To monitor changes for properties not bound to the template, the track hook can be used to explicitly enable tracking. This ensures onchange is triggered even for properties that don’t directly affect the DOM.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
const { onchange, track } = lemonade;
function Test() {
    // Default value
    this.status = true;
    // Status is not used in the template, but force tracking
    track('status');
    // Monitor changes on properties
    onchange((prop, newValue, oldValue) => {
        console.log(`${prop} has changed`, newValue, oldValue)
    });
    // Update a property
    const update = () => {
        this.status = !this.status;
    }
    return render => render`<div>
        <input type="button" value="Update" onclick="${update}"/>
    </div>`
}
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { onchange, track } from 'lemonadejs';

function Component() {
    // Default value
    this.status = true;
    // Status is not used in the template, but force tracking
    track('status');
    // Monitor changes on properties
    onchange((prop, newValue, oldValue) => {
        console.log(`${prop} has changed`, newValue, oldValue)
    });
    // Update a property
    const update = () => {
        this.status = !this.status;
    }
    return render => render`<div>
        <input type="button" value="Update" onclick="${update}"/>
    </div>`
}
```

[Learn more about the onchange](/docs/onchange).

## What's Next?

In the next section, you'll explore how LemonadeJS handles JavaScript events, including its native `onchange` and `onload` events.

[Learn More About the Events](/docs/events){.button}
