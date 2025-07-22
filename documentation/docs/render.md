title: Conditional Rendering in LemonadeJS  
keywords: LemonadeJS, conditional rendering, object synchronization, reactive forms, JavaScript library, frontend development, render elements  
description: Conditionally control the rendering of DOM elements in your LemonadeJS components using reactive state or properties for dynamic, efficient UI updates.   
canonical: https://lemonadejs.com/docs/render

# Conditional Rendering in LemonadeJS

LemonadeJS supports conditional rendering through a special attribute: `:render` (or `lm-render`). This allows you to dynamically show or hide sections of the DOM based on boolean conditions, making your components reactive and clean.

## How It Works

You can use the `:render` (or `lm-render`) attribute on a container element. It expects a boolean value. If the value is:

- `true`: the content inside the container is rendered and added to the DOM.
- `false`: the content is removed, leaving only the container itself in the DOM.

This becomes powerful when used with reactive state or component properties to dynamically toggle visibility.

## Attribute Reference

| Attribute     | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `:render` / `lm-render` | Conditionally controls whether the content inside a container is rendered. |


## Examples

### Using Component Properties

This example toggles an input field based on a component’s internal property.

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id="root"></div>
<script>
function Component() {
  this.test = 'hidden';

  const toggle = () => {
    this.test = this.test === 'visible' ? 'hidden' : 'visible';
  }

  return render => render`<div>
    <div :render="${this.test === 'visible'}">
      <input type="text" />
    </div>
    <input type="button" value="Toggle Input" onclick="${toggle}" />
  </div>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
export default function Component() {
    this.test = 'hidden';

    const toggle = () => {
        this.test = this.test === 'visible' ? 'hidden' : 'visible';
    }

    return render => render`<div>
        <div :render="${this.test === 'visible'}">
          <input type="text" />
        </div>
        <input type="button" value="Toggle Input" onclick="${toggle}" />
      </div>`;
    }
```

### Using Reactive `state`

Here’s a version using LemonadeJS’s `state()` to create a reactive in the private context of the component.

#### HTML Script Version

```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id="root"></div>
<script>
const { state } = lemonade;

function Component() {
  let data = state(false);

  const toggle = () => {
    data.value = !data.value;
  }

  return render => render`<div>
    <div :render="${data}">
      <input type="text" />
    </div>
    <input type="button" value="Toggle Input" onclick="${toggle}" />
  </div>`;
}

lemonade.render(Component, document.getElementById('root'));
</script>
</html>
```
```javascript
import { state } from 'lemonadejs';

export default function Test() {
  let data = state(false);

  const toggle = () => {
    data.value = !data.value;
  }

  return render => render`<div>
    <div :render="${data}">
      <input type="text" />
    </div>
    <input type="button" value="Toggle Input" onclick="${toggle}" />
  </div>`;
}
```

## What’s Next?

Explore how LemonadeJS simplifies working with forms using reactive data bindings and dynamic field generation.

[Explore Dynamic Forms](/docs/forms){.button}
