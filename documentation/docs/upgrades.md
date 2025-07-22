title: Upgrading From Version 4 to 5
keywords: LemonadeJS, upgrades, version 5, advanced reactivity, states, events, upgrade guide
description: Learn about the updates in LemonadeJS version 5, including new features, enhancements, and key considerations for upgrading from version 4.
canonical: https://lemonadejs.com/docs/upgrades

# LemonadeJS Version 5

This section overviews the updates introduced in LemonadeJS version 5 and highlights key considerations for upgrading from previous versions, including adjustments and breaking changes.

## What is New with Version 5?

| Feature                         | Description                                                                                |
|---------------------------------|--------------------------------------------------------------------------------------------|
| **States**                      | Introduced private, reactive properties to manage component-level data efficiently.        |
| **Private Component Events**    | Events can now be encapsulated within components for improved modularity.                  |
| **JSX Support**                 | Added support for JSX syntax via the LemonadeJSX Babel Plugin.                             |
| **Children Component Argument** | A new `children` argument enables seamless referencing and management of child components. |
| **Enhanced Render System**      | Supports template literal interpolation for passing references directly within templates.  |

### JSX Support

While LemonadeJS works seamlessly with pure JavaScript, developers who prefer JSX can use the LemonadeJS JSX plugin for Webpack. **Requirement**: LemonadeJSX Babel Plugin.

#### Code in JavaScript

{.ignore}
```javascript
function Component() {
    this.title = 'Original title';
    
    return render => render`<div>
        <h1>${this.title}</h1>
    </div>`
}
```

#### Using LemonadeJSX

{.ignore}
```jsx
function Component() {
    this.title = 'Original title';
    
    return (<div>
        <h1>{this.title}</h1>
    </div>)
}
```

### Important Updates

Key upgrades in LemonadeJS enhance performance and flexibility. If upgrading from a previous version, be mindful of potential breaking changes, as outlined below.

## Templates

### Template Behavior

In LemonadeJS version 4, templates were passed to child components as raw strings. Starting with version 5, templates are rendered in the parent scope, and the child component receives an object containing references that are appended to the child’s root element during the render lifecycle.

### Parent Reference

In LemonadeJS version 5, the `self.parent` reference has been deprecated, except for children generated using the loop property. To enable communication between child components and other parts of your application, use Sugar.

#### Version 4 Example

This behavior is no longer valid.

{.ignore}
```javascript
function Action(template) {
    let self = this;
    return `<div>${template}</div>`; 
}

function Component() {
    let self = this;
    self.title = 'Original title';
    self.update = function() {
        // The version 4 template engine makes the HTML inside Action in a different scope
        self.parent.title = 'New title';
    }
    
    return `<div>
        <h1>{{self.title}}</h1>
        <Action>
            <input type="button" value="Update" onclick="self.update" />
        </Action>
    </div>`
}
```

#### Version 5 Example

In Version 5, the `self.parent`{.highlight} reference was removed from child components. The first component argument now receives a DOM representation of child elements to be added to the root during rendering.

{.ignore}
```javascript
function Action(children) {
    // JSON with all children and its attributes
    console.log(children);

    return `<div></div>`; 
}

function Component() {
    this.title = 'Original title';

    const update = () => {
        // All HTML in this function are in the same scope since HTML are created at the same time
        this.title = 'New title'
    }
    
    return render => render`<div>
        <h1>${this.title}</h1>
        <Action>
            <input type="button" value="Update" onclick="${update}" />
        </Action>
    </div>`
}
```

### Function Reference

In Version 4, functions passed as attribute references were executed, and their return values were assigned to the attribute. On the other hand, version 5 keeps the function reference and is no longer bound to the element attribute.

{.ignore}
```javascript
function Component() {
    this.update = () => {
        return 123;
    }
    
    this.onload = () => {
        // Version 4 returns 123 where version 5 return the reference to the function
        console.log(this.el.property);
    }
    
    return `<Action property="{{this.update}}" />`
}
```

### Render Method

With Version 5, developers should use the render method in the return statement to enable reference injection, state management, and advanced reactive capabilities.

{.ignore}
```javascript
function Component() {
    const click = () => {
        console.log(123)
    }
    return render=>render`<input type="button" onclick="${click}" />`
}
```

## Core Updates

### Method Updates

| Status                                        | Method                                                         | Description                                                                                                      |
|-----------------------------------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `New`{.info-label .nowrap .new}               | track(prop: string)                                            | Track a property even if that is not in the template.                                                            |
| `Deprecated`{.info-label .nowrap .deprecated} | element(template: string, self: object, components: object)    | This method should not be used. From version 5, the component should return a template or the render method      |
| `Updated`{.info-label .nowrap .updated}       | apply(element: HTMLElement, self: object, components: object)  | This method uses the element contents as a template for a standard render, using the element itself as the root  |

### Event Updates

Both onchange and onload can register methods using the onchange or onload hooks.

{.ignore}
```javascript
let { onload } = lemonade;

function Component() {
    onload(() => {
        console.log('the element is ready');
    })
    return render=>render`<input type="button" />`
}
```

#### More About Events

For more information on how LemonadeJS handles events, visit the following resources:

- [JavaScript Events](/docs/events)
- [Native Onchange](/docs/onchange)
- [Native Onload](/docs/onload)


## Next steps

[Introduction to LemonadeJS Version 5](/docs/intro){.button}