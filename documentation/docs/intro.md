title: LemonadeJS Overview
keywords: LemonadeJS, JavaScript library, reactive programming, two-way data binding, frontend development, micro-library, version 5, components
description: Explore an overview of LemonadeJS, including its components, reactivity, two-way data binding, and other core concepts.
canonical: https://lemonadejs.com/docs/intro

# Introduction

In LemonadeJS, component reactivity is driven by micro-events tied to properties and states referenced in the template. Only the corresponding DOM elements or text nodes are updated when a property or state changes, ensuring efficient rendering by avoiding full component re-renders.


## Reactivity

When a property changes, the DOM updates and invokes either the internal `this.onchange`{.highlight} method or the `onchange`{.highlight} hook, providing a way to respond to the change.

{.ignore}
```javascript
let { onchange } = lemonade;

function Component() {
    this.value = 1;

    onchange((prop) => {
        console.log(prop, 'has changed');
    })
    
    // Nested properties are not reactity
    return render => render`<div>
        <h1>${this.value}</h1>
        <input type="button" onclick="${()=>this.value++}" />
    </div>`;
}
```

### Nested Properties

LemonadeJS automatically creates `reactivity`{.highlight} for top-level properties. However, deeply nested objects are not inherently reactive, as shown in the example below:

{.ignore}
```javascript
function Component() {
    this.data = {
        value: 123,
    }

    // Nested properties are not reactity
    return render => render`<div>
        <h1>${this.data.value}</h1>
        <input type="button" onclick="${()=>this.data.value++}" />
    </div>`;
}
```

### Using refresh

To enforce reactivity for nested properties, use `refresh`{.highlight} to update all references  to `this.data` object:

{.ignore}
```javascript
function Component() {
    this.data = {
        value: 123,
    }
    const update = () => {
        this.data.value++;
        // Will force the refresh to all the nodes tha has references for test
        this.refresh();
    }

    // Title and year are declared in the parent template
    return render => render`<div>
        <h1>${this.data.value}</h1>
        <input type="button" onclick="${update}" />
    </div>`;
}
```

### States

A state in LemonadeJS is a private, reactive property designed to manage component-level data. Unlike public properties, states are internally scoped to the component, ensuring controlled reactivity and triggering precise DOM updates without being exposed externally. [Learn more about the State](/docs/state)

## What next?

For more about components and its properties:\
\
[More About Components](/docs/components){.button}


