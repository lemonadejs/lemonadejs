title: LemonadeJS Onchange
keywords: LemonadeJS, onchange event, JavaScript library, frontend development, reactive programming, component lifecycle, property tracking, DOM events, custom components
description: The onchange event is a powerful tool for tracking changes in component properties and attaching additional reactions in LemonadeJS.
canonical: https://lemonadejs.com/docs/onchange

# Onchange

The `onchange`{.highlight} event triggers whenever a **reactive property** of the component object `this` changes. Reactive properties are those bound to the template and directly affect the UI. Note that `state variables` have their dedicated callback and do not invoke the onchange event.

## Examples

### Reactive Properties

Reactive properties are those defined on `this` object and referenced in the template. Changes to these properties automatically invoke the `onchange` event.

#### Triggering Onchange

In the example below, the name property is reactive because it is referenced in the template.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Track any changes on properties used in the template
    this.onchange = (prop) => {
        console.log('The new value of', prop, ' is: ', this[prop]);
    }
    // Default name
    this.name = 'Paul';
    // Update name
    const update = () => {
        this.name = 'Jorge';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <p>Hello ${this.name}</p>
        <input type="button" value="Update" onclick=${update} />
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Component() {
    // Track any changes on properties used in the template
    this.onchange = (prop) => {
        console.log('The new value of', prop, ' is: ', this[prop]);
    }
    // Default name
    this.name = 'Paul';
    // Update name
    const update = () => {
        this.name = 'Jorge';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <p>Hello ${this.name}</p>
        <input type="button" value="Update" onclick=${update} />
    </div>`;
}
```

#### Not Triggering Onchange

If a property is not used in the template, its changes will not invoke the onchange event.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    // Track any changes on properties used in the template
    this.onchange = (prop) => {
        console.log('The new value of', prop, ' is: ', this[prop]);
    }
    // Default name
    this.name = 'Paul';
    // Update name
    const update = () => {
        this.name = 'Jorge';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <p>Hello World</p>
        <input type="button" value="Update" onclick=${update} />
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Component() {
    // Track any changes on properties used in the template
    this.onchange = (prop) => {
        console.log('The new value of', prop, ' is: ', this[prop]);
    }
    // Default name
    this.name = 'Paul';
    // Update name
    const update = () => {
        this.name = 'Jorge';
    }
    // Call the ready method when the DOM element is ready and appended to the DOM
    return render => render`<div>
        <p>Hello World</p>
        <input type="button" value="Update" onclick=${update} />
    </div>`;
}
```

#### Forcing Property Tracking

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

### Scope

The `onchange event` can be defined as bound directly to the component or registered as a hook.


#### Bind to the Component Self

Define onchange directly on the component instance `this`, making it accessible throughout the component.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Component() {
    this.onchange = function() {
        // Triggered when any property used in the template changes
    }
    return render => render`<div>
        <b>Hello ${this.name}</b>
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
function Test() {
    this.onchange = function() {
        // Triggered when any property used in the template changes
    }
    return render => render`<div>
        <b>Hello ${this.name}</b>
    </div>`;
}
```

#### Register The Event Privately

Registering onchange privately encapsulates its logic within the component, ensuring it is not accessible externally.

```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onchange } = lemonade;

function Component() {
    onchange(() => {
        // Triggered when any property used in the template changes
    })
    return render => render`<div>
        <b>Hello ${this.name}</b>
    </div>`;
}
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { onchange } from 'lemonadejs';

function Component() {
    onchange(() => {
        // Triggered when any property used in the template changes
    })
    return render => render`<div>
        <b>Hello ${this.name}</b>
    </div>`;
}
```



## What's Next?

Another key feature for managing reactivity within components is the state feature.

[Learn More About States](/docs/state){.button}
