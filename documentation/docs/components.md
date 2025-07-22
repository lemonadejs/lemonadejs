title: Reactive Components with LemonadeJS
keywords: LemonadeJS, reactive components, reusable UI, JavaScript library, frontend development, hooks, dynamic UI
description: Discover how to design reusable, dynamic, and reactive UI components using LemonadeJS, a lightweight JavaScript library for modern frontend development.
canonical: https://lemonadejs.com/docs/components

# Components

Components are reusable building blocks that combine logic and UI, serving as the foundation of LemonadeJS applications. This section explores the core concepts and patterns essential for creating custom components.

## Overview

Components in LemonadeJS follow an instance-based architecture, where `this`{.highlight} serves as the context for accessing component properties and methods. Each component integrates template literals for defining the UI structure with reactive state management, enabling efficient DOM updates without requiring full component re-renders.


## Component Declaration

### Global Declaration

Components can be registered globally using the `setComponents`{.highlight} method, making them accessible across all templates in your application. Component names should follow the PascalCase convention to distinguish them from native HTML elements in templates.

{.ignore}
```javascript
function Hello() {
    return render => render`<div>${this.year}</div>`;
}

// Register the custom component to be used on across your application
lemonade.setComponents({ Hello });

// Now any component can utilize the component <Hello/>
function Component() {
    // Year
    this.value = 2025;
    // Year is a prop create on the Hello scope
    return render => render`<div>
        <Hello year="${this.value}" />
    </div>`;
}
```

### Component References

Components can be passed directly as references within templates, offering a flexible alternative to global registration. This method supports localized component usage and encourages more modular and maintainable code organization.

{.ignore}
```javascript
function Hello() {
    return render => render`<div>${this.year}</div>`;
}

function Component() {
    // Year
    this.value = 2025;
    // Update
    const update = () => {
        this.value++;
    }
    // title and year will be available inside Hello through (this)
    return render => render`<div>
        <${Hello} year="${this.value}" />
        <input type="button" value="Next" onclick="${update}" />
    </div>`;
}
```

### Local Declaration

In LemonadeJS, you can declare and use components locally by utilizing `lemonade.element`. Here's an example:

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
function Test() {
    return render => render`<p>Hello ${this.type}</p>`;
}

function Form() {
    // Declare the components locally
    let template = `<Test type="World" />`;

    return lemonade.element(template, this, { Test });
}
// Render the component
lemonade.render(Form, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

// Component
function Test() {
    return render => render`<p>Hello ${this.type}</p>`;
}

export default function Form() {
    // Declare the components locally
    let template = `<Test type="World" />`;

    return lemonade.element(template, this, { Test });
}
```

### Using JSX

JSX simplifies the process of defining and utilizing components, making it more transparent and declarative. The example below demonstrates how to pass properties to a child component using JSX:

{.ignore}
```jsx
function Hello() {
    return (<div>{this.year}</div>);
}

function Component() {
    // Year
    this.value = 2025;
    // title and year will be available inside Hello through (this)
    return (
        <div>
            <Hello year={this.value} />
        </div>
    );
}
```


## Props

Props are values passed to components, enabling communication between parent and child components. In LemonadeJS, props are automatically bound to the component instance and are accessible through the `this` context.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Crypto() {
    return render => render `<div>
        When <b>${this.title}</b> reaches <b>${this.value}</b>?
    </div>`;
}

// Register custom tags
lemonade.setComponents({ Crypto });

function Component() {
    // The innerHTML of Crypto is the template for the component
    return render => render`<div>
        <Crypto title="Bitcoin" value="250000" />
    </div>`;
}
// Render the component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

function Crypto() {
    return render => render `<div>
        When <b>${this.title}</b> reaches <b>${this.value}</b>?
    </div>`;
}

// Register custom tags
lemonade.setComponents({ Crypto });

export default function Component() {
    // The innerHTML of Crypto is the template for the component
    return render => render`<div>
        <Crypto title="Bitcoin" value="250000" />
    </div>`;
}
```

### More About Props

For more detailed information about props, please visit:\
\
[Component Props](/docs/props){.button}


## Children

### Overview

LemonadeJS v5 exposes child component instances to the parent’s lifecycle hooks before DOM mounting. This pre-rendering access allows direct manipulation of child properties, implementation of conditional rendering logic, and custom initialization, all while preserving reactive bindings between parent and child components.

### Child Component Rendering

Child components are instantiated and attached to the parent’s root element during rendering, establishing the component hierarchy.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
// Template is based on the caller innerHTML
function Crypto(children) {
    // This array is available before the component is created and its children appended to the root element of the component
    console.log(children);
    // Create the component
    return render => render `<div data-title=${this.title}></div>`;
}

function Component() {
    // The innerHTML of Crypto is the template for the component
    return render => render`<div>
        <Crypto title="Bitcoin">
            <b>Coin: USD 250.000</b>
        </Crypto>
    </div>`;
}
// Register custom tags
lemonade.setComponents({ Crypto });
// Render the component
lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

// Template is based on the caller innerHTML
function Crypto(children) {
    // This array is available before the component is created and its children appended to the root element of the component
    console.log(children);
    // Create the component
    return render => render `<div data-title=${this.title}></div>`;
}

// Register custom tags
lemonade.setComponents({ Crypto });

export default function Component() {
    // The innerHTML of Crypto is the template for the component
    return render => render`<div>
        <Crypto title="Bitcoin">
            <b>Coin: USD 250.000</b>
        </Crypto>
    </div>`;
}
```

## Component Reactivity

### Reactive Properties on `this`

LemonadeJS enables reactivity for properties defined on the component’s this context when they are bound to the template literal. Changes to these properties are automatically detected and reflected in the DOM, provided they are used in dynamic expressions or direct references within the template, eliminating the need for manual re-rendering.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
function Test() {
    this.status = false;

    const update = () => {
        this.status = ! this.status;
    }
    return render => render`<div>
        <p>${this.status && `<b>test</b>`||''}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
// Render the component
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Test() {
    this.status = false;

    const update = () => {
        this.status = ! this.status;
    }
    return render => render`<div>
        <p>${this.status && `<b>test</b>`||''}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
```

### Reactive State Objects

States are also reactive objects but operate independently of the this context. In a similar way, when bound to the template literal, changes to their value property are automatically tracked and seamlessly updated in the DOM, also without additional re-rendering calls.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { state } = lemonade;

function Test() {
    let status = state(false);

    const update = () => {
        status.value = ! status.value;
    }
    return render => render`<div>
        <p>${(status.value && `<b>test</b>`)||''}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
// Render the component
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
    let status = state(false);

    const update = () => {
        status.value = ! status.value;
    }
    return render => render`<div>
        <p>${(status.value && `<b>test</b>`)||''}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
```

## Reserved Context Properties

When a custom component is instantiated in LemonadeJS, certain properties within the `this`{.highlight} context are reserved for core functionalities:

| Property              | Description                                        |
|-----------------------|----------------------------------------------------|
| `el`{.highlight}      | Represents the root HTML element of the component. |
| `refresh`{.highlight} | A method to trigger a re-render of the component.  |


### Component Refresh

The `refresh`{.highlight} method in a component is designed to force updates to the DOM. It can be used to refresh specific properties, the entire view, or the entire component.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
// Component
function Test() {
    this.test = [1,2,3];

    const update = () => {
        this.test[2] = 30;
        // Will re-render the elements in the template that uses the property test. 
        // Can be useful when change array or objects that does not have an internal tracking
        this.refresh('test');
    }
    
    return render => render`<div>
        <p>${this.test}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
// Render the component
lemonade.render(Test, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Test() {
    this.test = [1,2,3];

    const update = () => {
        this.test[2] = 30;
        // Will re-render the elements in the template that uses the property test. 
        // Can be useful when change array or objects that does not have an internal tracking
        this.refresh('test');
    }

    return render => render`<div>
        <p>${this.test}</p>
        <input type="button" value="Toggle" onclick="${update}" />
    </div>`;
}
```

## Summary of this Chapter

Key points to remember:

- **Attributes Access**: Component attributes are accessible via this.
- **Reserved Properties**: parent, el, and refresh are reserved for core functionality.
- **Component Refresh**: This enables updating the component while preserving its state.
- **Declaration**: Components can be declared globally using setComponents.

## What's Next?

Learn more about props and how to pass arguments to a component.

[Learn more about props](/docs/props){.button}